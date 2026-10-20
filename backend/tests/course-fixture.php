<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$config = require dirname(__DIR__).'/bootstrap.php';
if (!preg_match('/(?:_audit|_test)$/D', $config['database']['name'] ?? '') || !in_array($config['database']['host'] ?? null, ['127.0.0.1','localhost'], true)) throw new RuntimeException('Course fixtures require an explicit loopback _audit/_test database.');
$db = \SparowType\Database::connect($config);
if ($db->query('SELECT DATABASE()')->fetchColumn() !== $config['database']['name'] || (int) $db->query('SELECT @@port')->fetchColumn() !== (int) $config['database']['port']) throw new RuntimeException('The actual test server differs from its explicit configuration.');
$body = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$run = $body['run'] ?? '';
if (!is_string($run) || !preg_match('/^[a-f0-9]{10}$/D', $run)) throw new RuntimeException('An explicit synthetic course audit run is required.');
$email = 'http-audit-'.$run.'-alice@example.invalid';
$operation = $body['operation'] ?? '';
if ($operation === 'guard') {
    $result = ['database' => $config['database']['name'], 'port' => (int) $config['database']['port'], 'sessionName' => $config['session_name']];
} elseif ($operation === 'cleanup-run') {
    $query = $db->prepare('DELETE FROM users WHERE email=?');
    $query->execute([$email]);
    $result = ['deletedOwnSyntheticAccounts' => $query->rowCount()];
} else {
    $owner = $body['owner'] ?? null;
    $query = $db->prepare('SELECT COUNT(*) FROM users WHERE id=? AND BINARY email=BINARY ?');
    $query->execute([$owner, $email]);
    if ((int) $query->fetchColumn() !== 1) throw new RuntimeException('The requested account does not belong to this exact synthetic run.');
    if ($operation === 'expire-own-evidence') {
        $query = $db->prepare('UPDATE typing_sessions SET evidence_expires_at=CURRENT_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE user_id=? AND client_session_id=?');
        $query->execute([$owner, $body['sessionId'] ?? null]);
        $result = ['updatedOwnEvidenceExpiry' => $query->rowCount()];
    } elseif ($operation === 'inspect-own-evidence') {
        $query = $db->prepare('SELECT accepted_json,evidence_json IS NOT NULL raw_evidence_present FROM typing_sessions WHERE user_id=? AND client_session_id=?');
        $query->execute([$owner, $body['sessionId'] ?? null]);
        $row = $query->fetch();
        $accepted = $row ? \SparowType\Database::decode($row['accepted_json']) : [];
        $result = ['summaryPresent' => (bool) $row, 'rawEvidencePresent' => $row && (bool) $row['raw_evidence_present'], 'courseProjectionPresent' => isset($accepted['course']), 'qualifies' => $accepted['course']['qualifies'] ?? null];
    } else throw new RuntimeException('Unknown bounded course fixture operation.');
}
echo \SparowType\Database::json($result);
