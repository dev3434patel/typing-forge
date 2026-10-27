import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

assert.equal(process.env.SPAROWTYPE_PACK_HTTP_ACCEPTANCE, '1', 'Wait for coordinated GO and use a newly owned ephemeral database.');
assert.ok(process.env.SPAROWTYPE_CONFIG_FILE && process.env.SPAROWTYPE_TEST_API_URL, 'An explicit isolated config and API URL are required; no application default is used.');
const base = new URL(process.env.SPAROWTYPE_TEST_API_URL);
assert.equal(base.hostname, '127.0.0.1');
assert.ok(!['8081', '80', '443', ''].includes(base.port), 'Refusing a normal application endpoint.');
const root = path.resolve(import.meta.dirname, '../..'), run = randomBytes(5).toString('hex'), runtime = phpRuntime();
const checks = [], temporary = await mkdtemp(path.join(tmpdir(), 'sparowtype-classroom-http-'));
let failure = null, guardedTarget = null, cleanup = null;
function fixture(operation) {
  const output = spawnSync(runtime.binary, [...runtime.args, path.join(root, 'backend/tests/classroom-fixture.php')], { env: process.env, input: JSON.stringify({ run, operation }), encoding: 'utf8', windowsHide: true });
  assert.equal(output.status, 0, `Isolated ${operation} fixture failed; private diagnostics suppressed.`);
  return JSON.parse(output.stdout);
}
async function lockFixture(memberId) {
  const child = spawn(runtime.binary, [...runtime.args, path.join(root, 'backend/tests/classroom-fixture.php')], { env: process.env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.resume();
  const exited = new Promise(resolve => { child.once('exit', code => resolve(code)); child.once('error', () => resolve(-1)); });
  const locked = new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Owned member lock fixture timed out.')), 15000);
    child.stdout.on('data', chunk => { text += chunk.toString(); if (text.includes('\n')) { clearTimeout(timer); try { assert.equal(JSON.parse(text.split('\n')[0]).locked, true); resolve(); } catch { reject(new Error('Owned lock fixture did not confirm its lock.')); } } });
    child.once('error', () => { clearTimeout(timer); reject(new Error('Owned lock fixture could not start.')); });
    child.once('exit', () => { clearTimeout(timer); if (!text.includes('\n')) reject(new Error('Owned lock fixture ended before confirmation.')); });
  });
  child.stdin.write(JSON.stringify({ run, operation: 'hold-own-member-lock', memberId }) + '\n');
  try { await locked; }
  catch (error) { child.stdin.end(JSON.stringify({ action: 'release' }) + '\n'); await exited; throw error; }
  return async () => { child.stdin.end(JSON.stringify({ action: 'release' }) + '\n'); assert.equal(await exited, 0, 'Owned member lock fixture did not release cleanly.'); };
}
class Client {
  cookies = new Map(); csrf = ''; user = null;
  async call(method, route, body, status = 200, csrf = true) {
    const response = await fetch(base.href.replace(/\/$/, '') + route, { method, signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...(method === 'GET' ? {} : { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': this.csrf } : {}) }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    for (const raw of response.headers.getSetCookie()) { const pair = raw.split(';', 1)[0], split = pair.indexOf('='); this.cookies.set(pair.slice(0, split), pair.slice(split + 1)); }
    const value = await response.json();
    if (value.csrfToken) this.csrf = value.csrfToken;
    if (Object.hasOwn(value, 'user')) this.user = value.user;
    assert.equal(response.status, status, `${method} ${route.split('?')[0]}: HTTP${response.status} (${value.error?.code ?? 'unexpected'})`);
    return { value, response };
  }
}
try {
  const guard = fixture('guard'), teacher = new Client(), student = new Client(), stranger = new Client();
  for (const client of [teacher, student, stranger]) {
    const guest = await client.call('GET', '/auth/session');
    assert.ok(guest.response.headers.getSetCookie().some(cookie => cookie.startsWith(guard.sessionName + '=')), 'Private API cookie namespace mismatch.');
  }
  guardedTarget = { database: guard.database, port: guard.port, api: base.href, sessionNamespaceMatched: true };
  await teacher.call('POST', '/auth/signup', { email: `classroom-audit-${run}-teacher@example.invalid`, password: `PrivateClassroomAudit!${randomUUID()}` }, 201);
  const owner = teacher.user.id;
  checks.push('one synthetic teacher account created only after isolated schema, port and cookie guards');
  await stranger.call('GET', '/classroom', undefined, 401);
  await teacher.call('POST', '/classroom/create', { title: 'Private audit class', expectedOwner: owner }, 403, false);
  await teacher.call('POST', '/classroom/create', { title: 'Private audit class', expectedOwner: randomUUID() }, 409);
  const created = (await teacher.call('POST', '/classroom/create', { title: 'Private audit class', expectedOwner: owner })).value;
  const classId = created.class.id, code = created.privateCode;
  assert.ok(/^(?:[A-F0-9]{4}-){7}[A-F0-9]{4}$/.test(code), 'Private code is not the expected 128-bit grouped value.');
  checks.push('teacher actions require authentication, CSRF and matching owner; private code contains 128 random bits');
  const joined = (await student.call('POST', '/classroom/student/join', { code, alias: 'Quiet Pupil' })).value.student;
  const joinedAgain = (await student.call('POST', '/classroom/student/join', { code, alias: 'Quiet Pupil' })).value.student;
  assert.ok(joinedAgain.memberId === joined.memberId && joinedAgain.configuration.clientSessionId === joined.configuration.clientSessionId, 'Same student capability should reuse the pending assignment.');
  await student.call('POST', '/classroom/student/join', { code, alias: 'Different Pupil' }, 409);
  assert.equal((await student.call('GET', '/auth/session')).value.user, null);
  checks.push('guest student capability is idempotent, cannot silently orphan an alias, and grants no account identity');
  const release = await lockFixture(joined.memberId);
  let pendingJoin, settled = false, blocked = false;
  try {
    pendingJoin = student.call('POST', '/classroom/student/join', { code, alias: 'Quiet Pupil' }).then(value => ({ value }), error => ({ error })).finally(() => { settled = true; });
    await new Promise(resolve => setTimeout(resolve, 300));
    blocked = !settled;
  } finally { await release(); }
  const resumed = await pendingJoin;
  if (resumed.error) throw resumed.error;
  assert.equal(blocked, true, 'Pending assignment access bypassed an active member-row lock.');
  assert.ok(resumed.value.value.student.configuration.clientSessionId === joined.configuration.clientSessionId, 'A serialized join should reuse its pending assignment.');
  checks.push('an independent real SQL member lock fences assignment reads; join resumes after release without duplicating an assignment');
  const require = createRequire(import.meta.url), { build } = createRequire(require.resolve('vite'))('esbuild'), modulePath = path.join(temporary, 'core.mjs');
  await build({ stdin: { contents: "export {SessionController} from './src/lib/typing-core/session.ts';", resolveDir: root }, bundle: true, platform: 'node', format: 'esm', target: 'es2022', outfile: modulePath, logLevel: 'silent' });
  const { SessionController } = await import(pathToFileURL(modulePath));
  function candidate(interval = 110) {
    let now = 0;
    const controller = new SessionController(joined.configuration, { now: () => now, wallNow: () => 1_792_510_000_000 + now });
    for (const text of joined.configuration.initialTarget) { now += interval; controller.input({ type: 'insert', text }); }
    return structuredClone(controller.result);
  }
  const result = candidate();
  await stranger.call('POST', '/classroom/student/progress', { candidate: result, shareConsent: true }, 401);
  await student.call('POST', '/classroom/student/progress', { candidate: result }, 422);
  const changed = structuredClone(result); changed.configuration.initialTarget += ' altered';
  await student.call('POST', '/classroom/student/progress', { candidate: changed, shareConsent: true }, 422);
  const accepted = (await student.call('POST', '/classroom/student/progress', { candidate: result, shareConsent: true })).value;
  assert.ok(accepted.accepted && !accepted.duplicate, 'First canonical assignment should create one aggregate receipt.');
  assert.equal(accepted.verification, 'replay-checked-not-human-verified');
  const retry = (await student.call('POST', '/classroom/student/progress', { candidate: result, shareConsent: true })).value;
  assert.ok(retry.accepted && retry.duplicate, 'Exact evidence retry should remain idempotent.');
  await student.call('POST', '/classroom/student/progress', { candidate: candidate(120), shareConsent: true }, 409);
  checks.push('sharing requires capability and explicit consent; altered assignment is rejected, canonical replay is accepted once and conflicting evidence is rejected');
  const list = (await teacher.call('GET', `/classroom?expectedOwner=${owner}`)).value;
  const report = list.classes.find(room => room.id === classId), member = report.members[0];
  assert.equal(member.sessions, 1); assert.equal(member.insertionAttempts, result.metrics.insertionAttempts); assert.equal(member.correctAttempts, result.metrics.correctAttempts);
  for (const forbidden of [code, joined.configuration.initialTarget, 'events', 'initialTarget', '@example.invalid']) assert.ok(!JSON.stringify(list).includes(forbidden), 'Teacher aggregates leaked a private code, account address or input content.');
  assert.ok(accepted.configuration.clientSessionId !== result.clientSessionId, 'Next assignment needs a new immutable session identity.');
  checks.push('teacher receives exact weighted aggregate facts without code, email, passage or keystroke logs; next assignment receives a new identity');
  await student.call('POST', '/classroom/student/leave', {});
  assert.equal((await teacher.call('GET', `/classroom?expectedOwner=${owner}`)).value.classes[0].members.length, 0);
  await student.call('POST', '/classroom/student/progress', { candidate: result, shareConsent: true }, 401);
  checks.push('student leave deletes membership and aggregate receipts and revokes the narrow capability');
  await teacher.call('POST', '/classroom/student/join', { code, alias: 'Teacher Pupil' });
  assert.ok((await teacher.call('GET', '/auth/session')).value.user?.id === owner, 'Joining a class must preserve an existing authenticated teacher account.');
  await teacher.call('POST', '/classroom/student/leave', {});
  assert.ok((await teacher.call('GET', '/auth/session')).value.user?.id === owner, 'Leaving a class must preserve the teacher account.');
  checks.push('authenticated students can join and leave without resetting general account authentication');
  const removed = (await teacher.call('POST', '/classroom/delete', { classId, expectedOwner: owner })).value;
  assert.equal(removed.deleted, true); assert.equal((await teacher.call('GET', `/classroom?expectedOwner=${owner}`)).value.classes.length, 0);
  await teacher.call('POST', '/classroom/create', { title: 'Account cascade class', expectedOwner: owner });
  await teacher.call('POST', '/account/delete', { expectedOwner: owner, confirmation: 'DELETE MY ACCOUNT' });
  const counts = fixture('inspect-own-counts');
  assert.ok(Object.values(counts).every(count => count === 0), 'Owned teacher deletion did not cascade all classroom data.');
  checks.push('explicit class deletion and owned teacher-account deletion cascade only the synthetic classroom data');
} catch (error) {
  failure = { message: (error instanceof Error ? error.message : String(error)).replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/gi, '[identity]').replace(/[\w.-]+@example\.invalid/g, '[synthetic-address]') };
  process.exitCode = 1;
} finally {
  try { cleanup = fixture('cleanup-run'); } catch { cleanup = { status: 'UNVERIFIED', reason: 'Owned synthetic cleanup could not be confirmed.' }; process.exitCode = 1; }
  await rm(temporary, { recursive: true, force: true });
  const report = { status: failure ? 'FAILED' : 'PASS', at: new Date().toISOString(), scope: 'Opt-in isolated native classroom PHP/PDO HTTP lifecycle with one synthetic teacher and narrow cookie student capabilities', guardedTarget, checks: checks.map(name => ({ name, status: 'PASS' })), passed: checks.length, failed: failure ? 1 : 0, failure, cleanup, credentialsOrCookiesEmitted: false, rateCountersReset: false, userDatabaseTouched: false };
  const destination = path.resolve(process.env.SPAROWTYPE_CLASSROOM_HTTP_REPORT || path.join(root, 'audit/mega-pack-2026-10-21/classroom-http.json'));
  await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
}
