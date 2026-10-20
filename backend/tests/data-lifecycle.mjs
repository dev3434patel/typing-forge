import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SessionController } from '../../src/lib/typing-core/session.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const base = process.env.SPAROWTYPE_TEST_API_URL || 'http://127.0.0.1:8081/api';
const { binary: php, args: phpArgs } = phpRuntime();
const config = process.env.SPAROWTYPE_CONFIG_FILE;
if (!config) throw new Error('Set SPAROWTYPE_CONFIG_FILE to the private dedicated audit configuration.');
const root = path.resolve(import.meta.dirname, '../..');
const run = randomBytes(5).toString('hex');
const users = [];
const checks = [];

function fixture(input) {
  const result = spawnSync(php, [...phpArgs, path.join(root, 'backend/tests/data-fixture.php')], {
    cwd: root, env: process.env, input: JSON.stringify(input), encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`Guarded database fixture failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}
function passed(name) { checks.push({ name, status: 'PASS' }); }
class Client {
  cookies = new Map();
  csrfToken = '';
  user = null;
  async request(method, route, body, options = {}) {
    const headers = { Origin: 'http://127.0.0.1:4173', Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ') };
    if (method !== 'GET') { headers['Content-Type'] = 'application/json'; headers['X-CSRF-Token'] = this.csrfToken; }
    Object.assign(headers, options.headers || {});
    const response = await fetch(base + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';'), split = pair.indexOf('=');
      this.cookies.set(pair.slice(0, split), pair.slice(split + 1));
    }
    const value = await response.json();
    if (value.csrfToken) this.csrfToken = value.csrfToken;
    if (Object.hasOwn(value, 'user')) this.user = value.user;
    return { response, value };
  }
  async expect(method, route, body, status = 200, options) {
    const result = await this.request(method, route, body, options);
    assert.equal(result.response.status, status, `${method} ${route}: ${result.value.error?.code || 'unexpected response'}`);
    return result;
  }
}
function candidate(owner, id = randomUUID(), mode = 'quote') {
  let now = 0;
  const controller = new SessionController({ clientSessionId: id, ownerScope: owner, mode, initialTarget: 'the cat', correctionPolicy: 'current-word', inputMethod: 'keyboard', settings: { contentId: 'php-http-audit-v1' }, ...(mode === 'custom' ? { privacy: 'private-custom' } : {}) }, { now: () => now, wallNow: () => 1792440000000 + now });
  for (const text of ['t', 'h', 'x']) { controller.input({ type: 'insert', text }); now += 100; }
  controller.input({ type: 'delete' }); now += 100;
  for (const text of ['e', ' ', 'c', 'a', 't']) { controller.input({ type: 'insert', text }); now += 100; }
  return structuredClone(controller.result);
}
try {
  fixture({ operation: 'reset-audit-rate-limits' });
  const alice = new Client(), bob = new Client(), stranger = new Client();
  const bootstrap = await alice.expect('GET', '/auth/session');
  assert.equal(bootstrap.value.user, null); assert.match(alice.csrfToken, /^[a-f0-9]{64}$/);
  assert(bootstrap.response.headers.getSetCookie().some(cookie => /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie)));
  passed('guest session, real CSRF token and HttpOnly SameSite cookie');
  await alice.expect('POST', '/auth/signup', { email: `http-audit-${run}-alice@example.invalid`, password: 'This is a private audit password 1!' }, 403, { headers: { 'X-CSRF-Token': 'invalid' } });
  passed('state changes reject invalid CSRF');
  await alice.expect('GET', '/auth/session', undefined, 403, { headers: { Origin: 'https://untrusted.invalid' } });
  passed('foreign credentialed origins are rejected');
  const guestToken = alice.csrfToken;
  await alice.expect('POST', '/auth/signup', { email: `http-audit-${run}-alice@example.invalid`, password: 'This is a private audit password 1!' }, 201);
  users.push(alice.user.id);
  assert.notEqual(alice.csrfToken, guestToken);
  assert.equal(fixture({ operation: 'inspect-password', owner: alice.user.id }).hashed, true);
  passed('real signup stores a password_hash and rotates session/CSRF');
  await bob.expect('GET', '/auth/session');
  await bob.expect('POST', '/auth/signup', { email: `http-audit-${run}-bob@example.invalid`, password: 'This is a private audit password 2!' }, 201);
  users.push(bob.user.id);
  await stranger.expect('GET', '/auth/session');
  await stranger.expect('GET', '/sessions', undefined, 401);
  await alice.expect('GET', `/sessions?expectedOwner=${bob.user.id}`, undefined, 409);
  passed('anonymous and wrong-owner account reads are blocked');
  await alice.expect('POST', '/profile', { expectedOwner: alice.user.id, handle: `audit_${run}` });
  await bob.expect('POST', '/profile', { expectedOwner: bob.user.id, handle: `audit_${run}` }, 409);
  await alice.expect('POST', '/profile', { expectedOwner: alice.user.id, handle: 'person@example.invalid' }, 422);
  passed('public handles are validated and uniquely owned');
  let pref = (await alice.expect('GET', '/preferences')).value;
  assert.equal(pref.version, 0);
  pref = (await alice.expect('POST', '/preferences', { expectedOwner: alice.user.id, expectedVersion: 0, patch: { theme: 'sparow-light', soundPack: 'arcade', reducedMotion: true, showKeyboard: false, showFingerGuide: true } })).value;
  assert.equal(pref.version, 1); assert.equal(pref.conflict, false);
  assert.equal(pref.preferences.showKeyboard, false); assert.equal(pref.preferences.showFingerGuide, true);
  const stale = (await alice.expect('POST', '/preferences', { expectedOwner: alice.user.id, expectedVersion: 0, patch: { theme: 'ember' } })).value;
  assert.equal(stale.conflict, true); assert.equal(stale.preferences.theme, 'sparow-light');
  await alice.expect('POST', '/preferences', { expectedOwner: alice.user.id, expectedVersion: 1, patch: { volume: 'loud' } }, 422);
  await alice.expect('POST', '/preferences', { expectedOwner: alice.user.id, expectedVersion: 1, patch: { showKeyboard: 'true' } }, 422);
  await alice.expect('POST', '/preferences', { expectedOwner: alice.user.id, expectedVersion: 1, patch: { showFingerGuide: 1 } }, 422);
  passed('preference optimistic locking, valid choices and invalid-type rejection');
  const evidence = candidate(alice.user.id);
  const accepted = (await alice.expect('POST', '/sessions', { candidate: evidence, cloudConsent: false })).value.accepted;
  assert.equal(accepted.metrics.inputAccuracy, 87.5); assert.equal(accepted.metrics.finalTextAccuracy, 100);
  assert.equal(accepted.eligibility.eligible, false);
  const retry = (await alice.expect('POST', '/sessions', { candidate: evidence, cloudConsent: false })).value.accepted;
  assert.equal(retry.payloadHash, accepted.payloadHash);
  const tampered = structuredClone(evidence); tampered.metrics.inputAccuracy = 100;
  await alice.expect('POST', '/sessions', { candidate: tampered, cloudConsent: false }, 422);
  await bob.expect('POST', '/sessions', { candidate: evidence, cloudConsent: false }, 422);
  passed('native replay preserves corrected errors, rejects tampering and deduplicates immutable uploads');
  const history = (await alice.expect('GET', `/sessions?expectedOwner=${alice.user.id}`)).value;
  assert.equal(history.sessions.length, 1); assert.equal(history.sessions[0].summary.accuracy, 87.5);
  assert.equal(history.ownerId, alice.user.id); assert.equal(history.hasMore, false);
  assert.equal((await bob.expect('GET', '/sessions')).value.sessions.length, 0);
  passed('history projections preserve metrics and stay account scoped');
  const privateEvidence = candidate(alice.user.id, randomUUID(), 'custom');
  await alice.expect('POST', '/sessions', { candidate: privateEvidence, cloudConsent: false }, 422);
  await alice.expect('POST', '/sessions', { candidate: privateEvidence, cloudConsent: true });
  fixture({ operation: 'expire', owner: alice.user.id, sessionId: privateEvidence.clientSessionId });
  await alice.expect('GET', '/sessions');
  assert.deepEqual(fixture({ operation: 'storage', owner: alice.user.id, sessionId: privateEvidence.clientSessionId }), { summaryPresent: true, evidencePresent: false, receiptPresent: true, receiptDeleted: false });
  passed('private text needs explicit consent and expires while retaining its summary');
  await alice.expect('DELETE', `/sessions/${evidence.clientSessionId}`, { expectedOwner: bob.user.id }, 409);
  await alice.expect('DELETE', `/sessions/${evidence.clientSessionId}`, { expectedOwner: alice.user.id });
  await alice.expect('POST', '/sessions', { candidate: evidence, cloudConsent: false }, 409);
  assert.equal(fixture({ operation: 'storage', owner: alice.user.id, sessionId: evidence.clientSessionId }).receiptDeleted, true);
  passed('owner-bound session deletion and durable upload tombstones');
  const long = new Client(), password = 'A'.repeat(80) + 'correct-tail';
  await long.expect('GET', '/auth/session');
  await long.expect('POST', '/auth/signup', { email: `http-audit-${run}-long@example.invalid`, password }, 201);
  users.push(long.user.id); const longId = long.user.id;
  await long.expect('POST', '/auth/signout', { expectedOwner: longId });
  await long.expect('POST', '/auth/signin', { email: `http-audit-${run}-long@example.invalid`, password: 'A'.repeat(80) + 'wrong-tail' }, 401);
  await long.expect('POST', '/auth/signin', { email: `http-audit-${run}-long@example.invalid`, password });
  assert.equal(long.user.id, longId);
  passed('real signout/signin and significant password bytes beyond bcrypt72');
  await alice.expect('POST', '/account/delete', { confirmation: 'DELETE MY ACCOUNT', expectedOwner: bob.user.id }, 409);
  await alice.expect('POST', '/account/delete', { confirmation: 'DELETE', expectedOwner: alice.user.id }, 422);
  const aliceId = alice.user.id;
  await alice.expect('POST', '/account/delete', { confirmation: 'DELETE MY ACCOUNT', expectedOwner: aliceId });
  assert.equal(alice.user, null); assert.equal((await alice.expect('GET', '/auth/session')).value.user, null);
  users.splice(users.indexOf(aliceId), 1);
  await bob.expect('GET', '/sessions');
  passed('explicit account deletion invalidates its cookie without touching another account');
  const cohorts = (await stranger.expect('GET', '/leaderboards/cohorts')).value.cohorts;
  assert.deepEqual(cohorts, []);
  await stranger.expect('GET', '/leaderboards?period=invalid', undefined, 422);
  passed('personal practice cannot manufacture ranked entries; ranking period inputs are validated');
  for (let attempt = 0; attempt < 12; attempt++) await stranger.expect('POST', '/auth/signin', { email: `missing-${run}@example.invalid`, password: 'Deliberately incorrect password' }, 401);
  await stranger.expect('POST', '/auth/signin', { email: `missing-${run}@example.invalid`, password: 'Deliberately incorrect password' }, 429);
  passed('database-backed authentication rate limit enforces its configured boundary');
  const report = { date: new Date().toISOString(), backend: 'native PHP8.2 + MariaDB10.4 PDO', checks, passed: checks.length, failed: 0, syntheticAccounts: true, externalDeployment: false };
  if (process.env.SPAROWTYPE_TEST_REPORT) await writeFile(process.env.SPAROWTYPE_TEST_REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  fixture({ operation: 'cleanup-run', run });
  fixture({ operation: 'reset-audit-rate-limits' });
}
