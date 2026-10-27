// Resume only the exact marked synthetic instance whose original processes have
// disappeared. No initialization, schema changes, account seeding or rate reset.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { readFile, realpath, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

assert.equal(process.env.SPAROWTYPE_EPHEMERAL_RESUME, '1', 'Explicit coordinated same-owned recovery is required.');
const receipts = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(receipts, '../..');
const old = JSON.parse(await readFile(path.join(receipts, 'backend-ephemeral-environment.json'), 'utf8'));
const browserReady = JSON.parse(await readFile(path.join(receipts, 'backend-ephemeral-browser-ready.json'), 'utf8'));
const owned = await realpath(old.privateDirectory);
const storage = await realpath(path.join(root, 'backend/storage'));
assert.equal(path.dirname(owned).toLowerCase(), storage.toLowerCase());
assert.equal(path.basename(owned), 'mobile-games-instance-6bbf6bd3f79ea1fe');
const marker = JSON.parse(await readFile(path.join(owned, 'ownership.json'), 'utf8'));
assert.equal(marker.id, '6bbf6bd3f79ea1fe'); assert.equal(marker.runnerPid, 53456);
assert.equal(path.resolve(marker.root).toLowerCase(), root.toLowerCase());
const admin = JSON.parse(await readFile(path.join(owned, 'admin.json'), 'utf8'));
const app = JSON.parse(await readFile(path.join(owned, 'app.json'), 'utf8'));
const privateBrowser = JSON.parse(await readFile(browserReady.privateBrowserEnvFile, 'utf8'));
assert.equal(admin.database.host, '127.0.0.1'); assert.equal(admin.database.port, 5058);
assert.equal(admin.database.name, 'sparow_mobile_games_6bbf6bd3f79ea1fe_audit');
assert.equal(admin.identity.datadir, path.join(owned, 'data'));
assert.equal(admin.identity.pidFile, path.join(owned, 'mariadb.pid'));
assert.equal(app.session_name, 'sparow_ephemeral_6bbf6bd3f79ea1fe');
assert.equal(privateBrowser.PLAYWRIGHT_BASE_URL, 'http://127.0.0.1:6003');
assert.equal(privateBrowser.SPAROWTYPE_PHP_URL, 'http://127.0.0.1:5059');
assert.equal(privateBrowser.SPAROWTYPE_CONFIG_FILE, path.join(owned, 'app-config.php'));
const protectedPids = [19308, 18028, 54056];
for (const pid of [marker.runnerPid, old.databasePid, old.phpPid, browserReady.previewPid]) {
  assert.ok(!protectedPids.includes(pid));
  let alive = true;
  try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') alive = false; else throw error; }
  assert.equal(alive, false, `Prior owned process${pid} must be absent before recovery.`);
}
const runtime = phpRuntime();
const environment = { ...process.env, PHP_BINARY: runtime.binary, PHPRC: path.join(owned, 'php.ini'), PHP_INI_SCAN_DIR: path.join(owned, 'php-empty-scan'), SPAROWTYPE_CONFIG_FILE: path.join(owned, 'app-config.php'), SPAROWTYPE_PHP_URL: 'http://127.0.0.1:5059', SPAROWTYPE_DEPLOY_TARGET: 'php', SPAROWTYPE_BASE_PATH: '/', VITE_API_BASE_URL: '/api' };
const children = [];
let db = null, api = null, preview = null, cleaning = false;
const logDirectory = path.join(owned, 'logs');
const proof = { originalOwnedId: marker.id, originalRunnerPid: marker.runnerPid, resumedRunnerPid: process.pid, disappearanceCause: 'UNPROVEN; no internal HOLD lease or shutdown receipt found', existingSecretsAndCountersRetained: true, accountsReseeded: false, countersReset: false, originalConfigRead: false, deniedDirectoriesTouched: false };
await writeFile(path.join(owned, 'resume-ownership.json'), JSON.stringify({ ...proof, created: new Date().toISOString() }));
function exited(child) { return !child || child.exitCode !== null || child.signalCode !== null; }
async function waitClosed(child) {
  if (exited(child)) return true;
  return Promise.race([new Promise(resolve => child.once('close', () => resolve(true))), new Promise(resolve => { const timer = setTimeout(() => resolve(false), 8000); timer.unref(); })]);
}
async function receipt(name, value) { await writeFile(path.join(receipts, `backend-ephemeral-${name}.json`), `${JSON.stringify(value, null, 2)}\n`); }
function message(value) { console.log(JSON.stringify(value)); }
async function portFree(port) {
  assert.ok(![3307, 3308, 4173, 8081].includes(port));
  const listener = net.createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(port, '127.0.0.1', resolve); });
  await new Promise(resolve => listener.close(resolve));
}
function start(binary, args, name, cwd = owned) {
  const child = spawn(binary, args, { cwd, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  assert.ok(!protectedPids.includes(child.pid));
  children.push(child);
  const stream = createWriteStream(path.join(logDirectory, `${name}.log`));
  child.stdout.pipe(stream, { end: false }); child.stderr.pipe(stream, { end: false });
  child.once('close', () => stream.end()); child.on('error', () => {});
  return child;
}
async function guard(operation) {
  const child = spawn(runtime.binary, [...runtime.args, path.join(owned, 'guard.php')], { cwd: root, env: environment, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', errors = '';
  child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { errors += chunk; });
  child.stdin.end(JSON.stringify({ operation, expectedPid: db.pid }));
  const timeout = setTimeout(() => child.kill(), 15000);
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }).finally(() => clearTimeout(timeout));
  await writeFile(path.join(logDirectory, `resume-guard-${operation}.log`), output + '\n' + errors);
  assert.equal(code, 0, `Owned resume ${operation} guard failed; private diagnostics retained.`);
  return JSON.parse(output);
}
async function cleanup() {
  if (cleaning) return;
  cleaning = true;
  for (const child of [preview, api]) if (!exited(child)) { child.kill(); await waitClosed(child); }
  let gracefulDatabaseShutdown = false, forcedOwnDatabaseStop = false;
  if (!exited(db)) {
    try { assert.equal((await guard('shutdown')).shutdownRequested, true); gracefulDatabaseShutdown = true; } catch { /* Only this owned child can be stopped below. */ }
    if (!(await waitClosed(db))) { db.kill(); forcedOwnDatabaseStop = true; await waitClosed(db); }
  }
  const stopped = children.every(exited);
  const resolved = await realpath(owned);
  assert.equal(path.dirname(resolved).toLowerCase(), storage.toLowerCase());
  assert.equal(path.basename(resolved), `mobile-games-instance-${marker.id}`);
  const originalMarker = JSON.parse(await readFile(path.join(resolved, 'ownership.json'), 'utf8'));
  const resumeMarker = JSON.parse(await readFile(path.join(resolved, 'resume-ownership.json'), 'utf8'));
  assert.equal(originalMarker.id, marker.id); assert.equal(originalMarker.runnerPid, marker.runnerPid);
  assert.equal(resumeMarker.resumedRunnerPid, process.pid);
  if (stopped) await rm(resolved, { recursive: true, force: false });
  const value = { date: new Date().toISOString(), ...proof, ownProcessesStopped: stopped, gracefulDatabaseShutdown, forcedOwnDatabaseStop, ownTemporaryDirectoryRemoved: stopped, removedDirectory: stopped ? resolved : null, protectedOriginalPids: protectedPids, noWindowsServiceCreated: true };
  await receipt('cleanup', value); message({ stage: 'resumed-owned-cleanup', ...value });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { cleanup().finally(() => process.exit(130)); });
try {
  for (const port of [5058, 5059, 6003]) await portFree(port);
  db = start('C:/xampp/mysql/bin/mysqld.exe', ['--no-defaults', '--basedir=C:/xampp/mysql', `--datadir=${admin.identity.datadir}`, `--tmpdir=${owned}`, '--port=5058', '--bind-address=127.0.0.1', '--skip-name-resolve', `--pid-file=${admin.identity.pidFile}`, `--log-error=${path.join(logDirectory, 'mariadb-resume-errors.log')}`, '--innodb-buffer-pool-size=32M', '--aria-pagecache-buffer-size=16M', '--key-buffer-size=8M', '--max-connections=16', '--performance-schema=OFF', '--skip-slave-start', '--skip-log-bin', '--named-pipe=OFF'], 'resume-mariadb-console');
  let identity = null;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(exited(db), false, 'Owned resumed database exited during startup.');
    try { identity = await guard('identity'); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.equal(identity?.identityVerified, true);
  api = start(runtime.binary, [...runtime.args, '-S', '127.0.0.1:5059', '-t', path.join(root, 'backend/public'), path.join(root, 'backend/router.php')], 'resume-php-server');
  preview = start(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '6003', '--strictPort', '--outDir', path.join(root, 'dist')], 'resume-preview', root);
  let namespaceVerified = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(exited(api) || exited(preview), false, 'Owned resumed HTTP process exited during startup.');
    try {
      const response = await fetch('http://127.0.0.1:6003/api/auth/session', { signal: AbortSignal.timeout(1000) });
      if (response.ok && response.headers.getSetCookie().some(value => value.startsWith(`${app.session_name}=`))) { namespaceVerified = true; break; }
    } catch { /* Wait for bind/proxy readiness. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(namespaceVerified, true, 'The original isolated cookie namespace did not match.');
  const healthResponse = await fetch('http://127.0.0.1:6003/api/health', { signal: AbortSignal.timeout(3000) });
  assert.equal(healthResponse.ok, true);
  const health = await healthResponse.json(); assert.equal(health.ok, true); assert.equal(health.schemaVersion, 1);
  const localBuild = await readFile(path.join(root, 'dist/offline-build.json'));
  const remoteBuildResponse = await fetch('http://127.0.0.1:6003/offline-build.json', { signal: AbortSignal.timeout(3000) });
  assert.equal(remoteBuildResponse.ok, true);
  const remoteBuild = Buffer.from(await remoteBuildResponse.arrayBuffer());
  assert.equal(createHash('sha256').update(remoteBuild).digest('hex'), createHash('sha256').update(localBuild).digest('hex'));
  assert.equal(JSON.parse(remoteBuild).version, '75b0ca89254fc510f652');
  const value = { date: new Date().toISOString(), ...proof, databasePort: 5058, api: 'http://127.0.0.1:5059/api', baseUrl: 'http://127.0.0.1:6003', actualDatabasePid: db.pid, actualPhpPid: api.pid, actualPreviewPid: preview.pid, datadirPortPidGuardPassed: identity.identityVerified, exactCookieNamespacePassed: namespaceVerified, healthPassed: health.ok, schemaVersion: health.schemaVersion, fetchedBuildVersion: JSON.parse(remoteBuild).version, localRemoteBuildBytesMatch: true, browserStarted: false };
  await receipt('resume-environment', value); message({ stage: 'resumed-owned-ready', ...value });
  const lines = readline.createInterface({ input: process.stdin });
  for await (const line of lines) if (line.trim() === 'cleanup') { lines.close(); break; }
} catch (error) {
  await receipt('resume-failure', { date: new Date().toISOString(), reason: error.message, ...proof });
  message({ stage: 'owned-resume-failed', reason: error.message }); process.exitCode = 1;
} finally { await cleanup(); }
