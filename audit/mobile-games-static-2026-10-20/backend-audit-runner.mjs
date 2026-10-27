// Explicit opt-in audit runner. Never selects or mutates the configured app DB.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import readline from 'node:readline';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

assert.equal(process.env.SPAROWTYPE_AUDIT_PROVISION, '1', 'Explicit temporary audit provisioning opt-in is required.');
const root = path.resolve(import.meta.dirname, '../..');
const receiptDir = import.meta.dirname;
const temporary = await mkdtemp(path.join(os.tmpdir(), 'sparow-mobile-games-'));
const id = randomBytes(8).toString('hex');
const database = `sparow_mobile_games_${id}_audit`;
const configFile = path.join(temporary, 'audit-config.local.php');
const sessionPath = path.join(temporary, 'sessions');
const runtime = phpRuntime();
await mkdir(sessionPath);
await writeFile(path.join(temporary, 'php.ini'), `extension_dir="${path.dirname(runtime.binary).replaceAll('\\', '/')}/ext"\nextension=intl\nextension=mbstring\nextension=pdo_mysql\ndate.timezone=UTC\n`);
const provisionFile = path.join(temporary, 'provision.php');
const cleanupFile = path.join(temporary, 'cleanup.php');
const environment = {
  ...process.env, PHP_BINARY: runtime.binary, PHPRC: temporary, PHP_INI_SCAN_DIR: temporary,
  SPAROWTYPE_CONFIG_FILE: configFile, SPAROWTYPE_AUDIT_DATABASE: database,
  SPAROWTYPE_AUDIT_ROOT: root, SPAROWTYPE_AUDIT_SESSION_PATH: sessionPath,
};
await writeFile(provisionFile, String.raw`<?php
declare(strict_types=1);
$created = false;
try {
  $root = getenv('SPAROWTYPE_AUDIT_ROOT');
  $name = getenv('SPAROWTYPE_AUDIT_DATABASE');
  if (!preg_match('/^sparow_mobile_games_[a-f0-9]{16}_audit$/D', $name)) throw new RuntimeException('identity');
  $original = require $root.'/backend/config.php';
  $db = $original['database'];
  if (!in_array($db['host'] ?? null, ['127.0.0.1','localhost'], true) || (int)($db['port'] ?? 0) !== 3308) throw new RuntimeException('loopback-target');
  $pdo = new PDO(sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $db['host'], $db['port']), $db['username'], $db['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  if ((int)$pdo->query('SELECT @@port')->fetchColumn() !== 3308) throw new RuntimeException('server-port');
  $check = $pdo->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');
  $check->execute([$name]);
  if ((int)$check->fetchColumn() !== 0) throw new RuntimeException('existing-schema');
  $audit = $original;
  $audit['database']['name'] = $name;
  $audit['app_key'] = bin2hex(random_bytes(32));
  $audit['session_name'] = 'sparow_audit_'.substr($name, 20, 16);
  $audit['session_save_path'] = getenv('SPAROWTYPE_AUDIT_SESSION_PATH');
  $audit['cookie_secure'] = false;
  $audit['api_prefix'] = '/api';
  $audit['allowed_origins'] = ['http://127.0.0.1:4173','http://127.0.0.1:4176','http://127.0.0.1:8080'];
  $audit['debug'] = false;
  if (file_put_contents(getenv('SPAROWTYPE_CONFIG_FILE'), "<?php\nreturn ".var_export($audit, true).";\n") === false) throw new RuntimeException('private-config');
  $pdo->exec('CREATE DATABASE '.$name.' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  $created = true;
  $pdo->exec('USE '.$name);
  if ($pdo->query('SELECT DATABASE()')->fetchColumn() !== $name) throw new RuntimeException('selected-schema');
  if ((int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn() !== 0) throw new RuntimeException('not-empty');
  $schema = file_get_contents($root.'/backend/schema.sql');
  if (preg_match('/\b(?:DROP\s+DATABASE|CREATE\s+DATABASE|USE\s+)/i', $schema)) throw new RuntimeException('schema-scope');
  $pdo->exec($schema);
  $tables = (int)$pdo->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()')->fetchColumn();
  echo json_encode(['status'=>'READY','created'=>true,'database'=>$name,'databasePort'=>3308,'tables'=>$tables,'emptyBeforeSchema'=>true,'originalApplicationDatabaseSelected'=>false,'credentialsPrinted'=>false]);
} catch (Throwable $error) {
  echo json_encode(['status'=>'UNVERIFIED','created'=>$created,'reason'=>$error instanceof PDOException ? 'Configured account could not provision or initialize an isolated audit database; no grants were changed.' : 'Isolated audit guard failed: '.$error->getMessage(),'sqlState'=>$error instanceof PDOException ? $error->getCode() : null,'credentialsPrinted'=>false]);
  exit(2);
}
`);
await writeFile(cleanupFile, String.raw`<?php
declare(strict_types=1);
try {
  $name = getenv('SPAROWTYPE_AUDIT_DATABASE');
  if (!preg_match('/^sparow_mobile_games_[a-f0-9]{16}_audit$/D', $name)) throw new RuntimeException('identity');
  $config = require getenv('SPAROWTYPE_CONFIG_FILE');
  if ($config['database']['name'] !== $name || (int)$config['database']['port'] !== 3308 || !in_array($config['database']['host'], ['127.0.0.1','localhost'], true)) throw new RuntimeException('config-identity');
  $db = $config['database'];
  $pdo = new PDO(sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $db['host'], $db['port']), $db['username'], $db['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  if ((int)$pdo->query('SELECT @@port')->fetchColumn() !== 3308) throw new RuntimeException('server-port');
  $pdo->exec('DROP DATABASE '.$name);
  $check = $pdo->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');
  $check->execute([$name]);
  echo json_encode(['ownDatabaseDropped'=>(int)$check->fetchColumn() === 0,'database'=>$name,'originalApplicationDatabaseSelected'=>false]);
} catch (Throwable $error) { echo json_encode(['ownDatabaseDropped'=>false,'reason'=>'Scoped cleanup failed; private diagnostics suppressed.']);exit(2); }
`);

let created = false;
let server;
let cleaned = false;
async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  if (server && server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise(resolve => server.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
  }
  let result = { ownDatabaseDropped: false, created: false };
  if (created) {
    const removal = spawnSync(runtime.binary, [...runtime.args, cleanupFile], { cwd: root, env: environment, encoding: 'utf8', windowsHide: true });
    try { result = JSON.parse(removal.stdout); } catch { result = { ownDatabaseDropped: false, reason: 'Scoped cleanup failed; private diagnostics suppressed.' }; }
  }
  const resolved = path.resolve(temporary);
  const expectedParent = path.resolve(os.tmpdir()) + path.sep;
  assert.ok(resolved.startsWith(expectedParent) && path.basename(resolved).startsWith('sparow-mobile-games-'), 'Temporary cleanup path escaped its own audit directory.');
  // Keep the private config if database cleanup failed, to permit scoped recovery.
  if (!created || result.ownDatabaseDropped) await rm(resolved, { recursive: true, force: true });
  await writeFile(path.join(receiptDir, 'backend-cleanup.json'), JSON.stringify({ ...result, temporaryFilesRemoved: !created || result.ownDatabaseDropped, defaultApplicationPortUntouched: 8081 }, null, 2));
  console.log(JSON.stringify({ stage: 'cleanup', ...result }));
}

try {
  const provision = spawnSync(runtime.binary, [...runtime.args, provisionFile], { cwd: root, env: environment, encoding: 'utf8', windowsHide: true });
  let receipt;
  try { receipt = JSON.parse(provision.stdout); } catch { receipt = { status: 'UNVERIFIED', created: false, reason: 'Private provisioning failed before safe JSON; diagnostics suppressed.' }; }
  created = receipt.created === true;
  await writeFile(path.join(receiptDir, 'backend-provision.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ stage: 'provision', ...receipt }));
  if (provision.status !== 0 || receipt.status !== 'READY') { await cleanup(); process.exitCode = 2; }
  else {
    const listener = net.createServer();
    await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    assert.notEqual(port, 8081);
    const api = `http://127.0.0.1:${port}/api`;
    environment.SPAROWTYPE_TEST_API_URL = api;
    environment.SPAROWTYPE_COURSE_HTTP_ACCEPTANCE = '1';
    environment.SPAROWTYPE_TEST_REPORT = path.join(receiptDir, 'backend-data.json');
    environment.SPAROWTYPE_COURSE_HTTP_REPORT = path.join(receiptDir, 'backend-course.json');
    const output = createWriteStream(path.join(receiptDir, 'backend-server.log'));
    server = spawn(runtime.binary, [...runtime.args, '-S', `127.0.0.1:${port}`, '-t', path.join(root, 'backend/public'), path.join(root, 'backend/router.php')], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.pipe(output); server.stderr.pipe(output);
    for (let attempt = 0; attempt < 50; attempt++) {
      if (server.exitCode !== null) throw new Error('Isolated PHP server exited before readiness.');
      try {
        const response = await fetch(api + '/auth/session');
        if (response.ok()) {
          assert.ok(response.headers.getSetCookie().some(cookie => cookie.startsWith('sparow_audit_')), 'Isolated cookie namespace did not match.');
          break;
        }
      } catch { /* server may still be binding */ }
      if (attempt === 49) throw new Error('Isolated PHP server was not ready.');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const identities = { api, database, databasePort: 3308, phpServerPid: server.pid, privateConfigFile: configFile, privateSessionPath: sessionPath, temporary, defaultApplicationPortUntouched: 8081, phpRuntime: runtime.binary, credentialsPrinted: false };
    await writeFile(path.join(receiptDir, 'backend-environment.json'), JSON.stringify(identities, null, 2));
    console.log(JSON.stringify({ stage: 'isolated-server-ready', ...identities }));
    for (const [name, script] of [['data', 'data-lifecycle.mjs'], ['course', 'course-lifecycle.mjs'], ['race', 'race-lifecycle.mjs']]) {
      console.log(JSON.stringify({ stage: 'suite-start', suite: name }));
      const child = spawn(process.execPath, ['--experimental-transform-types', path.join(root, 'backend/tests', script)], { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
      const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
      await writeFile(path.join(receiptDir, `backend-${name}.txt`), stdout + '\n' + stderr);
      if (name === 'race') { try { await writeFile(path.join(receiptDir, 'backend-race.json'), JSON.stringify(JSON.parse(stdout), null, 2)); } catch { /* retain raw receipt */ } }
      console.log(JSON.stringify({ stage: 'suite-complete', suite: name, exitCode: code }));
    }
    console.log(JSON.stringify({ stage: 'holding-isolated-server', ...identities, next: 'Send cleanup on stdin after coordinated browser verification.' }));
    const lines = readline.createInterface({ input: process.stdin });
    for await (const line of lines) {
      if (line.trim() === 'cleanup') { lines.close(); break; }
    }
    await cleanup();
  }
} catch (error) {
  console.log(JSON.stringify({ stage: 'runner-error', message: error.message }));
  await cleanup();
  process.exitCode = 1;
}
