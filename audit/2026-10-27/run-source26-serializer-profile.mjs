// Run only after root GO, with --experimental-transform-types for the actual
// portable SessionController. This is one pure diagnostic, never an HTTP retry.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE26_SERIALIZER_PROFILE, '1');
const build = process.env.SPAROWTYPE_FINAL26_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/);
const directory = 'audit/2026-10-27', prefix = `${directory}/final26-serializer-profile`;
for (const file of [`${prefix}.json`, `${prefix}-protocol.json`]) await assert.rejects(access(file), { code: 'ENOENT' });
const before = await verifyFrozenSource(`${directory}/final26-source.json`);
assert.equal(before.frozen.local.version, build); assert.equal(before.receipt.compared, 505); assert.deepEqual(before.receipt.mismatches, []);
const inputs = [`${directory}/run-source26-serializer-profile.mjs`, `${directory}/benchmark-validator-source26.php`, 'backend/src/SessionValidator.php', 'scripts/php-runtime.mjs'];
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, await digest(file)])));
const target = Array.from({ length: 800 }, (_, index) => ['calm', 'clear', 'river', 'focus'][index % 4]).join(' ');
let now = 0;
const wall = Date.UTC(2026, 9, 27, 12), owner = '11111111-1111-4111-8111-111111111111';
const controller = new SessionController({ clientSessionId: 'source22-serializer-diagnostic', ownerScope: owner, mode: 'race', durationMs: 30000, initialTarget: target, correctionPolicy: 'current-word', inputMethod: 'keyboard', language: 'en', keyboardLayout: 'qwerty' }, { now: () => now, wallNow: () => wall + now });
controller.startAt(0, wall);
for (const [index, text] of [...target.slice(0, 10)].entries()) { now = 100 + index * 80 + index % 3 * 3; controller.input({ type: 'insert', text }); }
now = 15000;
const candidate = controller.checkpoint(), fixture = JSON.stringify(candidate);
const protocol = { declaredAt: new Date().toISOString(), build, source: before.receipt,
  scope: 'One pure PHP CPU timing diagnostic over an actual portable800-word/10-event/15-second interim checkpoint. Synthetic event fixture clock; CPU durations use native hrtime. No browser/network/database/config/server.',
  iterations: 12, fixture: { words: 800, events: candidate.events.length, characters: candidate.characters.length, timeSeries: candidate.timeSeries.length, elapsedMs: candidate.elapsedMs, utf8JsonBytes: Buffer.byteLength(fixture), sha256: createHash('sha256').update(fixture).digest('hex') },
  inputHashes: hashes, retries: 0, productSourceChanged: false, candidateOrSecretsPublished: false };
await writeFile(`${prefix}-protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const runtime = phpRuntime(), started = performance.now();
const run = spawnSync(runtime.binary, [...runtime.args, `${directory}/benchmark-validator-source26.php`], { input: JSON.stringify({ candidate }), encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 128000 });
let result = null, failure = null;
try { result = JSON.parse(run.stdout); } catch { failure = { code: 'diagnostic-child-output', exitCode: run.status }; }
const after = await verifyFrozenSource(`${directory}/final26-source.json`);
const inputsUnchanged = (await Promise.all(inputs.map(async file => await digest(file) === hashes[file]))).every(Boolean);
const passed = run.status === 0 && !run.stderr && result?.status === 'PASS-SCOPED-PURE-DIAGNOSTIC' && result?.canonicalFingerprint && after.receipt.mismatches.length === 0 && inputsUnchanged;
const report = { status: passed ? 'PASS-SCOPED-DIAGNOSTIC' : 'FAILED', protocol, finishedAt: new Date().toISOString(), totalProcessMs: performance.now() - started, exitCode: run.status, childTimedOut: run.error?.code === 'ETIMEDOUT', diagnosticsBytes: Buffer.byteLength(run.stderr ?? ''), failure, result, sourceAfter: after.receipt, inputsUnchanged, noAcceptanceResultReplaced: true };
await writeFile(`${prefix}.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, report: `${prefix}.json`, summaries: result?.summaries }));
process.exitCode = passed ? 0 : 1;
