// Separate from the1653-request HTTP capacity gate. Root wires this into the
// existing owned backend command loop; this script never starts a service.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE24_RATE_NATIVE_ACCEPTANCE, '1');
const directory = 'audit/2026-10-27', owner = process.env.SPAROWTYPE_CAPACITY_OWNER_ID;
assert.match(owner ?? '', /^[a-f0-9]{16}$/);
const build = process.env.SPAROWTYPE_FINAL24_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/);
const source = `${directory}/final24-source.json`, sourceBefore = await verifyFrozenSource(source);
assert.equal(sourceBefore.frozen.local.version, build);
assert.equal(sourceBefore.receipt.compared, 504);
assert.deepEqual(sourceBefore.receipt.mismatches, []);
const owned = await realpath(path.join('backend/storage', `pack-instance-${owner}`));
const marker = JSON.parse(await readFile(path.join(owned, 'ownership.json'), 'utf8'));
assert.equal(marker.id, owner); assert.equal(path.resolve(marker.root), process.cwd());
assert.ok(Number.isInteger(marker.runnerPid) && marker.runnerPid > 0);
assert.equal(await realpath(process.env.ARENA_AUDIT_CONFIG ?? ''), path.join(owned, 'app-config.php'));
assert.match(process.env.ARENA_AUDIT_GUARD ?? '', /^[a-f0-9]{64}$/);
const apache = JSON.parse(await readFile(`${directory}/pack-backend-${owner}-apache-runtime.json`, 'utf8'));
assert.equal(apache.status, 'PASS'); assert.equal(apache.sapi, 'apache2handler');
assert.equal(apache.privateConfigMatched, true); assert.equal(apache.existingApacheConfigRead, false);
const driver = `${directory}/native-rate-worker-source24.php`, runtime = phpRuntime(), runId = randomBytes(6).toString('hex');
const prefix = `${directory}/source24-native-rate-${owner}`;
for (const file of [`${prefix}.json`, `${prefix}-protocol.json`]) await assert.rejects(access(file), { code: 'ENOENT' });
const inputPaths = [driver, `${directory}/run-source24-native-rate.mjs`, 'scripts/php-runtime.mjs', 'backend/src/Security.php', 'backend/src/Database.php'];
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const hashes = Object.fromEntries(await Promise.all(inputPaths.map(async file => [file, await digest(file)])));
const protocol = { declaredAt: new Date().toISOString(), build, source: sourceBefore.receipt, ownerId: owner,
  scope: 'Genuine native PDO atomic accounting only, separate from the1653-request HTTP burst. No HTTP/authentication/CSRF/session-policy or throughput certification.',
  connections: 8, callsPerConnection: 40, expectedSharedCalls: 320, limit: 300, windowSeconds: 60,
  expectedAdmitted: 300, expectedLimited: 20, otherAccountExpectedCounter: 1,
  nearBoundaryWaitMaxMs: 40050, readinessTimeoutMs: 10000, callsTimeoutMs: 12000,
  actualClock: true, retries: 0, counterReset: false, quotaBypass: false, thresholdsUnchanged: true,
  startBarrier: 'All8 actual PDO connections must report ready before one coordinated GO.', inputHashes: hashes,
  privateConfigReadByCoordinator: false, ownedConfigReadOnlyByGuardedPhpWorker: true, originalConfigRead: false,
  cleanup: 'Only the original owner later removes the wholly owned database/processes; this check never resets or deletes counters.' };
await writeFile(`${prefix}-protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const children = new Set(), checks = [], startAt = performance.now();
let failure = null, before = null, after = null, other = null, workers = [], windowStarted = null, waitedMs = 0;
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
function launch(request, barrier = false) {
  const child = spawn(runtime.binary, [...runtime.args, driver], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
  children.add(child);
  let text = '', stderrBytes = 0, readyValue, doneValue, readyResolve, readyReject, doneResolve, doneReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const done = new Promise((resolve, reject) => { doneResolve = resolve; doneReject = reject; });
  // Both promises may reject during startup. Attach observers immediately so
  // a failed owned child never becomes an unhandled rejection.
  ready.catch(() => {}); done.catch(() => {});
  const abort = code => { child.kill(); const error = new Error(code); readyReject(error); doneReject(error); };
  let timer = setTimeout(() => abort('native-child-readiness-timeout'), 10000);
  child.stdout.on('data', bytes => {
    text += bytes.toString('utf8');
    if (text.length > 128000) return abort('native-child-output-bound');
    let line;
    while ((line = text.indexOf('\n')) >= 0) {
      const raw = text.slice(0, line); text = text.slice(line + 1);
      try {
        const value = JSON.parse(raw);
        if (value.status === 'FAILED') return abort(value.code ?? 'native-child-failed');
        if (value.stage === 'ready') { readyValue = value; clearTimeout(timer); timer = null; readyResolve(value); }
        else doneValue = value;
      } catch { return abort('native-child-protocol'); }
    }
  });
  child.stderr.on('data', bytes => { stderrBytes += bytes.length; if (stderrBytes > 64000) abort('native-child-diagnostics-bound'); });
  child.once('error', () => abort('native-child-spawn-failed'));
  child.once('close', code => {
    clearTimeout(timer); children.delete(child);
    if (code !== 0 || !doneValue || stderrBytes !== 0 || (barrier && !readyValue)) { const error = new Error('native-child-not-clean'); readyReject(error); doneReject(error); }
    else { if (!barrier) readyResolve(doneValue); doneResolve(doneValue); }
  });
  child.stdin.on('error', () => abort('native-child-input'));
  child.stdin.write(JSON.stringify({ ...request, runId }) + '\n');
  if (!barrier) child.stdin.end();
  return { ready, done, go() { timer = setTimeout(() => abort('native-child-call-timeout'), 12000); child.stdin.end(JSON.stringify({ go: true, windowStarted }) + '\n'); } };
}
try {
  before = await launch({ action: 'inspect' }).done;
  assert.equal(before.ownerGuarded, true); assert.equal(before.buckets.shared, null); assert.equal(before.buckets.other, null);
  assert.ok(Math.abs(before.databaseNow - before.phpNow) <= 1, 'Native database/PHP clocks differ.');
  const remaining = 60 - before.phpNow % 60;
  if (remaining < 40) { waitedMs = remaining * 1000 + 50; await new Promise(resolve => setTimeout(resolve, waitedMs)); }
  before = await launch({ action: 'inspect' }).done;
  assert.equal(before.buckets.shared, null); assert.equal(before.buckets.other, null);
  windowStarted = Math.floor(before.phpNow / 60) * 60;
  const launched = Array.from({ length: 8 }, () => launch({ action: 'worker', windowStarted }, true));
  const ready = await Promise.all(launched.map(worker => worker.ready));
  check('eight distinct native PDO connections reach the same actual minute before GO', new Set(ready.map(row => row.connectionId)).size === 8 && ready.every(row => row.ownerGuarded && row.phpWindow === windowStarted));
  assert.ok(checks.every(row => row.pass), 'Native readiness boundary failed.');
  assert.ok(Date.now() / 1000 - windowStarted < 40, 'Insufficient actual window remains after readiness; no retry.');
  launched.forEach(worker => worker.go());
  workers = await Promise.all(launched.map(worker => worker.done));
  other = await launch({ action: 'other', windowStarted }).done;
  after = await launch({ action: 'inspect' }).done;
  const calls = workers.flatMap(worker => worker.calls), values = calls.map(row => row.counter).sort((a, b) => a - b);
  check('exact320 actual native increment results cover1through320 once each', calls.length === 320 && values.every((value, index) => value === index + 1));
  check('all300 allowed calls and20 denials match their own atomic boundary', calls.filter(row => row.result === 'admitted').length === 300 && calls.filter(row => row.result === 'limited').length === 20 && calls.every(row => row.result === (row.counter <= 300 ? 'admitted' : 'limited')));
  check('all calls and persisted counters stay in one real60-second window', workers.every(worker => worker.windowStable && worker.ownerGuarded) && other.windowStable && after.buckets.shared?.windowStarted === windowStarted && after.buckets.shared?.attempts === 320 && after.phpNow >= windowStarted && after.phpNow < windowStarted + 60);
  check('a separate account starts at one without changing the exhausted shared account', other.calls?.length === 1 && other.calls[0].counter === 1 && other.calls[0].result === 'admitted' && after.buckets.other?.attempts === 1 && after.buckets.other?.windowStarted === windowStarted && after.buckets.shared.attempts === 320);
} catch (error) { failure = { name: error.name, code: String(error.message).slice(0, 200) }; }
finally {
  for (const child of children) child.kill();
  const sourceAfter = await verifyFrozenSource(source);
  const inputsUnchanged = (await Promise.all(inputPaths.map(async file => await digest(file) === hashes[file]))).every(Boolean);
  check('frozen source and declared native driver inputs remain unchanged', sourceAfter.receipt.mismatches.length === 0 && inputsUnchanged);
  const passed = failure === null && checks.every(row => row.pass);
  const report = { status: passed ? 'PASS-SCOPED-NATIVE-RATE' : 'FAILED', protocol, finishedAt: new Date().toISOString(), durationMs: performance.now() - startAt,
    windowStarted, waitedMs, failure, checks, workers, otherAccount: other, persistedCounters: after?.buckets ?? null,
    sourceAfter: sourceAfter.receipt, inputsUnchanged, ownedChildrenActiveAtFinally: children.size,
    originalConfigRead: false, counterReset: false, quotaBypass: false, serviceCleanup: 'PENDING-ORIGINAL-OWNER-CLEANUP-RECEIPT' };
  await writeFile(`${prefix}.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, ownerId: owner, sharedCalls: workers.reduce((sum, worker) => sum + worker.calls.length, 0), checksPassed: checks.filter(row => row.pass).length, report: `${prefix}.json` }));
  process.exitCode = passed ? 0 : 1;
}
