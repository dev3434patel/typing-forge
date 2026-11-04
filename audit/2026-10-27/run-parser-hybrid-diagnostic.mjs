import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

assert.equal(process.env.SPAROWTYPE_PARSER_HYBRID_DIAGNOSTIC, '1');
const prefix = 'audit/2026-10-27/parser-hybrid-diagnostic';
for (const suffix of ['-protocol.json', '-result.json', '-main.stdout.json', '-old-memory.stdout.json', '-hybrid-memory.stdout.json'])
  await assert.rejects(access(prefix + suffix), { code: 'ENOENT' });
const inputs = ['audit/2026-10-27/parser-hybrid-diagnostic.php', 'audit/2026-10-27/run-parser-hybrid-diagnostic.mjs', 'scripts/php-runtime.mjs',
  'backend/src/SessionValidator.php', 'backend/src/UnicodeGraphemes.php', 'backend/src/CourseAssessment.php',
  'src/lib/typing-core/session.ts', 'src/lib/typing-core/transcript.ts', 'src/lib/typing-core/metrics.ts', 'src/lib/typing-core/types.ts'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, sha(await readFile(file))])));
const target = Array.from({ length: 800 }, (_, index) => ['calm', 'clear', 'river', 'focus'][index % 4]).join(' ');
let now = 0;
const wall = Date.UTC(2026, 9, 27, 12), owner = '11111111-1111-4111-8111-111111111111';
const controller = new SessionController({ clientSessionId: 'source22-serializer-diagnostic', ownerScope: owner, mode: 'race', durationMs: 30000, initialTarget: target, correctionPolicy: 'current-word', inputMethod: 'keyboard', language: 'en', keyboardLayout: 'qwerty' }, { now: () => now, wallNow: () => wall + now });
controller.startAt(0, wall);
for (const [index, text] of [...target.slice(0, 10)].entries()) { now = 100 + index * 80 + index % 3 * 3; controller.input({ type: 'insert', text }); }
now = 15000;
const candidate = controller.checkpoint(), candidateJson = JSON.stringify(candidate);
const reference = JSON.parse(await readFile('audit/2026-10-27/final22-serializer-profile-protocol.json', 'utf8'));
assert.equal(Buffer.byteLength(candidateJson), reference.fixture.utf8JsonBytes);
assert.equal(sha(candidateJson), reference.fixture.sha256);
assert.equal(sha(candidateJson), '39fe841e3c203ee647cce99c75643b0ec9e6ed8efc685cc699c8b9abf809469c');
const post = JSON.stringify({ code: 'ABCD1234', expectedOwner: owner, candidate, finish: false });
const protocol = { declaredAt: new Date().toISOString(), scope: 'One bounded pure PHP parser-equivalence/CPU/memory and validator-component diagnostic. No bootstrap/config/database/server/browser/network.',
  fixture: { reference: 'audit/2026-10-27/final22-serializer-profile-protocol.json', clientSessionId: candidate.clientSessionId, words: 800, events: candidate.events.length, characters: candidate.characters.length,
    timeSeries: candidate.timeSeries.length, clientElapsedMs: candidate.elapsedMs, candidateBytes: Buffer.byteLength(candidateJson), candidateSha256: sha(candidateJson), postBytes: Buffer.byteLength(post), postSha256: sha(post) },
  parserIterations: 12, validateIterations: 12, authoritativeReplayIterations: 12, authoritativeElapsedMs: 20000,
  order: Array.from({ length: 12 }, (_, index) => index % 2 === 0 ? ['old', 'hybrid'] : ['hybrid', 'old']), warmups: 0, outlierFiltering: false, retries: 0,
  memory: 'Two separate sequential PHP children, one decoder each; peak reset where available; old stdClass and associative trees both retained through the measured operation.',
  oldDecoder: 'json_decode(false), require stdClass root, json_decode(true), retain both trees',
  proposedDecoder: 'Any raw literal backslash-u0000 uses exact old decoder; otherwise one associative decode and first non-JSON-whitespace byte must be opening brace.',
  productEdits: 0, inputHashes: hashes, timeoutPerChildMs: 15000, privateConfigurationRead: false, databaseConnected: false, acceptanceResultReplaced: false };
await writeFile(prefix + '-protocol.json', JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const runtime = phpRuntime(), childRows = [];
function runChild(name, mode, input) {
  const startedAt = new Date().toISOString(), start = performance.now();
  const run = spawnSync(runtime.binary, [...runtime.args, 'audit/2026-10-27/parser-hybrid-diagnostic.php', mode], { input, encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 512000 });
  let result = null, parseError = null;
  try { result = JSON.parse(run.stdout); } catch (error) { parseError = error.message; }
  childRows.push({ name, startedAt, durationMs: performance.now() - start, exitCode: run.status, signal: run.signal, timedOut: run.error?.code === 'ETIMEDOUT', error: run.error?.message ?? null, stderr: run.stderr, parseError, result });
  return run;
}
const startedAt = new Date().toISOString();
const main = runChild('main', 'main', JSON.stringify({ candidate, postBodyBase64: Buffer.from(post).toString('base64') }));
await writeFile(prefix + '-main.stdout.json', main.stdout || '', { flag: 'wx' });
const oldMemory = runChild('old-memory', 'memory-old', post);
await writeFile(prefix + '-old-memory.stdout.json', oldMemory.stdout || '', { flag: 'wx' });
const hybridMemory = runChild('hybrid-memory', 'memory-hybrid', post);
await writeFile(prefix + '-hybrid-memory.stdout.json', hybridMemory.stdout || '', { flag: 'wx' });
const sourceUnchanged = (await Promise.all(inputs.map(async file => sha(await readFile(file)) === hashes[file]))).every(Boolean);
const [cpu, oldMem, newMem] = childRows.map(row => row.result);
const passed = childRows.every(row => row.exitCode === 0 && !row.stderr && !row.parseError) && cpu?.status === 'PASS-SCOPED-PURE-DIAGNOSTIC'
  && oldMem?.status === 'PASS-SCOPED-MEMORY' && newMem?.status === 'PASS-SCOPED-MEMORY'
  && oldMem.inputHash === sha(post) && newMem.inputHash === sha(post) && oldMem.decodedHash === newMem.decodedHash && oldMem.decodedHash === cpu.decodedOutputHash && sourceUnchanged;
const report = { status: passed ? 'PASS-SCOPED-PURE-DIAGNOSTIC' : 'FAILED', startedAt, finishedAt: new Date().toISOString(), protocol,
  children: childRows, sourceUnchanged, parserMedianSavingMs: cpu ? cpu.summaries.oldParseMs.median - cpu.summaries.hybridParseMs.median : null,
  retainedMemorySavingBytes: oldMem && newMem ? oldMem.retainedUsedDeltaBytes - newMem.retainedUsedDeltaBytes : null,
  peakMemorySavingBytes: oldMem && newMem ? oldMem.peakUsedDeltaBytes - newMem.peakUsedDeltaBytes : null,
  interpretation: 'Pure local parser CPU/memory and validation-component evidence only. No HTTP latency/capacity gain or universal parser equivalence claim. Every raw iteration and failure is retained.',
  cleanup: { allChildrenExited: childRows.every(row => row.exitCode !== null || row.signal !== null), browserStarted: false, serverStarted: false, databaseConnected: false, privateConfigurationRead: false, productEdits: 0 } };
await writeFile(prefix + '-result.json', JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, report: prefix + '-result.json', summaries: cpu?.summaries, corpusCases: cpu?.corpusCases, mismatches: cpu?.mismatches, parserMedianSavingMs: report.parserMedianSavingMs,
  retainedMemorySavingBytes: report.retainedMemorySavingBytes, peakMemorySavingBytes: report.peakMemorySavingBytes, childExitCodes: childRows.map(row => row.exitCode), sourceUnchanged }));
process.exitCode = passed ? 0 : 1;
