// Read completed audit receipts only. Never launches a runner, reads private
// configuration, changes application/source data, or rewrites existing evidence.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const build = process.env.SPAROWTYPE_FINAL16_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen16 identity.');
const audit = path.resolve(import.meta.dirname);
const overrides = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index], value = process.argv[index + 1];
  assert.ok(['--matrix', '--placement', '--native'].includes(key) && value);
  assert.equal(overrides[key], undefined, 'Duplicate receipt override.');
  overrides[key] = value;
}
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
async function gate(id, file, evaluate) {
  const row = { id, receipt: file, status: 'NOT-RUN', checks: [], pendingDependencies: [] };
  rows.push(row);
  const check = (name, pass, observed) => row.checks.push({ name, pass: pass === true, ...(observed === undefined ? {} : { observed }) });
  try {
    const data = await json(file);
    if (!data) return null;
    if (data.status && /^(?:RUNNING|PARTIAL|DECLARED|PREPARED|NOT-RUN)/.test(data.status)) {
      row.status = 'PARTIAL'; row.observedStatus = data.status; return data;
    }
    if (data.status && /^(?:FAILED|ERROR)/.test(data.status))
      check('receipt does not report a failed operation', false, data.status);
    await evaluate(data, check, row);
    row.status = row.checks.some(check => !check.pass) ? 'FAILED' : row.pendingDependencies.length ? 'PARTIAL' : 'PASS-SCOPED';
    return data;
  } catch (error) { row.status = 'FAILED'; row.error = { name: error.name, message: error.message }; return null; }
}

await gate('frozen-source', 'final16-source.json', (data, check) => {
  check('actual normal identity', identifier(data.local) === build && identifier(data.served) === build);
  check('local and served metadata agree', JSON.stringify(data.local) === JSON.stringify(data.served));
  check('498 source identities', Object.keys(data.sourceHashes ?? {}).length === 498);
});
await gate('source-gates', 'final16-source-gates.json', (data, check) => {
  check('exact12 completed exit0 commands', data.results?.length === 12 && data.results.every(row => row.exitCode === 0 && row.finishedAt));
  check('no automatic retries', data.automaticRetries === 0);
});
const artifacts = await gate('static-artifacts', 'final16-static-artifacts.json', (data, check) => {
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
await gate('static-deployment-and-game-axe', 'final16-static-process.json', (data, check) => {
  check('declared source16 identity', data.expectedBuild === build);
  staticCases(data, 'deployment', 56, 14, check);
  staticCases(data, 'game-accessibility', 16, 4, check);
  check('source/default artifact/input guards passed', allPassed(data.checks));
  check('owned child processes exited without interruption', data.ownedChildProcessExited === true && data.interrupted === false && data.processes?.every(row => row.exitCode === 0));
});

const mobileFile = 'mobile-workspaces-final16-static.json';
await gate('mobile-functional', mobileFile, async (data, check, row) => {
  const vercel = artifacts?.artifacts?.find(item => item.deployment?.target === 'vercel');
  if (!vercel) row.pendingDependencies.push('Static artifact identity has not completed.');
  else check('measured dedicated Vercel identity', identifier(data.build) === identifier(vercel.build) && identifier(data.servedBuild) === identifier(vercel.build));
  check('exact four workspaces', JSON.stringify(data.cases?.map(item => item.id)) === JSON.stringify(['learn', 'course', 'local-bot', 'games']));
  check('all functional cases completed with native exact evidence', data.completed === true && data.watchdogExpired === false && data.cases?.length === 4 && data.cases.every(item => item.passed === true && item.evidence?.attempts > 0 && item.evidence.inputAccuracy === 100 && (item.evidence.finalTextExact === true || item.evidence.finalInputValuesExact === true)));
  check('no runtime errors or overflow', data.cases?.every(item => empty(item.pageErrors) && empty(item.consoleErrors) && item.horizontalOverflow === false));
  const processReceipt = await json('mobile-workspaces-final16-static-process.json');
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
await gate('matched-input-functional', 'final16-input-results.json', (data, check) => {
  check('three declared source16 runs', identifier(data.protocol?.build) === build && data.runs?.length === 3 && data.runs.every(run => run.build === build));
  check('all495 exact/100% and rotation retained', data.runs?.every(run => run.exact === true && run.attempts === 495 && run.accuracy === 100 && run.rotation?.beforeLength === 247 && run.rotation.afterLength === 247 && run.rotation.retainedExactly === true && run.rotation.overflow === false && empty(run.errors)));
  check('same declared protocol without retries/filtering', data.protocol?.automaticRetries === 0 && data.protocol.resultFiltering === false && data.protocol.cpuThrottle === 4 && data.protocol.freshProfiles === true && data.protocol.quietSeconds === 5 && data.protocol.interCharacterDelayMs === 0);
});
await gate('matched-input-latency', 'final16-input-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ run: run.run, attempts: run.attempts, p98Ms: run.p98Ms, maxMs: run.maxMs }));
  check('every run p98 strictly under100ms', values?.length === 3 && values.every(run => finite(run.p98Ms) && run.p98Ms < 100 && finite(run.maxMs)), values);
});
await gate('lighthouse-mobile', 'final16-mobile-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ build: identifier(run.build), scores: run.scores, lcpMs: run.metrics?.['largest-contentful-paint'], cls: run.metrics?.['cumulative-layout-shift'], runtimeError: run.runtimeError }));
  check('three actual source16 runs', identifier(data.protocol?.build) === build && values?.length === 3 && values.every(run => run.build === build));
  const scores = values?.map(run => run.scores?.performance).sort((a, b) => a - b);
  check('median performance at least95', scores?.length === 3 && scores.every(finite) && scores[1] >= 95, scores);
  check('every A11y/BP/SEO100', values?.every(run => run.scores?.accessibility === 100 && run.scores['best-practices'] === 100 && run.scores.seo === 100), values);
  check('every LCP<=2500ms/CLS<=0.05/no runtimeError', values?.every(run => finite(run.lcpMs) && run.lcpMs <= 2500 && finite(run.cls) && run.cls <= 0.05 && run.runtimeError === null));
  check('full-quality first intro/30s quiet/fresh profiles/no filtering', data.protocol?.introSkip === false && data.protocol.qualityOverrides === false && data.protocol.reducedMotionOverride === false && data.protocol.quietBeforeEachSeconds === 30 && data.protocol.freshProfiles === true && data.protocol.automaticRetries === 0 && data.protocol.scoreFiltering === false);
});

await gate('full62-file-four-engine-matrix', overrides['--matrix'] ?? 'final16-browser-matrix.json', (data, check, row) => {
  check('normal build and all four declared engines', identifier(data.build) === build && sameEngines(data.browsers));
  const files = data.batches?.flatMap(batch => batch.files) ?? [];
  check('exact62-file partition without duplicates', data.filesCoveredExactlyOnce === 62 && files.length === 62 && new Set(files).size === 62);
  check('all declared batches completed', data.finishedAt && data.results?.length === data.batches?.length);
  check('no automatic retries', data.automaticRetries === 0);
  row.batchResults = data.results?.map(result => ({ id: result.id, exitCode: result.exitCode, totals: result.summary?.totals, projects: result.summary?.projects, skips: result.summary?.skippedCases, skipReasons: result.summary?.skipReasons }));
  for (const result of data.results ?? []) {
    const summary = result.summary, totals = summary?.totals;
    check(`${result.id}: zero failures/flaky/globalErrors`, result.exitCode === 0 && totals?.failed === 0 && totals.flaky === 0 && empty(summary.globalErrors) && summary.countsAgreeWithReport === true, totals);
    check(`${result.id}: actual four project summaries`, sameEngines(summary?.projects?.map(item => item.project)) && summary.projects.every(item => item.total > 0 && item.failed === 0 && item.flaky === 0));
    check(`${result.id}: all skips explicit`, totals?.skipped === 0 || (summary.skippedCases?.length === totals?.skipped && Object.keys(summary.skipReasons ?? {}).length > 0));
  }
  row.scope = 'Conditional skips remain listed. A scoped pass with skips is not every feature passed; real native16 and dedicated static cases are separate gates.';
});

await gate('real-native16-and-owned-cleanup', overrides['--native'] ?? 'final16-native-browser.json', async (data, check, row) => {
  const stats = data.nativeResult?.stats;
  check('source16/all16 real cases without skip/flaky/retry', data.build === build && data.expectedCases === 16 && sameEngines(data.engines) && data.exitCode === 0 && stats?.expected === 16 && stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0 && data.retries === 0);
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
      check('actual raw16/four per engine with one passing attempt', actual.length === 16 && engines.every(engine => actual.filter(test => test.projectName === engine).length === 4) && actual.every(test => test.results?.length === 1 && test.results[0].status === 'passed'));
    }
  } else row.pendingDependencies.push('Actual raw native report reference missing.');
});
await gate('real135-placement-and-private-goal', overrides['--placement'] ?? 'final16-placement-real135-confirmation-raw.json', (data, check, row) => {
  check('actual source16/82 named checks', identifier(data.build) === build && data.passed === 82 && data.failed === 0 && data.checks?.length === 82 && allPassed(data.checks));
  row.parts = data.parts?.map(part => ({ part: part.part, activeDurationMs: part.activeDurationMs, observedRealDurationMs: part.observedRealDurationMs, observedBrowserMonotonicMs: part.observedBrowserMonotonicMs, observedWallMs: part.observedWallMs, attempts: part.attempts, correctAttempts: part.correctAttempts, inputAccuracy: part.inputAccuracy }));
  row.wallClockScope = 'Wall deltas are recorded only. The original declared45s assertions use coordinator real time and browser monotonic time; no additional wall threshold is imposed.';
  check('three real45s canonical parts', data.parts?.length === 3 && data.parts.every(part => part.activeDurationMs === 45000 && part.observedRealDurationMs >= 45000 && part.observedBrowserMonotonicMs >= 45000 && part.attempts > 0 && part.correctAttempts === part.attempts && part.inputAccuracy === 100 && part.retainedProjection === true && part.localGuidanceOnly === true));
  check('guided record persisted without course certification', data.guidance?.parts === 3 && data.guidance.inputAccuracy === 100 && data.guidance.persistedAfterReload === true && data.guidance.courseCheckpoints === 0 && data.guidance.qualification === 'local-guidance-only');
  check('finite private goal remains private/unqualified', data.privateGoal?.source === 'cold-start' && data.privateGoal.comparableAttempts === 0 && data.privateGoal.courseQualification === false);
  check('no API escape/runtime errors and own browser closed', data.apiRequests?.every(request => request.guestFixture === true) && empty(data.pageErrors) && data.consoleErrorCount === 0 && data.ownedBrowserClosed === true);
  check('unchanged source/driver/dependencies/served build', empty(data.integrity?.mismatches) && data.integrity.driverUnchanged === true && data.integrity.dependenciesUnchanged === true && data.integrity.servedBuildUnchanged === true);
  check('ordinary bounded full journey', finite(data.durationMs) && data.durationMs >= 135000 && data.durationMs <= 210000);
});

const status = rows.some(row => row.status === 'FAILED') ? 'FAILED' : rows.some(row => ['NOT-RUN', 'PARTIAL'].includes(row.status)) ? 'PARTIAL' : 'PASS-SCOPED';
console.log(JSON.stringify({ capturedAt: new Date().toISOString(), status, build, scope: 'Read-only receipt reconciliation only. No jobs launched, evidence rewritten, historic failures erased, or release/hosted/physical/field-INP/capacity claims. Missing receipts are never passes.', gates: rows }, null, 2));
process.exitCode = status === 'PASS-SCOPED' ? 0 : status === 'FAILED' ? 1 : 2;
