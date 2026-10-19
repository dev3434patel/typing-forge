import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SessionController } from '../../src/lib/typing-core/session.ts';

// This harness tests real HTTP/MySQL business boundaries with synthetic event
// evidence. Controlled SQL fixtures exercise deadlines without claiming native
// human-input, browser, or ordinary-clock performance verification.
const api = new URL(process.env.SPAROWTYPE_TEST_API_URL || 'http://127.0.0.1:8081/api');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(api.hostname), 'Only a local audit API is allowed.');
const run = randomBytes(6).toString('hex');
const users = [];
const checks = [];
let stage = 'fixture preflight';
function fixture(action, body = {}) {
  const result = spawnSync(process.env.PHP_BINARY || 'php', [fileURLToPath(new URL('./race-fixtures.php', import.meta.url))], {
    input: JSON.stringify({ action, run, userIds: users.map(value => value.id), ...body }), encoding: 'utf8', env: process.env,
  });
  if (result.status !== 0) throw new Error(`Guarded audit fixture failed (${action}): ${result.stderr.slice(-1200)}`);
  // A locally configured optional extension can emit a startup warning before JSON.
  const lines = result.stdout.trim().split(/\r?\n/);
  return JSON.parse(lines.at(-1));
}
function concurrentFixture(action, body = {}) {
  const child = spawn(process.env.PHP_BINARY || 'php', [fileURLToPath(new URL('./race-fixtures.php', import.meta.url))], {
    env: globalThis.process.env, windowsHide: true, stdio: ['pipe','pipe','pipe'],
  });
  let output = '';
  let errors = '';
  let ready;
  const readyPromise = new Promise(resolve => { ready = resolve; });
  child.stdout.on('data', chunk => {
    output += chunk;
    if (output.includes('READY\n')) ready();
  });
  child.stderr.on('data', chunk => { errors += chunk; });
  child.stdin.end(JSON.stringify({ action, run, userIds: users.map(value => value.id), ...body }));
  const result = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) { reject(new Error(`Concurrent audit fixture failed: ${errors.slice(-1200)}`)); return; }
      try { resolve(JSON.parse(output.trim().split(/\r?\n/).at(-1))); }
      catch (cause) { reject(cause); }
    });
  });
  return { result, ready: readyPromise };
}
function client() {
  const cookies = new Map();
  let csrf = '';
  return {
    async call(path, body, expectedStatus = 200) {
      const response = await fetch(`${api.href.replace(/\/$/, '')}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { Accept: 'application/json', Cookie: [...cookies].map(([key,value]) => `${key}=${value}`).join('; '),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';', 1)[0];
        const delimiter = pair.indexOf('=');
        cookies.set(pair.slice(0, delimiter), pair.slice(delimiter+1));
      }
      const value = await response.json();
      if (typeof value.csrfToken === 'string') csrf = value.csrfToken;
      assert.equal(response.status, expectedStatus, `${stage}: ${path}: ${JSON.stringify(value.error ?? { responseFields: Object.keys(value) })}`);
      return value;
    },
  };
}
function candidate(room, owner, { count = 4, final = false, elapsed = 1000, id = randomUUID(), wrong = false, bulk = false } = {}) {
  let mono = 0;
  const start = Date.parse(room.started_at);
  const configuration = { clientSessionId: id, ownerScope: owner, mode: 'race', initialTarget: room.expected_text,
    durationMs: room.duration_seconds*1000, correctionPolicy: 'current-word', scoringPolicy: 'prose',
    inputMethod: 'keyboard', language: 'en', keyboardLayout: 'qwerty', contentRevision: 'server-race-v1',
    challengeId: room.id, settings: { localBot: false }, privacy: 'public-corpus' };
  const controller = new SessionController(configuration, { now: () => mono, wallNow: () => start + mono });
  if (!configuration.startImmediately) controller.startAt(0, start);
  if (bulk) {
    mono = 100;
    controller.input({ type: 'insert', text: room.expected_text.slice(0, 100) });
  } else for (let index = 0; index < count; index++) {
      mono = 100 + index*80;
      controller.input({ type: 'insert', text: wrong && index === 0 ? '#' : room.expected_text[index] });
    }
  mono = elapsed;
  return final ? controller.finish(elapsed === configuration.durationMs ? 'timeout' : 'manual') : controller.checkpoint();
}
function rankedCandidate(challenge, owner, overrides = {}, id = randomUUID(), inputPattern = 'ordinary') {
  let mono = 0;
  const start = Date.parse(challenge.starts_at);
  const configuration = { ...challenge.configuration, ...overrides, clientSessionId: id, ownerScope: owner,
    initialTarget: challenge.target_text, challengeId: challenge.id, privacy: 'public-corpus' };
  const controller = new SessionController(configuration, { now: () => mono, wallNow: () => start + mono });
  if (!configuration.startImmediately) controller.startAt(0, start);
  if (inputPattern === 'oversizedPersonal') {
    for (let index = 0; index < 6; index++) {
      mono = 100 + index*80;
      controller.input({ type: 'insert', text: '#'.repeat(index === 5 ? 1 : 4000) });
    }
  } else if (inputPattern === 'bulk') {
    mono = 100;
    controller.input({ type: 'insert', text: challenge.target_text.slice(0,100) });
  } else {
    const count = { ordinary: challenge.target_text.indexOf(' ')+1, zeroGap: 90, headline: 900, attempt: 900, legitimateFast: 300 }[inputPattern];
    for (let index = 0; index < count; index++) {
      mono = inputPattern === 'zeroGap' ? 100 : inputPattern === 'ordinary' ? 100+index*80 : 100+index*(inputPattern === 'legitimateFast' ? 49 : 16);
      controller.input({ type: 'insert', text: inputPattern === 'attempt' ? '#' : challenge.target_text[index] });
    }
  }
  mono = configuration.durationMs;
  return controller.finish('timeout');
}
const accept = (name) => checks.push({ name, status: 'PASS' });
let failure;
try {
  const preflight = fixture('check');
  assert.match(preflight.database, /(?:_test|_audit)$/);
  const clients = [client(), client(), client()];
  for (let index = 0; index < clients.length; index++) {
    stage = `synthetic account ${index+1}`;
    await clients[index].call('/auth/session');
    const signed = await clients[index].call('/auth/signup', { email: `race-${'abc'[index]}-${run}@example.test`, password: `Audit-${run}-password-42` }, 201);
    assert.ok(signed.user?.id);
    users.push(signed.user);
  }
  const [host, opponent, outsider] = clients;
  stage = 'authenticated create, membership and countdown';
  let { room } = await host.call('/race/create', { duration: 15 });
  assert.equal(room.status, 'waiting');
  const id = room.id;
  await outsider.call('/race/get', { code: room.room_code }, 403);
  await host.call('/race/join', { code: room.room_code }, 409);
  ({ room } = await opponent.call('/race/join', { code: room.room_code }));
  assert.equal(room.status, 'countdown');
  assert.equal(room.host_id, users[0].id);
  assert.equal(room.opponent_id, users[1].id);
  await outsider.call('/race/join', { code: room.room_code }, 409);
  await host.call('/race/submit', { raceId: id, candidate: candidate(room, users[0].id, { count: 0, elapsed: 0 }), finish: false }, 422);
  accept(stage);
  stage = 'server-replayed progress and immutable prefix';
  fixture('room-time', { raceId: id, ageMs: 2000 });
  ({ room } = await host.call('/race/get', { code: room.room_code }));
  assert.equal(room.status, 'active');
  const malformed = structuredClone(candidate(room, users[0].id));
  malformed.events = [null];
  await host.call('/race/submit', { raceId: id, candidate: malformed, finish: false }, 422);
  malformed.events = [{ text: {}, provenance: 'keyboard', offsetMs: 'bad' }];
  await host.call('/race/submit', { raceId: id, candidate: malformed, finish: false }, 422);
  await host.call('/race/submit', { raceId: id, candidate: candidate(room, users[0].id, { bulk: true }), finish: false }, 422);
  const clientId = randomUUID();
  const progress = candidate(room, users[0].id, { id: clientId });
  const first = await host.call('/race/submit', { raceId: id, candidate: progress, finish: false });
  assert.ok(first.room.host_progress > 0);
  const changed = candidate(room, users[0].id, { id: clientId, wrong: true });
  await host.call('/race/submit', { raceId: id, candidate: changed, finish: false }, 409);
  const ahead = candidate(room, users[0].id, { id: clientId, elapsed: 12000 });
  await host.call('/race/submit', { raceId: id, candidate: ahead, finish: false }, 422);
  await outsider.call('/race/submit', { raceId: id, candidate: progress, finish: false }, 403);
  const older = candidate(room, users[0].id, { id: clientId, count: 2 });
  const stale = await host.call('/race/submit', { raceId: id, candidate: older, finish: false });
  assert.equal(stale.room.version, first.room.version);
  accept(stage);
  stage = 'finish persistence, idempotency, leave and rematch';
  const finished = candidate(room, users[0].id, { id: clientId, final: true });
  await host.call('/race/submit', { raceId: id, candidate: finished, finish: true });
  await host.call('/race/submit', { raceId: id, candidate: finished, finish: true });
  const history = await host.call('/sessions?limit=100&offset=0');
  assert.equal(history.sessions.filter(value => value.clientSessionId === clientId).length, 1);
  const ended = await opponent.call('/race/leave', { raceId: id });
  assert.equal(ended.room.status, 'completed');
  assert.equal(ended.room.winner_id, users[0].id);
  const rematch = await host.call('/race/rematch', { raceId: id });
  const repeat = await host.call('/race/rematch', { raceId: id });
  assert.notEqual(rematch.room.id, id);
  assert.equal(rematch.room.id, repeat.room.id);
  assert.notEqual(rematch.room.expected_text, room.expected_text);
  accept(stage);
  stage = 'independent PHP processes serialize a contested MySQL room seat';
  const contested = (await host.call('/race/create', { duration: 15 })).room;
  const holding = concurrentFixture('hold-room', { raceId: contested.id });
  await holding.ready;
  const contenders = await Promise.all([
    concurrentFixture('join-room', { owner: users[1].id, code: contested.room_code }).result,
    concurrentFixture('join-room', { owner: users[2].id, code: contested.room_code }).result,
  ]);
  const release = await holding.result;
  assert.deepEqual(contenders.map(value => value.status).sort(), [200,409]);
  assert.ok(contenders.every(value => value.beganAt < release.releasedAt), 'Both independent requests must begin while the room lock is held.');
  assert.ok(contenders.every(value => value.finishedAt >= release.releasedAt), 'Both operations must wait for the held room lock.');
  accept(stage);
  stage = 'quick match uses two authenticated people';
  const matching = await host.call('/race/quick-match', { duration: 30 });
  const matched = await opponent.call('/race/quick-match', { duration: 30 });
  assert.equal(matching.room.id, matched.room.id);
  assert.equal(matched.room.status, 'countdown');
  accept(stage);
  stage = 'automatic matchmaking skips a host without a fresh heartbeat';
  const staleHost = (await host.call('/race/quick-match', { duration: 60 })).room;
  fixture('stale-host', { raceId: staleHost.id });
  const freshWait = (await opponent.call('/race/quick-match', { duration: 60 })).room;
  assert.notEqual(freshWait.id, staleHost.id);
  assert.equal(freshWait.status, 'waiting');
  const freshPair = (await host.call('/race/quick-match', { duration: 60 })).room;
  assert.equal(freshPair.id, freshWait.id);
  assert.equal(freshPair.status, 'countdown');
  accept(stage);
  stage = 'shared deadline settlement';
  let timed = (await host.call('/race/create', { duration: 15 })).room;
  timed = (await opponent.call('/race/join', { code: timed.room_code })).room;
  fixture('room-time', { raceId: timed.id, ageMs: 16000 });
  timed = (await host.call('/race/get', { code: timed.room_code })).room;
  const hostFinal = candidate(timed, users[0].id, { count: timed.expected_text.indexOf(' ')+1, final: true, elapsed: 15000 });
  await host.call('/race/submit', { raceId: timed.id, candidate: hostFinal, finish: true });
  await opponent.call('/race/submit', { raceId: timed.id, candidate: candidate(timed, users[1].id, { count: 1, final: true, elapsed: 15000 }), finish: true });
  const departed = (await host.call('/race/leave', { raceId: timed.id })).room;
  assert.equal(departed.status, 'active', 'Leaving during post-deadline receipt grace must not forfeit earned results.');
  await new Promise(resolve => setTimeout(resolve, 2250));
  const settled = (await opponent.call('/race/get', { code: timed.room_code })).room;
  assert.equal(settled.status, 'completed');
  assert.equal(settled.winner_id, users[0].id);
  assert.equal(settled.ended_at, settled.deadline_at);
  accept(stage);
  stage = 'competitive bulk, burst and sustained-rate heuristics';
  for (const pattern of ['bulk','zeroGap','headline','attempt']) {
    const challenge = (await opponent.call('/challenges/issue', { duration: 15 })).challenge;
    const shifted = fixture('challenge-time', { challengeId: challenge.id });
    challenge.starts_at = new Date(shifted.start).toISOString();
    const rejected = await opponent.call('/sessions', { candidate: rankedCandidate(challenge, users[1].id, {}, randomUUID(), pattern), cloudConsent: false }, 422);
    assert.match(rejected.error.code, /^competitive-/);
  }
  const fastChallenge = (await opponent.call('/challenges/issue', { duration: 15 })).challenge;
  const fastStart = fixture('challenge-time', { challengeId: fastChallenge.id });
  fastChallenge.starts_at = new Date(fastStart.start).toISOString();
  const fast = rankedCandidate(fastChallenge, users[1].id, {}, randomUUID(), 'legitimateFast');
  assert.ok(fast.metrics.wpm > 200);
  const fastAccepted = await opponent.call('/sessions', { candidate: fast, cloudConsent: false });
  assert.equal(fastAccepted.accepted.eligibility.eligible, true);
  const personalChallenge = { ...fastChallenge, id: undefined };
  const personal = rankedCandidate(personalChallenge, users[1].id, {}, randomUUID(), 'bulk');
  await opponent.call('/sessions', { candidate: personal, cloudConsent: false, expectedOwner: users[0].id }, 409);
  const personalAccepted = await opponent.call('/sessions', { candidate: personal, cloudConsent: false });
  assert.equal(personalAccepted.accepted.eligibility.eligible, false);
  const oversized = structuredClone(rankedCandidate(personalChallenge, users[1].id, {}, randomUUID(), 'oversizedPersonal'));
  oversized.characters = [];
  oversized.timeSeries = [];
  const budget = await opponent.call('/sessions', { candidate: oversized, cloudConsent: false }, 422);
  assert.match(budget.error.message, /20,?000|resource|budget/i);
  accept(stage);
  stage = 'ranked challenge rejects extra comparison dimensions';
  for (const patch of [{ script: 'Greek' }, { generatorVersion: 'forged-generator' }, { correctionPolicy: undefined }, { seed: 'forged-seed' }, { startImmediately: true }]) {
    const challenge = (await host.call('/challenges/issue', { duration: 15 })).challenge;
    const shifted = fixture('challenge-time', { challengeId: challenge.id });
    challenge.starts_at = new Date(shifted.start).toISOString();
    await host.call('/sessions', { candidate: rankedCandidate(challenge, users[0].id, patch), cloudConsent: false }, 422);
  }
  accept(stage);
  stage = 'ranked acceptance and one-use redemption';
  const challenge = (await host.call('/challenges/issue', { duration: 15 })).challenge;
  const shifted = fixture('challenge-time', { challengeId: challenge.id });
  challenge.starts_at = new Date(shifted.start).toISOString();
  const ranked = rankedCandidate(challenge, users[0].id);
  const submitted = await host.call('/sessions', { candidate: ranked, cloudConsent: false });
  assert.equal(submitted.accepted.eligibility.eligible, true);
  const retried = await host.call('/sessions', { candidate: ranked, cloudConsent: false });
  assert.equal(retried.accepted.payloadHash, submitted.accepted.payloadHash);
  await host.call('/sessions', { candidate: rankedCandidate(challenge, users[0].id), cloudConsent: false }, 422);
  accept(stage);
} catch (cause) {
  failure = cause;
} finally {
  if (users.length) {
    try { fixture('cleanup'); } catch (cause) { failure ??= cause; }
  }
}
console.log(JSON.stringify({ kind: 'real HTTP and InnoDB acceptance with explicit synthetic event/SQL fixtures', run, checks, failedStage: failure ? stage : null, error: failure?.message ?? null }, null, 2));
if (failure) process.exitCode = 1;
