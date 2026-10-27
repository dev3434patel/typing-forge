import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL17_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen17 build identity.');
const beforeFile = 'audit/2026-10-21/final16-source.json';
const afterFile = 'audit/2026-10-21/final17-source.json';
const output = 'audit/2026-10-21/final17-source-delta.json';
const newUnit = 'src/lib/typing-core/__tests__/transcript-target-cache.test.ts';
const expectedChanges = ['src/lib/typing-core/transcript.ts', newUnit, 'src/components/typing/live-keyboard.css'].sort();
const handle = await open(output, 'wx');
const report = { capturedAt: new Date().toISOString(), status: 'FAILED', beforeFile, afterFile, expectedBuild,
  scope: 'Exact16-to17 factory-owned bounded target-word metadata/CSS layout-containment source delta. transcript.ts changes hash explicitly; this path/count proof never implies whole canonical replay unchanged or a measured speedup. Semantic owner review/pure parity and actual runtime/performance remain separate.',
  expectedChangedSourceFiles: expectedChanges };
try {
  const oldBytes = await readFile(beforeFile), newBytes = await readFile(afterFile);
  const old = JSON.parse(oldBytes), next = JSON.parse(newBytes);
  assert.equal(old.local.version, '8ac2a0d9602ec9263118');
  assert.equal(next.local.version, expectedBuild); assert.deepEqual(next.local, next.served);
  const current = await verifyFrozenSource(afterFile); assert.deepEqual(current.receipt.mismatches, []);
  const names = [...new Set([...Object.keys(old.sourceHashes), ...Object.keys(next.sourceHashes)])].sort();
  const added = names.filter(file => !Object.hasOwn(old.sourceHashes, file));
  const removed = names.filter(file => !Object.hasOwn(next.sourceHashes, file));
  const modified = names.filter(file => Object.hasOwn(old.sourceHashes, file) && Object.hasOwn(next.sourceHashes, file) && old.sourceHashes[file] !== next.sourceHashes[file]);
  const changed = [...added, ...removed, ...modified].sort();
  const groups = {
    php: file => file.startsWith('backend/'),
    pwa: file => ['public/sw.js', 'src/main.tsx', 'src/lib/pwa.ts', 'src/lib/__tests__/pwa-lifecycle.test.ts', 'src/lib/__tests__/pwa-worker.test.ts'].includes(file),
    renderer: file => file.startsWith('src/components/brand/'),
    cssExceptAuthorizedKeyboardBoard: file => file.endsWith('.css') && file !== 'src/components/typing/live-keyboard.css',
    canonicalCoreExceptAuthorizedTranscriptAndNewUnit: file => file.startsWith('src/lib/typing-core/') && !['src/lib/typing-core/transcript.ts', newUnit].includes(file),
    metricsAndSessionClockModules: file => ['src/lib/typing-core/metrics.ts', 'src/lib/typing-core/session.ts', 'src/lib/typing-core/types.ts'].includes(file),
    caretGeometry: file => /(?:typing-caret-cache|learning-caret-geometry|OpponentPaceMarker|opponent-caret-layout)/.test(file),
    keyboardSubscriptionsAndRows: file => ['src/hooks/useLiveKeyboard.ts', 'src/components/typing/ObservedLiveKeyboard.tsx', 'src/lib/pressed-key-store.ts', 'src/components/typing/LiveKeyboard.tsx', 'src/components/typing/LiveKeyboard.test.tsx'].includes(file),
    practiceRaceAndChallengeAdapters: file => ['src/pages/Race.tsx', 'src/components/keybr/KeybrLessonMode.tsx', 'src/components/typing/TypingArea.tsx', 'src/lib/challenge-timing.ts', 'src/lib/race-clock.ts'].includes(file),
  };
  Object.assign(report, { before: old.local, after: next.local, beforeSourceFiles: Object.keys(old.sourceHashes).length, afterSourceFiles: Object.keys(next.sourceHashes).length,
    addedSourceFiles: added, removedSourceFiles: removed, modifiedSourceFiles: modified, changedSourceFiles: changed, unchangedSourceFiles: names.length - changed.length,
    sourceReceiptSha256: { before: hash(oldBytes), after: hash(newBytes) }, currentFrozenSource: current.receipt,
    componentIntegrity: Object.fromEntries(Object.entries(groups).map(([name, match]) => [name, { compared: names.filter(match).length, changed: changed.filter(match), unchanged: !changed.some(match) }])) });
  assert.equal(Object.keys(old.sourceHashes).length, 498); assert.equal(Object.keys(next.sourceHashes).length, 499);
  assert.deepEqual(added, [newUnit]); assert.deepEqual(removed, []); assert.deepEqual(changed, expectedChanges);
  assert.equal(report.unchangedSourceFiles, 496);
  for (const [name, result] of Object.entries(report.componentIntegrity)) assert.equal(result.unchanged, true, name);
  report.status = 'PASS-SCOPED';
} catch (error) { report.error = { name: error.name, message: error.message }; }
finally { await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close(); }
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
