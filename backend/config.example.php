<?php
declare(strict_types=1);

// Copy to config.php outside the public web root. Environment variables override
// these development defaults. Generate app_key: php -r "echo bin2hex(random_bytes(32));"
return [
    'database' => [
        'host' => getenv('SPAROWTYPE_DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('SPAROWTYPE_DB_PORT') ?: 3306),
        'name' => getenv('SPAROWTYPE_DB_NAME') ?: 'sparowtype',
        'username' => getenv('SPAROWTYPE_DB_USER') ?: 'sparowtype',
        'password' => getenv('SPAROWTYPE_DB_PASSWORD') ?: '',
    ],
    'app_key' => getenv('SPAROWTYPE_APP_KEY') ?: '',
    'api_prefix' => getenv('SPAROWTYPE_API_PREFIX') ?: '/api',
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', getenv('SPAROWTYPE_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:8080,http://127.0.0.1:8080')))),
    'session_name' => 'sparowtype_session',
    'session_lifetime' => 43200,
    // HTTPS is mandatory on a public host. Set to 1 there; 0 permits local XAMPP HTTP.
    'cookie_secure' => getenv('SPAROWTYPE_COOKIE_SECURE') === '1',
    'cookie_samesite' => 'Lax',
    'session_save_path' => getenv('SPAROWTYPE_SESSION_PATH') ?: '',
    'max_body_bytes' => 2000000,
    'evidence_retention_days' => 90,
    'debug' => false,
];
