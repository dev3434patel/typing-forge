<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$config = require dirname(__DIR__).'/bootstrap.php';
$db = \SparowType\Database::connect($config);
$db->beginTransaction();
try {
    $evidence = $db->exec('UPDATE typing_sessions SET evidence_json=NULL WHERE evidence_json IS NOT NULL AND evidence_expires_at<=CURRENT_TIMESTAMP(3)');
    $challenges = $db->exec('DELETE FROM typing_challenges WHERE expires_at<CURRENT_TIMESTAMP(3)-INTERVAL 90 DAY');
    $limits = $db->exec('DELETE FROM rate_limits WHERE window_started<UNIX_TIMESTAMP()-86400');
    $race = $db->prepare('UPDATE race_outcomes SET transcript_events=NULL WHERE transcript_events IS NOT NULL AND accepted_at<=?');
    $race->execute([\SparowType\Database::timestamp((microtime(true) - (int) $config['evidence_retention_days'] * 86400) * 1000)]);
    $db->commit();
    echo \SparowType\Database::json(['expiredReplay' => $evidence, 'expiredRaceReplay' => $race->rowCount(), 'expiredChallenges' => $challenges, 'expiredRateWindows' => $limits]).PHP_EOL;
} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    fwrite(STDERR, "Retention cleanup failed.\n");
    exit(1);
}
