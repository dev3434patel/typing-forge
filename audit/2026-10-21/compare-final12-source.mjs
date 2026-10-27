import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

// Preparation only until the coordinator freezes source12 and authorizes execution.
// This creates an exclusive hash-delta receipt; it never builds, edits or starts services.
const expectedBuild = process.env.SPAROWTYPE_FINAL12_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Actual frozen final12 build ID is required.');
const beforeFile = 'audit/2026-10-21/final11-source.json';
const afterFile = 'audit/2026-10-21/final12-source.json';
const output = 'audit/2026-10-21/final12-source-delta.json';
const expectedSourceChanges = ['src/components/typing/TypingArea.tsx', 'src/components/typing/typing-caret-cache.ts', 'src/components/typing/typing-caret-cache.test.ts'].sort();
const handle = await open(output, 'wx');
const report = {
  status: 'FAILED', capturedAt: new Date().toISOString(), beforeFile, afterFile, expectedBuild,
  scope: 'Normalized frozen-source delta only. Source12 is limited to bounded measured forward caret anchors for correct ASCII prose/spaces, the TypingArea caller and its existing cache-unit regressions. Exact input, geometry and latency require separate acceptance. No PHP, metrics, timing, service-worker or renderer change is allowed. Source11 measured input failures and source10 original browser/static failures remain unchanged.',
  expectedChangedSourceFiles: expectedSourceChanges,
};
try {
  const beforeBytes = await readFile(beforeFile), afterBytes = await readFile(afterFile);
  const before = JSON.parse(beforeBytes), after = JSON.parse(afterBytes);
  assert.equal(before.local.version, '12fb668d18c84968bd70');
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
  const unchanged = names.filter(file => Object.hasOwn(oldHashes, file) && Object.hasOwn(newHashes, file) && oldHashes[file] === newHashes[file]);
  const groups = {
    php: file => file.startsWith('backend/'),
    canonicalEngine: file => file.startsWith('src/lib/typing-core/'),
    renderer: file => file.startsWith('src/components/brand/'),
    serviceWorker: file => file === 'public/sw.js' || file === 'src/lib/__tests__/pwa-worker.test.ts',
    otherApplication: file => file.startsWith('src/') && !expectedSourceChanges.includes(file),
  };
  report.before = before.local;
  report.after = after.local;
  report.beforeSourceFiles = Object.keys(oldHashes).length;
  report.afterSourceFiles = Object.keys(newHashes).length;
  report.unionCompared = names.length;
  report.addedSourceFiles = added;
  report.removedSourceFiles = removed;
  report.modifiedSourceFiles = modified;
  report.changedSourceFiles = changed;
  report.unchangedSourceFiles = unchanged.length;
  report.unexpectedChangedSourceFiles = changed.filter(file => !expectedSourceChanges.includes(file));
  report.componentIntegrity = Object.fromEntries(Object.entries(groups).map(([name, matches]) => [name, {
    compared: names.filter(matches).length,
    changed: changed.filter(matches),
    unchanged: !changed.some(matches),
  }]));
  report.currentFrozenSource = current.receipt;
  report.sourceReceiptSha256 = { before: hash(beforeBytes), after: hash(afterBytes) };
  report.acceptanceScope = 'Only the exact three caret files may differ from source11; every other frozen source must be identical. This hash check does not prove cursor geometry, latency, new duration evidence or a new complete UI/browser pass.';
  assert.equal(Object.keys(oldHashes).length, 494, 'Baseline must be the actual494-source final11 freeze.');
  assert.equal(added.length, 0, 'All three confirmed caret files already exist.');
  assert.equal(removed.length, 0, 'Source removal is outside this repair.');
  assert.deepEqual(changed, expectedSourceChanges, 'Only TypingArea and the confirmed cache source/unit may change, and all three must be represented.');
  assert.deepEqual(report.unexpectedChangedSourceFiles, []);
  for (const [name, integrity] of Object.entries(report.componentIntegrity)) {
    assert.equal(integrity.unchanged, true, `${name} source changed outside the caret repair.`);
  }
  report.status = 'PASS-SCOPED';
} catch (error) {
  report.error = { name: error.name, message: error.message };
} finally {
  await handle.writeFile(JSON.stringify(report, null, 2) + '\n');
  await handle.close();
}
console.log(JSON.stringify({ status: report.status, output, changed: report.changedSourceFiles }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
