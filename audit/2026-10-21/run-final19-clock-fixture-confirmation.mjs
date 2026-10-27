import { spawn } from 'node:child_process';
import { access, readFile, writeFile, open, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { summarizeReport } from '../mobile-games-static-2026-10-20/summarize-browsers.mjs';
import { verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL19_CLOCK_FIXTURE_CONFIRMATION, '1', 'Root must explicitly enable this separate fixture confirmation after the original full matrix finishes.');
const variant = process.argv[2];
assert.ok(['animation', 'fallback'].includes(variant) && process.argv.length === 3, 'Choose exactly animation or fallback.');
assert.equal(process.env.SPAROWTYPE_AUDIT_BROWSERS, 'chromium,edge,firefox,webkit', 'Declare all four engines; narrow filters are rejected.');
assert.equal(process.env.SPAROWTYPE_STATIC_OUTPUTS, undefined, 'Static builds have a separate acceptance runner.');
assert.ok(process.env.SPAROWTYPE_BROWSER_WORKERS === undefined || process.env.SPAROWTYPE_BROWSER_WORKERS === '1', 'This confirmation uses exactly one worker.');
const expectedBuild = 'de097acba6969d580cc8';
assert.equal(process.env.SPAROWTYPE_FINAL19_BUILD_ID, expectedBuild, 'The actual frozen source19 build is required.');
const directory = path.resolve('audit/2026-10-21');
const sourceFile = 'audit/2026-10-21/final19-source.json';
const originalMatrixFile = 'audit/2026-10-21/final19-browser-matrix.json';
const originalMatrix = JSON.parse(await readFile(originalMatrixFile, 'utf8'));
assert.ok(originalMatrix.finishedAt && ['FAILED', 'PASS-SCOPED'].includes(originalMatrix.status), 'Do not run while the original full matrix is active.');
assert.equal(originalMatrix.build.version, expectedBuild);
assert.equal(originalMatrix.results.length, 4, 'All original batches must finish before this confirmation.');
const sourceBefore = await verifyFrozenSource(sourceFile);
assert.equal(sourceBefore.frozen.local.version, expectedBuild);
assert.equal(sourceBefore.receipt.compared, 502);
assert.deepEqual(sourceBefore.receipt.mismatches, []);

const prefix = variant === 'animation' ? 'final19-animation-clock-fixture-confirmation' : 'final19-mobile-fallback-clock-fixture-confirmation';
const reportFile = path.join(directory, `${prefix}.json`);
const protocolFile = path.join(directory, `${prefix}-protocol.json`);
const logFile = path.join(directory, `${prefix}.log`);
const summaryFile = path.join(directory, `${prefix}-summary.json`);
for (const file of [reportFile, protocolFile, logFile, summaryFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const origin = 'http://127.0.0.1:4173';
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
assert.equal(build.version, expectedBuild);
assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(response => response.json()), build);
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const file = variant === 'animation' ? 'e2e/opening-experience.spec.ts' : 'e2e/viewport-acceptance.spec.ts';
const grep = variant === 'animation'
  ? 'caret handoff animation API preserves input and the real caret'
  : '390px full mobile fallback contains every key and keeps controls separate';
const browsers = ['chromium', 'edge', 'firefox', 'webkit'];
const testHashes = { [file]: await hash(file) };
const dependencies = [...(await readdir('e2e')).filter(name => name.endsWith('.ts')).map(name => `e2e/${name}`), 'playwright.config.ts'];
const dependencyHashes = Object.fromEntries(await Promise.all(dependencies.map(async dependency => [dependency, await hash(dependency)])));
const originalProtocol = JSON.parse(await readFile('audit/2026-10-21/final19-isolated-protocol.json', 'utf8'));
assert.deepEqual(Object.keys(dependencyHashes).sort(), Object.keys(originalProtocol.dependencyHashes).sort(), 'The original dependency set must remain exact.');
const fixtureChanges = dependencies.filter(dependency => dependencyHashes[dependency] !== originalProtocol.dependencyHashes[dependency]).sort();
assert.deepEqual(fixtureChanges, ['e2e/opening-renderer.ts', 'e2e/viewport-acceptance.spec.ts'], 'Only the two reviewed fixture files may differ from the original full matrix.');
const fixedFixtureHashes = {
  'e2e/opening-renderer.ts': 'dbddae0518f86baf838d67e1a62f8060018a1805e1059f49cb8f8eef5e30325c',
  'e2e/viewport-acceptance.spec.ts': 'd66540d0fdd897cd58882cd30135ea7f9aff1422b691e1848771b160a05a3f12'
};
for (const changed of fixtureChanges) assert.equal(dependencyHashes[changed], fixedFixtureHashes[changed], 'The reviewed fixture revision must match exactly.');
assert.match(await readFile('playwright.config.ts', 'utf8'), /trace:\s*["']retain-on-failure["']/);
assert.match(await readFile('playwright.config.ts', 'utf8'), /screenshot:\s*["']only-on-failure["']/);
const originalFiles = [originalMatrixFile, 'audit/2026-10-21/final19-isolated.json', 'audit/2026-10-21/final19-isolated.log', 'audit/2026-10-21/final19-isolated-protocol.json', 'audit/2026-10-21/final19-isolated-summary.json', 'audit/2026-10-21/final19-animation-teardown-confirmation.json', 'audit/2026-10-21/final19-animation-teardown-confirmation-protocol.json', 'audit/2026-10-21/final19-clock-fixture-liveness-diagnostic.json', 'audit/2026-10-21/final19-clock-fixture-liveness.patch'];
const originalHashes = Object.fromEntries(await Promise.all(originalFiles.map(async original => [original, await hash(original)])));
const args = ['node_modules/@playwright/test/cli.js', 'test', file, '--grep', grep, '--workers=1', '--retries=0', '--trace=off', '--reporter=list,json', `--output=${directory}/.playwright-artifacts-${prefix}`];
const protocol = {
  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build, sourceFile,
  sourceBefore: sourceBefore.receipt, origin, files: [file], grep, grepAnchored: false,
  expectedCases: 4, expectedCasesPerProject: 1, browsers, workers: 1, automaticRetries: 0,
  tracing: 'off', configuredTracing: 'retain-on-failure', failureScreenshots: 'only-on-failure',
  timeoutOverride: null, originalTestTimeoutMs: variant === 'animation' ? 30000 : 45000,
  originalPreparationRealDeadlineMs: variant === 'animation' ? 20000 : 15000,
  preparationClockBudgetMs: 1500, actualReadinessStopsClockAdvancementEarly: true,
  assertionsChanged: false, timeoutsChanged: false, fixtureSchedulingChanged: true,
  fixtureChanges, fixedFixtureHashes, testHashes, dependencyHashes, originalHashes,
  originalMatrixStatus: originalMatrix.status,
  command: [process.execPath, ...args].join(' '),
  scope: 'Separate four-engine confirmation after an explicitly reviewed fixture-only paused-clock liveness repair. Actual native paint is still required where exposed; product scheduling, renderer quality, original real-time deadlines and all original fallback/geometry/caret/input assertions remain unchanged. Original full-matrix and unchanged-confirmation failures remain failures. A result does not prove their cause or native-device behavior.'
};
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const log = await open(logFile, 'wx');
const began = performance.now();
let code;
try {
  code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      windowsHide: true,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: origin, PLAYWRIGHT_BROWSERS: browsers.join(','), PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
      stdio: ['ignore', log.fd, log.fd]
    });
    child.once('error', reject);
    child.once('exit', resolve);
  });
} finally {
  await log.close();
}
const raw = JSON.parse(await readFile(reportFile, 'utf8'));
const summary = summarizeReport(raw);
const selected = [];
const visit = suite => {
  for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) selected.push({ title: spec.title, file: spec.file ?? suite.file, project: test.projectName, expectedStatus: test.expectedStatus, results: test.results ?? [] });
  for (const nested of suite.suites ?? []) visit(nested);
};
for (const suite of raw.suites) visit(suite);
const sourceAfter = await verifyFrozenSource(sourceFile);
const integrity = {
  localBuildUnchanged: JSON.stringify(JSON.parse(await readFile('dist/offline-build.json', 'utf8'))) === JSON.stringify(build),
  servedBuildUnchanged: JSON.stringify(await fetch(`${origin}/offline-build.json`).then(response => response.json())) === JSON.stringify(build),
  sourcesUnchanged: sourceAfter.receipt.compared === 502 && sourceAfter.receipt.mismatches.length === 0,
  testsUnchanged: await hash(file) === testHashes[file],
  dependenciesUnchanged: (await Promise.all(dependencies.map(async dependency => await hash(dependency) === dependencyHashes[dependency]))).every(Boolean),
  originalEvidenceUnchanged: (await Promise.all(originalFiles.map(async original => await hash(original) === originalHashes[original]))).every(Boolean),
  exactFourCases: summary.totals.total === 4 && selected.length === 4,
  oneExactCasePerEngine: browsers.every(browser => selected.filter(test => test.project === browser && test.title === grep).length === 1),
  noRetries: selected.every(test => test.results.length === 1 && test.results[0].retry === 0),
  noExpectedFailures: summary.expectedFailures.length === 0 && selected.every(test => test.expectedStatus === 'passed'),
  countsAgreeWithReport: summary.countsAgreeWithReport === true,
  noGlobalErrors: summary.globalErrors.length === 0
};
protocol.finishedAt = new Date().toISOString();
protocol.durationMs = performance.now() - began;
protocol.exitCode = code;
protocol.sourceAfter = sourceAfter.receipt;
protocol.integrity = integrity;
protocol.status = code === 0 && summary.totals.passed === 4 && summary.totals.failed === 0 && summary.totals.skipped === 0 && summary.totals.flaky === 0 && Object.values(integrity).every(Boolean) ? 'PASS-SCOPED' : 'FAILED';
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n');
await writeFile(summaryFile, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build: build.version, status: protocol.status, exitCode: code, totals: summary.totals, integrity }));
process.exitCode = protocol.status === 'PASS-SCOPED' ? 0 : 1;
