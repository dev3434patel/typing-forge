import { spawn } from 'node:child_process';
import { access, readFile, writeFile, open, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { summarizeReport } from '../mobile-games-static-2026-10-20/summarize-browsers.mjs';
import { verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL19_WORKER_READINESS_CONFIRMATION, '1', 'Root must explicitly enable this separate confirmation after the original full matrix finishes.');
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

const prefix = 'final19-worker-readiness-confirmation';
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
const file = 'e2e/opening-worker.spec.ts';
const titles = [
  'default native worker draws the complete keyboard while document tasks, resize and skip remain responsive',
  'native worker acknowledges real resource disposal at an explicitly idle renderer boundary',
  'actual worker WebGL context loss during preparation recovers with a fresh canvas and keeps practice usable',
  'actual worker WebGL context loss after live frames recovers with a fresh canvas and keeps practice usable'
];
const grep = titles.join('|');
const browsers = ['chromium', 'edge', 'firefox', 'webkit'];
const testHashes = { [file]: await hash(file) };
const dependencies = [...(await readdir('e2e')).filter(name => name.endsWith('.ts')).map(name => `e2e/${name}`), 'playwright.config.ts'];
const dependencyHashes = Object.fromEntries(await Promise.all(dependencies.map(async dependency => [dependency, await hash(dependency)])));
assert.match(await readFile('playwright.config.ts', 'utf8'), /trace:\s*["']retain-on-failure["']/);
assert.match(await readFile('playwright.config.ts', 'utf8'), /screenshot:\s*["']only-on-failure["']/);
const originalFiles = [originalMatrixFile, 'audit/2026-10-21/final19-isolated.json', 'audit/2026-10-21/final19-isolated.log', 'audit/2026-10-21/final19-isolated-protocol.json', 'audit/2026-10-21/final19-isolated-summary.json'];
const originalHashes = Object.fromEntries(await Promise.all(originalFiles.map(async original => [original, await hash(original)])));
const args = ['node_modules/@playwright/test/cli.js', 'test', file, '--grep', grep, '--workers=1', '--retries=0', '--trace=off', '--reporter=list,json', `--output=${directory}/.playwright-artifacts-${prefix}`];
const protocol = {
  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build, sourceFile,
  sourceBefore: sourceBefore.receipt, origin, files: [file], grep, grepAnchored: false,
  expectedCases: 16, expectedCasesPerProject: 4, expectedTitles: titles, browsers, workers: 1, automaticRetries: 0,
  tracing: 'off', configuredTracing: 'retain-on-failure', failureScreenshots: 'only-on-failure',
  timeoutOverride: null, originalTestTimeoutMs: 30000, originalReadyPredicateTimeoutMs: 5000, assertionsChanged: false, timeoutsChanged: false,
  testHashes, dependencyHashes, originalHashes,
  originalMatrixStatus: originalMatrix.status,
  command: [process.execPath, ...args].join(' '),
  capabilitySkipPolicy: 'Only the four WebKit cases may retain the existing native transferable-canvas API capability skip. Such cases remain skipped and the overall result is PARTIAL-CAPABILITY-SKIPS, never a sixteen-case pass.',
  scope: 'Separate four-engine confirmation of exactly four unchanged native-worker cases that failed in the original Firefox run. Initial ready-predicate failures are separate from later disposal, context-loss or recovery assertions. Original full-matrix failures remain failures. Startup cause, native devices and field performance are not established by a confirmation result.'
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
  exactSixteenCases: summary.totals.total === 16 && selected.length === 16,
  fourExactCasesPerEngine: browsers.every(browser => titles.every(title => selected.filter(test => test.project === browser && test.title === title).length === 1)),
  noRetries: selected.every(test => test.results.length === 1 && test.results[0].retry === 0),
  noExpectedFailures: summary.expectedFailures.length === 0 && selected.every(test => ['passed', 'skipped'].includes(test.expectedStatus)),
  countsAgreeWithReport: summary.countsAgreeWithReport === true,
  noGlobalErrors: summary.globalErrors.length === 0
};
protocol.finishedAt = new Date().toISOString();
protocol.durationMs = performance.now() - began;
protocol.exitCode = code;
protocol.sourceAfter = sourceAfter.receipt;
protocol.integrity = integrity;
const noFailures = code === 0 && summary.totals.failed === 0 && summary.totals.flaky === 0 && Object.values(integrity).every(Boolean);
const allSixteenPassed = noFailures && summary.totals.passed === 16 && summary.totals.skipped === 0;
const webkitCapabilityOnly = noFailures && summary.totals.passed === 12 && summary.totals.skipped === 4 && summary.skippedCases.every(test =>
  test.project === 'webkit' && titles.some(title => test.title.endsWith(title)) &&
  test.reasons.some(reason => reason === 'UNVERIFIED: this runner has no native transferable-canvas worker API. Document fallback is covered independently.')
);
protocol.allSixteenCasesPassed = allSixteenPassed;
protocol.capabilitySkipsArePasses = false;
protocol.status = allSixteenPassed ? 'PASS-SCOPED' : webkitCapabilityOnly ? 'PARTIAL-CAPABILITY-SKIPS' : 'FAILED';
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n');
await writeFile(summaryFile, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ build: build.version, status: protocol.status, exitCode: code, totals: summary.totals, integrity }));
process.exitCode = protocol.status === 'FAILED' ? 1 : 0;
