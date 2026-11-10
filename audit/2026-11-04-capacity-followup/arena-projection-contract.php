<?php
declare(strict_types=1);
// Audit-only pure differential contract. No bootstrap, configuration, SQL or HTTP.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once dirname(__DIR__, 2).'/backend/src/'.substr($class, strlen($prefix)).'.php';
});
require_once __DIR__.'/ArenaServiceProjectionCandidate.php';
set_error_handler(static function (int $severity, string $message, string $file, int $line): never { throw new ErrorException($message, 0, $severity, $file, $line); });

use SparowType\ApiException;
use SparowType\ArenaRules;
use SparowType\ArenaService;
use SparowType\ArenaServiceProjectionCandidate;
use SparowType\DataService;
use SparowType\Database;
use SparowType\SessionValidator;

final class ProjectionConnection extends PDO
{
    public const FULL = 'SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE';
    public const ACTIVE = 'SELECT user_id,status,last_seen_at,credited_units FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE';
    public const RESPONSE = 'SELECT user_id,slot,ready,status,credited_units,wpm,accuracy,elapsed_ms,rematch_vote,quarantine_reason,appeal_requested_at FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE';
    public array $trace = [];
    public array $memberReads = [];
    public bool $transaction = false;
    public int $clockReads = 0;
    public function __construct(public array $room, public array $rows, public array $handles, public array $clocks = [], public string|false $rematch = 'NEXT1234') {}
    public function beginTransaction(): bool { $this->trace[] = ['sql' => 'BEGIN', 'params' => []]; $this->transaction = true; return true; }
    public function commit(): bool { $this->trace[] = ['sql' => 'COMMIT', 'params' => []]; $this->transaction = false; return true; }
    public function rollBack(): bool { $this->trace[] = ['sql' => 'ROLLBACK', 'params' => []]; $this->transaction = false; return true; }
    public function inTransaction(): bool { return $this->transaction; }
    public function prepare(string $query, array $options = []): PDOStatement|false { return new ProjectionStatement($this, $query); }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false { $statement = new ProjectionStatement($this, $query); $statement->execute(); return $statement; }
    public function executeQuery(string $sql, array $params): array
    {
        $this->trace[] = ['sql' => $sql, 'params' => $params];
        if (in_array($sql, [self::FULL, self::ACTIVE, self::RESPONSE], true)) {
            if ($params !== [$this->room['id']]) throw new RuntimeException('Unexpected arena-member binding.');
            $rows = $this->rows;
            usort($rows, static fn(array $a, array $b): int => (int)$a['slot'] <=> (int)$b['slot']);
            if ($sql !== self::FULL) {
                $columns = explode(',', substr($sql, 7, strpos($sql, ' FROM') - 7));
                $rows = array_map(static function (array $row) use ($columns): array { $projected = []; foreach ($columns as $column) { if (!array_key_exists($column, $row)) throw new RuntimeException('Missing projected fixture column.'); $projected[$column] = $row[$column]; } return $projected; }, $rows);
            }
            $this->memberReads[] = ['sql' => $sql, 'rows' => $rows];
            return ['rows' => $rows];
        }
        if ($sql === 'SELECT * FROM arena_rooms WHERE room_code=? FOR UPDATE') return ['row' => $params === [$this->room['room_code']] ? $this->room : false];
        if ($sql === 'SELECT id FROM users WHERE id=? FOR UPDATE') return ['column' => in_array($params[0], array_column($this->rows, 'user_id'), true) ? $params[0] : false];
        if ($sql === 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000') {
            if (!array_key_exists($this->clockReads, $this->clocks)) throw new RuntimeException('Unexpected database-clock read.');
            return ['column' => $this->clocks[$this->clockReads++]];
        }
        if (preg_match('/^SELECT id,handle FROM users WHERE id IN\\(\\?(?:,\\?)*\\)$/D', $sql)) return ['rows' => array_values(array_filter($this->handles, static fn(array $row): bool => in_array($row['id'], $params, true)))];
        if ($sql === 'SELECT room_code FROM arena_rooms WHERE rematch_of=?') return ['column' => $this->rematch];
        if ($sql === 'UPDATE arena_rooms SET version=version+1 WHERE id=?') { $this->room['version']++; return []; }
        if ($sql === "UPDATE arena_rooms SET status='active' WHERE id=?") { $this->room['status'] = 'active'; return []; }
        if ($sql === "UPDATE arena_members SET status='racing' WHERE arena_id=? AND status='joined'") { foreach ($this->rows as &$row) if ($row['status'] === 'joined') $row['status'] = 'racing'; unset($row); return []; }
        if ($sql === 'UPDATE arena_members SET last_seen_at=? WHERE arena_id=? AND user_id=?') { foreach ($this->rows as &$row) if ($row['user_id'] === $params[2]) $row['last_seen_at'] = $params[0]; unset($row); return []; }
        if ($sql === "UPDATE arena_members SET status='forfeit',elapsed_ms=?,wpm=?,finished_at=? WHERE arena_id=? AND user_id=?" || $sql === "UPDATE arena_members SET status='finished',elapsed_ms=?,wpm=?,finished_at=? WHERE arena_id=? AND user_id=?") {
            foreach ($this->rows as &$row) if ($row['user_id'] === $params[4]) { $row['status'] = str_contains($sql, "status='forfeit'") ? 'forfeit' : 'finished'; $row['elapsed_ms'] = $params[0]; $row['wpm'] = $params[1]; $row['finished_at'] = $params[2]; } unset($row); return [];
        }
        if ($sql === "UPDATE arena_rooms SET status='completed',ended_at=? WHERE id=?" || $sql === "UPDATE arena_rooms SET status='cancelled',ended_at=? WHERE id=?") { $this->room['status'] = str_contains($sql, "status='completed'") ? 'completed' : 'cancelled'; $this->room['ended_at'] = $params[0]; return []; }
        if ($sql === "UPDATE arena_rooms SET status='countdown',starts_at=?,deadline_at=? WHERE id=?") { $this->room['status'] = 'countdown'; $this->room['starts_at'] = $params[0]; $this->room['deadline_at'] = $params[1]; return []; }
        if (str_starts_with($sql, 'DELETE FROM arena_members WHERE arena_id=? AND user_id IN(')) {
            $before = count($this->rows);
            $this->rows = array_values(array_filter($this->rows, static function (array $row) use ($params): bool {
                if (!in_array($row['user_id'], array_slice($params, 1), true) || $row['status'] !== 'joined' || (int)$row['sequence_count'] !== 0 || (int)$row['credited_units'] !== 0 || (float)$row['elapsed_ms'] !== 0.0) return true;
                foreach (['client_session_id', 'events_json', 'evidence_json', 'metrics_json', 'event_hash', 'finished_at'] as $key) if ($row[$key] !== null) return true;
                return false;
            }));
            return ['affected' => $before - count($this->rows)];
        }
        throw new RuntimeException('Unexpected SQL in pure projection contract.');
    }
}
final class ProjectionStatement extends PDOStatement
{
    private array $result = [];
    public function __construct(private ProjectionConnection $db, private string $sql) {}
    public function execute(?array $params = null): bool { $this->result = $this->db->executeQuery($this->sql, $params ?? []); return true; }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed { return $this->result['row'] ?? false; }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array { return $this->result['rows'] ?? []; }
    public function fetchColumn(int $column = 0): mixed { return $this->result['column'] ?? false; }
    public function rowCount(): int { return $this->result['affected'] ?? 0; }
}

$checks = [];
$check = static function (string $name, bool $pass) use (&$checks): void { $checks[] = ['name' => $name, 'pass' => $pass]; };
$invoke = static fn(object $service, string $method, mixed ...$args): mixed => (new ReflectionMethod($service, $method))->invoke($service, ...$args);
$normalizedTrace = static fn(array $trace): array => array_map(static function (array $entry): array { if (in_array($entry['sql'], [ProjectionConnection::ACTIVE, ProjectionConnection::RESPONSE], true)) $entry['sql'] = ProjectionConnection::FULL; return $entry; }, $trace);
$outcome = static function (callable $work): array { try { return ['ok' => true, 'value' => $work()]; } catch (Throwable $error) { return ['ok' => false, 'class' => $error::class, 'message' => $error->getMessage(), 'status' => $error instanceof ApiException ? $error->status : null, 'code' => $error instanceof ApiException ? $error->errorCode : null]; } };
$id = '33333333-3333-4333-8333-333333333333';
$owner = '11111111-1111-4111-8111-111111111111';
$peer = '22222222-2222-4222-8222-222222222222';
$third = '44444444-4444-4444-8444-444444444444';
$now = 1793793600000.0;
$room = ['id' => $id, 'room_code' => 'ABCD1234', 'host_id' => $owner, 'status' => 'active', 'version' => 9, 'duration_seconds' => 30, 'starts_at' => Database::timestamp($now - 10000), 'deadline_at' => Database::timestamp($now + 20000), 'ended_at' => null, 'expected_text' => 'calm clear river', 'configuration_json' => Database::json(ArenaRules::configuration($id, 30)), 'is_public' => 0, 'expires_at' => Database::timestamp($now + 600000), 'created_at' => Database::timestamp($now - 12000), 'bracket_wpm' => 35, 'rematch_of' => null];
$seat = static fn(string $user, int $slot, array $changes = []): array => ['arena_id' => $id, 'user_id' => $user, 'slot' => $slot, 'ready' => 1, 'status' => 'racing', 'last_seen_at' => Database::timestamp($now), 'client_session_id' => 'private-session-'.$slot, 'events_json' => '[{"sequence":0,"text":"c"}]', 'evidence_json' => '{"private":"canonical"}', 'metrics_json' => '{"private":"metrics"}', 'event_hash' => 'private-hash', 'sequence_count' => 1, 'credited_units' => 10, 'accuracy' => 100.0, 'wpm' => 12.0, 'elapsed_ms' => 10000.0, 'finished_at' => null, 'rematch_vote' => 0, 'quarantine_reason' => null, 'appeal_requested_at' => null, ...$changes];
$handles = [['id' => $peer, 'handle' => 'peer_handle'], ['id' => $owner, 'handle' => 'owner_handle']];
$pair = static function (array $scenarioRoom, array $rows, array $scenarioHandles = [], array $clocks = []) use ($handles): array {
    $leftDb = new ProjectionConnection($scenarioRoom, $rows, $scenarioHandles ?: $handles, $clocks);
    $rightDb = new ProjectionConnection($scenarioRoom, $rows, $scenarioHandles ?: $handles, $clocks);
    $validator = new SessionValidator();
    return [new ArenaService($leftDb, $validator, new DataService($leftDb, $validator, [])), new ArenaServiceProjectionCandidate($rightDb, $validator, new DataService($rightDb, $validator, [])), $leftDb, $rightDb];
};
$compare = static function (string $name, array $pair, callable $work) use ($check, $outcome, $normalizedTrace): array {
    [$left, $right, $leftDb, $rightDb] = $pair;
    $before = [$leftDb->room, $leftDb->rows];
    $a = $outcome(static fn(): mixed => $work($left));
    $b = $outcome(static fn(): mixed => $work($right));
    $check($name.' exact result/error parity', $a === $b && $a['ok']);
    $check($name.' state and fresh-row mutation parity', $leftDb->room === $rightDb->room && $leftDb->rows === $rightDb->rows);
    $check($name.' query order, bindings and lock clauses unchanged except declared columns', $normalizedTrace($leftDb->trace) === $normalizedTrace($rightDb->trace));
    $check($name.' server-clock read count and transaction state unchanged', $leftDb->clockReads === $rightDb->clockReads && $leftDb->transaction === $rightDb->transaction);
    foreach ($rightDb->memberReads as $index => $read) if ($read['sql'] !== ProjectionConnection::FULL) {
        $expected = $read['sql'] === ProjectionConnection::ACTIVE ? ['user_id', 'status', 'last_seen_at', 'credited_units'] : ['user_id', 'slot', 'ready', 'status', 'credited_units', 'wpm', 'accuracy', 'elapsed_ms', 'rematch_vote', 'quarantine_reason', 'appeal_requested_at'];
        $check($name.' projected read'.$index.' contains only declared columns', !array_filter($read['rows'], static fn(array $row): bool => array_keys($row) !== $expected));
    }
    return [$a, $b, $before];
};

// Public projection: ties, nullable numbers/handles, excluded statuses and owner privacy.
$finished = [...$room, 'status' => 'completed'];
$publicRows = [$seat($third, 2, ['status' => 'quarantined', 'accuracy' => null, 'wpm' => null, 'quarantine_reason' => 'private-reason', 'appeal_requested_at' => Database::timestamp($now)]), $seat($peer, 1, ['status' => 'finished', 'elapsed_ms' => 30000.0]), $seat($owner, 0, ['status' => 'finished', 'elapsed_ms' => 30000.0])];
foreach ([[$owner, false], [$peer, false], [$third, false], ['outsider', true], [$owner, true]] as [$viewer, $spectator]) {
    $p = $pair($finished, $publicRows);
    [$answer] = $compare('serialize '.$viewer.' spectator'.(int)$spectator, $p, static fn(object $service): array => $invoke($service, 'serialize', $finished, $viewer, $spectator, $now));
    $members = $answer['value']['members'] ?? [];
    $check('serialize tie and excluded-status placements '.$viewer.' '.(int)$spectator, array_column($members, 'placement') === [1, 1, null]);
    $check('serialize private details only for viewer '.$viewer.' '.(int)$spectator, count(array_filter($members, static fn(array $member): bool => array_key_exists('quarantineReason', $member))) === ($viewer === 'outsider' ? 0 : 1));
    $check('serialize preserves former-member fallback '.$viewer.' '.(int)$spectator, ($members[2]['handle'] ?? null) === 'Former member');
    $check('serialize has no JSON evidence fetch '.$viewer.' '.(int)$spectator, count($p[3]->memberReads) === 1 && $p[3]->memberReads[0]['sql'] === ProjectionConnection::RESPONSE);
}
$compare('empty serialize', $pair($finished, []), static fn(object $service): array => $invoke($service, 'serialize', $finished, 'outsider', true, $now));
$compare('nullable handle serialize', $pair($finished, $publicRows, [['id' => $owner, 'handle' => null], ['id' => $peer, 'handle' => 'peer_handle']]), static fn(object $service): array => $invoke($service, 'serialize', $finished, $owner, false, $now));

// Active snapshots remain fresh at each original lock point and transition boundary.
$scenarios = [
    'active current' => [$room, [$seat($owner, 0), $seat($peer, 1)], $now],
    'reconnect exact boundary' => [$room, [$seat($owner, 0, ['last_seen_at' => Database::timestamp($now - ArenaRules::RECONNECT_MS)]), $seat($peer, 1)], $now],
    'reconnect exceeded' => [$room, [$seat($owner, 0, ['last_seen_at' => Database::timestamp($now - ArenaRules::RECONNECT_MS - 1)]), $seat($peer, 1)], $now],
    'deadline awaits finish grace' => [$room, [$seat($owner, 0), $seat($peer, 1)], $now + 20000],
    'grace before boundary' => [$room, [$seat($owner, 0), $seat($peer, 1)], $now + 23000 - 1],
    'grace exact boundary' => [$room, [$seat($owner, 0), $seat($peer, 1)], $now + 23000],
    'no racing members completes' => [$room, [$seat($owner, 0, ['status' => 'finished']), $seat($peer, 1, ['status' => 'quarantined'])], $now],
    'countdown enters active' => [[...$room, 'status' => 'countdown', 'starts_at' => Database::timestamp($now), 'deadline_at' => Database::timestamp($now + 30000)], [$seat($owner, 0, ['status' => 'joined']), $seat($peer, 1, ['status' => 'joined'])], $now],
];
foreach ($scenarios as $name => [$scenarioRoom, $rows, $at]) {
    $p = $pair($scenarioRoom, $rows);
    $compare($name, $p, static function (object $service) use ($invoke, $scenarioRoom, $at, $owner): array { $current = $invoke($service, 'settle', $scenarioRoom, $at); return $invoke($service, 'serialize', $current, $owner, false, $at); });
    $check($name.' active reads are narrow and final response is freshly read', array_column($p[3]->memberReads, 'sql') === [ProjectionConnection::ACTIVE, ProjectionConnection::RESPONSE]);
}

// The public waiting rule must still receive full rows, including non-null empty JSON.
$waiting = [...$room, 'status' => 'waiting', 'is_public' => 1, 'starts_at' => null, 'deadline_at' => null];
$untouched = ['status' => 'joined', 'client_session_id' => null, 'events_json' => null, 'evidence_json' => null, 'metrics_json' => null, 'event_hash' => null, 'sequence_count' => 0, 'credited_units' => 0, 'elapsed_ms' => 0.0, 'finished_at' => null, 'last_seen_at' => Database::timestamp($now - 60000)];
$waitingChanges = ['null markers remove' => [], 'client session retains' => ['client_session_id' => 'saved'], 'empty events retains' => ['events_json' => '[]'], 'empty evidence retains' => ['evidence_json' => '{}'], 'empty metrics retains' => ['metrics_json' => '{}'], 'event hash retains' => ['event_hash' => 'hash'], 'finish time retains' => ['finished_at' => Database::timestamp($now)], 'sequence retains' => ['sequence_count' => 1], 'credited retains' => ['credited_units' => 1], 'elapsed retains' => ['elapsed_ms' => 1]];
foreach ($waitingChanges as $name => $changes) {
    $p = $pair($waiting, [$seat($owner, 0, [...$untouched, 'last_seen_at' => Database::timestamp($now)]), $seat($peer, 1, [...$untouched, ...$changes])]);
    $compare('waiting '.$name, $p, static fn(object $service): array => $invoke($service, 'settle', $waiting, $now));
    $check('waiting '.$name.' uses unchanged full member reader', !array_filter($p[3]->memberReads, static fn(array $read): bool => $read['sql'] !== ProjectionConnection::FULL));
    $check('waiting '.$name.' retains evidence or removes only untouched peer', count($p[3]->rows) === ($changes ? 2 : 1));
}
$staleHost = $pair($waiting, [$seat($owner, 0, $untouched), $seat($peer, 1, [...$untouched, 'last_seen_at' => Database::timestamp($now)])]);
$compare('waiting stale host cancels', $staleHost, static fn(object $service): array => $invoke($service, 'settle', $waiting, $now));

// Authoritative lookup still returns canonical JSON for prefix validation and retry.
$p = $pair($room, [$seat($owner, 0), $seat($peer, 1)]);
$compare('authoritative full member', $p, static fn(object $service): array => $invoke($service, 'member', $room, $owner));
$check('authoritative clone retains exact full-row SELECT and all private JSON', $p[3]->memberReads[0]['sql'] === ProjectionConnection::FULL && $p[3]->memberReads[0]['rows'][0] === $seat($owner, 0));
$candidate = ['clientSessionId' => 'private-session-0', 'events' => [['sequence' => 0, 'text' => 'c'], ['sequence' => 1, 'text' => 'a']]];
foreach ([$candidate, [...$candidate, 'events' => [['sequence' => 0, 'text' => 'x']]]] as $index => $evidence) {
    $a = $outcome(static fn(): bool => ArenaRules::prefix($invoke($p[0], 'member', $room, $owner), $evidence));
    $b = $outcome(static fn(): bool => ArenaRules::prefix($invoke($p[1], 'member', $room, $owner), $evidence));
    $check('authoritative prefix growth/conflict parity '.$index, $a === $b && ($index === 0 ? ($a['ok'] && $a['value'] === true) : (!$a['ok'] && $a['code'] === 'arena-prefix')));
}
$a = $outcome(static fn(): array => $invoke($p[0], 'member', $room, 'outsider'));
$b = $outcome(static fn(): array => $invoke($p[1], 'member', $room, 'outsider'));
$check('nonmember rejection parity', $a === $b && !$a['ok'] && $a['code'] === 'arena-membership');

// Public handler: compare all four real clock call sites, writes and fresh snapshots.
$p = $pair($room, [$seat($owner, 0, ['last_seen_at' => Database::timestamp($now - 5000)]), $seat($peer, 1)], [], [$now, $now + 1, $now + 2, $now + 3]);
$handlerAnswers = $compare('get handler current shared-clock flow', $p, static fn(object $service): array => $service->handle('get', ['code' => $room['room_code']], ['id' => $owner]));
$check('get handler preserves four ordered clock reads and commits', $p[3]->clockReads === 4 && !$p[3]->transaction && end($p[3]->trace)['sql'] === 'COMMIT');
$check('get handler keeps authority full between two active projections and final response', array_column($p[3]->memberReads, 'sql') === [ProjectionConnection::ACTIVE, ProjectionConnection::FULL, ProjectionConnection::ACTIVE, ProjectionConnection::RESPONSE]);
$check('post-heartbeat active snapshot sees fresh last_seen_at', ($p[3]->memberReads[2]['rows'][0]['last_seen_at'] ?? null) === Database::timestamp($now + 1));
$check('public response uses last server-clock read', ($handlerAnswers[0]['value']['arena']['serverNow'] ?? null) === $now + 3 && ($handlerAnswers[1]['value']['arena']['serverNow'] ?? null) === $now + 3);

$failed = count(array_filter($checks, static fn(array $row): bool => !$row['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Pure unconnected-PDO original/candidate differential query-projection contract. No real InnoDB lock, optimizer, concurrent HTTP or throughput claim.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false, 'privateConfigurationRead' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
