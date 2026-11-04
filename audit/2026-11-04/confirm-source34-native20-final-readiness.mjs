import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const wrapper = await bind('audit/2026-11-04/run-source34-native20-dependency-guard.mjs');
assert.equal(wrapper.sha256, 'bed84db0427442bf656ba1afbe6aa117bfc3a95e12ceffb8817eac721cd1dc10');
const original = await bind('audit/2026-11-02/run-final34-native-browser.mjs');
assert.equal(original.sha256, '442adec6c7ffb20b0daf46c414b6d1123c5a8ec3b443ade61c046929513ae3d4');
assert.equal(sha(await readFile('audit/2026-11-04/run-final34-native-browser.mjs.guard-original')), original.sha256);
const freeze = JSON.parse(await readFile('audit/2026-11-04/source34-test-synchronization-freeze.json', 'utf8'));
const files = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(file))])));
assert.equal(files.length, 72);
assert.equal(sha(JSON.stringify(hashes)), '2009333b872995adb0d13fd4de1a1fec09d01b3cf4afbdabbae7a1daa2e98b31');
assert.equal(freeze.dependencySha256, sha(JSON.stringify(hashes)));
const selectedFile = 'audit/2026-11-04/source34-selected-confirmation.json';
const selected = JSON.parse(await readFile(selectedFile, 'utf8'));
assert.equal(selected.status, 'PASS-SCOPED-COMPLETE-SELECTED-FILES');
assert.equal(selected.totals.passed, 200);
assert.equal(selected.dependenciesUnchanged, true);
const receipt = {
  status: 'READY-NOT-RUN-FINAL-STABLE-REVISION', recordedAt: new Date().toISOString(),
  supersedesReadinessSnapshotOnly: 'audit/2026-11-04/source34-native20-readiness-v1.json',
  priorSnapshotPreserved: true, wrapper, original,
  wrapperChangedSinceApprovedV2: false,
  freeze: await bind('audit/2026-11-04/source34-test-synchronization-freeze.json'),
  adoption: await bind(freeze.adoptionFile), selectedConfirmation: await bind(selectedFile),
  dependencyCount: files.length, dependencySha256: sha(JSON.stringify(hashes)), dependencyHashes: hashes,
  source: selected.sourceAfter, build: '332e23584f1e36465df2',
  rootRuntimeGoReceived: true, runtimeStartedByThisPreparation: false,
  ownersRequired: 4, exactCasesPerEngine: 5, expectedCases: 20,
  originalSourceOrTestsEdited: false,
};
await writeFile('audit/2026-11-04/source34-native20-readiness-v2.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, wrapperSha256: wrapper.sha256, dependencySha256: receipt.dependencySha256, originalUnchanged: true }));
