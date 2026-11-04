// Preparation only until the parent explicitly grants a native-browser window.
// Service lifecycle remains with the existing guarded pack-backend-instance owner.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW, '1', 'Wait for the explicitly coordinated native-browser window.');
const directory = 'audit/2026-10-27';
const sourceFile = `${directory}/final27-source.json`;
const build = process.env.SPAROWTYPE_FINAL27_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the newly frozen source27 build explicitly.');
assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC, 'This wrapper runs the exact corrected real-backend fault case in all four engines, never a diagnostic subset.');
const readyFile = process.env.SPAROWTYPE_PACK_BROWSER_READY;
assert.ok(readyFile, 'Prepare the fresh owned instance through its stdin protocol first.');
assert.equal(path.resolve(path.dirname(readyFile)), path.resolve(directory), 'Use only this audit directoryâ€™s public ready receipt.');
assert.match(path.basename(readyFile), /^pack-backend-[a-f0-9]{16}-browser-ready\.json$/);
assert.ok(!['pack-backend-3d44c37ac589c270-browser-ready.json','pack-backend-7bbf2372eea5cde5-browser-ready.json'].includes(path.basename(readyFile)),'Original failed owners must remain closed.');
const initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.frozen.local.version, build);
assert.equal(initial.receipt.compared, 505);
assert.deepEqual(initial.receipt.mismatches, []);
const inputs = [
  `${directory}/pack-native-browser-final27-fault-confirmation.mjs`, `${directory}/pack-native-browser-final27.mjs`, `${directory}/run-final27-native-browser.mjs`, `${directory}/pack-backend-instance-source27.mjs`, 'audit/2026-10-21/pack-apache-runtime.mjs',
  'playwright.config.ts', 'e2e/php-account-flow.spec.ts', 'e2e/php-human-race.spec.ts', 'e2e/auth-flow.spec.ts', 'e2e/race-mode.spec.ts', 'e2e/php-api-fixture.ts',
];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const output = `${directory}/final27-native-fault-confirmation.json`;
const handle = await open(output, 'wx');
const log = await open(`${directory}/final27-native-fault-confirmation.log`, 'wx');
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), build, source: initial.receipt,
  scope: 'Separate fresh-owner exact corrected real-backend fault case in all four engines. Original20-case16PASS/4FAIL and freshWebKit5-case3PASS/2FAIL reports remain FAILED. Only the fixture first-input precondition changed; original assertions/timeouts remain. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.',
  engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4, workers: 1, retries: 0, traces: false,
  caseSelectionAndAssertionsChanged: false, existingCaseAssertionsChanged: false, existingTimeoutsChanged: false, addedCasesPerEngine: 0, originalFailedOwner: '3d44c37ac589c270', previousConfirmationOwner: '7bbf2372eea5cde5', freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true, existingRunner: `${directory}/pack-native-browser-final27-fault-confirmation.mjs`, inputs: inputHashes,
  readyReceipt: path.basename(readyFile), servicesStartedByWrapper: false, serviceCleanup: 'PENDING-OWNER-CLEANUP-RECEIPT',
  privateConfigsReadByWrapper: false, originalServicesOrDatabaseTouched: false,
};
let stdout = '', stderr = '', child = null;
const redact = value => String(value)
  .replace(/NativeAudit![a-f0-9]{48}/g, '[REDACTED]')
  .replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]')
  .replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g, '$1[REDACTED]');
try {
  child = spawn(process.execPath, [`${directory}/pack-native-browser-final27-fault-confirmation.mjs`], {
    cwd: process.cwd(), windowsHide: true,
    env: {
      ...process.env, SPAROWTYPE_PACK_BROWSER_ACCEPTANCE: '1', SPAROWTYPE_PACK_BROWSER_READY: readyFile,
      SPAROWTYPE_PACK_EXPECT_BUILD: build,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  report.browserRunnerPid = child.pid;
  console.log(JSON.stringify({ stage: 'final27-native-fault-confirmation-start', build, expectedCases: 4, workers: 1, retries: 0, traces: false }));
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  report.browserRunnerExited = true;
  report.events = redact(stdout).split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const completed = report.events.find(event => event.stage === 'pack-native-browser-complete');
  report.nativeResult = completed ?? null;
  report.status = report.exitCode === 0 && completed?.status === 'PASS' && completed?.exactCasesVerified === true && completed?.stats?.expected === 4 && completed?.stats?.unexpected === 0 && completed?.stats?.skipped === 0 ? 'PASS-SCOPED-BROWSER' : 'FAILED';
} catch (error) {
  report.status = 'FAILED'; report.error = { name: error.name, message: redact(error.message) };
} finally {
  await log.writeFile(redact(stdout + stderr)); await log.close();
  try {
    report.sourceAfter = (await verifyFrozenSource(sourceFile)).receipt;
    report.inputsUnchanged = (await Promise.all(inputs.map(async file => hash(await readFile(file)) === inputHashes[file]))).every(Boolean);
    if (report.sourceAfter.mismatches.length || !report.inputsUnchanged) report.status = 'FAILED';
  } catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: redact(error.message) }; }
  report.finishedAt = new Date().toISOString(); await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close();
}
console.log(JSON.stringify({ output, status: report.status, exitCode: report.exitCode, serviceCleanup: report.serviceCleanup }));
process.exitCode = report.status === 'PASS-SCOPED-BROWSER' ? 0 : 1;
