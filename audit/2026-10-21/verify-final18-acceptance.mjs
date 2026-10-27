// Read completed audit receipts only. Never launches a runner, reads private
// configuration, changes application/source data, or rewrites existing evidence.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const build = process.env.SPAROWTYPE_FINAL18_BUILD_ID;
assert.equal(build, 'e8451e7c13b09318a1ef', 'Supply the actual frozen18 build identity; this verifier cannot accept another build.');
const audit = path.resolve(import.meta.dirname);
const overrides = {};
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index], value = process.argv[index + 1];
  assert.ok(['--matrix', '--placement', '--native', '--source-gates'].includes(key) && value);
  assert.equal(overrides[key], undefined, 'Duplicate receipt override.');
  overrides[key] = value;
}
assert.equal(overrides['--matrix'] ?? 'final18-browser-matrix.json', 'final18-browser-matrix.json', 'The source18 full matrix receipt is fixed; prior source outcomes remain historical.');
assert.ok(['final18-source-gates.json', 'final18-source-gates-confirmed.json', 'final18-source-gates-confirmed-workers1.json'].includes(overrides['--source-gates'] ?? 'final18-source-gates.json'), 'Select only the explicit original or confirmed18 source-gate receipt.');
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

await gate('frozen-source', 'final18-source.json', (data, check) => {
  check('actual normal identity', identifier(data.local) === build && identifier(data.served) === build);
  check('local and served metadata agree', JSON.stringify(data.local) === JSON.stringify(data.served));
  check('499 source identities', Object.keys(data.sourceHashes ?? {}).length === 499);
});

await gate('source-gates', overrides['--source-gates'] ?? 'final18-source-gates.json', async (data, check, row) => {
  check('exact12 completed exit0 commands', data.results?.length === 12 && data.results.every(result => result.exitCode === 0 && result.finishedAt));
  check('no automatic retries', data.automaticRetries === 0);
  if (row.receipt === 'final18-source-gates.json') {
    row.scope = 'Original source-gate receipt only. Its failed coverage operation is never promoted by a later confirmation.';
    return;
  }
  const maxWorkers = row.receipt === 'final18-source-gates-confirmed-workers1.json' ? 1 : 2;
  row.scope = `Explicit composite:11 unchanged original passing rows plus one separately declared full worker${maxWorkers} coverage confirmation. Original FAILED receipt/log and prior worker2 failure remain immutable; changed parallelism is not proof of the original failure cause.`;
  const originalFile = 'final18-source-gates.json', confirmationFile = `final18-coverage-workers${maxWorkers}-confirmation.json`, rawFile = `final18-coverage-workers${maxWorkers}-raw.json`, logFile = `final18-coverage-workers${maxWorkers}.log`, oldLogFile = 'final18-coverage.log';
  const digest = async file => createHash('sha256').update(await readFile(path.join(audit, file))).digest('hex');
  const publicRef = (value, expected) => typeof value === 'string' && [expected, `audit/2026-10-21/${expected}`].includes(value.replaceAll(String.fromCharCode(92), '/'));
  const sourceProof = proof => proof?.expectedBuild === build && proof.compared === 499 && empty(proof.mismatches);
  const original = await json(originalFile), confirmation = await json(confirmationFile), raw = await json(rawFile);
  row.compositeRawSha256 = await digest(row.receipt);
  if (!original || !confirmation || !raw) { row.pendingDependencies.push('Explicit original/confirmation/raw coverage witnesses missing.'); return; }
  if (!confirmation.finishedAt || /^(?:RUNNING|PARTIAL|DECLARED|PREPARED|NOT-RUN)/.test(confirmation.status ?? '')) { row.pendingDependencies.push('Coverage confirmation has not finalized.'); return; }
  const originalCoverage = original.results?.find(result => result.id === 'coverage');
  const originalOther = original.results?.filter(result => result.id !== 'coverage') ?? [];
  const replacement = data.results?.find(result => result.id === 'coverage');
  row.originalGateOutcome = original.status;
  row.originalCoverageOutcome = originalCoverage?.status;
  row.parallelismChange = { original: 'default worker pool', confirmationMaxWorkers: maxWorkers, automaticRetries: 0, causeOfOriginalTimeouts: 'UNPROVEN' };
  check('original12 retained FAILED with only coverage failing', original.status === 'FAILED' && original.results?.length === 12 && original.automaticRetries === 0 && originalCoverage?.exitCode !== 0 && originalOther.length === 11 && originalOther.every(result => result.exitCode === 0 && result.finishedAt));
  check('original raw receipt/log hashes match both declarations', publicRef(data.originalGate?.file, originalFile) && publicRef(confirmation.originalGate?.file, originalFile) && data.originalGate?.status === 'FAILED' && data.originalGate.rawSha256 === await digest(originalFile) && confirmation.originalGate.rawSha256 === await digest(originalFile) && data.originalGate.coverageLogSha256 === await digest(oldLogFile) && confirmation.originalGate.coverageLogSha256 === await digest(oldLogFile));
  check('original failed coverage row is copied exactly', isDeepStrictEqual(data.originalGate?.coverageRow, originalCoverage) && isDeepStrictEqual(confirmation.originalGate?.coverageRow, originalCoverage) && publicRef(originalCoverage?.file, oldLogFile));
  check('all11 old passing rows copied without mutation', originalOther.every(result => isDeepStrictEqual(data.results?.find(candidate => candidate.id === result.id), result)) && new Set(data.results?.map(result => result.id)).size === 12);
  check('actual18/499-source composite and confirmation', identifier(data.build) === build && identifier(confirmation.build) === build && sourceProof(data.sourceBefore) && sourceProof(data.sourceAfter) && sourceProof(confirmation.sourceBefore) && sourceProof(confirmation.sourceAfter) && confirmation.sourceUnchanged === true);
  const inputBefore = confirmation.inputHashesBefore ?? {}, inputAfter = confirmation.inputHashesAfter ?? {}, inputKeys = Object.keys(inputBefore).sort();
  check('config/package/test input identities unchanged', confirmation.inputsUnchanged === true && inputKeys.length > 3 && ['package.json', 'package-lock.json', 'vitest.config.ts'].every(file => inputKeys.includes(file)) && inputKeys.some(file => /(?:^|\/)[^/]+\.test\.[cm]?[jt]sx?$/.test(file)) && JSON.stringify(inputKeys) === JSON.stringify(Object.keys(inputAfter).sort()) && inputKeys.every(file => /^[a-f0-9]{64}$/.test(inputBefore[file]) && inputBefore[file] === inputAfter[file]));
  const profile = confirmation.profile;
  check(`explicit worker${maxWorkers} only scheduling/report change`, profile?.maxWorkers === maxWorkers && profile.automaticRetries === 0 && profile.timeoutsChanged === false && profile.assertionsChanged === false && profile.casesFiltered === false && profile.reportsOnlyChanges === true && isDeepStrictEqual(data.coverageConfirmation?.profile, profile));
  const commandText = value => Array.isArray(value) ? value.join(' ') : typeof value === 'string' ? value : '';
  check(`worker${maxWorkers} command/replacement completed exit0`, new RegExp(`--maxWorkers(?:=|\\s+)${maxWorkers}\\b`).test(commandText(confirmation.command)) && confirmation.exitCode === 0 && replacement?.exitCode === 0 && replacement.maxWorkers === maxWorkers && Boolean(replacement.finishedAt) && publicRef(replacement.file, logFile));
  check('confirmation/raw/log hashes bound to exact files', publicRef(data.coverageConfirmation?.file, confirmationFile) && data.coverageConfirmation.rawSha256 === await digest(confirmationFile) && publicRef(data.coverageConfirmation.rawReport, rawFile) && publicRef(confirmation.rawReport, rawFile) && data.coverageConfirmation.rawReportSha256 === await digest(rawFile) && publicRef(data.coverageConfirmation.log, logFile) && publicRef(confirmation.log, logFile) && data.coverageConfirmation.logSha256 === await digest(logFile));

  const completeHashMap = value => value && typeof value === 'object' && Object.keys(value).length === 499 && Object.values(value).every(hash => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash));
  check('all499 source identities stable/original failure preserved', completeHashMap(confirmation.sourceHashesBefore) && completeHashMap(confirmation.sourceHashesAfter) && isDeepStrictEqual(confirmation.sourceHashesBefore, confirmation.sourceHashesAfter) && confirmation.originalFailedGateUnchanged === true);
  if (maxWorkers === 1) {
    const priorFile = 'final18-coverage-workers2-confirmation.json', priorRawFile = 'final18-coverage-workers2-raw.json', priorLogFile = 'final18-coverage-workers2.log';
    const declaredPrior = data.priorCoverageConfirmations ?? [], confirmationPrior = confirmation.priorCoverageConfirmations ?? [];
    check('worker1 declares exactly the same unchanged prior worker2 failure', confirmation.priorFailedCoverageUnchanged === true && declaredPrior.length === 1 && confirmationPrior.length === 1 && isDeepStrictEqual(declaredPrior, confirmationPrior) && publicRef(declaredPrior[0]?.file, priorFile));
    const prior = await json(priorFile), priorRaw = await json(priorRawFile);
    if (!prior || !priorRaw || !prior.finishedAt) row.pendingDependencies.push('Completed failed worker2 confirmation/raw witnesses missing; never assume an active run passed or failed.');
    else {
      const retained = declaredPrior[0];
      check('prior worker2 receipt/raw/log exact hashes retained', retained?.status === 'FAILED' && prior.status === 'FAILED' && prior.exitCode !== 0 && retained.rawSha256 === await digest(priorFile) && publicRef(retained.rawReport, priorRawFile) && publicRef(prior.rawReport, priorRawFile) && retained.rawReportSha256 === await digest(priorRawFile) && publicRef(retained.log, priorLogFile) && publicRef(prior.log, priorLogFile) && retained.logSha256 === await digest(priorLogFile));
      check('prior worker2 profile/summary/source declaration copied exactly', isDeepStrictEqual(retained?.profile, prior.profile) && isDeepStrictEqual(retained?.summary, prior.summary) && isDeepStrictEqual(retained?.sourceBefore, prior.sourceBefore) && isDeepStrictEqual(retained?.sourceAfter, prior.sourceAfter) && retained?.sourceUnchanged === true && retained.inputsUnchanged === true && retained.originalFailedGateUnchanged === true && retained.finishedAt === prior.finishedAt);
      check('prior worker2 actual499 source identity matches worker1', identifier(prior.build) === build && sourceProof(prior.sourceBefore) && sourceProof(prior.sourceAfter) && prior.sourceUnchanged === true && prior.inputsUnchanged === true && prior.originalFailedGateUnchanged === true && completeHashMap(prior.sourceHashesBefore) && completeHashMap(prior.sourceHashesAfter) && isDeepStrictEqual(prior.sourceHashesBefore, prior.sourceHashesAfter) && isDeepStrictEqual(prior.sourceHashesBefore, confirmation.sourceHashesBefore) && prior.originalGate?.rawSha256 === data.originalGate?.rawSha256 && prior.originalGate?.coverageLogSha256 === data.originalGate?.coverageLogSha256);
      const priorProfile = prior.profile;
      check('prior worker2 remains explicitly failed at unchanged cases/deadlines', priorProfile?.maxWorkers === 2 && priorProfile.automaticRetries === 0 && priorProfile.timeoutsChanged === false && priorProfile.assertionsChanged === false && priorProfile.casesFiltered === false);
      const stableInputs = value => Object.fromEntries(Object.entries(value ?? {}).filter(([file]) => !file.replaceAll(String.fromCharCode(92), '/').startsWith('audit/')).sort(([a], [b]) => a.localeCompare(b)));
      check('worker1/2 share exact unit/config/package inputs', isDeepStrictEqual(stableInputs(prior.inputHashesBefore), stableInputs(confirmation.inputHashesBefore)) && isDeepStrictEqual(stableInputs(prior.inputHashesAfter), stableInputs(confirmation.inputHashesAfter)));
      const priorFiles = priorRaw.testResults ?? [], priorCases = priorFiles.flatMap(file => file.assertionResults ?? []);
      row.priorWorker2ActualCounts = { files: priorFiles.length, tests: priorCases.length, passed: priorCases.filter(test => test.status === 'passed').length, failed: priorCases.filter(test => test.status === 'failed').length, skippedOrOther: priorCases.filter(test => test.status !== 'passed' && test.status !== 'failed').length };
      check('prior worker2 raw records a real full-suite failure', priorRaw.success === false && priorFiles.length === 111 && priorCases.length === 2811 && priorCases.some(test => test.status === 'failed'));
    }
  }

  const files = raw.testResults ?? [], cases = files.flatMap(file => file.assertionResults ?? []);
  row.actualCoverageCounts = { files: files.length, tests: cases.length, passed: cases.filter(test => test.status === 'passed').length, failed: cases.filter(test => test.status === 'failed').length, skippedOrOther: cases.filter(test => test.status !== 'passed' && test.status !== 'failed').length };
  check('actual complete2811 passing assertions/111 files', raw.success === true && files.length === 111 && new Set(files.map(file => file.name)).size === 111 && cases.length === 2811 && cases.every(test => test.status === 'passed') && raw.numTotalTests === 2811 && raw.numPassedTests === 2811 && raw.numFailedTests === 0 && (raw.numPendingTests ?? 0) === 0 && (raw.numTodoTests ?? 0) === 0 && (raw.numFailedTestSuites ?? 0) === 0 && (raw.numRuntimeErrorTestSuites ?? 0) === 0);
  const expectedSummary = { tests: 2811, files: 111, passed: 2811, failed: 0, skipped: 0 };
  check('summary/counts/coverage projection agree', isDeepStrictEqual(confirmation.summary, expectedSummary) && isDeepStrictEqual(data.coverageConfirmation?.summary, expectedSummary) && isDeepStrictEqual(data.coverageConfirmation.coveragePercent, confirmation.coveragePercent));
});

await gate('source-delta', 'final18-source-delta.json', (data, check) => {
  const changed = ['src/components/layout/PwaStatus.tsx', 'src/pages/Offline.tsx'].sort();
  check('actual18/499sources/exact2paths/497unchanged', data.expectedBuild === build && data.after?.version === build && data.afterSourceFiles === 499 && data.beforeSourceFiles === 499 && JSON.stringify([...(data.changedSourceFiles ?? [])].sort()) === JSON.stringify(changed) && data.unchangedSourceFiles === 497);
  check('no added or removed production/source files', empty(data.addedSourceFiles) && empty(data.removedSourceFiles));
  check('frozen source matches', data.currentFrozenSource?.expectedBuild === build && data.currentFrozenSource.compared === 499 && empty(data.currentFrozenSource.mismatches));
  check('protected component hashes unchanged', Object.keys(data.componentIntegrity ?? {}).length > 0 && Object.values(data.componentIntegrity).every(c => c.unchanged === true && empty(c.changed)));
});
await gate('bundle-budgets', 'final18-bundle.json', async (data, check, row) => {
  const pairs = [['initialPracticeJsGzipBytes', 'initialPracticeJsGzipBytes'], ['maxFeatureJsGzipBytes', 'featureJsGzipBytes'], ['introDeferredJsGzipBytes', 'introDeferredJsGzipBytes'], ['arcadeRouteGzipBytes', 'arcadeRouteGzipBytes'], ['arcadePlayerGzipBytes', 'arcadePlayerGzipBytes'], ['dashboardRouteGzipBytes', 'dashboardRouteGzipBytes']];
  check('all original gzip budgets met', pairs.every(([m, b]) => finite(data[m]) && finite(data.budgets?.[b]) && data[m] <= data.budgets[b]));
  check('Arcade outside initial practice', data.arcadeAbsentFromInitialPractice === true);
  const binding = await json('final18-artifact-independent-extraction.json');
  if (!binding) row.pendingDependencies.push('Actual18 bundle hash/build binding missing.');
  else check('raw bundle bound to actual18', identifier(binding.build) === build && binding.receiptRawSha256?.['final18-bundle.json'] === createHash('sha256').update(await readFile(path.join(audit, 'final18-bundle.json'))).digest('hex'));
  row.scope = 'Bundle/source artifact budgets only; prior failed and baseline receipts remain historical and do not constitute source18 runtime acceptance.';
});
await gate('hosting-package-structure', 'final18-hosting-package-verification.json', (data, check) => {
  check('actual18/27 successful checks', identifier(data.build) === build && data.checks?.length === 27 && allPassed(data.checks));
  check('source bound/no retries/filtering', data.source?.expectedBuild === build && data.source.compared === 499 && empty(data.source.mismatches) && data.automaticRetries === 0 && data.resultFiltering === false);
  check('five visual/worker byte comparisons passed', data.visualComparisons?.length === 5 && allPassed(data.visualComparisons));
});
const artifacts = await gate('static-artifacts', 'final18-static-artifacts.json', (data, check) => {
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
await gate('static-deployment-and-game-axe', 'final18-static-process.json', (data, check) => {
  check('declared source18 identity', data.expectedBuild === build);
  staticCases(data, 'deployment', 56, 14, check);
  staticCases(data, 'game-accessibility', 16, 4, check);
  check('source/default artifact/input guards passed', allPassed(data.checks));
  check('owned child processes exited without interruption', data.ownedChildProcessExited === true && data.interrupted === false && data.processes?.every(row => row.exitCode === 0));
});

const mobileFile = 'mobile-workspaces-final18-static.json';
await gate('mobile-functional', mobileFile, async (data, check, row) => {
  const vercel = artifacts?.artifacts?.find(item => item.deployment?.target === 'vercel');
  if (!vercel) row.pendingDependencies.push('Static artifact identity has not completed.');
  else check('measured dedicated Vercel identity', identifier(data.build) === identifier(vercel.build) && identifier(data.servedBuild) === identifier(vercel.build));
  check('exact four workspaces', JSON.stringify(data.cases?.map(item => item.id)) === JSON.stringify(['learn', 'course', 'local-bot', 'games']));
  check('all functional cases completed with native exact evidence', data.completed === true && data.watchdogExpired === false && data.cases?.length === 4 && data.cases.every(item => item.passed === true && item.evidence?.attempts > 0 && item.evidence.inputAccuracy === 100 && (item.evidence.finalTextExact === true || item.evidence.finalInputValuesExact === true)));
  check('no runtime errors or overflow', data.cases?.every(item => empty(item.pageErrors) && empty(item.consoleErrors) && item.horizontalOverflow === false));
  const processReceipt = await json('mobile-workspaces-final18-static-process.json');
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
await gate('matched-input-functional', 'final18-input-results.json', (data, check) => {
  check('three declared source18 runs', identifier(data.protocol?.build) === build && data.runs?.length === 3 && data.runs.every(run => run.build === build));
  check('all495 exact/100% and rotation retained', data.runs?.every(run => run.exact === true && run.attempts === 495 && run.accuracy === 100 && run.rotation?.beforeLength === 247 && run.rotation.afterLength === 247 && run.rotation.retainedExactly === true && run.rotation.overflow === false && empty(run.errors)));
  check('same declared protocol without retries/filtering', data.protocol?.automaticRetries === 0 && data.protocol.resultFiltering === false && data.protocol.cpuThrottle === 4 && data.protocol.freshProfiles === true && data.protocol.quietSeconds === 5 && data.protocol.interCharacterDelayMs === 0);
});
await gate('matched-input-latency', 'final18-input-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ run: run.run, attempts: run.attempts, p98Ms: run.p98Ms, maxMs: run.maxMs }));
  check('every run p98 strictly under100ms', values?.length === 3 && values.every(run => finite(run.p98Ms) && run.p98Ms < 100 && finite(run.maxMs)), values);
});
await gate('lighthouse-mobile', 'final18-mobile-results.json', (data, check) => {
  const values = data.runs?.map(run => ({ build: identifier(run.build), scores: run.scores, lcpMs: run.metrics?.['largest-contentful-paint'], cls: run.metrics?.['cumulative-layout-shift'], runtimeError: run.runtimeError }));
  check('three actual source18 runs', identifier(data.protocol?.build) === build && values?.length === 3 && values.every(run => run.build === build));
  const scores = values?.map(run => run.scores?.performance).sort((a, b) => a - b);
  check('median performance at least95', scores?.length === 3 && scores.every(finite) && scores[1] >= 95, scores);
  check('every A11y/BP/SEO100', values?.every(run => run.scores?.accessibility === 100 && run.scores['best-practices'] === 100 && run.scores.seo === 100), values);
  check('every LCP<=2500ms/CLS<=0.05/no runtimeError', values?.every(run => finite(run.lcpMs) && run.lcpMs <= 2500 && finite(run.cls) && run.cls <= 0.05 && run.runtimeError === null));
  check('full-quality first intro/30s quiet/fresh profiles/no filtering', data.protocol?.introSkip === false && data.protocol.qualityOverrides === false && data.protocol.reducedMotionOverride === false && data.protocol.quietBeforeEachSeconds === 30 && data.protocol.freshProfiles === true && data.protocol.automaticRetries === 0 && data.protocol.scoreFiltering === false);
});


await gate('full63-file-four-engine-matrix', overrides['--matrix'] ?? 'final18-browser-matrix.json', async (data, check, row) => {
  check('actual18/all4/no retries', identifier(data.build) === build && sameEngines(data.browsers) && data.automaticRetries === 0);
  const files = data.batches?.flatMap(b => b.files) ?? [], expected = [['new-features', 1, 11], ['existing', 1, 42], ['isolated', 1, 9], ['first-input-timing', 1, 1]];
  check('exact63 files/no duplicates', data.filesCoveredExactlyOnce === 63 && files.length === 63 && new Set(files).size === 63);
  const executionProfile = data.executionProfile;
  check('explicit serial functional test isolation profile', executionProfile?.id === 'serial-functional-workers1-v1' && executionProfile.workersPerBatch === 1 && executionProfile.batchesRunSequentially === true && executionProfile.automaticRetries === 0 && executionProfile.tracing === 'off' && executionProfile.assertionsChanged === false && executionProfile.timeoutsChanged === false && executionProfile.filesFiltered === false);
  check('four declared serial batches/workers', data.batches?.length === 4 && expected.every(([id, workers, fileCount], i) => data.batches[i].id === id && data.batches[i].workers === workers && data.batches[i].files?.length === fileCount));
  check('PWA snapshot fixture appears only in isolated worker1 batch', data.batches?.filter(batch => batch.files?.includes('e2e/pwa-snapshot-consistency.spec.ts')).length === 1 && data.batches.find(batch => batch.id === 'isolated')?.files?.includes('e2e/pwa-snapshot-consistency.spec.ts') === true && data.batches.find(batch => batch.id === 'isolated')?.workers === 1);
  const results = data.results ?? [], complete = Boolean(data.finishedAt && results.length === 4);
  if (!complete) row.pendingDependencies.push('Full matrix has not finalized all four batches.');
  check('no duplicate/unknown completed batches', new Set(results.map(r => r.id)).size === results.length && results.every(r => expected.some(([id]) => r.id === id)));
  const matrixName = path.basename(row.receipt); assert.match(matrixName, /^final18(?:-[a-z0-9]+)*-browser-matrix\.json$/);
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
  row.scope = 'Actual raw counts, not assumed1396 total. Conditional skips are explicit and never feature passes. Changed traceoff instrumentation and explicit worker1 test isolation cannot relabel prior-source failures or prove their cause. Earlier prepared source18 worker2 plans were superseded before execution. Native16/static remain separate gates.';
}, true);

await gate('real-native16-and-owned-cleanup', overrides['--native'] ?? 'final18-native-browser.json', async (data, check, row) => {
  const stats = data.nativeResult?.stats;
  check('source18/all16 real cases without skip/flaky/retry', data.build === build && data.expectedCases === 16 && sameEngines(data.engines) && data.exitCode === 0 && stats?.expected === 16 && stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0 && data.retries === 0);
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
await gate('real135-placement-and-private-goal', overrides['--placement'] ?? 'final18-placement-real135-raw.json', (data, check, row) => {
  check('actual source18/82 named checks', identifier(data.build) === build && data.passed === 82 && data.failed === 0 && data.checks?.length === 82 && allPassed(data.checks));
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


const status = rows.some(row => row.status === 'FAILED') ? 'FAILED' : rows.some(row => ['NOT-RUN', 'PARTIAL'].includes(row.status)) ? 'PARTIAL' : 'PASS-SCOPED';
console.log(JSON.stringify({ capturedAt: new Date().toISOString(), status, build, scope: 'Read-only actual18 receipt reconciliation only. Missing/running witnesses stay NOT-RUN/PARTIAL and completed failures stay FAILED. Raw actual counts/skips retained; no assumed whole-matrix total, execution, historical rewrite, hosted/physical/field-INP/capacity claim.', gates: rows }, null, 2));
process.exitCode = status === 'PASS-SCOPED' ? 0 : status === 'FAILED' ? 1 : 2;
