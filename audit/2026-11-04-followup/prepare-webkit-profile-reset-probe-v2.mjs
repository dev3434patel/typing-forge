import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const previousFile = 'audit/2026-11-04-followup/webkit-profile-reset-probe-preparation.json';
const previous = JSON.parse(await readFile(previousFile, 'utf8'));
const inputs = Object.keys(previous.inputHashes);
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const changed = inputs.filter(file => inputHashes[file] !== previous.inputHashes[file]);
assert.deepEqual(changed.sort(), ['audit/2026-11-04-followup/run-webkit-profile-reset-probe.mjs', 'audit/2026-11-04-followup/webkit-reset-probe/profile-reset.spec.ts'].sort());
for (const [file, expected] of Object.entries(previous.productionHashes)) assert.equal(hash(await readFile(file)), expected);
for (const [file, expected] of Object.entries(previous.brandHashes)) assert.equal(hash(await readFile(file)), expected);
const plan = {
  ...previous, recordedAt: new Date().toISOString(), inputHashes,
  previousPreparation: { file: previousFile, sha256: hash(await readFile(previousFile)), status: 'PREPARED-NOT-RUN', runtimeAttempts: 0 },
  correction: 'Read-only import graph review found workspace-extras is a static account-data dependency. V2 instead holds the dynamically requested classroom local-adapter after Profile is fully mounted/filled and first asserts that exact module has never loaded. This isolates pending clearWorkspaceExtras without preventing app startup.',
  gateAsset: 'dist/assets/local-adapter-D7X_Egle.js',
  gateAssetSha256: hash(await readFile('dist/assets/local-adapter-D7X_Egle.js')),
  exactChangedAuditFiles: changed.map(file => ({ file, beforeSha256: previous.inputHashes[file], afterSha256: inputHashes[file], preservedV1: `${file}.source-v1` })),
  noProductFailureInferredFromV1Preparation: true,
};
await writeFile('audit/2026-11-04-followup/webkit-profile-reset-probe-preparation-v2.json', JSON.stringify(plan, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: plan.status, expectedCases: plan.expectedCases, changedAuditFiles: changed.length, productionFilesChanged: 0, attempts: 0 }));
