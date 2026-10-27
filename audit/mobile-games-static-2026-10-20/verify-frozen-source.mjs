import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const phase = process.argv[2];
assert.match(phase ?? '', /^after-[1-9][0-9]*$/);
const directory = 'audit/mobile-games-static-2026-10-20';
const output = `${directory}/${phase}-frozen-source-verification.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const frozen = JSON.parse(await readFile(`${directory}/${phase}-build.json`, 'utf8'));
const scope = ['src', 'public', 'build', 'scripts', 'backend/src', 'backend/resources', 'package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json'];
const tracked = execFileSync('git', ['ls-files', ...scope], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', ...scope], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const files = [...new Set([...tracked, ...added])].sort();
assert.deepEqual(files, Object.keys(frozen.sourceHashes).sort(), 'Frozen source-file set must remain unchanged.');
for (const file of files) {
  const source = await readFile(file);
  const text = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest)$/.test(file);
  const actual = createHash('sha256').update(text ? source.toString('utf8').replace(/\r\n/g, '\n') : source).digest('hex');
  assert.equal(actual, frozen.sourceHashes[file], file);
}
const local = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json());
assert.deepEqual(local, frozen.local);
assert.deepEqual(served, frozen.local);
const receipt = { verifiedAt: new Date().toISOString(), phase, build: local, sourceFilesCompared: files.length,
  fileSetUnchanged: true, allSourceHashesUnchanged: true, servedBuildMatches: true, status: 'PASS',
  scope: 'Frozen production resources and source set, normalized for line endings; documentation, browser specifications, audit receipts and Git metadata are outside this set.' };
await writeFile(output, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
