// Audit preparation only. No production edit, build, download or acceptance run.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const identities = [['final25', 'final26'], ['FINAL25', 'FINAL26'], ['source25', 'source26'], ['SOURCE25', 'SOURCE26'],
  ['Source25', 'Source26'], ['capacity25', 'capacity26'], ['rate-native25', 'rate-native26'], ['native-rate25', 'native-rate26']];
const files = ['pack-backend-instance-source25.mjs', 'run-source25-capacity-burst.mjs', 'run-source25-native-rate.mjs',
  'native-rate-worker-source25.php', 'run-browser-checkpoint-final25.mjs', 'run-final25-browser-matrix.mjs',
  'run-final25-static.mjs', 'run-final25-native-browser.mjs', 'run-final25-native-modules.mjs',
  'measure-mobile-workspaces-static-final25.mjs', 'run-mobile-workspaces-static-final25.mjs',
  'run-source25-serializer-profile.mjs', 'benchmark-validator-source25.php',
  'run-final25-native-ci.mjs', 'run-final25-ci-extra.mjs', 'setup-final25-portable-deno.mjs', 'final25-portable-deno-plan.json'];
const prepared = [];
for (const name of files) {
  const originalFile = `${directory}/${name}`, file = `${directory}/${name.replaceAll('source25', 'source26').replaceAll('final25', 'final26')}`;
  const original = await readFile(originalFile, 'utf8'); let text = original;
  const substitutions = [];
  const adapt = (before, after, expected) => {
    const count = text.split(before).length - 1;
    if (expected !== undefined) assert.equal(count, expected, `${name}: ${before}`);
    if (!count) return;
    text = text.replaceAll(before, after); substitutions.push({ before, after, count });
  };
  for (const [before, after] of identities) adapt(before, after);
  adapt('receipt.compared, 504', 'receipt.compared, 505');
  adapt('compared === 504', 'compared === 505');
  adapt('currentSourceFileCount: 504', 'currentSourceFileCount: 505');
  adapt("proposedChangedBackendFiles: ['backend/src/ArenaEvidence.php', 'backend/src/ArenaService.php']",
    "proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php']");
  if (name === 'run-final25-native-modules.mjs' || name === 'run-final25-native-ci.mjs') {
    adapt("sourceInventoryExtension: { previousCount: 504, expectedCount: 504, proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php'], reason: 'Source26 moves an independent authoritative Arena replay before locks with exact internal binding; execution requires the actual frozen inventory to match504. Frontend byte identity is checked separately.' }",
      "sourceInventoryExtension: { previousCount: 504, expectedCount: 505, proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php'], reason: 'Source26 proposes a bounded backend request-body parser. The source25 replay-hoist prototype was rejected and restored to source24; actual acceptance requires505 frozen files and independent UI byte-identity proof.' }", 1);
  }
  if (name === 'final25-portable-deno-plan.json') adapt('source26 inventory504', 'source26 inventory505', 1);
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, 'Every new26 wrapper must reverse exactly to its preserved25 input.');
  await writeFile(file, text, { flag: 'wx' });
  prepared.push({ originalFile, originalSha256: hash(original), file, sha256: hash(text), substitutions, reversibleByteIdentity: true });
}
for (const item of prepared) assert.equal(hash(await readFile(item.originalFile)), item.originalSha256);
const baselineFile = `${directory}/final24-ui-byte-baseline-before25.json`, baseline = JSON.parse(await readFile(baselineFile, 'utf8'));
assert.equal(baseline.source24UiFileCount, 467); assert.equal(baseline.dist.allFileCount, 142); assert.equal(baseline.dist.publicPrecacheFileCount, 133);
const serializerBaselineFile = `${directory}/final22-serializer-profile-protocol.json`, serializerBaseline = JSON.parse(await readFile(serializerBaselineFile, 'utf8'));
assert.equal(serializerBaseline.iterations, 12);
const report = { status: 'PROPOSAL-PREPARED-ACTUAL-SOURCE26-FREEZE-UNVERIFIED', preparedAt: new Date().toISOString(), requiredSourceFile: `${directory}/final26-source.json`, requiredBuildEnvironment: 'SPAROWTYPE_FINAL26_BUILD_ID', expectedFrontendBuild: '6cdddf1a74b2d10d1c9b',
  sourceInventory: { source24: 504, proposed26: 505, expectedAddedFile: 'backend/src/RequestBody.php', expectedChangedExistingFile: 'backend/public/index.php', source25HoistRestoredTo24: true, actualSource26FreezeVerification: 'PENDING' },
  testInventory: { specFiles: 64, allFourEngines: true, filesExactlyOnce: true, workers: 1, retries: 0, actualCollectedCaseTotalRequired: true },
  serializerComparison: { fixtureClientSessionId: 'source22-serializer-diagnostic', iterations: 12, baselineProtocol: serializerBaselineFile, baselineFixture: serializerBaseline.fixture, currentComparison: 'PENDING-EXECUTION' },
  uiEvidenceReuse: { actualSource24BaselineFile: baselineFile, baselineSha256: hash(await readFile(baselineFile)), all467NonbackendInputsMustMatch: true, all142DistFilesMustMatchRawBytes: true, all133PublicAssetsMustMatch: true, onlyAllowedChangesRelativeTo24: ['backend/public/index.php', 'backend/src/RequestBody.php'], verifier: `${directory}/verify-source26-ui-evidence-reuse.mjs`, status: 'PENDING-ACTUAL-SOURCE26-FREEZE' },
  nativeScopes: { fiveSuiteWrapperPreservedSeparately: true, eightSuiteCiWrapper: ['data', 'race', 'course', 'progression', 'social', 'classroom', 'arena-http', 'password'], capacity: { requests: 1653, concurrency: 20, p95ThresholdMsStrictlyBelow: 150, noRetriesOrFiltering: true } },
  portableDeno: { version: '2.9.8', officialArchiveAndSidecarHashesPreserved: true, destination: 'audit/2026-10-27/.final26-runtime', downloadedOrExecuted: false },
  guarantees: ['All25 wrappers and historical receipts remain unchanged.', 'Historical date21 imports and the source22 serializer fixture identity remain unchanged.', 'Only explicit26 identifiers, declared inventory and proposal metadata are adapted.', 'No test action, assertion, deadline, worker, retry, rate, durability or capacity threshold is relaxed.', 'No production or E2E edits, builds, services, browsers, downloads or typechecks run during preparation.'], prepared,
  acceptanceJobsRun: 0, servicesStarted: 0, browsersStarted: 0, downloadsRun: 0 };
const output = `${directory}/source26-wrapper-preparation.json`;
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, preparedFiles: prepared.length, proposedSourceFiles: 505, specs: 64 }));
