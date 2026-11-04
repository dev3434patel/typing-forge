<?php
declare(strict_types=1);

// Pure class loader and unconnected PDO sentinel. No application bootstrap,
// configuration, network, database connection or filesystem fixture is loaded.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    $name = substr($class, strlen($prefix));
    if (str_starts_with($class, $prefix) && preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $name)) {
        require_once __DIR__.'/../src/'.$name.'.php';
    }
});

use SparowType\DataService;
use SparowType\SessionValidator;

final class CheckpointPersistenceConnection extends PDO
{
    public array $calls = [];
    public function __construct() {}
    private function reached(string $method): never
    {
        $this->calls[] = $method;
        throw new RuntimeException('database-sentinel:'.$method);
    }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false { $this->reached('query'); }
    public function prepare(string $query, array $options = []): PDOStatement|false { $this->reached('prepare'); }
    public function exec(string $statement): int|false { $this->reached('exec'); }
    public function beginTransaction(): bool { $this->reached('beginTransaction'); }
    public function inTransaction(): bool { $this->reached('inTransaction'); }
    public function commit(): bool { $this->reached('commit'); }
    public function rollBack(): bool { $this->reached('rollBack'); }
    public function lastInsertId(?string $name = null): string|false { $this->reached('lastInsertId'); }
    public function getAttribute(int $attribute): mixed { $this->reached('getAttribute'); }
    public function setAttribute(int $attribute, mixed $value): bool { $this->reached('setAttribute'); }
}

$checks = [];
$check = static function (string $name, bool $pass) use (&$checks): void {
    $checks[] = ['name' => $name, 'pass' => $pass];
};
$user = ['id' => '11111111-1111-4111-8111-111111111111'];
$candidate = [
    'configuration' => ['mode' => 'race', 'challengeId' => 'issued-checkpoint-control', 'settings' => ['localBot' => false]],
    'clientSessionId' => 'checkpoint-guard-control', 'finishedAtWall' => 1793102400000,
    'elapsedMs' => 1000, 'pauseIntervals' => [], 'events' => [],
];
$fullShape = [
    'candidate' => $candidate, 'replay' => [], 'metrics' => [], 'timeSeries' => [],
    'comparisonKey' => '{}', 'keySummaries' => [], 'learningEvidence' => [],
    'lateTargetExtension' => false, 'personalBestEligible' => false,
    'payloadHash' => 'sha256:'.hash('sha256', SessionValidator::stablePayload($candidate)),
];

// Convert an unexpected pre-guard candidate dereference into a clean failed
// witness rather than allowing a warning to corrupt the JSON test report.
set_error_handler(static function (int $severity, string $message): never {
    throw new ErrorException($message, 0, $severity);
});

foreach (['true' => true, 'false' => false, 'null' => null, 'zero' => 0, 'empty-string' => '', 'empty-array' => []] as $label => $marker) {
    foreach (['without race override' => [], 'with race override' => ['raceId' => '33333333-3333-4333-8333-333333333333']] as $context => $overrides) {
        $db = new CheckpointPersistenceConnection();
        $service = new DataService($db, new SessionValidator(), []);
        $error = null;
        try { $service->commitValidated($user, $candidate, [...$fullShape, 'checkpointOnly' => $marker], $overrides); }
        catch (Throwable $caught) { $error = $caught; }
        $check('checkpoint marker '.$label.' '.$context.' rejects with the exact persistence error',
            $error instanceof LogicException && $error->getMessage() === 'Checkpoint validation cannot be persisted.');
        $check('checkpoint marker '.$label.' '.$context.' reaches no database method', $db->calls === []);
    }
}

foreach (['true' => true, 'false' => false, 'null' => null] as $label => $marker) {
    $db = new CheckpointPersistenceConnection();
    $service = new DataService($db, new SessionValidator(), []);
    $error = null;
    try { $service->commitValidated([], [], ['checkpointOnly' => $marker], ['raceId' => 'guard-order-control']); }
    catch (Throwable $caught) { $error = $caught; }
    $check('minimal checkpoint marker '.$label.' is rejected before candidate or user access',
        $error instanceof LogicException && $error->getMessage() === 'Checkpoint validation cannot be persisted.');
    $check('minimal checkpoint marker '.$label.' reaches no database method', $db->calls === []);
}

// Positive control: an unmarked full-shaped artifact must proceed beyond this
// specific guard. The sentinel stops it at the first real database call.
$db = new CheckpointPersistenceConnection();
$service = new DataService($db, new SessionValidator(), []);
$error = null;
try { $service->commitValidated($user, $candidate, $fullShape); }
catch (Throwable $caught) { $error = $caught; }
$check('unmarked artifact passes the checkpoint-only guard and reaches the database sentinel',
    $error instanceof RuntimeException && $error->getMessage() === 'database-sentinel:query');
$check('the sentinel records the real receipt-clock access for the unmarked control', $db->calls === ['query']);
restore_error_handler();

$failed = count(array_filter($checks, static fn(array $assertion): bool => !$assertion['pass']));
echo json_encode([
    'status' => $failed ? 'FAILED' : 'PASS-SCOPED',
    'scope' => 'Pure checkpoint artifact persistence rejection and call-order contracts. The unmarked control stops before any actual database connection or persistence.',
    'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks,
    'databaseConnected' => false, 'privateConfigurationRead' => false,
], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
