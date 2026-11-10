// Read-only build identity. No measurement from source35 is reused as performance evidence.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { verifyFrozenSource, filesWithin, sceneAssets, qualityBaseline, compareQuality, normalizedSourceHash } from '../2026-11-02/artifact-verification.mjs';
const directory = 'audit/2026-11-05-followup';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const previousFile = `${directory}/final35-source.json`, currentFile = `${directory}/final36-source.json`;
const previous = JSON.parse(await readFile(previousFile, 'utf8')), current = JSON.parse(await readFile(currentFile, 'utf8'));
assert.equal(Object.keys(previous.sourceHashes).length, 506); assert.equal(Object.keys(current.sourceHashes).length, 506);
assert.deepEqual(Object.keys(previous.sourceHashes).sort(), Object.keys(current.sourceHashes).sort());
assert.equal(current.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
assert.ok(isDeepStrictEqual(previous.local, current.local)); assert.ok(isDeepStrictEqual(current.local, current.served));
assert.equal(current.local.version, 'd89f84d74519bf2bbae0');
const changed = Object.keys(current.sourceHashes).filter(file => previous.sourceHashes[file] !== current.sourceHashes[file]).sort();
assert.deepEqual(changed, ['backend/public/index.php', 'backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php']);
const frontend = Object.keys(current.sourceHashes).filter(file => !file.startsWith('backend/')).sort();
assert.equal(frontend.length, 468);
assert.ok(frontend.every(file => current.sourceHashes[file] === previous.sourceHashes[file]));
const source = await verifyFrozenSource(currentFile); assert.equal(source.receipt.compared, 506); assert.deepEqual(source.receipt.mismatches, []);
const worker = await readFile('dist/sw.js', 'utf8'), template = await readFile('public/sw.js', 'utf8');
const paths = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)?.[1] ?? 'null');
assert.ok(Array.isArray(paths)); assert.equal(paths.length, current.local.publicFiles); assert.equal(new Set(paths).size, paths.length);
const digest = createHash('sha256').update(template).update(JSON.stringify({ base: '/', frontendOnly: false }));
let bytes = 0; const published = {};
for (const path of paths) {
  assert.ok(path.startsWith('/') && !path.includes('..') && !/[?#\\]/.test(path));
  const body = await readFile(`dist/${path.slice(1)}`); digest.update(path); digest.update(body); bytes += body.length; published[path] = sha(body);
}
assert.equal(digest.digest('hex').slice(0, 20), current.local.version); assert.equal(bytes, current.local.bytes);
assert.equal(worker, template.replace('__SPAROWTYPE_BUILD__', current.local.version).replace('/*__SPAROWTYPE_PRECACHE__*/ []', JSON.stringify(paths)).replace('/*__SPAROWTYPE_BASE__*/ "/"', '"/"').replace('/*__SPAROWTYPE_STATIC__*/ false', 'false'));
const all = await filesWithin('dist');
const currentAllArtifactSha256 = Object.fromEntries(await Promise.all(all.map(async file => [file, sha(await readFile(`dist/${file}`))])));
const baseline = await qualityBaseline('audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json');
const scenes = await sceneAssets('dist', all), quality = compareQuality(scenes, baseline);
assert.equal(quality.length, 5); assert.ok(quality.every(row => row.pass));
const oldBrand = JSON.parse(await readFile('audit/2026-11-04/source34-final-state-identity.json', 'utf8')).brandSources;
const brand = await Promise.all(oldBrand.map(async row => { const body = await readFile(row.file); assert.equal(sha(body), row.currentRawSha256); return { file: row.file, rawSha256: sha(body), normalizedSha256: normalizedSourceHash(row.file, body), originalRawBaselineIdentical: row.baselineRawIdentical }; }));
assert.equal(brand.length, 21);
const receipt = {
  status: 'PASS-SCOPED-SOURCE36-REUSES-SOURCE35-BUILD-ONLY-NO-PERFORMANCE-REUSE', recordedAt: new Date().toISOString(),
  manifests: await Promise.all([previousFile, currentFile].map(async file => ({ file, sha256: sha(await readFile(file)) }))),
  source: source.receipt, build: current.local, changedProductionFiles: changed,
  unchangedFrontendSourceHashes: Object.fromEntries(frontend.map(file => [file, current.sourceHashes[file]])), unchangedFrontendFiles: frontend.length,
  allPublishedBytesRecomputeBothManifestContentIds: true, publishedFiles: paths.length, publishedBytes: bytes, publishedSha256: published,
  injectedWorkerExact: true, currentAllArtifactSha256,
  historicalFullFileMapQualification: 'No historical source35 complete142-file SHA map is invented. Both frozen manifests bind the same d89 content ID; every published byte and worker injection is recomputed, all468 frontend source hashes match, and the complete current artifact SHA map is recorded.',
  brand, brandSourcesUnchanged: 21, scenes, originalEmittedQualityChecks: quality,
  performanceMeasurementsReused: 0, freshStaticMobileHomeLighthouseMatrixNativeCiRequired: true,
  buildOrBrowserOrServiceOrMeasurementStarted: false, sourceOrTestsEdited: false,
};
await writeFile(`${directory}/source36-frontend-build-reuse-proof.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, sourceFiles: 506, frontendUnchanged: 468, publicFiles: paths.length, artifactFiles: all.length, brandSources: 21, sceneChecks: quality.length }));
