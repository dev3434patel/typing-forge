// File hashing only; this helper never builds, serves, profiles or opens a browser.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { filesWithin, hash, normalizedSourceHash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const baselineFile = `${directory}/final24-ui-byte-baseline-before25.json`;
const mode = process.argv[2];
assert.ok(['capture24', 'verify25'].includes(mode) && process.argv.length === 3, 'Use capture24 once before backend changes, then verify25 after source25 freeze.');
const manifest24File = `${directory}/final24-source.json`;
const manifest24Bytes = await readFile(manifest24File);
const manifest24 = JSON.parse(manifest24Bytes);
assert.equal(manifest24.local.version, '6cdddf1a74b2d10d1c9b');
assert.equal(Object.keys(manifest24.sourceHashes).length, 504);
const ui24 = Object.fromEntries(Object.entries(manifest24.sourceHashes).filter(([file]) => !file.startsWith('backend/')));
for (const prefix of ['src/', 'public/', 'build/', 'scripts/']) assert.ok(Object.keys(ui24).some(file => file.startsWith(prefix)));
for (const file of ['package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json']) assert.ok(ui24[file]);
const readDist = async () => {
  const rows = [];
  for (const file of await filesWithin('dist')) {
    const bytes = await readFile(path.join('dist', file));
    rows.push({ file, bytes: bytes.length, sha256: hash(bytes) });
  }
  const worker = await readFile('dist/sw.js', 'utf8');
  const match = worker.match(/const PRECACHE_PATHS = (\[[^;]*\]);/);
  assert.ok(match && match[1].length < 100000);
  const precache = JSON.parse(match[1]);
  assert.equal(precache.length, 133);
  assert.equal(new Set(precache).size, 133);
  assert.ok(precache.every(file => typeof file === 'string' && file.startsWith('/') && !file.includes('..')));
  const precacheRows = precache.map(file => {
    const row = rows.find(row => `/${row.file}` === file);
    assert.ok(row, `Every declared public asset is hashed: ${file}`);
    return row;
  }).sort((a, b) => a.file.localeCompare(b.file));
  const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
  assert.deepEqual(build, manifest24.local);
  assert.equal(precacheRows.reduce((total, row) => total + row.bytes, 0), build.bytes);
  return { build, allFiles: rows, allFileCount: rows.length, allFileBytes: rows.reduce((total, row) => total + row.bytes, 0), publicPrecacheFiles: precacheRows, publicPrecacheFileCount: precacheRows.length };
};
if (mode === 'capture24') {
  const frozen = await verifyFrozenSource(manifest24File);
  assert.deepEqual(frozen.receipt.mismatches, [], 'Capture must occur while all504 source24 inputs are still frozen.');
  const dist = await readDist();
  const report = { status: 'BASELINE-CAPTURED-NO-NEW-TEST-RUN', recordedAt: new Date().toISOString(), source24Manifest: { file: manifest24File, sha256: hash(manifest24Bytes), compared: 504, mismatches: [] }, source24UiHashes: ui24, source24UiFileCount: Object.keys(ui24).length, dist, measurementsReferenced: ['final24-input-results.json', 'final24-lighthouse-results.json'], measurementReuseAuthorized: false, meaning: 'Raw bytes recorded before source25 backend edits. Reuse requires verify25 after the actual source25 freeze; this capture itself proves no future equivalence.', browserOrPerformanceJobsRun: 0 };
  await writeFile(baselineFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, baselineFile, uiFiles: report.source24UiFileCount, distFiles: dist.allFileCount, publicFiles: dist.publicPrecacheFileCount }));
} else {
  const baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
  assert.equal(baseline.source24Manifest.sha256, hash(manifest24Bytes));
  const frozen25 = await verifyFrozenSource(`${directory}/final25-source.json`);
  assert.equal(frozen25.receipt.compared, 504);
  assert.deepEqual(frozen25.receipt.mismatches, []);
  assert.deepEqual(frozen25.frozen.local, manifest24.local);
  const ui25 = Object.fromEntries(Object.entries(frozen25.frozen.sourceHashes).filter(([file]) => !file.startsWith('backend/')));
  assert.deepEqual(ui25, baseline.source24UiHashes, 'Every frontend/public/build/script/package/Vite input must remain exactly equal, including the complete path inventory.');
  for (const [file, expected] of Object.entries(ui25)) assert.equal(normalizedSourceHash(file, await readFile(file)), expected);
  const changedBackendFiles = Object.entries(frozen25.frozen.sourceHashes).filter(([file, sha256]) => sha256 !== manifest24.sourceHashes[file]).map(([file]) => file);
  assert.ok(changedBackendFiles.length > 0 && changedBackendFiles.every(file => file.startsWith('backend/')), 'Reuse is limited to a declared backend-only source change.');
  const dist = await readDist();
  assert.deepEqual(dist, baseline.dist, 'Every raw dist byte and filename, including all133 declared public assets, must remain identical.');
  const references = [];
  for (const name of baseline.measurementsReferenced) {
    const file = `${directory}/${name}`, bytes = await readFile(file), report = JSON.parse(bytes);
    assert.equal(report.protocol.build.version, manifest24.local.version);
    if (name.includes('input')) assert.ok(report.runs.length === 3 && report.runs.every(run => run.exact && run.attempts === 495 && run.accuracy === 100 && run.p98Ms < 100 && run.errors.length === 0));
    else assert.ok(report.status === 'PASS-SCOPED' && report.runs.length === 3 && report.medianPerformance >= 95);
    references.push({ file, sha256: hash(bytes), originallyMeasuredBuild: report.protocol.build.version, newMeasurementRun: false });
  }
  const result = { status: 'PASS-SCOPED-BYTE-IDENTICAL-UI-EVIDENCE-REUSE', verifiedAt: new Date().toISOString(), source24Manifest: baseline.source24Manifest, source25: frozen25.receipt, baselineFile, baselineSha256: hash(await readFile(baselineFile)), changedBackendFiles, uiFilesCompared: Object.keys(ui25).length, allDistFilesCompared: dist.allFileCount, publicAssetsCompared: dist.publicPrecacheFileCount, allDistBytesCompared: dist.allFileBytes, exactRawDistIdentity: true, exactNormalizedUiSourceIdentity: true, evidence: references, scope: 'Prior ordinary input and full-quality mobile Lighthouse evidence applies to the exact same frontend artifact. Backend behavior, capacity, native database integration and the full browser matrix require separate fresh source25 acceptance.', browserOrPerformanceJobsRun: 0, fullSource25AcceptancePassed: false };
  const output = `${directory}/final25-ui-evidence-reuse.json`;
  await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: result.status, output, uiFiles: result.uiFilesCompared, allDistFiles: result.allDistFilesCompared, publicAssets: result.publicAssetsCompared, changedBackendFiles }));
}
