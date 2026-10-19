import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Explicit release-coordinator operations. Default/preflight never stops a
// process. No credentials, command lines, cookies or account identities appear
// in the generated receipts. Restart is deliberately a separate npm command.
const here = import.meta.dirname;
const root = path.resolve(here, '../..');
const directory = path.join(root, 'backend/storage/mysql');
const defaults = path.join(directory, 'my.ini');
const binary = 'C:/xampp/mysql/bin/mysqld.exe';
const admin = 'C:/xampp/mysql/bin/mysqladmin.exe';
const adminConfig = path.join(root, 'backend/storage/mysqladmin-audit.cnf');
const originalMysqlPid = 12024;
const originalApiPid = 30556;
const mode = process.argv[2] || '--preflight';
assert.ok(['--preflight', '--before', '--shutdown-mysql', '--after'].includes(mode), 'Choose --preflight, --before, --shutdown-mysql or --after.');
assert.equal(process.argv.length <= 3, true, 'No additional arguments are accepted.');
assert.equal(process.platform, 'win32', 'This fixture is restricted to the prepared Windows workspace.');
const norm = value => path.resolve(value).replaceAll('\\', '/').toLowerCase();
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
function powershell(script) {
  const child = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0, 'Local process ownership inspection failed; no stop was attempted.');
  return child.stdout.trim() ? JSON.parse(child.stdout.trim()) : null;
}
function listeners(port) {
  return powershell(`$rows=@(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); $output=@(foreach($idValue in $rows){Get-CimInstance Win32_Process -Filter "ProcessId = $idValue" | Select-Object ProcessId,ExecutablePath,CommandLine}); ConvertTo-Json -InputObject $output -Compress`) || [];
}
function ownsMysql(value) {
  if (!value?.ExecutablePath || norm(value.ExecutablePath) !== norm(binary)) return false;
  const args = [...String(value.CommandLine || '').matchAll(/"([^"]*)"|([^\s"]+)/g)].map(match => match[1] ?? match[2]);
  if (![5, 6].includes(args.length) || norm(args[0]) !== norm(binary)) return false;
  const config = args.find(arg => arg.startsWith('--defaults-file='));
  const data = args.find(arg => arg.startsWith('--datadir='));
  return Boolean(config && norm(config.slice(16)) === norm(defaults) && (!data || norm(data.slice(10)) === norm(directory)) &&
    args.includes('--bind-address=127.0.0.1') && args.includes('--port=3308') && args.includes('--console') &&
    args.slice(1).every(arg => arg === config || arg === data || ['--bind-address=127.0.0.1', '--port=3308', '--console'].includes(arg)));
}
async function markerGuard() {
  const marker = JSON.parse(await readFile(path.join(directory, '.sparowtype-local-mysql.json'), 'utf8'));
  assert.equal(marker.app, 'SparowType'); assert.equal(marker.format, 1); assert.equal(marker.port, 3308);
  assert.equal(norm(marker.directory), norm(directory)); assert.equal(norm(marker.binary), norm(binary));
  assert.equal(norm(await realpath(directory)), norm(directory)); assert.equal(norm(await realpath(binary)), norm(binary));
  const ini = await readFile(defaults, 'utf8');
  const data = ini.match(/^\s*datadir\s*=\s*"?([^\r\n"]+)"?\s*$/mi);
  assert.ok(data && norm(data[1].trim()) === norm(directory), 'The existing initialized data directory is required.');
  await Promise.all(['ibdata1', 'mysql/global_priv.frm'].map(value => realpath(path.join(directory, value))));
}
async function save(name, value) {
  await writeFile(path.join(here, name), JSON.stringify(value, null, 2) + '\n');
  console.log(JSON.stringify(value, null, 2));
}
function snapshot(phase) {
  const runtime = phpRuntime();
  const child = spawnSync(runtime.binary, [...runtime.args, path.join(here, 'snapshot-php-databases.php'), `--phase=${phase}`], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0, 'Guarded read-only database snapshot failed; no credentials or diagnostics were emitted.');
  return JSON.parse(child.stdout);
}

await markerGuard();
const mysql = listeners(3308);
assert.equal(mysql.length, 1, 'Exactly one listener on the dedicated database port is required.');
assert.ok(ownsMysql(mysql[0]), 'The listener is not the exact owned initialized instance; it is left untouched.');
const base = { date: new Date().toISOString(), mysqlPort: 3308, ownedMysqlPid: mysql[0].ProcessId, initializedDirectoryMatched: true,
  unrelated3306Touched: false, unrelated3307Touched: false, databaseInitializedOrRepaired: false };

if (mode === '--preflight' || mode === '--before') {
  assert.equal(mysql[0].ProcessId, originalMysqlPid, 'Preflight expects the originally recorded acceptance daemon.');
  const api = listeners(8081);
  assert.equal(api.length, 1); assert.equal(api[0].ProcessId, originalApiPid);
  assert.equal(norm(api[0].ExecutablePath), norm('C:/xampp/php/php.exe'));
  assert.ok(String(api[0].CommandLine).includes('-S 127.0.0.1:8081 -t backend/public backend/router.php'));
  const counts = mode === '--before' ? snapshot('before-coldstart') : null;
  await save(mode === '--before' ? 'php-coldstart-before.json' : 'php-coldstart-preflight.json', { ...base,
    mode: mode.slice(2), ownedApiPid: originalApiPid, processesStopped: false, dataReadOnlySnapshotTaken: Boolean(counts),
    countsReceipt: counts ? 'php-database-counts-before-coldstart.json' : null,
    nextStep: 'Only after all tests exit, invoke --shutdown-mysql explicitly, then run npm run backend:db in a dedicated terminal.' });
} else if (mode === '--shutdown-mysql') {
  assert.equal(mysql[0].ProcessId, originalMysqlPid, 'Shutdown is authorized only for the original exact PID12024.');
  const before = JSON.parse(await readFile(path.join(here, 'php-coldstart-before.json'), 'utf8'));
  assert.equal(before.ownedMysqlPid, originalMysqlPid); assert.equal(before.dataReadOnlySnapshotTaken, true);
  const elapsed = Date.now() - Date.parse(before.date);
  assert.ok(elapsed >= 0 && elapsed < 15 * 60_000, 'Take a fresh --before receipt after all tests finish.');
  const cnf = await readFile(adminConfig, 'utf8');
  const parsed = Object.create(null); let section = '';
  for (const raw of cnf.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[')) { assert.equal(line, '[client]'); section = 'client'; continue; }
    assert.equal(section, 'client'); const match = line.match(/^([a-z_]+)\s*=\s*(.*)$/i); assert.ok(match);
    assert.ok(['host', 'port', 'user', 'password', 'protocol'].includes(match[1].toLowerCase()));
    parsed[match[1].toLowerCase()] = match[2];
  }
  assert.equal(parsed.host, '127.0.0.1'); assert.equal(Number(parsed.port), 3308); assert.equal(parsed.user, 'root');
  assert.ok(parsed.protocol === undefined || parsed.protocol.toLowerCase() === 'tcp');
  // Configuration is passed by path, never command-line credentials or output.
  const stop = spawnSync(admin, [`--defaults-file=${adminConfig}`, 'shutdown'], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 25_000 });
  assert.equal(stop.status, 0, 'Native mysqladmin did not confirm shutdown; no force kill was attempted.');
  let stopped = false;
  for (let i = 0; i < 20; i++) {
    const original = powershell(`$output=@(Get-CimInstance Win32_Process -Filter "ProcessId = ${originalMysqlPid}" -ErrorAction SilentlyContinue | Select-Object ProcessId); ConvertTo-Json -InputObject $output -Compress`) || [];
    if (!original.length && !listeners(3308).length) { stopped = true; break; }
    await pause(250);
  }
  assert.ok(stopped, 'The original daemon has not fully exited; no replacement was started or process force-killed.');
  await save('php-coldstart-shutdown.json', { ...base, mode: 'shutdown-mysql', nativeMysqladminExit: stop.status,
    gracefulShutdownConfirmed: true, originalPidExited: true, portReleased: true, forcedTermination: false,
    apiStoppedByThisHelper: false, replacementStartedByThisHelper: false });
} else {
  assert.notEqual(mysql[0].ProcessId, originalMysqlPid, 'A new owned daemon PID is required after the explicit cold restart.');
  assert.ok(String(mysql[0].CommandLine).includes('--datadir='), 'The replacement must pin the prepared directory explicitly, as the restart helper does.');
  const shutdown = JSON.parse(await readFile(path.join(here, 'php-coldstart-shutdown.json'), 'utf8'));
  assert.equal(shutdown.gracefulShutdownConfirmed, true);
  const before = JSON.parse(await readFile(path.join(here, 'php-database-counts-before-coldstart.json'), 'utf8'));
  const after = snapshot('after-coldstart');
  const dataProjection = value => ({ ...value, tableCounts: Object.fromEntries(Object.entries(value.tableCounts).filter(([table]) => table !== 'rate_limits')) });
  const preserved = Object.fromEntries(['main', 'audit'].map(role => [role,
    JSON.stringify(dataProjection(before.databases[role])) === JSON.stringify(dataProjection(after.databases[role]))]));
  const rateCounts = Object.fromEntries(['main', 'audit'].map(role => [role, {
    before: before.databases[role].tableCounts.rate_limits, after: after.databases[role].tableCounts.rate_limits,
  }]));
  const api = listeners(8081);
  assert.equal(api.length, 1); assert.notEqual(api[0].ProcessId, originalApiPid, 'Restart the owned API with the normal main configuration before this final check.');
  assert.equal(norm(api[0].ExecutablePath), norm('C:/xampp/php/php.exe'));
  assert.ok(String(api[0].CommandLine).includes('-S 127.0.0.1:8081 -t backend/public backend/router.php'));
  const response = await fetch('http://127.0.0.1:8081/api/health', { signal: AbortSignal.timeout(10_000) });
  const health = await response.json(); assert.equal(response.status, 200); assert.equal(health.ok, true);
  assert.equal(health.backend, 'php-mysql'); assert.equal(health.schemaVersion, 1);
  const runtime = phpRuntime();
  const sessionConfig = spawnSync(runtime.binary, [...runtime.args, '-r', '$a=require $argv[1];$b=require $argv[2];echo json_encode([$a["session_name"],$b["session_name"]]);',
    path.join(root, 'backend/config.php'), path.join(root, 'backend/audit-config.local.php')], { encoding: 'utf8', windowsHide: true });
  assert.equal(sessionConfig.status, 0); const names = JSON.parse(sessionConfig.stdout); assert.notEqual(names[0], names[1]);
  const mainNamespace = response.headers.getSetCookie().some(value => value.startsWith(`${names[0]}=`));
  assert.equal(mainNamespace, true, 'The API session namespace must match the main config, not the acceptance config.');
  await save('php-coldstart-after.json', { ...base, mode: 'after', originalMysqlPid, newMysqlPid: mysql[0].ProcessId,
    replacementUsesPreparedHelperOptions: true, applicationDataAggregateCountsPreserved: preserved,
    allApplicationDataAggregateCountsPreserved: Object.values(preserved).every(Boolean),
    rateBucketCountsBeforeAfter: rateCounts, rateCountScope: 'Reported separately because normal startup/health requests can create transient rate buckets.',
    countsReceipt: 'php-database-counts-after-coldstart.json',
    newApiPid: api[0].ProcessId, apiHealth: { ok: health.ok, backend: health.backend, schemaVersion: health.schemaVersion }, apiMainSessionNamespaceMatched: true,
    healthCheckScope: 'GET /health creates only normal guest session/API rate evidence; no account or result is written.',
    forcedTermination: false, limitations: 'Aggregate counts verify persistence at the table/count level; they are not a byte-for-byte database backup comparison.' });
  assert.ok(Object.values(preserved).every(Boolean), 'Application-data aggregate counts changed; inspect both sanitized snapshots before claiming persistence.');
}
