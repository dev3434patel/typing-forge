// Explicit source36 acceptance only. PREPARATION DOES NOT EXECUTE THIS FILE.
// Four serial engines, each with a new guarded owner and unchanged rate policy.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { open, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { hash, filesWithin, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL36_NATIVE_BROWSER_WINDOW, '1', 'Wait for the parent-coordinated native browser window.');
const build = process.env.SPAROWTYPE_FINAL36_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the actual completed source36 default dist build.');
assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC, 'No diagnostic subset is accepted.');
const directory = 'audit/2026-11-05-followup';
const sourceFile = `${directory}/final36-source.json`;
const ownerFile = `${directory}/pack-backend-instance-source36.mjs`;
const adapterFile = `${directory}/pack-native-browser-final36.mjs`;
const engines = ['chromium', 'edge', 'firefox', 'webkit'];
const selected = [
  'real PHP account signup, replay upload, independent-device history/preferences and account deletion',
  'real two-browser PHP human race shares opponent pace and settles server results',
  'real account sign in with dedicated deployment credentials',
  'PHP two-account race authorization and server-owned countdown',
  'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish',
];
const inputFiles = [
  sourceFile, ownerFile, adapterFile, `${directory}/run-final36-native-browser.mjs`,
  'audit/2026-10-21/pack-apache-runtime.mjs', 'audit/2026-10-21/artifact-verification.mjs',
  'scripts/php-runtime.mjs', 'playwright.config.ts', 'package-lock.json',
  'e2e/php-account-flow.spec.ts', 'e2e/php-human-race.spec.ts',
  'e2e/auth-flow.spec.ts', 'e2e/race-mode.spec.ts', 'e2e/php-api-fixture.ts',
];
const redact = value => String(value)
  .replace(/NativeAudit![a-f0-9]{48}/g, '[REDACTED]')
  .replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]')
  .replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g, '$1[REDACTED]');
const digestInputs = async () => Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, hash(await readFile(file))])));
async function distIdentity() {
  const hashes = {};
  let bytes = 0;
  for (const file of await filesWithin('dist')) {
    const content = await readFile(path.join('dist', file)); hashes[file] = hash(content); bytes += content.length;
  }
  const metadata = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
  assert.equal(metadata.version, build, 'Default dist is not the explicitly bound source36 build.');
  return { version: metadata.version, publicFiles: Object.keys(hashes).length, bytes, inventorySha256: hash(JSON.stringify(hashes)), hashes };
}
async function sourceIdentity() {
  const result = await verifyFrozenSource(sourceFile);
  assert.equal(result.frozen.local.version, build);
  assert.equal(result.receipt.compared, 506);
  assert.deepEqual(result.receipt.mismatches, []);
  return result.receipt;
}

// All integrity preconditions precede service startup. Reserve new receipts only.
const sourceBefore = await sourceIdentity();
const inputsBefore = await digestInputs();
const distBefore = await distIdentity();
const output = `${directory}/final36-native-browser.json`;
const logPath = `${directory}/final36-native-browser.log`;
const handle = await open(output, 'wx');
const log = await open(logPath, 'wx');
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), build, sourceFile,
  scope: 'Twenty original native title/engine pairs across four independent fresh owned Apache/PHP/MariaDB instances, one instance and one browser worker at a time. This is browser acceptance, not concurrent or400-user capacity evidence. All source27 failures remain unchanged.',
  engines, selectedTitles: selected, expectedCasesPerEngine: 5, expectedCases: 20,
  workers: 1, retries: 0, traces: false, sequential: true,
  freshOwnedBackendAndAccountsPerEngine: true, countersResetWithinOwner: false,
  accountsReseededWithinOwner: false, productionRatePolicyChanged: false,
  sourceBefore, inputsBefore,
  distBefore: { ...distBefore, hashes: undefined },
  source27ReportsReplaced: false, privateOriginalConfigsRead: false,
  privateOwnedBrowserEnvironmentReadByOrchestrator: false,
  originalServicesOrDatabaseTouched: false, engineRuns: [],
};
const publicMessage = event => console.log(JSON.stringify(event));
let pendingLog = Promise.resolve();
function recordLog(text) {
  pendingLog = pendingLog.then(() => log.write(redact(text)));
}
function childState(child, label) {
  const state = { child, label, events: [], closed: false, code: null, error: null, pending: '', stdout: '', stderr: '', listeners: new Set() };
  const notify = () => { for (const fn of [...state.listeners]) fn(); };
  child.stdout.on('data', chunk => {
    const text = chunk.toString(); state.stdout += text;
    state.pending += text;
    const lines = state.pending.split(/\r?\n/); state.pending = lines.pop();
    for (const line of lines.filter(Boolean)) {
      try { state.events.push(JSON.parse(redact(line))); } catch { /* Safe raw output retained; malformed JSON never becomes a passing stage. */ }
    }
    notify();
  });
  child.stderr.on('data', chunk => { state.stderr += chunk.toString(); });
  child.stdin?.on('error', error => { state.error = { name: error.name, message: redact(error.message) }; notify(); });
  state.closedPromise = new Promise(resolve => {
    child.once('error', error => { state.error = { name: error.name, message: redact(error.message) }; notify(); });
    child.once('close', code => {
      state.closed = true; state.code = code;
      // Redact complete streams, including values split over data chunks.
      recordLog(`[${label}:stdout]\n${state.stdout}\n[${label}:stderr]\n${state.stderr}\n`);
      notify(); resolve(code);
    });
  });
  return state;
}
function eventUntil(state, stage, timeoutMs) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (error, value) => { clearTimeout(timer); state.listeners.delete(check); error ? reject(error) : resolve(value); };
    const check = () => {
      const event = state.events.find(item => item.stage === stage);
      if (event) return finish(null, event);
      if (state.error || state.closed || state.events.some(item => item.stage === 'ephemeral-failure')) {
        return finish(new Error(`${state.label} ended or failed before ${stage}; see the redacted owned lifecycle log.`));
      }
    };
    state.listeners.add(check);
    timer = setTimeout(() => finish(new Error(`${state.label} did not reach ${stage} within ${timeoutMs}ms.`)), timeoutMs);
    check();
  });
}
function closeUntil(state, timeoutMs) {
  if (state.closed) return Promise.resolve(state.code);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${state.label} did not close within ${timeoutMs}ms; no subsequent owner may start.`)), timeoutMs);
    state.closedPromise.then(code => { clearTimeout(timer); resolve(code); });
  });
}
async function unchanged() {
  const source = await sourceIdentity(), inputs = await digestInputs(), dist = await distIdentity();
  assert.deepEqual(inputs, inputsBefore, 'Acceptance inputs changed during execution.');
  assert.deepEqual(dist.hashes, distBefore.hashes, 'Default dist bytes changed during execution.');
  return { source, inputsUnchanged: true, distUnchanged: true, dist: { ...dist, hashes: undefined } };
}
async function cleanOwner(owner, run) {
  if (!owner.closed) {
    if (!owner.child.stdin.writableEnded) owner.child.stdin.end('cleanup\n');
  }
  run.ownerExitCode = await closeUntil(owner, 120000);
  run.ownerClosed = true;
  const cleanupEvent = owner.events.find(item => item.stage === 'ephemeral-cleanup');
  assert.ok(cleanupEvent, 'Same-owner cleanup event is missing.');
  assert.match(run.ownerId ?? '', /^[a-f0-9]{16}$/);
  const cleanupFile = `${directory}/pack-backend-${run.ownerId}-cleanup.json`;
  const cleanup = JSON.parse(await readFile(cleanupFile, 'utf8'));
  run.cleanup = { receipt: cleanupFile, ...cleanup };
  run.gracefulCleanupVerified = cleanup.ownProcessesStopped === true && cleanup.ownTemporaryDirectoryRemoved === true
    && cleanup.gracefulDatabaseShutdown === true && cleanup.gracefulApacheShutdown === true
    && cleanup.forcedOwnDatabaseStop === false && cleanup.forcedOwnApacheStop === false
    && Array.isArray(cleanup.apacheResidualPids) && cleanup.apacheResidualPids.length === 0
    && cleanup.originalConfigRead === false && run.ownerExitCode === 0;
  assert.equal(run.gracefulCleanupVerified, true, 'Owned services or graceful cleanup are unverified; refusing the next engine.');
  await assert.rejects(access(path.join('backend/storage', `pack-instance-${run.ownerId}`)), { code: 'ENOENT' });
}

let activeOwner = null, activeAdapter = null;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  report.interrupted = signal;
  // Ask only the process spawned by this runner to stop. The owned backend keeps
  // its own identity-checked cleanup; never address an unrelated PID or port.
  if (activeAdapter && !activeAdapter.closed) activeAdapter.child.kill(signal);
  if (activeOwner && !activeOwner.closed && !activeOwner.child.stdin.writableEnded) activeOwner.child.stdin.end('cleanup\n');
});
try {
  const ownerIds = new Set();
  for (const engine of engines) {
    assert.ok(!report.interrupted, 'Interrupted runs do not start another owner.');
    await unchanged();
    const run = { engine, status: 'RUNNING', startedAt: new Date().toISOString(), expectedCases: 5 };
    report.engineRuns.push(run);
    publicMessage({ stage: 'final36-native-engine-start', engine, build, freshOwnerRequired: true, expectedCases: 5 });
    let renew;
    try {
      const ownerChild = spawn(process.execPath, [ownerFile], {
        cwd: process.cwd(), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, SPAROWTYPE_FINAL36_BUILD_ID: build,
          SPAROWTYPE_FINAL36_NATIVE_BROWSER_WINDOW: '1', SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1',
          SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1',
          SPAROWTYPE_PACK_SUITES: 'password', SPAROWTYPE_PACK_HOLD: '1', SPAROWTYPE_PACK_KEEP_FAILURE: '0',
          SPAROWTYPE_PACK_ATTEMPT_REASON: `source36 native ${engine}: fresh per-engine backend, unchanged production auth quota, all five original titles`,
        },
      });
      activeOwner = childState(ownerChild, `${engine}-owner`); run.ownerRunnerPid = ownerChild.pid;
      const holding = await eventUntil(activeOwner, 'ephemeral-holding', 240000);
      assert.match(holding.ownerId ?? '', /^[a-f0-9]{16}$/);
      assert.equal(ownerIds.has(holding.ownerId), false, 'An owner cannot be shared between engines.');
      ownerIds.add(holding.ownerId); run.ownerId = holding.ownerId;
      assert.equal(holding.database, `sparow_pack_${run.ownerId}_audit`);
      run.databaseNamespace = holding.database;
      const thisOwner = activeOwner;
      renew = setInterval(() => { if (!thisOwner.closed && !thisOwner.child.stdin.writableEnded) thisOwner.child.stdin.write('renew\n'); }, 60000);
      activeOwner.child.stdin.write('prepare-browser\n');
      const ready = await eventUntil(activeOwner, 'ephemeral-browser-ready', 90000);
      const readyFile = `${directory}/pack-backend-${run.ownerId}-browser-ready.json`;
      const publicReady = JSON.parse(await readFile(readyFile, 'utf8'));
      assert.equal(publicReady.baseUrl, ready.baseUrl);
      assert.equal(publicReady.api, ready.api);
      run.readyReceipt = readyFile;
      // This parent reads only the public readiness receipt. The guarded adapter
      // independently validates and consumes its own owner's private test env.
      const adapterChild = spawn(process.execPath, [adapterFile], {
        cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, SPAROWTYPE_FINAL36_NATIVE_BROWSER_WINDOW: '1',
          SPAROWTYPE_FINAL36_NATIVE_ENGINE: engine, SPAROWTYPE_FINAL36_NATIVE_OWNER: run.ownerId,
          SPAROWTYPE_PACK_BROWSER_ACCEPTANCE: '1', SPAROWTYPE_PACK_EXPECT_BUILD: build,
          SPAROWTYPE_PACK_BROWSER_READY: readyFile,
        },
      });
      activeAdapter = childState(adapterChild, `${engine}-adapter`); run.adapterRunnerPid = adapterChild.pid;
      run.adapterExitCode = await closeUntil(activeAdapter, 600000);
      run.adapterClosed = true;
      const complete = activeAdapter.events.find(item => item.stage === 'pack-native-browser-complete');
      run.nativeResult = complete ?? null;
      run.adapterCompletionProvesCliExited = Boolean(complete);
      if (!complete) run.abortFurtherEngines = true;
      run.status = run.adapterExitCode === 0 && complete?.status === 'PASS'
        && complete.exactCasesVerified === true && complete.exactResultsVerified === true
        && complete.stats?.expected === 5 && complete.stats?.unexpected === 0
        && complete.stats?.skipped === 0 && complete.stats?.flaky === 0 ? 'PASS' : 'FAILED';
    } catch (error) {
      run.status = 'FAILED'; run.error = { name: error.name, message: redact(error.message) };
      // Do not start the next engine while any launched browser adapter remains.
      if (activeAdapter && !activeAdapter.closed) {
        run.adapterForcedStop = true;
        run.browserDescendantCleanup = 'UNVERIFIED-AFTER-ADAPTER-TERMINATION';
        run.abortFurtherEngines = true;
        activeAdapter.child.kill('SIGTERM');
        try { await closeUntil(activeAdapter, 30000); run.adapterClosed = true; }
        catch { run.adapterClosed = false; }
      }
    } finally {
      clearInterval(renew);
      if (activeOwner) await cleanOwner(activeOwner, run);
      assert.ok(!activeAdapter || activeAdapter.closed, 'Adapter remains active; refusing the next engine.');
      activeOwner = null; activeAdapter = null;
      run.integrityAfter = await unchanged(); run.finishedAt = new Date().toISOString();
      publicMessage({ stage: 'final36-native-engine-complete', engine, status: run.status, ownerId: run.ownerId, gracefulCleanupVerified: run.gracefulCleanupVerified });
      assert.ok(!run.abortFurtherEngines, 'Adapter lifecycle or browser descendant cleanup is unverified; no subsequent engine may start.');
    }
  }
  const actualCases = report.engineRuns.flatMap(run => run.nativeResult?.actualCases ?? []);
  const expectedPairs = engines.flatMap(engine => selected.map(title => `${engine}:${title}`)).sort();
  report.exactTwentyCasesVerified = actualCases.length === 20
    && JSON.stringify(actualCases.map(item => `${item.engine}:${item.title}`).sort()) === JSON.stringify(expectedPairs);
  report.actualCases = actualCases;
  report.totals = {
    instances: report.engineRuns.length, actualCases: actualCases.length,
    passed: actualCases.filter(item => item.status === 'expected' && item.results.length === 1 && item.results[0].status === 'passed' && item.results[0].retry === 0).length,
    failed: actualCases.filter(item => item.results.some(result => ['failed', 'timedOut', 'interrupted'].includes(result.status))).length,
    skipped: actualCases.filter(item => item.results.some(result => result.status === 'skipped')).length,
  };
  report.status = report.exactTwentyCasesVerified && report.engineRuns.length === 4
    && new Set(report.engineRuns.map(run => run.ownerId)).size === 4
    && report.engineRuns.every(run => run.status === 'PASS' && run.gracefulCleanupVerified)
    && !report.interrupted ? 'PASS-SCOPED-NATIVE-BROWSER' : 'FAILED';
} catch (error) {
  report.status = 'FAILED'; report.error = { name: error.name, message: redact(error.message) };
} finally {
  try { report.integrityAfter = await unchanged(); }
  catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: redact(error.message) }; }
  report.finishedAt = new Date().toISOString();
  await pendingLog; await log.close();
  await handle.writeFile(`${JSON.stringify(report, null, 2)}\n`); await handle.close();
}
publicMessage({ output, status: report.status, totals: report.totals ?? null, exactTwentyCasesVerified: report.exactTwentyCasesVerified ?? false });
process.exitCode = report.status === 'PASS-SCOPED-NATIVE-BROWSER' ? 0 : 1;
