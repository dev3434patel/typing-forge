import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
const origin = new URL(process.env.ARENA_AUDIT_ORIGIN ?? 'http://127.0.0.1:5059/api/');
if (origin.hostname !== '127.0.0.1' || ['4173', '8081', '3308'].includes(origin.port) || !origin.port || !process.env.ARENA_AUDIT_CONFIG || !process.env.ARENA_AUDIT_GUARD) throw new Error('Explicit isolated arena API/config/guard required.');
const runtime = phpRuntime(), runId = randomBytes(6).toString('hex'), checks = [], requests = [], startedAt = new Date().toISOString();
const path = process.env.ARENA_HTTP_REPORT ?? 'audit/mega-pack-2026-10-21/arena-http-first.json';
const admin = body => { const result = spawnSync(runtime.binary, [...runtime.args, 'backend/tests/arena-audit-admin.php'], { input: JSON.stringify({ ...body, runId }), encoding: 'utf8', env: process.env, windowsHide: true }); if (result.status !== 0) throw new Error(result.stderr.slice(-1200)); return JSON.parse(result.stdout); };
const api = async (account, action, body = {}, expectedOwner = account.id) => { const response = await fetch(new URL(`arena/${action}`, origin), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf, Cookie: account.cookie }, body: JSON.stringify({ ...body, expectedOwner }), signal: AbortSignal.timeout(15000) }); const result = await response.json(); requests.push({ action, status: response.status, error: result.error?.code ?? null }); return { status: response.status, ...result }; };
const check = (name, pass) => { checks.push({ name, pass: Boolean(pass) }); if (!pass) throw new Error(name); };
const until = async deadline => { const remaining = deadline - Date.now(); if (remaining > 0) await new Promise(resolve => setTimeout(resolve, Math.min(30000, remaining))); };
function evidence(room, account, id, text, offsets, elapsed, configuration = room.configuration) {
  let now = 0; const controller = new SessionController({ ...configuration, clientSessionId: id, ownerScope: account.id, initialTarget: room.targetText }, { now: () => now, wallNow: () => room.startsAt + now }); controller.startAt(0, room.startsAt);
  for (const [index, key] of [...text].entries()) { now = offsets[index]; controller.input({ type: 'insert', text: key }); }
  now = elapsed; return controller;
}
let accounts = [], cleanup = null, failure = null;
try {
  accounts = admin({ action: 'provision', count: 3 }).accounts; const [a, b, outsider] = accounts;
  const bound = await fetch(new URL('auth/session', origin), { headers: { Cookie: a.cookie }, signal: AbortSignal.timeout(15000) }); check('API bound to fresh owned account/session store', bound.ok && (await bound.json()).user?.id === a.id);
  const concurrentCreates = await Promise.all([api(a, 'create', { duration: 15 }), api(b, 'create', { duration: 15 }), api(outsider, 'create', { duration: 15 })]);
  check('three concurrent real room creations all succeed without filtered holes', concurrentCreates.length === 3 && concurrentCreates.every(result => result.status === 200) && new Set(concurrentCreates.map(result => result.arena?.id)).size === 3);
  check('every concurrent room has exactly its own first host at slot0', concurrentCreates.every((result, index) => result.arena.members.length === 1 && result.arena.members[0].id === accounts[index].id && result.arena.members[0].slot === 0));
  let response = concurrentCreates[0]; check('create real arena', response.status === 200); let room = response.arena;
  check('explicit stale owner rejected', (await api(a, 'get', { code: room.code }, b.id)).status === 409);
  check('outsider member read rejected', (await api(outsider, 'get', { code: room.code })).status === 403);
  response = await api(outsider, 'spectate', { code: room.code }); check('spectator sanitized', response.status === 200 && response.arena.spectator && !JSON.stringify(response.arena).includes('@example.test') && !JSON.stringify(response.arena).includes('events_json'));
  check('join second human', (await api(b, 'join', { code: room.code })).status === 200);
  await api(a, 'ready', { code: room.code, ready: true }); response = await api(b, 'ready', { code: room.code, ready: true }); room = response.arena;
  check('server issues real three-second countdown', response.status === 200 && room.status === 'countdown' && room.startsAt - room.serverNow >= 2900 && room.deadlineAt - room.startsAt === 15000);
  check('late join blocked after countdown', (await api(outsider, 'join', { code: room.code })).status === 409);
  await until(room.startsAt + 1500);
  const text = room.targetText.slice(0, 10), offsets = [...text].map((_, index) => 100 + index * 70 + index % 3 * 3), id = `arena-http-${runId}`;
  const controller = evidence(room, a, id, text, offsets, Date.now() - room.startsAt);
  response = await api(a, 'submit', { code: room.code, candidate: controller.checkpoint(), finish: false }); check('live prefix independently accepted', response.status === 200 && response.arena.members.find(member => member.id === a.id).progress > 0);
  check('identical prefix retry accepted', (await api(a, 'submit', { code: room.code, candidate: controller.checkpoint(), finish: false })).status === 200);
  const forged = evidence(room, a, id, '#' + text.slice(1), offsets, Date.now() - room.startsAt).checkpoint(); check('rewritten valid canonical prefix rejected', (await api(a, 'submit', { code: room.code, candidate: forged, finish: false })).status === 409);
  const changed = evidence(room, a, id, text, offsets, Date.now() - room.startsAt, { ...room.configuration, keyboardLayout: 'dvorak' }).checkpoint(); check('changed issued cohort rejected', (await api(a, 'submit', { code: room.code, candidate: changed, finish: false })).status === 422);
  const future = evidence(room, a, id, text, offsets, Date.now() - room.startsAt + 5000).checkpoint(); check('future elapsed rejected', (await api(a, 'submit', { code: room.code, candidate: future, finish: false })).status === 422);
  check('early unfinished result cannot become final', (await api(a, 'submit', { code: room.code, candidate: controller.finish('manual'), finish: true })).status === 409);
  await until(room.startsAt + 5200);
  const uniform = evidence(room, b, `arena-uniform-${runId}`, room.targetText.slice(0, 50), Array.from({ length: 50 }, (_, index) => 100 + index * 100), Date.now() - room.startsAt).checkpoint();
  response = await api(b, 'submit', { code: room.code, candidate: uniform, finish: false }); check('uniform valid replay is quarantined outside placements', response.status === 200 && response.arena.members.find(member => member.id === b.id).status === 'quarantined');
  response = await api(b, 'appeal', { code: room.code }); check('bounded review request really persisted', response.status === 200 && response.arena.members.find(member => member.id === b.id).appealRequested === true);
  await until(room.deadlineAt + 100);
  const final = evidence(room, a, id, text, offsets, 15000).finish('timeout'); response = await api(a, 'submit', { code: room.code, candidate: final, finish: true });
  check('real deadline finish accepted', response.status === 200); check('server placements exclude quarantined racer', response.arena.status === 'completed' && response.arena.members.find(member => member.id === a.id).placement === 1 && response.arena.members.find(member => member.id === b.id).placement === null);
  check('immutable final retry is idempotent', (await api(a, 'submit', { code: room.code, candidate: final, finish: true })).status === 200);
  await api(a, 'rematch', { code: room.code }); response = await api(b, 'rematch', { code: room.code }); check('both actual votes create one rematch', response.status === 200 && /^[A-Z0-9]{8}$/.test(response.arena.rematchCode));
  response = await api(a, 'create', { duration: 30 }); const reconnect = response.arena; await api(b, 'join', { code: reconnect.code }); await api(a, 'ready', { code: reconnect.code, ready: true }); response = await api(b, 'ready', { code: reconnect.code, ready: true });
  const reconnectStartsAt = response.arena.startsAt;
  const stalePublic = (await api(outsider, 'create', { duration: 120, public: true })).arena;
  const privateInvitation = (await api(outsider, 'create', { duration: 60 })).arena;
  const waiting = (await api(b, 'create', { duration: 60, public: true })).arena;
  await api(a, 'join', { code: waiting.code }); await api(outsider, 'join', { code: waiting.code });
  await api(b, 'ready', { code: waiting.code, ready: true }); await api(a, 'ready', { code: waiting.code, ready: true });
  let waitingResponse;
  await until(reconnectStartsAt + 100); for (let index = 0; index < 3; index++) {
    await new Promise(resolve => setTimeout(resolve, 7000)); response = await api(a, 'get', { code: reconnect.code });
    waitingResponse = await api(b, 'get', { code: waiting.code }); await api(a, 'get', { code: waiting.code });
  }
  check('silent participant forfeits after20s while live participant remains', response.status === 200 && response.arena.members.find(member => member.id === b.id).status === 'forfeit' && response.arena.members.find(member => member.id === a.id).status === 'racing');
  check('stale untouched public lobby seat pruned without blocking ready live humans', waitingResponse.status === 200 && waitingResponse.arena.members.length === 2 && !waitingResponse.arena.members.some(member => member.id === outsider.id) && waitingResponse.arena.status === 'countdown');
  check('lobby pruning preserves real three-second countdown rather than instant start', waitingResponse.arena.startsAt > waitingResponse.arena.serverNow && waitingResponse.arena.startsAt - waitingResponse.arena.serverNow <= 3000 && waitingResponse.arena.deadlineAt - waitingResponse.arena.startsAt === 60000);
  const matched = await api(a, 'match', { duration: 120 });
  check('matchmaking skips stale public host and creates a live room', matched.status === 200 && matched.arena.code !== stalePublic.code && matched.arena.hostId === a.id);
  const cancelled = await api(a, 'spectate', { code: stalePublic.code });
  check('stale public host cancellation persists transactionally', cancelled.status === 200 && cancelled.arena.status === 'cancelled');
  const invitation = await api(outsider, 'get', { code: privateInvitation.code });
  check('private invitation retains its documented waiting expiry', invitation.status === 200 && invitation.arena.status === 'waiting' && invitation.arena.members.length === 1);
  response = await api(a, 'leave', { code: reconnect.code }); check('forfeits settle without invented winner', response.status === 200 && response.arena.status === 'completed' && response.arena.members.every(member => member.placement === null));
} catch (error) { failure = error.message; }
finally { try { cleanup = admin({ action: 'cleanup', sessions: accounts.map(account => account.sessionId) }); } catch (error) { cleanup = { error: error.message }; }
  const report = { status: failure === null && cleanup?.deletedOwnAccounts === 3 ? 'PASS-SCOPED' : 'FAILED', startedAt, finishedAt: new Date().toISOString(), scope: 'Real isolated PHP/MySQL HTTP arena lifecycle; synthetic account/session fixtures, ordinary clock, no production limits changed.', failure, passed: checks.filter(check => check.pass).length, failed: checks.filter(check => !check.pass).length, checks, requests, cleanup, hostedMultiRegion: 'UNVERIFIED' };
  await writeFile(path, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, failure, cleanup })); if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
}
