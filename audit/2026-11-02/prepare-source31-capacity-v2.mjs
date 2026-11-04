// Preparation/syntax only. Never imports acceptance entries or starts services.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const directory = 'audit/2026-11-02';
const oldDirectory = 'audit/2026-10-27';
const source = JSON.parse(await readFile(`${directory}/final31-source.json`, 'utf8'));
const expectedCount = Object.keys(source.sourceHashes).length;
assert.equal(expectedCount, 505);
assert.match(source.local.version, /^[a-f0-9]{20}$/);
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
  const outputFile = `${directory}/${name.replaceAll('source26', 'source31').replace('pack-backend-instance', 'pack-capacity-instance')}`;
  const original = await readFile(originalFile, 'utf8');
  let text = original;
  const substitutions = [];
  for (const [before, after] of [
    [oldDirectory, directory],
    ['pack-backend-instance-source26', 'pack-capacity-instance-source31'],
    ['SOURCE26', 'SOURCE31'],
    ['FINAL26', 'FINAL31'],
    ['source26', 'source31'],
    ['final26', 'final31'],
    ['capacity26', 'capacity31'],
    ['rate-native26', 'rate-native31'],
    ['native-rate26', 'native-rate31'],
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
const currentOwner = await readFile(`${directory}/pack-capacity-instance-source31-wire.mjs`, 'utf8');
assert.equal(originalOwner.split('ThreadLimit').length, currentOwner.split('ThreadLimit').length);
const report = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  frozenSource: `${directory}/final31-source.json`, build: source.local.version, expectedSourceFiles: expectedCount,
  prepared, scope: 'New checkpoint bindings only; original full and production-wire HTTP workload, assertions, concurrency, event pacing, deadlines and strict latency threshold unchanged. Original source26 failures retained.',
  entry: `${directory}/pack-capacity-instance-source31-wire.mjs`,
  startupFlags: { SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: 'password', SPAROWTYPE_PACK_HOLD: '1', SPAROWTYPE_PACK_KEEP_FAILURE: '1', SPAROWTYPE_SOURCE31_CAPACITY_ACCEPTANCE: '1', SPAROWTYPE_SOURCE31_CAPACITY_WIRE_ACCEPTANCE: '1', SPAROWTYPE_FINAL31_BUILD_ID: source.local.version },
  commandsInOrder: ['capacity31', 'capacity31-wire', 'cleanup'],
  onlyAfterCoordinatedRootGo: true, expectedArenaOperationsPerRun: 1653, rooms: 50, accountsPerRoom: 8, concurrency: 20,
  exactAcceptedSubmissionsPerRun: 400, exactLeavesPerRun: 400, p95StrictlyBelowMs: 150,
  originalRuntimeUnchanged: { apacheThreads: 64, keepAlive: true, keepAliveTimeoutSeconds: 2, opcacheExtensionLoaded: false, mysqlDurabilitySettingsChanged: false },
  sameOwnerPairLimitations: 'Full first, compact second, with separate fixture accounts. No controlled exclusive percentage attribution; cache/order effects remain possible.',
  independentRateCheckPreparedButNotRequiredByHandleQueryChange: true,
  productionFilesChangedDuringPreparation: false, servicesStarted: 0, capacityRunsExecuted: 0, browserJobsStarted: 0,
};
await writeFile(`${directory}/source31-capacity-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, prepared: prepared.length, syntaxPasses: prepared.length, expectedSourceFiles: expectedCount, build: source.local.version, entry: report.entry }));
