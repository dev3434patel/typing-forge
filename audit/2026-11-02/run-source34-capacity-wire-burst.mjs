// Invoked only by the separately owned Apache/PHP/MariaDB owner after root GO.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile, realpath, writeFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { cpus, freemem, totalmem } from 'node:os';
import path from 'node:path';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { arenaEvidencePayload } from '../../src/domain/arena.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE34_CAPACITY_WIRE_ACCEPTANCE, '1', 'Root must explicitly enable this owned capacity window.');
const directory = 'audit/2026-11-02';
const ownerId = process.env.SPAROWTYPE_CAPACITY_OWNER_ID;
assert.match(ownerId ?? '', /^[a-f0-9]{16}$/);
const buildId = process.env.SPAROWTYPE_FINAL34_BUILD_ID;
assert.match(buildId ?? '', /^[a-f0-9]{20}$/, 'Supply the actual newly frozen source34 build.');
const sourceFile = `${directory}/final34-source.json`;
const sourceBefore = await verifyFrozenSource(sourceFile);
assert.equal(sourceBefore.frozen.local.version, buildId);
assert.ok(sourceBefore.receipt.compared >= 500);
assert.equal(sourceBefore.receipt.compared, 505);
assert.deepEqual(sourceBefore.receipt.mismatches, []);
const owned = await realpath(path.join('backend/storage', `pack-instance-${ownerId}`));
const marker = JSON.parse(await readFile(path.join(owned, 'ownership.json'), 'utf8'));
assert.equal(marker.id, ownerId);
assert.equal(path.resolve(marker.root), process.cwd());
assert.ok(Number.isInteger(marker.runnerPid) && marker.runnerPid > 0);
assert.equal(await realpath(process.env.ARENA_AUDIT_CONFIG ?? ''), path.join(owned, 'app-config.php'));
assert.match(process.env.ARENA_AUDIT_GUARD ?? '', /^[a-f0-9]{64}$/);
const origin = new URL(process.env.ARENA_AUDIT_ORIGIN ?? 'invalid');
assert.equal(origin.protocol, 'http:');
assert.equal(origin.hostname, '127.0.0.1');
assert.equal(origin.pathname, '/api/');
assert.ok(/^\d+$/.test(origin.port) && ![3306, 3307, 3308, 8081, 4173].includes(Number(origin.port)));
const runtimeReceipt = JSON.parse(await readFile(`${directory}/pack-backend-${ownerId}-apache-runtime.json`, 'utf8'));
assert.equal(runtimeReceipt.status, 'PASS');
assert.equal(runtimeReceipt.sapi, 'apache2handler');
assert.equal(runtimeReceipt.privateConfigMatched, true);
assert.equal(runtimeReceipt.privateIniMatched, true);
assert.equal(runtimeReceipt.existingApacheConfigRead, false);
const prefix = `source34-capacity-wire-${ownerId}`;
const reportFile = `${directory}/${prefix}.json`, protocolFile = `${directory}/${prefix}-protocol.json`;
for (const file of [reportFile, protocolFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const inputs = ['audit/2026-11-02/pack-capacity-instance-source34-wire.mjs', 'audit/2026-11-02/run-source34-capacity-wire-burst.mjs', 'audit/2026-11-02/run-source34-capacity-burst.mjs', 'src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts', 'backend/tests/validation-parity.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, await hash(file)])));
const runId = randomBytes(6).toString('hex'), runtime = phpRuntime();
const requestRows = [], auxiliaryRows = [], checks = [], activeRequests = new Set();
const expectedOperations = { create: 50, join: 351, get: 51, spectate: 1, ready: 400, submit: 400, leave: 400 };
const protocol = {
  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build: buildId, source: sourceBefore.receipt,
  ownerId, origin: origin.href, rooms: 50, accountsPerRoom: 8, occupiedSeatsRequired: 400,
  durationSeconds: 30, concurrency: 20, requestTimeoutMs: 15000, watchdogMs: 180000,
  expectedArenaOperations: 1653, expectedOperations, p95TargetMs: 150,
  p95Method: 'Nearest rank: sorted successful real Arena HTTP latencies[ceil(n*0.95)-1]. Every unexpected status separately fails the whole gate; all-request and per-phase distributions are also retained.',
  retries: 0, resultFiltering: false, rateCountersReset: false, limiterBypass: false,
  currentWire: { productionHelper: 'src/domain/arena.ts#arenaEvidencePayload', actualHttpConsumer: 'src/services/arena-service.ts', fieldsRemovedExactly: ['characters', 'timeSeries', 'cursor'], metricsEventsAndAllOtherFieldsRetained: true, intentionalWireBytesChange: true, requestSerializationAdapterPoints: 1, helperImportedDirectlyWithNodeTypeStripping: true, separateRequiredContracts: ['src/domain/__tests__/arena.test.ts', 'backend/tests/validation-parity.mjs'], separatePhpCanonicalHashParityRequired: true, noParityPassClaimFromThisCapacityRun: true, legacyFullDriverPreserved: 'audit/2026-11-02/run-source34-capacity-burst.mjs', pairScope: 'Run after legacy full once on the same owned runtime with newly provisioned400-account fixtures. Order/cache effects remain a limitation; no result is overwritten.' },
  evidence: '400 independent guarded synthetic authenticated sessions. Ten canonical insertion events per account use native performance.now mapped to the actual authoritative server start and real80/83/86ms pacing; no server/browser/client clock fast-forward.',
  authenticationEndpointPerformance: 'NOT-MEASURED: accounts/sessions are isolated SQL/file fixtures; one real session request verifies the API binding.',
  sustained120SecondLoad: 'NOT-RUN: this declared burst preserves the original1653-operation comparison. It cannot establish400-client steady-state polling throughput.',
  sourceAndHarnessHashes: inputHashes,
  machine: { logicalCpus: cpus().length, cpuModel: cpus()[0]?.model, totalMemoryBytes: totalmem(), freeMemoryBytes: freemem() },
  privateConfigReadByHarness: false, originalConfigRead: false, existingDatabaseConnected: false,
  cleanupOwnership: 'Fixture account/session cleanup belongs to this script; Apache/MariaDB process cleanup remains with its original owner and must be verified separately.'
};
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
await writeFile(reportFile, JSON.stringify({ status: 'RUNNING', protocol }, null, 2) + '\n', { flag: 'wx' });
let accounts = [], rooms = Array.from({ length: 50 }, () => null), controllers = [], cleanup = null, failure = null, expired = false;
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) });
const admin = body => {
  const result = spawnSync(runtime.binary, [...runtime.args, 'backend/tests/arena-audit-admin.php'], {
    input: JSON.stringify({ ...body, runId }), encoding: 'utf8', windowsHide: true, env: process.env,
    timeout: 45000, maxBuffer: 2 * 1024 * 1024
  });
  if (result.status !== 0) throw new Error('Guarded owned fixture provisioning/cleanup failed; private values suppressed.');
  return JSON.parse(result.stdout);
};
const api = async (account, phase, body, { actorIndex, roomIndex, expectedStatus = 200, expectedCode = null, queuedAt = performance.now() }) => {
  const began = performance.now(), controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), protocol.requestTimeoutMs);
  activeRequests.add(controller);
  const row = { request: requestRows.length + activeRequests.size, phase, actorIndex, roomIndex, expectedStatus, expectedCode, queuedMs: began - queuedAt, status: 0, ms: 0, code: null };
  try {
    if (expired) controller.abort();
    const response = await fetch(new URL(`arena/${phase}`, origin), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf, Cookie: account.cookie },
      body: JSON.stringify(phase === 'submit' ? { ...body, candidate: arenaEvidencePayload(body.candidate), expectedOwner: account.id } : { ...body, expectedOwner: account.id }), signal: controller.signal
    });
    row.status = response.status;
    const text = await response.text();
    row.responseBytes = Buffer.byteLength(text);
    const json = JSON.parse(text);
    row.code = json.error?.code ?? null;
    row.serverTiming = response.headers.get('server-timing');
    row.expected = row.status === expectedStatus && (expectedCode === null || row.code === expectedCode);
    return { status: row.status, arena: json.arena, errorCode: row.code };
  } catch (error) {
    row.code = error.name;
    row.expected = false;
    return { status: row.status, errorCode: row.code };
  } finally {
    row.ms = performance.now() - began;
    requestRows.push(row);
    clearTimeout(timer);
    activeRequests.delete(controller);
  }
};
async function batch(items, work) {
  let next = 0;
  const queuedAt = performance.now();
  const outcomes = await Promise.allSettled(Array.from({ length: Math.min(protocol.concurrency, items.length) }, async () => {
    while (next < items.length && !expired) { const index = next++; await work(items[index], index, queuedAt); }
  }));
  if (outcomes.some(outcome => outcome.status === 'rejected')) throw new Error('A capacity worker failed after all active workers settled; its phase count remains incomplete.');
}
function acceptRoom(index, room) {
  if (!room || !Number.isFinite(room.version)) return;
  if (!rooms[index] || room.version >= rooms[index].version) rooms[index] = room;
}
const watchdog = setTimeout(() => { expired = true; for (const request of activeRequests) request.abort(); }, protocol.watchdogMs);
const begin = performance.now();
try {
  const healthAt = performance.now();
  const healthResponse = await fetch(new URL('health', origin), { signal: AbortSignal.timeout(15000) });
  const health = await healthResponse.json();
  auxiliaryRows.push({ phase: 'owned-health', status: healthResponse.status, ms: performance.now() - healthAt });
  assert.ok(healthResponse.ok && health.backend === 'php-mysql' && health.schemaVersion >= 5, 'Owned health/schema guard failed.');
  accounts = admin({ action: 'provision', count: 400 }).accounts;
  assert.equal(accounts.length, 400);
  assert.equal(new Set(accounts.map(account => account.id)).size, 400);
  assert.equal(new Set(accounts.map(account => account.sessionId)).size, 400);
  const authAt = performance.now();
  const authResponse = await fetch(new URL('auth/session', origin), { headers: { Cookie: accounts[0].cookie }, signal: AbortSignal.timeout(15000) });
  const auth = await authResponse.json();
  auxiliaryRows.push({ phase: 'owned-session-binding', status: authResponse.status, ms: performance.now() - authAt });
  assert.ok(authResponse.ok && auth.user?.id === accounts[0].id, 'Running API is not bound to this owned fixture namespace.');
  await batch(Array.from({ length: 50 }, (_, index) => index), async (roomIndex, _, queuedAt) => {
    const result = await api(accounts[roomIndex * 8], 'create', { duration: 30 }, { actorIndex: roomIndex * 8, roomIndex, queuedAt });
    acceptRoom(roomIndex, result.arena);
  });
  await batch(accounts.map((account, actorIndex) => ({ account, actorIndex })).filter(item => item.actorIndex % 8 !== 0), async ({ account, actorIndex }, _, queuedAt) => {
    const roomIndex = Math.floor(actorIndex / 8), room = rooms[roomIndex];
    if (room) await api(account, 'join', { code: room.code }, { actorIndex, roomIndex, queuedAt });
  });
  for (let roomIndex = 0; roomIndex < 50 && !expired; roomIndex++) if (rooms[roomIndex]) {
    const result = await api(accounts[roomIndex * 8], 'get', { code: rooms[roomIndex].code }, { actorIndex: roomIndex * 8, roomIndex });
    acceptRoom(roomIndex, result.arena);
  }
  check('exact50 dense room slots and400 occupied seats', rooms.filter(Boolean).length === 50 && rooms.reduce((sum, room) => sum + (room?.members?.length ?? 0), 0) === 400);
  check('every room contains its exact8 distinct guarded accounts', rooms.every((room, index) => room && room.members.length === 8 && new Set(room.members.map(member => member.id)).size === 8 && room.members.every(member => accounts.slice(index * 8, index * 8 + 8).some(account => account.id === member.id))));
  if (rooms[0]) {
    check('ninth seat rejected', (await api(accounts[8], 'join', { code: rooms[0].code }, { actorIndex: 8, roomIndex: 0, expectedStatus: 409, expectedCode: 'arena-full' })).status === 409);
    check('outsider member read rejected', (await api(accounts[8], 'get', { code: rooms[0].code }, { actorIndex: 8, roomIndex: 0, expectedStatus: 403, expectedCode: 'arena-membership' })).status === 403);
    const spectator = await api(accounts[8], 'spectate', { code: rooms[0].code }, { actorIndex: 8, roomIndex: 0 });
    check('spectator exposes no private events/email', spectator.status === 200 && spectator.arena && !JSON.stringify(spectator.arena).includes('@example.test') && !JSON.stringify(spectator.arena).includes('events_json'));
  }
  await batch(accounts.map((account, actorIndex) => ({ account, actorIndex })), async ({ account, actorIndex }, _, queuedAt) => {
    const roomIndex = Math.floor(actorIndex / 8), room = rooms[roomIndex];
    if (room) { const result = await api(account, 'ready', { code: room.code, ready: true }, { actorIndex, roomIndex, queuedAt }); acceptRoom(roomIndex, result.arena); }
  });
  check('all50 rooms have authoritative3s countdown/30s duration and8 ready seats', rooms.every(room => room && Number.isFinite(room.startsAt) && room.deadlineAt - room.startsAt === 30000 && room.durationSeconds === 30 && room.members.every(member => member.ready)));
  assert.ok(checks.every(item => item.pass), 'Complete exact50x8 allocation/countdown preconditions failed.');
  const latestStart = Math.max(...rooms.map(room => room.startsAt));
  const wait = latestStart + 100 - Date.now();
  assert.ok(wait <= 5000, 'Authoritative countdown exceeded the unchanged5s wait bound.');
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  controllers = accounts.map((account, actorIndex) => {
    const room = rooms[Math.floor(actorIndex / 8)];
    const mono = performance.now(), wall = Date.now();
    const controller = new SessionController({ ...room.configuration, clientSessionId: `arena-capacity-${runId}-${actorIndex}`, ownerScope: account.id, initialTarget: room.targetText }, { now: () => performance.now(), wallNow: () => Date.now() });
    controller.startAt(mono - Math.max(0, wall - room.startsAt), room.startsAt);
    return controller;
  });
  const evidenceAt = performance.now();
  for (let index = 0; index < 10; index++) {
    for (let actorIndex = 0; actorIndex < 400; actorIndex++) controllers[actorIndex].input({ type: 'insert', text: rooms[Math.floor(actorIndex / 8)].targetText[index] });
    if (index < 9) await new Promise(resolve => setTimeout(resolve, 80 + index % 3 * 3));
  }
  const evidencePreparationMs = performance.now() - evidenceAt;
  const accepted = new Set();
  await batch(accounts.map((account, actorIndex) => ({ account, actorIndex })), async ({ account, actorIndex }, _, queuedAt) => {
    const roomIndex = Math.floor(actorIndex / 8), candidate = controllers[actorIndex].checkpoint();
    assert.equal(candidate.metrics.insertionAttempts, 10);
    const result = await api(account, 'submit', { code: rooms[roomIndex].code, candidate, finish: false }, { actorIndex, roomIndex, queuedAt });
    const own = result.arena?.members.find(member => member.id === account.id);
    if (result.status === 200 && own?.status === 'racing' && own.accuracy === 100 && own.progress > 0) accepted.add(actorIndex);
  });
  check('all400 actual submitted members are racing/unquarantined with canonical correct progress', accepted.size === 400, { accepted: accepted.size, evidencePreparationMs });
  await batch(accounts.map((account, actorIndex) => ({ account, actorIndex })), async ({ account, actorIndex }, _, queuedAt) => {
    const roomIndex = Math.floor(actorIndex / 8);
    await api(account, 'leave', { code: rooms[roomIndex].code }, { actorIndex, roomIndex, queuedAt });
  });
} catch (error) {
  failure = { name: error.name, message: String(error.message).slice(0, 500) };
} finally {
  clearTimeout(watchdog);
  try { cleanup = admin({ action: 'cleanup', sessions: accounts.map(account => account.sessionId) }); }
  catch (error) { cleanup = { error: error.name, message: 'Owned fixture cleanup failed; see original owner diagnostics without exposing private values.' }; }
  const sourceAfter = await verifyFrozenSource(sourceFile);
  const inputsUnchanged = (await Promise.all(inputs.map(async file => await hash(file) === inputHashes[file]))).every(Boolean);
  const quantile = values => { const sorted = [...values].sort((a, b) => a - b); return sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] : null; };
  const successes = requestRows.filter(row => row.status >= 200 && row.status < 300);
  const p95Ms = quantile(successes.map(row => row.ms));
  const unexpected = requestRows.filter(row => !row.expected);
  const phases = Object.keys(expectedOperations).map(phase => {
    const rows = requestRows.filter(row => row.phase === phase), good = rows.filter(row => row.status >= 200 && row.status < 300);
    return { phase, expectedRequests: expectedOperations[phase], actualRequests: rows.length, successful: good.length, unexpected: rows.filter(row => !row.expected).length, p95SuccessfulMs: quantile(good.map(row => row.ms)), p95AllMs: quantile(rows.map(row => row.ms)), p95QueueMs: quantile(rows.map(row => row.queuedMs)), maxMs: rows.length ? Math.max(...rows.map(row => row.ms)) : null };
  });
  check('exact1653 planned Arena requests completed with no omitted phase', requestRows.length === 1653 && phases.every(phase => phase.expectedRequests === phase.actualRequests));
  check('all operational responses match expected statuses; only declared409/403 controls are negative', unexpected.length === 0);
  check('successful-request p95 remains strictly below150ms', p95Ms !== null && p95Ms < 150, { p95Ms, targetMs: 150 });
  check('owned fixture cleanup deletes400 accounts and400 sessions', cleanup?.deletedOwnAccounts === 400 && cleanup?.removedOwnSessions === 400);
  check('frozen source and harness remained unchanged', sourceAfter.receipt.mismatches.length === 0 && inputsUnchanged);
  const passed = failure === null && !expired && checks.every(item => item.pass);
  const report = {
    status: passed ? 'PASS-SCOPED-CAPACITY-BURST' : 'FAILED', protocol, finishedAt: new Date().toISOString(), durationMs: performance.now() - begin,
    failure, watchdogExpired: expired, checks, total: requestRows.length, successful: successes.length,
    statusCounts: Object.fromEntries([...new Set(requestRows.map(row => row.status))].map(status => [status, requestRows.filter(row => row.status === status).length])),
    p95Ms, p95AllRequestsMs: quantile(requestRows.map(row => row.ms)), maxRequestMs: requestRows.length ? Math.max(...requestRows.map(row => row.ms)) : null,
    phases, unexpectedRequests: unexpected, rawRequests: requestRows, auxiliaryRequests: auxiliaryRows,
    allocatedRooms: rooms.filter(Boolean).length, occupiedSeats: rooms.reduce((sum, room) => sum + (room?.members?.length ?? 0), 0), seatSnapshotScope: 'Allocation/readiness snapshots before leave and guarded fixture deletion, not a claim of occupied seats after cleanup.',
    cleanup, sourceAfter: sourceAfter.receipt, inputsUnchanged, targetMet: passed,
    serviceCleanup: 'PENDING-ORIGINAL-OWNER-CLEANUP-RECEIPT', existingConfigRead: false, existingDatabaseConnected: false,
    limitations: ['This is a short burst at20 concurrent requests, not a120s sustained400-client production workload.', 'Synthetic authenticated fixtures are not an authentication or human-input benchmark.', 'Global all-user throughput, physical mobile devices, production hosting and multi-region latency remainUNVERIFIED.']
  };
  await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, ownerId, total: report.total, p95Ms, targetMet: passed, cleanup, report: reportFile }));
  process.exitCode = passed ? 0 : 1;
}
