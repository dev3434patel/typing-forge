// Preparation only until the parent explicitly grants a native-browser window.
// Service lifecycle remains with the existing guarded pack-backend-instance owner.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { open, readFile } from 'node:fs/promises';
import path from 'node:path';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL17_NATIVE_BROWSER_WINDOW, '1', 'Wait for the explicitly coordinated native-browser window.');
const directory = 'audit/2026-10-21';
const sourceFile = `${directory}/final17-source.json`;
const build = process.env.SPAROWTYPE_FINAL17_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the newly frozen source17 build explicitly.');
assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC, 'This wrapper runs all16 native cases, never a diagnostic subset.');
const readyFile = process.env.SPAROWTYPE_PACK_BROWSER_READY;
assert.ok(readyFile, 'Prepare the fresh owned instance through its stdin protocol first.');
assert.equal(path.resolve(path.dirname(readyFile)), path.resolve(directory), 'Use only this audit directory’s public ready receipt.');
assert.match(path.basename(readyFile), /^pack-backend-[a-f0-9]{16}-browser-ready\.json$/);
const initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.frozen.local.version, build);
assert.deepEqual(initial.receipt.mismatches, []);
const inputs = [
  `${directory}/pack-native-browser.mjs`, `${directory}/pack-backend-instance.mjs`, `${directory}/pack-apache-runtime.mjs`,
  'playwright.config.ts', 'e2e/php-account-flow.spec.ts', 'e2e/php-human-race.spec.ts', 'e2e/auth-flow.spec.ts', 'e2e/race-mode.spec.ts', 'e2e/php-api-fixture.ts',
];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const output = `${directory}/final17-native-browser.json`;
const handle = await open(output, 'wx');
const log = await open(`${directory}/final17-native-browser.log`, 'wx');
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), build, source: initial.receipt,
  scope: 'Exact existing16 account and human-race browser cases against a separately owned fresh Apache/PHP/PDO/MariaDB instance and its build-matched preview. No capacity, hosted or physical-keyboard-device claim.',
  engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 16, workers: 1, retries: 0, traces: false,
  caseSelectionAndAssertionsChanged: false, existingRunner: `${directory}/pack-native-browser.mjs`, inputs: inputHashes,
  readyReceipt: path.basename(readyFile), servicesStartedByWrapper: false, serviceCleanup: 'PENDING-OWNER-CLEANUP-RECEIPT',
  privateConfigsReadByWrapper: false, originalServicesOrDatabaseTouched: false,
};
let stdout = '', stderr = '', child = null;
const redact = value => String(value)
  .replace(/NativeAudit![a-f0-9]{48}/g, '[REDACTED]')
  .replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]')
  .replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g, '$1[REDACTED]');
try {
  child = spawn(process.execPath, [`${directory}/pack-native-browser.mjs`], {
    cwd: process.cwd(), windowsHide: true,
    env: {
      ...process.env, SPAROWTYPE_PACK_BROWSER_ACCEPTANCE: '1', SPAROWTYPE_PACK_BROWSER_READY: readyFile,
      SPAROWTYPE_PACK_EXPECT_BUILD: build,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  report.browserRunnerPid = child.pid;
  console.log(JSON.stringify({ stage: 'final17-native-browser-start', build, expectedCases: 16, workers: 1, retries: 0, traces: false }));
  child.stdout.on('data', bytes => { stdout += bytes; });
  child.stderr.on('data', bytes => { stderr += bytes; });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  report.browserRunnerExited = true;
  report.events = redact(stdout).split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  const completed = report.events.find(event => event.stage === 'pack-native-browser-complete');
  report.nativeResult = completed ?? null;
  report.status = report.exitCode === 0 && completed?.status === 'PASS' && completed?.stats?.expected === 16 && completed?.stats?.unexpected === 0 && completed?.stats?.skipped === 0 ? 'PASS-SCOPED-BROWSER' : 'FAILED';
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
