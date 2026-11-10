// Explicit audit-only acceptance. This file never loads backend/config.php and
// never connects to a pre-existing MariaDB instance or installs a service.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import readline from 'node:readline';
import { verifyPreparedIndexAbba } from './index-abba-preflight.mjs';
import { indexAbbaHostMetadata } from './index-abba-host-metadata.mjs';
import { writeIndexAbbaShim } from './index-abba-shim.mjs';
import { fileURLToPath } from 'node:url';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { APACHE_BINARY, APACHE_THREADS, prepareApache, apacheControlArguments } from '../2026-10-21/pack-apache-runtime.mjs';

await verifyPreparedIndexAbba(); // Before initialization, process spawn or private configuration creation.
const startupResources=indexAbbaHostMetadata('before-service-start');
assert.ok(startupResources.collector.freeMemoryBytes>=2*1024*1024*1024,'Declared diagnostic resource condition requires at least2GiB availableRAM before service startup.');
assert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1', 'Wait for coordinated GO, then explicitly set SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE=1.');
const httpRuntime = process.env.SPAROWTYPE_PACK_HTTP_RUNTIME ?? 'cli';
assert.ok(['cli', 'apache'].includes(httpRuntime), 'Only explicit CLI or owned Apache audit runtimes are supported.');
if (httpRuntime === 'apache') assert.equal(process.env.SPAROWTYPE_PACK_APACHE_ACCEPTANCE, '1', 'Apache startup needs separate coordinated acceptance.');
const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const receipts = path.dirname(fileURLToPath(import.meta.url));
const storage = path.join(root, 'backend/storage');
const id = randomBytes(8).toString('hex');
const owned = path.join(storage, `pack-instance-${id}`);
const datadir = path.join(owned, 'data');
const sessions = path.join(owned, 'sessions');
const privateLogs = path.join(owned, 'logs');
const configFile = path.join(owned, 'app-config.php');
const adminFile = path.join(owned, 'admin.json');
const privateBrowserFile = path.join(owned, 'browser-env.json');
const pidFile = path.join(owned, 'mariadb.pid');
const database = `sparow_pack_${id}_audit`;
const binaryRoot = 'C:/xampp/mysql';
const mysqld = `${binaryRoot}/bin/mysqld.exe`;
const initializer = `${binaryRoot}/bin/mysql_install_db.exe`;
const runtime = phpRuntime();
const secrets = { root: randomBytes(24).toString('hex'), app: randomBytes(24).toString('hex'), key: randomBytes(32).toString('hex'), arena: randomBytes(32).toString('hex') };
let dbProcess = null, phpProcess = null, previewProcess = null, cleanupStarted = false, ready = false;
let dbPort = null, apiPort = null, environment = null;
let failed = false;
let apache = null;
const suiteResults = [];
let capacityDeclared = false;
let capacityWireDeclared = false;
let nativeRateDeclared = false;
const captureChildren = new Set();

function publicMessage(value) { console.log(JSON.stringify(value)); }
async function receipt(name, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  const target = path.join(receipts, `pack-backend-${id}-${name}.json`);
  try { await writeFile(target, body, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // A child suite may already own this receipt. Preserve its complete raw data.
    await writeFile(path.join(receipts, `pack-backend-${id}-runner-${name}-summary.json`), body, { flag: 'wx' });
  }
}
async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  assert.ok(![3306, 3307, 3308, 8081, 4173].includes(port), 'Refusing an existing application port.');
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
if ($db['host'] !== '127.0.0.1' || in_array((int)$db['port'], [3306,3307,3308,8081,4173], true)) throw new RuntimeException('isolated-port-guard');
$pdo = new PDO('mysql:host=127.0.0.1;port='.$db['port'].';charset=utf8mb4', $db['username'], $db['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$actual = $pdo->query('SELECT @@port port,@@datadir datadir,@@pid_file pid_file')->fetch();
if ((int)$actual['port'] !== (int)$db['port'] || $normalize($actual['datadir']) !== $normalize($expected['datadir']) || $normalize($actual['pid_file']) !== $normalize($expected['pidFile'])) throw new RuntimeException('isolated-server-identity');
if ((int)trim(file_get_contents($expected['pidFile'])) !== ($input['expectedPid'] ?? 0)) throw new RuntimeException('isolated-process-identity');
$operation = $input['operation'] ?? '';
if ($operation === 'identity') {
  echo json_encode(['identityVerified'=>true,'port'=>(int)$actual['port'],'pid'=>(int)$input['expectedPid']]);
} elseif ($operation === 'provision') {
  $name = $db['name'];
  if (!preg_match('/^sparow_pack_[a-f0-9]{16}_audit$/D', $name)) throw new RuntimeException('isolated-schema-name');
  $q = $pdo->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');$q->execute([$name]);
  if ((int)$q->fetchColumn() !== 0) throw new RuntimeException('isolated-schema-exists');
  $pdo->exec('CREATE DATABASE '.$name.' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  $pdo->exec('USE '.$name);
  if ((int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn() !== 0) throw new RuntimeException('isolated-schema-nonempty');
  $schema = file_get_contents($private['schema']);
  if (!is_string($schema) || $schema === '') throw new RuntimeException('schema-source');
  $pdo->exec($schema);
  $migrationNames=[];
  foreach($private['migrations'] as $migration){
    if($normalize(dirname($migration))!==$normalize(dirname($private['schema']).'/migrations')||!in_array(basename($migration),['002-progression.sql','003_classroom.sql','004_social.sql','005_arena.sql'],true))throw new RuntimeException('unexpected-migration');
    $sql=file_get_contents($migration);if(!is_string($sql)||$sql==='')throw new RuntimeException('migration-source');$pdo->exec($sql);$migrationNames[]=basename($migration);
  }
  $app = $private['app'];
  if ($app['username'] !== 'sparow_audit' || !preg_match('/^[a-f0-9]{48}$/D', $app['password'])) throw new RuntimeException('isolated-account');
  $pdo->exec("CREATE USER 'sparow_audit'@'127.0.0.1' IDENTIFIED BY ".$pdo->quote($app['password']));
  $pdo->exec("GRANT SELECT, INSERT, UPDATE, DELETE ON ".$name.".* TO 'sparow_audit'@'127.0.0.1'");
  echo json_encode(['status'=>'READY','database'=>$name,'port'=>(int)$db['port'],'schemaVersion'=>(int)$pdo->query('SELECT MAX(version) FROM schema_metadata')->fetchColumn(),'tables'=>(int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn(),'migrations'=>$migrationNames,'emptyBeforeSchema'=>true,'appDmlOnly'=>true,'existingDatabaseConnected'=>false,'existingConfigRead'=>false]);
} elseif ($operation === 'shutdown') {
  $pdo->exec('SHUTDOWN');
  echo json_encode(['shutdownRequested'=>true,'ownedPid'=>(int)$input['expectedPid']]);
} else throw new RuntimeException('unknown-isolated-operation');
`;

async function guard(operation, name) {
  return capture(runtime.binary, [...runtime.args, path.join(owned, 'guard.php')], name, JSON.stringify({ operation, expectedPid: dbProcess?.pid }), 20000);
}
async function apacheControl(operation, name) {
  assert.ok(apache && phpProcess?.pid, 'An owned Apache process identity is required.');
  return capture('powershell.exe', apacheControlArguments(operation, apache, phpProcess.pid, process.pid, owned), name, undefined, 20000);
}
async function cleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  let gracefulDatabaseShutdown = false, forcedOwnDatabaseStop = false, gracefulApacheShutdown = false, forcedOwnApacheStop = false, apacheResidualPids = [];
  for (const child of captureChildren) if (!childExited(child)) child.kill();
  for (const child of captureChildren) await waitExit(child);
  if (!childExited(previewProcess)) { previewProcess.kill(); await waitExit(previewProcess); }
  if (httpRuntime === 'apache' && phpProcess) {
    try {
      const before = parsed(await apacheControl('inspect','apache-cleanup-inspect'), 'Owned Apache cleanup identity');
      if (before.parentFound) {
        try { parsed(await apacheControl('graceful','apache-cleanup-signal'), 'Owned Apache shutdown event'); gracefulApacheShutdown = await waitExit(phpProcess, 8000); }
        catch { /* A failed startup may lack its PID/event; the next fresh identity check still limits any fallback to our exact process. */ }
      }
      let remaining = parsed(await apacheControl('inspect','apache-cleanup-remaining'), 'Owned Apache remaining process guard');
      if (remaining.pids.length) { parsed(await apacheControl('force','apache-cleanup-force'), 'Owned Apache guarded fallback'); forcedOwnApacheStop = true; await waitExit(phpProcess); remaining = parsed(await apacheControl('inspect','apache-cleanup-final'), 'Owned Apache final process guard'); }
      apacheResidualPids = remaining.pids;
    } catch { failed = true; apacheResidualPids = ['UNVERIFIED']; }
  } else if (!childExited(phpProcess)) { phpProcess.kill(); await waitExit(phpProcess); }
  if (!childExited(dbProcess)) {
    try {
      parsed(await guard('shutdown', 'shutdown'), 'Owned database shutdown');
      gracefulDatabaseShutdown = true;
    } catch { /* Startup can fail before SQL becomes available; only our child may be stopped. */ }
    if (!(await waitExit(dbProcess, 8000))) { dbProcess.kill(); forcedOwnDatabaseStop = true; await waitExit(dbProcess); }
  }
  const stopped = childExited(dbProcess) && childExited(phpProcess) && childExited(previewProcess) && apacheResidualPids.length === 0;
  const base = await realpath(storage);
  const actual = await realpath(owned);
  assert.equal(path.dirname(actual).toLowerCase(), base.toLowerCase(), 'Owned cleanup must be an immediate child of backend/storage.');
  assert.equal(path.basename(actual), `pack-instance-${id}`, 'Owned cleanup identity mismatch.');
  assert.equal((await stat(actual)).isDirectory(), true);
  const marker = JSON.parse(await readFile(path.join(actual, 'ownership.json'), 'utf8'));
  assert.equal(marker.id, id); assert.equal(marker.runnerPid, process.pid);
  const retainDiagnostics = stopped && failed && process.env.SPAROWTYPE_PACK_KEEP_FAILURE === '1';
  if (stopped && !retainDiagnostics) await rm(actual, { recursive: true, force: false });
  const value = { date: new Date().toISOString(), ownProcessesStopped: stopped, gracefulDatabaseShutdown, forcedOwnDatabaseStop, httpRuntime, gracefulApacheShutdown: httpRuntime === 'apache' ? gracefulApacheShutdown : undefined, forcedOwnApacheStop: httpRuntime === 'apache' ? forcedOwnApacheStop : undefined, apacheResidualPids: httpRuntime === 'apache' ? apacheResidualPids : undefined, ownTemporaryDirectoryRemoved: stopped && !retainDiagnostics, privateDiagnosticsDirectory: retainDiagnostics || !stopped ? actual : undefined, originalDatabasePortUntouched: 3308, originalApiPortUntouched: 8081, originalPreviewPortUntouched:4173, noWindowsServiceCreated: true, originalConfigRead: false };
  await receipt('cleanup', value); publicMessage({ stage: 'ephemeral-cleanup', ...value });
}

// This diagnostic has no browser or interactive commands.

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  failed = true;
  cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
});

try {
  assert.match(database, /^sparow_pack_[a-f0-9]{16}_audit$/);
  await stat(mysqld); await stat(initializer);
  await mkdir(storage, { recursive: true });
  await mkdir(owned, { recursive: false });
  for (const directory of [sessions, privateLogs, path.join(owned, 'php-empty-scan')]) await mkdir(directory);
  await writeFile(path.join(owned, 'ownership.json'), JSON.stringify({ id, runnerPid: process.pid, root, created: new Date().toISOString() }));
  await receipt('index-abba-startup-resources',startupResources);
  dbPort = await freePort(); apiPort = await freePort(); assert.notEqual(dbPort, apiPort);
  const config = { database: { host: '127.0.0.1', port: dbPort, name: database, username: 'sparow_audit', password: secrets.app }, app_key: secrets.key, api_prefix: '/api', allowed_origins: ['http://127.0.0.1:4173', 'http://localhost:4173', 'http://127.0.0.1:4176', 'http://localhost:4176'], session_name: `sparow_ephemeral_${id}`, session_lifetime: 43200, cookie_secure: false, cookie_samesite: 'Lax', session_save_path: sessions, max_body_bytes: 2000000, evidence_retention_days: 90, arena_audit_guard: secrets.arena, debug: false };
  await writeFile(path.join(owned, 'app.json'), JSON.stringify(config));
  await writeFile(configFile, "<?php\ndeclare(strict_types=1);\nreturn json_decode(file_get_contents(__DIR__.'/app.json'),true,512,JSON_THROW_ON_ERROR);\n");
  await writeFile(adminFile, JSON.stringify({ database: { ...config.database, username: 'root', password: secrets.root }, app: config.database, schema: path.join(root, 'backend/schema.sql'), migrations: ['002-progression.sql','003_classroom.sql','004_social.sql','005_arena.sql'].map(name => path.join(root,'backend/migrations',name)), identity: { datadir, pidFile } }));
  await writeFile(path.join(owned, 'guard.php'), guardSource);
  const phpIni = path.join(owned, 'php.ini');
  await writeFile(phpIni, `extension_dir="${path.dirname(runtime.binary).replaceAll('\\', '/')}/ext"\nextension=intl\nextension=mbstring\nextension=pdo_mysql\ndate.timezone=UTC\ndefault_charset=UTF-8\ndisplay_errors=Off\nlog_errors=On\nerror_log="${path.join(privateLogs, 'php-errors.log').replaceAll('\\', '/')}"\n`);
  environment = { ...process.env, PHP_BINARY: runtime.binary, PHPRC: phpIni, PHP_INI_SCAN_DIR: path.join(owned, 'php-empty-scan'), SPAROWTYPE_CONFIG_FILE: configFile, SPAROWTYPE_TEST_API_URL: `http://127.0.0.1:${apiPort}/api`, SPAROWTYPE_PACK_HTTP_ACCEPTANCE: '1', SPAROWTYPE_COURSE_HTTP_ACCEPTANCE: '1', SPAROWTYPE_TEST_REPORT: path.join(receipts, `pack-backend-${id}-data.json`), SPAROWTYPE_COURSE_HTTP_REPORT: path.join(receipts, `pack-backend-${id}-course.json`), SPAROWTYPE_PROGRESSION_HTTP_REPORT: path.join(receipts, `pack-backend-${id}-progression.json`), SPAROWTYPE_SOCIAL_HTTP_REPORT: path.join(receipts, `pack-backend-${id}-social.json`), SPAROWTYPE_CLASSROOM_HTTP_REPORT: path.join(receipts, `pack-backend-${id}-classroom.json`), ARENA_AUDIT_CONFIG: configFile, ARENA_AUDIT_GUARD: secrets.arena, ARENA_AUDIT_ORIGIN: `http://127.0.0.1:${apiPort}/api/`, ARENA_LOAD_REPORT: path.join(receipts, `pack-backend-${id}-arena-load-raw.json`), ARENA_HTTP_REPORT: path.join(receipts, `pack-backend-${id}-arena-http-raw.json`), SPAROWTYPE_CAPACITY_OWNER_ID: id };
  if (httpRuntime === 'apache') {
    apache = await prepareApache({ owned, root, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });
    const shim=await writeIndexAbbaShim({webRoot:apache.webRoot,owned,configFile,root,ownerId:id,nonce:secrets.arena,indexRoot:path.join(root,'audit/2026-11-05-followup/.final-index-abba')});
    await receipt('index-abba-generated-shim',shim);
    // Same owned readiness request, with bounded OPcache/PDO availability facts.
    await writeFile(path.join(apache.webRoot,'__audit-runtime.php'),"<?php\nheader('Content-Type: application/json'); echo json_encode(['sapi'=>PHP_SAPI,'threadSafe'=>PHP_ZTS===1,'pid'=>getmypid(),'ini'=>php_ini_loaded_file(),'config'=>getenv('SPAROWTYPE_CONFIG_FILE'),'opcodeCacheEnabled'=>extension_loaded('Zend OPcache') && filter_var(ini_get('opcache.enable'), FILTER_VALIDATE_BOOLEAN),'pdoMysqlLoaded'=>extension_loaded('pdo_mysql'),'nativeMysqlDriverAvailable'=>in_array('mysql',PDO::getAvailableDrivers(),true)]);\n");
    const pathKey = Object.keys(environment).find(key => key.toLowerCase() === 'path') ?? 'Path';
    environment = { ...environment, [pathKey]: `${path.dirname(runtime.binary)};${environment[pathKey] ?? ''}` };
    const syntax = await capture(APACHE_BINARY, ['-t', '-f', apache.configFile], 'apache-syntax', undefined, 20000);
    await receipt('apache-syntax', { status: syntax.code === 0 ? 'PASS' : 'FAIL', exitCode: syntax.code, serverStarted: false, existingConfigRead: false });
    assert.equal(syntax.code, 0, 'Private Apache syntax failed; owned private diagnostics retained.');
  }
  publicMessage({ stage: 'ephemeral-initialize', databasePort: dbPort, apiPort, httpRuntime, existingDatabaseConnected: false, existingConfigRead: false });
  const init = await capture(initializer, [`--datadir=${datadir}`, `--port=${dbPort}`, `--password=${secrets.root}`], 'initialize');
  assert.equal(init.code, 0, 'Fresh MariaDB initialization failed; private log retained until scoped cleanup.');
  dbProcess = privateServer(mysqld, ['--no-defaults', `--basedir=${binaryRoot}`, `--datadir=${datadir}`, `--tmpdir=${owned}`, `--port=${dbPort}`, '--bind-address=127.0.0.1', '--skip-name-resolve', `--pid-file=${pidFile}`, `--log-error=${path.join(privateLogs, 'mariadb-errors.log')}`, '--innodb-buffer-pool-size=32M', '--aria-pagecache-buffer-size=16M', '--key-buffer-size=8M', `--max-connections=${httpRuntime === 'apache' ? 64 : 16}`, '--performance-schema=OFF', '--skip-slave-start', '--skip-log-bin', '--named-pipe=OFF'], 'mariadb-console.log');
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(childExited(dbProcess), false, 'Owned MariaDB process exited before readiness.');
    const result = await guard('identity', `identity-${attempt}`);
    if (result.code === 0) { parsed(result, 'Isolated identity guard'); ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, 'Owned database did not pass its exact datadir/port/PID guard.');
  const provision = parsed(await guard('provision', 'provision'), 'Fresh schema provisioning');
  await receipt('provision', provision); publicMessage({ stage: 'ephemeral-provision', ...provision });
  phpProcess = httpRuntime === 'apache'
    ? privateServer(APACHE_BINARY, ['-f', apache.configFile], 'apache-console.log')
    : privateServer(runtime.binary, [...runtime.args, '-S', `127.0.0.1:${apiPort}`, '-t', path.join(root, 'backend/public'), path.join(root, 'backend/router.php')], 'php-server.log');
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
  if (httpRuntime === 'apache') {
    const processIdentity = parsed(await apacheControl('inspect', 'apache-identity'), 'Owned Apache process identity');
    assert.equal(processIdentity.parentFound, true);
    assert.deepEqual(processIdentity.unverifiedChildPids, [], 'An unmatched direct Apache child must remain unverified.');
    assert.equal(Number((await readFile(apache.pidFile, 'utf8')).trim()), phpProcess.pid);
    const response = await fetch(`http://127.0.0.1:${apiPort}/__audit-runtime.php`, { signal: AbortSignal.timeout(2000) });
    const actual = await response.json();
    const normalize = value => path.resolve(value).toLowerCase();
    assert.equal(actual.sapi, 'apache2handler'); assert.equal(actual.threadSafe, true);
    assert.equal(actual.opcodeCacheEnabled,false,'Ordinary capacity requires OPcache OFF.');
    assert.equal(actual.pdoMysqlLoaded,true);assert.equal(actual.nativeMysqlDriverAvailable,true);
    assert.equal(normalize(actual.ini), normalize(phpIni)); assert.equal(normalize(actual.config), normalize(configFile));
    assert.ok(processIdentity.pids.includes(actual.pid), 'The request worker must belong to the owned Apache parent.');
    await receipt('apache-runtime', { status: 'PASS', sapi: actual.sapi, threadSafe: true, threadsPerChild: APACHE_THREADS, workerPid: actual.pid, ownedProcessPids: processIdentity.pids, privateIniMatched: true, privateConfigMatched: true, opcodeCacheEnabled:false, pdoMysqlLoaded:true, nativeMysqlDriverAvailable:true, connectionPolicy:'Frozen unchanged native PDO constructor; nonpersistent, native prepares, UTC session initialization', existingApacheConfigRead: false, serviceInstalled: false });
  }
  const identities = { httpRuntime, auditDatabaseMaxConnections: httpRuntime === 'apache' ? 64 : 16, apacheThreads: httpRuntime === 'apache' ? APACHE_THREADS : undefined, api: environment.SPAROWTYPE_TEST_API_URL, database, databasePort: dbPort, databasePid: dbProcess.pid, phpPid: phpProcess.pid, privateConfigFile: configFile, privateDirectory: owned, originalDatabasePortUntouched: 3308, originalApiPortUntouched: 8081, existingConfigRead: false, noWindowsServiceCreated: true };
  await receipt('environment', identities); publicMessage({ stage: 'ephemeral-api-ready', ...identities });
  const privateRuntimeFiles={appConfig:configFile,appJson:path.join(owned,'app.json'),phpIni,apacheConfig:apache.configFile,generatedShim:path.join(apache.webRoot,'index.php'),ownedDatabaseAdminConfig:adminFile};
  const privateRuntimeHashes=async()=>{
    assert.equal(await realpath(owned),path.join(await realpath(storage),'pack-instance-'+id));
    const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(marker.id,id);assert.equal(marker.runnerPid,process.pid);assert.equal(await realpath(marker.root),await realpath(root));
    const hashes={};for(const [name,file] of Object.entries(privateRuntimeFiles)){assert.equal(await realpath(file),path.resolve(file));const relative=path.relative(await realpath(owned),await realpath(file));assert.ok(relative!==''&&!relative.startsWith('..')&&!path.isAbsolute(relative));hashes[name]=createHash('sha256').update(await readFile(file)).digest('hex');}return hashes;
  };
  const privateRuntimeBefore=await privateRuntimeHashes();await receipt('index-abba-private-input-hashes-before',{ownerId:id,hashes:privateRuntimeBefore,contentsPublished:false});
  await receipt('index-abba-owner-protocol', {declaredAt:new Date().toISOString(),ownerId:id,order:['1A','2B','3B','4A'],representations:'FULL1653 only',diagnosticOnly:true,separateFixtureNamespaces:true,warmDatabaseOrderDeclared:true,strictP95BelowMs:150,noAutomaticRetries:true,noProfilerOrTimingHeaders:true});
  for(const [phase,variant] of [['1A','A'],['2B','B'],['3B','B'],['4A','A']]) {
    const before=indexAbbaHostMetadata(phase+'-before');await receipt('index-abba-'+phase+'-host-before',before);
    assert.ok(before.collector.freeMemoryBytes>=2*1024*1024*1024,'Declared diagnostic resource condition requires at least2GiB availableRAM at each phase start.');
    environment={...environment,SPAROWTYPE_INDEX_ABBA_PHASE:phase,SPAROWTYPE_INDEX_ABBA_VARIANT:variant};
    publicMessage({stage:'index-abba-phase-start',ownerId:id,phase,variant,freeMemoryBytes:before.collector.freeMemoryBytes});
    const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,'audit/2026-11-05-followup/run-index-abba-capacity.mjs')],'index-abba-'+phase,undefined,240000);
    let report=null;try{report=JSON.parse(await readFile(path.join(receipts,'index-abba-'+id+'-'+phase+'.json'),'utf8'));}catch{}
    const after=indexAbbaHostMetadata(phase+'-after');await receipt('index-abba-'+phase+'-host-after',after);
    const privateRuntimeAfter=await privateRuntimeHashes();await receipt('index-abba-'+phase+'-private-input-hashes-after',{ownerId:id,hashes:privateRuntimeAfter,allInputsUnchanged:JSON.stringify(privateRuntimeAfter)===JSON.stringify(privateRuntimeBefore),contentsPublished:false});assert.deepEqual(privateRuntimeAfter,privateRuntimeBefore);
    const correctness=report && report.total===1653 && report.failure===null && report.watchdogExpired===false && report.checks.every(check=>check.name==='successful-request p95 remains strictly below150ms'||check.pass);
    const status={phase,variant,exitCode:result.code,reportStatus:report?.status??null,p95Ms:report?.p95Ms??null,total:report?.total??null,correctness:Boolean(correctness),targetMet:report?.targetMet??false};
    suiteResults.push(status);failed ||= !correctness || !report.targetMet;await receipt('index-abba-'+phase+'-summary',status);publicMessage({stage:'index-abba-phase-complete',ownerId:id,...status});
    assert.ok(correctness,'Functional/integrity failure stops the diagnostic; latency-only failure is preserved and does not stop the predeclaredABBA order.');
  }
  const privateRuntimeFinal=await privateRuntimeHashes();assert.deepEqual(privateRuntimeFinal,privateRuntimeBefore);await receipt('index-abba-private-input-hashes-final',{ownerId:id,hashes:privateRuntimeFinal,allInputsUnchanged:true,contentsPublished:false});
  const after=await verifyPreparedIndexAbba();
  await receipt('index-abba-final-inputs',{ownerId:id,allInputsUnchanged:true,verification:after});
  await receipt('index-abba-summary',{at:new Date().toISOString(),ownerId:id,phases:suiteResults,diagnosticOnly:true,ordinaryAcceptance:false,allFourCompleted:suiteResults.length===4,allInputsUnchanged:true,failed});
} catch (error) {
  failed = true;
  const value = { date: new Date().toISOString(), status: 'UNVERIFIED', reason: error.message, originalConfigRead: false, originalDatabaseConnected: false };
  await receipt('failure', value); publicMessage({ stage: 'ephemeral-failure', ...value });
} finally {
  if (environment) await cleanup();
  if (failed) process.exitCode = 1;
}
