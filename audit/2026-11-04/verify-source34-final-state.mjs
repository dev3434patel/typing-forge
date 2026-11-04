import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const proofFile = 'audit/2026-11-04/source34-frontend-artifact-reuse-proof.json';
const proof = JSON.parse(await readFile(proofFile, 'utf8'));
const source = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(source.receipt.compared, 505);
assert.deepEqual(source.receipt.mismatches, []);
assert.equal(source.frozen.local.version, '332e23584f1e36465df2');
const names = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
const hashes = Object.fromEntries(await Promise.all(names.map(async file => [file, sha(await readFile(file))])));
assert.equal(names.length, 72);
assert.equal(sha(JSON.stringify(hashes)), '2009333b872995adb0d13fd4de1a1fec09d01b3cf4afbdabbae7a1daa2e98b31');
const brand = await Promise.all(proof.brand.map(async previous => {
  const bytes = await readFile(previous.file);
  const raw = sha(bytes);
  const normalized = sha(bytes.toString('utf8').replaceAll('\r\n', '\n'));
  assert.equal(raw, previous.currentRawSha256);
  assert.equal(normalized, previous.baselineNormalizedSha256);
  return { file: previous.file, currentRawSha256: raw, currentNormalizedSha256: normalized, baselineNormalizedIdentical: true, baselineRawIdentical: raw === previous.baselineRawSha256 };
}));
assert.equal(brand.length, 21);
assert.equal(brand.filter(row => row.baselineRawIdentical).length, 20);
const artifacts = [];
for (const prior of proof.emittedArtifactProofs) {
  let matched = 0;
  for (const [file, expected] of Object.entries(prior.currentAllFileSha256)) {
    assert.equal(sha(await readFile(`${prior.directory}/${file}`)), expected, `${prior.directory}/${file}`);
    matched++;
  }
  assert.equal(prior.originalQualityChecksPassed, 5);
  artifacts.push({ directory: prior.directory, artifactFileHashesMatched: matched, everyPreviouslyObservedFileUnchanged: true, preservedOriginalSceneChecks: prior.originalQualityChecksPassed, qualification: 'Current byte identity only; original five emitted quality checks are retained through unchanged artifacts, not relabeled as a new render/performance execution.' });
}
const nativeFile = 'audit/2026-11-02/final34-native-browser.json';
const native = JSON.parse(await readFile(nativeFile, 'utf8'));
assert.equal(native.status, 'PASS-SCOPED-NATIVE-BROWSER');
assert.equal(native.totals.passed, 20);
assert.equal(native.exactTwentyCasesVerified, true);
assert.ok(native.engineRuns.every(row => row.gracefulCleanupVerified === true));
const guard = JSON.parse(await readFile('audit/2026-11-04/source34-native20-dependency-guard.json', 'utf8'));
assert.equal(guard.status, 'PASS-SCOPED');
assert.equal(guard.dependenciesUnchanged, true);
const receiptFiles = [proofFile, 'audit/2026-11-04/source34-test-synchronization-freeze.json', 'audit/2026-11-04/source34-source-gates-reconciled.json', 'audit/2026-11-04/source34-browser-matrix-reconciliation.json', 'audit/2026-11-04/source34-selected-confirmation.json', nativeFile, 'audit/2026-11-04/source34-native20-dependency-guard.json', 'audit/2026-11-02/final34-ci-extra.json'];
const receipt = {
  status: 'PASS-SCOPED-FINAL-CURRENT-IDENTITY', recordedAt: new Date().toISOString(),
  source: source.receipt, build: source.frozen.local.version,
  dependencyCount: names.length, dependencySha256: sha(JSON.stringify(hashes)), dependencyHashes: hashes,
  brandSources: brand, normalizedBrandMatches: 21, rawBrandMatches: 20, onlyCrLfDifference: 'src/components/brand/OpeningExperience.tsx',
  artifacts, evidence: await Promise.all(receiptFiles.map(bind)),
  nativeOwnersAllGracefullyClosed: true,
  testsExecuted: false, browsersOrServicesStarted: false, productOrTestsEdited: false,
  gitCommitOrPushOrRemoteEqualityClaimed: false,
};
await writeFile('audit/2026-11-04/source34-final-state-identity.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, sourceFiles: source.receipt.compared, dependencies: names.length, normalizedBrandMatches: 21, rawBrandMatches: 20, artifactHashCounts: artifacts.map(row => row.artifactFileHashesMatched) }));
