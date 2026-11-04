// Metadata correction only; full matrix/native assertions and timing stay exact.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const changes = [
  { file: `${directory}/run-final26-browser-matrix.mjs`,
    before: 'frontendEvidenceReuseRequiresExactByteProof: true',
    after: "changedExistingFrontendFiles: ['src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts'], currentArenaWireFieldsRemovedExactly: ['characters', 'timeSeries', 'cursor'], frontendEvidenceReuse: 'NOT-USED', freshFrontendBuildRequired: true, freshOrdinaryInputRunsRequired: 3, freshFullQualityMobileLighthouseRunsRequired: 3" },
  ...['run-final26-native-modules.mjs', 'run-final26-native-ci.mjs'].map(name => ({ file: `${directory}/${name}`,
    before: "sourceInventoryExtension: { previousCount: 504, expectedCount: 505, proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php'], reason: 'Source26 proposes a bounded backend request-body parser. The source25 replay-hoist prototype was rejected and restored to source24; actual acceptance requires505 frozen files and independent UI byte-identity proof.' }",
    after: "sourceInventoryExtension: { previousCount: 504, expectedCount: 505, proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php'], changedExistingFrontendFiles: ['src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts'], frontendEvidenceReuse: 'NOT-USED', freshFrontendBuildAndThreeInputAndThreeFullQualityLighthouseRunsRequired: true, reason: 'Source26 uses a bounded backend request parser and production compact Arena request wire. The rejected25 replay hoist remains restored to24. Acceptance requires505 frozen files and the actual fresh frontend build; no prior UI evidence reuse is claimed.' }" })),
];
const actual = [];
for (const change of changes) {
  const original = await readFile(change.file, 'utf8'); assert.equal(original.split(change.before).length - 1, 1);
  const revised = original.replace(change.before, change.after); assert.equal(revised.replace(change.after, change.before), original);
  await writeFile(change.file, revised);
  actual.push({ ...change, originalSha256: hash(original), sha256: hash(revised), reversibleByteIdentity: true });
}
const proofFile = `${directory}/verify-source26-ui-evidence-reuse.mjs`;
const baselinePreparation = JSON.parse(await readFile(`${directory}/source26-wrapper-preparation-validation.json`, 'utf8'));
assert.equal(hash(await readFile(proofFile)), baselinePreparation.source24UiProof.sha256);
const report = { status: 'PREPARED-METADATA-CORRECTED-NOT-RUN', recordedAt: new Date().toISOString(), changes: actual,
  actualScope: 'Bounded RequestBody parser plus production Arena wire helper/service; only server-rebuilt characters/timeSeries/cursor are removed from requests.',
  expectedSourceFiles: 505, expectedE2eSpecFiles: 64, allFourEnginesRetained: true, originalAssertionsBatchesDeadlinesAndRetriesChanged: false,
  requiredFreshEvidence: { build: true, ordinaryInputRuns: 3, fullQualityMobileLighthouseRuns: 3 }, priorUiReuse: 'NOT-USED', strictUiReuseCheckerUnchanged: { file: proofFile, sha256: baselinePreparation.source24UiProof.sha256 },
  acceptanceTestsRun: 0, servicesStarted: 0, buildsRun: 0 };
await writeFile(`${directory}/source26-expanded-scope-wrapper-metadata.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, metadataFiles: actual.length, specs: 64, priorUiReuse: 'NOT-USED' }));
