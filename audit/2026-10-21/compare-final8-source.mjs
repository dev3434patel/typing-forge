import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

// Read-only product inspection. Run only after the coordinator freezes8;
// this creates one exclusive audit receipt and never builds or edits sources.
const expectedBuild = process.env.SPAROWTYPE_FINAL8_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Actual frozen final8 build ID is required.');
const beforeFile = 'audit/2026-10-21/final7-source.json';
const afterFile = 'audit/2026-10-21/final8-source.json';
const output = 'audit/2026-10-21/final8-source-delta.json';
const handle = await open(output, 'wx');
const report = { status: 'FAILED', capturedAt: new Date().toISOString(), beforeFile, afterFile, expectedBuild, scope: 'Normalized frozen-source hash delta only. Source8 includes caret optimization and explicitly versioned first-input practice timing, so PHP/core/game changes are reported for review rather than forbidden. No browser, build, database, live API, performance or visual acceptance. Prior failures remain unchanged.' };
try {
  const beforeBytes = await readFile(beforeFile), afterBytes = await readFile(afterFile);
  const before = JSON.parse(beforeBytes), after = JSON.parse(afterBytes);
  assert.equal(before.local.version, 'f3ac03affbc33168655a');
  assert.equal(after.local.version, expectedBuild);
  assert.deepEqual(after.local, after.served);
  const current = await verifyFrozenSource(afterFile);
  assert.deepEqual(current.receipt.mismatches, []);
  const oldHashes = before.sourceHashes, newHashes = after.sourceHashes;
  const names = [...new Set([...Object.keys(oldHashes), ...Object.keys(newHashes)])].sort();
  const added = names.filter(file => !Object.hasOwn(oldHashes, file));
  const removed = names.filter(file => !Object.hasOwn(newHashes, file));
  const modified = names.filter(file => Object.hasOwn(oldHashes, file) && Object.hasOwn(newHashes, file) && oldHashes[file] !== newHashes[file]);
  const changed = [...added, ...removed, ...modified].sort();
  const expectedCaretArea = file => file === 'src/components/keybr/KeybrLessonMode.tsx'
    || file === 'src/components/typing/TypingArea.tsx'
    || /^src\/components\/typing\/typing-caret-(?:cache|geometry)(?:\.test)?\.ts$/.test(file)
    || file === 'src/lib/learning-caret-geometry.ts'
    || file === 'src/lib/__tests__/learning-caret-geometry.test.ts';
  const unexpected = changed.filter(file => !expectedCaretArea(file));
  report.before = before.local;
  report.after = after.local;
  report.beforeSourceFiles = Object.keys(oldHashes).length;
  report.afterSourceFiles = Object.keys(newHashes).length;
  report.unionCompared = names.length;
  report.addedSourceFiles = added;
  report.removedSourceFiles = removed;
  report.modifiedSourceFiles = modified;
  report.changedSourceFiles = changed;
  report.unchangedSourceFiles = names.length - changed.length;
  report.nonCaretChangesForTimingReview = unexpected;
  report.deltaScopeRequiresReleaseOwnerReview = true;
  report.renderingSourcesChanged = changed.some(file => file.startsWith('src/components/brand/'));
  report.phpSourcesChanged = changed.some(file => file.startsWith('backend/'));
  report.canonicalEngineSourcesChanged = changed.some(file => file.startsWith('src/lib/typing-core/'));
  report.currentFrozenSource = current.receipt;
  report.sourceReceiptSha256 = { before: hash(beforeBytes), after: hash(afterBytes) };
  assert.equal(removed.length, 0, 'Source removal is outside this repair.');
  assert.equal(report.renderingSourcesChanged, false);
  report.status = 'PASS-SCOPED';
} catch (error) {
  report.error = { name: error.name, message: error.message };
} finally {
  await handle.writeFile(JSON.stringify(report, null, 2) + '\n');
  await handle.close();
}
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
