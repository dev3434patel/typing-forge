<?php
declare(strict_types=1);

use SparowType\ApiException;
use SparowType\AuthService;
use SparowType\DataService;
use SparowType\Database;
use SparowType\RaceService;
use SparowType\Security;
use SparowType\SessionValidator;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
header('X-Frame-Options: DENY');

try {
    $config = require dirname(__DIR__).'/bootstrap.php';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origin !== null) {
        if (!in_array($origin, $config['allowed_origins'], true)) throw new ApiException(403, 'origin', 'This origin is not allowed to access the API.');
        header('Access-Control-Allow-Origin: '.$origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Max-Age: 600');
        http_response_code(204);
        exit;
    }
    if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) throw new ApiException(405, 'method', 'Use GET, POST or DELETE.');
    foreach (['pdo_mysql', 'intl', 'mbstring'] as $extension) {
        if (!extension_loaded($extension)) throw new ApiException(503, 'extension', 'Enable PHP extension '.$extension.' before using the API.');
    }
    Security::beginSession($config);
    $db = Database::connect($config);
    Security::rate($db, $config, 'api', 1200, 60);
    $auth = new AuthService($db, $config);
    $validator = new SessionValidator();
    $data = new DataService($db, $validator, $config);
    $requestPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
    $prefix = rtrim($config['api_prefix'], '/');
    $path = $prefix && ($requestPath === $prefix || str_starts_with($requestPath, $prefix.'/')) ? substr($requestPath, strlen($prefix)) : $requestPath;
    $path = '/'.trim($path, '/');
    $body = [];
    if ($method !== 'GET') {
        Security::verifyCsrf();
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') throw new ApiException(415, 'content-type', 'Send application/json.');
        $stream = fopen('php://input', 'rb');
        $raw = stream_get_contents($stream, (int) $config['max_body_bytes'] + 1);
        fclose($stream);
        if ($raw === false || strlen($raw) > $config['max_body_bytes']) throw new ApiException(413, 'payload-too-large', 'Request body exceeds the 2 MB limit.');
        try {
            $decoded = json_decode($raw, false, 512, JSON_THROW_ON_ERROR);
            if (!$decoded instanceof stdClass) throw new JsonException('The body is not an object.');
            $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new ApiException(400, 'json', 'Send a valid JSON object.');
        }
    }
    if ($method === 'GET' && $path === '/health') {
        $version = $db->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn();
        $result = ['ok' => true, 'backend' => 'php-mysql', 'schemaVersion' => (int) $version];
    } elseif ($method === 'GET' && $path === '/auth/session') {
        $result = $auth->state();
    } elseif ($method === 'POST' && $path === '/auth/signup') {
        $result = $auth->signup($body);
        http_response_code(201);
    } elseif ($method === 'POST' && $path === '/auth/signin') {
        $result = $auth->signin($body);
    } elseif ($method === 'POST' && $path === '/auth/signout') {
        $result = $auth->signout($body);
    } elseif ($method === 'GET' && $path === '/leaderboards/cohorts') {
        $result = $data->cohorts();
    } elseif ($method === 'GET' && $path === '/leaderboards') {
        $result = $data->leaderboards($auth->user(), $_GET);
    } else {
        $user = $auth->requireUser();
        if ($method === 'GET' && isset($_GET['expectedOwner'])) Security::owner($_GET, $user['id']);
        if ($method === 'GET' && $path === '/profile') $result = $data->profile($user);
        elseif ($method === 'POST' && $path === '/profile') $result = $data->updateProfile($user, $body);
        elseif ($method === 'GET' && $path === '/preferences') $result = $data->preferences($user);
        elseif ($method === 'POST' && $path === '/preferences') $result = $data->updatePreferences($user, $body);
        elseif ($method === 'GET' && $path === '/data/version') $result = $data->version($user);
        elseif ($method === 'GET' && $path === '/sessions') $result = $data->history($user, $_GET);
        elseif ($method === 'POST' && $path === '/sessions') {
            Security::rate($db, $config, 'session-submit', 120, 60, $user['id']);
            $result = $data->submit($user, $body);
        } elseif ($method === 'DELETE' && preg_match('~^/sessions/([A-Za-z0-9:_-]{1,128})$~D', $path, $match)) $result = $data->deleteSession($user, $match[1], $body);
        elseif ($method === 'POST' && $path === '/account/delete') {
            $result = $data->deleteAccount($user, $body);
            $auth->reset();
            $result += ['user' => null, 'csrfToken' => Security::csrf()];
        } elseif ($method === 'POST' && preg_match('~^/race/(create|join|get|leave|quick-match|rematch|submit)$~D', $path, $match)) {
            Security::owner($body, $user['id'], false);
            $result = (new RaceService($db, $validator, $data))->handle($match[1], $body, $user);
        } elseif ($method === 'POST' && $path === '/challenges/issue') {
            Security::rate($db, $config, 'challenge', 10, 60, $user['id']);
            Security::owner($body, $user['id'], false);
            $result = (new RaceService($db, $validator, $data))->handle('challenge', $body, $user);
        } else throw new ApiException(404, 'not-found', 'API endpoint not found.');
    }
    session_write_close();
    echo Database::json($result);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    if (session_status() === PHP_SESSION_ACTIVE) session_write_close();
    if ($error instanceof ApiException) {
        http_response_code($error->status);
        $code = $error->errorCode;
        $message = $error->getMessage();
    } elseif ($error instanceof PDOException && in_array((string) $error->getCode(), ['40001', '23000'], true)) {
        http_response_code(409);
        $code = 'conflict';
        $message = 'The operation conflicted with another update. Refresh and retry.';
    } elseif ($error instanceof PDOException) {
        http_response_code(503);
        $code = 'database';
        $message = 'The database is unavailable. Check PHP database configuration and import schema.sql.';
        error_log('SparowType database error: '.$error->getMessage());
    } elseif ($error instanceof InvalidArgumentException || $error instanceof DomainException) {
        http_response_code(422);
        $code = 'validation';
        $message = $error->getMessage();
    } else {
        http_response_code(500);
        $code = 'server';
        $message = 'The server could not complete this request.';
        error_log('SparowType server error: '.$error->getMessage());
    }
    echo json_encode(['error' => ['code' => $code, 'message' => $message]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
