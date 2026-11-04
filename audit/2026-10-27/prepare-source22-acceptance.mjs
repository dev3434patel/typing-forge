// Preparation only. No browser, build, server or acceptance test is launched.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-10-27';
const hash = value => createHash('sha256').update(value).digest('hex');
const prepared = [];
const identities = [
  ['final21', 'final22'], ['FINAL21', 'FINAL22'], ['source21', 'source22'], ['SOURCE21', 'SOURCE22'],
  ['Source21', 'Source22'], ['capacity21', 'capacity22'], ['rate-native21', 'rate-native22'], ['native-rate21', 'native-rate22'],
];
async function adapt(from, to, substitutions) {
  const original = await readFile(from, 'utf8');
  let text = original;
  const applied = [];
  for (const [before, after, required] of substitutions) {
    const count = text.split(before).length - 1;
    if (required !== undefined) assert.equal(count, required, `Exact adapter cardinality: ${from}: ${before}`);
    if (!count) continue;
    text = text.replaceAll(before, after);
    applied.push({ before, after, count });
  }
  let reversed = text;
  for (const item of [...applied].reverse()) reversed = reversed.replaceAll(item.after, item.before);
  assert.equal(reversed, original, `All declared adapter changes must reverse exactly: ${to}`);
  await writeFile(to, text, { flag: 'wx' });
  prepared.push({ original: from, originalSha256: hash(original), adapter: to, adapterSha256: hash(text), substitutions: applied, reversibleByteIdentity: true });
}
const names = [
  'pack-backend-instance-source21.mjs', 'run-source21-capacity-burst.mjs', 'run-source21-native-rate.mjs',
  'native-rate-worker-source21.php', 'run-browser-checkpoint-final21.mjs', 'run-final21-static.mjs',
  'run-final21-native-browser.mjs', 'measure-mobile-workspaces-static-final21.mjs',
  'run-mobile-workspaces-static-final21.mjs',
];
for (const name of names)
  await adapt(`${directory}/${name}`, `${directory}/${name.replaceAll('source21', 'source22').replaceAll('final21', 'final22')}`, identities);

await adapt(`${directory}/run-final21-browser-matrix.mjs`, `${directory}/run-final22-browser-matrix.mjs`, [
  ...identities,
  ["{ id: 'existing', files: baseline.ordinary.files, workers: 1 }", "{ id: 'existing', files: [...baseline.ordinary.files, 'e2e/keycap-attribute-ownership.spec.ts'], workers: 1 }", 1],
  ["assert.equal(actual.length, 63, 'Source22 includes the PWA snapshot consistency spec exactly once.');", "assert.equal(actual.length, 64, 'Source22 includes the new keycap attribute ownership spec and every prior spec exactly once.');", 1],
  ["const report = { executionProfile,", "const coverageExtension = { previousSpecCount: 63, currentSpecCount: 64, addedExactlyOnceToExistingBatch: 'e2e/keycap-attribute-ownership.spec.ts', declaredNewSourceFile: 'src/lib/pressed-key-attribute.ts', currentSourceFileCount: 503, testCasesDerivedFromActualReports: true, existingSpecAssertionsAndDeadlinesUnchanged: true };\nconst report = { executionProfile, coverageExtension,", 1],
]);

await adapt('audit/2026-10-21/run-final19-native-modules.mjs', `${directory}/run-final22-native-modules.mjs`, [
  ['final19', 'final22'], ['FINAL19', 'FINAL22'], ['source19', 'source22'],
  ["import { access, open } from 'node:fs/promises';", "import { access, open, readFile } from 'node:fs/promises';\nimport { createHash } from 'node:crypto';", 1],
  ["from './artifact-verification.mjs'", "from '../2026-10-21/artifact-verification.mjs'", 1],
  ["const build = 'de097acba6969d580cc8';", "const build = process.env.SPAROWTYPE_FINAL22_BUILD_ID;", 1],
  ['assert.equal(process.env.SPAROWTYPE_FINAL22_BUILD_ID, build);', "assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the actual newly frozen source22 build.');", 1],
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-10-27';", 1],
  ['before.receipt.compared, 502', 'before.receipt.compared, 503', 1],
  ['report.sourceAfter.compared === 502', 'report.sourceAfter.compared === 503', 1],
  ['`${directory}/pack-backend-instance.mjs`', '`${directory}/pack-backend-instance-source22.mjs`', 1],
  ["const suites = ['progression', 'social', 'classroom', 'arena-http', 'password'];", "const suites = ['progression', 'social', 'classroom', 'arena-http', 'password'];\nconst inputFiles = [import.meta.filename, `${directory}/pack-backend-instance-source22.mjs`, 'audit/2026-10-21/pack-apache-runtime.mjs', 'scripts/php-runtime.mjs', 'backend/tests/pack-progression-lifecycle.mjs', 'backend/tests/pack-social-lifecycle.mjs', 'backend/tests/classroom-lifecycle.mjs', 'audit/mega-pack-2026-10-21/run-arena-http.mjs', 'backend/tests/password-policy.php'];\nconst digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');\nconst inputHashes = Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, await digest(file)])));", 1],
  ["sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false,", "sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false, inputHashes,\n  sourceInventoryExtension: { previousCount: 502, expectedCount: 503, addedProductionFile: 'src/lib/pressed-key-attribute.ts' },", 1],
  ["report.sourceAfter = (await verifyFrozenSource(`${directory}/final22-source.json`)).receipt;", "report.sourceAfter = (await verifyFrozenSource(`${directory}/final22-source.json`)).receipt;\n  report.harnessInputsUnchanged = (await Promise.all(inputFiles.map(async file => await digest(file) === inputHashes[file]))).every(Boolean);", 1],
  ["&& report.sourceAfter.mismatches.length === 0 ? 'PASS-SCOPED'", "&& report.sourceAfter.mismatches.length === 0 && report.harnessInputsUnchanged === true ? 'PASS-SCOPED'", 1],
]);

for (const item of prepared) {
  assert.equal(hash(await readFile(item.original)), item.originalSha256, 'No historical script may be changed by preparation.');
  assert.equal(hash(await readFile(item.adapter)), item.adapterSha256);
}
await writeFile(`${directory}/source22-wrapper-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  preservedSource21History: true, historicalDatesAndImportsPreserved: true,
  sourceIdentityExpectedAtExecution: `${directory}/final22-source.json`, buildEnvironment: 'SPAROWTYPE_FINAL22_BUILD_ID',
  coverageExtension: { previousSourceFiles: 502, expectedSourceFiles: 503, addedProductionFile: 'src/lib/pressed-key-attribute.ts',
    previousSpecs: 63, currentSpecs: 64, addedSpec: 'e2e/keycap-attribute-ownership.spec.ts',
    existingBatchExtendedExactlyOnce: true, caseCountsFromActualRunnerReports: true,
    otherExistingTestExtensions: 'Existing live-keyboard geometry definitions remain included without filtering.' },
  quality: 'Original input, 3D, test assertions, timeouts, actual request counts, capacity thresholds, cleanup and privacy boundaries remain unchanged. Native module wrapper strengthens before/after harness provenance.',
  buildsRun: 0, servicesStarted: 0, browsersLaunched: 0, acceptanceTestsRun: 0, prepared,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', files: prepared.map(item => item.adapter), reversibleAdapters: prepared.length }));
