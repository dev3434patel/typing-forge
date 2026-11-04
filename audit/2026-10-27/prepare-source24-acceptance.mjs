// Preparation only. Production edits and actual acceptance remain root-owned.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-10-27';
const hash = value => createHash('sha256').update(value).digest('hex');
const identities = [
  ['final23', 'final24'], ['FINAL23', 'FINAL24'], ['source23', 'source24'], ['SOURCE23', 'SOURCE24'],
  ['Source23', 'Source24'], ['capacity23', 'capacity24'], ['rate-native23', 'rate-native24'], ['native-rate23', 'native-rate24'],
];
const files = [
  'pack-backend-instance-source23.mjs', 'run-source23-capacity-burst.mjs', 'run-source23-native-rate.mjs',
  'native-rate-worker-source23.php', 'run-browser-checkpoint-final23.mjs', 'run-final23-browser-matrix.mjs',
  'run-final23-static.mjs', 'run-final23-native-browser.mjs', 'run-final23-native-modules.mjs',
  'measure-mobile-workspaces-static-final23.mjs', 'run-mobile-workspaces-static-final23.mjs',
  'run-source23-serializer-profile.mjs', 'benchmark-validator-source23.php',
];
const prepared = [];
for (const name of files) {
  const originalFile = `${directory}/${name}`;
  const file = `${directory}/${name.replaceAll('source23', 'source24').replaceAll('final23', 'final24')}`;
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
  // Existing frozen entry-point guards stay strict, now for the proposed
  // inventory after the two unsupported frame-presentation files are removed.
  adapt('receipt.compared, 506', 'receipt.compared, 504');
  if (name === 'run-final23-native-modules.mjs') {
    adapt('report.sourceAfter.compared === 506', 'report.sourceAfter.compared === 504', 1);
    adapt("sourceInventoryExtension: { previousCount: 504, expectedCount: 506, addedFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], reason: 'The proposed source24 inventory adds the frame publisher and its source unit test; execution requires the actual frozen inventory to match506.' }",
      "sourceInventoryExtension: { previousCount: 506, expectedCount: 504, proposedRemovedFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], reason: 'Source24 proposes removing the unsupported frame-presentation prototype; execution requires the actual frozen inventory to match504.' }", 1);
  }
  if (name === 'run-final23-browser-matrix.mjs') {
    adapt('currentSourceFileCount: 506', 'currentSourceFileCount: 504', 1);
    adapt("declaredSource24Files: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts']",
      "proposedRemovedFrameFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts']", 1);
  }
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, 'Every proposal must reverse exactly to its preserved source23 wrapper.');
  await writeFile(file, text, { flag: 'wx' });
  prepared.push({ originalFile, originalSha256: hash(original), file, sha256: hash(text), substitutions, reversibleByteIdentity: true });
}
for (const item of prepared) assert.equal(hash(await readFile(item.originalFile)), item.originalSha256);
const serializerBaseline = JSON.parse(await readFile(`${directory}/final22-serializer-profile-protocol.json`, 'utf8'));
assert.equal(serializerBaseline.iterations, 12);
await writeFile(`${directory}/source24-wrapper-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PROPOSAL-PREPARED-ACTUAL-BUILD-UNVERIFIED',
  requiredSourceFile: `${directory}/final24-source.json`, requiredBuildEnvironment: 'SPAROWTYPE_FINAL24_BUILD_ID',
  sourceInventory: { previousProposed: 506, expected: 504, proposedRemovedFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], actualFreezeVerification: 'PENDING' },
  testInventory: { specFiles: 64, rapidInputImePauseCasesRetained: true, caseCounts: 'Derived from actual collection/reports, no filtering or fixed prior total.' },
  serializerComparison: { iterations: 12, fixtureClientSessionId: 'source22-serializer-diagnostic',
    fixtureIdentifierIntentionallyPreserved: true, baselineProtocol: `${directory}/final22-serializer-profile-protocol.json`,
    baselineFixture: serializerBaseline.fixture, currentFixtureAndFingerprintComparison: 'PENDING-EXECUTION' },
  guarantees: ['Source23 scripts and all historical receipts remain unchanged.',
    'Historical date21 imports, original assertions, deadlines, retries, workers, raw outputs and capacity thresholds remain intact.',
    'All frozen entry-point inventory guards strictly require504 before actual execution.',
    'No production/E2E edits or build/browser/service/benchmark execution occurs during preparation.'],
  prepared, buildsRun: 0, servicesStarted: 0, browsersLaunched: 0, testsOrBenchmarksRun: 0,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PROPOSALS-PREPARED-NOT-RUN', files: prepared.map(item => item.file), expectedSourceFiles: 504, expectedSpecs: 64 }));
