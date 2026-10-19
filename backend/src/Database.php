<?php
declare(strict_types=1);
namespace SparowType;

use PDO;

final class Database
{
    public static function connect(array $config): PDO
    {
        $db = $config['database'];
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $db['host'], $db['port'], $db['name']);
        $pdo = new PDO($dsn, $db['username'], $db['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
        return $pdo;
    }

    public static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return substr($hex, 0, 8).'-'.substr($hex, 8, 4).'-'.substr($hex, 12, 4).'-'.substr($hex, 16, 4).'-'.substr($hex, 20);
    }

    public static function json(mixed $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
    }

    public static function decode(?string $value, mixed $fallback = null): mixed
    {
        return $value === null ? $fallback : json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    }

    public static function timestamp(?float $milliseconds = null): string
    {
        $milliseconds ??= microtime(true) * 1000;
        $seconds = (int) floor($milliseconds / 1000);
        return gmdate('Y-m-d H:i:s', $seconds).sprintf('.%03d', (int) floor($milliseconds - $seconds * 1000));
    }

    public static function iso(string $mysql): string
    {
        return str_replace(' ', 'T', $mysql).(str_contains($mysql, '.') ? '' : '.000').'Z';
    }
}
