<?php
declare(strict_types=1);
// Real validator with an in-memory PDO protocol double. No SQL or HTTP service.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once __DIR__.'/../src/'.substr($class, strlen($prefix)).'.php';
});
final class EvidenceConnection extends PDO
{
    public array $queries = [], $updates = [];
    public int $begins = 0, $rollbacks = 0;
    private bool $transaction = false;
    public function __construct() {}
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        if ($query !== 'SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000') throw new RuntimeException('Unexpected clock query.');
        $this->queries[] = $query;
        return new EvidenceClockStatement();
    }
    public function beginTransaction(): bool { $this->begins++; $this->transaction = true; return true; }
    public function inTransaction(): bool { return $this->transaction; }
    public function rollBack(): bool { $this->rollbacks++; $this->transaction = false; return true; }
    public function prepare(string $sql, array $options = []): PDOStatement|false
    {
        $this->queries[] = $sql;
        if (str_starts_with($sql, 'SELECT id FROM users')) throw new RuntimeException('locked-stage-reached');
        if (!str_starts_with($sql, 'UPDATE arena_members SET status=')) throw new RuntimeException('Unexpected evidence query.');
        return new EvidenceStatement($this);
    }
}
final class EvidenceStatement extends PDOStatement
{
    public function __construct(private EvidenceConnection $db) {}
    public function execute(?array $params = null): bool { $this->db->updates[] = $params; return true; }
}
final class EvidenceClockStatement extends PDOStatement
{
    public function __construct() {}
    public function fetchColumn(int $column = 0): mixed { return 1793102402000; }
}
use SparowType\ApiException;
use SparowType\ArenaEvidence;
use SparowType\ArenaRules;
use SparowType\ArenaService;
use SparowType\DataService;
use SparowType\Database;
use SparowType\SessionValidator;

$db = new EvidenceConnection(); $validator = new SessionValidator();
$user = ['id' => '11111111-1111-4111-8111-111111111111'];
$issued = ArenaRules::configuration('33333333-3333-4333-8333-333333333333', 30);
$configuration = [...$issued, 'clientSessionId' => 'arena-lock-evidence', 'ownerScope' => $user['id'], 'initialTarget' => 'calm clear river', 'paused' => false];
$events = [];
foreach (['c', 'a', 'l'] as $index => $text) $events[] = ['sequence' => $index, 'offsetMs' => ($index + 1) * 100, 'start' => $index, 'end' => $index, 'type' => 'insert', 'text' => $text, 'provenance' => 'keyboard'];
$projection = $validator->replay($configuration, $events, 1000, ['targetText' => $configuration['initialTarget'], 'finiteFinal' => false]);
$candidate = ['schemaVersion' => 3, 'metricsVersion' => 'forge-v3', 'clientSessionId' => $configuration['clientSessionId'], 'ownerScope' => $user['id'], 'configuration' => $configuration, 'initialTarget' => $configuration['initialTarget'], 'targetText' => $configuration['initialTarget'], 'finalText' => 'cal', 'finalTranscript' => 'cal', 'elapsedMs' => 1000, 'wallDurationMs' => 1000, 'startedAtWall' => 1793102400000, 'finishedAtWall' => 1793102401000, 'finishReason' => 'manual', 'status' => 'running', 'events' => $events, 'pauseIntervals' => [], 'issuedTargetSegments' => [], 'metrics' => $projection['metrics'], 'comparisonKey' => SessionValidator::comparisonKey($configuration)];
$data = new DataService($db, $validator, []); $evidence = new ArenaEvidence($db, $validator, $data);
$service = new ArenaService($db, $validator, $data); $checks = [];
function checkEvidence(string $name, bool $pass): void { global $checks; $checks[] = ['name' => $name, 'pass' => $pass]; }
function deniedEvidence(Closure $operation, string $code, int $status = 422): bool
{
    try { $operation(); } catch (ApiException $error) { return $error->errorCode === $code && $error->status === $status; }
    return false;
}
$body = ['expectedOwner' => $user['id'], 'code' => 'ABCD1234', 'candidate' => $candidate, 'finish' => false];
$prepared = $evidence->prepare($body, $user);
$reference = (new SessionValidator())->validate($candidate, $user['id'], false, true);
checkEvidence('preparation retains the complete original validation result', $prepared['finish'] === false && $prepared['validated'] === $reference);
checkEvidence('valid candidate preparation performs no database query or transaction', $db->begins === 0 && $db->queries === []);
$invalid = $body; $invalid['candidate']['metrics']['creditedUnits']++;
$rejected = false;
try { $service->handle('submit', $invalid, $user); } catch (InvalidArgumentException $error) { $rejected = $error->getMessage() === 'Replayed metrics differ from the submitted candidate.'; }
checkEvidence('forged client metrics fail before account/room locks after only the server receipt', $rejected && $db->begins === 0 && $db->queries === ['SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000']);
checkEvidence('invalid finish flags still fail before locks', deniedEvidence(fn() => $service->handle('submit', [...$body, 'finish' => 'false'], $user), 'arena-candidate') && $db->begins === 0);
checkEvidence('forged request owners fail before preparation and locks', deniedEvidence(fn() => $service->handle('submit', [...$body, 'expectedOwner' => 'another-account'], $user), 'owner-changed', 409) && $db->begins === 0);
checkEvidence('malformed room codes fail before expensive candidate validation', deniedEvidence(fn() => $service->handle('submit', [...$invalid, 'code' => 'bad'], $user), 'arena-code') && $db->begins === 0);
$reachedLock = false;
try { $service->handle('submit', $body, $user); } catch (RuntimeException $error) { $reachedLock = $error->getMessage() === 'locked-stage-reached'; }
checkEvidence('validated submission retains the actor lock and transaction rollback path', $reachedLock && $db->begins === 1 && $db->rollbacks === 1 && str_contains($db->queries[array_key_last($db->queries)], 'FOR UPDATE'));

$start = $candidate['startedAtWall'];
$room = ['id' => '33333333-3333-4333-8333-333333333333', 'expected_text' => $candidate['targetText'], 'configuration_json' => Database::json($issued), 'starts_at' => Database::timestamp($start), 'deadline_at' => Database::timestamp($start + 30000), 'duration_seconds' => 30, 'status' => 'active'];
$member = ['client_session_id' => null, 'events_json' => null, 'status' => 'racing', 'elapsed_ms' => 0];
$now = $start + 2000;
$changedRoom = $room; $changedRoom['configuration_json'] = Database::json([...$issued, 'language' => 'fr']);
checkEvidence('issued configuration is rechecked at the locked submission boundary', deniedEvidence(fn() => $evidence->submit($changedRoom, $member, $prepared, $user, $now), 'arena-configuration'));
$changedMember = [...$member, 'client_session_id' => $candidate['clientSessionId'], 'events_json' => Database::json([[...$candidate['events'][0], 'text' => 'x']])];
checkEvidence('the current stored event prefix remains immutable', deniedEvidence(fn() => $evidence->submit($room, $changedMember, $prepared, $user, $now), 'arena-prefix', 409));
checkEvidence('an existing member session cannot be replaced after preparation', deniedEvidence(fn() => $evidence->submit($room, [...$member, 'client_session_id' => 'other-session'], $prepared, $user, $now), 'arena-session', 409));
checkEvidence('shared-start mismatch remains rejected', deniedEvidence(fn() => $evidence->submit([...$room, 'starts_at' => Database::timestamp($start + 1)], $member, $prepared, $user, $now), 'arena-start'));
checkEvidence('evidence still cannot exceed the authoritative elapsed allowance', deniedEvidence(fn() => $evidence->submit($room, $member, $prepared, $user, $start + 100), 'arena-time'));
checkEvidence('forfeit status changed during preparation still rejects the submission', deniedEvidence(fn() => $evidence->submit($room, [...$member, 'status' => 'forfeit'], $prepared, $user, $now), 'arena-closed', 409));
checkEvidence('quarantined status changed during preparation still rejects the submission', deniedEvidence(fn() => $evidence->submit($room, [...$member, 'status' => 'quarantined'], $prepared, $user, $now), 'arena-closed', 409));
checkEvidence('a room ended during preparation cannot receive new evidence', deniedEvidence(fn() => $evidence->submit([...$room, 'status' => 'completed'], $member, $prepared, $user, $now), 'arena-inactive', 409));
checkEvidence('the existing finish grace deadline remains enforced', deniedEvidence(fn() => $evidence->submit($room, $member, $prepared, $user, $start + 33001), 'arena-inactive', 409));
checkEvidence('an older receipt cannot regress a newer accepted checkpoint elapsed', deniedEvidence(fn() => $evidence->submit($room, [...$member, 'elapsed_ms' => 2500], $prepared, $user, $now), 'arena-stale-evidence', 409));
$evidence->submit($room, $member, $prepared, $user, $now);
$written = $db->updates[0]; $metrics = Database::decode($written[4]);
$authoritative = $validator->replay($candidate['configuration'], $candidate['events'], 2000.0, ['targetText' => $room['expected_text'], 'finiteFinal' => false]);
checkEvidence('stored metrics still come from a second authoritative server-elapsed replay', $metrics === $authoritative['metrics'] && $metrics['elapsedMs'] === 2000.0 && $metrics['wpm'] !== $prepared['validated']['metrics']['wpm']);
checkEvidence('canonical event sequence and evidence fingerprint remain intact', Database::decode($written[2]) === $candidate['events'] && $written[5] === hash('sha256', Database::json([$room['expected_text'], $candidate['events']])) && $written[6] === count($candidate['events']));
checkEvidence('interim acceptance stores no final evidence or finish timestamp', $written[0] === 'racing' && $written[3] === null && $written[12] === null && $written[15] === $user['id']);
$finalCandidate = [...$candidate, 'elapsedMs' => 30000, 'wallDurationMs' => 30000, 'finishedAtWall' => $start + 30000, 'finishReason' => 'timeout', 'status' => 'finished'];
$finalCandidate['metrics'] = $validator->replay($candidate['configuration'], $candidate['events'], 30000, ['targetText' => $room['expected_text'], 'finiteFinal' => true])['metrics'];
$finalPrepared = $evidence->prepare([...$body, 'candidate' => $finalCandidate, 'finish' => true], $user);
$finalMember = [...$member, 'status' => 'finished', 'elapsed_ms' => 30000, 'client_session_id' => $candidate['clientSessionId'], 'events_json' => Database::json($candidate['events']), 'evidence_json' => Database::json($finalPrepared['validated']['candidate'])];
$writesBefore = count($db->updates);
$evidence->submit([...$room, 'status' => 'completed'], $finalMember, $finalPrepared, $user, $start + 29999);
checkEvidence('an exact finished retry remains idempotent even when its older receipt precedes stored elapsed', count($db->updates) === $writesBefore);
$changedFinal = $finalPrepared; $changedFinal['validated']['candidate']['finishedAtWall']++;
checkEvidence('finished idempotency still rejects changed final evidence', deniedEvidence(fn() => $evidence->submit([...$room, 'status' => 'completed'], $finalMember, $changedFinal, $user, $start + 29999), 'arena-final-conflict', 409) && count($db->updates) === $writesBefore);
$failed = count(array_filter($checks, static fn($check) => !$check['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Real canonical validation plus in-memory PDO lock-boundary and authoritative-replay contracts. Genuine database concurrency and HTTP timing remain separate acceptance.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
