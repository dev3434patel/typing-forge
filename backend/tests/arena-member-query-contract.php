<?php
declare(strict_types=1);
// Pure service/statement contract. No bootstrap, configuration, SQL server or HTTP.
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

final class MemberQueryConnection extends PDO
{
    public array $executed = [];
    public function __construct(public array $rows, public array $handles) {}
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        if (!in_array($query, [
            'SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE',
            'SELECT id,handle FROM users WHERE id IN(?,?,?)',
            'SELECT room_code FROM arena_rooms WHERE rematch_of=?',
        ], true)) throw new RuntimeException('Unexpected member protocol query.');
        return new MemberQueryStatement($this, $query);
    }
}
final class MemberQueryStatement extends PDOStatement
{
    public function __construct(private MemberQueryConnection $db, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $this->db->executed[] = ['sql' => $this->sql, 'params' => $params];
        return true;
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        return str_starts_with($this->sql, 'SELECT * FROM arena_members') ? $this->db->rows : $this->db->handles;
    }
    public function fetchColumn(int $column = 0): mixed { return 'NEXT1234'; }
}

$id = '33333333-3333-4333-8333-333333333333';
$owner = '11111111-1111-4111-8111-111111111111';
$peer = '22222222-2222-4222-8222-222222222222';
$former = '44444444-4444-4444-8444-444444444444';
$now = 1793620800000.0;
$issued = ArenaRules::configuration($id, 30);
$room = ['id' => $id, 'room_code' => 'ABCD1234', 'host_id' => $owner, 'status' => 'completed', 'version' => 9, 'starts_at' => Database::timestamp($now - 30000), 'deadline_at' => Database::timestamp($now), 'duration_seconds' => 30, 'expected_text' => 'calm clear river', 'configuration_json' => Database::json($issued)];
$seat = static fn(string $user, int $slot, array $changes = []): array => [
    'arena_id' => $id, 'user_id' => $user, 'slot' => $slot, 'ready' => 1, 'status' => 'finished',
    'credited_units' => 10, 'accuracy' => 100.0, 'wpm' => 4.0, 'elapsed_ms' => 30000.0, 'rematch_vote' => 1,
    'quarantine_reason' => 'private-'.$user, 'appeal_requested_at' => null,
    'events_json' => '[{"private":"event-'.$user.'"}]', 'evidence_json' => '{"private":"evidence"}',
    'metrics_json' => '{"private":"metrics"}', 'event_hash' => 'private-hash', 'client_session_id' => 'private-session',
    'last_seen_at' => Database::timestamp($now), 'sequence_count' => 10, 'finished_at' => Database::timestamp($now),
    ...$changes,
];
$rows = [$seat($owner, 0), $seat($peer, 1, ['status' => 'quarantined', 'credited_units' => 14, 'accuracy' => 90.0, 'wpm' => 5.6, 'appeal_requested_at' => Database::timestamp($now)]), $seat($former, 2, ['credited_units' => 5, 'wpm' => null, 'accuracy' => null, 'ready' => 0, 'rematch_vote' => 0])];
$handles = [['id' => $peer, 'handle' => 'peer_handle'], ['id' => $owner, 'handle' => 'owner_handle']];
$db = new MemberQueryConnection($rows, $handles);
$validator = new SessionValidator();
$service = new ArenaService($db, $validator, new DataService($db, $validator, []));
$invoke = static fn(string $method, mixed ...$args): mixed => (new ReflectionMethod($service, $method))->invoke($service, ...$args);
$checks = [];
$check = static function (string $name, bool $pass) use (&$checks): void { $checks[] = ['name' => $name, 'pass' => $pass]; };
$memberSql = 'SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE';
$handleSql = 'SELECT id,handle FROM users WHERE id IN(?,?,?)';
$raw = $invoke('members', $room);
$check('internal members retain every full row and original slot order', $raw === $rows);
$check('internal member snapshots issue only the original full-row FOR UPDATE query', $db->executed === [['sql' => $memberSql, 'params' => [$id]]]);
$db->executed = [];
$selected = $invoke('member', $room, $owner);
$check('owner membership retains the exact current full evidence row', $selected === $rows[0]);
$check('owner lookup retains the same all-member lock without querying public handles', $db->executed === [['sql' => $memberSql, 'params' => [$id]]]);
$db->executed = [];
$denied = false;
try { $invoke('member', $room, 'outsider'); } catch (ApiException $error) { $denied = $error->status === 403 && $error->errorCode === 'arena-membership'; }
$check('nonmember remains forbidden without querying public handles', $denied && $db->executed === [['sql' => $memberSql, 'params' => [$id]]]);

// Independent legacy response projection with the exact original field order.
$legacy = static function (array $members, array $publicHandles, string $viewer, bool $spectator) use ($room, $now): array {
    $lookup = array_column($publicHandles, 'handle', 'id');
    foreach ($members as &$member) $member['handle'] = $lookup[$member['user_id']] ?? 'Former member';
    unset($member);
    $placements = ArenaRules::placements($members);
    return ['id' => $room['id'], 'code' => $room['room_code'], 'status' => $room['status'], 'version' => (int)$room['version'], 'hostId' => $room['host_id'], 'serverNow' => $now, 'startsAt' => ArenaRules::milliseconds($room['starts_at']), 'deadlineAt' => ArenaRules::milliseconds($room['deadline_at']), 'durationSeconds' => (int)$room['duration_seconds'], 'targetText' => $room['expected_text'], 'configuration' => Database::decode($room['configuration_json']), 'viewerId' => $viewer, 'spectator' => $spectator, 'rematchCode' => 'NEXT1234', 'reconnectWindowMs' => ArenaRules::RECONNECT_MS,
        'members' => array_map(static fn($member) => ['id' => $member['user_id'], 'handle' => $member['handle'], 'slot' => (int)$member['slot'], 'ready' => (bool)$member['ready'], 'status' => $member['status'], 'progress' => min(100, (int)$member['credited_units'] / max(1, strlen($room['expected_text'])) * 100), 'wpm' => $member['wpm'] === null ? null : (float)$member['wpm'], 'accuracy' => $member['accuracy'] === null ? null : (float)$member['accuracy'], 'placement' => $room['status'] === 'completed' ? ($placements[$member['user_id']] ?? null) : null, 'rematchVote' => (bool)$member['rematch_vote'], ...($member['user_id'] === $viewer ? ['quarantineReason' => $member['quarantine_reason'], 'appealRequested' => $member['appeal_requested_at'] !== null] : [])], $members)];
};
foreach ([[$owner, false], [$peer, false], ['outsider', true]] as [$viewer, $spectator]) {
    $db->executed = [];
    $actual = $invoke('serialize', $room, $viewer, $spectator, $now);
    $check('complete response bytes match legacy projection for '.$viewer, Database::json($actual) === Database::json($legacy($rows, $handles, $viewer, $spectator)));
    $check('serialization alone reads unordered public handles after the same member lock for '.$viewer, $db->executed === [
        ['sql' => $memberSql, 'params' => [$id]], ['sql' => $handleSql, 'params' => [$owner, $peer, $former]], ['sql' => 'SELECT room_code FROM arena_rooms WHERE rematch_of=?', 'params' => [$id]],
    ]);
    $check('private evidence never appears in the public member projection for '.$viewer, !str_contains(Database::json($actual), 'private-event') && !str_contains(Database::json($actual), 'private-hash') && !str_contains(Database::json($actual), 'private-session') && !array_key_exists('events_json', $actual['members'][0]));
    $check('quarantine and appeal details remain visible only to their owner for '.$viewer, array_keys(array_filter($actual['members'], static fn(array $member): bool => array_key_exists('quarantineReason', $member))) === ($viewer === $owner ? [0] : ($viewer === $peer ? [1] : [])));
    $check('missing account retains Former member fallback for '.$viewer, $actual['members'][2]['handle'] === 'Former member');
}
$db->handles = [['id' => $owner, 'handle' => null], ['id' => $peer, 'handle' => 'peer_handle']];
$check('nullable public handle retains the existing Former member fallback', $invoke('serialize', $room, $owner, false, $now)['members'][0]['handle'] === 'Former member');
$db->rows = [];
$db->executed = [];
$empty = $invoke('serialize', $room, 'outsider', true, $now);
$check('empty room avoids an empty IN query and retains the empty member projection', $empty['members'] === [] && $db->executed === [['sql' => $memberSql, 'params' => [$id]], ['sql' => 'SELECT room_code FROM arena_rooms WHERE rematch_of=?', 'params' => [$id]]]);
$check('query projection never mutates the supplied member evidence', $rows[0]['events_json'] === '[{"private":"event-'.$owner.'"}]' && !array_key_exists('handle', $rows[0]));
$failed = count(array_filter($checks, static fn(array $assertion): bool => !$assertion['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Pure PDO member-query and byte-exact legacy public-projection contracts. No actual database locks, HTTP throughput or capacity claim.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false, 'privateConfigurationRead' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
