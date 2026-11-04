// Extracts existing evidence only; never reruns, filters, or changes a test.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02', original = 'audit/2026-10-27';
const hashes = {}, sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function bytes(file) { const value = await readFile(file); hashes[file] = sha(value); return value; }
async function json(file) { return JSON.parse(await bytes(file)); }
function extract(report) {
  const rows = [];
  function walk(suite, parents = []) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) rows.push({
      title: spec.title, file: spec.file.replaceAll('\\', '/').split('/').at(-1), line: spec.line,
      titlePath: [...parents, spec.title], specId: spec.id, engine: test.projectName ?? test.projectId,
      status: test.status, expectedStatus: test.expectedStatus, results: test.results ?? [],
    });
    for (const child of suite.suites ?? []) walk(child, [...parents, child.title]);
  }
  walk(report); return rows;
}
const frozenFile = `${original}/final27-source.json`, frozen = await json(frozenFile);
const sourceMismatches = [];
for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
  const raw = await readFile(file);
  const normalized = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file) ? raw.toString('utf8').replaceAll('\r\n', '\n') : raw;
  if (sha(normalized) !== expected) sourceMismatches.push(file);
}
assert.equal(Object.keys(frozen.sourceHashes).length, 505); assert.deepEqual(sourceMismatches, []);
const matrixFile = `${original}/final27-browser-matrix.json`, matrix = await json(matrixFile);
assert.equal(matrix.status, 'FAILED');
const oldFailures = [], originalTotals = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
for (const batch of ['new-features', 'existing', 'isolated', 'first-input-timing']) {
  const rawFile = `${original}/final27-${batch}.json`, raw = await json(rawFile), summary = await json(`${original}/final27-${batch}-summary.json`);
  for (const row of extract(raw)) if (row.status === 'unexpected') oldFailures.push({ ...row, rawReport: rawFile });
  for (const key of Object.keys(originalTotals)) originalTotals[key] += summary.totals[key];
}
assert.deepEqual(originalTotals, { total: 1484, passed: 1438, failed: 17, skipped: 29, flaky: 0 });
assert.equal(oldFailures.length, 17);
const prefix = `${directory}/final27-nov02-motion-reset-confirmation`;
const guard = await json(`${prefix}-guard.json`), protocol = await json(`${prefix}-protocol.json`), summary = await json(`${prefix}-summary.json`), raw = await json(`${prefix}.json`);
assert.equal(guard.status, 'PASS-SCOPED'); assert.equal(guard.exitCode, 0); assert.equal(guard.childExited, true);
assert.equal(guard.sourceBefore.compared, 505); assert.equal(guard.sourceAfter.compared, 505);
assert.deepEqual(guard.sourceBefore.mismatches, []); assert.deepEqual(guard.sourceAfter.mismatches, []);
assert.equal(guard.inputsUnchanged, true); assert.equal(guard.build, frozen.local.version);
assert.deepEqual(summary.totals, { total: 80, passed: 80, failed: 0, skipped: 0, flaky: 0 });
assert.deepEqual(summary.globalErrors, []); assert.equal(summary.countsAgreeWithReport, true);
assert.deepEqual(protocol.browsers, ['chromium', 'edge', 'firefox', 'webkit']);
assert.equal(protocol.workers, 1); assert.equal(protocol.automaticRetries, 0);
assert.deepEqual(protocol.integrity, { buildUnchanged: true, testsUnchanged: true, dependenciesUnchanged: true });
const rows = extract(raw); assert.equal(rows.length, 80);
assert.ok(rows.every(row => row.status === 'expected' && row.results.length === 1 && row.results[0].status === 'passed' && row.results[0].retry === 0));
const mapping = oldFailures.map(old => {
  const matches = rows.filter(row => row.file === old.file && row.title === old.title && row.engine === old.engine);
  assert.equal(matches.length, 1, `An exact later title+file+engine witness is required for ${old.file}/${old.engine}/${old.title}`);
  const current = matches[0];
  return {
    file: old.file, title: old.title, engine: old.engine,
    original: { rawReport: old.rawReport, specId: old.specId, status: old.status, attemptStatus: old.results.at(-1)?.status, retry: old.results[0]?.retry },
    followUp: { rawReport: `${prefix}.json`, specId: current.specId, status: current.status, attemptStatus: current.results[0].status, retry: current.results[0].retry },
    sameFileTitleAndEngine: true, sameSpecId: old.specId === current.specId,
    qualification: old.file === 'workspace-reset.spec.ts' ? 'Unchanged test passed later. This does not establish the cause of its original timeout or prove a product fix.' : 'Exactly one stale90ms expectation in this spec became the exact already-frozen55ms contract. All other test bytes remain identical.',
  };
});
assert.equal(new Set(mapping.map(row => row.file + '\0' + row.title + '\0' + row.engine)).size, 17);
const preparation = await json(`${directory}/final27-motion-contract-preparation.json`), fixtureProofs = [];
for (const change of preparation.changes) {
  const before = await bytes(change.archive), after = await bytes(change.file);
  assert.equal(sha(before), change.beforeSha256); assert.equal(sha(after), change.afterSha256);
  const text = after.toString('utf8'); assert.equal(text.split(change.to).length - 1, 1);
  assert.equal(text.replace(change.to, change.from), before.toString('utf8'));
  fixtureProofs.push({ file: change.file, archive: change.archive, beforeSha256: change.beforeSha256, afterSha256: change.afterSha256,
    exactSingleReplacement: { from: change.from, to: change.to }, allOtherBytesIdentical: true });
}
const reset = 'e2e/workspace-reset.spec.ts';
const oldProtocol = await json(`${original}/final27-new-features-protocol.json`);
assert.equal(sha(await bytes(reset)), oldProtocol.testHashes[reset]);
const productionAuditFile = `${directory}/production-dependency-audit.json`, productionAudit = await json(productionAuditFile), auditProcess = await json(`${directory}/production-dependency-audit-process.json`);
assert.equal(auditProcess.command, 'npm audit --omit=dev --json'); assert.equal(auditProcess.exitCode, 0);
assert.deepEqual(productionAudit.vulnerabilities, {}); assert.equal(productionAudit.metadata.vulnerabilities.total, 0);
const receipt = {
  capturedAt: new Date().toISOString(), status: 'VERIFIED-SCOPED-FAILURE-FOLLOW-UP-ORIGINAL-FULL-MATRIX-STILL-FAILED',
  build: frozen.local.version, currentFrozenSource: { sourceFile: frozenFile, compared: 505, mismatches: sourceMismatches },
  originalFullMatrix: { file: matrixFile, status: matrix.status, ...originalTotals, unchangedOriginalFailureCount: 17 },
  selectedFollowUp: { guard: `${prefix}-guard.json`, rawReport: `${prefix}.json`, totals: summary.totals,
    files: protocol.files, browsers: protocol.browsers, workers: 1, automaticRetries: 0, tracing: protocol.tracing,
    sourceBeforeAndAfterStable: true, runnerInputIntegrity: protocol.integrity, rawEveryCasePassedOnce: true },
  mappingCount: mapping.length, mapping, fixtureProofs,
  workspaceReset: { file: reset, rawHashEqualsOriginalFailureFixture: true, laterWebKitPassMapped: true,
    originalTimeoutCause: 'UNVERIFIED', productFixClaimed: false },
  productionDependencyAudit: { file: productionAuditFile, completedAt: auditProcess.completedAt,
    command: auditProcess.command, exitCode: 0, totalVulnerabilities: 0, productionDependencies: productionAudit.metadata.dependencies.prod,
    qualification: 'Current registry advisory snapshot for production dependencies; not a whole-application security certification.' },
  interpretation: {
    singleClean1484CaseRerun: false, originalFullMatrixStatusChanged: false,
    selected80CasesAddedToOriginalUniqueTotal: false,
    original17FailedCaseEnginePairsWithExactLaterPassingWitness: 17,
    noDefectFreeOrUniversalDeviceClaim: true,
    ongoingLimits: ['The29 original skips remain unverified in that frontend matrix.', 'Workspace-reset and earlier WebKit account timeout causes remain unverified despite passing selected confirmations.',
      'Backend capacity still misses its150ms target; source26 p95 results261/243ms retain their FAILED status.',
      'Physical-device behavior, hosted providers, field INP and sustained400-client load are not established.'],
  },
  reviewerActions: { testsRun: 0, buildsRun: 0, browsersStarted: 0, servicesStarted: 0, productOrTestEdits: 0, privateBackendConfigEnvOrLogsRead: false },
  inputHashes: hashes,
};
const output = `${directory}/final27-original17-failure-follow-up-independent-mapping.json`;
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: receipt.status, mappedOriginalFailurePairs: mapping.length, laterSelectedPassed: rows.length,
  originalFullMatrixStatus: matrix.status, sourceMismatches: sourceMismatches.length, productionVulnerabilities: 0 }));
