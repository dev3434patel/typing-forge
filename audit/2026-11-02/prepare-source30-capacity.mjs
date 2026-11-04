// Preparation/syntax only. Never imports acceptance entries or starts services.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const directory = 'audit/2026-11-02';
const oldDirectory = 'audit/2026-10-27';
const source = JSON.parse(await readFile(`${directory}/final30-source.json`, 'utf8'));
const expectedCount = Object.keys(source.sourceHashes).length;
assert.equal(expectedCount, 506);
assert.equal(source.local.version, '7ba3b401fc95acc7eede');
const files = [
  'pack-backend-instance-source26.mjs',
  'pack-backend-instance-source26-wire.mjs',
  'run-source26-capacity-burst.mjs',
  'run-source26-capacity-wire-burst.mjs',
  'run-source26-native-rate.mjs',
  'native-rate-worker-source26.php',
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const prepared = [];
const runtime = phpRuntime();
for (const name of files) {
  const originalFile = `${oldDirectory}/${name}`;
  const outputFile = `${directory}/${name.replaceAll('source26', 'source30')}`;
  const original = await readFile(originalFile, 'utf8');
  let text = original;
  const substitutions = [];
  for (const [before, after] of [
    [oldDirectory, directory],
    ['SOURCE26', 'SOURCE30'],
    ['FINAL26', 'FINAL30'],
    ['source26', 'source30'],
    ['final26', 'final30'],
    ['capacity26', 'capacity30'],
    ['rate-native26', 'rate-native30'],
    ['native-rate26', 'native-rate30'],
    ['sourceBefore.receipt.compared, 505', 'sourceBefore.receipt.compared, 506'],
  ]) {
    const count = text.split(before).length - 1;
    if (!count) continue;
    text = text.replaceAll(before, after);
    substitutions.push({ before, after, count });
  }
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, `Exact byte reversal for ${name}`);
  await writeFile(outputFile, text, { flag: 'wx' });
  const php = name.endsWith('.php');
  const syntax = spawnSync(php ? runtime.binary : process.execPath, php ? [...runtime.args, '-l', outputFile] : ['--check', outputFile], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  assert.equal(syntax.status, 0, `${outputFile}: ${syntax.stderr}`);
  assert.equal(digest(await readFile(originalFile)), digest(original));
  prepared.push({ originalFile, originalSha256: digest(original), outputFile, sha256: digest(text), substitutions, reversibleByteIdentity: true, syntaxExitCode: syntax.status });
}
const originalOwner = await readFile(`${oldDirectory}/pack-backend-instance-source26-wire.mjs`, 'utf8');
const currentOwner = await readFile(`${directory}/pack-backend-instance-source30-wire.mjs`, 'utf8');
assert.equal(originalOwner.split('ThreadLimit').length, currentOwner.split('ThreadLimit').length);
const report = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  frozenSource: `${directory}/final30-source.json`, build: source.local.version, expectedSourceFiles: expectedCount,
  prepared, scope: 'New checkpoint bindings only; original full and production-wire HTTP workload, assertions, concurrency, event pacing, deadlines and strict latency threshold unchanged. Original source26 failures retained.',
  entry: `${directory}/pack-backend-instance-source30-wire.mjs`,
  startupFlags: { SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: 'password', SPAROWTYPE_PACK_HOLD: '1', SPAROWTYPE_PACK_KEEP_FAILURE: '1', SPAROWTYPE_SOURCE30_CAPACITY_ACCEPTANCE: '1', SPAROWTYPE_SOURCE30_CAPACITY_WIRE_ACCEPTANCE: '1', SPAROWTYPE_FINAL30_BUILD_ID: source.local.version },
  commandsInOrder: ['capacity30', 'capacity30-wire', 'cleanup'],
  onlyAfterCoordinatedRootGo: true, expectedArenaOperationsPerRun: 1653, rooms: 50, accountsPerRoom: 8, concurrency: 20,
  exactAcceptedSubmissionsPerRun: 400, exactLeavesPerRun: 400, p95StrictlyBelowMs: 150,
  originalRuntimeUnchanged: { apacheThreads: 64, keepAlive: true, keepAliveTimeoutSeconds: 2, opcacheExtensionLoaded: false, mysqlDurabilitySettingsChanged: false },
  sameOwnerPairLimitations: 'Full first, compact second, with separate fixture accounts. No controlled exclusive percentage attribution; cache/order effects remain possible.',
  independentRateCheckPreparedButNotRequiredByHandleQueryChange: true,
  productionFilesChangedDuringPreparation: false, servicesStarted: 0, capacityRunsExecuted: 0, browserJobsStarted: 0,
};
await writeFile(`${directory}/source30-capacity-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, prepared: prepared.length, syntaxPasses: prepared.length, expectedSourceFiles: expectedCount, build: source.local.version, entry: report.entry }));
