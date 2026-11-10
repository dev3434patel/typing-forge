<?php
declare(strict_types=1);

use SparowType\ApiException;
use SparowType\AuthService;
use SparowType\DataService;
use SparowType\Database;
use SparowType\RaceService;
use SparowType\Security;
use SparowType\SessionValidator;
use SparowType\ProgressionService;
use SparowType\ClassroomService;
use SparowType\RaceStream;
use SparowType\SocialService;
use SparowType\ArenaService;
use SparowType\RequestBody;

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
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Idempotency-Key');
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
    $auth = new AuthService($db, $config);
    $requestPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
    $prefix = rtrim($config['api_prefix'], '/');
    $path = $prefix && ($requestPath === $prefix || str_starts_with($requestPath, $prefix.'/')) ? substr($requestPath, strlen($prefix)) : $requestPath;
    $path = '/'.trim($path, '/');
    $arenaAction = $method === 'POST' && preg_match('~^/arena/(create|join|get|ready|submit|leave|rematch|match|spectate|appeal)$~D', $path, $arenaMatch) ? $arenaMatch[1] : null;
    $arenaUser = Security::apiRate($db, $config, $auth, $arenaAction !== null);
    $body = [];
    if ($method !== 'GET') {
        Security::verifyCsrf();
        $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($contentType !== 'application/json') throw new ApiException(415, 'content-type', 'Send application/json.');
        $stream = fopen('php://stdin', 'rb');
        $raw = stream_get_contents($stream, (int) $config['max_body_bytes'] + 1);
        fclose($stream);
        if ($raw === false || strlen($raw) > $config['max_body_bytes']) throw new ApiException(413, 'payload-too-large', 'Request body exceeds the 2 MB limit.');
        try {
            $body = RequestBody::decode($raw);
        } catch (JsonException) {
            throw new ApiException(400, 'json', 'Send a valid JSON object.');
        }
    }
    $validator = null; $data = null;
    if ($arenaAction === null || $arenaAction === 'submit') {
        $validator = new SessionValidator();
        if ($arenaAction === null || ($body['finish'] ?? false) === true) $data = new DataService($db, $validator, $config);
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
    } elseif ($method === 'POST' && $path === '/classroom/student/join') {
        Security::rate($db, $config, 'classroom-join', 10, 60);
        $result = (new ClassroomService($db, $validator))->join($body);
    } elseif ($method === 'POST' && $path === '/classroom/student/progress') {
        Security::rate($db, $config, 'classroom-progress', 30, 60);
        $result = (new ClassroomService($db, $validator))->progress($body);
    } elseif ($method === 'POST' && $path === '/classroom/student/leave') {
        $result = (new ClassroomService($db, $validator))->leave();
    } else {
        $user = $arenaUser ?? $auth->requireUser();
        if ($method === 'POST' && in_array($path, ['/sessions', '/social/duel-submit'], true)) $data->captureRequestReceipt();
        if ($method === 'GET' && isset($_GET['expectedOwner'])) Security::owner($_GET, $user['id']);
        if ($method === 'GET' && $path === '/profile') $result = $data->profile($user);
        elseif ($method === 'GET' && $path === '/progression') $result = (new ProgressionService($db, $validator))->get($user);
        elseif ($method === 'GET' && $path === '/social') $result = (new SocialService($db, $validator, $data))->list($user);
        elseif ($method === 'POST' && preg_match('~^/social/(request|accept|remove|block|unblock|report|duel-create|duel-accept|duel-cancel|duel-start|duel-submit)$~D', $path, $match)) {
            Security::owner($body, $user['id'], false);
            Security::rate($db, $config, 'social-write', 30, 60, $user['id']);
            $result = (new SocialService($db, $validator, $data))->handle($match[1], $body, $user);
        } elseif ($arenaAction !== null) {
            Security::owner($body, $user['id'], false);
            $result = (new ArenaService($db, $validator, $data))->handle($arenaAction, $body, $user);
        }
        elseif ($method === 'GET' && $path === '/classroom') $result = (new ClassroomService($db, $validator))->list($user);
        elseif ($method === 'GET' && $path === '/race/transport') $result = RaceStream::capabilities($config);
        elseif ($method === 'GET' && $path === '/race/stream') {
            Security::owner($_GET, $user['id'], false);
            Security::rate($db, $config, 'race-stream', 30, 60, $user['id']);
            (new RaceStream($db, new RaceService($db, $validator, $data), $config))->run($user, $_GET);
            exit;
        }
        elseif ($method === 'POST' && in_array($path, ['/classroom/create', '/classroom/delete'], true)) {
            Security::owner($body, $user['id'], false);
            Security::rate($db, $config, 'classroom-manage', 30, 60, $user['id']);
            $classroom = new ClassroomService($db, $validator);
            $result = $path === '/classroom/create' ? $classroom->create($body, $user) : $classroom->remove($body, $user);
        }
        elseif ($method === 'POST' && $path === '/progression/claim') {
            Security::owner($body, $user['id'], false);
            Security::rate($db, $config, 'progression-claim', 120, 60, $user['id']);
            $result = (new ProgressionService($db, $validator))->claim($user, $body, $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '');
        } elseif ($method === 'POST' && $path === '/progression/command') {
            Security::owner($body, $user['id'], false);
            Security::rate($db, $config, 'progression-command', 60, 60, $user['id']);
            $result = (new ProgressionService($db, $validator))->command($user, $body, $_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '');
        }
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
