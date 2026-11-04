import assert from 'node:assert/strict';
import path from 'node:path';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-11-02';
const sha = value => createHash('sha256').update(value).digest('hex');
export async function verifySource31BackendOnly(sourceFile = `${directory}/final31-source.json`) {
  assert.equal(sourceFile, `${directory}/final31-source.json`);
  const frozen = JSON.parse(await readFile(sourceFile));
  assert.equal(frozen.local.version, 'f52d0372fe7656817259');
  const backend = Object.keys(frozen.sourceHashes).filter(file => file.startsWith('backend/')).sort();
  const fixture = Object.keys(frozen.sourceHashes).filter(file => file.startsWith('src/lib/typing-core/') || ['src/domain/arena.ts', 'src/services/arena-service.ts'].includes(file)).sort();
  assert.equal(backend.length, 38);
  const mismatches = [];
  for (const file of [...backend, ...fixture]) if (normalizedSourceHash(file, await readFile(file)) !== frozen.sourceHashes[file]) mismatches.push(file);
  assert.deepEqual(mismatches, []);
  return { frozen, receipt: { sourceFile, expectedBuild: frozen.local.version, compared: backend.length, fixtureDependenciesCompared: fixture.length, mismatches, scope: 'Source31 backend38 and HTTP fixture core/wire only. Frontend UI may advance; no whole505-file/current-frontend identity or acceptance claim.' } };
}
export async function verifySource31SqlProfileClone() {
  const primary = await verifySource31BackendOnly();
  assert.equal(primary.receipt.compared, 38);
  assert.equal(primary.receipt.expectedBuild, 'f52d0372fe7656817259');
  assert.deepEqual(primary.receipt.mismatches, []);
  const manifestFile = `${directory}/source31-sql-profile-preparation.json`;
  const manifestBytes = await readFile(manifestFile);
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.status, 'PREPARED-NOT-RUN');
  assert.equal(manifest.backend.length, 38);
  assert.deepEqual(manifest.backend.filter(row => row.instrumented).map(row => row.file).sort(), ['backend/public/index.php', 'backend/src/ArenaEvidence.php', 'backend/src/Database.php']);
  const expectedRoot = path.resolve(directory, '.final31-sql-profile');
  assert.equal(await realpath(expectedRoot), expectedRoot);
  assert.equal((await lstat(expectedRoot)).isSymbolicLink(), false);
  for (const row of [...manifest.backend, ...manifest.extraFiles]) {
    const sourcePath = path.resolve(expectedRoot, row.file);
    assert.ok(sourcePath.startsWith(expectedRoot + path.sep));
    assert.equal((await lstat(sourcePath)).isSymbolicLink(), false);
    const actual = await readFile(sourcePath);
    assert.equal(sha(actual), row.profileSha256, row.file);
    if (row.originalSha256) {
      const original = await readFile(row.file);
      assert.equal(sha(original), row.originalSha256, `Primary file changed: ${row.file}`);
      let reversed = actual.toString('utf8');
      for (const replacement of [...row.replacements].reverse()) reversed = reversed.replaceAll(replacement.after, replacement.before);
      assert.equal(sha(Buffer.from(reversed)), row.originalSha256, `Clone instrumentation reversal: ${row.file}`);
    }
  }
  for (const row of manifest.runtimeFiles) assert.equal(sha(await readFile(row.file)), row.sha256, row.file);
  return { profileRoot: expectedRoot, manifestFile, manifestSha256: sha(manifestBytes), backendFiles: 38, changedCloneFiles: 3, source: primary.receipt, originalConfigRead: false, cloneAndPrimaryHashesMatchPreparation: true };
}
