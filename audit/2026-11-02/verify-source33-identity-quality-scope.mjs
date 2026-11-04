// Read-only source and scene identity proof. No service, benchmark or Git mutation.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, normalizedSourceHash, verifyFrozenSource, sceneAssets, qualityBaseline, compareQuality } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-11-02';
const output = `${directory}/source33-identity-quality-scope.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const previousFile = `${directory}/final32-source.json`, currentFile = `${directory}/final33-source.json`;
const [previousBytes, currentBytes] = await Promise.all([readFile(previousFile), readFile(currentFile)]);
const previous = JSON.parse(previousBytes), current = JSON.parse(currentBytes);
const actualBuild = '332e23584f1e36465df2';
assert.equal(previous.local.version, actualBuild);
assert.equal(current.local.version, actualBuild);
const verified = await verifyFrozenSource(currentFile);
assert.equal(verified.receipt.compared, 505);
assert.deepEqual(verified.receipt.mismatches, []);
assert.deepEqual(Object.keys(current.sourceHashes).sort(), Object.keys(previous.sourceHashes).sort());
const production = Object.keys(current.sourceHashes).sort().map(file => ({
  file, source32Sha256: previous.sourceHashes[file], source33Sha256: current.sourceHashes[file],
  unchanged: previous.sourceHashes[file] === current.sourceHashes[file],
}));
const changed = production.filter(row => !row.unchanged).map(row => row.file);
assert.deepEqual(changed, ['backend/src/ArenaEvidence.php', 'backend/src/SessionValidator.php']);
const backend = production.filter(row => row.file.startsWith('backend/'));
assert.equal(backend.length, 38);
assert.equal(backend.filter(row => row.unchanged).length, 36);
const frontend = production.filter(row => !row.file.startsWith('backend/'));
assert.equal(frontend.length, 467);
assert.ok(frontend.every(row => row.unchanged));
const wire = ['src/domain/arena.ts', 'src/services/arena-service.ts'].map(file => production.find(row => row.file === file));
assert.ok(wire.every(row => row?.unchanged));

const baseline = '275c8c24d65054abae18713c1eee4dad18888332';
assert.equal(current.baseline, baseline);
assert.equal(current.fullIntroSourceUnchanged, true);
const brand = [];
for (const row of production.filter(row => row.file.startsWith('src/components/brand/'))) {
  const result = spawnSync('git', ['show', `${baseline}:${row.file}`], { windowsHide: true, maxBuffer: 2000000 });
  assert.equal(result.status, 0, 'The pinned brand baseline must resolve read-only.');
  const actual = await readFile(row.file);
  const baselineHash = normalizedSourceHash(row.file, result.stdout);
  assert.equal(baselineHash, row.source33Sha256);
  assert.equal(normalizedSourceHash(row.file, actual), baselineHash);
  const rawIdentical = result.stdout.equals(actual);
  const normalizedIdentical = result.stdout.toString('utf8').replaceAll('\r\n', '\n') === actual.toString('utf8').replaceAll('\r\n', '\n');
  assert.equal(normalizedIdentical, true);
  brand.push({ ...row, baseline, baselineNormalizedSha256: baselineHash,
    baselineRawSha256: hash(result.stdout), currentRawSha256: hash(actual),
    rawByteIdenticalToBaseline: rawIdentical, normalizedTextIdenticalToBaseline: normalizedIdentical,
    rawDifferenceOnlyCrLf: !rawIdentical && normalizedIdentical,
    ...(rawIdentical ? {} : { baselineCrLfTerminators: result.stdout.toString('utf8').split('\r\n').length - 1,
      currentCrLfTerminators: actual.toString('utf8').split('\r\n').length - 1 }),
  });
}
assert.equal(brand.length, 21);
const baselineQuality = await qualityBaseline('audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json');
const artifactProofs = [];
for (const [artifactDirectory, expectedVersion] of [['dist', actualBuild], ['dist-static-final33-candidate-vercel', '2f3804662ab6e43a5f95']]) {
  const build = JSON.parse(await readFile(`${artifactDirectory}/offline-build.json`, 'utf8'));
  assert.equal(build.version, expectedVersion);
  if (artifactDirectory === 'dist') assert.deepEqual(build, current.local);
  const assets = await sceneAssets(artifactDirectory);
  const comparisons = compareQuality(assets, baselineQuality);
  assert.equal(comparisons.length, 5);
  assert.ok(comparisons.every(row => row.pass));
  artifactProofs.push({ directory: artifactDirectory, build, assets, comparisons, originalQualityChecksPassed: 5 });
}
const oldCapacityFile = `${directory}/source31-capacity-and-cpu-assessment.json`;
const oldCapacityBytes = await readFile(oldCapacityFile);
const oldCapacity = JSON.parse(oldCapacityBytes);
assert.equal(oldCapacity.status, 'FAILED-CAPACITY-LATENCY');
const report = {
  status: 'PASS-SCOPED-SOURCE-AND-SCENE-IDENTITY-NOT-CAPACITY-ACCEPTANCE', recordedAt: new Date().toISOString(),
  checkpointDirectoryQualification: 'This proof executes4November UTC in the continuing audit/2026-11-02 checkpoint directory. Directory name is not an execution date.',
  manifests: { source32: { file: previousFile, sha256: hash(previousBytes), capturedAt: previous.capturedAt, build: previous.local },
    source33: { file: currentFile, sha256: hash(currentBytes), capturedAt: current.capturedAt, build: current.local } },
  sourceAfter: verified.receipt, production, unchangedProductionFiles: 503, changedProductionFiles: changed,
  backend, backendUnchangedFrom32: 36, backendChangedFrom32: 2,
  frontendUnchangedFrom32: 467, wire, wireUnchangedFrom32: 2,
  scopeOfBackendChange: 'Source identity establishes the two-file boundary only. Root-owned differential, native lifecycle and capacity checks separately determine correctness and runtime outcomes of omitting unused interim chart generation.',
  normalization: 'Source manifest SHA256 normalizes CRLF toLF only. Brand files additionally compare raw bytes to the pinned Git baseline.',
  brand, brandNormalizedIdenticalToBaseline: 21,
  brandRawByteIdenticalToBaseline: brand.filter(row => row.rawByteIdenticalToBaseline).length,
  brandRawLineEndingQualification: brand.filter(row => row.rawDifferenceOnlyCrLf).map(row => ({ file: row.file,
    baselineCrLfTerminators: row.baselineCrLfTerminators, currentCrLfTerminators: row.currentCrLfTerminators,
    contentDifference: false })),
  emittedSceneArtifacts: artifactProofs,
  capacityQualification: { status: 'FRESH-SOURCE33-CAPACITY-REQUIRED',
    previousEvidence: oldCapacityFile, previousEvidenceSha256: hash(oldCapacityBytes),
    previousFullP95Ms: oldCapacity.full.p95Ms, previousWireP95Ms: oldCapacity.wire.p95Ms,
    historicalFailuresPreserved: true, source33LoadRunsPerformedByThisProof: 0,
    reason: 'Backend source now differs in two files. Source31 capacity failures remain historical and cannot establish a source33 capacity pass or outcome.' },
  priorFrontendMeasurementsNotRelabeled: true, servicesStarted: 0, benchmarksExecuted: 0,
  privateConfigurationRead: false, gitMutations: 0, productFilesModified: false,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, changed, backendUnchanged: 36,
  frontendUnchanged: 467, wireUnchanged: 2, brandNormalizedBaselineIdentical: 21,
  brandRawBaselineIdentical: report.brandRawByteIdenticalToBaseline,
  sceneArtifacts: artifactProofs.map(row => ({ directory: row.directory, qualityChecksPassed: row.originalQualityChecksPassed })),
  capacityRequired: true, benchmarksExecuted: 0 }));
