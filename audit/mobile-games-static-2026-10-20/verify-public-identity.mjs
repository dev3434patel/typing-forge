import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const directory = 'audit/mobile-games-static-2026-10-20';
const phase = process.argv[3] ?? 'after-4';
assert.match(phase, /^after-[1-9][0-9]*$/);
const snapshot = phase === 'after-4' ? `${directory}/before-config-build-public-sha256.json` : `${directory}/before-${phase}-hygiene-public-sha256.json`;
async function walk(base, relative = '') {
  const hashes = {};
  for (const entry of (await readdir(path.join(base, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.posix.join(relative, entry.name);
    assert.equal(entry.isSymbolicLink(), false);
    if (entry.isDirectory()) Object.assign(hashes, await walk(base, name));
    else hashes[name] = createHash('sha256').update(await readFile(path.join(base, name))).digest('hex');
  }
  return hashes;
}
const mode = process.argv[2];
assert.ok(['capture', 'verify'].includes(mode));
const hashes = await walk('dist');
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const frozen = JSON.parse(await readFile(`${directory}/${phase}-build.json`, 'utf8')).local;
assert.deepEqual(build, frozen);
if (mode === 'capture') {
  await assert.rejects(access(snapshot), { code: 'ENOENT' });
  await writeFile(snapshot, JSON.stringify({ capturedAt: new Date().toISOString(), build, hashes }, null, 2));
  console.log(JSON.stringify({ mode, build, files: Object.keys(hashes).length }));
} else {
  const before = JSON.parse(await readFile(snapshot, 'utf8'));
  assert.deepEqual(hashes, before.hashes, 'Every public byte must remain identical after the recorded source hygiene change.');
  const receipt = { verifiedAt: new Date().toISOString(), build, filesCompared: Object.keys(hashes).length,
    allPublicFilesByteIdentical: true, status: 'PASS',
    scope: phase === 'after-4' ? 'Real default production rebuild after Vercel response-header and development-filesystem configuration repairs; complete public tree compared with the browser-tested after4 artifact.' : 'Real default production rebuild after removing one terminal blank line from workspace-loader.ts; complete public tree compared byte-for-byte with the tested frozen artifact. No source behavior or generated public asset change is permitted.' };
  await writeFile(`${directory}/${phase === 'after-4' ? 'final' : phase}-public-byte-identity.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
}
