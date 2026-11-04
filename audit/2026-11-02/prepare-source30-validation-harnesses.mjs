// PREPARATION ONLY: preserve28 evidence and invalidated29 manifest unchanged.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const pairs = [
  ['measure-mobile-workspaces-static-final28.mjs', 'measure-mobile-workspaces-static-final30.mjs'],
  ['run-mobile-workspaces-static-final28-candidate.mjs', 'run-mobile-workspaces-static-final30-candidate.mjs'],
  ['run-mobile-workspaces-static-final28.mjs', 'run-mobile-workspaces-static-final30.mjs'],
  ['assess-final28-mobile-latency.mjs', 'assess-final30-mobile-latency.mjs'],
  ['run-final28-static.mjs', 'run-final30-static.mjs'],
  ['run-browser-checkpoint-final28.mjs', 'run-browser-checkpoint-final30.mjs'],
  ['run-final28-browser-matrix.mjs', 'run-final30-browser-matrix.mjs'],
  ['run-final28-ci-extra.mjs', 'run-final30-ci-extra.mjs'],
  ['pack-backend-instance-source28.mjs', 'pack-backend-instance-source30.mjs'],
  ['pack-native-browser-final28.mjs', 'pack-native-browser-final30.mjs'],
  ['run-final28-native-browser.mjs', 'run-final30-native-browser.mjs'],
];
const replacements = [['FINAL28', 'FINAL30'], ['final28', 'final30'], ['Source28', 'Source30'], ['source28', 'source30']];
const hash = value => createHash('sha256').update(value).digest('hex');
const proof = `${directory}/source30-validation-harness-preparation.json`;
await assert.rejects(access(proof), { code: 'ENOENT' });
const rows = [];
for (const [oldName, newName] of pairs) {
  const originalFile = `${directory}/${oldName}`, targetFile = `${directory}/${newName}`;
  await assert.rejects(access(targetFile), { code: 'ENOENT' });
  const original = await readFile(originalFile, 'utf8');
  let candidate = original;
  const counts = [];
  for (const [from, to] of replacements) {
    const count = candidate.split(from).length - 1; counts.push({ from, to, count }); candidate = candidate.replaceAll(from, to);
  }
  assert.ok(counts.some(item => item.count > 0));
  let reverted = candidate;
  for (const { from, to, count } of [...counts].reverse()) {
    assert.equal(reverted.split(to).length - 1, count); reverted = reverted.replaceAll(to, from);
  }
  assert.equal(reverted, original, 'Only28-to30 build/window/output identifiers may differ.');
  rows.push({ originalFile, targetFile, original, candidate, counts });
}
const originalDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';
let driverExpected = await readFile(originalDriver, 'utf8');
const driverReferences = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-11-02';"],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final30-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final30-static-protocol.json`'],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final30-static-build.json`'],
];
for (const [from, to] of driverReferences) { assert.equal(driverExpected.split(from).length - 1, 1); driverExpected = driverExpected.replace(from, to); }
assert.equal(driverExpected, rows.find(row => row.targetFile.endsWith('/measure-mobile-workspaces-static-final30.mjs')).candidate);
const assertionInputs = ['e2e/live-keyboard.spec.ts', 'e2e/typing-render-budget.spec.ts'];
const assertionHashes = Object.fromEntries(await Promise.all(assertionInputs.map(async file => [file, hash(await readFile(file))])));
const liveKeyboard = await readFile(assertionInputs[0], 'utf8');
const renderBudget = await readFile(assertionInputs[1], 'utf8');
assert.ok(liveKeyboard.includes('55'), 'Keep the adopted55ms motion contract.');
assert.ok(renderBudget.includes('55'), 'Keep the adopted55ms render-budget contract.');
for (const row of rows) await writeFile(row.targetFile, row.candidate, { flag: 'wx' });
await writeFile(proof, `${JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  reason: 'Source29 freeze was invalidated by a concurrent backend edit before any acceptance measurements. Root will bind the stable backend and unchanged29 frontend through a fresh source30 manifest.',
  invalidated29ReportsOrManifestModified: false, source29MeasurementRunByThisAgent: false,
  original28ReportsOrHelpersModified: false, requiredSourceHashes: 505,
  requiredManifest: `${directory}/final30-source.json`,
  sourceBuildEnv: 'SPAROWTYPE_FINAL30_BUILD_ID', staticBuildEnv: 'SPAROWTYPE_FINAL30_STATIC_BUILD_ID',
  candidateDirectory: 'dist-static-final30-candidate-vercel', actualBuildMustBeExplicit: true,
  files: rows.map(row => ({ original: row.originalFile, target: row.targetFile,
    originalSha256: hash(row.original), targetSha256: hash(row.candidate), substitutions: row.counts, exactReversalVerified: true })),
  mobileDriverOriginal: originalDriver, mobileDriverOriginalSha256: hash(await readFile(originalDriver)),
  mobileDriverOnlyDirectoryAndDefaultReferencesChanged: true, mobileDriverReferences: driverReferences,
  mobileNativeActionsTimingAndAllAssertionsUnchanged: true,
  keyboardMotionAssertionsPreserved: { contractMs: 55, files: assertionHashes, filesEdited: false },
  fullMatrix: { expectedSpecFiles: 64, everySpecExactlyOnce: 'CHECKED-AGAIN-BY-RUNNER', engines: ['chromium','edge','firefox','webkit'], workers: 1, retries: 0 },
  native: { distinctFreshBackends: 4, sequential: true, exactTitlesPerEngine: 5, expectedCases: 20, ratePolicyChanged: false },
  sourceGatesInputLighthouse: 'Root-owned generic Nov2 wrappers already accept a source30 prefix; no copies or edits here.',
  servicesStarted: 0, browserOrAcceptanceTestsRun: 0, buildsRun: 0, productFilesEdited: false,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ proof, status: 'PREPARED-NOT-RUN', preparedFiles: rows.length, originalMobileDriverReversal: true, servicesStarted: 0, testsRun: 0 }));
