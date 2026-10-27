import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const phase = process.argv[2];
assert.match(phase ?? '', /^after-[1-9][0-9]*$/);
const baseline = 'dcf4580cd58c7c811422fbbd956ae827c54f048e';
const normalize = value => value.replace(/\r\n/g, '\n');
const digest = value => createHash('sha256').update(typeof value === 'string' ? normalize(value) : value).digest('hex');
const tracked = execFileSync('git', ['ls-files', 'src', 'public', 'build', 'scripts', 'backend/src', 'backend/resources', 'package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json'], { encoding: 'utf8' }).trim().split('\n');
const added = execFileSync('git', ['ls-files', '--others', '--exclude-standard', 'src', 'public', 'build', 'scripts', 'backend/src'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const files = [...new Set([...tracked, ...added])].sort();
const hashes = {};
const brand = [];
for (const file of files) {
  const source = await readFile(file);
  const text = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest)$/.test(file);
  hashes[file] = digest(text ? source.toString('utf8') : source);
  if (file.startsWith('src/components/brand/') && !file.includes('.test.')) {
    const original = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' });
    brand.push({ file, unchanged: digest(original) === hashes[file] });
  }
}
const local = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json());
assert.deepEqual(local, served);
const record = { capturedAt: new Date().toISOString(), baseline, local, served,
  brandSourceUnchanged: brand.every(file => file.unchanged), brand, sourceHashes: hashes };
await writeFile(`audit/mobile-games-static-2026-10-20/${phase}-build.json`, JSON.stringify(record, null, 2));
console.log(JSON.stringify({ build: local.version, brandSourceUnchanged: record.brandSourceUnchanged, files: files.length }));
