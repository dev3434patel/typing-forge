// Synthetic transport control only. No PHP, database or application endpoint.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { freemem } from 'node:os';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { SessionController } from '../../src/lib/typing-core/index.ts';

assert.ok(process.send && process.connected, 'Start only as the owned coordinator child.');
const configuration = new Promise(resolve => process.once('message', resolve));
process.send({ type: 'boot-ready' });
const config = await configuration;
assert.equal(config.parentPid, process.ppid);
assert.match(config.marker, /^[a-f0-9]{32}$/);
assert.ok(['coupled', 'prebuilt'].includes(config.variant));
const origin = new URL(config.origin);
assert.equal(origin.hostname, '127.0.0.1'); assert.equal(origin.protocol, 'http:');
const MIN_RAM = 2 * 1024 ** 3, samples = [], rows = [], active = new Set();
const start = performance.now(), cpuStart = process.cpuUsage();
const sample = stage => { const memory = process.memoryUsage(); samples.push({ stage, ms: performance.now() - start, freeMemoryBytes: freemem(), rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, externalBytes: memory.external }); };
const delay = monitorEventLoopDelay({ resolution: 10 }); delay.enable();
const sampler = setInterval(() => sample('periodic'), 200);
let expired = false, failure = null, preparationMs = null, checkpointMs = 0, checkpointUserUs = 0, checkpointSystemUs = 0, httpMs = null, httpCpu = null, maxActive = 0;
const watchdog = setTimeout(() => { expired = true; for (const controller of active) controller.abort(); }, 180000);
const quantile = (values, fraction) => { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.ceil(sorted.length * fraction) - 1] : null; };
try {
  assert.ok(freemem() >= MIN_RAM, 'RESOURCE-GATE: below2GiB before producer preparation.');
  sample('before-preparation'); await new Promise(resolve => setImmediate(resolve));
  const php = await readFile('backend/src/ArenaService.php', 'utf8');
  const wordLiteral = php.match(/private const WORDS=\[([a-z',\s]+)\];/)?.[1];
  assert.ok(wordLiteral); const words = JSON.parse(`[${wordLiteral.replaceAll("'", '"')}]`);
  const targets = Array.from({ length: 50 }, (_, room) => {
    let state = Math.imul(room + 1, 0x9e3779b9) >>> 0;
    return Array.from({ length: 800 }, (_, index) => {
      if (index === 0) return words[Math.floor(room / words.length)];
      if (index === 1) return words[room % words.length];
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      return words[(state >>> 0) % words.length];
    }).join(' ');
  });
  assert.equal(new Set(targets).size, 50);
  const roomId = room => `40000000-0000-4000-8000-${String(room + 1).padStart(12, '0')}`;
  const accounts = Array.from({ length: 400 }, (_, index) => ({ id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}` }));
  let clock = 100; const wallStart = 1700000000000;
  const controllers = accounts.map((account, index) => {
    const room = Math.floor(index / 8), id = roomId(room);
    const controller = new SessionController({ mode: 'race', durationMs: 30000, language: 'en', script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', contentRevision: 'sparow-arena-v1', challengeId: `arena:${id}`, correctionPolicy: 'current-word', privacy: 'public-corpus', settings: { arenaId: id, localBot: false }, clientSessionId: `arena-capacity-0123456789ab-${index}`, ownerScope: account.id, initialTarget: targets[room] }, { now: () => clock, wallNow: () => wallStart + clock });
    controller.startAt(0, wallStart); return controller;
  });
  for (let event = 0; event < 10; event++) {
    for (let index = 0; index < 400; index++) controllers[index].input({ type: 'insert', text: targets[Math.floor(index / 8)][event] });
    if (event < 9) clock += 80 + event % 3 * 3;
  }
  clock = 1200;
  const checkpoint = index => {
    const began = performance.now(), cpu = process.cpuUsage();
    const candidate = controllers[index].checkpoint();
    const used = process.cpuUsage(cpu);
    checkpointMs += performance.now() - began; checkpointUserUs += used.user; checkpointSystemUs += used.system;
    assert.equal(candidate.events.length, 10); assert.equal(candidate.metrics.insertionAttempts, 10);
    assert.ok(candidate.characters.length > 1000 && Array.isArray(candidate.timeSeries) && Number.isFinite(candidate.cursor));
    return candidate;
  };
  const prebuilt = config.variant === 'prebuilt' ? controllers.map((_, index) => checkpoint(index)) : null;
  preparationMs = performance.now() - start; sample('before-http');
  assert.ok(freemem() >= MIN_RAM, 'RESOURCE-GATE: below2GiB before actualHTTP pool.');
  process.send({ type: 'http-ready', phase: config.phase, freeMemoryBytes: freemem() });
  const permission = await new Promise(resolve => process.once('message', resolve));
  assert.equal(permission.type, 'http-go'); assert.equal(permission.phase, config.phase);
  assert.ok(freemem() >= MIN_RAM, 'RESOURCE-GATE: below2GiB at actualHTTP start.');
  const api = async (index, candidate, queuedAt) => {
    // Preserve the original timer placement: checkpoint precedes api(); stringify is inside it.
    const began = performance.now(), abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000); active.add(abort); maxActive = Math.max(maxActive, active.size);
    const row = { actorIndex: index, roomIndex: Math.floor(index / 8), queuedMs: began - queuedAt, status: 0, ms: 0, expected: false, requestCharacters: 0, responseBytes: 0, error: null };
    try {
      const body = JSON.stringify({ code: `CTRL${Math.floor(index / 8).toString(36).padStart(4, '0').toUpperCase()}`, candidate, finish: false, expectedOwner: accounts[index].id });
      row.requestCharacters = body.length;
      const response = await fetch(new URL(`transport/${config.phase}`, origin), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Transport-Owner': config.marker, 'X-Transport-Actor': String(index) }, body, signal: abort.signal });
      row.status = response.status; const text = await response.text(); row.responseBytes = Buffer.byteLength(text);
      const json = JSON.parse(text);
      row.expected = response.status === 200 && row.responseBytes === 8192 && json.transportOnly === true && response.headers.get('x-transport-owner') === config.marker;
    } catch (error) { row.error = error.name; }
    finally { row.ms = performance.now() - began; rows.push(row); clearTimeout(timeout); active.delete(abort); }
  };
  let next = 0; const queuedAt = performance.now(), poolCpu = process.cpuUsage();
  const outcomes = await Promise.allSettled(Array.from({ length: 20 }, async () => {
    while (next < 400 && !expired) { const index = next++; const candidate = prebuilt ? prebuilt[index] : checkpoint(index); await api(index, candidate, queuedAt); }
  }));
  httpMs = performance.now() - queuedAt; httpCpu = process.cpuUsage(poolCpu); sample('after-http');
  assert.ok(outcomes.every(row => row.status === 'fulfilled'));
  assert.equal(rows.length, 400); assert.ok(rows.every(row => row.expected)); assert.equal(maxActive, 20);
} catch (error) { failure = { name: error.name, message: String(error.message).slice(0, 300) }; }
finally { clearTimeout(watchdog); clearInterval(sampler); sample('final'); delay.disable(); }
const cpu = process.cpuUsage(cpuStart), raw = rows.sort((a, b) => a.actorIndex - b.actorIndex);
process.send({ type: 'complete', phase: config.phase, report: { status: !failure && !expired && rows.length === 400 ? 'TRANSPORT-ONLY-RECORDED' : 'FAILED-OR-NOTSTARTED', phase: config.phase, variant: config.variant, syntheticClock: { startsAt: 1700000000000, checkpointOffsetMs: 1200, scope: 'SessionController clock only; performance.now and HTTP timers are real.' }, rooms: 50, accountsPerRoom: 8, wordsPerTarget: 800, eventsPerActor: 10, requests: raw.length, maxActive, failure, expired, preparationMs, checkpointMs, checkpointCpu: { userUs: checkpointUserUs, systemUs: checkpointSystemUs }, totalMs: performance.now() - start, totalCpu: cpu, httpMs, httpCpu, eventLoopDelayMs: { min: delay.count ? delay.min / 1e6 : null, mean: delay.count ? delay.mean / 1e6 : null, p95: delay.count ? delay.percentile(95) / 1e6 : null, max: delay.count ? delay.max / 1e6 : null, samples: delay.count }, p50AllMs: quantile(raw.map(row => row.ms), .5), p95AllMs: quantile(raw.map(row => row.ms), .95), maxAllMs: raw.length ? Math.max(...raw.map(row => row.ms)) : null, rawRequests: raw, resourceSamples: samples, resourceFloorDuringRun: Math.min(...samples.map(row => row.freeMemoryBytes)), payloadHashing: 'Server stream hashes full request bytes; no client hashing is inserted into the measured pool.' } }, () => process.disconnect());
