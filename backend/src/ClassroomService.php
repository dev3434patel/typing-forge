<?php
declare(strict_types=1);
namespace SparowType;

use PDO;
use PDOException;

/** Classroom capabilities never become general account authentication. */
final class ClassroomService
{
    private const PASSAGE = 'A clear goal makes practice useful. Keep your hands relaxed, read the next word, and give each letter careful attention. Small steady steps build a skill you can return to every day.';
    public function __construct(private PDO $db, private SessionValidator $validator) {}

    private function ready(): void
    {
        try { foreach (['classroom_classes', 'classroom_members', 'classroom_assignments', 'classroom_receipts'] as $table) $this->db->query('SELECT 1 FROM '.$table.' LIMIT 0'); }
        catch (PDOException $error) {
            if ((int)($error->errorInfo[1] ?? 0) === 1146) throw new ApiException(503, 'classroom-migration', 'Classroom storage is not installed. Import backend/migrations/003_classroom.sql into this configured database.');
            throw $error;
        }
    }
    private function transaction(callable $operation): mixed
    {
        $owns = !$this->db->inTransaction();
        if ($owns) $this->db->beginTransaction();
        try { $value = $operation(); if ($owns) $this->db->commit(); return $value; }
        catch (\Throwable $error) { if ($owns && $this->db->inTransaction()) $this->db->rollBack(); throw $error; }
    }
    private function teacherLock(string $id): void
    {
        $query = $this->db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE'); $query->execute([$id]);
        if (!$query->fetch()) throw new ApiException(401, 'auth-required', 'Sign in again before managing classrooms.');
    }
    private function memberLock(string $memberId, string $classId): void
    {
        // Serialize receipt caps and pending assignment issuance on one stable row.
        $query = $this->db->prepare('SELECT id FROM classroom_members WHERE id=? AND class_id=? FOR UPDATE');
        $query->execute([$memberId, $classId]);
        if (!$query->fetch()) throw new ApiException(409, 'classroom-membership', 'This classroom membership is no longer available.');
    }
    public static function alias(string $alias): string
    {
        $alias = trim(\Normalizer::normalize($alias, \Normalizer::FORM_C) ?: '');
        if (!preg_match('/^[\p{L}\p{N}][\p{L}\p{M}\p{N} _.-]{1,31}$/u', $alias)) throw new ApiException(422, 'classroom-alias', 'Use a 2–32 character alias with letters, numbers, spaces, dots or hyphens. Do not enter an email address.');
        return $alias;
    }
    public function list(array $user): array
    {
        $this->ready();
        $query = $this->db->prepare('SELECT id,title,created_at FROM classroom_classes WHERE owner_id=? ORDER BY created_at DESC LIMIT 20'); $query->execute([$user['id']]);
        $classes = [];
        foreach ($query->fetchAll() as $class) {
            $members = $this->db->prepare('SELECT m.id,m.alias,COUNT(r.session_id) sessions,COALESCE(SUM(r.elapsed_ms),0) active_ms,COALESCE(SUM(r.insertion_attempts),0) insertion_attempts,COALESCE(SUM(r.correct_attempts),0) correct_attempts,COALESCE(MAX(r.wpm),0) best_wpm FROM classroom_members m LEFT JOIN classroom_receipts r ON r.member_id=m.id WHERE m.class_id=? GROUP BY m.id,m.alias ORDER BY m.alias LIMIT 100'); $members->execute([$class['id']]);
            $classes[] = ['id' => $class['id'], 'title' => $class['title'], 'createdAt' => Database::iso($class['created_at']), 'members' => array_map(static fn(array $member) => ['id' => $member['id'], 'alias' => $member['alias'], 'sessions' => (int)$member['sessions'], 'activeMs' => (float)$member['active_ms'], 'insertionAttempts' => (int)$member['insertion_attempts'], 'correctAttempts' => (int)$member['correct_attempts'], 'bestWpm' => (float)$member['best_wpm'], 'verification' => 'replay-checked-not-human-verified'], $members->fetchAll())];
        }
        return ['ownerId' => $user['id'], 'classes' => $classes];
    }
    public function create(array $body, array $user): array
    {
        $this->ready(); Security::owner($body, $user['id']);
        $title = trim(is_string($body['title'] ?? null) ? $body['title'] : '');
        if (mb_strlen($title) < 2 || mb_strlen($title) > 80 || preg_match('/[<>\x00-\x1f]/u', $title)) throw new ApiException(422, 'classroom-title', 'Use a classroom title of 2–80 characters without markup or control characters.');
        return $this->transaction(function () use ($title, $user): array {
            $this->teacherLock($user['id']);
            $count = $this->db->prepare('SELECT COUNT(*) FROM classroom_classes WHERE owner_id=?'); $count->execute([$user['id']]);
            if ((int)$count->fetchColumn() >= 20) throw new ApiException(409, 'classroom-limit', 'Remove an unused classroom before creating another. The limit is 20.');
            $id = Database::uuid(); $code = strtoupper(bin2hex(random_bytes(16))); $salt = bin2hex(random_bytes(16));
            $query = $this->db->prepare('INSERT INTO classroom_classes(id,owner_id,title,code_lookup,code_salt,code_hash) VALUES(?,?,?,?,?,?)');
            $query->execute([$id, $user['id'], $title, hash('sha256', $code), $salt, hash('sha256', $salt.':'.$code)]);
            return ['ownerId' => $user['id'], 'class' => ['id' => $id, 'title' => $title, 'members' => [], 'createdAt' => gmdate('c')], 'privateCode' => implode('-', str_split($code, 4)), 'message' => 'Save this private code now. It is not returned in classroom lists.'];
        });
    }
    public function remove(array $body, array $user): array
    {
        $this->ready(); Security::owner($body, $user['id']);
        return $this->transaction(function () use ($body, $user): array {
            $this->teacherLock($user['id']);
            $query = $this->db->prepare('DELETE FROM classroom_classes WHERE id=? AND owner_id=?'); $query->execute([$body['classId'] ?? '', $user['id']]);
            return ['ownerId' => $user['id'], 'deleted' => $query->rowCount() === 1];
        });
    }
    private function assignment(string $memberId, string $classId): array
    {
        $this->memberLock($memberId, $classId);
        $pending = $this->db->prepare('SELECT a.id FROM classroom_assignments a LEFT JOIN classroom_receipts r ON r.session_id=a.id WHERE a.member_id=? AND r.session_id IS NULL AND a.created_at>UTC_TIMESTAMP()-INTERVAL 1 DAY ORDER BY a.created_at DESC LIMIT 1'); $pending->execute([$memberId]);
        $id = $pending->fetchColumn();
        if (!$id) { $id = Database::uuid(); $insert = $this->db->prepare('INSERT INTO classroom_assignments(id,member_id) VALUES(?,?)'); $insert->execute([$id, $memberId]); }
        return self::configuration((string)$id, $memberId, $classId);
    }
    public static function configuration(string $sessionId, string $memberId, string $classId): array
    {
        return ['clientSessionId' => $sessionId, 'ownerScope' => $memberId, 'mode' => 'custom', 'initialTarget' => self::PASSAGE, 'scoringPolicy' => 'prose', 'correctionPolicy' => 'correct-words-locked', 'language' => 'en', 'script' => 'Latin', 'keyboardLayout' => 'qwerty', 'inputMethod' => 'keyboard', 'contentRevision' => 'classroom-original-v1', 'generatorVersion' => 'classroom-fixed-v1', 'seed' => 'classroom-original-v1', 'privacy' => 'public-corpus', 'punctuation' => true, 'numbers' => false, 'settings' => ['review' => true, 'classroom' => ['version' => 1, 'classId' => $classId, 'memberId' => $memberId, 'assignmentId' => $sessionId]]];
    }
    public function join(array $body): array
    {
        $this->ready();
        $code = strtoupper(str_replace('-', '', trim(is_string($body['code'] ?? null) ? $body['code'] : '')));
        if (!preg_match('/^[A-F0-9]{32}$/', $code)) throw new ApiException(422, 'classroom-code', 'Enter the full private classroom code.');
        $alias = self::alias(is_string($body['alias'] ?? null) ? $body['alias'] : '');
        $value = $this->transaction(function () use ($code, $alias): array {
            $query = $this->db->prepare('SELECT id,title,code_salt,code_hash FROM classroom_classes WHERE code_lookup=? FOR UPDATE'); $query->execute([hash('sha256', $code)]); $class = $query->fetch();
            if (!$class || !hash_equals($class['code_hash'], hash('sha256', $class['code_salt'].':'.$code))) throw new ApiException(404, 'classroom-unavailable', 'This classroom code is unavailable. Ask the teacher to check it.');
            $capability = $_SESSION['classroom_student'] ?? null;
            if (is_array($capability) && (($capability['classId'] ?? null) !== $class['id'] || ($capability['alias'] ?? null) !== $alias)) {
                $old = $this->db->prepare('SELECT id FROM classroom_members WHERE id=? AND class_id=?'); $old->execute([$capability['memberId'] ?? '', $capability['classId'] ?? '']);
                if ($old->fetch()) throw new ApiException(409, 'classroom-already-joined', 'Leave your current classroom before joining with a different alias or code.');
            }
            if (is_array($capability) && ($capability['classId'] ?? null) === $class['id'] && ($capability['alias'] ?? null) === $alias) {
                $existing = $this->db->prepare('SELECT id FROM classroom_members WHERE id=? AND class_id=?'); $existing->execute([$capability['memberId'], $class['id']]);
                if ($existing->fetch()) return ['classId' => $class['id'], 'classTitle' => $class['title'], 'memberId' => $capability['memberId'], 'alias' => $alias, 'configuration' => $this->assignment($capability['memberId'], $class['id'])];
            }
            $count = $this->db->prepare('SELECT COUNT(*) FROM classroom_members WHERE class_id=?'); $count->execute([$class['id']]);
            if ((int)$count->fetchColumn() >= 100) throw new ApiException(409, 'classroom-full', 'This classroom has reached its 100-alias limit.');
            $id = Database::uuid();
            try { $insert = $this->db->prepare('INSERT INTO classroom_members(id,class_id,alias) VALUES(?,?,?)'); $insert->execute([$id, $class['id'], $alias]); }
            catch (PDOException $error) { if ($error->getCode() === '23000') throw new ApiException(409, 'classroom-alias-used', 'Choose a different classroom alias.'); throw $error; }
            return ['classId' => $class['id'], 'classTitle' => $class['title'], 'memberId' => $id, 'alias' => $alias, 'configuration' => $this->assignment($id, $class['id'])];
        });
        $_SESSION['classroom_student'] = ['classId' => $value['classId'], 'memberId' => $value['memberId'], 'alias' => $value['alias']];
        return ['student' => $value, 'privacy' => 'The teacher sees your alias and aggregate practice statistics, never your typed text.'];
    }
    public function progress(array $body): array
    {
        $this->ready(); $capability = $_SESSION['classroom_student'] ?? null;
        if (!is_array($capability)) throw new ApiException(401, 'classroom-student-required', 'Join a classroom before sharing practice.');
        if (($body['shareConsent'] ?? null) !== true) throw new ApiException(422, 'classroom-share-consent', 'Choose Share aggregate result to permit this one replay check. Raw input is not retained in classroom storage.');
        $candidate = $body['candidate'] ?? null;
        if (!is_array($candidate)) throw new ApiException(422, 'classroom-result', 'Submit a complete canonical practice result.');
        self::assertIssuedContract($candidate, $capability['memberId'], $capability['classId']);
        // The explicit share action grants processing consent; only numeric facts
        // and the canonical hash below are stored, never the submitted raw log.
        $validated = $this->validator->validate($candidate, $capability['memberId'], true);
        return $this->transaction(function () use ($validated, $capability): array {
            $this->memberLock($capability['memberId'], $capability['classId']);
            $query = $this->db->prepare('SELECT a.id FROM classroom_assignments a JOIN classroom_members m ON m.id=a.member_id WHERE a.id=? AND m.id=? AND m.class_id=? FOR UPDATE'); $query->execute([$validated['candidate']['clientSessionId'], $capability['memberId'], $capability['classId']]);
            if (!$query->fetch()) throw new ApiException(409, 'classroom-assignment', 'This classroom assignment is no longer available.');
            $receipt = $this->db->prepare('SELECT payload_hash FROM classroom_receipts WHERE session_id=?'); $receipt->execute([$validated['candidate']['clientSessionId']]); $old = $receipt->fetchColumn();
            if ($old && !hash_equals($old, $validated['payloadHash'])) throw new ApiException(409, 'classroom-evidence-conflict', 'This practice ID already has different immutable evidence.');
            if (!$old) {
                $count = $this->db->prepare('SELECT COUNT(*) FROM classroom_receipts WHERE member_id=?'); $count->execute([$capability['memberId']]);
                if ((int)$count->fetchColumn() >= 1000) throw new ApiException(409, 'classroom-receipt-limit', 'This alias has reached its 1,000-session classroom limit. Ask the teacher to start a new class period.');
                $m = $validated['metrics']; $insert = $this->db->prepare('INSERT INTO classroom_receipts(session_id,member_id,payload_hash,elapsed_ms,insertion_attempts,correct_attempts,correct_characters,wpm) VALUES(?,?,?,?,?,?,?,?)'); $insert->execute([$validated['candidate']['clientSessionId'], $capability['memberId'], $validated['payloadHash'], $m['elapsedMs'], $m['insertionAttempts'], $m['correctAttempts'], $m['correct'], $m['wpm']]);
            }
            return ['accepted' => true, 'duplicate' => (bool)$old, 'verification' => 'replay-checked-not-human-verified', 'configuration' => $this->assignment($capability['memberId'], $capability['classId'])];
        });
    }
    public static function assertIssuedContract(array $candidate, string $memberId, string $classId): void
    {
        if (!is_string($candidate['clientSessionId'] ?? null) || !is_array($candidate['configuration'] ?? null) || !is_array($candidate['events'] ?? null) || !is_array($candidate['pauseIntervals'] ?? null)) throw new ApiException(422, 'classroom-result', 'Submit a complete canonical practice result.');
        $expected = self::configuration($candidate['clientSessionId'], $memberId, $classId);
        // These are actual canonical input dimensions, not editable assignment text.
        $expected['paused'] = count($candidate['pauseIntervals'] ?? []) > 0;
        $method = $candidate['configuration']['inputMethod'] ?? 'keyboard';
        if (in_array($method, ['keyboard', 'composition', 'virtual'], true)) $expected['inputMethod'] = $method;
        if (SessionValidator::stablePayload($expected) !== SessionValidator::stablePayload($candidate['configuration'] ?? null)) throw new ApiException(422, 'classroom-contract', 'This result does not match the classroom practice contract.');
        if (($candidate['finishReason'] ?? null) !== 'completed' || ($candidate['elapsedMs'] ?? 0) > 600000 || count($candidate['events'] ?? []) > 10000) throw new ApiException(422, 'classroom-completion', 'Complete the issued practice within ten active minutes and the evidence limit.');
    }
    public function leave(): array
    {
        $this->ready(); $capability = $_SESSION['classroom_student'] ?? null;
        if (is_array($capability)) { $query = $this->db->prepare('DELETE FROM classroom_members WHERE id=? AND class_id=?'); $query->execute([$capability['memberId'], $capability['classId']]); }
        unset($_SESSION['classroom_student']);
        return ['left' => true, 'deletedClassroomReports' => true];
    }
}
