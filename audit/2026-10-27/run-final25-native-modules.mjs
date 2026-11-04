import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, open, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL25_NATIVE_MODULES, '1');
const build = process.env.SPAROWTYPE_FINAL25_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the actual newly frozen source25 build.');
const directory = 'audit/2026-10-27';
const output = `${directory}/final25-native-modules.json`;
const logFile = `${directory}/final25-native-modules.log`;
for (const file of [output, logFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const before = await verifyFrozenSource(`${directory}/final25-source.json`);
assert.equal(before.frozen.local.version, build);
assert.equal(before.receipt.compared, 504);
assert.deepEqual(before.receipt.mismatches, []);
const handle = await open(output, 'wx'), log = await open(logFile, 'wx');
const suites = ['progression', 'social', 'classroom', 'arena-http', 'password'];
const inputFiles = [import.meta.filename, `${directory}/pack-backend-instance-source25.mjs`, 'audit/2026-10-21/pack-apache-runtime.mjs', 'scripts/php-runtime.mjs', 'backend/tests/pack-progression-lifecycle.mjs', 'backend/tests/pack-social-lifecycle.mjs', 'backend/tests/classroom-lifecycle.mjs', 'audit/mega-pack-2026-10-21/run-arena-http.mjs', 'backend/tests/password-policy.php'];
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const inputHashes = Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, await digest(file)])));
const report = { declaredAt: new Date().toISOString(), status: 'RUNNING', build,
  scope: 'Current frozen source25 real loopback Apache/PHP/PDO/MariaDB module contracts on one wholly new synthetic database. No browser, capacity load, hosted or physical-device claim.',
  sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false, inputHashes,
  sourceInventoryExtension: { previousCount: 504, expectedCount: 504, proposedChangedBackendFiles: ['backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php'], reason: 'Source25 moves an independent authoritative Arena replay before locks with exact internal binding; execution requires the actual frozen inventory to match504. Frontend byte identity is checked separately.' },
  browserStarted: false, originalConfigurationRead: false, log: logFile };
const redact = value => value.replace(/NativeAudit![a-f0-9]{48}/g, '[REDACTED]')
  .replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]')
  .replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g, '$1[REDACTED]');
let stdout = '', stderr = '';
try {
  const child = spawn(process.execPath, [`${directory}/pack-backend-instance-source25.mjs`], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env,
      SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache',
      SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: suites.join(','),
      SPAROWTYPE_PACK_HOLD: '0', SPAROWTYPE_PACK_KEEP_FAILURE: '1',
      SPAROWTYPE_PACK_ATTEMPT_REASON: 'Fresh source25 progression/social/classroom/Arena HTTP contracts after native browser16; no browser or capacity workload.' } });
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  report.ownerExited = true;
  report.events = redact(stdout).split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const results = report.events.filter(event => event.stage === 'ephemeral-suite-complete');
  const cleanup = report.events.find(event => event.stage === 'ephemeral-cleanup');
  report.sourceAfter = (await verifyFrozenSource(`${directory}/final25-source.json`)).receipt;
  report.harnessInputsUnchanged = (await Promise.all(inputFiles.map(async file => await digest(file) === inputHashes[file]))).every(Boolean);
  report.status = report.exitCode === 0 && results.length === 5 && suites.every(name => results.filter(r => r.name === name && r.status === 'PASS' && r.exitCode === 0).length === 1) && cleanup?.ownProcessesStopped === true && cleanup.ownTemporaryDirectoryRemoved === true && cleanup.gracefulApacheShutdown === true && cleanup.gracefulDatabaseShutdown === true && cleanup.originalConfigRead === false && cleanup.apacheResidualPids.length === 0 && report.sourceAfter.compared === 504 && report.sourceAfter.mismatches.length === 0 && report.harnessInputsUnchanged === true ? 'PASS-SCOPED' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.failure = { name: error.name, message: redact(error.message) }; }
finally {
  report.finishedAt = new Date().toISOString();
  await log.writeFile(redact(stdout + stderr)); await log.close();
  await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close();
}
console.log(JSON.stringify({ status: report.status, output, suites: report.events?.filter(e => e.stage === 'ephemeral-suite-complete'), ownerExited: report.ownerExited }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
