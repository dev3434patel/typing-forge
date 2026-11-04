import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
const directory = 'audit/2026-11-02';
const names = ['pack-capacity-instance-source31.mjs', 'pack-capacity-instance-source31-wire.mjs', 'run-source31-capacity-burst.mjs', 'run-source31-capacity-wire-burst.mjs', 'run-source31-native-rate.mjs', 'native-rate-worker-source31.php'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runtime = phpRuntime(), prepared = [];
for (const name of names) {
  const originalFile = `${directory}/${name}`, outputFile = `${directory}/${name.replaceAll('source31', 'source33')}`;
  const original = await readFile(originalFile, 'utf8');
  let text = original;
  const transforms = [];
  for (const [from, to] of [['SOURCE31', 'SOURCE33'], ['FINAL31', 'FINAL33'], ['source31', 'source33'], ['final31', 'final33'], ['capacity31', 'capacity33'], ['rate-native31', 'rate-native33'], ['native-rate31', 'native-rate33']]) {
    const count = text.split(from).length - 1;
    if (count) { transforms.push({ from, to, count }); text = text.replaceAll(from, to); }
  }
  let reverse = text;
  for (const item of [...transforms].reverse()) reverse = reverse.replaceAll(item.to, item.from);
  assert.equal(reverse, original, 'Only declared identifier/source bindings may change.');
  await writeFile(outputFile, text, { flag: 'wx' });
  const syntax = name.endsWith('.php')
    ? spawnSync(runtime.binary, [...runtime.args, '-l', outputFile], { encoding: 'utf8', windowsHide: true })
    : spawnSync(process.execPath, ['--check', outputFile], { encoding: 'utf8', windowsHide: true });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
  prepared.push({ originalFile, outputFile, originalSha256: hash(original), outputSha256: hash(text), transforms, exactReversal: true, syntaxExit: syntax.status });
}
const sourceFile = `${directory}/final33-source.json`, source = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(Object.keys(source.sourceHashes).length, 505);
const report = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(), sourceFile, build: source.local.version, sourceFiles: 505,
  entry: `${directory}/pack-capacity-instance-source33-wire.mjs`, prepared,
  flags: { SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: 'password', SPAROWTYPE_PACK_HOLD: '1', SPAROWTYPE_PACK_KEEP_FAILURE: '1', SPAROWTYPE_SOURCE33_CAPACITY_ACCEPTANCE: '1', SPAROWTYPE_SOURCE33_CAPACITY_WIRE_ACCEPTANCE: '1', SPAROWTYPE_FINAL33_BUILD_ID: source.local.version },
  commandsInOrder: ['capacity33', 'capacity33-wire', 'rate-native33', 'cleanup'],
  nativeArenaLifecycle: { separateFreshOwner: true, entry: `${directory}/pack-capacity-instance-source33.mjs`, flags: { SPAROWTYPE_PACK_SUITES: 'password,arena-http', SPAROWTYPE_PACK_HOLD: '0' }, script: 'audit/mega-pack-2026-10-21/run-arena-http.mjs', original29AssertionsRetained: true },
  expectedOperationsPerRun: 1653, rooms: 50, accountsPerRoom: 8, concurrency: 20, p95StrictlyBelowMs: 150,
  retries: 0, filters: 0, productionOrTestFilesChangedByPreparation: false, servicesStarted: 0,
  runtimeOrDurabilityChanges: false, originalSource31FailuresRetained: true,
};
await writeFile('audit/2026-11-04/source33-capacity-preparation.json', `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, syntax: prepared.length, build: report.build, entry: report.entry }));
