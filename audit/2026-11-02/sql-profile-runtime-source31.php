<?php
declare(strict_types=1);
namespace SparowTypeAudit;

use PDO;
use PDOStatement;

/** Audit-only native-call clocks. No SQL, parameters, rows or credentials leave PHP. */
final class SqlProfile
{
    private static bool $active = false;
    private static int $started = 0;
    private static int $sqlDepth = 0;
    private static array $metrics = [];
    private static bool $overflow = false;
    public static function begin(int $started): void
    {
        self::$started = $started;
        self::$metrics = [];
        self::$sqlDepth = 0;
        self::$overflow = false;
        self::$active = true;
    }
    private static function record(string $name, float $ms, bool $error): void
    {
        if (!self::$active) return;
        // Labels originate only from the fixed calls/categories below.
        if (!preg_match('/^[a-z_]{1,48}$/D', $name) || !is_finite($ms) || $ms < 0 || count(self::$metrics) >= 48 && !isset(self::$metrics[$name])) {
            self::$overflow = true;
            return;
        }
        self::$metrics[$name] ??= ['ms' => 0.0, 'calls' => 0, 'errors' => 0];
        self::$metrics[$name]['ms'] += $ms;
        self::$metrics[$name]['calls']++;
        if ($error) self::$metrics[$name]['errors']++;
    }
    public static function stage(string $name, callable $operation): mixed
    {
        if (!self::$active) return $operation();
        $at = hrtime(true);
        $error = true;
        try { $value = $operation(); $error = false; return $value; }
        finally { self::record('stage_'.$name, (hrtime(true) - $at) / 1000000, $error); }
    }
    public static function sql(string $method, string $category, callable $operation): mixed
    {
        if (!self::$active) return $operation();
        $at = hrtime(true);
        $error = true;
        $outermost = self::$sqlDepth++ === 0;
        try { $value = $operation(); $error = false; return $value; }
        finally {
            self::$sqlDepth--;
            $ms = (hrtime(true) - $at) / 1000000;
            self::record($outermost ? 'sql_'.$method : 'sql_nested', $ms, $error);
            if ($outermost && in_array($method, ['execute', 'query', 'exec'], true)) self::record('sqlcat_'.$category, $ms, $error);
        }
    }
    public static function category(string $sql): string
    {
        if (str_starts_with($sql, 'SELECT id FROM users WHERE') && str_contains($sql, 'FOR UPDATE')) return 'owner_lock';
        if (str_starts_with($sql, 'SELECT * FROM arena_rooms') && str_contains($sql, 'FOR UPDATE')) return 'room_lock';
        if (str_starts_with($sql, 'SELECT * FROM arena_members') && str_contains($sql, 'FOR UPDATE')) return 'member_lock';
        if (str_contains($sql, 'rate_limits')) return 'rate';
        if (str_starts_with($sql, 'SELECT UNIX_TIMESTAMP')) return 'clock';
        if (str_starts_with($sql, 'SELECT id,email,handle,auth_version,created_at FROM users')) return 'auth';
        if (preg_match('/^(?:INSERT|UPDATE|DELETE) /D', $sql)) return 'write';
        return 'other';
    }
    public static function emit(): void
    {
        if (!self::$active) return;
        self::record('php_total', (hrtime(true) - self::$started) / 1000000, false);
        self::record('profile_marker', 31.0, false);
        self::record('profile_overflow', self::$overflow ? 1.0 : 0.0, false);
        $metrics = [];
        ksort(self::$metrics);
        foreach (self::$metrics as $name => $value) $metrics[] = $name.';dur='.number_format($value['ms'], 3, '.', '').';desc="n='.$value['calls'].',err='.$value['errors'].'"';
        $header = implode(', ', $metrics);
        self::$active = false;
        // Failure to emit a bounded marker is detected by the independent reader.
        if (strlen($header) <= 6000 && !headers_sent()) header('Server-Timing: '.$header, true);
    }
}

final class ProfiledPDO extends PDO
{
    public function __construct(string $dsn, ?string $username = null, ?string $password = null, ?array $options = null)
    {
        SqlProfile::sql('connect', 'other', fn() => parent::__construct($dsn, $username, $password, $options));
        if (!parent::setAttribute(PDO::ATTR_STATEMENT_CLASS, [ProfiledStatement::class, []])) throw new \RuntimeException('Diagnostic native statement instrumentation is unavailable.');
    }
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        return SqlProfile::sql('prepare', SqlProfile::category($query), fn() => parent::prepare($query, $options));
    }
    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        return SqlProfile::sql('query', SqlProfile::category($query), fn() => parent::query($query, $fetchMode, ...$fetchModeArgs));
    }
    public function exec(string $statement): int|false
    {
        return SqlProfile::sql('exec', SqlProfile::category($statement), fn() => parent::exec($statement));
    }
    public function beginTransaction(): bool
    {
        return SqlProfile::sql('begin', 'other', fn() => parent::beginTransaction());
    }
    public function commit(): bool
    {
        return SqlProfile::sql('commit', 'other', fn() => parent::commit());
    }
    public function rollBack(): bool
    {
        return SqlProfile::sql('rollback', 'other', fn() => parent::rollBack());
    }
}

final class ProfiledStatement extends PDOStatement
{
    protected function __construct() {}
    public function execute(?array $params = null): bool
    {
        return SqlProfile::sql('execute', SqlProfile::category($this->queryString), fn() => parent::execute($params));
    }
    public function fetch(int $mode = PDO::FETCH_DEFAULT, int $cursorOrientation = PDO::FETCH_ORI_NEXT, int $cursorOffset = 0): mixed
    {
        return SqlProfile::sql('fetch', 'other', fn() => parent::fetch($mode, $cursorOrientation, $cursorOffset));
    }
    public function fetchAll(int $mode = PDO::FETCH_DEFAULT, mixed ...$args): array
    {
        return SqlProfile::sql('fetch', 'other', fn() => parent::fetchAll($mode, ...$args));
    }
    public function fetchColumn(int $column = 0): mixed
    {
        return SqlProfile::sql('fetch', 'other', fn() => parent::fetchColumn($column));
    }
}
