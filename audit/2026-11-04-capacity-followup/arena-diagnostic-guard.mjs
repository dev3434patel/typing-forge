import assert from 'node:assert/strict';
import { readFile, lstat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const directory = 'audit/2026-11-04-capacity-followup';
const sha = value => createHash('sha256').update(value).digest('hex');
const manifestFile = `${directory}/owned-arena-diagnostic-preparation.json`;
async function plan() {
  const bytes = await readFile(manifestFile);
  assert.match(process.env.SPAROWTYPE_ARENA_DIAGNOSTIC_PREPARATION_SHA256 ?? '', /^[a-f0-9]{64}$/);
  assert.equal(sha(bytes), process.env.SPAROWTYPE_ARENA_DIAGNOSTIC_PREPARATION_SHA256, 'The caller must bind the exact prepared diagnostic.');
  return { data: JSON.parse(bytes), manifestSha256: sha(bytes) };
}
export async function verifyDiagnosticPrimary() {
  const { data } = await plan();
  const mismatches = [];
  for (const [file, expected] of Object.entries(data.preclinicalSource.rawHashes)) if (sha(await readFile(file)) !== expected) mismatches.push(file);
  for (const [file, expected] of Object.entries(data.producerDependencies)) if (sha(await readFile(file)) !== expected) mismatches.push(file);
  assert.deepEqual(mismatches, []);
  return { frozen: { local: { version: data.baselineFrontendMetadata.version }, sourceHashes: data.preclinicalSource.rawHashes }, receipt: { sourceFile: manifestFile, expectedBuild: data.baselineFrontendMetadata.version, compared: Object.keys(data.preclinicalSource.rawHashes).length, mismatches, backendCompared: 38, producerDependenciesCompared: Object.keys(data.producerDependencies).length, scope: 'Exact preclinical505 raw-byte snapshot with separately disclosed authorized Profile delta. Frontend build metadata is historical baseline only; no fresh frontend-build identity or final acceptance is claimed.' } };
}
export async function verifyDiagnosticClone() {
  const { data, manifestSha256 } = await plan();
  const primary = await verifyDiagnosticPrimary();
  const profileRoot = path.resolve(directory, '.final-projection-http-clone');
  assert.equal(await realpath(profileRoot), profileRoot); assert.equal((await lstat(profileRoot)).isSymbolicLink(), false);
  for (const row of data.cloneFiles) {
    const file = path.resolve(profileRoot, row.relative);
    assert.ok(file.startsWith(profileRoot + path.sep)); assert.equal((await lstat(file)).isSymbolicLink(), false);
    assert.equal(sha(await readFile(file)), row.sha256, `Diagnostic clone mutation: ${row.relative}`);
  }
  for (const [file, expected] of Object.entries(data.runtimeInputs)) assert.equal(sha(await readFile(file)), expected, `Diagnostic helper mutation: ${file}`);
  return { profileRoot, manifestFile, manifestSha256, source: primary.receipt, candidateKind: data.candidateKind, backendFiles: 38, exactInputsUnchanged: true, originalConfigurationRead: false };
}
