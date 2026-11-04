// Preparation only. Source30 failures and source29 invalidation stay unchanged.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const previousPrep = `${directory}/source30-validation-harness-preparation.json`;
const previous = JSON.parse(await readFile(previousPrep, 'utf8'));
const output = `${directory}/source31-validation-harness-preparation.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const substitutions = [['FINAL30', 'FINAL31'], ['final30', 'final31'], ['Source30', 'Source31'], ['source30', 'source31']];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [];
for (const item of previous.files) {
  const original = item.target, target = original.replaceAll('final30', 'final31').replaceAll('source30', 'source31');
  assert.notEqual(original, target); await assert.rejects(access(target), { code: 'ENOENT' });
  const before = await readFile(original, 'utf8');
  assert.equal(hash(before), item.targetSha256, 'Preserved source30 helper bytes must remain unchanged.');
  let after = before;
  const counts = substitutions.map(([from, to]) => {
    const count = after.split(from).length - 1; after = after.replaceAll(from, to); return { from, to, count };
  });
  let reversed = after;
  for (const change of [...counts].reverse()) {
    assert.equal(reversed.split(change.to).length - 1, change.count); reversed = reversed.replaceAll(change.to, change.from);
  }
  assert.equal(reversed, before);
  files.push({ original, target, before, after, substitutions: counts });
}
const originalMobileDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';
const originalDriver = await readFile(originalMobileDriver, 'utf8');
let expectedDriver = originalDriver;
const mobileReferences = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-11-02';"],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final31-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final31-static-protocol.json`'],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final31-static-build.json`'],
];
for (const [from, to] of mobileReferences) { assert.equal(expectedDriver.split(from).length - 1, 1); expectedDriver = expectedDriver.replace(from, to); }
assert.equal(files.find(file => file.target.endsWith('/measure-mobile-workspaces-static-final31.mjs')).after, expectedDriver);
const assertionHashes = {};
for (const [file, expected] of Object.entries(previous.keyboardMotionAssertionsPreserved.files)) {
  const bytes = await readFile(file); assert.equal(hash(bytes), expected); assertionHashes[file] = expected;
}
for (const file of files) await writeFile(file.target, file.after, { flag: 'wx' });
await writeFile(output, `${JSON.stringify({ preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  previousPreparation: { file: previousPrep, sha256: hash(await readFile(previousPrep)) },
  files: files.map(file => ({ original: file.original, target: file.target, originalSha256: hash(file.before), targetSha256: hash(file.after), substitutions: file.substitutions, exactReversalVerified: true })),
  mobileDriver: { original: originalMobileDriver, originalSha256: hash(originalDriver), onlyAuditDirectoryAndDefaultReferencesChanged: true, references: mobileReferences, nativeActionsTimingAndAllAssertionsUnchanged: true },
  keyboardMotionContractMs: 55, keyboardAssertionsUnchanged: assertionHashes,
  requiredManifest: `${directory}/final31-source.json`, requiredSourceHashes: 505,
  sourceBuildFlag: 'SPAROWTYPE_FINAL31_BUILD_ID', staticBuildFlag: 'SPAROWTYPE_FINAL31_STATIC_BUILD_ID',
  candidateDirectory: 'dist-static-final31-candidate-vercel', actualBuildMustBeBoundAfterStableFreeze: true,
  source30FailedLearn112Bot80ReportPreserved: true, source29InvalidationPreserved: true,
  native: { freshOwnedBackends: 4, sequential: true, exactCasesPerEngine: 5, expectedTotal: 20, unchangedRatePolicy: true },
  sourceGatesInputLighthouseRemainRootOwned: true,
  servicesStarted: 0, browserOrAcceptanceTestsRun: 0, buildsRun: 0, productFilesEdited: false,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: 'PREPARED-NOT-RUN', files: files.length, exactMobileDriverReversal: true, testsRun: 0, servicesStarted: 0 }));
