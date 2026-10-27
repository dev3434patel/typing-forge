import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL13_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/);
const beforeFile = 'audit/2026-10-21/final12-source.json';
const afterFile = 'audit/2026-10-21/final13-source.json';
const output = 'audit/2026-10-21/final13-source-delta.json';
const expectedChanges = [
  'src/components/keybr/KeybrLessonMode.tsx',
  'src/lib/learning-caret-geometry.ts',
  'src/lib/__tests__/learning-caret-geometry.test.ts',
  'src/components/typing/OpponentPaceMarker.tsx',
  'src/components/typing/TypingArea.tsx',
  'src/components/typing/opponent-caret-layout.ts',
  'src/components/typing/opponent-caret-layout.test.ts',
  'src/pages/Race.tsx',
].sort();
const handle = await open(output, 'wx');
const report = { capturedAt: new Date().toISOString(), status: 'FAILED', beforeFile, afterFile, expectedBuild,
  scope: 'Exact normalized source12-to13 delta for Learn measured forward boxes/stable passage props and safe opponent point reuse/immutable Race denominator. Timing, metrics, backend, worker and 3D sources must remain unchanged. Browser and latency acceptance remain separate.',
  expectedChangedSourceFiles: expectedChanges,
};
try {
  const oldBytes = await readFile(beforeFile), newBytes = await readFile(afterFile);
  const old = JSON.parse(oldBytes), next = JSON.parse(newBytes);
  assert.equal(old.local.version, '2bf79b95e1ee5d93426e');
  assert.equal(next.local.version, expectedBuild);
  assert.deepEqual(next.local, next.served);
  const current = await verifyFrozenSource(afterFile);
  assert.deepEqual(current.receipt.mismatches, []);
  const names = [...new Set([...Object.keys(old.sourceHashes), ...Object.keys(next.sourceHashes)])].sort();
  const added = names.filter(file => !Object.hasOwn(old.sourceHashes, file));
  const removed = names.filter(file => !Object.hasOwn(next.sourceHashes, file));
  const modified = names.filter(file => Object.hasOwn(old.sourceHashes, file) && Object.hasOwn(next.sourceHashes, file) && old.sourceHashes[file] !== next.sourceHashes[file]);
  const changed = [...added, ...removed, ...modified].sort();
  const groups = {
    php: file => file.startsWith('backend/'),
    canonicalEngine: file => file.startsWith('src/lib/typing-core/'),
    renderer: file => file.startsWith('src/components/brand/'),
    serviceWorker: file => file === 'public/sw.js' || file === 'src/lib/__tests__/pwa-worker.test.ts',
    sharedCaretCache: file => file.startsWith('src/components/typing/typing-caret-cache'),
  };
  Object.assign(report, { before: old.local, after: next.local, beforeSourceFiles: Object.keys(old.sourceHashes).length,
    afterSourceFiles: Object.keys(next.sourceHashes).length, addedSourceFiles: added, removedSourceFiles: removed,
    modifiedSourceFiles: modified, changedSourceFiles: changed, unchangedSourceFiles: names.length - changed.length,
    sourceReceiptSha256: { before: hash(oldBytes), after: hash(newBytes) }, currentFrozenSource: current.receipt,
    componentIntegrity: Object.fromEntries(Object.entries(groups).map(([name, match]) => [name, {
      compared: names.filter(match).length, changed: changed.filter(match), unchanged: !changed.some(match),
    }])),
  });
  assert.equal(Object.keys(old.sourceHashes).length, 494);
  assert.equal(Object.keys(next.sourceHashes).length, 496);
  assert.deepEqual(added, ['src/components/typing/opponent-caret-layout.test.ts', 'src/components/typing/opponent-caret-layout.ts']);
  assert.deepEqual(removed, []);
  assert.deepEqual(changed, expectedChanges);
  for (const [name, result] of Object.entries(report.componentIntegrity)) assert.equal(result.unchanged, true, name);
  report.status = 'PASS-SCOPED';
} catch (error) { report.error = { name: error.name, message: error.message }; }
finally { await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close(); }
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
