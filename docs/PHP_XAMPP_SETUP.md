# SparowType: PHP + MySQL setup

Updated 19 October 2026. The active app uses PHP and MySQL/MariaDB. phpMyAdmin imports and manages the database; PHP serves the API. Node is needed for frontend development/builds, not on the hosting server. The old `supabase/` directory is retained as historical implementation and replay-reference material; it is not the running backend.

## Requirements

- Node 22.12+ and npm 10+ to build the frontend.
- PHP 8.2+ with `pdo_mysql`, `intl`, `mbstring`, sessions, JSON and OpenSSL/random support. Enable these in the PHP installation used by Apache, then restart Apache. The API checks its required extensions rather than silently changing Unicode scoring.
- MySQL 8.0+ or MariaDB 10.4+, InnoDB, `utf8mb4`. XAMPP supplies MariaDB, PHP, Apache and phpMyAdmin.
- For Apache hosting: `mod_rewrite`, permission to use the included `.htaccess`, and HTTPS.

## Local database through phpMyAdmin

1. Start **MySQL** and **Apache** in the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin`. Create a new database named `sparowtype` using `utf8mb4_unicode_ci`.
3. Select that database, choose **Import**, select `backend/schema.sql`, then run the import. The SQL creates tables, indexes, foreign keys and schema metadata. It creates no example users or scores and contains no database password. Importing into an existing unrelated application's database is inappropriate.
4. In phpMyAdmin **User accounts**, create a dedicated application user scoped to `sparowtype`. Grant `SELECT`, `INSERT`, `UPDATE`, `DELETE` on that database. Schema installation is a separate administrator operation; the application user does not need `GRANT`, `DROP`, `CREATE USER` or global rights.
5. Copy `backend/config.example.php` to `backend/config.php`. Set the actual database host, port, database, username and password. Set `app_key` to a fresh random value of at least 32 characters. Generate one with `php -r "echo bin2hex(random_bytes(32));"`. Keep this file private; Git ignores it.

The optional CLI installer provides the same initial import for an already created empty database: `php backend/bin/install-schema.php --config=/absolute/private/admin-config.php --database=sparowtype --check`, then the same command with `--install`. It requires explicit matching database/config arguments and refuses every nonempty database. Use separate administrator credentials for schema installation; the restricted runtime user intentionally cannot create tables.

The local default DB port is 3306. Use the port shown by your own XAMPP installation. The development API listens on 8081 and Vite listens on 8080. Port numbers have different purposes; the browser never connects directly to MySQL.

The local environment audited on 19 October had an existing damaged `mysql.db` permissions table on 3306 and an unrelated server on 3307. Its isolated test database runs on **3308**, using XAMPP's MariaDB binary and ignored storage under `backend/storage/mysql`. The generated local config uses that port. Existing database files were not repaired or removed. On another machine use its normal healthy XAMPP instance and import the supplied schema.

For this prepared checkout, restart its isolated database after a reboot with:

```sh
npm run backend:db
```

Leave that terminal running, then start the PHP API and frontend in separate terminals as shown below. The helper uses only the initialized workspace data directory and its ownership marker. It reports an already running verified instance, refuses an unrelated process on port 3308, and never initializes, repairs or deletes a database. A fresh clone without that private marker must use the normal phpMyAdmin setup above. `node scripts/start-local-mysql.mjs --check` checks the instance without starting it.

The XAMPP Control Panel's usual MySQL button targets its configured default service; it does not restart this separate workspace instance. On **this machine**, phpMyAdmin must select a server configured for **127.0.0.1, port 3308** to manage the prepared SparowType databases. A default phpMyAdmin server on port 3306 is a different instance. Select or configure the matching phpMyAdmin server yourself; the helper does not change global phpMyAdmin configuration. Healthy installations on other machines can continue using their normal Control Panel service and port 3306.

The prepared instance passed an actual graceful shutdown and cold start during the final audit. The normal private config selects the main **`sparowtype`** database; the separate **`sparowtype_audit`** database was used only for synthetic acceptance checks. The API was restored to the main configuration afterward. Both begin with no demonstration accounts or fabricated results.

## Run locally

```sh
npm ci
npm run backend:dev
```

Leave that terminal running. In a second terminal:

```sh
npm run dev
```

Open `http://localhost:8080`. Vite forwards `/api` to the PHP server. If the PHP server uses another address, set `SPAROWTYPE_PHP_URL` for the Vite process. `SPAROWTYPE_PHP_PORT` changes the local PHP port. `PHP_BINARY` selects a PHP executable when it is not on PATH. The helper discovers `C:/xampp/php/php.exe` on Windows and loads its own required extensions without conflicting global PHP configuration.

For a production frontend preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Keep PHP running. Visit `http://127.0.0.1:4173/api/health`; a configured database returns `ok: true`, `backend: php-mysql` and the schema version. A blank database intentionally starts with empty history and rankings. Create an account through the app to populate it with your own results.

Email/password signup signs in immediately. Passwords are hashed on the server. There is currently no email delivery, email verification, password-reset flow or OAuth provider integration; those require a separately configured mail/provider service. The UI does not advertise a working Google login. Guest typing and device history continue offline without an account API.

This is a fresh account backend. It does not import a previous Supabase installation's passwords or account IDs. Existing device data is preserved in its original owner scope; guest history can be explicitly imported through Profile. Old account-scoped records are not silently reassigned to a newly created PHP account. Migrating a previous live account database requires a separate verified export and identity mapping.

## Build for PHP hosting

Set `SPAROWTYPE_SITE_URL` to your actual HTTPS origin before building so the sitemap and canonical metadata use it. Keep the default public API path `/api` for this deployment layout. Then run:

```sh
npm run build:hosting
```

The generated folder contains:

```text
hosting-build/
  public_html/                 # Frontend and the public /api entry point
    index.html
    assets/
    api/index.php
    api/.htaccess
    .htaccess
  sparowtype-private/           # Must be outside the site's public document root
    bootstrap.php
    config.example.php
    schema.sql
    src/
    public/
    bin/cleanup.php
  SETUP.md
```

Upload the **contents** of `public_html` into your domain document root. Put `sparowtype-private` beside that document root, preserving the relative directory layout. The API wrapper loads that private directory. The build script excludes local config files, test data, session files and database storage. No credentials are copied into the package.

Rebuilding stages a fresh package. A previous `hosting-build` is preserved under ignored `hosting-archive`; upload only the newly generated `hosting-build`, never the archive. This prevents obsolete assets or credentials manually placed in an old package from leaking into a new delivery.

Create a database/user in your hosting control panel and import `sparowtype-private/schema.sql` using its phpMyAdmin. Hosting may prefix both names; use the exact resulting names in a new private `config.php`. Configure:

- `database`: your hosting database credentials.
- `app_key`: a new production random secret, different from development.
- `allowed_origins`: your exact HTTPS origin, including `www` only if you actually serve it. Defaults allow only local development URLs.
- `cookie_secure`: `true` on HTTPS. Cookies are HttpOnly and SameSite=Lax, and sessions rotate on authentication.
- `session_save_path`: a writable private location if the host's default is unavailable. Never put session files in `public_html`.

No Node process, Supabase account, Redis server or WebSocket service is required. Human races poll authenticated PHP endpoints and use database transactions and server countdown/deadline checks. Shared hosting load/capacity must be measured for its actual CPU and database limits.

For a non-Apache server, configure `/api/*` to the PHP API entry point and other non-file routes to `index.html`, copy equivalent security headers, and preserve API `Cache-Control: no-store`. Do not serve PHP source as static text. Subfolder deployments require matching Vite base, API prefix and rewrite rules and have not been certified by the root-domain package.

## Maintenance and data integrity

Run the private cleanup command from a daily hosting cron job:

```sh
php /absolute/private/path/sparowtype-private/bin/cleanup.php
```

It expires retained input evidence and removes stale operational records. Account summaries and deletion receipts have distinct lifetimes; see the schema and cleanup source. The default raw evidence lifetime is 90 days. Custom/private text uploads require explicit consent. The service worker excludes API responses from its public offline cache.

Back up the database and private config through your hosting tools. Upgrade PHP/MariaDB through the hosting provider. The SQL is an initial schema, not a mechanism for silently upgrading arbitrarily modified databases.

## Verification commands

```sh
npm run test:php
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run check:bundle
```

`test:php` compares native PHP replay to the existing portable TypeScript engine across deterministic valid, malformed and random-edit evidence. Actual HTTP/database acceptance scripts live under `backend/tests/`; they require an isolated test database/config and must not run against user production data. Real browser acceptance uses a separate opt-in `PHP_E2E_ACCEPTANCE=1` flow and creates/deletes only its own synthetic account.

Implementation references checked 19 October 2026: [PHP Unicode normalization](https://www.php.net/manual/en/class.normalizer.php), [grapheme boundaries](https://www.php.net/manual/en/intlbreakiterator.createcharacterinstance.php), [session security settings](https://www.php.net/manual/en/session.security.ini.php).
