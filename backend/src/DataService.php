<?php
declare(strict_types=1);
namespace SparowType;

use PDO;
use PDOException;

final class DataService
{
    public function __construct(private PDO $db, private SessionValidator $validator, private array $config) {}

    public function profile(array $user): array
    {
        return ['id' => $user['id'], 'handle' => $user['handle']];
    }

    public function updateProfile(array $user, array $body): array
    {
        Security::owner($body, $user['id']);
        $handle = $body['handle'] ?? null;
        if (!is_string($handle) || !preg_match('/^[a-z][a-z0-9_]{2,23}$/D', $handle)) {
            throw new ApiException(422, 'handle', 'Use 3–24 lowercase letters, numbers or underscores, starting with a letter.');
        }
        try {
            $statement = $this->db->prepare('UPDATE users SET handle=? WHERE id=?');
            $statement->execute([$handle, $user['id']]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') throw new ApiException(409, 'handle-taken', 'This public handle is already taken.');
            throw $error;
        }
        return ['id' => $user['id'], 'handle' => $handle];
    }

    public function preferences(array $user): array
    {
        $statement = $this->db->prepare('SELECT preferences_json,version FROM user_preferences WHERE user_id=?');
        $statement->execute([$user['id']]);
        $row = $statement->fetch();
        return ['ownerId' => $user['id'], 'preferences' => $row ? Database::decode($row['preferences_json']) : new \stdClass(), 'version' => $row ? (int) $row['version'] : 0];
    }

    public function updatePreferences(array $user, array $body): array
    {
        Security::owner($body, $user['id']);
        $version = $body['expectedVersion'] ?? null;
        if (!is_int($version) || $version < 0) throw new ApiException(422, 'version', 'A nonnegative preference version is required.');
        $patch = $this->preferencePatch($body['patch'] ?? null);
        $this->db->beginTransaction();
        try {
            $this->lockOwner($user['id']);
            $current = $this->preferences($user);
            if ($current['version'] !== $version) {
                $this->db->commit();
                return $current + ['conflict' => true];
            }
            $values = array_replace((array) $current['preferences'], $patch);
            $statement = $this->db->prepare('INSERT INTO user_preferences(user_id,preferences_json,version) VALUES(?,?,1) ON DUPLICATE KEY UPDATE preferences_json=VALUES(preferences_json),version=version+1,updated_at=CURRENT_TIMESTAMP(3)');
            $statement->execute([$user['id'], Database::json($values ?: new \stdClass())]);
            $this->db->commit();
            return ['ownerId' => $user['id'], 'preferences' => $values ?: new \stdClass(), 'version' => $version + 1, 'conflict' => false];
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }

    public function version(array $user): array
    {
        $statement = $this->db->prepare('SELECT data_version FROM users WHERE id=?');
        $statement->execute([$user['id']]);
        $value = $statement->fetchColumn();
        if ($value === false) throw new ApiException(401, 'auth-required', 'This account is no longer available.');
        return ['ownerId' => $user['id'], 'version' => (int) $value];
    }

    public function history(array $user, array $query): array
    {
        $limit = $this->integer($query['limit'] ?? 500, 1, 500, 'limit');
        $offset = $this->integer($query['offset'] ?? 0, 0, 1000000, 'offset');
        $this->expireOwnerEvidence($user['id']);
        // The same read transaction binds pages to their reported data version;
        // the client also checks the final version before reconciling deletions.
        $this->db->beginTransaction();
        try {
            $version = $this->version($user);
            $statement = $this->db->prepare('SELECT * FROM typing_sessions WHERE user_id=? ORDER BY created_at DESC,id ASC LIMIT ? OFFSET ?');
            $statement->bindValue(1, $user['id']);
            $statement->bindValue(2, $limit + 1, PDO::PARAM_INT);
            $statement->bindValue(3, $offset, PDO::PARAM_INT);
            $statement->execute();
            $rows = $statement->fetchAll();
            $hasMore = count($rows) > $limit;
            $rows = array_slice($rows, 0, $limit);
            $sessions = [];
            $learning = [];
            foreach ($rows as $row) {
                $accepted = Database::decode($row['accepted_json']);
                $metrics = $accepted['metrics'];
                $finishedAt = isset($accepted['finishedAtWall']) && is_numeric($accepted['finishedAtWall']) ? (float) $accepted['finishedAtWall'] : strtotime($row['finished_at'].' UTC') * 1000;
                $summary = [
                    'id' => $row['client_session_id'], 'wpm' => $metrics['wpm'] ?? 0,
                    'rawWpm' => $metrics['rawWpm'] ?? 0, 'accuracy' => $metrics['inputAccuracy'] ?? 0,
                    'consistency' => $metrics['consistency'] ?? 0, 'mode' => $row['mode'],
                    'duration' => (float) $row['elapsed_ms'] / 1000,
                    'correctChars' => $metrics['correct'] ?? 0, 'incorrectChars' => $metrics['incorrect'] ?? 0,
                    'totalChars' => $metrics['retainedUnits'] ?? 0, 'errors' => $metrics['incorrectAttempts'] ?? 0,
                    'date' => Database::iso(Database::timestamp($finishedAt)),
                    'wpmHistory' => array_map(static fn(array $point): float|int => $point['wpm'] ?? 0, $accepted['timeSeries'] ?? []),
                ];
                $sessions[] = [
                    'clientSessionId' => $row['client_session_id'], 'accepted' => $accepted, 'summary' => $summary,
                    'createdAt' => $finishedAt, 'payloadHash' => $row['payload_hash'],
                    'comparisonKey' => $row['comparison_key'], 'metrics' => $metrics,
                    'personalBestEligible' => (bool) $row['personal_best_eligible'], 'metricsVersion' => 'forge-v3',
                ];
                if ($row['learning_json'] !== null) $learning[] = Database::decode($row['learning_json']);
            }
            $this->db->commit();
            return $version + ['sessions' => $sessions, 'learningEvidence' => $learning, 'hasMore' => $hasMore];
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }

    public function submit(array $user, array $body): array
    {
        Security::owner($body, $user['id'], false);
        $candidate = $body['candidate'] ?? null;
        if (!is_array($candidate)) throw new ApiException(422, 'candidate', 'A session candidate is required.');
        $configuration = $candidate['configuration'] ?? null;
        if (!is_array($configuration)) throw new ApiException(422, 'candidate-configuration', 'A session configuration is required.');
        $settings = is_array($configuration['settings'] ?? null) ? $configuration['settings'] : [];
        $challengeId = $configuration['challengeId'] ?? null;
        if ($challengeId !== null && !is_string($challengeId)) throw new ApiException(422, 'challenge-id', 'A challenge identifier must be text.');
        $localBot = ($settings['localBot'] ?? false) === true && is_string($challengeId) && str_starts_with($challengeId, 'local-bot:');
        if (($configuration['mode'] ?? null) === 'race' && !$localBot) throw new ApiException(422, 'race-endpoint', 'Human race evidence must be submitted through its room.');
        if ($challengeId && !$localBot) CompetitiveInputPolicy::preflight($candidate);
        $validated = $this->validator->validate($candidate, $user['id'], ($body['cloudConsent'] ?? false) === true);
        return ['accepted' => $this->commitValidated($user, $candidate, $validated)];
    }

    /** Reused inside the race transaction; its caller owns any existing transaction. */
    public function commitValidated(array $user, array $candidate, array $validated, array $overrides = []): array
    {
        $ownsTransaction = !$this->db->inTransaction();
        if ($ownsTransaction) $this->db->beginTransaction();
        try {
            $this->lockOwner($user['id']);
            $clientId = $candidate['clientSessionId'];
            if ($candidate['finishedAtWall'] < -30610224000000 || $candidate['finishedAtWall'] > 253402300799999) throw new ApiException(422, 'wall-date', 'The session date is outside the supported database range.');
            $hash = $validated['payloadHash'] ?? 'sha256:'.hash('sha256', SessionValidator::stablePayload($candidate));
            $receipt = $this->db->prepare('SELECT payload_hash,accepted_json,deleted_at FROM submission_receipts WHERE user_id=? AND client_session_id=? FOR UPDATE');
            $receipt->execute([$user['id'], $clientId]);
            $existing = $receipt->fetch();
            if ($existing) {
                if ($existing['deleted_at'] !== null) throw new ApiException(409, 'session-deleted', 'This session was deleted and cannot be uploaded again.');
                if (!hash_equals($existing['payload_hash'], $hash)) throw new ApiException(409, 'idempotency-conflict', 'This session ID belongs to different immutable evidence.');
                $accepted = Database::decode($existing['accepted_json']);
                if ($ownsTransaction) $this->db->commit();
                return $accepted;
            }
            $ranked = false;
            $reasons = ['personal-first-input-timing'];
            $config = $candidate['configuration'];
            $challengeId = $config['challengeId'] ?? null;
            $localBot = ($config['settings']['localBot'] ?? false) === true && is_string($challengeId) && str_starts_with($challengeId, 'local-bot:');
            if ($localBot) $reasons[] = 'labelled-local-bot';
            if ($challengeId && !$localBot && !isset($overrides['raceId'])) {
                $this->redeemChallenge($user['id'], $candidate, (string) $challengeId, $validated['metrics']);
                $ranked = true;
                $reasons = [];
            }
            if (!$ranked) {
                if ($candidate['pauseIntervals']) $reasons[] = 'paused';
                foreach ($candidate['events'] as $event) if ($event['provenance'] !== 'keyboard') { $reasons[] = 'assisted-or-composition-input'; break; }
            }
            $learning = in_array($config['mode'], ['learn', 'learning'], true) && ($config['privacy'] ?? null) !== 'private-custom' ? ($validated['learningEvidence'] ?? null) : null;
            $accepted = array_replace([
                'schemaVersion' => 3, 'metricsVersion' => 'forge-v3', 'clientSessionId' => $clientId,
                'payloadHash' => $hash, 'mode' => $config['mode'], 'comparisonKey' => $validated['comparisonKey'],
                'elapsedMs' => $candidate['elapsedMs'], 'metrics' => $validated['metrics'], 'timeSeries' => $validated['timeSeries'],
                'personalBestEligible' => $validated['personalBestEligible'], 'finishedAtWall' => $candidate['finishedAtWall'],
                'eligibility' => ['eligible' => $ranked, 'reasons' => $reasons, 'verification' => 'php-replayed', 'automationRisk' => 'Browser transcripts cannot prove human input.'],
                'challengeId' => $challengeId, 'learningEvidence' => $learning, 'acceptedAt' => Database::iso(Database::timestamp()),
                ...(isset($validated['course']) ? ['course' => $validated['course']] : []),
            ], $overrides);
            // The server owns these identities even for a caller-supplied race summary.
            $accepted['payloadHash'] = $hash;
            $accepted['clientSessionId'] = $clientId;
            $metrics = $accepted['metrics'];
            $ranked = ($accepted['eligibility']['eligible'] ?? false) === true;
            $id = Database::uuid();
            $statement = $this->db->prepare('INSERT INTO typing_sessions(id,user_id,client_session_id,payload_hash,accepted_json,evidence_json,evidence_expires_at,learning_json,key_summaries_json,comparison_key,comparison_hash,mode,elapsed_ms,wpm,input_accuracy,ranked,personal_best_eligible,race_id,finished_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $statement->execute([
                $id, $user['id'], $clientId, $hash, Database::json($accepted), Database::json($candidate),
                Database::timestamp((microtime(true) + (int) $this->config['evidence_retention_days'] * 86400) * 1000),
                $learning === null ? null : Database::json($learning), Database::json($validated['keySummaries'] ?? []),
                $validated['comparisonKey'], hash('sha256', $validated['comparisonKey']), $config['mode'], $accepted['elapsedMs'],
                $metrics['wpm'], $metrics['inputAccuracy'], (int) $ranked, (int) $accepted['personalBestEligible'],
                $accepted['raceId'] ?? null, Database::timestamp((float) $accepted['finishedAtWall']),
            ]);
            $receiptInsert = $this->db->prepare('INSERT INTO submission_receipts(user_id,client_session_id,payload_hash,accepted_json) VALUES(?,?,?,?)');
            $receiptInsert->execute([$user['id'], $clientId, $hash, Database::json($accepted)]);
            $this->bumpVersion($user['id']);
            if ($ownsTransaction) $this->db->commit();
            return $accepted;
        } catch (\Throwable $error) {
            if ($ownsTransaction && $this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }

    public function deleteSession(array $user, string $clientId, array $body): array
    {
        Security::owner($body, $user['id']);
        if (!preg_match('/^[A-Za-z0-9:_-]{1,128}$/D', $clientId)) throw new ApiException(422, 'session-id', 'Invalid client session ID.');
        $this->db->beginTransaction();
        try {
            $this->lockOwner($user['id']);
            $receipt = $this->db->prepare('INSERT INTO submission_receipts(user_id,client_session_id,payload_hash,deleted_at) VALUES(?,?,\'deleted\',CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE accepted_json=NULL,deleted_at=CURRENT_TIMESTAMP(3)');
            $receipt->execute([$user['id'], $clientId]);
            $remove = $this->db->prepare('DELETE FROM typing_sessions WHERE user_id=? AND client_session_id=?');
            $remove->execute([$user['id'], $clientId]);
            $raceEvidence = $this->db->prepare('UPDATE race_outcomes SET transcript_events=NULL WHERE user_id=? AND client_session_id=?');
            $raceEvidence->execute([$user['id'], $clientId]);
            $this->bumpVersion($user['id']);
            $this->db->commit();
            return ['deleted' => true];
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }

    public function deleteAccount(array $user, array $body): array
    {
        Security::owner($body, $user['id']);
        if (($body['confirmation'] ?? '') !== 'DELETE MY ACCOUNT') throw new ApiException(422, 'confirmation', 'Explicit account deletion confirmation is required.');
        $this->db->beginTransaction();
        try {
            $this->lockOwner($user['id']);
            // Preserve the other participant's room record while removing the
            // deleted participant and any winner reference. Owned rooms cascade.
            $rooms = $this->db->prepare("UPDATE race_sessions SET status=CASE WHEN status IN('waiting','countdown','active') THEN 'cancelled' ELSE status END,ended_at=COALESCE(ended_at,CURRENT_TIMESTAMP(3)),version=version+1 WHERE opponent_id=?");
            $rooms->execute([$user['id']]);
            $statement = $this->db->prepare('DELETE FROM users WHERE id=?');
            $statement->execute([$user['id']]);
            $this->db->commit();
            return ['deleted' => true];
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }

    public function cohorts(): array
    {
        $rows = $this->db->query('SELECT MIN(comparison_key) comparison_key,COUNT(DISTINCT user_id) participants FROM typing_sessions WHERE ranked=1 GROUP BY comparison_hash ORDER BY participants DESC,comparison_hash')->fetchAll();
        return ['cohorts' => array_map(static fn(array $row): array => ['comparison_key' => $row['comparison_key'], 'participants' => (int) $row['participants']], $rows)];
    }

    public function leaderboards(?array $user, array $query): array
    {
        $key = $query['comparisonKey'] ?? '';
        if (!is_string($key) || strlen($key) > 16384) throw new ApiException(422, 'comparison', 'Choose a valid comparison.');
        $period = $query['period'] ?? 'alltime';
        if (!in_array($period, ['alltime', 'day', 'week'], true)) throw new ApiException(422, 'period', 'Choose alltime, day or week rankings.');
        $limit = $this->integer($query['limit'] ?? 25, 1, 100, 'limit');
        $offset = $this->integer($query['offset'] ?? 0, 0, 1000000, 'offset');
        if ($key === '') return ['entries' => [], 'total' => 0];
        $where = 's.ranked=1 AND s.comparison_hash=? AND BINARY s.comparison_key=BINARY ?';
        $params = [hash('sha256', $key), $key];
        if ($period !== 'alltime') {
            $start = $period === 'day' ? gmdate('Y-m-d').' 00:00:00.000' : gmdate('Y-m-d', strtotime('monday this week UTC')).' 00:00:00.000';
            $where .= ' AND s.created_at>=?';
            $params[] = $start;
        }
        $sql = 'WITH scores AS (SELECT s.user_id,u.handle,MAX(s.wpm) best_wpm,AVG(s.input_accuracy) avg_accuracy,COUNT(*) test_count FROM typing_sessions s JOIN users u ON u.id=s.user_id WHERE '.$where.' GROUP BY s.user_id,u.handle), ranked AS (SELECT RANK() OVER(ORDER BY best_wpm DESC,avg_accuracy DESC) position,scores.*,COUNT(*) OVER() total_entries FROM scores) SELECT * FROM ranked ORDER BY best_wpm DESC,avg_accuracy DESC,handle ASC,user_id ASC LIMIT ? OFFSET ?';
        $statement = $this->db->prepare($sql);
        foreach ($params as $index => $parameter) $statement->bindValue($index + 1, $parameter);
        $statement->bindValue(count($params) + 1, $limit, PDO::PARAM_INT);
        $statement->bindValue(count($params) + 2, $offset, PDO::PARAM_INT);
        $statement->execute();
        $rows = $statement->fetchAll();
        $entries = array_map(static fn(array $row): array => [
            'position' => (int) $row['position'], 'user_id' => $row['user_id'], 'handle' => $row['handle'],
            'best_wpm' => (float) $row['best_wpm'], 'avg_accuracy' => (float) $row['avg_accuracy'],
            'test_count' => (int) $row['test_count'], 'total_entries' => (int) $row['total_entries'],
            'is_own' => $row['user_id'] === ($user['id'] ?? null),
        ], $rows);
        $total = $rows ? (int) $rows[0]['total_entries'] : 0;
        if (!$rows && $offset > 0) {
            $count = $this->db->prepare('SELECT COUNT(DISTINCT s.user_id) FROM typing_sessions s WHERE '.$where);
            $count->execute($params);
            $total = (int) $count->fetchColumn();
        }
        return ['entries' => $entries, 'total' => $total];
    }

    private function redeemChallenge(string $owner, array $candidate, string $challengeId, array $metrics): void
    {
        $statement = $this->db->prepare('SELECT * FROM typing_challenges WHERE id=? AND user_id=? FOR UPDATE');
        $statement->execute([$challengeId, $owner]);
        $challenge = $statement->fetch();
        if (!$challenge) throw new ApiException(403, 'challenge', 'This account does not own the challenge.');
        $config = $candidate['configuration'];
        $issued = Database::decode($challenge['configuration']);
        $allowed = array_merge(array_keys($issued), ['clientSessionId','ownerScope','initialTarget','challengeId','privacy','paused']);
        foreach ($config as $field => $_value) {
            if (!in_array($field, $allowed, true)) throw new ApiException(422, 'challenge-configuration', 'The challenge configuration contains an unsupported comparison dimension.');
        }
        foreach ($issued as $field => $value) {
            if (!array_key_exists($field, $config) || $config[$field] !== $value) throw new ApiException(422, 'challenge-configuration', 'Use the exact server-issued challenge configuration.');
        }
        if (($config['privacy'] ?? null) !== 'public-corpus' || ($config['correctionPolicy'] ?? null) !== 'current-word' || ($config['paused'] ?? false) !== false) throw new ApiException(422, 'challenge-configuration', 'Ranked challenges require the public corpus and current-word correction policy.');
        $start = (new \DateTimeImmutable($challenge['starts_at'], new \DateTimeZone('UTC')))->format('U.u') * 1000;
        $now = (float) $this->db->query('SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000')->fetchColumn();
        $deadline = (new \DateTimeImmutable($challenge['deadline_at'], new \DateTimeZone('UTC')))->format('U.u') * 1000;
        $expires = (new \DateTimeImmutable($challenge['expires_at'], new \DateTimeZone('UTC')))->format('U.u') * 1000;
        $keyboardOnly = true;
        foreach ($candidate['events'] as $event) if ($event['provenance'] !== 'keyboard') { $keyboardOnly = false; break; }
        if ($challenge['consumed_by'] !== null || $now < $deadline || $now > $expires || $candidate['targetText'] !== $challenge['target_text'] || $candidate['issuedTargetSegments'] || $candidate['pauseIntervals'] || !$keyboardOnly || $config['mode'] !== 'time' || ($config['scoringPolicy'] ?? 'prose') !== 'prose' || ($config['durationMs'] ?? null) !== $issued['durationMs'] || $candidate['elapsedMs'] !== $issued['durationMs'] || ($config['contentRevision'] ?? null) !== $issued['contentRevision'] || ($config['keyboardLayout'] ?? null) !== 'qwerty' || ($config['inputMethod'] ?? null) !== 'keyboard' || ($config['language'] ?? null) !== 'en' || ($config['punctuation'] ?? false) || ($config['numbers'] ?? false) || ($config['repeatedContent'] ?? false) || ($config['rejectIncorrect'] ?? false) || abs(($candidate['startedAtWall'] ?? 0) - $start) > 0.01) {
            throw new ApiException(422, 'challenge-mismatch', 'Challenge timing, content or input rules do not match.');
        }
        CompetitiveInputPolicy::enforceRates($metrics);
        $update = $this->db->prepare('UPDATE typing_challenges SET consumed_by=? WHERE id=?');
        $update->execute([$candidate['clientSessionId'], $challengeId]);
    }

    private function lockOwner(string $owner): void
    {
        $statement = $this->db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');
        $statement->execute([$owner]);
        if (!$statement->fetchColumn()) throw new ApiException(401, 'auth-required', 'This account is no longer available.');
    }

    private function bumpVersion(string $owner): void
    {
        $statement = $this->db->prepare('UPDATE users SET data_version=data_version+1 WHERE id=?');
        $statement->execute([$owner]);
    }

    private function expireOwnerEvidence(string $owner): void
    {
        $statement = $this->db->prepare('UPDATE typing_sessions SET evidence_json=NULL WHERE user_id=? AND evidence_json IS NOT NULL AND evidence_expires_at<=CURRENT_TIMESTAMP(3)');
        $statement->execute([$owner]);
        $race = $this->db->prepare('UPDATE race_outcomes SET transcript_events=NULL WHERE user_id=? AND transcript_events IS NOT NULL AND accepted_at<=?');
        $race->execute([$owner, Database::timestamp((microtime(true) - (int) $this->config['evidence_retention_days'] * 86400) * 1000)]);
    }

    private function integer(mixed $value, int $min, int $max, string $name): int
    {
        if (filter_var($value, FILTER_VALIDATE_INT) === false || (int) $value < $min || (int) $value > $max) throw new ApiException(422, 'pagination', 'Invalid '.$name.'.');
        return (int) $value;
    }

    private function preferencePatch(mixed $patch): array
    {
        if (!is_array($patch) || array_is_list($patch) && $patch !== [] || strlen(Database::json($patch)) > 32768) throw new ApiException(422, 'preferences', 'Preference patch must be an object under 32 KB.');
        $enum = [
            'theme' => ['sparow-dark','sparow-light','graphite','midnight-blue','ember','mono-ink','paper','aurora'],
            'language' => ['en','es','fr','de','pt','it','ru','hi','ar','gu-Latn'],
            'layout' => ['qwerty','dvorak','colemak','colemak-dh','workman','azerty','qwertz','native'],
            'caretStyle' => ['line','block','underline','outline'],
            'soundPack' => ['soft','mechanical','typewriter','arcade','minimal'],
        ];
        $numbers = ['targetWpm'=>[10,200], 'fontSize'=>[18,40], 'volume'=>[0,1], 'dailyGoalMinutes'=>[1,120]];
        $booleans = ['smoothCaret','sound','reducedMotion','liveStats','focusMode','paceCaret','showKeyboard','showFingerGuide'];
        foreach ($patch as $key => $value) {
            if ($key === 'theme') {
                if ($value === 'forge-dark') $patch[$key] = $value = 'sparow-dark';
                if ($value === 'forge-light') $patch[$key] = $value = 'sparow-light';
            }
            if (isset($enum[$key]) && in_array($value, $enum[$key], true)) continue;
            if (isset($numbers[$key]) && (is_int($value) || is_float($value)) && is_finite((float) $value) && $value >= $numbers[$key][0] && $value <= $numbers[$key][1]) continue;
            if (in_array($key, $booleans, true) && is_bool($value)) continue;
            throw new ApiException(422, 'preferences', 'Invalid preference: '.(string) $key.'.');
        }
        return $patch;
    }
}
