import assert from 'node:assert/strict';
import { readFile, open } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

// Preparation only until the coordinator freezes source11 and authorizes execution.
// This creates an exclusive hash-delta receipt; it never builds, edits or starts services.
const expectedBuild = process.env.SPAROWTYPE_FINAL11_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Actual frozen final11 build ID is required.');
const beforeFile = 'audit/2026-10-21/final10-source.json';
const afterFile = 'audit/2026-10-21/final11-source.json';
const output = 'audit/2026-10-21/final11-source-delta.json';
const expectedSourceChanges = ['public/sw.js', 'src/lib/__tests__/pwa-worker.test.ts'].sort();
const handle = await open(output, 'wx');
const report = {
  status: 'FAILED', capturedAt: new Date().toISOString(), beforeFile, afterFile, expectedBuild,
  scope: 'Normalized frozen-source delta only. Source11 is limited to online fallback when public asset cache inspection rejects and its existing worker-unit regressions. Cache query/private allowlist and no-runtime-asset-write contracts remain subject to independent tests. This does not prove the cause of source10 WebKit page errors, performance, hosting or browser acceptance. Source10 original failures remain unchanged.',
  expectedChangedSourceFiles: expectedSourceChanges,
};
try {
  const beforeBytes = await readFile(beforeFile), afterBytes = await readFile(afterFile);
  const before = JSON.parse(beforeBytes), after = JSON.parse(afterBytes);
  assert.equal(before.local.version, 'a3b43501c012b6bbaf6c');
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
    interactiveUi: file => file.startsWith('src/components/') || file.startsWith('src/pages/') || file.startsWith('src/games/') || /^src\/(?:App\.tsx|index\.css)$/.test(file),
    nonWorkerApplication: file => file.startsWith('src/') && file !== 'src/lib/__tests__/pwa-worker.test.ts',
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
  report.durationEvidenceScope = 'All frozen non-worker application hashes must be identical to source10. A coordinator may cite unchanged component identity alongside an existing source10 duration receipt; this delta does not execute or relabel that receipt as a new source11 duration run.';
  assert.equal(added.length, 0, 'The confirmed existing worker unit requires no source addition.');
  assert.equal(removed.length, 0, 'Source removal is outside this repair.');
  assert.deepEqual(changed, expectedSourceChanges, 'Only public/sw.js and the confirmed worker-unit file may change, and both must be represented.');
  assert.deepEqual(report.unexpectedChangedSourceFiles, []);
  for (const [name, integrity] of Object.entries(report.componentIntegrity)) {
    assert.equal(integrity.unchanged, true, `${name} source changed outside the worker repair.`);
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
