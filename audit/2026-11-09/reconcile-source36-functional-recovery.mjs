// File-only reconciliation. This file starts no server, browser or test.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource, filesWithin } from '../2026-11-05-followup/artifact-verification.mjs';
import { summarizeReport } from '../mobile-games-static-2026-10-20/summarize-browsers.mjs';

const directory = 'audit/2026-11-05-followup';
const output = 'audit/2026-11-09/source36-functional-recovery.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const sourceFile = `${directory}/final36-source.json`;
const source = await verifyFrozenSource(sourceFile);
assert.equal(source.receipt.compared, 506);
assert.deepEqual(source.receipt.mismatches, []);
assert.equal(source.frozen.local.version, 'd89f84d74519bf2bbae0');
assert.equal(source.frozen.fullIntroSourceUnchanged, true);
const build = await json('dist/offline-build.json');
assert.deepEqual(build, source.frozen.local);
const dependencyFiles = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
assert.equal(dependencyFiles.length, 73);
const dependencyHashes = Object.fromEntries(await Promise.all(dependencyFiles.map(async file => [file, sha(await readFile(file))])));
const dependencySha256 = sha(JSON.stringify(dependencyHashes));
assert.equal(dependencySha256, '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');

const artifactProofFile = `${directory}/source36-frontend-build-reuse-proof.json`;
const artifactProof = await json(artifactProofFile);
assert.equal(artifactProof.build.version, build.version);
const artifactHashes = artifactProof.currentAllArtifactSha256;
assert.deepEqual(await filesWithin('dist'), Object.keys(artifactHashes).sort());
for (const [file, expected] of Object.entries(artifactHashes)) assert.equal(sha(await readFile(`dist/${file}`)), expected, `Artifact differs: ${file}`);

const originalMatrixFile = `${directory}/final36-functional-browser-matrix.json`;
const originalMatrix = await json(originalMatrixFile);
assert.equal(originalMatrix.status, 'PARTIAL');
assert.equal(originalMatrix.results.length, 3);
const batches = [];
for (const id of ['new-features', 'existing', 'isolated', 'first-input-timing']) {
  const prefix = id === 'first-input-timing' ? 'final36-nov09-first-input-timing' : `final36-functional-${id}`;
  const protocolFile = `${directory}/${prefix}-protocol.json`;
  const reportFile = `${directory}/${prefix}.json`;
  const summaryFile = `${directory}/${prefix}-summary.json`;
  const protocol = await json(protocolFile);
  const summary = await json(summaryFile);
  assert.deepEqual(summarizeReport(await json(reportFile)), summary);
  assert.equal(protocol.status, 'PASS-SCOPED');
  assert.equal(protocol.exitCode, 0);
  assert.equal(protocol.workers, 1);
  assert.equal(protocol.automaticRetries, 0);
  assert.deepEqual(protocol.browsers, ['chromium', 'edge', 'firefox', 'webkit']);
  assert.deepEqual(protocol.integrity, { sourceUnchanged: true, buildUnchanged: true, testsUnchanged: true, dependenciesUnchanged: true });
  assert.deepEqual(protocol.dependencyHashes, dependencyHashes);
  assert.deepEqual(protocol.build, build);
  assert.equal(summary.totals.failed, 0);
  assert.equal(summary.totals.flaky, 0);
  if (id === 'first-input-timing') {
    assert.equal(summary.totals.total, 32);
    assert.equal(summary.totals.passed, 32);
  } else assert.deepEqual(originalMatrix.results.find(row => row.id === id).summary, summary);
  batches.push({ id, recoveredFromPriorClosedRun: id !== 'first-input-timing', files: protocol.files, startedAt: protocol.declaredAt, finishedAt: protocol.finishedAt, protocol: await bind(protocolFile), rawReport: await bind(reportFile), summaryFile: await bind(summaryFile), totals: summary.totals, projects: summary.projects, skippedCases: summary.skippedCases, skipReasons: summary.skipReasons, sourceAndDependencyIntegrity: protocol.integrity });
}

const actualSpecs = (await readdir('e2e')).filter(file => file.endsWith('.spec.ts')).map(file => `e2e/${file}`).sort();
const coveredSpecs = batches.flatMap(batch => batch.files);
assert.equal(actualSpecs.length, 65);
assert.equal(new Set(coveredSpecs).size, coveredSpecs.length);
assert.deepEqual([...coveredSpecs].sort(), actualSpecs);
const totals = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
const projects = {};
for (const batch of batches) {
  for (const key of Object.keys(totals)) totals[key] += batch.totals[key];
  for (const row of batch.projects) {
    const combined = projects[row.project] ??= { project: row.project, total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 };
    for (const key of Object.keys(totals)) combined[key] += row[key];
  }
}
const oldFirstInputProtocol = `${directory}/final36-functional-first-input-timing-protocol.json`;
const interruptedProtocol = await json(oldFirstInputProtocol);
assert.equal(interruptedProtocol.status, 'NOT-RUN');
for (const suffix of ['.json', '-summary.json']) await assert.rejects(access(`${directory}/final36-functional-first-input-timing${suffix}`), { code: 'ENOENT' });
const result = {
  status: 'PASS-SCOPED-RECOVERED-FUNCTIONAL-MATRIX', reconciledAt: new Date().toISOString(),
  scope: 'File-only reconciliation of three fully closed unchanged-source batches and a separately executed final32 completion. This is not one uninterrupted browser run, a capacity pass or a physical-device certification.',
  source: source.receipt, sourceManifest: await bind(sourceFile), build,
  currentDependencies: { count: dependencyFiles.length, sha256: dependencySha256 },
  currentArtifacts: { proof: await bind(artifactProofFile), compared: Object.keys(artifactHashes).length, allBytesUnchanged: true, performanceEvidenceReused: false },
  originalPartialMatrix: await bind(originalMatrixFile),
  interruption: { priorParentStatus: originalMatrix.status, originalFourthProtocol: await bind(oldFirstInputProtocol), originalFourthProtocolStatus: interruptedProtocol.status, originalFourthLog: await bind(`${directory}/final36-functional-first-input-timing.log`), originalFourthRawReportPresent: false, originalFourthSummaryPresent: false, qualification: 'No fourth-batch outcomes were recorded. This does not establish that zero tests started. Original partial window, protocol and log remain unchanged; no original result is relabeled.', newCompletionPrefix: 'final36-nov09-first-input-timing', automaticRetries: 0 },
  filesCoveredExactlyOnce: actualSpecs.length, assertionsChanged: false, timeoutsChanged: false, workers: 1, retries: 0,
  totals, projects: Object.values(projects), batches,
  skippedCases: batches.flatMap(batch => batch.skippedCases),
  skipQualification: 'The20 native-credential cases and9 WebKit runner-capability gaps remain skips in these original reports. Separate native acceptance may establish its own scope but cannot turn these skips into passes.',
  performance: 'No capacity, mobile latency or Lighthouse measurement was executed by this recovery.',
  previewClosure: { ownedPid: 22624, nonce: 'sparowtype-final36-nov09-functional-preview-2e8d409cb0a917a6', exactPidNodeAndNonceVerifiedBeforeControlC: true, controlCRequestedViaOwnToolSession: true, commandExitCode: 1, ownedPidAbsentAfter: true, port4173NotListeningAfter: true, gracefulExitZeroClaimed: false },
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: result.status, totals, projects: result.projects, sourceFiles: source.receipt.compared, artifacts: Object.keys(artifactHashes).length }));
