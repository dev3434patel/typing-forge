<?php
declare(strict_types=1);

// One-time local acceptance support. Never loaded by the application router or
// included in hosting packages. Default invocation previews; --execute clears
// only the explicitly selected loopback auth bucket in this exact audit database.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['execute', 'bucket:']);
$bucket = $options['bucket'] ?? 'signup';
if (!in_array($bucket, ['signup', 'signin'], true)) throw new RuntimeException('Choose an explicit signup or signin audit bucket.');
$operation = $bucket === 'signup' ? 'signup' : 'signin-ip';
$limit = $bucket === 'signup' ? 8 : 30;
$window = $bucket === 'signup' ? 3600 : 900;
$file = dirname(__DIR__).'/audit-config.local.php';
if (!is_file($file)) throw new RuntimeException('The explicit local audit configuration is unavailable.');
putenv('SPAROWTYPE_CONFIG_FILE='.$file);
$config = require dirname(__DIR__).'/bootstrap.php';
if (($config['database']['name'] ?? null) !== 'sparowtype_audit' || (int) ($config['database']['port'] ?? 0) !== 3308 || ($config['database']['host'] ?? null) !== '127.0.0.1') throw new RuntimeException('This operation is restricted to sparowtype_audit on loopback port3308.');
$db = \SparowType\Database::connect($config);
if ($db->query('SELECT DATABASE()')->fetchColumn() !== 'sparowtype_audit' || (int) $db->query('SELECT @@port')->fetchColumn() !== 3308) throw new RuntimeException('The actual server identity differs from the dedicated audit target.');
$key = hash_hmac('sha256', $operation.':127.0.0.1:', $config['app_key']);
$execute = isset($options['execute']);
if ($execute) $db->beginTransaction();
try {
    $statement = $db->prepare('SELECT attempts,window_started FROM rate_limits WHERE bucket_key=?'.($execute ? ' FOR UPDATE' : ''));
    $statement->execute([$key]);
    $row = $statement->fetch();
    $removed = 0;
    if ($execute && $row) {
        $delete = $db->prepare('DELETE FROM rate_limits WHERE bucket_key=?');
        $delete->execute([$key]);
        $removed = $delete->rowCount();
    }
    if ($execute) $db->commit();
    $active = $row && (int) $row['window_started'] === (int) (floor(time() / $window) * $window);
    $report = [
        'date' => gmdate('c'), 'database' => 'sparowtype_audit', 'port' => 3308,
        'purpose' => $bucket === 'signup' ? 'Permit remaining real account browser journeys after repeated synthetic acceptance runs reached the normal signup limit.' : 'Reserve twelve real sign-in requests for the final competition browser confirmation after previous synthetic suites.',
        'scope' => 'Only the loopback '.$bucket.' bucket; no users, results, sessions or other rate buckets changed.',
        'bucket' => $bucket,
        'previewOnly' => !$execute, 'selectedRows' => $row ? 1 : 0,
        'priorAttempts' => $row ? (int) $row['attempts'] : 0, 'removedRows' => $removed,
        'activeWindow' => (bool) $active,
        'remainingBeforeReset' => max(0, $limit - ($active ? (int) $row['attempts'] : 0)),
        'normalLimitUnchanged' => $limit, 'normalWindowSecondsUnchanged' => $window,
        'retained429Evidence' => 'php-data-lifecycle-final.json', 'productionDatabaseTouched' => false,
    ];
    $output = dirname(__DIR__, 2).'/audit/feature-audit-2026-10-19/php-'.$bucket.'-audit-rate-'.($execute ? 'reset' : 'preview').'.json';
    file_put_contents($output, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo json_encode($report, JSON_UNESCAPED_SLASHES).PHP_EOL;
} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    throw $error;
}
