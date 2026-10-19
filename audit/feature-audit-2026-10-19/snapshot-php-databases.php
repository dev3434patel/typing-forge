<?php
declare(strict_types=1);

// Release support only: SELECT statements in read-only, consistent transactions.
// No email, identifier, credential, evidence or rate-bucket value is emitted.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['phase:']);
$phase = $options['phase'] ?? '';
if (!in_array($phase, ['preview', 'before-coldstart', 'after-coldstart', 'final'], true)) {
    throw new RuntimeException('Choose --phase=preview, before-coldstart, after-coldstart or final.');
}
$root = dirname(__DIR__, 2);
$mainFile = $root.'/backend/config.php';
$auditFile = $root.'/backend/audit-config.local.php';
if (!is_file($mainFile) || !is_file($auditFile)) throw new RuntimeException('Both explicit private local configurations are required.');
putenv('SPAROWTYPE_CONFIG_FILE='.$mainFile);
$main = require $root.'/backend/bootstrap.php';
$audit = require $auditFile;
$tables = ['users', 'user_preferences', 'typing_sessions', 'submission_receipts', 'typing_challenges', 'race_sessions', 'race_outcomes', 'race_match_locks', 'rate_limits', 'schema_metadata'];
$patterns = [
    'nativeDataHarness' => '^http-audit-[a-f0-9]{10}-(alice|bob|long)@example[.]invalid$',
    'nativeRaceHarness' => '^race-[abc]-[a-f0-9]{12}@example[.]test$',
    'realAccountBrowserHarness' => '^sparowtype-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}@example[.]test$',
    'realCompetitionBrowserHarness' => '^competition-(host|opponent)-[a-f0-9]{12}@example[.]test$',
];
$report = [
    'date' => gmdate('c'), 'phase' => $phase, 'port' => 3308,
    'operation' => 'Read-only aggregate counts; no deletion, update or cleanup.',
    'consistentWithinEachDatabase' => true, 'atomicAcrossBothDatabases' => false,
    'classification' => 'Counts matching complete reserved test-email patterns; no account identity is emitted and no ownership for deletion is inferred.',
    'databases' => [],
];
foreach (['main' => ['sparowtype', $main], 'audit' => ['sparowtype_audit', $audit]] as $role => [$name, $config]) {
    if (!is_array($config) || ($config['database']['host'] ?? null) !== '127.0.0.1' || (int) ($config['database']['port'] ?? 0) !== 3308 || ($config['database']['name'] ?? null) !== $name) {
        throw new RuntimeException('A private configuration differs from the exact dedicated loopback target.');
    }
    $db = \SparowType\Database::connect($config);
    if ($db->query('SELECT DATABASE()')->fetchColumn() !== $name || (int) $db->query('SELECT @@port')->fetchColumn() !== 3308) throw new RuntimeException('Actual database/server identity differs from the guarded target.');
    $db->exec('SET TRANSACTION READ ONLY');
    $db->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    try {
        $counts = [];
        foreach ($tables as $table) $counts[$table] = (int) $db->query('SELECT COUNT(*) FROM `'.$table.'`')->fetchColumn();
        $synthetic = [];
        foreach ($patterns as $label => $pattern) {
            $query = $db->prepare('SELECT COUNT(*) FROM users WHERE BINARY email REGEXP ?');
            $query->execute([$pattern]);
            $synthetic[$label] = (int) $query->fetchColumn();
        }
        $report['databases'][$role] = [
            'database' => $name, 'tableCounts' => $counts,
            'schemaVersion' => (int) $db->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn(),
            'reservedSyntheticAccountCounts' => $synthetic,
            'unclassifiedAccountCount' => $counts['users'] - array_sum($synthetic),
            'rawEvidenceRows' => (int) $db->query('SELECT COUNT(*) FROM typing_sessions WHERE evidence_json IS NOT NULL')->fetchColumn(),
            'rankedResultCount' => (int) $db->query('SELECT COUNT(*) FROM typing_sessions WHERE ranked=1')->fetchColumn(),
            'deletedSubmissionReceiptCount' => (int) $db->query('SELECT COUNT(*) FROM submission_receipts WHERE deleted_at IS NOT NULL')->fetchColumn(),
            'ongoingRoomCount' => (int) $db->query("SELECT COUNT(*) FROM race_sessions WHERE status IN ('waiting','countdown','active')")->fetchColumn(),
        ];
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }
}
$json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
if (file_put_contents(__DIR__.'/php-database-counts-'.$phase.'.json', $json.PHP_EOL) === false) throw new RuntimeException('Could not save the aggregate receipt.');
echo $json.PHP_EOL;
