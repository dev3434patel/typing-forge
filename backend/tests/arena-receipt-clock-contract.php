<?php
declare(strict_types=1);
// Real service/validator with a deterministic PDO clock and row protocol.
// No configuration, database connection, network, fake application timer or HTTP.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once __DIR__.'/../src/'.substr($class, strlen($prefix)).'.php';
});
use SparowType\ApiException;
use SparowType\ArenaRules;
use SparowType\ArenaService;
use SparowType\DataService;
use SparowType\Database;
use SparowType\SessionValidator;

final class ReceiptConnection extends PDO
{
    public array $queries = [], $metricWrites = [];
    public int $clockReads = 0;
    private bool $transaction = false;
    public function __construct(public array $room, public array $member, public float $receipt, public float $processing) {}
    public function beginTransaction(): bool { $this->transaction = true; return true; }
    public function commit(): bool { $this->transaction = false; return true; }
    public function rollBack(): bool { $this->transaction = false; return true; }
    public function inTransaction(): bool { return $this->transaction; }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        if ($query !== 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000') throw new RuntimeException('Unexpected receipt query.');
        $this->queries[] = ['sql' => $query, 'transaction' => $this->transaction];
        return new ReceiptStatement($this, $query, ++$this->clockReads === 1 ? $this->receipt : $this->processing);
    }
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $this->queries[] = ['sql' => $query, 'transaction' => $this->transaction];
        return new ReceiptStatement($this, $query);
    }
}
final class ReceiptStatement extends PDOStatement
{
    private array $params = [];
    public function __construct(private ReceiptConnection $db, private string $sql, private ?float $clock = null) {}
    public function execute(?array $params = null): bool
    {
        $this->params = $params ?? [];
        if (str_starts_with($this->sql, 'UPDATE arena_members SET status=?')) {
            $p = $this->params; $this->db->metricWrites[] = Database::decode($p[4]);
            if (!str_contains($this->sql, 'last_seen_at=GREATEST(last_seen_at,?)')) throw new RuntimeException('Monotonic heartbeat update is missing.');
            $this->db->member = [...$this->db->member, 'status' => $p[0], 'client_session_id' => $p[1], 'events_json' => $p[2], 'evidence_json' => $p[3], 'metrics_json' => $p[4], 'event_hash' => $p[5], 'sequence_count' => $p[6], 'credited_units' => $p[7], 'accuracy' => $p[8], 'wpm' => $p[9], 'elapsed_ms' => $p[10], 'last_seen_at' => max($this->db->member['last_seen_at'], $p[11]), 'finished_at' => $p[12], 'quarantine_reason' => $p[13]];
        } elseif (str_starts_with($this->sql, "UPDATE arena_members SET status='finished'")) {
            $this->db->member = [...$this->db->member, 'status' => 'finished', 'elapsed_ms' => $this->params[0], 'wpm' => $this->params[1], 'finished_at' => $this->params[2]];
        } elseif (str_starts_with($this->sql, "UPDATE arena_rooms SET status='completed'")) {
            $this->db->room['status'] = 'completed'; $this->db->room['ended_at'] = $this->params[0];
        } elseif (str_starts_with($this->sql, 'UPDATE arena_rooms SET version')) {
            $this->db->room['version']++;
        } elseif (!str_starts_with($this->sql, 'SELECT ')) throw new RuntimeException('Unexpected receipt mutation.');
        return true;
    }
    public function fetchColumn(int $column = 0): mixed
    {
        if ($this->clock !== null) return $this->clock;
        return str_starts_with($this->sql, 'SELECT id FROM users') ? $this->db->member['user_id'] : false;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        return str_starts_with($this->sql, 'SELECT * FROM arena_rooms') ? $this->db->room : false;
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        if (str_starts_with($this->sql, 'SELECT * FROM arena_members')) return [$this->db->member];
        if (str_starts_with($this->sql, 'SELECT id,handle FROM users')) return [['id' => $this->db->member['user_id'], 'handle' => 'synthetic']];
        throw new RuntimeException('Unexpected receipt row read.');
    }
}

$owner = '11111111-1111-4111-8111-111111111111'; $id = '33333333-3333-4333-8333-333333333333'; $start = 1793102400000;
$issued = ArenaRules::configuration($id, 30);
$config = [...$issued, 'clientSessionId' => 'arena-receipt-proof', 'ownerScope' => $owner, 'initialTarget' => 'calm clear river', 'paused' => false];
$events = [];
foreach (['c', 'a', 'l'] as $index => $text) $events[] = ['sequence' => $index, 'offsetMs' => ($index + 1) * 100, 'start' => $index, 'end' => $index, 'type' => 'insert', 'text' => $text, 'provenance' => 'keyboard'];
$metrics = (new SessionValidator())->replay($config, $events, 1000, ['targetText' => $config['initialTarget'], 'finiteFinal' => false])['metrics'];
$candidate = ['schemaVersion' => 3, 'metricsVersion' => 'forge-v3', 'clientSessionId' => $config['clientSessionId'], 'ownerScope' => $owner, 'configuration' => $config, 'initialTarget' => $config['initialTarget'], 'targetText' => $config['initialTarget'], 'finalText' => 'cal', 'finalTranscript' => 'cal', 'elapsedMs' => 1000, 'wallDurationMs' => 1000, 'startedAtWall' => $start, 'finishedAtWall' => $start + 1000, 'finishReason' => 'manual', 'status' => 'running', 'events' => $events, 'pauseIntervals' => [], 'issuedTargetSegments' => [], 'metrics' => $metrics, 'comparisonKey' => SessionValidator::comparisonKey($config)];
$room = ['id' => $id, 'room_code' => 'ABCD1234', 'host_id' => $owner, 'expected_text' => $config['initialTarget'], 'configuration_json' => Database::json($issued), 'starts_at' => Database::timestamp($start), 'deadline_at' => Database::timestamp($start + 30000), 'duration_seconds' => 30, 'status' => 'active', 'version' => 1];
$member = ['arena_id' => $id, 'user_id' => $owner, 'slot' => 0, 'ready' => 1, 'client_session_id' => null, 'events_json' => null, 'evidence_json' => null, 'metrics_json' => null, 'status' => 'racing', 'last_seen_at' => Database::timestamp($start), 'credited_units' => 0, 'accuracy' => null, 'wpm' => null, 'elapsed_ms' => 0, 'rematch_vote' => 0, 'quarantine_reason' => null, 'appeal_requested_at' => null, 'sequence_count' => 0, 'finished_at' => null];
$body = ['expectedOwner' => $owner, 'code' => $room['room_code'], 'candidate' => $candidate, 'finish' => false, 'receivedAt' => $start + 1, 'serverNow' => $start + 1];
$checks = [];
$run = static function (ReceiptConnection $db, array $request = []) use ($owner, $body): array {
    $validator = new SessionValidator();
    return (new ArenaService($db, $validator, new DataService($db, $validator, [])))->handle('submit', $request ?: $body, ['id' => $owner]);
};
$db = new ReceiptConnection($room, $member, $start + 2000.0, $start + 8000.0); $result = $run($db);
$checks[] = ['name' => 'server receipt is captured before preparation and before the first transaction lock', 'pass' => $db->queries[0]['sql'] === 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000' && $db->queries[0]['transaction'] === false && str_contains($db->queries[1]['sql'], 'FOR UPDATE') && $db->queries[1]['transaction'] === true];
$checks[] = ['name' => 'validation and lock processing time cannot enlarge the event allowance or scoring elapsed', 'pass' => $db->metricWrites[0]['elapsedMs'] === 2000.0 && $db->metricWrites[0]['wpm'] === 18.0];
$checks[] = ['name' => 'body timestamps cannot replace the database receipt', 'pass' => $db->metricWrites[0]['elapsedMs'] !== 1 && $result['arena']['serverNow'] === $start + 8000.0];
$checks[] = ['name' => 'response and post-submit settlement still use the current database clock', 'pass' => $db->clockReads === 3 && $result['arena']['status'] === 'active' && $result['arena']['serverNow'] === $db->processing];
$grace = new ReceiptConnection($room, $member, $start + 32999.0, $start + 34000.0); $graceResult = $run($grace);
$checks[] = ['name' => 'evidence received within grace remains accepted when validation completes after grace', 'pass' => count($grace->metricWrites) === 1 && $grace->metricWrites[0]['elapsedMs'] === 30000];
$checks[] = ['name' => 'the current clock still settles that accepted participant and room after grace', 'pass' => $grace->member['status'] === 'finished' && $graceResult['arena']['status'] === 'completed' && $graceResult['arena']['serverNow'] === $start + 34000.0];
$late = new ReceiptConnection($room, $member, $start + 33001.0, $start + 34000.0); $lateDenied = false;
try { $run($late); } catch (ApiException $error) { $lateDenied = $error->status === 409; }
$checks[] = ['name' => 'a genuinely late receipt is rejected and never written as fresh evidence', 'pass' => $lateDenied && $late->metricWrites === []];
$closed = new ReceiptConnection($room, [...$member, 'status' => 'forfeit'], $start + 2000.0, $start + 8000.0); $closedDenied = false;
try { $run($closed); } catch (ApiException $error) { $closedDenied = $error->errorCode === 'arena-closed'; }
$checks[] = ['name' => 'receipt time cannot reopen a member forfeited by another locked request', 'pass' => $closedDenied && $closed->metricWrites === []];
$future = $body; $future['candidate']['elapsedMs'] = 3000; $future['candidate']['wallDurationMs'] = 3000; $future['candidate']['finishedAtWall'] = $start + 3000;
$future['candidate']['metrics'] = (new SessionValidator())->replay($config, $events, 3000, ['targetText' => $config['initialTarget'], 'finiteFinal' => false])['metrics'];
$futureDb = new ReceiptConnection($room, $member, $start + 2000.0, $start + 8000.0); $futureDenied = false;
try { $run($futureDb, $future); } catch (ApiException $error) { $futureDenied = $error->errorCode === 'arena-time'; }
$checks[] = ['name' => 'later processing cannot make future-at-receipt evidence eligible', 'pass' => $futureDenied && $futureDb->metricWrites === []];
$heartbeat = new ReceiptConnection($room, [...$member, 'last_seen_at' => Database::timestamp($start + 5000)], $start + 2000.0, $start + 8000.0); $run($heartbeat);
$checks[] = ['name' => 'a delayed earlier receipt cannot move a newer accepted heartbeat backwards', 'pass' => $heartbeat->member['last_seen_at'] === Database::timestamp($start + 5000) && $heartbeat->metricWrites[0]['elapsedMs'] === 2000.0];
$newer = new ReceiptConnection($room, [...$member, 'elapsed_ms' => 2500, 'client_session_id' => $candidate['clientSessionId'], 'events_json' => Database::json($events), 'credited_units' => 3, 'last_seen_at' => Database::timestamp($start + 2500)], $start + 2000.0, $start + 8000.0); $newerDenied = false;
try { $run($newer); } catch (ApiException $error) { $newerDenied = $error->errorCode === 'arena-stale-evidence'; }
$checks[] = ['name' => 'a reordered older checkpoint cannot replace newer accepted elapsed or evidence', 'pass' => $newerDenied && $newer->metricWrites === [] && $newer->member['elapsed_ms'] === 2500 && $newer->member['events_json'] === Database::json($events)];
$equal = new ReceiptConnection($room, [...$member, 'elapsed_ms' => 2000.0, 'client_session_id' => $candidate['clientSessionId'], 'events_json' => Database::json($events)], $start + 2000.0, $start + 8000.0); $run($equal);
$checks[] = ['name' => 'equal-timestamp same-prefix interim checkpoints remain valid', 'pass' => count($equal->metricWrites) === 1 && $equal->member['elapsed_ms'] === 2000.0 && $equal->member['events_json'] === Database::json($events)];
$moreEvents = [...$events, ['sequence' => 3, 'offsetMs' => 400, 'start' => 3, 'end' => 3, 'type' => 'insert', 'text' => 'm', 'provenance' => 'keyboard']];
$prefixAhead = new ReceiptConnection($room, [...$member, 'elapsed_ms' => 2500, 'client_session_id' => $candidate['clientSessionId'], 'events_json' => Database::json($moreEvents)], $start + 2000.0, $start + 8000.0); $prefixDenied = false;
try { $run($prefixAhead); } catch (ApiException $error) { $prefixDenied = $error->errorCode === 'arena-prefix'; }
$checks[] = ['name' => 'a reordered request cannot truncate a newer accepted event prefix', 'pass' => $prefixDenied && $prefixAhead->metricWrites === []];
$terminal = new ReceiptConnection([...$room, 'status' => 'completed'], [...$member, 'status' => 'finished', 'elapsed_ms' => 30000, 'evidence_json' => null], $start + 2000.0, $start + 34000.0); $terminalDenied = false;
try { $run($terminal); } catch (ApiException $error) { $terminalDenied = $error->status === 409; }
$checks[] = ['name' => 'a receipt captured earlier cannot resurrect an already completed room or finished member', 'pass' => $terminalDenied && $terminal->metricWrites === [] && $terminal->room['status'] === 'completed' && $terminal->member['status'] === 'finished'];
$failed = count(array_filter($checks, static fn($check) => !$check['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Real ArenaService/SessionValidator with deterministic PDO receipt/current clocks and row protocol. No SQL engine or genuine parallel transaction is simulated.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
