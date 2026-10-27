// Read completed audit receipts only. Never launches a runner, reads private
// configuration, changes application/source data, or rewrites existing evidence.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const build = '0572d723495d6be303a8';
if (process.env.SPAROWTYPE_FINAL17_BUILD_ID !== undefined) assert.equal(process.env.SPAROWTYPE_FINAL17_BUILD_ID, build, 'Verifier is bound only to actual17.');
const audit = path.resolve(import.meta.dirname);
const overrides = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index], value = process.argv[index + 1];
  assert.ok(['--matrix', '--placement', '--native'].includes(key) && value);
  assert.equal(overrides[key], undefined, 'Duplicate receipt override.');
  overrides[key] = value;
}
assert.equal(overrides['--matrix'] ?? 'final17-browser-matrix.json', 'final17-browser-matrix.json', 'The original17 matrix lineage is fixed; fresh coverage has its separate explicit section.');
const engines = ['chromium', 'edge', 'firefox', 'webkit'];
const rows = [];
const identifier = value => typeof value === 'string' ? value : value?.version;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const empty = value => Array.isArray(value) && value.length === 0;
const sameEngines = value => Array.isArray(value) && JSON.stringify([...value].sort()) === JSON.stringify([...engines].sort());
const allPassed = checks => Array.isArray(checks) && checks.length > 0 && checks.every(check => check.pass === true);

async function json(file) {
  const resolved = path.resolve(audit, file);
  assert.equal(path.dirname(resolved).toLowerCase(), audit.toLowerCase(), 'Only same-directory audit JSON receipts are readable.');
  assert.match(path.basename(resolved), /^[a-z0-9][a-z0-9.-]*\.json$/);
  try { return JSON.parse(await readFile(resolved, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function gate(id, file, evaluate, allowPartial = false) {
  const row = { id, receipt: file, status: 'NOT-RUN', checks: [], pendingDependencies: [] };
  rows.push(row);
  const check = (name, pass, observed) => row.checks.push({ name, pass: pass === true, ...(observed === undefined ? {} : { observed }) });
  try {
    const data = await json(file);
    if (!data) return null;
    const incomplete = Boolean(data.status && /^(?:RUNNING|PARTIAL|DECLARED|PREPARED|NOT-RUN)/.test(data.status));
    if (incomplete) { row.observedStatus = data.status; if (!allowPartial) { row.status = 'PARTIAL'; return data; } }
    if (data.status && /^(?:FAILED|ERROR)/.test(data.status))
      check('receipt does not report a failed operation', false, data.status);
    await evaluate(data, check, row);
    row.status = row.checks.some(check => !check.pass) ? 'FAILED' : incomplete || row.pendingDependencies.length ? 'PARTIAL' : 'PASS-SCOPED';
    return data;
  } catch (error) { row.status = 'FAILED'; row.error = { name: error.name, message: 'Public receipt reconciliation failed; contents are not printed.' }; return null; }
}


function inspectRaw(raw) {
  const cases = [];
  const walk = (suites, inherited = '') => { for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const results = test.results ?? [], last = results.at(-1), file = (spec.file ?? suite.file ?? inherited).replaceAll(String.fromCharCode(92), '/');
      const normalized = file.includes('/e2e/') ? `e2e/${file.split('/e2e/').at(-1)}` : file.startsWith('e2e/') ? file : `e2e/${path.posix.basename(file)}`;
      cases.push({ file: normalized, title: spec.title, project: test.projectName, status: last?.status === 'skipped' ? 'skipped' : last?.status === 'passed' && (test.expectedStatus ?? 'passed') === 'passed' ? 'passed' : 'failed', attempts: results.length, retries: results.map(r => r.retry), expectedFailure: !['passed', 'skipped'].includes(test.expectedStatus ?? 'passed'), reasons: [...(spec.annotations ?? []), ...(test.annotations ?? [])].filter(a => a.type === 'skip' && typeof a.description === 'string' && a.description).map(a => a.description) });
    }
    walk(suite.suites, suite.file ?? inherited);
  }};
  walk(raw.suites);
  const counts = selected => ({ total: selected.length, passed: selected.filter(c => c.status === 'passed').length, failed: selected.filter(c => c.status === 'failed').length, skipped: selected.filter(c => c.status === 'skipped').length, flaky: selected.filter(c => c.attempts > 1).length });
  return { cases, totals: counts(cases), projects: Object.fromEntries(engines.map(e => [e, counts(cases.filter(c => c.project === e))])), stats: raw.stats, globalErrors: (raw.errors ?? []).length };
}
function checkRaw(actual, summary, check, label, files) {
  check(`${label}: actual raw totals equal summary`, Object.entries(actual.totals).every(([key, value]) => summary?.totals?.[key] === value), actual.totals);
  check(`${label}: stats agree/no global errors`, actual.stats?.expected === actual.totals.passed && actual.stats.unexpected === actual.totals.failed && actual.stats.skipped === actual.totals.skipped && actual.stats.flaky === actual.totals.flaky && actual.globalErrors === 0);
  check(`${label}: one attempt/retry0/no expected-failure masking`, actual.cases.length > 0 && actual.cases.every(c => c.attempts === 1 && c.retries[0] === 0 && !c.expectedFailure));
  check(`${label}: all actual project counts agree`, sameEngines(summary?.projects?.map(p => p.project)) && engines.every(e => { const p = summary.projects.find(p => p.project === e); return actual.projects[e].total > 0 && Object.entries(actual.projects[e]).every(([key, value]) => p[key] === value); }), actual.projects);
  if (files) check(`${label}: raw files equal declared batch`, JSON.stringify([...new Set(actual.cases.map(c => c.file))].sort()) === JSON.stringify([...files].sort()));
  check(`${label}: all raw conditional skips explained`, actual.cases.filter(c => c.status === 'skipped').every(c => c.reasons.length > 0));
}

await gate('frozen-source', 'final17-source.json', (data, check) => {
  check('actual normal identity', identifier(data.local) === build && identifier(data.served) === build);
  check('local and served metadata agree', JSON.stringify(data.local) === JSON.stringify(data.served));
  check('499 source identities', Object.keys(data.sourceHashes ?? {}).length === 499);
});
await gate('source-gates', 'final17-source-gates.json', (data, check) => {
  check('exact12 completed exit0 commands', data.results?.length === 12 && data.results.every(row => row.exitCode === 0 && row.finishedAt));
  check('no automatic retries', data.automaticRetries === 0);
});

await gate('source-delta', 'final17-source-delta.json', (data, check) => {
  const changed = ['src/components/typing/live-keyboard.css', 'src/lib/typing-core/__tests__/transcript-target-cache.test.ts', 'src/lib/typing-core/transcript.ts'].sort();
  check('actual17/499sources/exact3paths/496unchanged', data.expectedBuild === build && data.after?.version === build && data.afterSourceFiles === 499 && data.beforeSourceFiles === 498 && JSON.stringify([...(data.changedSourceFiles ?? [])].sort()) === JSON.stringify(changed) && data.unchangedSourceFiles === 496);
  check('only declared new unit/no removals', JSON.stringify(data.addedSourceFiles) === JSON.stringify(['src/lib/typing-core/__tests__/transcript-target-cache.test.ts']) && empty(data.removedSourceFiles));
  check('frozen source matches', data.currentFrozenSource?.expectedBuild === build && data.currentFrozenSource.compared === 499 && empty(data.currentFrozenSource.mismatches));
  check('protected component hashes unchanged', Object.keys(data.componentIntegrity ?? {}).length > 0 && Object.values(data.componentIntegrity).every(c => c.unchanged === true && empty(c.changed)));
});
await gate('bundle-budgets', 'final17-bundle.json', async (data, check, row) => {
  const pairs = [['initialPracticeJsGzipBytes', 'initialPracticeJsGzipBytes'], ['maxFeatureJsGzipBytes', 'featureJsGzipBytes'], ['introDeferredJsGzipBytes', 'introDeferredJsGzipBytes'], ['arcadeRouteGzipBytes', 'arcadeRouteGzipBytes'], ['arcadePlayerGzipBytes', 'arcadePlayerGzipBytes'], ['dashboardRouteGzipBytes', 'dashboardRouteGzipBytes']];
  check('all original gzip budgets met', pairs.every(([m, b]) => finite(data[m]) && finite(data.budgets?.[b]) && data[m] <= data.budgets[b]));
  check('Arcade outside initial practice', data.arcadeAbsentFromInitialPractice === true);
  const binding = await json('final17-artifact-independent-extraction.json');
  if (!binding) row.pendingDependencies.push('Actual17 bundle hash/build binding missing.');
  else check('raw bundle bound to actual17', identifier(binding.build) === build && binding.receiptRawSha256?.['final17-bundle.json'] === createHash('sha256').update(await readFile(path.join(audit, 'final17-bundle.json'))).digest('hex'));
  row.scope = 'Bundle budgets only; unrelated earlier focus failures in the timestamped binding receipt remain failed.';
});
await gate('hosting-package-structure', 'final17-hosting-package-verification.json', (data, check) => {
  check('actual17/27 successful checks', identifier(data.build) === build && data.checks?.length === 27 && allPassed(data.checks));
  check('source bound/no retries/filtering', data.source?.expectedBuild === build && data.source.compared === 499 && empty(data.source.mismatches) && data.automaticRetries === 0 && data.resultFiltering === false);
  check('five visual/worker byte comparisons passed', data.visualComparisons?.length === 5 && allPassed(data.visualComparisons));
});
await gate('keyboard-final16', 'final17-keyboard-placement-confirmation.json', async (data, check, row) => {
  check('actual17/all4/16 completed', identifier(data.build) === build && data.expectedCases === 16 && sameEngines(data.browsers) && data.exitCode === 0 && Boolean(data.finishedAt));
  check('before/after/input ownership', data.source?.expectedBuild === build && data.source.compared === 499 && empty(data.source.mismatches) && data.sourceAfter?.expectedBuild === build && data.sourceAfter.compared === 499 && empty(data.sourceAfter.mismatches) && data.inputsUnchanged === true);
  check('separate declared traceoff/worker1/retry0', data.tracing === 'off' && data.instrumentationChanged === true && data.workers === 1 && data.automaticRetries === 0);
  const raw = await json('final17-keyboard-placement-confirmation-raw.json');
  if (!raw) row.pendingDependencies.push('Actual keyboard raw report missing.');
  else { const actual = inspectRaw(raw); checkRaw(actual, data.summary, check, 'keyboard16', ['e2e/live-keyboard.spec.ts']); check('actual16pass/four each/no skip', actual.totals.total === 16 && actual.totals.passed === 16 && actual.totals.failed === 0 && actual.totals.skipped === 0 && engines.every(e => actual.projects[e].total === 4)); }
  row.scope = 'Final separate confirmation only; earlier0-selection/4pass12fail/6pass10fail receipts remain unchanged.';
});

const artifacts = await gate('static-artifacts', 'final17-static-artifacts.json', (data, check) => {
  check('67 successful checks', data.checks?.length === 67 && allPassed(data.checks));
  check('normal source identity matches', data.source?.expectedBuild === build && empty(data.source?.mismatches));
  check('two API-disabled root/subpath artifacts', data.artifacts?.length === 2 && data.artifacts.every(row => row.deployment?.frontendOnly === true && row.deployment?.api === 'disabled' && /^[a-f0-9]{20}$/.test(identifier(row.build) ?? '')));
  check('no retries/filtering', data.automaticRetries === 0 && data.resultFiltering === false);
});
function staticCases(data, section, count, perEngine, check) {
  const result = data[section];
  check(`${section}: exact${count} passes`, result?.total === count && result.pass === count && result.fail === 0 && result.skip === 0 && result.flaky === 0 && result.errors === 0, result && { total: result.total, pass: result.pass, fail: result.fail, skip: result.skip, flaky: result.flaky, errors: result.errors });
  check(`${section}: all four actual project summaries`, sameEngines(Object.keys(result?.projects ?? {})) && engines.every(engine => result.projects[engine].total === perEngine && result.projects[engine].pass === perEngine));
}
await gate('static-deployment-and-game-axe', 'final17-static-process.json', (data, check) => {
  check('declared source17 identity', data.expectedBuild === build);
  staticCases(data, 'deployment', 56, 14, check);
  staticCases(data, 'game-accessibility', 16, 4, check);
  check('source/default artifact/input guards passed', allPassed(data.checks));
  check('owned child processes exited without interruption', data.ownedChildProcessExited === true && data.interrupted === false && data.processes?.every(row => row.exitCode === 0));
});

const mobileFile = 'mobile-workspaces-final17-static.json';
await gate('mobile-functional', mobileFile, async (data, check, row) => {
  const vercel = artifacts?.artifacts?.find(item => item.deployment?.target === 'vercel');
  if (!vercel) row.pendingDependencies.push('Static artifact identity has not completed.');
  else check('measured dedicated Vercel identity', identifier(data.build) === identifier(vercel.build) && identifier(data.servedBuild) === identifier(vercel.build));
  check('exact four workspaces', JSON.stringify(data.cases?.map(item => item.id)) === JSON.stringify(['learn', 'course', 'local-bot', 'games']));
  check('all functional cases completed with native exact evidence', data.completed === true && data.watchdogExpired === false && data.cases?.length === 4 && data.cases.every(item => item.passed === true && item.evidence?.attempts > 0 && item.evidence.inputAccuracy === 100 && (item.evidence.finalTextExact === true || item.evidence.finalInputValuesExact === true)));
  check('no runtime errors or overflow', data.cases?.every(item => empty(item.pageErrors) && empty(item.consoleErrors) && item.horizontalOverflow === false));
  const processReceipt = await json('mobile-workspaces-final17-static-process.json');
  if (!processReceipt) row.pendingDependencies.push('Mobile process/cleanup receipt missing.');
  else {
    check('zero API calls and owned lifecycle closed', empty(processReceipt.apiRequests) && processReceipt.ownBrowserChildExited === true && processReceipt.ownedServerClosed === true);
    check('source/artifact/driver unchanged', processReceipt.hashesUnchanged === true && processReceipt.driverUnchanged === true && processReceipt.originalProtocolUnchanged === true);
    check('no retries/filtering', processReceipt.automaticRetries === 0 && processReceipt.resultFiltering === false);
  }
});
await gate('mobile-latency', mobileFile, (data, check) => {
  const values = data.cases?.map(item => ({ id: item.id, attempts: item.evidence?.attempts, p98Ms: item.timing?.p98ObservedTypingEventDurationMs, maxMs: item.timing?.maxObservedTypingEventDurationMs }));
  check('all four p98 values strictly under100ms', values?.length === 4 && values.every(item => finite(item.p98Ms) && item.p98Ms < 100 && finite(item.maxMs)), values);
});
await gate('matched-input-functional', 'final17-input-results.json', (data, check) => {
  check('three declared source17 runs', identifier(data.protocol?.build) === build && data.runs?.length === 3 && data.runs.every(run => run.build === build));
  check('all495 exact/100% and rotation retained', data.runs?.every(run => run.exact === true && run.attempts === 495 && run.accuracy === 100 && run.rotation?.beforeLength === 247 && run.rotation.afterLength === 247 && run.rotation.retainedExactly === true && run.rotation.overflow === false && empty(run.errors)));
  check('same declared protocol without retries/filtering', data.protocol?.automaticRetries === 0 && data.protocol.resultFiltering === false && data.protocol.cpuThrottle === 4 && data.protocol.freshProfiles === true && data.protocol.quietSeconds === 5 && data.protocol.interCharacterDelayMs === 0);
});
await gate('matched-input-latency', 'final17-input-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ run: run.run, attempts: run.attempts, p98Ms: run.p98Ms, maxMs: run.maxMs }));
  check('every run p98 strictly under100ms', values?.length === 3 && values.every(run => finite(run.p98Ms) && run.p98Ms < 100 && finite(run.maxMs)), values);
});
await gate('lighthouse-mobile', 'final17-mobile-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ build: identifier(run.build), scores: run.scores, lcpMs: run.metrics?.['largest-contentful-paint'], cls: run.metrics?.['cumulative-layout-shift'], runtimeError: run.runtimeError }));
  check('three actual source17 runs', identifier(data.protocol?.build) === build && values?.length === 3 && values.every(run => run.build === build));
  const scores = values?.map(run => run.scores?.performance).sort((a, b) => a - b);
  check('median performance at least95', scores?.length === 3 && scores.every(finite) && scores[1] >= 95, scores);
  check('every A11y/BP/SEO100', values?.every(run => run.scores?.accessibility === 100 && run.scores['best-practices'] === 100 && run.scores.seo === 100), values);
  check('every LCP<=2500ms/CLS<=0.05/no runtimeError', values?.every(run => finite(run.lcpMs) && run.lcpMs <= 2500 && finite(run.cls) && run.cls <= 0.05 && run.runtimeError === null));
  check('full-quality first intro/30s quiet/fresh profiles/no filtering', data.protocol?.introSkip === false && data.protocol.qualityOverrides === false && data.protocol.reducedMotionOverride === false && data.protocol.quietBeforeEachSeconds === 30 && data.protocol.freshProfiles === true && data.protocol.automaticRetries === 0 && data.protocol.scoreFiltering === false);
});


await gate('full62-file-four-engine-matrix', overrides['--matrix'] ?? 'final17-browser-matrix.json', async (data, check, row) => {
  check('actual17/all4/no retries', identifier(data.build) === build && sameEngines(data.browsers) && data.automaticRetries === 0);
  const files = data.batches?.flatMap(b => b.files) ?? [], expected = [['new-features', 2], ['existing', 2], ['isolated', 1], ['first-input-timing', 2]];
  check('exact62 files/no duplicates', data.filesCoveredExactlyOnce === 62 && files.length === 62 && new Set(files).size === 62);
  check('four original batches/workers', data.batches?.length === 4 && expected.every(([id, workers], i) => data.batches[i].id === id && data.batches[i].workers === workers));
  const results = data.results ?? [], complete = Boolean(data.finishedAt && results.length === 4);
  if (!complete) row.pendingDependencies.push('Full matrix has not finalized all four batches.');
  check('no duplicate/unknown completed batches', new Set(results.map(r => r.id)).size === results.length && results.every(r => expected.some(([id]) => r.id === id)));
  const matrixName = path.basename(row.receipt); assert.match(matrixName, /^final17(?:-[a-z0-9]+)*-browser-matrix\.json$/);
  const prefix = matrixName.slice(0, -'-browser-matrix.json'.length);
  row.actualBatchResults = []; row.aggregateActual = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
  for (const result of results) {
    const batch = data.batches.find(b => b.id === result.id), name = `${prefix}-${result.id}`;
    const raw = await json(`${name}.json`), protocol = await json(`${name}-protocol.json`);
    if (!raw || !protocol) { row.pendingDependencies.push(`${result.id}: finalized raw/protocol missing.`); continue; }
    const actual = inspectRaw(raw); checkRaw(actual, result.summary, check, result.id, batch.files);
    check(`${result.id}: zero actual failures/flaky/global errors`, result.exitCode === 0 && actual.totals.failed === 0 && actual.totals.flaky === 0 && actual.globalErrors === 0, actual.totals);
    check(`${result.id}: protocol build/files/engine/worker identity`, identifier(protocol.build) === build && JSON.stringify(protocol.files) === JSON.stringify(batch.files) && sameEngines(protocol.browsers) && protocol.workers === batch.workers);
    check(`${result.id}: explicit changed traceoff/no retries`, protocol.tracing === 'off' && protocol.configuredTracing === 'retain-on-failure' && protocol.instrumentationChanged === true && protocol.failureScreenshots === 'only-on-failure' && protocol.automaticRetries === 0 && protocol.command?.includes('--trace=off') && protocol.command.includes('--retries=0'));
    check(`${result.id}: completed hash integrity`, Boolean(protocol.finishedAt) && protocol.integrity?.buildUnchanged === true && protocol.integrity.testsUnchanged === true && protocol.integrity.dependenciesUnchanged === true);
    for (const key of Object.keys(row.aggregateActual)) row.aggregateActual[key] += actual.totals[key];
    row.actualBatchResults.push({ id: result.id, actualTotals: actual.totals, actualProjects: actual.projects, skippedCases: actual.cases.filter(c => c.status === 'skipped').map(({ file, title, project, reasons }) => ({ file, title, project, reasons })) });
  }
  if (complete) check('all finalized raw witnesses present', row.actualBatchResults.length === 4);
  row.scope = 'Actual raw counts, not assumed1396 total. Conditional skips are explicit and never feature passes. Changed traceoff instrumentation cannot relabel source16 failures or prove their cause. Native16/static remain separate gates.';
}, true);

await gate('real-native16-and-owned-cleanup', overrides['--native'] ?? 'final17-native-browser.json', async (data, check, row) => {
  const stats = data.nativeResult?.stats;
  check('source17/all16 real cases without skip/flaky/retry', data.build === build && data.expectedCases === 16 && sameEngines(data.engines) && data.exitCode === 0 && stats?.expected === 16 && stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0 && data.retries === 0);
  check('source/inputs/browser ownership unchanged', data.source?.expectedBuild === build && empty(data.source.mismatches) && empty(data.sourceAfter?.mismatches) && data.inputsUnchanged === true && data.browserRunnerExited === true && data.privateConfigsReadByWrapper === false && data.originalServicesOrDatabaseTouched === false);
  const ready = data.readyReceipt?.match(/^pack-backend-([a-f0-9]{16})-browser-ready\.json$/);
  check('owned ready receipt identity', Boolean(ready));
  if (!ready) return;
  const cleanupFile = `pack-backend-${ready[1]}-cleanup.json`, cleanup = await json(cleanupFile);
  row.cleanupReceipt = cleanupFile;
  if (!cleanup) row.pendingDependencies.push('Owned cleanup has not completed.');
  else check('same instance graceful cleanup/no original config read', cleanup.ownProcessesStopped === true && cleanup.gracefulDatabaseShutdown === true && cleanup.gracefulApacheShutdown === true && empty(cleanup.apacheResidualPids) && cleanup.ownTemporaryDirectoryRemoved === true && cleanup.originalConfigRead === false);
  row.scope = 'No original service-health/hosted/capacity claim. Wrapper declared engine counts must also be checked against the actual raw report.';
  if (data.nativeResult?.rawReport) {
    const raw = await json(path.basename(data.nativeResult.rawReport.replaceAll('\\', '/')));
    if (!raw) row.pendingDependencies.push('Actual raw native report missing.');
    else {
      const actual = [];
      const visit = suites => { for (const suite of suites ?? []) { for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) actual.push(test); visit(suite.suites); } };
      visit(raw.suites);
      check('native raw has zero global errors and retry0', empty(raw.errors ?? []) && actual.every(test => test.results?.length === 1 && test.results[0].retry === 0));
      check('actual raw16/four per engine with one passing attempt', actual.length === 16 && engines.every(engine => actual.filter(test => test.projectName === engine).length === 4) && actual.every(test => test.results?.length === 1 && test.results[0].status === 'passed'));
    }
  } else row.pendingDependencies.push('Actual raw native report reference missing.');
});
await gate('real135-placement-and-private-goal', overrides['--placement'] ?? 'final17-placement-real135-raw.json', (data, check, row) => {
  check('actual source17/82 named checks', identifier(data.build) === build && data.passed === 82 && data.failed === 0 && data.checks?.length === 82 && allPassed(data.checks));
  row.parts = data.parts?.map(part => ({ part: part.part, activeDurationMs: part.activeDurationMs, observedRealDurationMs: part.observedRealDurationMs, observedBrowserMonotonicMs: part.observedBrowserMonotonicMs, observedWallMs: part.observedWallMs, attempts: part.attempts, correctAttempts: part.correctAttempts, inputAccuracy: part.inputAccuracy }));
  row.wallClockScope = 'Wall deltas are recorded only. The original declared45s assertions use coordinator real time and browser monotonic time; no additional wall threshold is imposed.';
  check('three real45s canonical parts', data.parts?.length === 3 && data.parts.every(part => part.activeDurationMs === 45000 && part.observedRealDurationMs >= 45000 && part.observedBrowserMonotonicMs >= 45000 && part.attempts > 0 && part.correctAttempts === part.attempts && part.inputAccuracy === 100 && part.retainedProjection === true && part.localGuidanceOnly === true));
  check('guided record persisted without course certification', data.guidance?.parts === 3 && data.guidance.inputAccuracy === 100 && data.guidance.persistedAfterReload === true && data.guidance.courseCheckpoints === 0 && data.guidance.qualification === 'local-guidance-only');
  check('finite private goal remains private/unqualified', data.privateGoal?.source === 'cold-start' && data.privateGoal.comparableAttempts === 0 && data.privateGoal.courseQualification === false);
  check('no API escape/runtime errors and own browser closed', data.apiRequests?.length >= 1 && data.apiRequests.every(request => request.guestFixture === true) && empty(data.pageErrors) && data.ownedBrowserClosed === true);
  check('unchanged source/driver/dependencies/served build', empty(data.integrity?.mismatches) && data.integrity.driverUnchanged === true && data.integrity.dependenciesUnchanged === true && data.integrity.servedBuildUnchanged === true);
  row.consoleErrorCountDiagnostic = data.consoleErrorCount;
  row.consoleErrorScope = 'Recorded only; the original82-check driver does not impose a zero-console-error acceptance threshold.';
  check('ordinary bounded full journey', finite(data.durationMs) && data.durationMs >= 135000 && data.durationMs <= 210000);
});


await gate('recorded17-input-observations', 'final17-input-results.json', (data, check) => {
  check('recorded p98 values88/80/96', identifier(data.protocol?.build) === build && JSON.stringify(data.runs?.map(r => r.p98Ms)) === JSON.stringify([88, 80, 96]));
});
await gate('recorded17-lighthouse-observations', 'final17-mobile-results.json', (data, check) => {
  check('recorded performance95/96/95', identifier(data.protocol?.build) === build && JSON.stringify(data.runs?.map(r => r.scores?.performance)) === JSON.stringify([95, 96, 95]));
});


// Separate lineage only: a fresh11 outcome never edits the original matrix outcome.
await gate('latest-scoped62-file-coverage', 'final17-new-features-fresh-confirmation-protocol.json', async (freshProtocol, check, row) => {
  const freshPrefix = 'final17-new-features-fresh-confirmation';
  const originalFile = overrides['--matrix'] ?? 'final17-browser-matrix.json';
  const original = await json(originalFile);
  if (!original || !original.finishedAt || original.results?.length !== 4) { row.pendingDependencies.push('Original four-batch matrix has not finalized.'); return; }
  row.originalMatrixOutcome = original.status;
  row.scope = 'Latest separately declared62-file union: fresh11 feature files plus original42existing/8isolated/1timing files. Original matrix outcome and all8 failed feature cases remain retained. Conditional skips remain unverified, not passes.';
  check('original normal build/all4/exact62', identifier(original.build) === build && sameEngines(original.browsers) && original.filesCoveredExactlyOnce === 62);
  const first = original.batches?.[0];
  check('fresh selection is exact original11', first?.id === 'new-features' && first.workers === 2 && first.files?.length === 11 && JSON.stringify(freshProtocol.files) === JSON.stringify(first.files));
  check('fresh actual17/all4/worker2/traceoff/retry0/no timeout override', identifier(freshProtocol.build) === build && sameEngines(freshProtocol.browsers) && freshProtocol.workers === 2 && freshProtocol.automaticRetries === 0 && freshProtocol.tracing === 'off' && freshProtocol.configuredTracing === 'retain-on-failure' && freshProtocol.instrumentationChanged === true && freshProtocol.failureScreenshots === 'only-on-failure' && freshProtocol.command?.includes('--workers=2') && freshProtocol.command.includes('--retries=0') && freshProtocol.command.includes('--trace=off') && !freshProtocol.command.includes('--timeout') && !freshProtocol.command.includes('--grep'));
  check('fresh protocol finalized/no filtering/hash changes', Boolean(freshProtocol.finishedAt) && freshProtocol.exitCode === 0 && freshProtocol.integrity?.buildUnchanged === true && freshProtocol.integrity.testsUnchanged === true && freshProtocol.integrity.dependenciesUnchanged === true);
  const sourceGuardFile = `${freshPrefix}-source.json`, sourceGuard = await json(sourceGuardFile);
  row.freshSourceReceipt = sourceGuardFile;
  if (!sourceGuard || !sourceGuard.finishedAt) row.pendingDependencies.push('Fresh before/after499-source ownership receipt has not completed.');
  else {
    const sourceHash = createHash('sha256').update(await readFile(path.join(audit, 'final17-source.json'))).digest('hex');
    check('fresh actual499 before/after source hashes', sourceGuard.status === 'PASS-SCOPED-SOURCE' && sourceGuard.build === build && sourceGuard.sourceBefore?.expectedBuild === build && sourceGuard.sourceBefore.compared === 499 && empty(sourceGuard.sourceBefore.mismatches) && sourceGuard.sourceAfter?.expectedBuild === build && sourceGuard.sourceAfter.compared === 499 && empty(sourceGuard.sourceAfter.mismatches) && sourceGuard.sourceReceiptSha256Before === sourceHash && sourceGuard.sourceReceiptSha256After === sourceHash);
    check('fresh source owner retains browser exit/no private access', sourceGuard.childExitCode === 0 && sourceGuard.browserRunnerExited === true && sourceGuard.originalPrivateConfigOrDatabaseRead === false && sourceGuard.originalServicesTouched === false);
  }
  const matrixName = path.basename(originalFile); assert.match(matrixName, /^final17(?:-[a-z0-9]+)*-browser-matrix\.json$/);
  const originalPrefix = matrixName.slice(0, -'-browser-matrix.json'.length);
  const originalFirstProtocol = await json(`${originalPrefix}-new-features-protocol.json`);
  const originalFirstRaw = await json(`${originalPrefix}-new-features.json`);
  const sameDependencies = (a, b) => Object.keys(a ?? {}).length === 70 && Object.keys(b ?? {}).length === 70 && Object.keys(a).every(key => a[key] === b[key]);
  if (!originalFirstProtocol || !originalFirstRaw) row.pendingDependencies.push('Original feature protocol/raw lineage missing.');
  else check('fresh matches original70 dependencies and exact selected test hashes', sameDependencies(freshProtocol.dependencyHashes, originalFirstProtocol.dependencyHashes) && JSON.stringify(Object.entries(freshProtocol.testHashes ?? {}).sort()) === JSON.stringify(Object.entries(originalFirstProtocol.testHashes ?? {}).sort()));
  if (sourceGuard?.finishedAt) check('fresh source owner also proves same70 before/after dependencies', sourceGuard.dependencyCount === 70 && sourceGuard.dependenciesEqualOriginalBefore === true && sourceGuard.dependenciesEqualOriginalAfter === true && sameDependencies(sourceGuard.dependencyHashesBefore, freshProtocol.dependencyHashes) && sameDependencies(sourceGuard.dependencyHashesAfter, freshProtocol.dependencyHashes));
  row.lineage = [];
  row.aggregateActual = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
  const unionFiles = [];
  for (const batch of original.batches ?? []) {
    const selectedPrefix = batch.id === 'new-features' ? freshPrefix : `${originalPrefix}-${batch.id}`;
    const rawFile = `${selectedPrefix}.json`, protocolFile = `${selectedPrefix}-protocol.json`;
    const raw = await json(rawFile), protocol = await json(protocolFile);
    const summary = batch.id === 'new-features' ? await json(`${freshPrefix}-summary.json`) : original.results.find(r => r.id === batch.id)?.summary;
    if (!raw || !protocol || !summary) { row.pendingDependencies.push(`${batch.id}: explicit latest-union raw/protocol/summary witness missing.`); continue; }
    const actual = inspectRaw(raw); checkRaw(actual, summary, check, `latest:${batch.id}`, batch.files);
    check(`latest:${batch.id}: pass outcome/normal build/protocol unchanged`, protocol.exitCode === 0 && actual.totals.failed === 0 && actual.totals.flaky === 0 && actual.globalErrors === 0 && identifier(protocol.build) === build && sameEngines(protocol.browsers) && protocol.workers === batch.workers && protocol.automaticRetries === 0 && protocol.tracing === 'off' && protocol.instrumentationChanged === true && Boolean(protocol.finishedAt) && protocol.integrity?.buildUnchanged === true && protocol.integrity.testsUnchanged === true && protocol.integrity.dependenciesUnchanged === true);
    check(`latest:${batch.id}: all70 dependency hashes equal fresh`, sameDependencies(protocol.dependencyHashes, freshProtocol.dependencyHashes));
    if (batch.id === 'new-features' && originalFirstRaw) {
      const key = c => JSON.stringify([c.file, c.title, c.project]);
      check('fresh collected case identities equal original11 collection', JSON.stringify(actual.cases.map(key).sort()) === JSON.stringify(inspectRaw(originalFirstRaw).cases.map(key).sort()));
    }
    unionFiles.push(...batch.files);
    for (const key of Object.keys(row.aggregateActual)) row.aggregateActual[key] += actual.totals[key];
    row.lineage.push({ batch: batch.id, selectedFiles: batch.files.length, rawReport: rawFile, protocol: protocolFile, actualTotals: actual.totals, actualProjects: actual.projects, skippedCases: actual.cases.filter(c => c.status === 'skipped').map(({ file, title, project, reasons }) => ({ file, title, project, reasons })) });
  }
  check('latest union covers exact62files once with four explicit raw lineages', row.lineage.length === 4 && unionFiles.length === 62 && new Set(unionFiles).size === 62 && JSON.stringify([...unionFiles].sort()) === JSON.stringify(original.batches.flatMap(b => b.files).sort()));
});

const status = rows.some(row => row.status === 'FAILED') ? 'FAILED' : rows.some(row => ['NOT-RUN', 'PARTIAL'].includes(row.status)) ? 'PARTIAL' : 'PASS-SCOPED';
console.log(JSON.stringify({ capturedAt: new Date().toISOString(), status, build, originalMatrixOutcome: rows.find(row => row.id === 'full62-file-four-engine-matrix')?.status ?? 'NOT-RUN', latestScopedCoverage: rows.find(row => row.id === 'latest-scoped62-file-coverage')?.status ?? 'NOT-RUN', scope: 'Read-only actual17 receipt reconciliation only. Missing/running witnesses stay NOT-RUN/PARTIAL and completed failures stay FAILED. Raw actual counts/skips retained; no assumed whole-matrix total, execution, historical rewrite, hosted/physical/field-INP/capacity claim.', gates: rows }, null, 2));
process.exitCode = status === 'PASS-SCOPED' ? 0 : status === 'FAILED' ? 1 : 2;
