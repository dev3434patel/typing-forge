<?php
declare(strict_types=1);
// Owned-only native lock proof. No normal bootstrap/configuration or HTTP.
$projectRoot = realpath(__DIR__.'/../..');
$configured = getenv('ARENA_AUDIT_CONFIG');
$configPath = is_string($configured) ? realpath($configured) : false;
$normalizedConfigPath = str_replace(chr(92), '/', $configPath ?: '');
if (getenv('SPAROWTYPE_ARENA_MEMBER_DIAGNOSTIC') !== '1' || !$projectRoot || !$configPath || !preg_match('~/pack-instance-([a-f0-9]{16})/app-config\.php$~D', $normalizedConfigPath, $matches)) throw new RuntimeException('Explicit isolated owner required.');
$owner = $matches[1]; $owned = realpath($projectRoot.'/backend/storage/pack-instance-'.$owner);
if (!$owned || $configPath !== $owned.DIRECTORY_SEPARATOR.'app-config.php') throw new RuntimeException('Owned configuration path mismatch.');
$marker = json_decode((string)file_get_contents($owned.'/ownership.json'), true, 512, JSON_THROW_ON_ERROR);
if (($marker['id'] ?? null) !== $owner || realpath($marker['root'] ?? '') !== $projectRoot || !is_int($marker['runnerPid'] ?? null)) throw new RuntimeException('Owned marker mismatch.');
$config = require $configPath;
$guard = getenv('ARENA_AUDIT_GUARD');
if (!is_array($config) || !is_string($guard) || strlen($guard) < 32 || !hash_equals($config['arena_audit_guard'] ?? '', $guard) || ($config['database']['name'] ?? '') !== 'sparow_pack_'.$owner.'_audit' || ($config['database']['host'] ?? '') !== '127.0.0.1' || in_array((int)($config['database']['port'] ?? 0), [0,3306,3307,3308], true) || realpath($config['session_save_path'] ?? '') !== realpath($owned.'/sessions')) throw new RuntimeException('Owned database guard mismatch.');
spl_autoload_register(static function (string $class) use ($projectRoot): void { $prefix = 'SparowType\\'; if (str_starts_with($class, $prefix)) { $relative = substr($class, strlen($prefix)); if (preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $relative)) require_once $projectRoot.'/backend/src/'.$relative.'.php'; } });
$a = SparowType\Database::connect($config); $b = SparowType\Database::connect($config);
if ($a->query('SELECT DATABASE()')->fetchColumn() !== $config['database']['name'] || $b->query('SELECT DATABASE()')->fetchColumn() !== $config['database']['name']) throw new RuntimeException('Connected database mismatch.');
$b->exec('SET SESSION innodb_lock_wait_timeout=1');
$queries = [
    'full' => 'SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE',
    'active' => 'SELECT user_id,status,last_seen_at,credited_units FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE',
    'response' => 'SELECT user_id,slot,ready,status,credited_units,wpm,accuracy,elapsed_ms,rematch_vote,quarantine_reason,appeal_requested_at FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE',
];
$checks = []; $users = []; $rooms = []; $plans = []; $failure = null; $cleanup = null;
$check = static function (string $name, bool $pass, array $detail = []) use (&$checks): void { $checks[] = ['name'=>$name, 'pass'=>$pass, ...($detail ? ['detail'=>$detail] : [])]; };
$run = bin2hex(random_bytes(6));
try {
    $a->beginTransaction();
    for ($index = 0; $index < 16; $index++) {
        $id = SparowType\Database::uuid(); $users[] = $id;
        $q = $a->prepare('INSERT INTO users(id,email,password_hash,handle) VALUES(?,?,?,?)');
        $q->execute([$id, 'member-lock-'.$run.'-'.$index.'@example.test', 'audit-non-login-'.$run, 'lock_'.substr($run,0,8).'_'.$index]);
    }
    for ($roomIndex = 0; $roomIndex < 2; $roomIndex++) {
        $id = SparowType\Database::uuid(); $rooms[] = $id;
        $q = $a->prepare('INSERT INTO arena_rooms(id,room_code,host_id,status,duration_seconds,expected_text,configuration_json,expires_at) VALUES(?,?,?,?,?,?,?,?)');
        $q->execute([$id, strtoupper(bin2hex(random_bytes(4))), $users[$roomIndex*8], 'active', 30, 'calm clear river', SparowType\Database::json(SparowType\ArenaRules::configuration($id,30)), SparowType\Database::timestamp(microtime(true)*1000+600000)]);
        for ($slot = 0; $slot < 8; $slot++) {
            $q = $a->prepare('INSERT INTO arena_members(arena_id,user_id,slot,status,last_seen_at,events_json,evidence_json,metrics_json) VALUES(?,?,?,?,?,?,?,?)');
            $q->execute([$id, $users[$roomIndex*8+$slot], $slot, 'racing', SparowType\Database::timestamp(), '[{"sequence":0}]', '{"audit":true}', '{"creditedUnits":0}']);
        }
    }
    $a->commit();
    foreach ($queries as $name => $sql) {
        $q = $a->prepare('EXPLAIN '.$sql); $q->execute([$rooms[0]]); $plan = $q->fetchAll();
        $plans[$name] = array_map(static fn(array $row): array => ['type'=>$row['type']??null, 'key'=>$row['key']??null, 'rows'=>(int)($row['rows']??0), 'filesort'=>str_contains(strtolower((string)($row['Extra']??'')), 'filesort')], $plan);
    }
    $check('all three native plans use the same access/key/order shape', $plans['full'] === $plans['active'] && $plans['full'] === $plans['response']);
    $blocked = static function (string $sql, array $params) use ($b): array {
        $b->beginTransaction(); $timedOut = false; $code = null;
        try { $q = $b->prepare($sql); $q->execute($params); $q->closeCursor(); }
        catch (PDOException $error) { $code = $error->errorInfo[1] ?? null; $timedOut = $code === 1205; }
        finally { if ($b->inTransaction()) $b->rollBack(); }
        return ['blocked'=>$timedOut, 'nativeCode'=>$code];
    };
    $a->beginTransaction();
    $q = $a->prepare('SELECT id FROM arena_rooms WHERE id=? FOR UPDATE'); $q->execute([$rooms[0]]); $q->fetchAll();
    $q = $a->prepare($queries['full']); $q->execute([$rooms[0]]); $q->fetchAll();
    foreach (['active','response'] as $name) { $result = $blocked($queries[$name], [$rooms[0]]); $check('original full lock blocks '.$name.' projection', $result['blocked'], $result); }
    $a->rollBack();
    foreach ($queries as $name => $sql) {
        $a->beginTransaction();
        $q = $a->prepare('SELECT id FROM arena_rooms WHERE id=? FOR UPDATE'); $q->execute([$rooms[0]]); $q->fetchAll();
        $q = $a->prepare($sql); $q->execute([$rooms[0]]); $rows = $q->fetchAll();
        $check($name.' read contains all eight slots', count($rows) === 8);
        for ($slot = 0; $slot < 8; $slot++) { $result = $blocked('UPDATE arena_members SET ready=ready WHERE arena_id=? AND user_id=?', [$rooms[0],$users[$slot]]); $check($name.' locks member slot'.$slot, $result['blocked'], $result); }
        $result = $blocked('INSERT INTO arena_members(arena_id,user_id,slot,last_seen_at) VALUES(?,?,?,?)', [$rooms[0],$users[8],8,SparowType\Database::timestamp()]);
        $check($name.' parent/member locks block an external new seat', $result['blocked'], $result);
        $result = $blocked('DELETE FROM users WHERE id=?', [$users[1]]);
        $check($name.' member locks block an external account-delete cascade', $result['blocked'], $result);
        $b->beginTransaction();
        try { $q = $b->prepare('UPDATE arena_members SET ready=1-ready WHERE arena_id=? AND user_id=?'); $q->execute([$rooms[1],$users[8]]); $check($name.' leaves other occupied room writable', $q->rowCount() === 1); }
        finally { if ($b->inTransaction()) $b->rollBack(); }
        $a->rollBack();
    }
} catch (Throwable $error) {
    $failure = ['type'=>get_class($error), 'code'=>(string)$error->getCode()];
} finally {
    if ($a->inTransaction()) $a->rollBack(); if ($b->inTransaction()) $b->rollBack();
    try {
        $deleted = 0;
        if ($users) { $q = $a->prepare('DELETE FROM users WHERE id IN('.implode(',',array_fill(0,count($users),'?')).') AND email LIKE ?'); $q->execute([...$users,'member-lock-'.$run.'-%@example.test']); $deleted = $q->rowCount(); }
        $remainingRooms = 0;
        foreach ($rooms as $id) { $q = $a->prepare('SELECT COUNT(*) FROM arena_rooms WHERE id=?'); $q->execute([$id]); $remainingRooms += (int)$q->fetchColumn(); }
        $cleanup = ['deletedOwnedUsers'=>$deleted,'expectedOwnedUsers'=>count($users),'remainingOwnedRooms'=>$remainingRooms];
        $check('exact owned proof users and cascading rooms cleaned', $deleted === count($users) && $remainingRooms === 0);
    } catch (Throwable $error) { $cleanup = ['failed'=>true,'type'=>get_class($error),'code'=>(string)$error->getCode()]; }
}
$failed = count(array_filter($checks, static fn(array $check): bool => !$check['pass']));
$report = ['status'=>$failure === null && $failed === 0 ? 'PASS-SCOPED-NATIVE-LOCKS' : 'FAILED','scope'=>'Owned native plan and all-eight-seat locking checks only; no HTTP latency or cache optimization claim.','checks'=>$checks,'passed'=>count($checks)-$failed,'failed'=>$failed,'plans'=>$plans,'failure'=>$failure,'cleanup'=>$cleanup,'originalConfigRead'=>false,'servicesStartedByThisScript'=>0];
echo json_encode($report, JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
exit($failure === null && $failed === 0 ? 0 : 1);
