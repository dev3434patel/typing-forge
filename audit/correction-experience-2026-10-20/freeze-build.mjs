import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const directory = 'audit/correction-experience-2026-10-20';
const local = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json());
assert.deepEqual(served, local);
const baseline = '497ae1155186afac74ff4622d853042cd9b2a8a1';
const brandFiles = execFileSync('git', ['ls-files', 'src/components/brand'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(file => !file.includes('.test.'));
const sha256 = value => createHash('sha256').update(value.replaceAll('\r\n', '\n')).digest('hex');
const brandSource = {};
for (const file of brandFiles) {
  const actual = sha256(await readFile(file, 'utf8'));
  const previous = sha256(execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' }));
  assert.equal(actual, previous, `Intro source changed: ${file}`);
  brandSource[file] = actual;
}
await writeFile(`${directory}/source-build.json`, JSON.stringify({ capturedAt: new Date().toISOString(), baseline, local, served, introSourceUnchanged: true, brandSource }, null, 2));
console.log(JSON.stringify({ local, served, unchangedIntroFiles: brandFiles.length }));
