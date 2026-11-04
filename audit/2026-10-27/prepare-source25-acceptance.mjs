// Preparation only. Production edits and actual acceptance remain root-owned.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-10-27';
const hash = value => createHash('sha256').update(value).digest('hex');
const identities = [
  ['final24', 'final25'], ['FINAL24', 'FINAL25'], ['source24', 'source25'], ['SOURCE24', 'SOURCE25'],
  ['Source24', 'Source25'], ['capacity24', 'capacity25'], ['rate-native24', 'rate-native25'], ['native-rate24', 'native-rate25'],
];
const files = [
  'pack-backend-instance-source24.mjs', 'run-source24-capacity-burst.mjs', 'run-source24-native-rate.mjs',
  'native-rate-worker-source24.php', 'run-browser-checkpoint-final24.mjs', 'run-final24-browser-matrix.mjs',
  'run-final24-static.mjs', 'run-final24-native-browser.mjs', 'run-final24-native-modules.mjs',
  'measure-mobile-workspaces-static-final24.mjs', 'run-mobile-workspaces-static-final24.mjs',
  'run-source24-serializer-profile.mjs', 'benchmark-validator-source24.php',
];
const prepared = [];
for (const name of files) {
  const originalFile = `${directory}/${name}`;
  const file = `${directory}/${name.replaceAll('source24', 'source25').replaceAll('final24', 'final25')}`;
  const original = await readFile(originalFile, 'utf8');
  let text = original;
  const substitutions = [];
  const adapt = (before, after, required) => {
    const count = text.split(before).length - 1;
    if (required !== undefined) assert.equal(count, required, `Unique adapter boundary: ${name}: ${before}`);
    if (!count) return;
    text = text.replaceAll(before, after); substitutions.push({ before, after, count });
  };
  for (const [before, after] of identities) adapt(before, after);
  if (name === 'run-final24-native-modules.mjs') {
    adapt("sourceInventoryExtension: { previousCount: 506, expectedCount: 504, proposedRemovedFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], reason: 'Source25 proposes removing the unsupported frame-presentation prototype; execution requires the actual frozen inventory to match504.' }",
      "sourceInventoryExtension: { previousCount: 504, expectedCount: 504, proposedChangedBackendFiles: ['backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php'], reason: 'Source25 moves an independent authoritative Arena replay before locks with exact internal binding; execution requires the actual frozen inventory to match504. Frontend byte identity is checked separately.' }", 1);
  }
  if (name === 'run-final24-browser-matrix.mjs') {
    adapt("proposedRemovedFrameFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts']",
      "proposedChangedBackendFiles: ['backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php'], frontendEvidenceReuseRequiresExactByteProof: true", 1);
  }
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, 'Every proposal must reverse exactly to its preserved source24 wrapper.');
  await writeFile(file, text, { flag: 'wx' });
  prepared.push({ originalFile, originalSha256: hash(original), file, sha256: hash(text), substitutions, reversibleByteIdentity: true });
}
for (const item of prepared) assert.equal(hash(await readFile(item.originalFile)), item.originalSha256);
const serializerBaseline = JSON.parse(await readFile(`${directory}/final22-serializer-profile-protocol.json`, 'utf8'));
assert.equal(serializerBaseline.iterations, 12);
const uiBaselineFile = `${directory}/final24-ui-byte-baseline-before25.json`;
const uiBaseline = JSON.parse(await readFile(uiBaselineFile, 'utf8'));
assert.equal(uiBaseline.status, 'BASELINE-CAPTURED-NO-NEW-TEST-RUN');
assert.equal(uiBaseline.dist.publicPrecacheFileCount, 133);
assert.equal(uiBaseline.source24UiFileCount, 467);
await writeFile(`${directory}/source25-wrapper-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PROPOSAL-PREPARED-ACTUAL-SOURCE25-FREEZE-UNVERIFIED',
  requiredSourceFile: `${directory}/final25-source.json`, requiredBuildEnvironment: 'SPAROWTYPE_FINAL25_BUILD_ID',
  sourceInventory: { previous: 504, expected: 504, proposedChangedBackendFiles: ['backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php'], actualFreezeVerification: 'PENDING' },
  testInventory: { specFiles: 64, rapidInputImePauseCasesRetained: true, caseCounts: 'Derived from actual collection/reports, no filtering or fixed prior total.' },
  serializerComparison: { iterations: 12, fixtureClientSessionId: 'source22-serializer-diagnostic',
    fixtureIdentifierIntentionallyPreserved: true, baselineProtocol: `${directory}/final22-serializer-profile-protocol.json`,
    baselineFixture: serializerBaseline.fixture, currentFixtureAndFingerprintComparison: 'PENDING-EXECUTION' },
  uiEvidenceReuse: { baselineFile: uiBaselineFile, baselineSha256: hash(await readFile(uiBaselineFile)), allSource24InputsVerifiedBeforeCapture: 504,
    exactNonbackendSourceFiles: 467, exactDistFiles: uiBaseline.dist.allFileCount, exactPublicPrecacheFiles: 133,
    verifier: `${directory}/verify-source25-ui-evidence-reuse.mjs`, verificationCommand: 'node audit/2026-10-27/verify-source25-ui-evidence-reuse.mjs verify25',
    status: 'PENDING-ACTUAL-SOURCE25-FREEZE', noNewInputOrLighthouseRunOnlyIfExactIdentityPasses: true },
  guarantees: ['Source24 scripts and all historical receipts remain unchanged.',
    'Historical date21 imports, original assertions, deadlines, retries, workers, raw outputs and capacity thresholds remain intact.',
    'All frozen entry-point inventory guards strictly require504 before actual execution.',
    'All64 current E2E spec files remain assigned exactly once across the same sequential four-engine batches.',
    'No production/E2E edits or build/browser/service/benchmark execution occurs during preparation.',
    'Source24 matrix is a preserved unexecuted proposal; source25 full-matrix results must come from actual execution.'],
  prepared, buildsRun: 0, servicesStarted: 0, browsersLaunched: 0, testsOrBenchmarksRun: 0,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PROPOSALS-PREPARED-NOT-RUN', files: prepared.map(item => item.file), expectedSourceFiles: 504, expectedSpecs: 64 }));
