// Compare actual source26 to the actual frozen source24 UI artifact. No rebuild
// or browser/performance run is performed by this file-hashing proof.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { filesWithin, hash, normalizedSourceHash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.argv.length, 3); assert.equal(process.argv[2], 'verify26');
const directory = 'audit/2026-10-27', output = `${directory}/final26-ui-evidence-reuse.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const baselineFile = `${directory}/final24-ui-byte-baseline-before25.json`, baselineBytes = await readFile(baselineFile), baseline = JSON.parse(baselineBytes);
const manifest24File = `${directory}/final24-source.json`, manifest24Bytes = await readFile(manifest24File), manifest24 = JSON.parse(manifest24Bytes);
assert.equal(baseline.status, 'BASELINE-CAPTURED-NO-NEW-TEST-RUN');
assert.equal(baseline.source24Manifest.sha256, hash(manifest24Bytes));
assert.equal(Object.keys(manifest24.sourceHashes).length, 504);
assert.equal(manifest24.local.version, '6cdddf1a74b2d10d1c9b');
assert.equal(baseline.source24UiFileCount, 467); assert.equal(baseline.dist.allFileCount, 142); assert.equal(baseline.dist.publicPrecacheFileCount, 133);
const frozen26 = await verifyFrozenSource(`${directory}/final26-source.json`);
assert.equal(frozen26.receipt.compared, 505); assert.deepEqual(frozen26.receipt.mismatches, []);
assert.deepEqual(frozen26.frozen.local, manifest24.local);
const expectedAllPaths = [...Object.keys(manifest24.sourceHashes), 'backend/src/RequestBody.php'].sort();
assert.deepEqual(Object.keys(frozen26.frozen.sourceHashes).sort(), expectedAllPaths, 'The only inventory addition may be the declared RequestBody class; no old path may disappear.');
const ui26 = Object.fromEntries(Object.entries(frozen26.frozen.sourceHashes).filter(([file]) => !file.startsWith('backend/')));
assert.deepEqual(ui26, baseline.source24UiHashes, 'All467 complete frontend/public/build/script/package/Vite input paths and hashes must remain equal.');
assert.equal(Object.keys(ui26).length, 467);
for (const [file, expected] of Object.entries(ui26)) assert.equal(normalizedSourceHash(file, await readFile(file)), expected);
const changedBackendFiles = Object.entries(frozen26.frozen.sourceHashes).filter(([file, digest]) => digest !== manifest24.sourceHashes[file]).map(([file]) => file).sort();
assert.deepEqual(changedBackendFiles, ['backend/public/index.php', 'backend/src/RequestBody.php'], 'Only the declared parser caller and new parser may differ from source24.');
const allFiles = [];
for (const file of await filesWithin('dist')) {
  const bytes = await readFile(path.join('dist', file)); allFiles.push({ file, bytes: bytes.length, sha256: hash(bytes) });
}
const worker = await readFile('dist/sw.js', 'utf8'), match = worker.match(/const PRECACHE_PATHS = (\[[^;]*\]);/);
assert.ok(match && match[1].length < 100000);
const precache = JSON.parse(match[1]); assert.equal(precache.length, 133); assert.equal(new Set(precache).size, 133);
assert.ok(precache.every(file => typeof file === 'string' && file.startsWith('/') && !file.includes('..')));
const publicPrecacheFiles = precache.map(file => {
  const row = allFiles.find(row => `/${row.file}` === file); assert.ok(row); return row;
}).sort((a, b) => a.file.localeCompare(b.file));
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
assert.deepEqual(build, manifest24.local);
assert.equal(publicPrecacheFiles.reduce((total, row) => total + row.bytes, 0), build.bytes);
const dist = { build, allFiles, allFileCount: allFiles.length, allFileBytes: allFiles.reduce((total, row) => total + row.bytes, 0), publicPrecacheFiles, publicPrecacheFileCount: publicPrecacheFiles.length };
assert.deepEqual(dist, baseline.dist, 'All142 raw dist file paths/bytes/SHA256 values, including every133 public asset, must match the captured24 baseline exactly.');
const references = [];
for (const name of baseline.measurementsReferenced) {
  const file = `${directory}/${name}`, bytes = await readFile(file), report = JSON.parse(bytes);
  assert.equal(report.protocol.build.version, manifest24.local.version);
  if (name.includes('input')) assert.ok(report.runs.length === 3 && report.runs.every(run => run.exact && run.attempts === 495 && run.accuracy === 100 && run.p98Ms < 100 && run.errors.length === 0));
  else assert.ok(report.status === 'PASS-SCOPED' && report.runs.length === 3 && report.medianPerformance >= 95);
  references.push({ file, sha256: hash(bytes), originallyMeasuredBuild: report.protocol.build.version, newMeasurementRun: false });
}
const result = { status: 'PASS-SCOPED-BYTE-IDENTICAL-UI-EVIDENCE-REUSE', verifiedAt: new Date().toISOString(), source24Manifest: baseline.source24Manifest, source26: frozen26.receipt, baselineFile, baselineSha256: hash(baselineBytes),
  sourceInventory: { source24Files: 504, source26Files: 505, onlyAddedPath: 'backend/src/RequestBody.php', noRemovedPaths: true }, changedBackendFiles,
  uiFilesCompared: 467, allDistFilesCompared: dist.allFileCount, publicAssetsCompared: dist.publicPrecacheFileCount, allDistBytesCompared: dist.allFileBytes, exactRawDistIdentity: true, exactNormalizedUiSourceIdentity: true, evidence: references,
  scope: 'Prior ordinary input and complete-quality mobile Lighthouse evidence applies only to the identical frontend artifact. Backend parser behavior, capacity, native database integration and the full browser matrix require separate fresh source26 acceptance. The rejected25 replay hoist contributes no evidence of a latency improvement.',
  browserOrPerformanceJobsRun: 0, fullSource26AcceptancePassed: false };
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, output, uiFiles: result.uiFilesCompared, allDistFiles: result.allDistFilesCompared, publicAssets: result.publicAssetsCompared, changedBackendFiles }));
