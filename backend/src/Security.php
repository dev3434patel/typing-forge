<?php
declare(strict_types=1);
namespace SparowType;

use PDO;

final class Security
{
    public static function beginSession(array $config): void
    {
        if (strlen($config['app_key'] ?? '') < 32) {
            throw new ApiException(503, 'configuration', 'Set a random SPAROWTYPE_APP_KEY of at least 32 characters in backend configuration.');
        }
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_trans_sid', '0');
        ini_set('session.gc_maxlifetime', (string) $config['session_lifetime']);
        session_name($config['session_name']);
        if (!empty($config['session_save_path'])) session_save_path($config['session_save_path']);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => (bool) $config['cookie_secure'],
            'httponly' => true,
            'samesite' => $config['cookie_samesite'],
        ]);
        if (!session_start()) throw new ApiException(503, 'session-unavailable', 'Session storage is unavailable.');
        $last = $_SESSION['last_activity'] ?? 0;
        if ($last && time() - (int) $last > (int) $config['session_lifetime']) {
            $_SESSION = [];
            session_regenerate_id(true);
        }
        $_SESSION['last_activity'] = time();
        $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
    }

    public static function csrf(): string
    {
        return $_SESSION['csrf'];
    }

    public static function verifyCsrf(): void
    {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($token) || !hash_equals(self::csrf(), $token)) {
            throw new ApiException(403, 'csrf', 'Refresh your session before retrying this request.');
        }
    }

    public static function owner(array $body, string $owner, bool $required = true): void
    {
        if (($required || array_key_exists('expectedOwner', $body)) && ($body['expectedOwner'] ?? null) !== $owner) {
            throw new ApiException(409, 'owner-changed', 'The signed-in account changed. Reopen this workspace before retrying.');
        }
    }

    /** Arena members share networks, not request allowances. Only a live,
     * database-validated session may select the account lane. All other API
     * traffic retains the existing IP allowance, including auth endpoints.
     * Return the validated user so dispatch does not repeat the auth lookup.
     */
    public static function apiRate(PDO $db, array $config, AuthService $auth, bool $arenaRequest): ?array
    {
        $user = $arenaRequest ? $auth->user() : null;
        if ($user !== null) {
            // This stricter Arena allowance subsumes the generic account API
            // budget. Charge it before body/CSRF work, once per request.
            self::rate($db, $config, 'arena-write', 300, 60, $user['id'], false);
        } else {
            self::rate($db, $config, 'api', 1200, 60);
        }
        return $user;
    }

    public static function rate(PDO $db, array $config, string $operation, int $limit, int $window, string $scope = '', bool $includeIp = true): void
    {
        if ($limit < 1 || $window < 1) throw new \InvalidArgumentException('Rate limits and windows must be positive.');
        // Ignore proxy headers. Configure the web server to set REMOTE_ADDR from
        // a trusted proxy if hosting requires it; arbitrary X-Forwarded-For is unsafe.
        $identity = ($includeIp ? ($_SERVER['REMOTE_ADDR'] ?? 'local') : 'account').':'.$scope;
        $key = hash_hmac('sha256', $operation.':'.$identity, $config['app_key']);
        $now = time();
        $windowStart = (int) (floor($now / $window) * $window);
        // LAST_INSERT_ID(expr) returns this connection's exact atomic increment,
        // including the first insert. A subsequent table SELECT can instead see
        // a later concurrent request and reject requests still within budget.
        // A delayed previous-window request must not reset a newer bucket.
        $statement = $db->prepare('INSERT INTO rate_limits(bucket_key,window_started,attempts) VALUES(?,?,LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE attempts=LAST_INSERT_ID(IF(window_started<VALUES(window_started),1,attempts+1)),window_started=GREATEST(window_started,VALUES(window_started))');
        $statement->execute([$key, $windowStart]);
        $attempts = $db->lastInsertId();
        if (!is_string($attempts) || !ctype_digit($attempts) || (int) $attempts < 1) {
            throw new ApiException(503, 'rate-storage', 'Request accounting is unavailable. Retry shortly.');
        }
        if ((int) $attempts > $limit) {
            header('Retry-After: '.max(1, $windowStart + $window - $now));
            throw new ApiException(429, 'rate-limit', 'Too many requests. Wait briefly before retrying.');
        }
    }
}
