import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

// Preparation does not execute this source-only comparison.
const expectedBuild = process.env.SPAROWTYPE_FINAL18_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen18 identity; never guess it.');
assert.equal(process.argv.length, 2);
const beforeFile = 'audit/2026-10-21/final17-source.json';
const afterFile = 'audit/2026-10-21/final18-source.json';
const output = 'audit/2026-10-21/final18-source-delta.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const beforeBytes = await readFile(beforeFile), afterBytes = await readFile(afterFile);
const before = JSON.parse(beforeBytes), after = JSON.parse(afterBytes);
assert.equal(before.local?.version, '0572d723495d6be303a8');
assert.equal(after.local?.version, expectedBuild);
assert.deepEqual(after.local, after.served);
const oldHashes = before.sourceHashes, newHashes = after.sourceHashes;
assert.equal(Object.keys(oldHashes ?? {}).length, 499);
assert.equal(Object.keys(newHashes ?? {}).length, 499);
const added = Object.keys(newHashes).filter(file => !Object.hasOwn(oldHashes, file)).sort();
const removed = Object.keys(oldHashes).filter(file => !Object.hasOwn(newHashes, file)).sort();
const modified = Object.keys(newHashes).filter(file => Object.hasOwn(oldHashes, file) && oldHashes[file] !== newHashes[file]).sort();
const expectedChangedSourceFiles = ['src/components/layout/PwaStatus.tsx', 'src/pages/Offline.tsx'].sort();
assert.deepEqual(added, []);
assert.deepEqual(removed, []);
assert.deepEqual(modified, expectedChangedSourceFiles);
const current = await verifyFrozenSource(afterFile);
assert.equal(current.receipt.expectedBuild, expectedBuild);
assert.equal(current.receipt.compared, 499);
assert.deepEqual(current.receipt.mismatches, []);
const protectedFiles = Object.keys(newHashes).filter(file => !expectedChangedSourceFiles.includes(file));
assert.equal(protectedFiles.length, 497);
const component = files => ({ compared: files.length, changed: files.filter(file => oldHashes[file] !== newHashes[file]), unchanged: files.every(file => oldHashes[file] === newHashes[file]) });
const report = {
  capturedAt: new Date().toISOString(), status: 'PASS-SCOPED', beforeFile, afterFile, expectedBuild,
  scope: 'Exact17-to18 source identity delta only: two UI external-store subscriptions,499 same source paths/497 unchanged. No typing/3D/performance/runtime or prior-failure acceptance is inferred.',
  expectedChangedSourceFiles,
  before: before.local, after: after.local, beforeSourceFiles: 499, afterSourceFiles: 499,
  addedSourceFiles: added, removedSourceFiles: removed,
  modifiedSourceFiles: modified, changedSourceFiles: modified, unchangedSourceFiles: 497,
  sourceReceiptSha256: { before: hash(beforeBytes), after: hash(afterBytes) },
  currentFrozenSource: current.receipt,
  componentIntegrity: {
    allOther497SourcePaths: component(protectedFiles),
    php: component(protectedFiles.filter(file => file.startsWith('backend/') && file.endsWith('.php'))),
    workerLibraryAndBootstrap: component(protectedFiles.filter(file => ['public/sw.js', 'src/lib/pwa.ts', 'src/main.tsx'].includes(file))),
    typingCore: component(protectedFiles.filter(file => file.startsWith('src/lib/typing-core/'))),
    keyboardCaretAndIntro: component(protectedFiles.filter(file => /(?:keyboard|caret|intro)/i.test(file))),
  },
};
assert.ok(Object.values(report.componentIntegrity).every(item => item.unchanged && item.changed.length === 0));
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, expectedBuild, compared: 499, changed: modified, unchanged: 497 }));
