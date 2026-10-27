import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { verifyFrozenSource } from './artifact-verification.mjs';

// Preparation is NOT execution. Run only after the original full matrix exits.
const build = '0572d723495d6be303a8';
const prefix = 'final17-new-features-fresh-confirmation';
const directory = 'audit/2026-10-21';
const sourceFile = `${directory}/final17-source.json`;
const sourceReportFile = `${directory}/${prefix}-source.json`;
const originalMatrixFile = `${directory}/final17-browser-matrix.json`;
const originalProtocolFile = `${directory}/final17-new-features-protocol.json`;
const helperFile = `${directory}/run-browser-checkpoint-final17.mjs`;
assert.equal(process.argv.length, 2, 'The fresh confirmation has one fixed prefix and no selection overrides.');
assert.equal(process.env.SPAROWTYPE_FINAL17_FRESH_FEATURES_WINDOW, '1', 'Wait for the explicitly coordinated fresh-feature window.');
assert.equal(process.env.SPAROWTYPE_FINAL17_BUILD_ID, build, 'Use the actual frozen17 identity.');
assert.equal(process.env.SPAROWTYPE_AUDIT_BROWSERS, 'chromium,edge,firefox,webkit');
assert.equal(process.env.SPAROWTYPE_STATIC_OUTPUTS, undefined, 'Static outputs belong to their dedicated runner.');
assert.ok(process.env.SPAROWTYPE_BROWSER_WORKERS === undefined || process.env.SPAROWTYPE_BROWSER_WORKERS === '2', 'The fresh confirmation retains worker2.');
const credentialNames = Object.keys(process.env).filter(name => name.startsWith('PHP_E2E_') || ['SPAROWTYPE_PACK_BROWSER_READY', 'SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC', 'SPAROWTYPE_NATIVE_TIMING_AUDIT'].includes(name));
assert.ok(credentialNames.length === 0, 'Unset native credential/diagnostic environment variables before this fixture-only confirmation. Values are never printed.');
for (const file of [sourceReportFile, ...['.json', '-protocol.json', '-summary.json', '.log'].map(suffix => `${directory}/${prefix}${suffix}`), `${directory}/.playwright-artifacts-${prefix}`])
  await assert.rejects(access(file), { code: 'ENOENT' });

const matrix = JSON.parse(await readFile(originalMatrixFile, 'utf8'));
const originalProtocol = JSON.parse(await readFile(originalProtocolFile, 'utf8'));
assert.ok(matrix.finishedAt && matrix.results?.length === 4, 'The original four-batch matrix must finish first; its failures remain retained.');
assert.equal(matrix.build?.version, build);
const batch = matrix.batches?.[0];
assert.ok(batch?.id === 'new-features' && batch.workers === 2 && batch.files?.length === 11 && new Set(batch.files).size === 11);
assert.ok(batch.files.every(file => /^e2e\/[a-z0-9-]+\.spec\.ts$/.test(file)));
assert.deepEqual(originalProtocol.files, batch.files);
assert.equal(originalProtocol.build?.version, build);
assert.equal(originalProtocol.workers, 2);
assert.equal(originalProtocol.tracing, 'off');
assert.equal(originalProtocol.automaticRetries, 0);
const dependencyFiles = Object.keys(originalProtocol.dependencyHashes ?? {}).sort();
assert.equal(dependencyFiles.length, 70, 'Retain the original70 dependency identities.');
assert.ok(dependencyFiles.every(file => file === 'playwright.config.ts' || /^e2e\/[a-z0-9][a-z0-9.-]*\.ts$/.test(file) && !file.includes('..')), 'Only public E2E/config dependencies are read.');
const digest = value => createHash('sha256').update(value).digest('hex');
const dependencyHashes = async () => Object.fromEntries(await Promise.all(dependencyFiles.map(async file => [file, digest(await readFile(file))])));
const sameHashes = (left, right) => dependencyFiles.every(file => left[file] === right[file]) && Object.keys(left).length === 70 && Object.keys(right).length === 70;
const sourceReport = {
  declaredAt: new Date().toISOString(), status: 'DECLARED', build, prefix,
  originalMatrixFile, originalMatrixOutcome: matrix.status, originalProtocolFile,
  files: batch.files, browsers: ['chromium', 'edge', 'firefox', 'webkit'], workers: 2,
  automaticRetries: 0, tracing: 'off', instrumentationChanged: true,
  sourceBefore: null, sourceAfter: null,
  sourceReceiptSha256Before: null, sourceReceiptSha256After: null,
  dependencyCount: 70, dependencyHashesBefore: null, dependencyHashesAfter: null,
  dependenciesEqualOriginalBefore: false, dependenciesEqualOriginalAfter: false,
  childExitCode: null, childSignal: null, browserRunnerExited: false,
  originalPrivateConfigOrDatabaseRead: false, originalServicesTouched: false,
  scope: 'Separate all11-feature four-engine fixture confirmation at the original worker2/assertion/time budgets and trace-off protocol. The original failed matrix and its raw failures are never rewritten. Source and public dependency checks occur outside test action deadlines.',
};
await writeFile(sourceReportFile, JSON.stringify(sourceReport, null, 2) + '\n', { flag: 'wx' });
let childCode = null, guardFailed = false;
try {
  sourceReport.sourceReceiptSha256Before = digest(await readFile(sourceFile));
  const before = await verifyFrozenSource(sourceFile);
  sourceReport.sourceBefore = before.receipt;
  assert.equal(before.frozen.local.version, build);
  assert.equal(before.receipt.compared, 499);
  assert.deepEqual(before.receipt.mismatches, []);
  sourceReport.dependencyHashesBefore = await dependencyHashes();
  sourceReport.dependenciesEqualOriginalBefore = sameHashes(sourceReport.dependencyHashesBefore, originalProtocol.dependencyHashes);
  assert.ok(sourceReport.dependenciesEqualOriginalBefore, 'Do not change the original assertions, fixtures, helpers or configuration.');
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [helperFile, prefix, ...batch.files], {
      windowsHide: true, env: { ...process.env, SPAROWTYPE_BROWSER_WORKERS: '2' }, stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
  childCode = result.code;
  sourceReport.childExitCode = result.code;
  sourceReport.childSignal = result.signal;
  sourceReport.browserRunnerExited = true;
} catch (error) {
  guardFailed = true;
  sourceReport.error = { name: error.name, message: 'Fresh confirmation wrapper failed; values and private data are not printed.' };
} finally {
  try {
    const after = await verifyFrozenSource(sourceFile);
    sourceReport.sourceAfter = after.receipt;
    sourceReport.sourceReceiptSha256After = digest(await readFile(sourceFile));
    sourceReport.dependencyHashesAfter = await dependencyHashes();
    sourceReport.dependenciesEqualOriginalAfter = sameHashes(sourceReport.dependencyHashesAfter, originalProtocol.dependencyHashes);
    assert.equal(after.frozen.local.version, build);
    assert.equal(after.receipt.compared, 499);
    assert.deepEqual(after.receipt.mismatches, []);
    assert.equal(sourceReport.sourceReceiptSha256After, sourceReport.sourceReceiptSha256Before);
    assert.ok(sourceReport.dependenciesEqualOriginalAfter);
  } catch (error) {
    guardFailed = true;
    sourceReport.finalSourceError = { name: error.name, message: 'Post-run source/dependency reconciliation failed; contents are not printed.' };
  }
  sourceReport.finishedAt = new Date().toISOString();
  sourceReport.status = guardFailed ? 'FAILED' : 'PASS-SCOPED-SOURCE';
  sourceReport.qualifications = 'Source-only receipt; childExitCode independently retains the browser outcome. No retry, result filtering, hosted/device or host-suspension claim.';
  await writeFile(sourceReportFile, JSON.stringify(sourceReport, null, 2) + '\n');
}
console.log(JSON.stringify({ sourceReport: path.basename(sourceReportFile), status: sourceReport.status, build, browserExitCode: childCode, originalMatrixOutcome: matrix.status }));
process.exitCode = typeof childCode === 'number' && childCode !== 0 ? childCode : guardFailed || childCode !== 0 ? 1 : 0;
