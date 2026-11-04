import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, open, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL26_CLASSROOM_ISOLATION_CONFIRMATION, '1');
const build = process.env.SPAROWTYPE_FINAL26_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the actual newly frozen source26 build.');
const directory = 'audit/2026-10-27';
const output = `${directory}/final26-classroom-isolation-confirmation.json`;
const logFile = `${directory}/final26-classroom-isolation-confirmation.log`;
for (const file of [output, logFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const before = await verifyFrozenSource(`${directory}/final26-source.json`);
assert.equal(before.frozen.local.version, build);
assert.equal(before.receipt.compared, 505);
assert.deepEqual(before.receipt.mismatches, []);
const handle = await open(output, 'wx'), log = await open(logFile, 'wx');
const suites = ['classroom'];
const inputFiles = [import.meta.filename, `${directory}/pack-backend-instance-source26.mjs`, 'audit/2026-10-21/pack-apache-runtime.mjs', 'scripts/php-runtime.mjs', 'backend/tests/data-lifecycle.mjs', 'backend/tests/data-fixture.php', 'backend/tests/race-lifecycle.mjs', 'backend/tests/race-fixtures.php', 'backend/tests/course-lifecycle.mjs', 'backend/tests/course-fixture.php', 'backend/tests/pack-social-fixture.php', 'backend/tests/classroom-fixture.php', 'backend/tests/arena-audit-admin.php', '.github/workflows/ci.yml', 'backend/tests/pack-progression-lifecycle.mjs', 'backend/tests/pack-social-lifecycle.mjs', 'backend/tests/classroom-lifecycle.mjs', 'audit/mega-pack-2026-10-21/run-arena-http.mjs', 'backend/tests/password-policy.php'];
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const inputHashes = Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, await digest(file)])));
const report = { declaredAt: new Date().toISOString(), status: 'RUNNING', build,
  scope: 'Current frozen source26 isolated classroom9-check real Apache/PHP/PDO lifecycle on one wholly new synthetic database. Original8-suite quota failure retained; no browser, capacity, hosted or physical-device claim.',
  sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false, inputHashes,
  isolationConfirmation: { originalFailedReceipt: 'audit/2026-10-27/final26-native-ci.json', originalOwner: '5aca146872db63d8', originalFailure: 'Classroom signup HTTP429 after earlier suites consumed the unchanged protected30/min authentication budget.', requiredExactSuiteCount: 1, requiredExactClassroomChecks: 9, freshOwnerRequired: true, originalEightSuiteResultReplaced: false, rateCountersReset: false, productionLimitsChanged: false, testAssertionsOrOwnerCleanupChanged: false },
  sourceInventoryExtension: { previousCount: 504, expectedCount: 505, proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php'], changedExistingFrontendFiles: ['src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts'], frontendEvidenceReuse: 'NOT-USED', freshFrontendBuildAndThreeInputAndThreeFullQualityLighthouseRunsRequired: true, reason: 'Source26 uses a bounded backend request parser and production compact Arena request wire. The rejected25 replay hoist remains restored to24. Acceptance requires505 frozen files and the actual fresh frontend build; no prior UI evidence reuse is claimed.' },
  browserStarted: false, originalConfigurationRead: false, log: logFile };
const redact = value => value.replace(/NativeAudit![a-f0-9]{48}/g, '[REDACTED]')
  .replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]')
  .replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g, '$1[REDACTED]');
let stdout = '', stderr = '';
try {
  const child = spawn(process.execPath, [`${directory}/pack-backend-instance-source26.mjs`], {
    windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env,
      SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache',
      SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: suites.join(','),
      SPAROWTYPE_PACK_HOLD: '0', SPAROWTYPE_PACK_KEEP_FAILURE: '1',
      SPAROWTYPE_PACK_ATTEMPT_REASON: 'Separately authorized classroom-only9-check confirmation in a fresh source26 owner after retained8-suite HTTP429 fixture-quota exhaustion. No counter reset, production limiter change or other suite/browser/capacity workload.' } });
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  report.ownerExited = true;
  report.events = redact(stdout).split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const results = report.events.filter(event => event.stage === 'ephemeral-suite-complete');
  const cleanup = report.events.find(event => event.stage === 'ephemeral-cleanup');
  const provision = report.events.find(event => event.stage === 'ephemeral-provision');
  const ownerMatch = /^sparow_pack_([a-f0-9]{16})_audit$/.exec(provision?.database ?? '');
  assert.ok(ownerMatch, 'Fresh owned database identity missing.');
  assert.notEqual(ownerMatch[1], '5aca146872db63d8', 'Do not reuse the failed8-suite owner.');
  report.classroomReceipt = 'pack-backend-' + ownerMatch[1] + '-classroom.json';
  report.classroomResult = JSON.parse(await readFile(directory + '/' + report.classroomReceipt, 'utf8'));
  assert.equal(report.classroomResult.guardedTarget.database, provision.database);
  report.sourceAfter = (await verifyFrozenSource(`${directory}/final26-source.json`)).receipt;
  report.harnessInputsUnchanged = (await Promise.all(inputFiles.map(async file => await digest(file) === inputHashes[file]))).every(Boolean);
  report.status = report.exitCode === 0 && results.length === 1 && suites.every(name => results.filter(r => r.name === name && r.status === 'PASS' && r.exitCode === 0).length === 1) && report.classroomResult?.status === 'PASS' && report.classroomResult.passed === 9 && report.classroomResult.failed === 0 && report.classroomResult.checks.length === 9 && report.classroomResult.checks.every(check => check.status === 'PASS') && report.classroomResult.rateCountersReset === false && report.classroomResult.userDatabaseTouched === false && report.classroomResult.credentialsOrCookiesEmitted === false && cleanup?.ownProcessesStopped === true && cleanup.ownTemporaryDirectoryRemoved === true && cleanup.gracefulApacheShutdown === true && cleanup.gracefulDatabaseShutdown === true && cleanup.originalConfigRead === false && cleanup.apacheResidualPids.length === 0 && report.sourceAfter.compared === 505 && report.sourceAfter.mismatches.length === 0 && report.harnessInputsUnchanged === true ? 'PASS-SCOPED' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.failure = { name: error.name, message: redact(error.message) }; }
finally {
  report.finishedAt = new Date().toISOString();
  await log.writeFile(redact(stdout + stderr)); await log.close();
  await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close();
}
console.log(JSON.stringify({ status: report.status, output, suites: report.events?.filter(e => e.stage === 'ephemeral-suite-complete'), ownerExited: report.ownerExited }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
