<?php
declare(strict_types=1);
// In-memory PDO protocol tests. No private config, SQL server or network.
spl_autoload_register(static function (string $class): void {
    $prefix = 'SparowType\\';
    if (str_starts_with($class, $prefix)) require_once __DIR__.'/../src/'.substr($class, strlen($prefix)).'.php';
});

final class RateRows { public array $buckets = [], $users = []; }
final class RateConnection extends PDO
{
    public array $queries = [];
    public string|false $insertId = '999';
    public ?Closure $afterIncrement = null;
    public function __construct(public RateRows $rows) {}
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        $this->queries[] = $query;
        return new RateStatement($this, $query);
    }
    public function lastInsertId(?string $name = null): string|false { return $this->insertId; }
}
final class RateStatement extends PDOStatement
{
    private array $params = [];
    public function __construct(private RateConnection $db, private string $sql) {}
    public function execute(?array $params = null): bool
    {
        $this->params = $params ?? [];
        if (str_starts_with($this->sql, 'INSERT INTO rate_limits')) {
            if (!str_contains($this->sql, 'VALUES(?,?,LAST_INSERT_ID(1))') || !str_contains($this->sql, 'attempts=LAST_INSERT_ID(') || !str_contains($this->sql, 'window_started=GREATEST(')) throw new RuntimeException('Atomic result/window protocol is missing.');
            [$key, $window] = $this->params;
            $old = $this->db->rows->buckets[$key] ?? null;
            $count = $old === null || $old['window'] < $window ? 1 : $old['attempts'] + 1;
            $this->db->rows->buckets[$key] = ['window' => max($window, $old['window'] ?? $window), 'attempts' => $count];
            $this->db->insertId = (string) $count;
            $hook = $this->db->afterIncrement;
            $this->db->afterIncrement = null;
            if ($hook !== null) $hook();
        } elseif (!str_starts_with($this->sql, 'SELECT id,email,handle,auth_version,created_at FROM users')) {
            throw new RuntimeException('Unexpected query: rate accounting must not reread a shared counter.');
        }
        return true;
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        return $this->db->rows->users[$this->params[0]] ?? false;
    }
}

use SparowType\ApiException;
use SparowType\AuthService;
use SparowType\Security;

$checks = [];
function checkRate(string $name, bool $pass): void { global $checks; $checks[] = ['name' => $name, 'pass' => $pass]; }
function deniedRate(Closure $operation, int $status = 429, string $code = 'rate-limit'): bool
{
    try { $operation(); } catch (ApiException $error) { return $error->status === $status && $error->errorCode === $code; }
    return false;
}
$directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'sparow-rate-'.bin2hex(random_bytes(8));
if (!mkdir($directory, 0700)) throw new RuntimeException('Could not create owned test session directory.');
ini_set('session.use_cookies', '0'); ini_set('session.gc_probability', '0'); session_save_path($directory);
session_id('rate-contract-'.bin2hex(random_bytes(12)));
if (!session_start()) throw new RuntimeException('Could not start synthetic test session.');
$config = ['app_key' => str_repeat('r', 48)];
$originalServer = $_SERVER;
$_SERVER['REMOTE_ADDR'] = '192.0.2.15';
$rows = new RateRows(); $db = new RateConnection($rows);
$key = static fn(string $operation, string $identity) => hash_hmac('sha256', $operation.':'.$identity, $config['app_key']);
$owner = '11111111-1111-4111-8111-111111111111';
$other = '22222222-2222-4222-8222-222222222222';
$account = static fn(string $id, int $version = 1): array => ['id' => $id, 'email' => 'synthetic@example.invalid', 'handle' => 'synthetic', 'auth_version' => $version, 'created_at' => '2026-10-27 00:00:00.000'];
try {
    Security::rate($db, $config, 'first', 2, 60);
    checkRate('first insert overwrites a stale connection insert ID with exactly one', $db->insertId === '1');
    Security::rate($db, $config, 'first', 2, 60);
    checkRate('exact boundary remains admitted', $db->insertId === '2');
    checkRate('next atomic increment is denied without filtering its attempt', deniedRate(fn() => Security::rate($db, $config, 'first', 2, 60)) && $db->insertId === '3');
    checkRate('limiter uses one write and no shared-row read per request', count($db->queries) === 3 && count(array_filter($db->queries, static fn($sql) => str_starts_with($sql, 'INSERT INTO rate_limits'))) === 3);

    $a = new RateConnection($rows); $b = new RateConnection($rows); $secondDenied = false;
    $a->afterIncrement = static function () use ($b, $config, &$secondDenied): void { $secondDenied = deniedRate(fn() => Security::rate($b, $config, 'overlap', 1, 60)); };
    Security::rate($a, $config, 'overlap', 1, 60);
    checkRate('overlapping connections keep their own increment result at the quota boundary', $a->insertId === '1' && $b->insertId === '2' && $secondDenied);

    $sql = $db->queries[0]; $statement = $db->prepare($sql);
    $statement->execute(['window-probe', 120]); $statement->execute(['window-probe', 180]);
    checkRate('a later fixed window starts at one', $db->insertId === '1' && $rows->buckets['window-probe']['window'] === 180);
    $statement->execute(['window-probe', 120]);
    checkRate('a delayed older-window request cannot reset the newer allowance', $db->insertId === '2' && $rows->buckets['window-probe']['window'] === 180);

    $_SESSION = [];
    $guest = Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('anonymous Arena traffic retains the original IP bucket', $guest === null && ($rows->buckets[$key('api', '192.0.2.15:')]['attempts'] ?? 0) === 1);
    $_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.99';
    Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('untrusted forwarded addresses cannot select a new allowance', ($rows->buckets[$key('api', '192.0.2.15:')]['attempts'] ?? 0) === 2);

    $rows->users[$owner] = $account($owner);
    $_SESSION = ['user_id' => $owner, 'auth_version' => 1];
    $user = Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('a DB-validated active session receives one early Arena allowance without a redundant API write', $user['id'] === $owner && !isset($user['auth_version']) && ($rows->buckets[$key('arena-write', 'account:'.$owner)]['attempts'] ?? 0) === 1 && !isset($rows->buckets[$key('api', 'account:'.$owner)]));
    checkRate('body owner spoofing cannot authorize a different account', deniedRate(fn() => Security::owner(['expectedOwner' => $other], $user['id'], false), 409, 'owner-changed') && !isset($rows->buckets[$key('arena-write', 'account:'.$other)]));
    $queriesBefore = count($db->queries);
    Security::apiRate($db, $config, new AuthService($db, $config), false);
    checkRate('non-Arena and authentication endpoints keep their original IP policy', count($db->queries) === $queriesBefore + 1 && ($rows->buckets[$key('api', '192.0.2.15:')]['attempts'] ?? 0) === 3);

    $_SESSION = ['user_id' => $owner, 'auth_version' => 0];
    $stale = Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('stale auth_version sessions lose the account lane and remain IP limited', $stale === null && !isset($_SESSION['user_id']) && $rows->buckets[$key('arena-write', 'account:'.$owner)]['attempts'] === 1);
    $_SESSION = ['user_id' => $other, 'auth_version' => 1];
    $deleted = Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('forged or deleted session owners cannot create an authenticated lane', $deleted === null && !isset($_SESSION['user_id']) && !isset($rows->buckets[$key('arena-write', 'account:'.$other)]));

    for ($index = 0; $index < 400; $index++) {
        $id = sprintf('%08x-3333-4333-8333-333333333333', $index);
        $rows->users[$id] = $account($id);
        $_SESSION = ['user_id' => $id, 'auth_version' => 1];
        for ($request = 0; $request < 4; $request++) Security::apiRate($db, $config, new AuthService($db, $config), true);
    }
    checkRate('400 validated NAT-shared accounts retain independent bounded lanes', count(array_filter($rows->buckets, static fn($bucket) => $bucket['attempts'] === 4)) === 400 && $rows->buckets[$key('api', '192.0.2.15:')]['attempts'] === 5);
    $_SESSION = ['user_id' => $owner, 'auth_version' => 1];
    for ($request = 0; $request < 299; $request++) {
        $_SERVER['REMOTE_ADDR'] = $request % 2 ? '198.51.100.1' : '203.0.113.1';
        Security::apiRate($db, $config, new AuthService($db, $config), true);
    }
    checkRate('the unchanged early Arena300 limit is account-wide across changing IPs', deniedRate(fn() => Security::apiRate($db, $config, new AuthService($db, $config), true)) && $rows->buckets[$key('arena-write', 'account:'.$owner)]['attempts'] === 301);
    $rows->users[$other] = $account($other); $_SESSION = ['user_id' => $other, 'auth_version' => 1];
    Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('one exhausted account cannot consume another account allowance', $rows->buckets[$key('arena-write', 'account:'.$other)]['attempts'] === 1);
    $badCsrfOwner = '44444444-4444-4444-8444-444444444444'; $rows->users[$badCsrfOwner] = $account($badCsrfOwner);
    $_SESSION = ['user_id' => $badCsrfOwner, 'auth_version' => 1, 'csrf' => str_repeat('c', 64)];
    $_SERVER['HTTP_X_CSRF_TOKEN'] = 'incorrect'; $csrfDenied = 0;
    for ($request = 0; $request < 300; $request++) {
        Security::apiRate($db, $config, new AuthService($db, $config), true);
        if (deniedRate(fn() => Security::verifyCsrf(), 403, 'csrf')) $csrfDenied++;
    }
    checkRate('authenticated invalid-CSRF traffic still consumes the early Arena300 quota', $csrfDenied === 300 && deniedRate(fn() => Security::apiRate($db, $config, new AuthService($db, $config), true)) && $rows->buckets[$key('arena-write', 'account:'.$badCsrfOwner)]['attempts'] === 301);
    $_SERVER['REMOTE_ADDR'] = '192.0.2.99'; $_SESSION = [];
    for ($request = 0; $request < 1200; $request++) Security::apiRate($db, $config, new AuthService($db, $config), true);
    checkRate('the unchanged anonymous IP1200 boundary remains enforced', deniedRate(fn() => Security::apiRate($db, $config, new AuthService($db, $config), true)));
    for ($request = 0; $request < 30; $request++) Security::rate($db, $config, 'signin-ip', 30, 900);
    checkRate('authentication endpoint abuse limits retain independent IP buckets', deniedRate(fn() => Security::rate($db, $config, 'signin-ip', 30, 900)));
    $broken = new RateConnection($rows); $broken->afterIncrement = static function () use ($broken): void { $broken->insertId = '0'; };
    checkRate('an unavailable atomic count fails closed', deniedRate(fn() => Security::rate($broken, $config, 'broken', 10, 60), 503, 'rate-storage'));
    $invalid = false; try { Security::rate($db, $config, 'invalid', 1, 0); } catch (InvalidArgumentException) { $invalid = true; }
    checkRate('invalid internal windows fail before SQL', $invalid);
} finally {
    $_SESSION = []; session_destroy();
    $_SERVER = $originalServer;
    foreach (glob($directory.DIRECTORY_SEPARATOR.'sess_*') ?: [] as $file) unlink($file);
    if (!rmdir($directory)) throw new RuntimeException('Owned test session cleanup failed.');
}
$failed = count(array_filter($checks, static fn($check) => !$check['pass']));
echo json_encode(['status' => $failed ? 'FAILED' : 'PASS-SCOPED', 'scope' => 'In-memory PDO and synthetic-session protocol: identity isolation, auth-version checks and interleaved atomic results. Genuine MySQL/MariaDB SQL concurrency and HTTP capacity require separate acceptance.', 'passed' => count($checks) - $failed, 'failed' => $failed, 'checks' => $checks, 'databaseConnected' => false], JSON_THROW_ON_ERROR);
exit($failed ? 1 : 0);
