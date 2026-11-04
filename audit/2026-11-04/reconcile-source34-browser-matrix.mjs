import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const matrixFile = 'audit/2026-11-02/final34-browser-matrix.json';
const output = 'audit/2026-11-04/source34-browser-matrix-reconciliation.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const sha = value => createHash('sha256').update(value).digest('hex');
const bind = async file => {
  const bytes = await readFile(file);
  return { file, sha256: sha(bytes), bytes: bytes.length };
};
const matrix = JSON.parse(await readFile(matrixFile, 'utf8'));
assert.equal(matrix.status, 'FAILED');
assert.equal(matrix.filesCoveredExactlyOnce, 64);
assert.equal(matrix.automaticRetries, 0);
assert.deepEqual(matrix.browsers, ['chromium', 'edge', 'firefox', 'webkit']);
assert.equal(matrix.executionProfile.workersPerBatch, 1);
assert.equal(matrix.executionProfile.filesFiltered, false);
const totals = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
const batches = [];
const failures = [];
const nativeCases = [];
const flatten = suites => suites.flatMap(suite => [
  ...(suite.specs ?? []).flatMap(spec => spec.tests.map(test => ({ spec, test }))),
  ...flatten(suite.suites ?? []),
]);
for (const result of matrix.results) {
  const stem = `audit/2026-11-02/final34-${result.id}`;
  const raw = JSON.parse(await readFile(`${stem}.json`, 'utf8'));
  const summary = JSON.parse(await readFile(`${stem}-summary.json`, 'utf8'));
  const protocol = JSON.parse(await readFile(`${stem}-protocol.json`, 'utf8'));
  assert.deepEqual(result.summary, summary);
  assert.equal(summary.countsAgreeWithReport, true);
  assert.equal(protocol.automaticRetries, 0);
  assert.equal(protocol.workers, 1);
  assert.deepEqual(protocol.browsers, matrix.browsers);
  assert.equal(protocol.sourceAfter.compared, 505);
  assert.deepEqual(protocol.sourceAfter.mismatches, []);
  assert.ok(Object.values(protocol.integrity).every(value => value === true));
  for (const key of Object.keys(totals)) totals[key] += summary.totals[key];
  for (const { spec, test } of flatten(raw.suites)) {
    const statuses = test.results.map(row => row.status);
    if (statuses.some(status => ['failed', 'timedOut', 'interrupted'].includes(status))) {
      failures.push({
        batch: result.id,
        caseId: spec.id,
        project: test.projectName,
        file: `e2e/${spec.file.replace(/^e2e[\\/]/, '')}`,
        line: spec.line,
        title: spec.title,
        attempts: test.results.length,
        statuses,
        errors: test.results.flatMap(row => row.errors ?? (row.error ? [row.error] : [])),
        attachments: test.results.flatMap(row => row.attachments ?? []),
      });
    }
    if (test.results.some(row => row.status === 'skipped')) nativeCases.push({ project: test.projectName, file: spec.file, title: spec.title, annotations: test.annotations });
  }
  batches.push({
    id: result.id,
    exitCode: result.exitCode,
    status: protocol.status,
    totals: summary.totals,
    integrity: protocol.integrity,
    files: await Promise.all(['.json', '-summary.json', '-protocol.json', '.log'].map(suffix => bind(`${stem}${suffix}`))),
    skipReasons: summary.skipReasons,
  });
}
assert.deepEqual(totals, { total: 1516, passed: 1483, failed: 4, skipped: 29, flaky: 0 });
assert.equal(failures.length, 4);
assert.ok(failures.every(row => row.attempts === 1));
assert.equal(nativeCases.length, 29);
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
assert.equal(frozen.frozen.local.version, '332e23584f1e36465df2');
const receipt = {
  status: 'FAILED-ORIGINAL-FULL-MATRIX',
  recordedAt: new Date().toISOString(),
  source: frozen.receipt,
  sourceManifest: await bind('audit/2026-11-02/final34-source.json'),
  build: frozen.frozen.local.version,
  originalMatrix: await bind(matrixFile),
  originalStatus: matrix.status,
  declaredAt: matrix.declaredAt,
  finishedAt: matrix.finishedAt,
  specFilesCoveredExactlyOnce: matrix.filesCoveredExactlyOnce,
  browsers: matrix.browsers,
  workers: 1,
  automaticRetries: 0,
  totals,
  batches,
  failures,
  skippedCases: nativeCases,
  skipQualification: '20 explicit real-backend credential/acceptance cases remain assigned to native20; nine WebKit native AudioContext/transferable-canvas API gaps remain UNVERIFIED. No skip is promoted to a pass.',
  fullMatrixStatusRemainsFailed: true,
  followUpExecutedByThisReconciliation: false,
  originalReportsOverwritten: false,
  sourceOrTestsEdited: false,
  runtimeOrBrowserStarted: false,
  qualification: 'Read-only post-run binding of the original complete64-file source34 matrix. Later test synchronization revisions and focused confirmations, if approved and actually executed, must be separate evidence and cannot rewrite these four original failures.',
};
await writeFile(output, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ output, status: receipt.status, totals, batchIntegrityAllTrue: true, failures: failures.map(({ caseId, project, file, line, title }) => ({ caseId, project, file, line, title })) }));
