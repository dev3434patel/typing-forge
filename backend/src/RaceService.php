<?php
declare(strict_types=1);
namespace SparowType;

use PDO;
use PDOException;

/** Two authenticated racers; every transition and accepted prefix is serialized by InnoDB. */
final class RaceService
{
    private const TERMINAL = ['completed', 'cancelled', 'abandoned'];
    private const FINISH_GRACE_MS = 3000;
    private const MATCH_HOST_FRESH_MS = 30000;
    private const WORDS = ['build','clear','focus','steady','practice','river','light','think','world','bright','calm','learn','flow','forge','type','quick','quiet','small','space','strong','read','write','daily','skill'];

    public function __construct(private PDO $db, private SessionValidator $validator, private DataService $data) {}

    public function handle(string $action, array $body, array $user): array
    {
        $this->db->beginTransaction();
        try {
            // Use the same user-before-private-data lock order as account deletion.
            $lock = $this->db->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
            $lock->execute([$user['id']]);
            if (!$lock->fetchColumn()) throw new ApiException(401, 'authentication-required', 'Sign in to continue.');
            $now = $this->now();
            $result = match ($action) {
                'create' => ['room' => $this->serialize($this->create($user['id'], $this->duration($body), $now), $now)],
                'join' => ['room' => $this->serialize($this->join($this->code($body), $user['id'], $now), $now)],
                'get' => ['room' => $this->serialize($this->get($this->code($body), $user['id'], $now), $now)],
                'leave' => ['room' => $this->serialize($this->leave($this->id($body), $user['id'], $now), $now)],
                'quick-match' => ['room' => $this->serialize($this->quickMatch($user['id'], $this->duration($body), $now), $now)],
                'rematch' => ['room' => $this->serialize($this->rematch($this->id($body), $user['id'], $now), $now)],
                'submit' => ['room' => $this->serialize($this->submit($body, $user, $now), $now)],
                'challenge' => ['challenge' => $this->challenge($user['id'], $this->duration($body), $now)],
                default => throw new ApiException(404, 'route-not-found', 'This race operation does not exist.'),
            };
            $this->db->commit();
            return $result;
        } catch (\Throwable $cause) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $cause;
        }
    }

    private function now(): float
    {
        return (float) $this->db->query('SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3)) * 1000')->fetchColumn();
    }

    private function milliseconds(?string $value): ?float
    {
        return $value === null ? null : round((float) (new \DateTimeImmutable($value, new \DateTimeZone('UTC')))->format('U.u') * 1000);
    }

    private function duration(array $body): int
    {
        $duration = $body['duration'] ?? 30;
        if (!is_int($duration) || !in_array($duration, [15,30,60,120], true))
            throw new ApiException(422, 'invalid-duration', 'Choose a 15, 30, 60 or 120 second race.');
        return $duration;
    }

    private function code(array $body): string
    {
        $value = $body['code'] ?? '';
        if (!is_string($value) || !preg_match('/^[A-Z0-9]{6}$/D', $value))
            throw new ApiException(422, 'invalid-room-code', 'Enter the six character room code.');
        return $value;
    }

    private function id(array $body): string
    {
        $value = $body['raceId'] ?? '';
        if (!is_string($value) || !preg_match('/^[0-9a-f-]{36}$/Di', $value))
            throw new ApiException(422, 'invalid-race-id', 'A valid race identifier is required.');
        return $value;
    }

    private function fetchRoom(string $column, string $value): array
    {
        $query = $this->db->prepare('SELECT * FROM race_sessions WHERE '.$column.' = ? FOR UPDATE');
        $query->execute([$value]);
        $room = $query->fetch();
        if (!$room) throw new ApiException(404, 'room-not-found', 'This room does not exist.');
        return $room;
    }

    private function member(array $room, string $owner): void
    {
        if ($owner !== $room['host_id'] && $owner !== $room['opponent_id'])
            throw new ApiException(403, 'room-membership', 'Room membership is required. Join the room with its code.');
    }

    private function target(): string
    {
        $words = [];
        for ($i = 0; $i < 800; $i++) $words[] = self::WORDS[random_int(0, count(self::WORDS) - 1)];
        return implode(' ', $words);
    }

    private function create(string $owner, int $duration, float $now, bool $public = false, ?string $rematchOf = null): array
    {
        $limit = $this->db->prepare('SELECT COUNT(*) FROM race_sessions WHERE host_id = ? AND created_at > ?');
        $limit->execute([$owner, Database::timestamp($now - 60000)]);
        if ((int) $limit->fetchColumn() >= 10)
            throw new ApiException(429, 'race-rate-limit', 'Please wait before creating more rooms.');
        $id = Database::uuid();
        $target = $this->target();
        for ($attempt = 0; $attempt < 8; $attempt++) {
            $code = strtoupper(bin2hex(random_bytes(3)));
            try {
                $insert = $this->db->prepare('INSERT INTO race_sessions (id,room_code,host_id,expected_text,duration_seconds,is_public,expires_at,host_last_seen_at,rematch_of) VALUES (?,?,?,?,?,?,?,?,?)');
                $insert->execute([$id,$code,$owner,$target,$duration,(int) $public,Database::timestamp($now + 600000),Database::timestamp($now),$rematchOf]);
                return $this->fetchRoom('id', $id);
            } catch (PDOException $error) {
                if (($error->errorInfo[1] ?? null) !== 1062) throw $error;
                if ($rematchOf !== null) {
                    $existing = $this->db->prepare('SELECT * FROM race_sessions WHERE rematch_of = ? AND host_id = ? FOR UPDATE');
                    $existing->execute([$rematchOf, $owner]);
                    if ($row = $existing->fetch()) return $row;
                }
            }
        }
        throw new ApiException(503, 'room-code-unavailable', 'Could not allocate a room code. Try again.');
    }

    private function join(string $code, string $owner, float $now): array
    {
        $room = $this->fetchRoom('room_code', $code);
        $now = $this->now();
        $room = $this->settle($room, $now);
        if ($owner === $room['opponent_id']) return $this->heartbeat($room, $owner, $now);
        if ($owner === $room['host_id'])
            throw new ApiException(409, 'same-racer', 'Open this room with a second account to join.');
        if ($room['status'] !== 'waiting' || $room['opponent_id'] !== null)
            throw new ApiException(409, 'room-unavailable', 'This room is no longer waiting for a racer.');
        $start = $now + 3000;
        $update = $this->db->prepare("UPDATE race_sessions SET opponent_id = ?, status = 'countdown', countdown_started_at = ?, started_at = ?, deadline_at = ?, opponent_last_seen_at = ?, version = version + 1 WHERE id = ?");
        $update->execute([$owner,Database::timestamp($now),Database::timestamp($start),Database::timestamp($start + (int) $room['duration_seconds'] * 1000),Database::timestamp($now),$room['id']]);
        return $this->fetchRoom('id', $room['id']);
    }

    private function get(string $code, string $owner, float $now): array
    {
        $room = $this->fetchRoom('room_code', $code);
        $now = $this->now();
        $this->member($room, $owner);
        return $this->heartbeat($this->settle($room, $now), $owner, $now);
    }

    private function heartbeat(array $room, string $owner, float $now): array
    {
        if (!in_array($room['status'], self::TERMINAL, true)) {
            $column = $owner === $room['host_id'] ? 'host_last_seen_at' : 'opponent_last_seen_at';
            $query = $this->db->prepare('UPDATE race_sessions SET '.$column.' = ? WHERE id = ?');
            $query->execute([Database::timestamp($now), $room['id']]);
        }
        return $room;
    }

    private function quickMatch(string $owner, int $duration, float $now): array
    {
        $lock = $this->db->prepare('SELECT duration_seconds FROM race_match_locks WHERE duration_seconds = ? FOR UPDATE');
        $lock->execute([$duration]);
        if (!$lock->fetchColumn()) throw new ApiException(503, 'matchmaking-schema', 'The matchmaking schema is not installed.');
        $now = $this->now();
        $find = $this->db->prepare("SELECT * FROM race_sessions WHERE is_public = 1 AND status = 'waiting' AND opponent_id IS NULL AND duration_seconds = ? AND expires_at > ? AND host_id <> ? AND host_last_seen_at >= ? ORDER BY created_at,id LIMIT 1 FOR UPDATE");
        $find->execute([$duration, Database::timestamp($now), $owner, Database::timestamp($now - self::MATCH_HOST_FRESH_MS)]);
        if ($room = $find->fetch()) return $this->join($room['room_code'], $owner, $now);
        $own = $this->db->prepare("SELECT * FROM race_sessions WHERE is_public = 1 AND status = 'waiting' AND duration_seconds = ? AND expires_at > ? AND host_id = ? ORDER BY created_at,id LIMIT 1 FOR UPDATE");
        $own->execute([$duration, Database::timestamp($now), $owner]);
        if ($room = $own->fetch()) return $this->heartbeat($room, $owner, $now);
        return $this->create($owner, $duration, $now, true);
    }

    private function leave(string $id, string $owner, float $now): array
    {
        $room = $this->fetchRoom('id', $id);
        $this->member($room, $owner);
        $room = $this->settle($room, $now);
        if (in_array($room['status'], self::TERMINAL, true)) return $room;
        // Leaving the results view during receipt grace cannot forfeit a test
        // whose fixed typing clock has already ended.
        if ($room['deadline_at'] !== null && $now >= $this->milliseconds($room['deadline_at'])) return $room;
        $status = $room['status'] === 'active' ? 'completed' : 'cancelled';
        $winner = $status === 'completed' ? ($owner === $room['host_id'] ? $room['opponent_id'] : $room['host_id']) : null;
        $query = $this->db->prepare('UPDATE race_sessions SET status = ?, winner_id = ?, ended_at = ?, version = version + 1 WHERE id = ?');
        $query->execute([$status, $winner, Database::timestamp($now), $id]);
        return $this->fetchRoom('id', $id);
    }

    private function rematch(string $id, string $owner, float $now): array
    {
        $room = $this->fetchRoom('id', $id);
        $this->member($room, $owner);
        $room = $this->settle($room, $now);
        if (!in_array($room['status'], self::TERMINAL, true))
            throw new ApiException(409, 'race-still-active', 'Finish the current room before requesting a rematch.');
        $existing = $this->db->prepare('SELECT * FROM race_sessions WHERE rematch_of = ? AND host_id = ? FOR UPDATE');
        $existing->execute([$id, $owner]);
        if ($row = $existing->fetch()) return $row;
        return $this->create($owner, (int) $room['duration_seconds'], $now, false, $id);
    }

    private function settle(array $room, float $now): array
    {
        $status = $room['status'];
        if ($status === 'waiting' && $now >= $this->milliseconds($room['expires_at'])) {
            $query = $this->db->prepare("UPDATE race_sessions SET status = 'abandoned', ended_at = ?, version = version + 1 WHERE id = ?");
            $query->execute([Database::timestamp($now), $room['id']]);
            return $this->fetchRoom('id', $room['id']);
        }
        if ($status === 'countdown' && $now >= $this->milliseconds($room['started_at'])) {
            $query = $this->db->prepare("UPDATE race_sessions SET status = 'active', version = version + 1 WHERE id = ?");
            $query->execute([$room['id']]);
            $room = $this->fetchRoom('id', $room['id']);
        }
        // Receipt grace does not extend the typing clock or allow later events.
        if ($room['status'] === 'active' && $now >= $this->milliseconds($room['deadline_at']) + self::FINISH_GRACE_MS) {
            // Every deadline result includes the full shared idle time. An old
            // five-second checkpoint cannot retain its faster denominator.
            $normalize = $this->db->prepare('UPDATE race_outcomes SET wpm = CASE WHEN wpm IS NULL THEN NULL ELSE wpm * elapsed_ms / ? END, elapsed_ms = ? WHERE race_id = ?');
            $duration = (int) $room['duration_seconds'] * 1000;
            $normalize->execute([$duration, $duration, $room['id']]);
            $query = $this->db->prepare('SELECT * FROM race_outcomes WHERE race_id = ?');
            $query->execute([$room['id']]);
            $scores = [];
            foreach ($query->fetchAll() as $row) $scores[$row['user_id']] = $row;
            $host = $scores[$room['host_id']] ?? [];
            $opponent = $scores[$room['opponent_id']] ?? [];
            $winner = null;
            foreach ([['progress',1],['wpm',1],['incorrect_attempts',-1]] as [$key,$direction]) {
                $difference = (float) ($host[$key] ?? 0) - (float) ($opponent[$key] ?? 0);
                if (abs($difference) > 0.000001) {
                    $winner = $difference * $direction > 0 ? $room['host_id'] : $room['opponent_id'];
                    break;
                }
            }
            $abandoned = (float) ($host['progress'] ?? 0) === 0.0 && (float) ($opponent['progress'] ?? 0) === 0.0;
            $query = $this->db->prepare('UPDATE race_sessions SET status = ?, winner_id = ?, host_wpm = ?, opponent_wpm = ?, ended_at = deadline_at, version = version + 1 WHERE id = ?');
            $query->execute([$abandoned ? 'abandoned' : 'completed', $abandoned ? null : $winner, $host['wpm'] ?? null, $opponent['wpm'] ?? null, $room['id']]);
            $room = $this->fetchRoom('id', $room['id']);
        }
        return $room;
    }

    private function submit(array $body, array $user, float $now): array
    {
        $room = $this->fetchRoom('id', $this->id($body));
        $now = $this->now();
        $owner = $user['id'];
        $this->member($room, $owner);
        $finish = $body['finish'] ?? false;
        if (!is_bool($finish)) throw new ApiException(422, 'invalid-finish', 'Finish must be a boolean.');
        $candidate = $body['candidate'] ?? null;
        if (!is_array($candidate)) throw new ApiException(422, 'invalid-candidate', 'Race event evidence is required.');
        CompetitiveInputPolicy::preflight($candidate);
        $validated = $this->validator->validate($candidate, $owner, false, !$finish);
        $candidate = $validated['candidate'];
        $configuration = $candidate['configuration'];
        if (($configuration['mode'] ?? null) !== 'race' || ($configuration['durationMs'] ?? null) !== (int) $room['duration_seconds'] * 1000 ||
            ($configuration['challengeId'] ?? null) !== $room['id'] || ($configuration['scoringPolicy'] ?? null) !== 'prose' ||
            ($configuration['inputMethod'] ?? null) !== 'keyboard' || ($configuration['correctionPolicy'] ?? null) !== 'current-word' ||
            $candidate['targetText'] !== $room['expected_text'] || $candidate['initialTarget'] !== $room['expected_text'] ||
            count($candidate['issuedTargetSegments']) !== 0 || count($candidate['pauseIntervals']) !== 0)
            throw new ApiException(422, 'race-target-mismatch', 'The race target, configuration or editing rules do not match the server room.');
        foreach ($candidate['events'] as $event)
            if ($event['provenance'] !== 'keyboard') throw new ApiException(422, 'race-input-method', 'Human races require keyboard event evidence.');
        $start = $this->milliseconds($room['started_at']);
        $deadline = $this->milliseconds($room['deadline_at']);
        if ($start === null || $deadline === null || $now < $start || $candidate['startedAtWall'] !== (int) $start)
            throw new ApiException(422, 'race-server-start', 'Race evidence must use the server countdown start.');
        $elapsed = min((int) $room['duration_seconds'] * 1000, max(0, $now - $start));
        if ($candidate['elapsedMs'] > $elapsed + 250)
            throw new ApiException(422, 'race-server-time', 'Race evidence exceeds the server clock.');
        foreach ($candidate['events'] as $event)
            if ($event['offsetMs'] > $elapsed + 250 || $event['offsetMs'] > (int) $room['duration_seconds'] * 1000)
                throw new ApiException(422, 'race-event-time', 'A race event exceeds the shared deadline.');
        $query = $this->db->prepare('SELECT * FROM race_outcomes WHERE race_id = ? AND user_id = ? FOR UPDATE');
        $query->execute([$room['id'], $owner]);
        $previous = $query->fetch();
        $events = $candidate['events'];
        if ($previous) {
            if ($previous['client_session_id'] !== $candidate['clientSessionId'])
                throw new ApiException(409, 'race-session-changed', 'This racer already submitted evidence from another session.');
            $stored = Database::decode($previous['transcript_events'], []);
            foreach (array_slice($stored, 0, count($events)) as $index => $event)
                if ($events[$index] != $event)
                    throw new ApiException(409, 'race-prefix-changed', 'Previously accepted race events cannot be replaced or removed.');
            if (count($events) < count($stored)) {
                if ($finish) throw new ApiException(409, 'race-prefix-truncated', 'A finish cannot remove previously accepted race events.');
                return $this->settle($room, $now);
            }
            if ((bool) $previous['finalized']) {
                if ($finish) $this->data->commitValidated($user, $candidate, $validated, ['raceId' => $room['id'], 'personalBestEligible' => false]);
                return $this->settle($room, $now);
            }
            if (!$finish && count($events) <= (int) $previous['sequence']) return $this->settle($room, $now);
        }
        $room = $this->settle($room, $now);
        $terminal = in_array($room['status'], self::TERMINAL, true);
        if ($room['status'] === 'waiting' || $room['status'] === 'countdown')
            throw new ApiException(409, 'race-not-active', 'The race has not started.');
        if (!$finish && ($terminal || $now > $deadline)) return $room;
        if ($finish && $now > $deadline + self::FINISH_GRACE_MS && !$terminal)
            throw new ApiException(409, 'race-finish-late', 'The shared deadline has passed.');
        $scoreElapsed = $terminal && $room['ended_at'] !== null
            ? min($elapsed, max(0, $this->milliseconds($room['ended_at']) - $start)) : $elapsed;
        foreach ($events as $event)
            if ($event['offsetMs'] > $scoreElapsed + 250)
                throw new ApiException(422, 'race-after-end', 'Race evidence continues after the room ended.');
        $replay = $this->validator->replay($configuration, $events, $scoreElapsed, ['targetText' => $room['expected_text'], 'finiteFinal' => $finish]);
        $metrics = $replay['metrics'];
        CompetitiveInputPolicy::enforceRates($metrics);
        $correct = count(array_filter($replay['characters'], static fn(array $slot): bool => $slot['status'] === 'correct'));
        // The server corpus is ASCII; byte length is its exact grapheme length.
        $progress = min(100.0, $correct / strlen($room['expected_text']) * 100);
        $exact = $finish && $replay['finalText'] === $room['expected_text'] && $now <= $deadline;
        if ($finish) {
            $this->data->commitValidated($user, $candidate, $validated, [
                'raceId' => $room['id'], 'elapsedMs' => $scoreElapsed, 'metrics' => $metrics, 'timeSeries' => $replay['timeSeries'],
                'finishedAtWall' => $now, 'personalBestEligible' => false,
                'eligibility' => ['eligible' => false, 'reasons' => ['race-outcomes-have-a-separate-comparison'], 'verification' => 'php-race-replayed'],
            ]);
        }
        // After settlement, personal evidence can be acknowledged without changing the winner.
        if ($terminal) return $room;
        $query = $this->db->prepare('INSERT INTO race_outcomes (race_id,user_id,progress,wpm,accuracy,incorrect_attempts,exact_completion,sequence,accepted_at,client_session_id,transcript_events,finalized,elapsed_ms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE progress=VALUES(progress),wpm=VALUES(wpm),accuracy=VALUES(accuracy),incorrect_attempts=VALUES(incorrect_attempts),exact_completion=VALUES(exact_completion),sequence=VALUES(sequence),accepted_at=VALUES(accepted_at),transcript_events=VALUES(transcript_events),finalized=VALUES(finalized),elapsed_ms=VALUES(elapsed_ms)');
        $query->execute([$room['id'],$owner,$progress,$metrics['wpm'],$metrics['inputAccuracy'],$metrics['incorrectAttempts'],(int) $exact,count($events),Database::timestamp($now),$candidate['clientSessionId'],Database::json($events),(int) $finish,$scoreElapsed]);
        $side = $owner === $room['host_id'] ? 'host' : 'opponent';
        $query = $this->db->prepare('UPDATE race_sessions SET '.$side.'_progress = ?, '.$side.'_wpm = ?, '.$side.'_accuracy = ?, '.$side.'_last_seen_at = ?, version = version + 1 WHERE id = ?');
        $query->execute([$progress,$metrics['wpm'],$metrics['inputAccuracy'],Database::timestamp($now),$room['id']]);
        if ($exact) {
            $query = $this->db->prepare("UPDATE race_sessions SET status = 'completed', winner_id = ?, ended_at = ?, version = version + 1 WHERE id = ?");
            $query->execute([$owner,Database::timestamp($now),$room['id']]);
        }
        return $this->settle($this->fetchRoom('id', $room['id']), $now);
    }

    private function challenge(string $owner, int $duration, float $now): array
    {
        $limit = $this->db->prepare('SELECT COUNT(*) FROM typing_challenges WHERE user_id = ? AND issued_at > ?');
        $limit->execute([$owner, Database::timestamp($now - 60000)]);
        if ((int) $limit->fetchColumn() >= 10)
            throw new ApiException(429, 'challenge-rate-limit', 'Please wait before requesting more challenges.');
        $configuration = ['mode'=>'time','durationMs'=>$duration * 1000,'language'=>'en','keyboardLayout'=>'qwerty','inputMethod'=>'keyboard','scoringPolicy'=>'prose','contentRevision'=>'forge-ranked-en-v1','correctionPolicy'=>'current-word'];
        $id = Database::uuid();
        $nonce = Database::uuid();
        $target = $this->target();
        $issued = Database::timestamp($now);
        $start = Database::timestamp($now + 3000);
        $deadline = Database::timestamp($now + 3000 + $duration * 1000);
        $expires = Database::timestamp($now + 600000);
        $query = $this->db->prepare('INSERT INTO typing_challenges (id,user_id,nonce,configuration,target_text,issued_at,starts_at,deadline_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?)');
        $query->execute([$id,$owner,$nonce,Database::json($configuration),$target,$issued,$start,$deadline,$expires]);
        return ['id'=>$id,'user_id'=>$owner,'nonce'=>$nonce,'configuration'=>$configuration,'target_text'=>$target,'issued_at'=>Database::iso($issued),'starts_at'=>Database::iso($start),'deadline_at'=>Database::iso($deadline),'expires_at'=>Database::iso($expires),'server_now'=>Database::iso($issued)];
    }

    private function serialize(array $room, float $now): array
    {
        foreach (['duration_seconds','version'] as $key) $room[$key] = (int) $room[$key];
        foreach (['host_progress','opponent_progress','host_wpm','opponent_wpm','host_accuracy','opponent_accuracy'] as $key)
            $room[$key] = $room[$key] === null ? null : (float) $room[$key];
        foreach (['countdown_started_at','started_at','deadline_at','ended_at','expires_at','created_at','host_last_seen_at','opponent_last_seen_at'] as $key)
            if (isset($room[$key])) $room[$key] = Database::iso($room[$key]);
        $room['is_public'] = (bool) $room['is_public'];
        $room['is_bot_race'] = false;
        $room['server_now'] = Database::iso(Database::timestamp($this->now()));
        return $room;
    }
}
