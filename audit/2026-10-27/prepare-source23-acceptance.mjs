// Proposals only. This generator launches no build, service, browser or test.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-10-27';
const digest = value => createHash('sha256').update(value).digest('hex');
const identities = [
  ['final22', 'final23'], ['FINAL22', 'FINAL23'], ['source22', 'source23'], ['SOURCE22', 'SOURCE23'],
  ['Source22', 'Source23'], ['capacity22', 'capacity23'], ['rate-native22', 'rate-native23'], ['native-rate22', 'native-rate23'],
];
const additions = {
  'run-final22-browser-matrix.mjs': [
    ['assert.equal(source.frozen.local.version, expectedBuild);', 'assert.equal(source.frozen.local.version, expectedBuild);\nassert.equal(source.receipt.compared, 506);', 1],
    ['currentSourceFileCount: 504', "currentSourceFileCount: 506, declaredSource23Files: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], existingMobileInputSpecAdditionalCasesDeclared: 3", 1],
  ],
  'run-final22-static.mjs': [
    ['assert.equal(initial.frozen.local.version, expectedBuild);', 'assert.equal(initial.frozen.local.version, expectedBuild);\nassert.equal(initial.receipt.compared, 506);', 1],
  ],
  'run-final22-native-browser.mjs': [
    ['assert.equal(initial.frozen.local.version, build);', 'assert.equal(initial.frozen.local.version, build);\nassert.equal(initial.receipt.compared, 506);', 1],
  ],
  'run-mobile-workspaces-static-final22.mjs': [
    ['assert.equal(frozen.frozen.local.version, sourceIdentity);', 'assert.equal(frozen.frozen.local.version, sourceIdentity);\nassert.equal(frozen.receipt.compared, 506);', 1],
  ],
  'run-source22-capacity-burst.mjs': [
    ['assert.ok(sourceBefore.receipt.compared >= 500);', 'assert.ok(sourceBefore.receipt.compared >= 500);\nassert.equal(sourceBefore.receipt.compared, 506);', 1],
  ],
  'run-source22-native-rate.mjs': [
    ['assert.equal(sourceBefore.frozen.local.version, build);', 'assert.equal(sourceBefore.frozen.local.version, build);\nassert.equal(sourceBefore.receipt.compared, 506);', 1],
  ],
  'run-final22-native-modules.mjs': [
    ['before.receipt.compared, 504', 'before.receipt.compared, 506', 1],
    ['report.sourceAfter.compared === 504', 'report.sourceAfter.compared === 506', 1],
    ["sourceInventoryExtension: { previousCount: 502, expectedCount: 504, addedFiles: ['src/lib/pressed-key-attribute.ts', 'src/lib/__tests__/pressed-key-attribute.test.ts'], reason: 'The frozen src inventory includes the new attribute helper and its source unit test.' }", "sourceInventoryExtension: { previousCount: 504, expectedCount: 506, addedFiles: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], reason: 'The proposed source23 inventory adds the frame publisher and its source unit test; execution requires the actual frozen inventory to match506.' }", 1],
  ],
  'run-source22-serializer-profile.mjs': [
    ['assert.equal(before.frozen.local.version, build);', 'assert.equal(before.frozen.local.version, build); assert.equal(before.receipt.compared, 506);', 1],
    ["clientSessionId: 'source23-serializer-diagnostic'", "clientSessionId: 'source22-serializer-diagnostic'", 1],
  ],
};
const originals = [
  'pack-backend-instance-source22.mjs', 'run-source22-capacity-burst.mjs', 'run-source22-native-rate.mjs',
  'native-rate-worker-source22.php', 'run-browser-checkpoint-final22.mjs', 'run-final22-browser-matrix.mjs',
  'run-final22-static.mjs', 'run-final22-native-browser.mjs', 'run-final22-native-modules.mjs',
  'measure-mobile-workspaces-static-final22.mjs', 'run-mobile-workspaces-static-final22.mjs',
  'run-source22-serializer-profile.mjs', 'benchmark-validator-source22.php',
];
const prepared = [];
for (const name of originals) {
  const originalFile = `${directory}/${name}`;
  const file = `${directory}/${name.replaceAll('source22', 'source23').replaceAll('final22', 'final23')}`;
  const original = await readFile(originalFile, 'utf8');
  let text = original;
  const substitutions = [];
  for (const [before, after, expectedCount] of [...identities, ...(additions[name] ?? [])]) {
    const count = text.split(before).length - 1;
    if (expectedCount !== undefined) assert.equal(count, expectedCount, `Adapter cardinality: ${name}: ${before}`);
    if (!count) continue;
    text = text.replaceAll(before, after); substitutions.push({ before, after, count });
  }
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, 'Every proposal must reverse byte-for-byte to its preserved source22 wrapper.');
  await writeFile(file, text, { flag: 'wx' });
  prepared.push({ originalFile, originalSha256: digest(original), file, sha256: digest(text), substitutions, reversibleByteIdentity: true });
}
for (const item of prepared) assert.equal(digest(await readFile(item.originalFile)), item.originalSha256);
const serializerBaseline = JSON.parse(await readFile(`${directory}/final22-serializer-profile-protocol.json`, 'utf8'));
assert.equal(serializerBaseline.iterations, 12);
await writeFile(`${directory}/source23-wrapper-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PROPOSAL-PREPARED-NOT-VERIFIED-AGAINST-ACTUAL-BUILD',
  sourceFileRequiredAtExecution: `${directory}/final23-source.json`, buildEnvironment: 'SPAROWTYPE_FINAL23_BUILD_ID',
  expectedSourceInventory: { previous: 504, proposed: 506, additions: ['src/lib/frame-publisher.ts', 'src/lib/__tests__/frame-publisher.test.ts'], actualFreezeVerification: 'PENDING' },
  expectedSpecInventory: { count: 64, existingMobileInputAdditionalCases: 3, caseCounts: 'Derived from actual browser reports; no fixed old case count or filtering.' },
  serializerComparison: { iterations: 12, preservedFixedFixtureClientSessionId: 'source22-serializer-diagnostic',
    reason: 'The fixed identifier is fixture data, retained for byte-identical800-word/10-event/15s comparison rather than renamed as an output identity.',
    baselineProtocol: `${directory}/final22-serializer-profile-protocol.json`, baselineFixture: serializerBaseline.fixture,
    currentFixtureAndCanonicalFingerprintComparison: 'PENDING-ACTUAL-SOURCE23-EXECUTION' },
  guarantees: ['Historical date21 imports and all source22 scripts/receipts preserved.',
    'All existing test assertions, deadlines, workers, retries, raw outputs, request counts and capacity thresholds retained.',
    'Frozen entry-point guards additionally require the anticipated506-file identity before execution.',
    'No production or E2E edits, services, builds, browsers or measurements occur during preparation.'],
  prepared, buildsRun: 0, servicesStarted: 0, browsersLaunched: 0, testsOrBenchmarksRun: 0,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PROPOSALS-PREPARED-NOT-RUN', files: prepared.map(item => item.file), expectedSourceFiles: 506, expectedSpecs: 64 }));
