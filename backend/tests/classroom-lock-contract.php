<?php
declare(strict_types=1);
// Pure PDO protocol double: no configuration, network, connection or SQL server.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once __DIR__.'/../src/'.substr($class, strlen($prefix)).'.php';
});
final class ClassroomLockConnection extends PDO
{
    public array $queries = [];
    public function __construct(public bool $blocked = false, public bool $hasMember = true) {}
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $this->queries[] = $query;
        return new ClassroomLockStatement($this, $query);
    }
}
final class ClassroomLockStatement extends PDOStatement
{
    public function __construct(private ClassroomLockConnection $connection, private string $query) {}
    public function execute(?array $params = null): bool
    {
        if (str_starts_with($this->query, 'SELECT id FROM classroom_members') && $this->connection->blocked) throw new RuntimeException('simulated-independent-member-lock');
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        return $this->connection->hasMember ? ['id' => 'member'] : false;
    }
    public function fetchColumn(int $column = 0): mixed { return '11111111-1111-4111-8111-111111111111'; }
}
function classroomAssignment(ClassroomLockConnection $db): array
{
    $service = new \SparowType\ClassroomService($db, new \SparowType\SessionValidator());
    return (new ReflectionMethod($service, 'assignment'))->invoke($service, '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333');
}
$checks = [];
$available = new ClassroomLockConnection(); classroomAssignment($available);
$checks[] = ['name' => 'pending assignment lookup acquires an explicit member FOR UPDATE lock first', 'pass' => count($available->queries) === 2 && str_contains($available->queries[0], 'classroom_members') && str_contains($available->queries[0], 'FOR UPDATE') && str_contains($available->queries[1], 'classroom_assignments')];
$blocked = new ClassroomLockConnection(true); $thrown = false;
try { classroomAssignment($blocked); } catch (RuntimeException $error) { $thrown = $error->getMessage() === 'simulated-independent-member-lock'; }
$checks[] = ['name' => 'a blocked independent member lock prevents any pending assignment lookup or mutation', 'pass' => $thrown && count($blocked->queries) === 1];
$missing = new ClassroomLockConnection(false, false); $denied = false;
try { classroomAssignment($missing); } catch (\SparowType\ApiException $error) { $denied = $error->status === 409 && $error->errorCode === 'classroom-membership'; }
$checks[] = ['name' => 'a disappeared membership cannot receive or create an assignment', 'pass' => $denied && count($missing->queries) === 1];
$failed = count(array_filter($checks, static fn(array $check): bool => !$check['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'Pure PDO interaction contract with a simulated independent lock; real SQL concurrency remains a separate HTTP gate.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
