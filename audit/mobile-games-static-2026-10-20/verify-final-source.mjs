import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory = 'audit/mobile-games-static-2026-10-20';
const frozen = JSON.parse(await readFile(`${directory}/after-4-build.json`, 'utf8'));
const changes = [];
for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
  const bytes = await readFile(file);
  const isText = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest)$/.test(file);
  const actual = createHash('sha256').update(isText ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes).digest('hex');
  if (actual !== expected) changes.push({ file, frozenSha256: expected, currentSha256: actual });
}
assert.deepEqual(changes.map(change => change.file), ['scripts/package-php-hosting.mjs', 'vercel.json', 'vite.config.ts']);
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json());
assert.deepEqual(served, frozen.local);
const receipt = { verifiedAt: new Date().toISOString(), build: served,
  sourceFilesCompared: Object.keys(frozen.sourceHashes).length, changes,
  webRuntimeAndRenderingSourceUnchangedSinceFreeze: true,
  changeScope: 'Packaging-only bounded Windows rename retry, restored Vercel Permissions-Policy response header and development-only private-file denies; tested bundled application/rendering sources are unchanged.',
  excludes: 'Documentation, tests, audit receipts and Git metadata; this is the frozen production-resource file set.' };
await writeFile(`${directory}/final-source-integrity.json`, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
