import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { cpus, freemem, totalmem, platform, release } from 'node:os';
import { performance } from 'node:perf_hooks';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
const origin = new URL(process.env.ARENA_AUDIT_ORIGIN ?? 'http://127.0.0.1:5059/api/');
if (origin.hostname !== '127.0.0.1' || !/^\d+$/.test(origin.port) || ['4173', '8081', '3308'].includes(origin.port) || !process.env.ARENA_AUDIT_CONFIG || !process.env.ARENA_AUDIT_GUARD) throw new Error('Explicit isolated loopback API/config/guard required; normal project ports are protected.');
const runId = randomBytes(6).toString('hex'), runtime = phpRuntime(), startedAt = new Date().toISOString(), rows = [], assertions = [], activeRequests = new Set();
let expired = false;
const path = process.env.ARENA_LOAD_REPORT ?? 'audit/mega-pack-2026-10-21/arena-load-first.json';
const protocol = { declaredAt: startedAt, runId, origin: origin.href, rooms: 50, accountsPerRoom: 8, concurrency: 20, requestTimeoutMs: 15000, watchdogMs: 180000, p95TargetMs: 150, noRetries: true, limitsUnchanged: true, syntheticSessionsProvisioned: true, authenticationEndpointPerformance: 'NOT-MEASURED', machine: { platform: platform(), release: release(), cpus: cpus().length, cpuModel: cpus()[0]?.model, totalMemory: totalmem(), freeMemory: freemem() } };
await writeFile(path.replace(/\.json$/, '-protocol.json'), JSON.stringify(protocol, null, 2) + '\n');
const admin = body => { const run = spawnSync(runtime.binary, [...runtime.args, 'backend/tests/arena-audit-admin.php'], { input: JSON.stringify({ ...body, runId }), encoding: 'utf8', windowsHide: true, env: process.env }); if (run.status !== 0) throw new Error(`Guarded arena fixture failed: ${run.stderr.slice(-1200)}`); return JSON.parse(run.stdout); };
const api = async (account, action, body = {}) => { const start = performance.now(), controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000); activeRequests.add(controller); try { if (expired) controller.abort(); const response = await fetch(new URL(`arena/${action}`, origin), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf, Cookie: account.cookie }, body: JSON.stringify({ ...body, expectedOwner: account.id }), signal: controller.signal }); const json = await response.json(); rows.push({ phase: action, status: response.status, ms: performance.now() - start, code: json.error?.code ?? null }); return { status: response.status, arena: json.arena, error: json.error }; } catch (error) { rows.push({ phase: action, status: 0, ms: performance.now() - start, code: error.name }); return { status: 0 }; } finally { clearTimeout(timeout); activeRequests.delete(controller); } };
async function batch(items, work) { let next = 0; await Promise.all(Array.from({ length: Math.min(20, items.length) }, async () => { while (next < items.length && !expired) { const index = next++; await work(items[index], index); } })); }
const assert = (name, pass) => assertions.push({ name, pass: Boolean(pass) });
let accounts = [], cleanup = null, failure = null, rooms = [];
const watchdog = setTimeout(() => { expired = true; for (const controller of activeRequests) controller.abort(); }, 180000);
try {
  const health = await fetch(new URL('health', origin)); const state = await health.json(); if (!health.ok || state.backend !== 'php-mysql' || state.schemaVersion < 5) throw new Error('Owned API health/schema guard failed.');
  accounts = admin({ action: 'provision', count: 400 }).accounts;
  const authenticated = await fetch(new URL('auth/session', origin), { headers: { Cookie: accounts[0].cookie }, signal: AbortSignal.timeout(15000) });
  if (!authenticated.ok || (await authenticated.json()).user?.id !== accounts[0].id) throw new Error('The running API is not bound to this newly owned fixture database/session store.');
  await batch(Array.from({ length: 50 }, (_, index) => index), async index => { const result = await api(accounts[index * 8], 'create', { duration: 30 }); if (result.arena) rooms[index] = result.arena; });
  // Preserve failed indices explicitly: Array.every/map skip sparse holes and
  // spreading a sparse countdown array into Math.max would otherwise yield NaN.
  rooms = Array.from({ length: 50 }, (_, index) => rooms[index]);
  await batch(accounts.map((account, index) => ({ account, index })).filter(item => item.index % 8 !== 0), async ({ account, index }) => { const room = rooms[Math.floor(index / 8)]; if (room) await api(account, 'join', { code: room.code }); });
  for (let index = 0; index < rooms.length; index++) if (rooms[index]) { const result = await api(accounts[index * 8], 'get', { code: rooms[index].code }); if (result.arena) rooms[index] = result.arena; }
  const requiredRooms = Array.from({ length: 50 }, (_, index) => rooms[index]);
  assert('exactly50 allocated rooms and400 occupied seats', requiredRooms.filter(Boolean).length === 50 && requiredRooms.reduce((count, room) => count + (room?.members.length ?? 0), 0) === 400);
  assert('all50 rooms contain8 real synthetic accounts', requiredRooms.every(room => room?.members.length === 8));
  if (rooms[0]) { assert('ninth seat rejected', (await api(accounts[8], 'join', { code: rooms[0].code })).status === 409); assert('outsider member read rejected', (await api(accounts[8], 'get', { code: rooms[0].code })).status === 403); const view = await api(accounts[8], 'spectate', { code: rooms[0].code }); assert('spectator contains no private events or email', view.status === 200 && !JSON.stringify(view.arena).includes('@example.test') && !JSON.stringify(view.arena).includes('events_json')); }
  await batch(accounts.map((account, index) => ({ account, index })), async ({ account, index }) => { const room = rooms[Math.floor(index / 8)]; if (room) { const result = await api(account, 'ready', { code: room.code, ready: true }); if (result.arena) rooms[Math.floor(index / 8)] = result.arena; } });
  const latest = Math.max(0, ...rooms.map(room => room?.startsAt ?? 0)), syntheticInputWindowMs = 1000;
  // Ten canonical fixture events end at 820ms. Wait until they are in the past;
  // no server deadline, allowed-clock margin or request budget is relaxed.
  const waitMs = latest + syntheticInputWindowMs - Date.now();
  if (waitMs > 5000) throw new Error('The authoritative countdown exceeds the declared 5s fixture wait bound.');
  if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
  await batch(accounts.map((account, index) => ({ account, index })), async ({ account, index }) => { const room = rooms[Math.floor(index / 8)]; if (!room?.startsAt) return; let now = 0; const controller = new SessionController({ ...room.configuration, clientSessionId: `arena-load-${runId}-${index}`, ownerScope: account.id, initialTarget: room.targetText }, { now: () => now, wallNow: () => room.startsAt + now }); controller.startAt(0, room.startsAt); for (const [offset, key] of [...room.targetText.slice(0, 10)].entries()) { now = 100 + offset * 80 + offset % 3 * 3; controller.input({ type: 'insert', text: key }); } now = Math.max(now, Math.min(30000, Date.now() - room.startsAt)); await api(account, 'submit', { code: room.code, candidate: controller.checkpoint(), finish: false }); });
  await batch(accounts.map((account, index) => ({ account, index })), async ({ account, index }) => { const room = rooms[Math.floor(index / 8)]; if (room) await api(account, 'leave', { code: room.code }); });
} catch (error) { failure = error.message; }
finally {
  clearTimeout(watchdog); try { cleanup = admin({ action: 'cleanup', sessions: accounts.map(account => account.sessionId) }); } catch (error) { cleanup = { error: error.message }; }
  const successes = rows.filter(row => row.status >= 200 && row.status < 300), sorted = successes.map(row => row.ms).sort((a, b) => a - b), p95 = sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * .95) - 1)] : null;
  const unexpected = rows.filter(row => row.status === 0 || row.status >= 400 && !['arena-full', 'arena-membership'].includes(row.code));
  const allocatedRooms = Array.from({ length: 50 }, (_, index) => rooms[index]).filter(Boolean), occupiedSeats = allocatedRooms.reduce((count, room) => count + room.members.length, 0);
  const passed = failure === null && !expired && assertions.every(check => check.pass) && unexpected.length === 0 && allocatedRooms.length === 50 && occupiedSeats === 400 && p95 !== null && p95 < 150 && cleanup?.deletedOwnAccounts === 400;
  const report = { protocol, finishedAt: new Date().toISOString(), status: passed ? 'PASS-SCOPED' : 'FAILED', failure, assertions, allocatedRooms: allocatedRooms.length, occupiedSeats, rawRequests: rows, total: rows.length, successful: successes.length, statusCounts: Object.fromEntries([...new Set(rows.map(row => row.status))].map(status => [status, rows.filter(row => row.status === status).length])), p95Ms: p95, p95Scope: 'All successful real arena requests; errors retained separately, never filtered out of overall target status.', targetMet: passed, cleanup, hostedMultiRegion: 'UNVERIFIED', limitation: 'Synthetic account/session fixtures; not a human-input or authentication load benchmark. Existing production rate limits remain active;429 makes the target unmet.' };
  await writeFile(path, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ status: report.status, total: rows.length, p95Ms: p95, targetMet: passed, cleanup })); if (!passed) process.exitCode = 1;
}
