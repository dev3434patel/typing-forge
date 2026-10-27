import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const phase = process.argv[2];
if (!['start', 'end'].includes(phase)) throw new Error('Choose start or end.');
const revision = process.argv[3] || 'after4';
if (!/^after[1-9][0-9]*$/.test(revision)) throw new Error('Choose an explicit afterN revision.');
async function files(root, prefix = '') {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? entry.name === '__tests__' ? [] : files(root, path.join(prefix, entry.name)) : /\.(?:tsx?|css|json|mjs|mts)$/.test(entry.name) ? path.join(root, prefix, entry.name).replaceAll('\\', '/') : []));
  return groups.flat();
}
const selected = [...await files('src'), ...await files('build'), 'vite.config.ts', 'public/sw.js', 'public/fonts/fonts.css', 'index.html', 'package.json', 'backend/resources/typing-course-v1.json', 'scripts/build-frontend.mjs', 'scripts/build-offline.mjs'].sort();
const hashes = {};
for (const file of selected) hashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
const previous = phase === 'end' ? JSON.parse(await readFile(`audit/mobile-games-static-2026-10-20/static-${revision}-source-start.json`, 'utf8')) : null;
const changes = previous ? [...new Set([...Object.keys(previous.hashes), ...Object.keys(hashes)])].filter(file => hashes[file] !== previous.hashes[file]) : [];
const report = { recordedAt: new Date().toISOString(), revision, phase, scope: 'Production source/config and public course catalog only; no private backend config, DB/storage or application data is read.', note: phase === 'start' ? 'Captured after root declared the source frozen, before isolated static builds.' : 'Compared after serial static acceptance.', files: selected.length, unchanged: previous ? changes.length === 0 : null, changes, hashes };
await writeFile(`audit/mobile-games-static-2026-10-20/static-${revision}-source-${phase}.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ phase, files: selected.length, unchanged: report.unchanged, changedFiles: changes.length }));
if (changes.length) process.exitCode = 1;
