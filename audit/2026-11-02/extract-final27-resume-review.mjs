// Read-only extraction of completed local receipts; this starts no test or service.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const old = 'audit/2026-10-27', directory = 'audit/2026-11-02';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = {};
async function json(file) { const bytes = await readFile(file); inputs[file] = sha(bytes); return JSON.parse(bytes); }
function tests(report) {
  const rows = [];
  function walk(suite, parents = []) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) rows.push({
      title: spec.title, file: spec.file, line: spec.line, parents,
      engine: test.projectName ?? test.projectId, status: test.status,
      expectedStatus: test.expectedStatus, results: test.results ?? [],
    });
    for (const child of suite.suites ?? []) walk(child, [...parents, child.title]);
  }
  walk(report); return rows;
}
const sourceFile = `${old}/final27-source.json`, frozen = await json(sourceFile);
const mismatches = [], normalized = (file, bytes) => /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes;
for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
  const actual = sha(normalized(file, await readFile(file)));
  if (actual !== expected) mismatches.push({ file, expected, actual });
}
const matrixFile = `${old}/final27-browser-matrix.json`, matrix = await json(matrixFile);
const total = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
const batches = [], files = [];
for (const id of ['new-features', 'existing', 'isolated', 'first-input-timing']) {
  const prefix = `${old}/final27-${id}`, summary = await json(`${prefix}-summary.json`), protocol = await json(`${prefix}-protocol.json`), raw = await json(`${prefix}.json`);
  const rows = tests(raw), totals = { total: rows.length, passed: 0, failed: 0, skipped: 0, flaky: 0 };
  for (const row of rows) {
    const key = { expected: 'passed', unexpected: 'failed', skipped: 'skipped', flaky: 'flaky' }[row.status];
    assert.ok(key, `Unknown outcome ${row.status}`); totals[key]++;
  }
  assert.deepEqual(totals, summary.totals);
  assert.equal(summary.countsAgreeWithReport, true);
  assert.deepEqual(raw.errors ?? [], []); assert.deepEqual(summary.globalErrors, []);
  assert.equal(protocol.build.version, frozen.local.version);
  assert.deepEqual(protocol.browsers, ['chromium', 'edge', 'firefox', 'webkit']);
  assert.equal(protocol.workers, 1); assert.equal(protocol.automaticRetries, 0);
  assert.ok(rows.every(row => row.results.length <= 1 && row.results.every(result => (result.retry ?? 0) === 0)));
  assert.deepEqual(protocol.integrity, { buildUnchanged: true, testsUnchanged: true, dependenciesUnchanged: true });
  const changedCurrentProtocolInputs = [];
  for (const [file, expected] of Object.entries({ ...protocol.testHashes, ...protocol.dependencyHashes })) {
    if (sha(await readFile(file)) !== expected) changedCurrentProtocolInputs.push(file);
  }
  for (const key of Object.keys(total)) total[key] += totals[key]; files.push(...protocol.files);
  batches.push({ id, totals, engines: summary.projects, exitCode: protocol.exitCode, durationMs: protocol.durationMs,
    completedAt: protocol.finishedAt, integrityAtExecution: protocol.integrity, currentProtocolInputsChanged: changedCurrentProtocolInputs,
    globalErrors: summary.globalErrors, failures: summary.failures, skipReasons: summary.skipReasons });
}
const actualFiles = (await readdir('e2e')).filter(file => file.endsWith('.spec.ts')).map(file => `e2e/${file}`).sort();
assert.equal(actualFiles.length, 64); assert.equal(new Set(files).size, files.length); assert.deepEqual(files.sort(), actualFiles);
assert.equal(matrix.status, 'FAILED'); assert.equal(matrix.filesCoveredExactlyOnce, 64);
assert.deepEqual(total, { total: 1484, passed: 1438, failed: 17, skipped: 29, flaky: 0 });
const logicalFile = `${old}/final27-native-logical-coverage-independent-extraction.json`, logical = await json(logicalFile);
assert.equal(logical.mapping.length, 20); assert.equal(new Set(logical.mapping.map(row => row.title + '\0' + row.engine)).size, 20);
const mappedNative = [];
for (const witness of logical.mapping) {
  const raw = await json(witness.rawReport);
  const selected = tests(raw).filter(row => row.title === witness.title && row.engine === witness.engine);
  assert.equal(selected.length, 1); assert.equal(selected[0].status, 'expected');
  assert.equal(selected[0].results.length, 1); assert.equal(selected[0].results[0].status, 'passed');
  assert.equal(selected[0].results[0].retry, 0);
  mappedNative.push({ title: witness.title, engine: witness.engine, rawReport: witness.rawReport,
    normalServiceWorkerBehavior: witness.normalServiceWorkerBehavior,
    serviceWorkersBlockedOnlyForFaultTest: witness.serviceWorkersBlockedOnlyForFaultTest });
}
const native = await json(`${old}/final27-native-browser.json`);
assert.equal(native.status, 'FAILED');
assert.equal(native.nativeResult.stats.expected, 16); assert.equal(native.nativeResult.stats.unexpected, 4);
const routed = await json(`${old}/final27-native-routed-fault-confirmation.json`);
assert.equal(routed.status, 'PASS-SCOPED-BROWSER'); assert.equal(routed.nativeResult.stats.expected, 4); assert.equal(routed.nativeResult.stats.unexpected, 0);
const ordinary = await json(`${old}/final27-native-webkit-account-ordinary-confirmation.json`);
assert.equal(ordinary.status, 'PASS-SCOPED-BROWSER'); assert.equal(ordinary.nativeResult.stats.expected, 1);
const receipt = {
  capturedAt: new Date().toISOString(), status: 'VERIFIED-EXTRACTION-ORIGINAL-FULL-MATRIX-FAILED',
  actions: { testsRun: 0, buildsRun: 0, browsersStarted: 0, servicesStarted: 0, productOrTestEdits: 0, privateConfigEnvOrLogsRead: false },
  frozenSource: { sourceFile, build: frozen.local.version, compared: Object.keys(frozen.sourceHashes).length, mismatches },
  completedFullMatrix: { file: matrixFile, status: matrix.status, finishedAt: matrix.finishedAt, total, specFilesCoveredExactlyOnce: actualFiles.length,
    allFourEnginesDeclared: true, allIntegrityFlagsAtExecutionTrue: true, automaticRetries: 0, globalErrors: 0, batches },
  failureGrouping: [
    { cases: 1, engine: 'webkit', feature: 'workspace reset', observation: 'Reset guest workspace remained disabled until the30s test timeout. Cause unverified.' },
    { cases: 12, engines: 'all four', feature: 'classic/flat/outline key motion', observation: 'The assertion at live-keyboard.spec.ts524 hardcodes transform90ms; source27 deliberately uses55ms. Later assertions in those cases were not reached.' },
    { cases: 4, engines: 'all four', feature: 'typing render budget', observation: 'The assertion at typing-render-budget.spec.ts77 expects transform90ms and observed55ms. Later assertions were not reached.' },
  ],
  native: { original20CaseStatus: 'FAILED', original20CasePassed: 16, original20CaseFailed: 4,
    logicalMappingsWithScopedPassingWitness: mappedNative.length, singleClean20CaseRun: false,
    duplicateOrRepeatedExecutionsSummedAsUniquePasses: false, witnesses: mappedNative,
    routedFault: { status: routed.status, passed: routed.nativeResult.stats.expected, failed: routed.nativeResult.stats.unexpected, scope: 'Service-worker blocking is restricted to the injected-fault test contexts; original normal human-race/PWA cases retain normal behavior.' },
    ordinaryWebKitAccount: { status: ordinary.status, passed: ordinary.nativeResult.stats.expected, original90sTimeoutCause: 'UNVERIFIED' } },
  limits: ['Full matrix remainsFAILED with17failures; no selected native pass changes that status.',
    'The29skips are20credential-conditioned cases plus9WebKit audio/transferable-canvas capability cases; each remains unverified within the full frontend matrix.',
    'Native logical mapping spans distinct owners, times and testcase contexts and is not a clean single20/20run.',
    'Physical devices, field INP, hosted deployments and sustained400-client load are not established.',
    'Capacity p95 remains inheritedFAILED261/243ms against150ms; this extraction performs no capacity run.'],
  inputHashes: inputs,
};
await mkdir(directory, { recursive: true });
const output = `${directory}/final27-resume-independent-review.json`;
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: receipt.status, sourceCompared: receipt.frozenSource.compared, sourceMismatches: mismatches.length, total, nativeLogicalWitnesses: mappedNative.length }));
