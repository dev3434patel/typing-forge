// Text-only preparation. This file never imports or starts a validation runner.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-10-21';
const pairs = [
  ['run-final15-static.mjs', 'run-final16-static.mjs'],
  ['run-mobile-workspaces-static-final15.mjs', 'run-mobile-workspaces-static-final16.mjs'],
  ['measure-mobile-workspaces-static-final15.mjs', 'measure-mobile-workspaces-static-final16.mjs'],
  ['standalone-placement-real135-final15.mjs', 'standalone-placement-real135-final16.mjs'],
  ['run-final15-browser-matrix.mjs', 'run-final16-browser-matrix.mjs'],
  ['run-final15-native-browser.mjs', 'run-final16-native-browser.mjs'],
];
const output = `${directory}/final16-validation-drivers-prepared.json`;
for (const file of [output, ...pairs.map(([, file]) => `${directory}/${file}`)])
  await assert.rejects(access(file), { code: 'ENOENT' });
const sha = value => createHash('sha256').update(value).digest('hex');
const records = [];
for (const [before, after] of pairs) {
  const original = await readFile(`${directory}/${before}`, 'utf8');
  const revised = original.replaceAll('final15', 'final16').replaceAll('FINAL15', 'FINAL16').replaceAll('source15', 'source16');
  assert.equal(revised.replaceAll('final16', 'final15').replaceAll('FINAL16', 'FINAL15').replaceAll('source16', 'source15'), original);
  assert.ok(revised.includes('FINAL16') || revised.includes('final16'));
  await writeFile(`${directory}/${after}`, revised, { flag: 'wx' });
  records.push({ from: `${directory}/${before}`, to: `${directory}/${after}`, originalSha256: sha(original), revisedSha256: sha(revised), referenceReplacementOnly: true, reverseExact: true });
}
const matrix = await readFile(`${directory}/run-final16-browser-matrix.mjs`, 'utf8');
assert.ok(matrix.includes("assert.equal(process.env.SPAROWTYPE_STATIC_OUTPUTS, undefined"));
assert.ok(matrix.includes("assert.equal(process.env.SPAROWTYPE_AUDIT_BROWSERS, 'chromium,edge,firefox,webkit'"));
assert.ok(matrix.includes("assert.deepEqual([...all].sort(), actual"));
const specs = (await readdir('e2e')).filter(file => file.endsWith('.spec.ts'));
assert.equal(specs.length, 62);
await writeFile(output, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', actualBuildId: null,
  actualBuildIdPolicy: 'Execution requires actual SPAROWTYPE_FINAL16_BUILD_ID; placement requires SPAROWTYPE_FINAL16_BUILD; static mobile additionally requires actual SPAROWTYPE_FINAL16_STATIC_BUILD_ID after dedicated artifact creation. No guessed identity.',
  records, testsAssertionsActionsBudgetsWorkerRetryPolicyChanged: false,
  sourceFilesEdited: false, browserServicesBuildTestsExecuted: false,
  matrix: { currentSpecFiles: 62, everyCurrentSpecCoveredExactlyOnceGuardRetained: true, fourEnginesExplicitGuardRetained: true, inheritedStaticOutputsRejected: true },
  staticScope: { deploymentCases: 56, gameAccessibilityCases: 16, engines: ['chromium', 'edge', 'firefox', 'webkit'], workers: 1, retries: 0 },
  nativeScope: { expectedCases: 16, engines: ['chromium', 'edge', 'firefox', 'webkit'], workers: 1, retries: 0, traces: false, serviceOwnership: 'Existing guarded fresh instance; cleanup separately required.' },
  priorEvidencePreserved: ['final15-native-browser.json', 'final15-source.json', 'final15-static-process.json'],
  scope: 'Six strict15-to16 reference/output clones only; no runner was executed. Earlier source15 failures are unchanged. Actual artifacts, results and semantic source proofs are separate gates.',
}, null, 2) + '\n', { flag: 'wx' });
console.log('Prepared six strict source16 validation driver references; no execution.');
