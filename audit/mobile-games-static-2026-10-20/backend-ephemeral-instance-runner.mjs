// Explicit audit-only acceptance. This file never loads backend/config.php and
// never connects to a pre-existing MariaDB instance or installs a service.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

assert.equal(process.env.SPAROWTYPE_EPHEMERAL_ACCEPTANCE, '1', 'Wait for coordinated GO, then explicitly set SPAROWTYPE_EPHEMERAL_ACCEPTANCE=1.');
const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const receipts = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(root, 'backend/storage');
const id = randomBytes(8).toString('hex');
const owned = path.join(storage, `mobile-games-instance-${id}`);
const datadir = path.join(owned, 'data');
const sessions = path.join(owned, 'sessions');
const privateLogs = path.join(owned, 'logs');
const configFile = path.join(owned, 'app-config.php');
const adminFile = path.join(owned, 'admin.json');
const privateBrowserFile = path.join(owned, 'browser-env.json');
const pidFile = path.join(owned, 'mariadb.pid');
const database = `sparow_mobile_games_${id}_audit`;
const binaryRoot = 'C:/xampp/mysql';
const mysqld = `${binaryRoot}/bin/mysqld.exe`;
const initializer = `${binaryRoot}/bin/mysql_install_db.exe`;
const runtime = phpRuntime();
const secrets = { root: randomBytes(24).toString('hex'), app: randomBytes(24).toString('hex'), key: randomBytes(32).toString('hex') };
let dbProcess = null, phpProcess = null, previewProcess = null, cleanupStarted = false, ready = false;
let dbPort = null, apiPort = null, environment = null;
let failed = false;
const suiteResults = [];
const captureChildren = new Set();

function publicMessage(value) { console.log(JSON.stringify(value)); }
async function receipt(name, value) {
  await writeFile(path.join(receipts, `backend-ephemeral-${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
}
async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  assert.ok(![3307, 3308, 8081].includes(port), 'Refusing an existing application port.');
  return port;
}
function childExited(child) { return !child || child.exitCode !== null || child.signalCode !== null; }
async function waitExit(child, milliseconds = 5000) {
  if (childExited(child)) return true;
  return Promise.race([
    new Promise(resolve => child.once('exit', () => resolve(true))),
    new Promise(resolve => { const timer = setTimeout(() => resolve(false), milliseconds); timer.unref(); }),
  ]);
}
async function capture(binary, args, name, input, timeout = 120000) {
  const child = spawn(binary, args, { cwd: root, env: environment, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  captureChildren.add(child);
  let stdout = '', stderr = '';
  const output = createWriteStream(path.join(privateLogs, `${name}.log`));
  child.stdout.on('data', chunk => { stdout += chunk; output.write(chunk); });
  child.stderr.on('data', chunk => { stderr += chunk; output.write(chunk); });
  child.stdin.end(input ?? '');
  const timer = setTimeout(() => { if (!childExited(child)) child.kill(); }, timeout);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }).finally(() => { clearTimeout(timer); captureChildren.delete(child); });
  await new Promise(resolve => output.end(resolve));
  return { code, stdout, stderr };
}
function parsed(result, purpose) {
  assert.equal(result.code, 0, `${purpose} failed; diagnostics retained only in the owned private directory.`);
  try { return JSON.parse(result.stdout.trim()); } catch { throw new Error(`${purpose} did not return safe JSON.`); }
}
function privateServer(binary, args, logName, cwd = owned) {
  const child = spawn(binary, args, { cwd, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = createWriteStream(path.join(privateLogs, logName));
  child.stdout.pipe(output, { end: false }); child.stderr.pipe(output, { end: false });
  child.once('close', () => output.end());
  child.on('error', () => { failed = true; });
  return child;
}

const guardSource = String.raw`<?php
declare(strict_types=1);
$input = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$private = json_decode(file_get_contents(__DIR__.'/admin.json'), true, 512, JSON_THROW_ON_ERROR);
$normalize = static fn(string $value): string => strtolower(rtrim(str_replace('\\', '/', $value), '/'));
$expected = $private['identity'];
$db = $private['database'];
if ($db['host'] !== '127.0.0.1' || in_array((int)$db['port'], [3307,3308,8081], true)) throw new RuntimeException('isolated-port-guard');
$pdo = new PDO('mysql:host=127.0.0.1;port='.$db['port'].';charset=utf8mb4', $db['username'], $db['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$actual = $pdo->query('SELECT @@port port,@@datadir datadir,@@pid_file pid_file')->fetch();
if ((int)$actual['port'] !== (int)$db['port'] || $normalize($actual['datadir']) !== $normalize($expected['datadir']) || $normalize($actual['pid_file']) !== $normalize($expected['pidFile'])) throw new RuntimeException('isolated-server-identity');
if ((int)trim(file_get_contents($expected['pidFile'])) !== ($input['expectedPid'] ?? 0)) throw new RuntimeException('isolated-process-identity');
$operation = $input['operation'] ?? '';
if ($operation === 'identity') {
  echo json_encode(['identityVerified'=>true,'port'=>(int)$actual['port'],'pid'=>(int)$input['expectedPid']]);
} elseif ($operation === 'provision') {
  $name = $db['name'];
  if (!preg_match('/^sparow_mobile_games_[a-f0-9]{16}_audit$/D', $name)) throw new RuntimeException('isolated-schema-name');
  $q = $pdo->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');$q->execute([$name]);
  if ((int)$q->fetchColumn() !== 0) throw new RuntimeException('isolated-schema-exists');
  $pdo->exec('CREATE DATABASE '.$name.' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  $pdo->exec('USE '.$name);
  if ((int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn() !== 0) throw new RuntimeException('isolated-schema-nonempty');
  $schema = file_get_contents($private['schema']);
  if (!is_string($schema) || $schema === '') throw new RuntimeException('schema-source');
  $pdo->exec($schema);
  $app = $private['app'];
  if ($app['username'] !== 'sparow_audit' || !preg_match('/^[a-f0-9]{48}$/D', $app['password'])) throw new RuntimeException('isolated-account');
  $pdo->exec("CREATE USER 'sparow_audit'@'127.0.0.1' IDENTIFIED BY ".$pdo->quote($app['password']));
  $pdo->exec("GRANT SELECT, INSERT, UPDATE, DELETE ON ".$name.".* TO 'sparow_audit'@'127.0.0.1'");
  echo json_encode(['status'=>'READY','database'=>$name,'port'=>(int)$db['port'],'schemaVersion'=>(int)$pdo->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn(),'tables'=>(int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn(),'emptyBeforeSchema'=>true,'appDmlOnly'=>true,'existingDatabaseConnected'=>false,'existingConfigRead'=>false]);
} elseif ($operation === 'shutdown') {
  $pdo->exec('SHUTDOWN');
  echo json_encode(['shutdownRequested'=>true,'ownedPid'=>(int)$input['expectedPid']]);
} else throw new RuntimeException('unknown-isolated-operation');
`;

async function guard(operation, name) {
  return capture(runtime.binary, [...runtime.args, path.join(owned, 'guard.php')], name, JSON.stringify({ operation, expectedPid: dbProcess?.pid }), 20000);
}
async function cleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  let gracefulDatabaseShutdown = false, forcedOwnDatabaseStop = false;
  for (const child of captureChildren) if (!childExited(child)) child.kill();
  for (const child of captureChildren) await waitExit(child);
  if (!childExited(previewProcess)) { previewProcess.kill(); await waitExit(previewProcess); }
  if (!childExited(phpProcess)) { phpProcess.kill(); await waitExit(phpProcess); }
  if (!childExited(dbProcess)) {
    try {
      parsed(await guard('shutdown', 'shutdown'), 'Owned database shutdown');
      gracefulDatabaseShutdown = true;
    } catch { /* Startup can fail before SQL becomes available; only our child may be stopped. */ }
    if (!(await waitExit(dbProcess, 8000))) { dbProcess.kill(); forcedOwnDatabaseStop = true; await waitExit(dbProcess); }
  }
  const stopped = childExited(dbProcess) && childExited(phpProcess) && childExited(previewProcess);
  const base = await realpath(storage);
  const actual = await realpath(owned);
  assert.equal(path.dirname(actual).toLowerCase(), base.toLowerCase(), 'Owned cleanup must be an immediate child of backend/storage.');
  assert.equal(path.basename(actual), `mobile-games-instance-${id}`, 'Owned cleanup identity mismatch.');
  assert.equal((await stat(actual)).isDirectory(), true);
  const marker = JSON.parse(await readFile(path.join(actual, 'ownership.json'), 'utf8'));
  assert.equal(marker.id, id); assert.equal(marker.runnerPid, process.pid);
  const retainDiagnostics = stopped && failed && process.env.SPAROWTYPE_EPHEMERAL_KEEP_FAILURE === '1';
  if (stopped && !retainDiagnostics) await rm(actual, { recursive: true, force: false });
  const value = { date: new Date().toISOString(), ownProcessesStopped: stopped, gracefulDatabaseShutdown, forcedOwnDatabaseStop, ownTemporaryDirectoryRemoved: stopped && !retainDiagnostics, privateDiagnosticsDirectory: retainDiagnostics ? actual : undefined, originalDatabasePortUntouched: 3308, originalApiPortUntouched: 8081, noWindowsServiceCreated: true, originalConfigRead: false };
  await receipt('cleanup', value); publicMessage({ stage: 'ephemeral-cleanup', ...value });
}

// The preview and two reusable racers are created only after a separately
// coordinated `prepare-browser` command. Neither runner startup nor HOLD starts
// a browser or Vite process. Passwords and cookies never enter public receipts.
async function prepareBrowser() {
  assert.equal(previewProcess, null, 'The owned preview is already prepared.');
  const port = await freePort();
  const config = JSON.parse(await readFile(path.join(owned, 'app.json'), 'utf8'));
  config.allowed_origins.push(`http://127.0.0.1:${port}`);
  await writeFile(path.join(owned, 'app.json'), JSON.stringify(config));
  const browserEnv = { PHP_E2E_ACCEPTANCE: '1', SPAROWTYPE_PHP_URL: `http://127.0.0.1:${apiPort}`, SPAROWTYPE_CONFIG_FILE: configFile, PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`, VITE_API_BASE_URL: '/api' };
  for (const [role, prefix] of [['host', 'HOST'], ['opponent', 'OPPONENT']]) {
    const cookies = new Map();
    let csrf = '';
    const email = `native-browser-${id}-${role}@example.test`, password = `NativeAudit!${randomBytes(24).toString('hex')}`;
    for (const [route, body, expected] of [['/auth/session', undefined, 200], ['/auth/signup', { email, password }, 201]]) {
      const response = await fetch(`${environment.SPAROWTYPE_TEST_API_URL}${route}`, { method: body ? 'POST' : 'GET', headers: { Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...(body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
      for (const value of response.headers.getSetCookie()) { const pair = value.split(';', 1)[0], split = pair.indexOf('='); cookies.set(pair.slice(0, split), pair.slice(split + 1)); }
      const value = await response.json();
      assert.equal(response.status, expected, `Dedicated browser ${role} setup returned HTTP${response.status}; credentials suppressed.`);
      if (value.csrfToken) csrf = value.csrfToken;
    }
    browserEnv[`PHP_E2E_RACE_${prefix}_EMAIL`] = email;
    browserEnv[`PHP_E2E_RACE_${prefix}_PASSWORD`] = password;
  }
  await writeFile(privateBrowserFile, JSON.stringify(browserEnv));
  environment = { ...environment, SPAROWTYPE_PHP_URL: browserEnv.SPAROWTYPE_PHP_URL, SPAROWTYPE_DEPLOY_TARGET: 'php', SPAROWTYPE_BASE_PATH: '/', VITE_API_BASE_URL: '/api' };
  previewProcess = privateServer(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--outDir', path.join(root, 'dist')], 'preview.log', root);
  let matched = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(childExited(previewProcess), false, 'Owned preview exited before readiness.');
    try {
      const response = await fetch(`${browserEnv.PLAYWRIGHT_BASE_URL}/api/auth/session`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && response.headers.getSetCookie().some(cookie => cookie.startsWith(`${config.session_name}=`))) { matched = true; break; }
    } catch { /* Proxy binding is asynchronous. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(matched, true, 'Owned preview did not proxy the exact ephemeral session namespace.');
  const safe = { baseUrl: browserEnv.PLAYWRIGHT_BASE_URL, api: environment.SPAROWTYPE_TEST_API_URL, previewPid: previewProcess.pid, privateBrowserEnvFile: privateBrowserFile, dedicatedSyntheticRacers: 2, browserStarted: false, traceRequirement: 'Use --trace=off; never print private env/password/cookie values.' };
  await receipt('browser-ready', safe); publicMessage({ stage: 'ephemeral-browser-ready', ...safe });
}

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  failed = true;
  cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
});

try {
  assert.match(database, /^sparow_mobile_games_[a-f0-9]{16}_audit$/);
  await stat(mysqld); await stat(initializer);
  await mkdir(storage, { recursive: true });
  await mkdir(owned, { recursive: false });
  for (const directory of [sessions, privateLogs, path.join(owned, 'php-empty-scan')]) await mkdir(directory);
  await writeFile(path.join(owned, 'ownership.json'), JSON.stringify({ id, runnerPid: process.pid, root, created: new Date().toISOString() }));
  dbPort = await freePort(); apiPort = await freePort(); assert.notEqual(dbPort, apiPort);
  const config = { database: { host: '127.0.0.1', port: dbPort, name: database, username: 'sparow_audit', password: secrets.app }, app_key: secrets.key, api_prefix: '/api', allowed_origins: ['http://127.0.0.1:4173', 'http://localhost:4173', 'http://127.0.0.1:4176', 'http://localhost:4176'], session_name: `sparow_ephemeral_${id}`, session_lifetime: 43200, cookie_secure: false, cookie_samesite: 'Lax', session_save_path: sessions, max_body_bytes: 2000000, evidence_retention_days: 90, debug: false };
  await writeFile(path.join(owned, 'app.json'), JSON.stringify(config));
  await writeFile(configFile, "<?php\ndeclare(strict_types=1);\nreturn json_decode(file_get_contents(__DIR__.'/app.json'),true,512,JSON_THROW_ON_ERROR);\n");
  await writeFile(adminFile, JSON.stringify({ database: { ...config.database, username: 'root', password: secrets.root }, app: config.database, schema: path.join(root, 'backend/schema.sql'), identity: { datadir, pidFile } }));
  await writeFile(path.join(owned, 'guard.php'), guardSource);
  const phpIni = path.join(owned, 'php.ini');
  await writeFile(phpIni, `extension_dir="${path.dirname(runtime.binary).replaceAll('\\', '/')}/ext"\nextension=intl\nextension=mbstring\nextension=pdo_mysql\ndate.timezone=UTC\ndefault_charset=UTF-8\ndisplay_errors=Off\nlog_errors=On\nerror_log="${path.join(privateLogs, 'php-errors.log').replaceAll('\\', '/')}"\n`);
  environment = { ...process.env, PHP_BINARY: runtime.binary, PHPRC: phpIni, PHP_INI_SCAN_DIR: path.join(owned, 'php-empty-scan'), SPAROWTYPE_CONFIG_FILE: configFile, SPAROWTYPE_TEST_API_URL: `http://127.0.0.1:${apiPort}/api`, SPAROWTYPE_COURSE_HTTP_ACCEPTANCE: '1', SPAROWTYPE_TEST_REPORT: path.join(receipts, 'backend-ephemeral-data.json'), SPAROWTYPE_COURSE_HTTP_REPORT: path.join(receipts, 'backend-ephemeral-course.json') };
  publicMessage({ stage: 'ephemeral-initialize', databasePort: dbPort, apiPort, existingDatabaseConnected: false, existingConfigRead: false });
  const init = await capture(initializer, [`--datadir=${datadir}`, `--port=${dbPort}`, `--password=${secrets.root}`], 'initialize');
  assert.equal(init.code, 0, 'Fresh MariaDB initialization failed; private log retained until scoped cleanup.');
  dbProcess = privateServer(mysqld, ['--no-defaults', `--basedir=${binaryRoot}`, `--datadir=${datadir}`, `--tmpdir=${owned}`, `--port=${dbPort}`, '--bind-address=127.0.0.1', '--skip-name-resolve', `--pid-file=${pidFile}`, `--log-error=${path.join(privateLogs, 'mariadb-errors.log')}`, '--innodb-buffer-pool-size=32M', '--aria-pagecache-buffer-size=16M', '--key-buffer-size=8M', '--max-connections=16', '--performance-schema=OFF', '--skip-slave-start', '--skip-log-bin', '--named-pipe=OFF'], 'mariadb-console.log');
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(childExited(dbProcess), false, 'Owned MariaDB process exited before readiness.');
    const result = await guard('identity', `identity-${attempt}`);
    if (result.code === 0) { parsed(result, 'Isolated identity guard'); ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, 'Owned database did not pass its exact datadir/port/PID guard.');
  const provision = parsed(await guard('provision', 'provision'), 'Fresh schema provisioning');
  await receipt('provision', provision); publicMessage({ stage: 'ephemeral-provision', ...provision });
  phpProcess = privateServer(runtime.binary, [...runtime.args, '-S', `127.0.0.1:${apiPort}`, '-t', path.join(root, 'backend/public'), path.join(root, 'backend/router.php')], 'php-server.log');
  let httpReady = false, lastHttp = null;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(childExited(phpProcess), false, 'Owned PHP server exited before readiness.');
    try {
      const response = await fetch(`${environment.SPAROWTYPE_TEST_API_URL}/auth/session`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && response.headers.getSetCookie().some(cookie => cookie.startsWith(`${config.session_name}=`))) { httpReady = true; break; }
      const value = await response.json().catch(() => null);
      lastHttp = { status: response.status, errorCode: value?.error?.code ?? null, cookieNames: response.headers.getSetCookie().map(value => value.split('=', 1)[0]) };
    } catch (error) { lastHttp = { requestError: error.name, message: error.message, causeCode: error.cause?.code ?? null }; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!httpReady) await receipt('http-readiness', lastHttp);
  assert.equal(httpReady, true, 'The exact ephemeral session namespace did not become ready.');
  const identities = { api: environment.SPAROWTYPE_TEST_API_URL, database, databasePort: dbPort, databasePid: dbProcess.pid, phpPid: phpProcess.pid, privateConfigFile: configFile, privateDirectory: owned, originalDatabasePortUntouched: 3308, originalApiPortUntouched: 8081, existingConfigRead: false, noWindowsServiceCreated: true };
  await receipt('environment', identities); publicMessage({ stage: 'ephemeral-api-ready', ...identities });
  for (const [name, script] of [['data', 'data-lifecycle.mjs'], ['course', 'course-lifecycle.mjs'], ['race', 'race-lifecycle.mjs'], ['password', 'password-policy.php']]) {
    publicMessage({ stage: 'ephemeral-suite-start', name });
    const isPhp = script.endsWith('.php');
    const result = await capture(isPhp ? runtime.binary : process.execPath, isPhp ? [...runtime.args, path.join(root, 'backend/tests', script)] : ['--experimental-transform-types', path.join(root, 'backend/tests', script)], name);
    let report = null;
    try { report = JSON.parse(result.stdout.trim()); } catch { /* Non-JSON diagnostics stay private. */ }
    if (report) await receipt(name, report);
    const status = { name, exitCode: result.code, status: result.code === 0 ? 'PASS' : 'FAIL', checks: report?.passed ?? report?.checks?.length ?? null };
    suiteResults.push(status); failed ||= result.code !== 0;
    publicMessage({ stage: 'ephemeral-suite-complete', ...status });
  }
  await receipt('summary', { date: new Date().toISOString(), suites: suiteResults, failed, scope: 'Real loopback HTTP/PDO with existing guarded synthetic event/SQL fixtures on a wholly new ephemeral MariaDB instance; no browser/native-human-input claim.', originalDatabaseConnected: false, originalConfigRead: false });
  if (process.env.SPAROWTYPE_EPHEMERAL_HOLD === '1' && !failed) {
    // Leave no accumulated acceptance rate limit for separately coordinated
    // browser cases. This fixture sees only the new isolated audit database.
    parsed(await capture(runtime.binary, [...runtime.args, path.join(root, 'backend/tests/data-fixture.php')], 'clear-own-acceptance-rate', JSON.stringify({ operation: 'reset-audit-rate-limits' })), 'Own audit rate cleanup');
    publicMessage({ stage: 'ephemeral-holding', ...identities, next: 'Send prepare-browser only after browser-stage coordination, or cleanup to stop/remove owned resources.' });
    const lines = readline.createInterface({ input: process.stdin });
    for await (const line of lines) {
      if (line.trim() === 'cleanup') { lines.close(); break; }
      if (line.trim() === 'prepare-browser') await prepareBrowser();
    }
  }
} catch (error) {
  failed = true;
  const value = { date: new Date().toISOString(), status: 'UNVERIFIED', reason: error.message, originalConfigRead: false, originalDatabaseConnected: false };
  await receipt('failure', value); publicMessage({ stage: 'ephemeral-failure', ...value });
} finally {
  if (environment) await cleanup();
  if (failed) process.exitCode = 1;
}
