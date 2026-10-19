<?php
declare(strict_types=1);
namespace SparowType;

use PDO;
use PDOException;

final class AuthService
{
    private const PASSWORD_COST = 12;
    private const DUMMY_HASH = '$2y$12$NCJRr9lOzYv8XCiYbMLsM.0g46PqnWeb62NW11cTeWUQHcYUc3/0S';
    public function __construct(private PDO $db, private array $config) {}

    public function user(): ?array
    {
        if (empty($_SESSION['user_id'])) return null;
        $statement = $this->db->prepare('SELECT id,email,handle,auth_version,created_at FROM users WHERE id=?');
        $statement->execute([$_SESSION['user_id']]);
        $user = $statement->fetch();
        if (!$user || (int) $user['auth_version'] !== (int) ($_SESSION['auth_version'] ?? 0)) {
            $this->reset();
            return null;
        }
        unset($user['auth_version']);
        $user['created_at'] = Database::iso($user['created_at']);
        return $user;
    }

    public function requireUser(): array
    {
        return $this->user() ?? throw new ApiException(401, 'auth-required', 'Sign in to use this account workspace.');
    }

    public function state(): array
    {
        return ['user' => $this->user(), 'csrfToken' => Security::csrf()];
    }

    public function signup(array $body): array
    {
        Security::rate($this->db, $this->config, 'signup', 8, 3600);
        [$email, $password] = $this->credentials($body);
        if (strlen($password) < 10) throw new ApiException(422, 'password', 'Use a password of at least 10 characters.');
        $id = Database::uuid();
        $hash = $this->passwordHash($password);
        $handle = 'typist_'.substr(str_replace('-', '', $id), 0, 16);
        try {
            $statement = $this->db->prepare('INSERT INTO users(id,email,password_hash,handle) VALUES(?,?,?,?)');
            $statement->execute([$id, $email, $hash, $handle]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') throw new ApiException(409, 'account-unavailable', 'An account cannot be created with these details. Try signing in.');
            throw $error;
        }
        $this->authenticate($id, 1);
        return $this->state();
    }

    public function signin(array $body): array
    {
        Security::rate($this->db, $this->config, 'signin-ip', 30, 900);
        [$email, $password] = $this->credentials($body);
        Security::rate($this->db, $this->config, 'signin-account', 12, 900, $email, false);
        $statement = $this->db->prepare('SELECT id,password_hash,auth_version FROM users WHERE email=?');
        $statement->execute([$email]);
        $row = $statement->fetch();
        // A real dummy password hash keeps nonexistent-account verification on
        // the same expensive password_verify path without disclosing accounts.
        $stored = $row ? $row['password_hash'] : 'sha256:'.self::DUMMY_HASH;
        $valid = str_starts_with($stored, 'sha256:') && password_verify(hash('sha256', $password), substr($stored, 7));
        if (!$row || !$valid) throw new ApiException(401, 'invalid-credentials', 'Invalid email or password.');
        if (password_needs_rehash(substr($row['password_hash'], 7), PASSWORD_BCRYPT, ['cost' => self::PASSWORD_COST])) {
            $update = $this->db->prepare('UPDATE users SET password_hash=? WHERE id=?');
            $update->execute([$this->passwordHash($password), $row['id']]);
        }
        $this->authenticate($row['id'], (int) $row['auth_version']);
        return $this->state();
    }

    public function signout(array $body): array
    {
        $user = $this->user();
        if ($user) Security::owner($body, $user['id']);
        $this->reset();
        return ['user' => null, 'csrfToken' => Security::csrf()];
    }

    public function reset(): void
    {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['last_activity'] = time();
    }

    private function authenticate(string $id, int $version): void
    {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['user_id'] = $id;
        $_SESSION['auth_version'] = $version;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['last_activity'] = time();
    }

    private function credentials(array $body): array
    {
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;
        if (!is_string($email) || strlen($email) > 254 || !filter_var($email = strtolower(trim($email)), FILTER_VALIDATE_EMAIL)) {
            throw new ApiException(422, 'email', 'Enter a valid email address.');
        }
        if (!is_string($password) || strlen($password) < 1 || strlen($password) > 128 || str_contains($password, "\0")) {
            throw new ApiException(422, 'password', 'Use a password of 10–128 bytes without null characters.');
        }
        return [$email, $password];
    }

    private function passwordHash(string $password): string
    {
        // Bcrypt's direct input truncates at
        // 72 bytes. A documented fixed-length hexadecimal prehash preserves all
        // 128 allowed bytes, avoids binary nulls and still uses password_hash.
        // Explicit equal cost for real and nonexistent accounts across PHP versions.
        return 'sha256:'.password_hash(hash('sha256', $password), PASSWORD_BCRYPT, ['cost' => self::PASSWORD_COST]);
    }
}
