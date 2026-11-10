import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

export const preparationFile = 'audit/2026-11-11/source37-frontend-performance-preparation.json';
const digest = value => createHash('sha256').update(value).digest('hex');
export const helperFiles = [
  'audit/2026-11-05-followup/run-mobile-workspaces-static-final37.mjs',
  'audit/2026-11-05-followup/measure-mobile-workspaces-static-final37.mjs',
  'audit/2026-11-05-followup/assess-final37-mobile-latency.mjs',
  'audit/2026-11-05-followup/assess-final37-mobile-interaction-latency.mjs',
  'audit/2026-11-05-followup/run-input-final37.mjs',
  'audit/2026-11-05-followup/run-final37-lighthouse.mjs',
  'audit/2026-11-05-followup/source37-frontend-performance-preflight.mjs',
];

async function tree(directory, prefix = '') {
  const hashes = {};
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, 'Artifact symlinks are not accepted.');
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(hashes, await tree(directory, relative));
    else {
      assert.equal(entry.isFile(), true);
      hashes[relative] = digest(await readFile(path.join(directory, relative)));
    }
  }
  return Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)));
}

/** Identity proof only. Resource admission and the single-job schedule remain mandatory. */
export async function source37FrontendPerformanceIdentity() {
  const source = await verifyFrozenSource('audit/2026-11-05-followup/final37-source.json');
  assert.equal(source.receipt.compared, 506);
  assert.deepEqual(source.receipt.mismatches, []);
  assert.equal(source.frozen.local.version, 'd89f84d74519bf2bbae0');
  assert.equal(source.frozen.fullIntroSourceUnchanged, true);
  const proofFile = 'audit/2026-11-10/source37-frontend-artifact-reuse-proof.json';
  const proofBytes = await readFile(proofFile);
  assert.equal(digest(proofBytes), '3caa392db88a7dadf8a10a846667e3a21cd34d41a01bbd8bb26adb8abe595814');
  const proof = JSON.parse(proofBytes);
  assert.equal(proof.unchangedFrontendFiles, 468);
  const dependencyFiles = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
  assert.equal(dependencyFiles.length, 73);
  const dependencies = Object.fromEntries(await Promise.all(dependencyFiles.map(async file => [file, digest(await readFile(file))])));
  const dependencySha256 = digest(JSON.stringify(dependencies));
  assert.equal(dependencySha256, '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');
  const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
  assert.deepEqual(build, source.frozen.local);
  const staticBuild = JSON.parse(await readFile('dist-static-final36-vercel/offline-build.json', 'utf8'));
  assert.equal(staticBuild.version, '3d4bcb5f0a0a855c09f8');
  const helpers = Object.fromEntries(await Promise.all(helperFiles.map(async file => [file, digest(await readFile(file))])));
  return { source: source.receipt, build, staticBuild, reuseProof: { file: proofFile, sha256: digest(proofBytes) }, dependencySha256, helpers, defaultArtifacts: await tree('dist'), staticArtifacts: await tree('dist-static-final36-vercel') };
}

export async function verifyPreparedSource37FrontendPerformance() {
  assert.equal(process.env.SPAROWTYPE_FINAL37_BUILD_ID, 'd89f84d74519bf2bbae0');
  const expected = process.env.SPAROWTYPE_SOURCE37_FRONTEND_PERFORMANCE_PREPARATION_SHA256;
  assert.match(expected ?? '', /^[a-f0-9]{64}$/, 'Bind the complete source37 frontend preparation.');
  const bytes = await readFile(preparationFile);
  assert.equal(digest(bytes), expected);
  const prepared = JSON.parse(bytes);
  const actual = await source37FrontendPerformanceIdentity();
  assert.deepEqual(actual, prepared.identity, 'Source, helpers and artifact bytes must remain unchanged.');
  return actual;
}
