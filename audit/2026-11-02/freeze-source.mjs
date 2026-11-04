import { readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const prefix = process.argv[2]; assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
const output = `audit/2026-11-02/${prefix}-source.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const paths = ['src', 'public', 'build', 'scripts', 'backend/src', 'backend/resources', 'backend/migrations', 'backend/bin', 'backend/public', 'backend/bootstrap.php', 'backend/router.php', 'backend/schema.sql', 'package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json'];
const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...paths], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const hashes = {};
for (const file of [...new Set(listed)].sort()) { const bytes = await readFile(file); hashes[file] = hash(/\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes); }
const baseline = '275c8c24d65054abae18713c1eee4dad18888332';
const intro = Object.keys(hashes).filter(file => file.startsWith('src/components/brand/') && !/test/.test(file));
const introQuality = intro.map(file => { const original = execFileSync('git', ['show', `${baseline}:${file}`]); return { file, unchanged: hash(original.toString('utf8').replaceAll('\r\n', '\n')) === hashes[file] }; });
const local = JSON.parse(await readFile('dist/offline-build.json', 'utf8')), served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()); assert.deepEqual(served, local);
const receipt = { capturedAt: new Date().toISOString(), baseline, local, served, sourceHashes: hashes, introQuality, fullIntroSourceUnchanged: introQuality.every(row => row.unchanged) };
await writeFile(output, JSON.stringify(receipt, null, 2)); console.log(JSON.stringify({ output, build: local.version, sourceFiles: Object.keys(hashes).length, fullIntroSourceUnchanged: receipt.fullIntroSourceUnchanged }));
