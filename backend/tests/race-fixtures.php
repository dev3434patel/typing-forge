<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

use SparowType\Database;

$config = require dirname(__DIR__).'/bootstrap.php';
if (!preg_match('/(?:_test|_audit)$/D', $config['database']['name'] ?? ''))
    throw new RuntimeException('Race fixtures require a dedicated database ending in _test or _audit.');
$db = Database::connect($config);
$body = json_decode(stream_get_contents(STDIN), true, 32, JSON_THROW_ON_ERROR);
$run = $body['run'] ?? '';
if (!is_string($run) || !preg_match('/^[a-f0-9]{12}$/D', $run)) throw new RuntimeException('Invalid fixture run.');
$ids = $body['userIds'] ?? [];
foreach ($ids as $id) {
    $check = $db->prepare('SELECT email FROM users WHERE id=?');
    $check->execute([$id]);
    $email = $check->fetchColumn();
    if (!is_string($email) || !preg_match('/^race-[abc]-'.$run.'@example\.test$/D', $email))
        throw new RuntimeException('Fixture account ownership check failed.');
}
$now = (float) $db->query('SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000')->fetchColumn();
$action = $body['action'] ?? '';
if ($action === 'check') {
    echo Database::json(['database'=>$config['database']['name'],'now'=>$now]);
} elseif ($action === 'room-time') {
    $find = $db->prepare('SELECT * FROM race_sessions WHERE id=?');
    $find->execute([$body['raceId'] ?? '']);
    $room = $find->fetch();
    if (!$room || !in_array($room['host_id'], $ids, true) || !in_array($room['opponent_id'], $ids, true))
        throw new RuntimeException('The room is not owned by this fixture run.');
    $age = $body['ageMs'] ?? null;
    if (!is_int($age) || $age < 0 || $age > 180000) throw new RuntimeException('Invalid fixture time.');
    $start = $now - $age;
    $update = $db->prepare("UPDATE race_sessions SET status='active',started_at=?,deadline_at=?,countdown_started_at=?,version=version+1 WHERE id=?");
    $update->execute([Database::timestamp($start),Database::timestamp($start+(int)$room['duration_seconds']*1000),Database::timestamp($start-3000),$room['id']]);
    echo Database::json(['start'=>round($start),'deadline'=>round($start+(int)$room['duration_seconds']*1000)]);
} elseif ($action === 'challenge-time') {
    $find = $db->prepare('SELECT * FROM typing_challenges WHERE id=?');
    $find->execute([$body['challengeId'] ?? '']);
    $challenge = $find->fetch();
    if (!$challenge || !in_array($challenge['user_id'], $ids, true)) throw new RuntimeException('The challenge is not owned by this fixture run.');
    $issued = Database::decode($challenge['configuration']);
    $start = $now - $issued['durationMs'] - 1000;
    $update = $db->prepare('UPDATE typing_challenges SET issued_at=?,starts_at=?,deadline_at=?,expires_at=? WHERE id=?');
    $update->execute([Database::timestamp($start-3000),Database::timestamp($start),Database::timestamp($start+$issued['durationMs']),Database::timestamp($now+600000),$challenge['id']]);
    echo Database::json(['start'=>round($start)]);
} elseif ($action === 'hold-room') {
    $db->beginTransaction();
    $find = $db->prepare('SELECT host_id FROM race_sessions WHERE id=? FOR UPDATE');
    $find->execute([$body['raceId'] ?? '']);
    if (!in_array($find->fetchColumn(), $ids, true)) throw new RuntimeException('This fixture does not own the room.');
    echo "READY\n";
    flush();
    usleep(700000);
    $db->commit();
    echo Database::json(['releasedAt'=>microtime(true)*1000]);
} elseif ($action === 'stale-host') {
    $find = $db->prepare('SELECT host_id FROM race_sessions WHERE id=?');
    $find->execute([$body['raceId'] ?? '']);
    if (!in_array($find->fetchColumn(), $ids, true)) throw new RuntimeException('This fixture does not own the room.');
    $update = $db->prepare('UPDATE race_sessions SET host_last_seen_at=? WHERE id=?');
    $update->execute([Database::timestamp($now-120000),$body['raceId']]);
    echo Database::json(['stale'=>true]);
} elseif ($action === 'join-room') {
    $owner = $body['owner'] ?? '';
    if (!in_array($owner, $ids, true)) throw new RuntimeException('This fixture does not own the racer.');
    $userQuery = $db->prepare('SELECT id,email,handle FROM users WHERE id=?');
    $userQuery->execute([$owner]);
    $user = $userQuery->fetch();
    $beganAt = microtime(true)*1000;
    try {
        $validator = new \SparowType\SessionValidator();
        $service = new \SparowType\RaceService($db, $validator, new \SparowType\DataService($db, $validator, $config));
        $result = $service->handle('join', ['code'=>$body['code']], $user);
        echo Database::json(['status'=>200,'room'=>$result['room'],'beganAt'=>$beganAt,'finishedAt'=>microtime(true)*1000]);
    } catch (\SparowType\ApiException $cause) {
        echo Database::json(['status'=>$cause->status,'errorCode'=>$cause->errorCode,'beganAt'=>$beganAt,'finishedAt'=>microtime(true)*1000]);
    }
} elseif ($action === 'cleanup') {
    $db->beginTransaction();
    foreach ($ids as $id) {
        $delete = $db->prepare('DELETE FROM users WHERE id=?');
        $delete->execute([$id]);
    }
    $db->commit();
    echo Database::json(['removedSyntheticAccounts'=>count($ids)]);
} else throw new RuntimeException('Unknown fixture action.');
