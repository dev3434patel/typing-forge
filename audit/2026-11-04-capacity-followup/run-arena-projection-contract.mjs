import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const directory = 'audit/2026-11-04-capacity-followup';
const sha = value => createHash('sha256').update(value).digest('hex');
const runtime = phpRuntime();
const inputs = ['backend/src/ArenaService.php', `${directory}/ArenaServiceProjectionCandidate.php`, `${directory}/arena-projection-contract.php`, `${directory}/arena-projection-preparation.json`, 'scripts/php-runtime.mjs'];
const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, sha(await readFile(file))])));
assert.equal(hashes[`${directory}/arena-projection-contract.php`], '1be9d5d067da621c02652e96ab97c1373ec95d13c01bb714fbed1a6572b5756b');
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.deepEqual(frozen.receipt.mismatches, []);
const protocol = { declaredAt: new Date().toISOString(), kind: 'pure-unconnected-PDO-projection-parity-contract', source: frozen.receipt, hashes, iterations: 1, retries: 0, noServices: true, noBootstrap: true, noConfigurationRead: true, gainClaim: 'UNMEASURED' };
await writeFile(`${directory}/arena-projection-contract-protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const syntax = [];
for (const file of [`${directory}/ArenaServiceProjectionCandidate.php`, `${directory}/arena-projection-contract.php`]) {
  const result = spawnSync(runtime.binary, [...runtime.args, '-l', file], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  syntax.push({ file, exit: result.status, stdout: result.stdout, stderr: result.stderr });
}
await writeFile(`${directory}/arena-projection-contract-syntax.json`, JSON.stringify(syntax, null, 2) + '\n', { flag: 'wx' });
assert.ok(syntax.every(row => row.exit === 0));
const run = spawnSync(runtime.binary, [...runtime.args, `${directory}/arena-projection-contract.php`], { encoding: 'utf8', windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
await writeFile(`${directory}/arena-projection-contract-stdout.json`, run.stdout, { flag: 'wx' });
await writeFile(`${directory}/arena-projection-contract-stderr.log`, run.stderr, { flag: 'wx' });
const after = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
const unchanged = await Promise.all(inputs.map(async file => ({ file, unchanged: sha(await readFile(file)) === hashes[file] })));
let parsed = null;
try { parsed = JSON.parse(run.stdout); } catch {}
const result = { recordedAt: new Date().toISOString(), status: run.status === 0 && parsed?.failed === 0 ? 'PASS-SCOPED-PURE' : 'FAILED', childExit: run.status, raw: parsed, syntaxPassed: syntax.every(row => row.exit === 0), sourceAfter: after.receipt, inputs: unchanged, unchanged: after.receipt.mismatches.length === 0 && unchanged.every(row => row.unchanged), noServicesStarted: true, nativeLocksAndCapacity: 'UNVERIFIED', performanceGain: 'UNMEASURED' };
await writeFile(`${directory}/arena-projection-contract-result.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, childExit: run.status, passed: parsed?.passed, failed: parsed?.failed, unchanged: result.unchanged, stderrBytes: Buffer.byteLength(run.stderr) }));
if (result.status !== 'PASS-SCOPED-PURE' || !result.unchanged) process.exitCode = 1;
