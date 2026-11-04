// Metadata only. Preserve exact v1 helper and receipt; never execute tests.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-02';
const priorFile = `${directory}/source34-final-runtime-harness-preparation.json`;
const activeFile = `${directory}/run-final34-browser-matrix.mjs`;
const archiveFile = `${activeFile}.source-v1`;
const output = `${directory}/source34-final-runtime-harness-preparation-v2.json`;
for (const file of [archiveFile, output]) await assert.rejects(access(file), { code: 'ENOENT' });
const hash = value => createHash('sha256').update(value).digest('hex');
const priorBytes = await readFile(priorFile), prior = JSON.parse(priorBytes);
const before = await readFile(activeFile, 'utf8');
assert.equal(hash(before), prior.files.find(file => file.target === activeFile).targetSha256);
const transforms = [
  { from: "frontendEvidenceReuse: 'NOT-USED'", to: "frontendEvidenceReuse: 'EXPLICIT-SOURCE33-IDENTICAL-FRONTEND-AND-ARTIFACT-PROOF', frontendReuseRequiredProof: 'audit/2026-11-04/source34-frontend-artifact-reuse-proof.json', reusedFrontendEvidenceSource: 'final33', reusedFourWorkspaceMobileTrials: 3, reusedStaticChecks: { artifact: 67, deployment: 56, gameAccessibility: 16 }" },
  { from: 'freshFrontendBuildRequired: true', to: 'freshFrontendBuildRequired: false, retainedFrontendBuildIdentityRequired: true' },
  { from: 'freshOrdinaryInputRunsRequired: 3', to: 'freshOrdinaryInputRunsRequired: 0, reusedSource33OrdinaryInputRuns: 3' },
  { from: 'freshFullQualityMobileLighthouseRunsRequired: 3', to: 'freshFullQualityMobileLighthouseRunsRequired: 0, reusedSource33FullQualityMobileLighthouseRuns: 3' },
];
let after = before;
for (const item of transforms) {
  assert.equal(after.split(item.from).length - 1, 1);
  after = after.replace(item.from, item.to);
}
let reversed = after;
for (const item of [...transforms].reverse()) {
  assert.equal(reversed.split(item.to).length - 1, 1);
  reversed = reversed.replace(item.to, item.from);
}
assert.equal(reversed, before, 'Only the declared descriptive reuse metadata may change.');
assert.equal(after.split('newLearnCasesInExistingSpec: 8').length - 1, 1);
await writeFile(archiveFile, before, { flag: 'wx' });
await writeFile(activeFile, after);
const syntax = [import.meta.filename, activeFile].map(file => {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
});
assert.ok(syntax.every(row => row.exitCode === 0));
const unchangedOtherHelpers = await Promise.all(prior.files.filter(file => file.target !== activeFile).map(async file => {
  const actual = hash(await readFile(file.target)); assert.equal(actual, file.targetSha256);
  return { file: file.target, sha256: actual, unchanged: true };
}));
assert.equal(hash(await readFile(priorFile)), hash(priorBytes));
await writeFile(output, `${JSON.stringify({
  status: 'PREPARED-NOT-RUN', version: 2, recordedAt: new Date().toISOString(),
  authorization: 'Root approved source33 frontend/static/mobile/home/Lighthouse evidence reuse only after complete source and artifact identity proof; fresh source34 full matrix/native/CI remain required.',
  preservedReceipt: { file: priorFile, sha256: hash(priorBytes), unchanged: true },
  preservedVersion1Helper: { file: archiveFile, sha256: hash(before), byteExact: true },
  activeMatrix: { file: activeFile, beforeSha256: hash(before), afterSha256: hash(after) },
  transforms, exactMetadataReversalVerified: true, newLearnCasesComparedWithSource27: 8,
  requiredReuseProof: 'audit/2026-11-04/source34-frontend-artifact-reuse-proof.json',
  reuseProofAlreadyClaimedExecutedByThisPreparation: false,
  unchangedOtherHelpers, syntax,
  operationalAssertionsChanged: false, thresholdsChanged: false, specFilesFiltered: false,
  inputActionsChanged: false, timeoutsChanged: false, workerOrRetryPolicyChanged: false,
  source34FullMatrixStillRequired: true, source34Native20StillRequired: true, source34CiStillRequired: true,
  backendOrCapacityEvidenceReused: false, primarySourceOrTestsEdited: false,
  runtimeJobsStarted: 0, servicesStarted: 0, browsersStarted: 0,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, metadataTransforms: transforms.length, exactReversal: true,
  otherHelpersUnchanged: unchangedOtherHelpers.length, syntaxChecks: syntax.length, runtimeJobsStarted: 0 }));
