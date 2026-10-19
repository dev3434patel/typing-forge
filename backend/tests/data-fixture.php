<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$config = require dirname(__DIR__).'/bootstrap.php';
if (!preg_match('/(?:_audit|_test)$/D', $config['database']['name'])) throw new RuntimeException('Fixtures require a dedicated _audit or _test database.');
$db = \SparowType\Database::connect($config);
$input = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$operation = $input['operation'] ?? '';
$owner = $input['owner'] ?? null;
if ($owner !== null) {
    $read = $db->prepare('SELECT email FROM users WHERE id=?');
    $read->execute([$owner]);
    $email = $read->fetchColumn();
    if (!$email || !preg_match('/^http-audit-[a-f0-9]+-(alice|bob|long)@example\.invalid$/D', $email)) throw new RuntimeException('This fixture owns only its explicitly synthetic HTTP audit users.');
}
if ($operation === 'inspect-password') {
    $read = $db->prepare('SELECT password_hash FROM users WHERE id=?');
    $read->execute([$owner]);
    $hash = $read->fetchColumn();
    $result = ['hashed' => is_string($hash) && str_starts_with($hash, 'sha256:$') && strlen($hash) > 60];
} elseif ($operation === 'expire') {
    $update = $db->prepare('UPDATE typing_sessions SET evidence_expires_at=CURRENT_TIMESTAMP(3)-INTERVAL 1 SECOND WHERE user_id=? AND client_session_id=?');
    $update->execute([$owner, $input['sessionId']]);
    $result = ['updated' => $update->rowCount()];
} elseif ($operation === 'storage') {
    $read = $db->prepare('SELECT evidence_json IS NOT NULL evidence_present FROM typing_sessions WHERE user_id=? AND client_session_id=?');
    $read->execute([$owner, $input['sessionId']]);
    $session = $read->fetch();
    $read = $db->prepare('SELECT deleted_at IS NOT NULL deleted FROM submission_receipts WHERE user_id=? AND client_session_id=?');
    $read->execute([$owner, $input['sessionId']]);
    $receipt = $read->fetch();
    $result = ['summaryPresent' => (bool) $session, 'evidencePresent' => $session ? (bool) $session['evidence_present'] : false, 'receiptPresent' => (bool) $receipt, 'receiptDeleted' => $receipt ? (bool) $receipt['deleted'] : false];
} elseif ($operation === 'cleanup-run') {
    $run = $input['run'] ?? '';
    if (!is_string($run) || !preg_match('/^[a-f0-9]{10}$/D', $run)) throw new RuntimeException('An explicit synthetic audit run ID is required.');
    $delete = $db->prepare('DELETE FROM users WHERE email IN(?,?,?)');
    $delete->execute(array_map(static fn(string $role): string => 'http-audit-'.$run.'-'.$role.'@example.invalid', ['alice','bob','long']));
    $result = ['deleted' => $delete->rowCount()];
} elseif ($operation === 'cleanup') {
    $delete = $db->prepare('DELETE FROM users WHERE id=?');
    $delete->execute([$owner]);
    $result = ['deleted' => $delete->rowCount()];
} elseif ($operation === 'reset-audit-rate-limits') {
    // Run test suites sequentially. This table contains only this dedicated
    // database's synthetic requests and is never touched in a normal app DB.
    $result = ['removed' => $db->exec('DELETE FROM rate_limits')];
} else throw new RuntimeException('Unknown fixture operation.');
echo \SparowType\Database::json($result);
