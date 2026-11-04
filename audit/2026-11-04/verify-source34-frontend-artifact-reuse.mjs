// Read-only evidence reuse proof. No builds, browsers, tests or services run.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { hash, normalizedSourceHash, verifyFrozenSource, filesWithin, sceneAssets, qualityBaseline, compareQuality } from '../2026-11-02/artifact-verification.mjs';

const checkpoint = 'audit/2026-11-02';
const output = 'audit/2026-11-04/source34-frontend-artifact-reuse-proof.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const previousFile = `${checkpoint}/final33-source.json`, currentFile = `${checkpoint}/final34-source.json`;
const [previousBytes, currentBytes] = await Promise.all([readFile(previousFile), readFile(currentFile)]);
const previous = JSON.parse(previousBytes), current = JSON.parse(currentBytes);
assert.equal(current.local.version, '332e23584f1e36465df2');
assert.deepEqual(current.local, previous.local);
const verified = await verifyFrozenSource(currentFile);
assert.equal(verified.receipt.compared, 505); assert.deepEqual(verified.receipt.mismatches, []);
assert.deepEqual(Object.keys(current.sourceHashes).sort(), Object.keys(previous.sourceHashes).sort());
const production = Object.keys(current.sourceHashes).sort().map(file => ({ file,
  source33Sha256: previous.sourceHashes[file], source34Sha256: current.sourceHashes[file],
  unchanged: previous.sourceHashes[file] === current.sourceHashes[file] }));
const changed = production.filter(row => !row.unchanged).map(row => row.file);
assert.deepEqual(changed, ['backend/src/ArenaEvidence.php', 'backend/src/DataService.php', 'backend/src/SessionValidator.php']);
const frontend = production.filter(row => !row.file.startsWith('backend/'));
assert.equal(frontend.length, 467); assert.ok(frontend.every(row => row.unchanged));
const backend = production.filter(row => row.file.startsWith('backend/'));
assert.equal(backend.length, 38); assert.equal(backend.filter(row => row.unchanged).length, 35);
const wire = ['src/domain/arena.ts', 'src/services/arena-service.ts'].map(file => production.find(row => row.file === file));
assert.ok(wire.every(row => row?.unchanged));

const evidenceNames = new Set(['final33-source.json', 'final33-static-process.json', 'final33-static-artifacts.json',
  'final33-static-mobile-sequence.json', 'final33-static-mobile-sequence-protocol.json']);
for (const file of await readdir(checkpoint)) {
  if (/^mobile-workspaces-final33-static-[123](?:-[a-z0-9-]+)?\.json$/.test(file)
    || /^final33-input-(?:[123](?:-process)?|results|independent-assessment|protocol)\.json$/.test(file)
    || /^final33-lighthouse-(?:[123](?:-process|\.report)?|results|protocol)\.(?:json|html)$/.test(file)) evidenceNames.add(file);
}
const evidence = [];
const jsonEvidence = new Map();
for (const name of [...evidenceNames].sort()) {
  const file = `${checkpoint}/${name}`, bytes = await readFile(file);
  evidence.push({ file, sha256: hash(bytes), bytes: bytes.length });
  if (name.endsWith('.json')) jsonEvidence.set(name, JSON.parse(bytes));
}
const sequence = jsonEvidence.get('final33-static-mobile-sequence.json');
assert.equal(sequence.status, 'PASS-SCOPED-STATIC-AND-THREE-MOBILE-TRIALS');
assert.equal(sequence.childClosed, true); assert.equal(sequence.mobileTrials.length, 3);
assert.equal(sequence.integrityAfter.inputHashesUnchanged, true);
assert.equal(sequence.integrityAfter.defaultBuildMetadataUnchanged, true);
assert.deepEqual(sequence.integrityAfter.source.mismatches, []);
const staticReceipt = jsonEvidence.get('final33-static-process.json');
assert.equal(staticReceipt.status, 'PASS-SCOPED');
for (const [name, total] of [['deployment', 56], ['game-accessibility', 16]]) {
  assert.equal(staticReceipt[name].total, total); assert.equal(staticReceipt[name].pass, total);
  for (const field of ['fail', 'skip', 'flaky', 'errors']) assert.equal(staticReceipt[name][field], 0);
}
const staticArtifacts = jsonEvidence.get('final33-static-artifacts.json');
assert.equal(staticArtifacts.status, 'PASS-SCOPED'); assert.equal(staticArtifacts.checks.length, 67);
assert.ok(staticArtifacts.checks.every(row => row.pass));
for (let trial = 1; trial <= 3; trial++) {
  const prefix = `mobile-workspaces-final33-static-${trial}`;
  const raw = jsonEvidence.get(`${prefix}.json`), process = jsonEvidence.get(`${prefix}-process.json`);
  assert.equal(raw.completed, true); assert.equal(raw.watchdogExpired, false);
  assert.deepEqual(raw.cases.map(row => row.id), ['learn', 'course', 'local-bot', 'games']);
  assert.ok(raw.cases.every(row => row.passed));
  assert.equal(process.status, 'PASS-SCOPED'); assert.deepEqual(process.apiRequests, []);
  assert.equal(process.ownBrowserChildExited, true); assert.equal(process.ownedServerClosed, true);
  assert.equal(process.hashesUnchanged, true); assert.equal(process.driverUnchanged, true);
  assert.equal(jsonEvidence.get(`${prefix}-latency-assessment.json`).status, 'PASS-SCOPED');
  assert.equal(jsonEvidence.get(`${prefix}-interaction-latency-assessment.json`).status, 'PASS-SCOPED');
}
const home = jsonEvidence.get('final33-input-independent-assessment.json');
assert.equal(home.status, 'PASS-SCOPED'); assert.equal(home.runs.length, 3);
const lighthouse = jsonEvidence.get('final33-lighthouse-results.json');
assert.equal(lighthouse.status, 'PASS-SCOPED'); assert.equal(lighthouse.runs.length, 3);
assert.equal(lighthouse.protocol.qualityOverrides, false); assert.equal(lighthouse.protocol.introSkip, false);
assert.equal(lighthouse.protocol.reducedMotionOverride, false);

const baseline = '275c8c24d65054abae18713c1eee4dad18888332';
assert.equal(current.baseline, baseline); assert.equal(current.fullIntroSourceUnchanged, true);
const brand = [];
for (const row of frontend.filter(row => row.file.startsWith('src/components/brand/'))) {
  const original = spawnSync('git', ['show', `${baseline}:${row.file}`], { windowsHide: true, maxBuffer: 2000000 });
  assert.equal(original.status, 0);
  const bytes = await readFile(row.file), normalized = normalizedSourceHash(row.file, original.stdout);
  assert.equal(normalized, row.source34Sha256); assert.equal(normalizedSourceHash(row.file, bytes), normalized);
  const rawSame = original.stdout.equals(bytes);
  assert.equal(original.stdout.toString('utf8').replaceAll('\r\n', '\n'), bytes.toString('utf8').replaceAll('\r\n', '\n'));
  brand.push({ file: row.file, baselineNormalizedSha256: normalized, baselineRawSha256: hash(original.stdout),
    currentRawSha256: hash(bytes), normalizedIdentical: true, rawByteIdentical: rawSame,
    rawDifferenceOnlyCrLf: !rawSame,
    ...(rawSame ? {} : { baselineCrLfTerminators: original.stdout.toString('utf8').split('\r\n').length - 1,
      currentCrLfTerminators: bytes.toString('utf8').split('\r\n').length - 1 }) });
}
assert.equal(brand.length, 21); assert.equal(brand.filter(row => row.rawByteIdentical).length, 20);
const qualityReference = await qualityBaseline('audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json');
const template = await readFile('public/sw.js', 'utf8');

async function verifyArtifact(directory, historicalBuild, historicalHashes = null, historicalScenes = null) {
  const deployment = JSON.parse(await readFile(`${directory}/deployment.json`, 'utf8'));
  const build = JSON.parse(await readFile(`${directory}/offline-build.json`, 'utf8'));
  assert.deepEqual(build, historicalBuild);
  const worker = await readFile(`${directory}/sw.js`, 'utf8');
  const precache = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)?.[1] || 'null');
  assert.ok(Array.isArray(precache)); assert.equal(precache.length, build.publicFiles);
  assert.equal(new Set(precache).size, precache.length);
  const digest = createHash('sha256').update(template).update(JSON.stringify({ base: deployment.base, frontendOnly: deployment.frontendOnly }));
  let bytes = 0;
  const precacheHashes = {};
  for (const name of precache) {
    assert.ok(name.startsWith(deployment.base) && !name.includes('..') && !/[?#\\]/.test(name));
    const relative = name.slice(deployment.base.length), value = await readFile(path.join(directory, relative));
    digest.update(name); digest.update(value); bytes += value.length; precacheHashes[relative] = hash(value);
  }
  assert.equal(digest.digest('hex').slice(0, 20), build.version);
  assert.equal(bytes, build.bytes);
  assert.equal(worker, template.replace('__SPAROWTYPE_BUILD__', build.version)
    .replace('/*__SPAROWTYPE_PRECACHE__*/ []', JSON.stringify(precache))
    .replace('/*__SPAROWTYPE_BASE__*/ "/"', JSON.stringify(deployment.base))
    .replace('/*__SPAROWTYPE_STATIC__*/ false', JSON.stringify(deployment.frontendOnly)));
  const all = (await filesWithin(directory)).sort();
  const hashes = {};
  for (const file of all) hashes[file] = hash(await readFile(path.join(directory, file)));
  if (historicalHashes) assert.deepEqual(hashes, historicalHashes);
  const scenes = await sceneAssets(directory);
  if (historicalScenes) assert.deepEqual(scenes, historicalScenes);
  const comparisons = compareQuality(scenes, qualityReference);
  assert.equal(comparisons.length, 5); assert.ok(comparisons.every(row => row.pass));
  return { directory, deployment, build, allArtifactFilesObserved: all.length, currentAllFileSha256: hashes,
    precacheFileSha256: precacheHashes, precacheFilesRecomputed: precache.length, precacheBytesRecomputed: bytes,
    everyPublishedContentIdByteRecomputed: true, injectedWorkerExact: true,
    historicalAllFileSha256Comparison: historicalHashes ? { compared: Object.keys(historicalHashes).length, mismatches: [] } : null,
    historicalSceneSha256Comparison: historicalScenes ? { compared: historicalScenes.length, mismatches: [] } : null,
    historicalByteProofQualification: historicalHashes
      ? 'Every current file exactly matches the retained historical per-fileSHA256 snapshot.'
      : 'No historical full per-file snapshot is claimed here. Every published precache byte recomputes the historical contentID, every current fileSHA256 is retained, and all available historical scene hashes are compared where present.',
    scenes, originalQualityComparisons: comparisons, originalQualityChecksPassed: 5 };
}
const artifactProofs = [];
artifactProofs.push(await verifyArtifact('dist', previous.local));
const vercelHistorical = jsonEvidence.get('mobile-workspaces-final33-static-1-process.json').artifactBefore;
for (let trial = 1; trial <= 3; trial++) {
  const process = jsonEvidence.get(`mobile-workspaces-final33-static-${trial}-process.json`);
  assert.deepEqual(process.artifactBefore.hashes, vercelHistorical.hashes);
  assert.deepEqual(process.artifactAfter.hashes, vercelHistorical.hashes);
}
for (const artifact of staticArtifacts.artifacts) {
  artifactProofs.push(await verifyArtifact(artifact.directory, artifact.build,
    artifact.directory === 'dist-static-final33-vercel' ? vercelHistorical.hashes : null, artifact.sceneAssets));
}
const candidateProcessFile = `${checkpoint}/mobile-workspaces-final32-static-candidate-process.json`;
const candidateBytes = await readFile(candidateProcessFile), candidate = JSON.parse(candidateBytes);
assert.equal(candidate.status, 'PASS-SCOPED'); assert.equal(candidate.artifactBefore.build.version, '2f3804662ab6e43a5f95');
assert.deepEqual(candidate.artifactBefore.hashes, candidate.artifactAfter.hashes);
artifactProofs.push(await verifyArtifact('dist-static-final33-candidate-vercel', candidate.artifactBefore.build, candidate.artifactBefore.hashes));
evidence.push({ file: candidateProcessFile, sha256: hash(candidateBytes), bytes: candidateBytes.length,
  qualification: 'Source32 candidate before/after per-file hashes also bind the byte-identical retained source33 candidate artifact; no new source34 candidate measurement is claimed.' });

const cacheAssessmentFile = 'audit/2026-11-04/source33-opcache-v3-capacity-assessment.json';
const cacheBytes = await readFile(cacheAssessmentFile), cacheAssessment = JSON.parse(cacheBytes);
const fragmentFile = 'backend/opcache.ini.example', fragmentBytes = await readFile(fragmentFile);
assert.equal(hash(fragmentBytes), cacheAssessment.fragmentHash);
const report = {
  status: 'PASS-SCOPED-EXPLICIT-SOURCE33-FRONTEND-EVIDENCE-REUSE-NOT-NEW-SOURCE34-MEASUREMENTS',
  recordedAt: new Date().toISOString(),
  manifests: { source33: { file: previousFile, sha256: hash(previousBytes), capturedAt: previous.capturedAt, build: previous.local },
    source34: { file: currentFile, sha256: hash(currentBytes), capturedAt: current.capturedAt, build: current.local } },
  sourceAfter: verified.receipt, normalizedSourceHashContract: 'CRLFtoLF only, identical to frozen manifest contract',
  production, changedProductionFiles: changed, unchangedFrontendFiles: 467,
  backend: { files: 38, unchangedFrom33: 35, changedFrom33: 3, evidenceReused: false }, wire, unchangedArenaWireFiles: 2,
  brand, brandNormalizedBaselineIdentical: 21, brandRawBaselineIdentical: 20, emittedArtifactProofs: artifactProofs,
  retainedSource33Evidence: evidence,
  reusedResults: {
    static: { source: 'source33', artifactChecks: 67, deploymentCases: 56, gameAccessibilityCases: 16, status: staticReceipt.status, finishedAt: staticReceipt.finishedAt },
    mobile: { source: 'source33', trials: 3, cases: 12, bothStrictLatencyGatesPassed: true, apiRequests: 0,
      observationAndEventCardinalityQualificationPreserved: true, finishedAt: sequence.finishedAt },
    home: { source: 'source33', trials: 3, status: home.status, recordedAt: home.recordedAt },
    lighthouse: { source: 'source33', trials: 3, status: lighthouse.status, actualFetchTimes: lighthouse.runs.map(row => row.fetchTime),
      performance: lighthouse.runs.map(row => row.scores.performance), fullIntroQualityPreserved: true },
  },
  runtimeFragmentOutside505: { file: fragmentFile, sha256: hash(fragmentBytes), unchangedFromSource33Profile: true,
    reference: cacheAssessmentFile, referenceSha256: hash(cacheBytes), capacityOutcomeReused: false },
  executionQualification: 'Measurements executed under source33 keep their original UTC dates and source labels. This is source34 frontend/artifact identity reuse only; it is not a new source34 static/mobile/home/Lighthouse run.',
  freshSource34Required: ['fullPHP/sourcegates', 'ordinaryandconfiguredcapacity', 'nativeArena', 'all64-specfour-enginebrowsermatrix', 'native20', 'PGliteandexactDenoCI'],
  source34BackendOrNativeOrCapacityPassClaimed: false,
  currentProofServicesStarted: 0, currentProofBrowsersStarted: 0, currentProofMeasurementsStarted: 0,
  privateConfigurationRead: false, productOrTestsEdited: false, historicalReportsModified: false,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, frontendUnchanged: 467, changed,
  wireUnchanged: 2, brandNormalized: 21, brandRaw: 20,
  artifacts: artifactProofs.map(row => ({ directory: row.directory, files: row.allArtifactFilesObserved,
    historicalFullHashesCompared: row.historicalAllFileSha256Comparison?.compared ?? 0, qualityChecks: row.originalQualityChecksPassed })),
  evidenceReceipts: evidence.length, source34MeasurementsStarted: 0 }));
