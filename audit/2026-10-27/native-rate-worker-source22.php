<?php
declare(strict_types=1);
// Explicitly owned native SQL acceptance only. Never loads application bootstrap
// or the original backend configuration; no reset/delete operation exists here.
try {
    if (getenv('SPAROWTYPE_SOURCE22_RATE_NATIVE_ACCEPTANCE') !== '1' || PHP_SAPI !== 'cli') throw new RuntimeException('native-opt-in');
    $request = json_decode((string) fgets(STDIN), true, 32, JSON_THROW_ON_ERROR);
    $owner = getenv('SPAROWTYPE_CAPACITY_OWNER_ID') ?: '';
    $run = $request['runId'] ?? '';
    if (!preg_match('/^[a-f0-9]{16}$/D', $owner) || !is_string($run) || !preg_match('/^[a-f0-9]{12}$/D', $run)) throw new RuntimeException('native-identity');
    $root = realpath(__DIR__.'/../..');
    $owned = realpath($root.'/backend/storage/pack-instance-'.$owner);
    $file = realpath(getenv('ARENA_AUDIT_CONFIG') ?: '');
    if (!$owned || $file !== $owned.DIRECTORY_SEPARATOR.'app-config.php') throw new RuntimeException('native-config-boundary');
    $marker = json_decode((string) file_get_contents($owned.'/ownership.json'), true, 32, JSON_THROW_ON_ERROR);
    if (($marker['id'] ?? null) !== $owner || realpath($marker['root'] ?? '') !== $root || !is_int($marker['runnerPid'] ?? null)) throw new RuntimeException('native-owner-marker');
    $config = require $file;
    $guard = getenv('ARENA_AUDIT_GUARD') ?: '';
    if (!is_array($config) || strlen($guard) < 32 || !hash_equals($config['arena_audit_guard'] ?? '', $guard)) throw new RuntimeException('native-guard');
    if (($config['database']['name'] ?? '') !== 'sparow_pack_'.$owner.'_audit' || ($config['database']['host'] ?? '') !== '127.0.0.1' || in_array((int) ($config['database']['port'] ?? 0), [0, 3306, 3307, 3308, 8081, 4173], true) || realpath($config['session_save_path'] ?? '') !== realpath($owned.'/sessions')) throw new RuntimeException('native-database-boundary');
    spl_autoload_register(static function (string $class) use ($root): void {
        $prefix = 'SparowType\\';
        if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', substr($class, strlen($prefix)))) require_once $root.'/backend/src/'.substr($class, strlen($prefix)).'.php';
    });
    $db = SparowType\Database::connect($config);
    if ($db->query('SELECT DATABASE()')->fetchColumn() !== $config['database']['name']) throw new RuntimeException('native-database-identity');
    $db->exec('SET SESSION innodb_lock_wait_timeout=5');
    $connection = (int) $db->query('SELECT CONNECTION_ID()')->fetchColumn();
    $operation = 'audit-native-rate22:'.$run;
    $identity = static fn(string $actor): string => 'native-rate-'.$run.'-'.$actor;
    $action = $request['action'] ?? '';
    if ($action === 'inspect') {
        $buckets = [];
        foreach (['shared', 'other'] as $actor) {
            $key = hash_hmac('sha256', $operation.':account:'.$identity($actor), $config['app_key']);
            $statement = $db->prepare('SELECT window_started,attempts FROM rate_limits WHERE bucket_key=?');
            $statement->execute([$key]); $row = $statement->fetch();
            $buckets[$actor] = $row ? ['windowStarted' => (int) $row['window_started'], 'attempts' => (int) $row['attempts']] : null;
        }
        echo json_encode(['status' => 'PASS-SCOPED-INSPECTION', 'phpNow' => time(), 'databaseNow' => (int) $db->query('SELECT UNIX_TIMESTAMP()')->fetchColumn(), 'buckets' => $buckets, 'ownerGuarded' => true], JSON_THROW_ON_ERROR)."\n";
    } elseif ($action === 'worker' || $action === 'other') {
        $window = $request['windowStarted'] ?? null;
        if (!is_int($window) || $window % 60 !== 0) throw new RuntimeException('native-window');
        if ($action === 'worker') {
            // Direct CLI descriptor output does not mark HTTP headers as sent;
            // Security::rate must still exercise its real Retry-After path.
            fwrite(STDOUT, json_encode(['stage' => 'ready', 'connectionId' => $connection, 'phpWindow' => intdiv(time(), 60) * 60, 'ownerGuarded' => true], JSON_THROW_ON_ERROR)."\n");
            fflush(STDOUT);
            $start = json_decode((string) fgets(STDIN), true, 16, JSON_THROW_ON_ERROR);
            if (($start['go'] ?? false) !== true || ($start['windowStarted'] ?? null) !== $window) throw new RuntimeException('native-start-barrier');
        }
        $rows = []; $count = $action === 'worker' ? 40 : 1; $actor = $action === 'worker' ? 'shared' : 'other';
        for ($index = 0; $index < $count; $index++) {
            $before = intdiv(time(), 60) * 60; $result = 'admitted';
            try { SparowType\Security::rate($db, $config, $operation, 300, 60, $identity($actor), false); }
            catch (SparowType\ApiException $error) { if ($error->status !== 429 || $error->errorCode !== 'rate-limit') throw new RuntimeException('native-unexpected-api'); $result = 'limited'; }
            // Read immediately, before any other SQL can change this connection's
            // native insert result. Never derive a count from loop position.
            $actual = $db->lastInsertId();
            if (!is_string($actual) || !ctype_digit($actual) || (int) $actual < 1) throw new RuntimeException('native-counter-result');
            $rows[] = ['ordinal' => $index + 1, 'counter' => (int) $actual, 'result' => $result, 'windowBefore' => $before, 'windowAfter' => intdiv(time(), 60) * 60];
        }
        echo json_encode(['stage' => 'complete', 'status' => 'PASS-SCOPED-NATIVE-CALLS', 'connectionId' => $connection, 'calls' => $rows, 'windowStable' => !array_filter($rows, static fn($row) => $row['windowBefore'] !== $window || $row['windowAfter'] !== $window), 'ownerGuarded' => true], JSON_THROW_ON_ERROR)."\n";
    } else throw new RuntimeException('native-action');
} catch (Throwable $error) {
    // Public errors contain a finite audit code, never SQL, config, tokens or
    // exception messages from a connection/driver.
    $code = $error instanceof RuntimeException && str_starts_with($error->getMessage(), 'native-') ? $error->getMessage() : 'native-execution-failed';
    echo json_encode(['status' => 'FAILED', 'code' => $code], JSON_THROW_ON_ERROR)."\n";
    exit(1);
}
