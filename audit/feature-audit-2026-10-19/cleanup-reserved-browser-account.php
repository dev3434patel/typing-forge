<?php
declare(strict_types=1);

// Explicit post-benchmark release support. Default invocation previews and rolls
// back; --execute is the only deletion path. No account identity is emitted.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['execute']);
if (array_diff(array_slice($argv, 1), ['--execute'])) throw new RuntimeException('Only optional --execute is accepted.');
$execute = isset($options['execute']);
$root = dirname(__DIR__, 2);
$file = $root.'/backend/audit-config.local.php';
if (!is_file($file)) throw new RuntimeException('The explicit local audit configuration is required.');
putenv('SPAROWTYPE_CONFIG_FILE='.$file);
$config = require $root.'/backend/bootstrap.php';
if (($config['database']['name'] ?? null) !== 'sparowtype_audit' || ($config['database']['host'] ?? null) !== '127.0.0.1' || (int) ($config['database']['port'] ?? 0) !== 3308 || !str_contains($config['session_name'] ?? '', 'audit')) {
    throw new RuntimeException('This fixture only supports the explicit dedicated audit target on loopback3308.');
}
$db = \SparowType\Database::connect($config);
if ($db->query('SELECT DATABASE()')->fetchColumn() !== 'sparowtype_audit' || (int) $db->query('SELECT @@port')->fetchColumn() !== 3308) throw new RuntimeException('The actual server differs from the guarded audit target.');
$source = file_get_contents(__DIR__.'/cleanup-reserved-browser-account.sql');
if ($source === false) throw new RuntimeException('The finite reviewed SQL source is unavailable.');
preg_match_all('/^-- statement: ([a-z-]+)\R(.*?);(?=\s*(?:-- statement:|$))/ms', $source, $matches, PREG_SET_ORDER);
$sql = [];
foreach ($matches as $match) $sql[$match[1]] = trim($match[2]);
if (array_keys($sql) !== ['account-total','candidate-lock','preference-count','result-count','receipt-count','challenge-count','room-count','outcome-count','delete-locked-candidate']) throw new RuntimeException('The reviewed finite SQL statement list differs from this fixture.');
$db->beginTransaction();
try {
    $total = (int) $db->query($sql['account-total'])->fetchColumn();
    $targets = $db->query($sql['candidate-lock'])->fetchAll(PDO::FETCH_COLUMN);
    if (count($targets) > 1 || $total !== count($targets)) throw new RuntimeException('Unexpected additional accounts exist. No account was deleted.');
    $owned = ['preferences' => 0, 'results' => 0, 'receipts' => 0, 'challenges' => 0, 'rooms' => 0, 'outcomes' => 0];
    if ($targets) {
        $owner = $targets[0];
        foreach (['preferences' => 'preference-count', 'results' => 'result-count', 'receipts' => 'receipt-count', 'challenges' => 'challenge-count', 'rooms' => 'room-count', 'outcomes' => 'outcome-count'] as $label => $statement) {
            $query = $db->prepare($sql[$statement]);
            $query->execute($label === 'rooms' ? [$owner, $owner, $owner] : [$owner]);
            $owned[$label] = (int) $query->fetchColumn();
        }
        if ($owned !== ['preferences' => 1, 'results' => 1, 'receipts' => 1, 'challenges' => 0, 'rooms' => 0, 'outcomes' => 0]) throw new RuntimeException('The known residual account dependencies changed. Nothing was deleted.');
    }
    $deleted = 0;
    if ($execute && $targets) {
        $delete = $db->prepare($sql['delete-locked-candidate']);
        $delete->execute([$targets[0]]);
        $deleted = $delete->rowCount();
        if ($deleted !== 1) throw new RuntimeException('The locked candidate did not match at deletion. The transaction is rolled back.');
    }
    $remaining = (int) $db->query($sql['account-total'])->fetchColumn();
    if ($execute) $db->commit(); else $db->rollBack();
    $report = [
        'date' => gmdate('c'), 'database' => 'sparowtype_audit', 'port' => 3308,
        'taskDateUtc' => '2026-10-19', 'previewOnly' => !$execute,
        'purpose' => 'Remove only the one reserved browser acceptance account and its one-result cascade left by an earlier failed checkpoint after all benchmarks finish.',
        'completeReservedBrowserEmailPatternChecked' => true, 'taskDateChecked' => true,
        'priorAccountCount' => $total, 'eligibleAccountCount' => count($targets),
        'priorEligibleOwnedRowCounts' => $owned, 'deletedAccounts' => $deleted,
        'remainingAccountCount' => $remaining, 'mainDatabaseTouched' => false,
        'unclassifiedAccountsTouched' => false, 'otherRateBucketsOrSessionsTouched' => false,
        'sqlSource' => 'cleanup-reserved-browser-account.sql',
        'identityOrCredentialValuesEmitted' => false,
    ];
    $output = __DIR__.'/php-reserved-browser-account-'.($execute ? 'cleanup' : 'preview').'.json';
    file_put_contents($output, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR).PHP_EOL);
    echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR).PHP_EOL;
} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    throw $error;
}
