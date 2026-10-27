import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL14_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/);
const beforeFile = 'audit/2026-10-21/final13-source.json';
const afterFile = 'audit/2026-10-21/final14-source.json';
const output = 'audit/2026-10-21/final14-source-delta.json';
const expectedChanges = [
  'src/main.tsx', 'src/lib/pwa.ts', 'public/sw.js',
  'src/lib/__tests__/pwa-lifecycle.test.ts', 'src/lib/__tests__/pwa-worker.test.ts',
  'src/components/typing/LiveKeyboard.tsx', 'src/components/typing/LiveKeyboard.test.tsx',
  'src/components/typing/ObservedLiveKeyboard.tsx', 'src/hooks/useLiveKeyboard.ts',
  'src/lib/pressed-key-store.ts', 'src/lib/__tests__/pressed-key-store.test.ts',
].sort();
const handle = await open(output, 'wx');
const report = { capturedAt: new Date().toISOString(), status: 'FAILED', beforeFile, afterFile, expectedBuild,
  scope: 'Exact normalized source13-to14 delta for early PWA document ownership/read-only worker readiness and per-key held-key subscriptions. Root/page teardown owns the current generation. Scoring, timing, backend, CSS, caret geometry and 3D sources must remain unchanged; actual browser/latency/Lighthouse checks remain separate.',
  expectedChangedSourceFiles: expectedChanges,
};
try {
  const oldBytes = await readFile(beforeFile), newBytes = await readFile(afterFile);
  const old = JSON.parse(oldBytes), next = JSON.parse(newBytes);
  assert.equal(old.local.version, 'b00993b05c14117dca60');
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
    css: file => file.endsWith('.css'),
    caretGeometry: file => /(?:typing-caret-cache|learning-caret-geometry|OpponentPaceMarker|opponent-caret-layout)/.test(file),
    practiceAndRaceControllers: file => ['src/pages/Race.tsx', 'src/components/keybr/KeybrLessonMode.tsx', 'src/components/typing/TypingArea.tsx', 'src/lib/challenge-timing.ts', 'src/lib/race-clock.ts'].includes(file),
  };
  Object.assign(report, { before: old.local, after: next.local, beforeSourceFiles: Object.keys(old.sourceHashes).length,
    afterSourceFiles: Object.keys(next.sourceHashes).length, addedSourceFiles: added, removedSourceFiles: removed,
    modifiedSourceFiles: modified, changedSourceFiles: changed, unchangedSourceFiles: names.length - changed.length,
    sourceReceiptSha256: { before: hash(oldBytes), after: hash(newBytes) }, currentFrozenSource: current.receipt,
    componentIntegrity: Object.fromEntries(Object.entries(groups).map(([name, match]) => [name, {
      compared: names.filter(match).length, changed: changed.filter(match), unchanged: !changed.some(match),
    }])),
  });
  assert.equal(Object.keys(old.sourceHashes).length, 496);
  assert.equal(Object.keys(next.sourceHashes).length, 498);
  assert.deepEqual(added, ['src/lib/__tests__/pressed-key-store.test.ts', 'src/lib/pressed-key-store.ts']);
  assert.deepEqual(removed, []);
  assert.deepEqual(changed, expectedChanges);
  for (const [name, result] of Object.entries(report.componentIntegrity)) assert.equal(result.unchanged, true, name);
  report.status = 'PASS-SCOPED';
} catch (error) { report.error = { name: error.name, message: error.message }; }
finally { await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close(); }
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
