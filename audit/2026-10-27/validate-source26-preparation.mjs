// Syntax, adapter and declared-coverage validation only. No acceptance runs.
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27', preparationFile = `${directory}/source26-wrapper-preparation.json`;
const preparation = JSON.parse(await readFile(preparationFile, 'utf8'));
assert.equal(preparation.prepared.length, 17);
const runtime = phpRuntime(), syntax = [], adapters = [];
for (const item of preparation.prepared) {
  const original = await readFile(item.originalFile, 'utf8'), actual = await readFile(item.file, 'utf8');
  assert.equal(hash(original), item.originalSha256); assert.equal(hash(actual), item.sha256);
  let reversed = actual;
  for (const adapter of [...item.substitutions].reverse()) reversed = reversed.replaceAll(adapter.after, adapter.before);
  assert.equal(reversed, original);
  if (item.file.endsWith('.json')) JSON.parse(actual);
  else {
    const php = item.file.endsWith('.php');
    const check = spawnSync(php ? runtime.binary : process.execPath, php ? [...runtime.args, '-l', item.file] : ['--check', item.file], { windowsHide: true, encoding: 'utf8', timeout: 10000, maxBuffer: 100000 });
    assert.equal(check.status, 0, item.file);
    syntax.push({ file: item.file, language: php ? 'PHP' : 'JavaScript', pass: true });
    assert.ok(!/compared, 504|compared === 504/.test(actual), 'Current26 runtime guards must require505.');
  }
  const historical = original.match(/(?:\.\.\/)?2026-10-21\/[^'"`\s,)]+/g) ?? [];
  for (const location of historical) assert.equal(actual.split(location).length, original.split(location).length);
  adapters.push({ file: item.file, originalFile: item.originalFile, originalUnchanged: true, reversibleByteIdentity: true, historicalDate21ImportOccurrencesUnchanged: historical.length });
}
for (const name of ['prepare-source26-acceptance.mjs', 'verify-source26-ui-evidence-reuse.mjs', 'validate-source26-preparation.mjs']) {
  const file = `${directory}/${name}`, check = spawnSync(process.execPath, ['--check', file], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(check.status, 0, file); syntax.push({ file, language: 'JavaScript', pass: true });
}
const actualSpecs = (await readdir('e2e')).filter(file => file.endsWith('.spec.ts'));
assert.equal(actualSpecs.length, 64);
const serializer = await readFile(`${directory}/run-source26-serializer-profile.mjs`, 'utf8');
assert.ok(serializer.includes('source22-serializer-diagnostic')); assert.ok(!serializer.includes('source26-serializer-diagnostic'));
const plan25 = JSON.parse(await readFile(`${directory}/final25-portable-deno-plan.json`, 'utf8'));
const plan26 = JSON.parse(await readFile(`${directory}/final26-portable-deno-plan.json`, 'utf8'));
for (const key of ['release', 'archive', 'checksumSidecar']) assert.deepEqual(plan26[key], plan25[key]);
assert.equal(plan26.workspaceDirectory, 'audit/2026-10-27/.final26-runtime');
const ignored = spawnSync('git', ['check-ignore', plan26.binaryRelativePath], { windowsHide: true, encoding: 'utf8', timeout: 5000 });
assert.equal(ignored.status, 0); assert.equal(ignored.stdout.trim(), plan26.binaryRelativePath);
await assert.rejects(access(plan26.workspaceDirectory), { code: 'ENOENT' });
const five = await readFile(`${directory}/run-final26-native-modules.mjs`, 'utf8'), eight = await readFile(`${directory}/run-final26-native-ci.mjs`, 'utf8');
assert.ok(five.includes("const suites = ['progression', 'social', 'classroom', 'arena-http', 'password'];") && five.includes('results.length === 5'));
assert.ok(eight.includes("const suites = ['data', 'race', 'course', 'progression', 'social', 'classroom', 'arena-http', 'password'];") && eight.includes('results.length === 8'));
const proofFile = `${directory}/verify-source26-ui-evidence-reuse.mjs`, proof = await readFile(proofFile, 'utf8');
assert.ok(proof.includes('final24-ui-byte-baseline-before25.json'));
assert.ok(proof.includes("assert.deepEqual(changedBackendFiles, ['backend/public/index.php', 'backend/src/RequestBody.php']"));
assert.ok(proof.includes('assert.equal(frozen26.receipt.compared, 505)'));
const report = { status: 'PASS-PREPARATION-ONLY', recordedAt: new Date().toISOString(), preparationFile, preparationSha256: hash(await readFile(preparationFile)), expectedSourceFiles: 505, actualSource26FreezeChecked: false, actualE2eSpecFiles: actualSpecs.length, syntax, adapters,
  source24UiProof: { file: proofFile, sha256: hash(await readFile(proofFile)), baseline: 'audit/2026-10-27/final24-ui-byte-baseline-before25.json', nonbackendFiles: 467, rawDistFiles: 142, publicAssets: 133, onlyAllowedChanges: ['backend/public/index.php', 'backend/src/RequestBody.php'], actualComparison: 'PENDING-FREEZE' },
  serializerFixturePreserved: 'source22-serializer-diagnostic', portableDenoOfficialVersionAndDigestsPreserved: '2.9.8', portableDenoDirectoryCreated: false, bothNativeScopesPreserved: { five: 5, ciEight: 8 },
  productionOrE2eEditsMade: false, buildsRun: 0, servicesStarted: 0, browsersStarted: 0, downloadsRun: 0, acceptanceTestsOrTypechecksRun: 0, historicalReceiptsChanged: false };
const output = `${directory}/source26-wrapper-preparation-validation.json`;
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, adaptedFiles: adapters.length, syntaxChecks: syntax.length, proposedSourceFiles: 505, specs: actualSpecs.length }));
