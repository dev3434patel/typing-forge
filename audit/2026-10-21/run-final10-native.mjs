import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { open, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL10_NATIVE_WINDOW, '1');
const directory = 'audit/2026-10-21';
const sourceFile = `${directory}/final10-source.json`;
const initial = await verifyFrozenSource(sourceFile);
assert.match(process.env.SPAROWTYPE_FINAL10_BUILD_ID ?? '', /^[a-f0-9]{20}$/);
assert.equal(initial.frozen.local.version, process.env.SPAROWTYPE_FINAL10_BUILD_ID);
assert.deepEqual(initial.receipt.mismatches, []);
const inputs = ['audit/2026-10-21/pack-backend-instance.mjs', 'audit/2026-10-21/pack-apache-runtime.mjs', 'backend/tests/pack-social-lifecycle.mjs', 'backend/tests/pack-social-fixture.php', 'backend/tests/race-lifecycle.mjs', 'backend/tests/race-fixtures.php'];
const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const output = `${directory}/final10-native.json`, handle = await open(output, 'wx');
const report = { status: 'RUNNING', declaredAt: new Date().toISOString(), build: initial.frozen.local,
  scope: 'Fresh isolated Apache/PHP/PDO and owned MariaDB. Synthetic guarded HTTP evidence for private duels, ranked challenge timing and retained human race contracts. No physical typing, capacity, original DB migration or hosted acceptance.',
  source: initial.receipt, inputs: hashes, suites: ['social', 'race'], automaticRetries: 0, resultFiltering: false,
  originals: { configRead: false, databaseConnected: false, protectedPorts: [3306, 3307, 3308, 8081, 4173] } };
const log = await open(`${directory}/final10-native.log`, 'wx');
let stdout = '', stderr = '';
try {
  const child = spawn(process.execPath, [`${directory}/pack-backend-instance.mjs`], { windowsHide: true,
    env: { ...process.env, SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: 'social,race', SPAROWTYPE_PACK_HOLD: '0', SPAROWTYPE_PACK_KEEP_FAILURE: '1', SPAROWTYPE_PACK_ATTEMPT_REASON: 'Declared source9 first-input ranked/private-duel timing acceptance and retained legacy/shared-room contracts; no capacity load or browser jobs.' },
    stdio: ['ignore', 'pipe', 'pipe'] });
  report.pid = child.pid;
  child.stdout.on('data', bytes => { stdout += bytes; process.stdout.write(bytes); });
  child.stderr.on('data', bytes => { stderr += bytes; process.stderr.write(bytes); });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  report.events = stdout.split(/\r?\n/).filter(Boolean).flatMap(line => { try { return [JSON.parse(line)]; } catch { return []; } });
  report.status = report.exitCode === 0 ? 'PASS-SCOPED' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.error = { name: error.name, message: error.message }; }
finally {
  await log.writeFile(stdout + stderr); await log.close();
  const after = await verifyFrozenSource(sourceFile); report.sourceAfter = after.receipt;
  report.inputsUnchanged = (await Promise.all(inputs.map(async file => hash(await readFile(file)) === hashes[file]))).every(Boolean);
  if (after.receipt.mismatches.length || !report.inputsUnchanged) report.status = 'FAILED';
  report.finishedAt = new Date().toISOString(); await handle.writeFile(JSON.stringify(report, null, 2)); await handle.close();
}
console.log(JSON.stringify({ output, status: report.status, exitCode: report.exitCode }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
