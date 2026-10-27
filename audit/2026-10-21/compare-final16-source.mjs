import assert from 'node:assert/strict';
import { open, readFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL16_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Bind the actual frozen source16 build; no guessed identity.');
const directory = 'audit/2026-10-21';
const beforeFile = `${directory}/final15-source.json`, afterFile = `${directory}/final16-source.json`;
const output = `${directory}/final16-source-delta.json`;
const sessionFile = 'src/lib/typing-core/session.ts';
const sessionProofFile = `${directory}/final16-flat-alignment-source-review.json`;
const expectedChanges = [sessionFile, 'src/lib/typing-core/__tests__/live-projection.test.ts', 'src/components/typing/live-keyboard.css'].sort();
const handle = await open(output, 'wx');
const report = { capturedAt: new Date().toISOString(), status: 'FAILED', beforeFile, afterFile, expectedBuild,
  scope: 'Exact source15-to16 flat live alignment plus instantaneous physical-feedback border delta. session.ts intentionally changes hash; semantic preservation is bound to its owner reverse-edit receipt, never inferred from a whole-core unchanged claim. No browser, latency, Lighthouse or hosted result is inferred.', expectedChangedSourceFiles: expectedChanges };
try {
  const oldBytes = await readFile(beforeFile), newBytes = await readFile(afterFile);
  const old = JSON.parse(oldBytes), next = JSON.parse(newBytes);
  assert.equal(old.local.version, '7ef96ccd3c02d170a757');
  assert.equal(next.local.version, expectedBuild);
  assert.deepEqual(next.local, next.served);
  const current = await verifyFrozenSource(afterFile); assert.deepEqual(current.receipt.mismatches, []);
  const names = [...new Set([...Object.keys(old.sourceHashes), ...Object.keys(next.sourceHashes)])].sort();
  const added = names.filter(file => !Object.hasOwn(old.sourceHashes, file));
  const removed = names.filter(file => !Object.hasOwn(next.sourceHashes, file));
  const modified = names.filter(file => Object.hasOwn(old.sourceHashes, file) && Object.hasOwn(next.sourceHashes, file) && old.sourceHashes[file] !== next.sourceHashes[file]);
  const changed = [...added, ...removed, ...modified].sort();
  const groups = {
    php: file => file.startsWith('backend/'),
    pwa: file => ['public/sw.js', 'src/main.tsx', 'src/lib/pwa.ts', 'src/lib/__tests__/pwa-lifecycle.test.ts', 'src/lib/__tests__/pwa-worker.test.ts'].includes(file),
    threeAndOpeningRenderer: file => file.startsWith('src/components/brand/'),
    cssExceptAuthorizedKeyboardFeedback: file => file.endsWith('.css') && file !== 'src/components/typing/live-keyboard.css',
    canonicalCoreExceptAuthorizedSessionAndUnit: file => file.startsWith('src/lib/typing-core/') && !expectedChanges.includes(file),
    metricsReplayTranscriptModules: file => /(?:^|\/)(?:metrics|replay|events|types|timing|unicode|configuration)(?:[.-]|\/)/.test(file),
    caretGeometry: file => /(?:typing-caret-cache|learning-caret-geometry|OpponentPaceMarker|opponent-caret-layout)/.test(file),
    keyboardSubscriptionsAndRows: file => ['src/hooks/useLiveKeyboard.ts', 'src/components/typing/ObservedLiveKeyboard.tsx', 'src/components/typing/LiveKeyboard.tsx', 'src/lib/pressed-key-store.ts', 'src/lib/__tests__/pressed-key-store.test.ts'].includes(file),
    practiceRaceAndClockControllers: file => ['src/pages/Race.tsx', 'src/components/keybr/KeybrLessonMode.tsx', 'src/components/typing/TypingArea.tsx', 'src/lib/challenge-timing.ts', 'src/lib/race-clock.ts'].includes(file),
  };
  Object.assign(report, {
    before: old.local, after: next.local, beforeSourceFiles: Object.keys(old.sourceHashes).length, afterSourceFiles: Object.keys(next.sourceHashes).length,
    addedSourceFiles: added, removedSourceFiles: removed, modifiedSourceFiles: modified, changedSourceFiles: changed,
    unchangedSourceFiles: names.length - changed.length,
    sourceReceiptSha256: { before: hash(oldBytes), after: hash(newBytes) }, currentFrozenSource: current.receipt,
    componentIntegrity: Object.fromEntries(Object.entries(groups).map(([name, match]) => [name, { compared: names.filter(match).length, changed: changed.filter(match), unchanged: !changed.some(match) }])),
  });
  assert.equal(Object.keys(old.sourceHashes).length, 498); assert.equal(Object.keys(next.sourceHashes).length, 498);
  assert.deepEqual(added, []); assert.deepEqual(removed, []); assert.deepEqual(changed, expectedChanges); assert.equal(report.unchangedSourceFiles, 495);
  for (const [name, result] of Object.entries(report.componentIntegrity)) assert.equal(result.unchanged, true, name);
  const proofBytes = await readFile(sessionProofFile), proof = JSON.parse(proofBytes);
  assert.match(proof.status ?? '', /^PASS(?:-|$)/, 'The reverse-edit owner receipt must pass.');
  assert.equal(proof.frozenBaselineBuild, old.local.version);
  assert.equal(proof.baselineSessionSha256, old.sourceHashes[sessionFile]);
  assert.equal(proof.currentSessionSha256, next.sourceHashes[sessionFile]);
  assert.equal(proof.reversedSessionSha256, old.sourceHashes[sessionFile]);
  assert.equal(proof.reverseEditRestoresExact15Session, true);
  assert.equal(proof.genericFreezeUnchanged, true);
  assert.equal(proof.canonicalMathReplayTimingRestoredByReverse, true);
  report.authorizedSessionChange = { file: sessionFile, hashChanged: true, proof: sessionProofFile, proofSha256: hash(proofBytes), baselineSessionSha256: proof.baselineSessionSha256, currentSessionSha256: proof.currentSessionSha256, reversedSessionSha256: proof.reversedSessionSha256, reverseEditRestoresExact15Session: true, genericFreezeUnchanged: true, canonicalMathReplayTimingRestoredByReverse: true, limitation: 'Reverse-edit source fidelity is not browser or latency proof. Canonical session file is deliberately not labeled unchanged.' };
  report.status = 'PASS-SCOPED';
} catch (error) { report.error = { name: error.name, message: error.message }; }
finally { await handle.writeFile(JSON.stringify(report, null, 2) + '\n'); await handle.close(); }
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
