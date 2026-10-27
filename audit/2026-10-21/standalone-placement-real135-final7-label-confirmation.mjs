import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, expect } from '@playwright/test';

// Opt-in, fresh-browser UI acceptance only. This never seeds sessions, constructs
// a SessionController, changes clocks, imports an app bundle into the page, or
// connects to the user's backend. The compiled domain exports inspect real UI
// records after ordinary native input and three real 45-second timeouts.
assert.equal(process.env.SPAROWTYPE_PLACEMENT_ACCEPTANCE, '1', 'Explicit placement acceptance opt-in is required.');
const root = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(['--origin', '--prefix'].includes(args[index]) && args[index + 1], 'Expected --origin or --prefix plus a value.');
  assert.equal(options[args[index]], undefined, 'Duplicate driver argument.');
  options[args[index]] = args[index + 1];
}
const origin = new URL(options['--origin'] || 'http://127.0.0.1:4173/');
assert.equal(origin.protocol, 'http:');
assert.equal(origin.hostname, '127.0.0.1', 'This driver is limited to the loopback frozen frontend.');
assert.equal(origin.port, '4173');
assert.equal(origin.pathname, '/');
assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash);
const prefix = options['--prefix'] || `final7-placement-real135-${Date.now()}`;
assert.match(prefix, /^final7-placement-[a-z0-9-]{1,80}$/);
const output = path.join(root, 'audit/2026-10-21');
const protocolPath = path.join(output, `${prefix}-protocol.json`);
const rawPath = path.join(output, `${prefix}-raw.json`);
const frozenPath = path.join(root, 'audit/2026-10-21/final7-source.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const frozen = JSON.parse(await readFile(frozenPath, 'utf8'));
const build = JSON.parse(await readFile(path.join(root, 'dist/offline-build.json'), 'utf8'));
assert.equal(build.version, 'f3ac03affbc33168655a');
assert.deepEqual(build, frozen.local);
const sourceIntegrity = async () => {
  const mismatches = [];
  for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
    const absolute = path.resolve(root, file);
    assert.ok(absolute.startsWith(`${root}${path.sep}`), 'Frozen source must stay within the workspace.');
    const bytes = await readFile(absolute);
    const normalized = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file)
      ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes;
    if (hash(normalized) !== expected) mismatches.push(file);
  }
  return { compared: Object.keys(frozen.sourceHashes).length, mismatches };
};
const before = await sourceIntegrity();
assert.deepEqual(before.mismatches, [], 'Product source must match frozen final7.');
const served = await fetch(new URL('offline-build.json', origin), { signal: AbortSignal.timeout(10000) }).then(response => {
  assert.equal(response.status, 200); return response.json();
});
assert.deepEqual(served, build, 'The preview must serve the frozen artifact.');
const driverHash = hash(await readFile(import.meta.filename));
const dependencyHash = hash(await readFile(path.join(root, 'package-lock.json')));
const protocol = {
  declaredAt: new Date().toISOString(), build, source: path.relative(root, frozenPath).replaceAll('\\', '/'),
  sourceFiles: before.compared, driverSha256: driverHash, dependencySha256: dependencyHash,
  engine: 'chromium', nodeVersion: process.version, contexts: 1, workers: 1, retries: 0, maximumJourneyMs: 210000,
  origin: origin.origin, introEnabled: false, serviceWorkers: 'block',
  input: 'Native pressSequentially: exact DOM target prefixes, then actual ordinary timeouts for all three 45-second parts. One finite native free-practice run checks goal isolation.',
  clocks: 'Real browser performance.now()/Date and Node monotonic time; no virtual time, pause, timestamp rewrite or fake result.',
  api: 'Explicit guest GET /api/auth/session fixture only. Every other API call is aborted and fails acceptance; no live backend is contacted.',
  scope: 'Real 135-second optional placement UI, canonical owned persistence/reload, no course checkpoint/certification and private-goal isolation. Not a human speed, field latency, PWA, server or course certification test.',
  privacy: 'No target/passage/event text, cookies, CSRF values, request bodies or account identifiers are written to receipts.',
};
await mkdir(output, { recursive: true });
await writeFile(protocolPath, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const rawHandle = await open(rawPath, 'wx');
const report = {
  status: 'RUNNING', declaredAt: protocol.declaredAt, protocol: path.basename(protocolPath), build,
  checks: [], parts: [], apiRequests: [], pageErrors: [], consoleErrorCount: 0,
  scope: protocol.scope, privacy: protocol.privacy,
};
const check = (name, condition, detail) => {
  report.checks.push({ name, pass: Boolean(condition), ...(detail === undefined ? {} : { detail }) });
  if (!condition) { const error = new Error(name); error.auditCode = name; throw error; }
};
let browser, context, temporary, watchdog, stage = 'prepare canonical read-only verifier';
const started = performance.now();
try {
  const perform = async () => {
  const require = createRequire(import.meta.url);
  const { build: bundle } = createRequire(require.resolve('vite'))('esbuild');
  temporary = await mkdtemp(path.join(path.resolve(tmpdir()), 'sparow-placement-verify-'));
  const verifier = path.join(temporary, 'verify.mjs');
  await bundle({
    stdin: {
      contents: "export {assessPlacementRecords,placementPartFromResult} from './src/domain/training/placement.ts';export {assessPracticeGoal} from './src/domain/training/practice-goal.ts';export {replaySnapshot} from './src/lib/typing-core/metrics.ts';export {courseAssessmentForRecord} from './src/lib/typing-course.ts';export {payloadIdentity} from './src/services/session-repository.ts';",
      resolveDir: root,
    },
    bundle: true, platform: 'node', format: 'esm', target: 'es2022', alias: { '@': path.join(root, 'src') }, outfile: verifier, logLevel: 'silent',
  });
  const domain = await import(pathToFileURL(verifier).href);
    stage = 'launch fresh Chromium';
    browser = await chromium.launch({ headless: true });
    report.browserVersion = browser.version();
    context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', acceptDownloads: false });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== origin.origin) {
        report.apiRequests.push({ method: request.method(), path: url.pathname, guestFixture: false, foreignOriginBlocked: true });
        await route.abort('blockedbyclient'); return;
      }
      if (!/^\/api(?:\/|$)/.test(url.pathname)) { await route.continue(); return; }
      const allowed = request.method() === 'GET' && url.pathname === '/api/auth/session' && !url.search;
      report.apiRequests.push({ method: request.method(), path: url.pathname, guestFixture: allowed });
      if (allowed) await route.fulfill({ status: 200, json: { user: null, csrfToken: 'standalone-placement-guest-fixture' }, headers: { 'Cache-Control': 'no-store' } });
      else await route.abort('blockedbyclient');
    });
    await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(15000);
    page.on('pageerror', error => report.pageErrors.push({ name: error.name || 'Error' }));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrorCount += 1; });
    const studio = page.getByRole('region', { name: 'Placement and practice studio', exact: true });
    const guidanceHeading = () => studio.getByRole('heading', { name: 'Your placementV1 guidance', exact: true });
    const courseZero = async () => {
      const value = await page.locator('#course-progress').getAttribute('value');
      check('course completion remains zero', value === '0');
      const checkpoints = await page.locator('.course-checkpoints[role="img"]').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
      check('all course checkpoints remain unearned', checkpoints.length >= 36 && checkpoints.every(label => label === '0 of 2 qualifying passages'));
    };
    const rows = async () => page.evaluate(async () => {
      const databases = await indexedDB.databases();
      if (!databases.some(item => item.name === 'typingforge-sessions')) return [];
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('typingforge-sessions');
        request.onsuccess = () => resolve(request.result);
        request.onerror = request.onblocked = () => reject(new Error('Read-only fixture history could not open.'));
      });
      try {
        return await new Promise((resolve, reject) => {
          const transaction = db.transaction('sessions', 'readonly'), request = transaction.objectStore('sessions').getAll();
          request.onsuccess = () => resolve(request.result.filter(record => !record.deleted));
          request.onerror = transaction.onabort = () => reject(new Error('Read-only fixture history failed.'));
        });
      } finally { db.close(); }
    });
    const savedCount = async count => {
      await expect.poll(async () => (await rows()).length, { timeout: 10000 }).toBe(count);
      return rows();
    };
    const exactTarget = async () => {
      const description = await page.locator('#typing-passage').textContent();
      check('DOM exposes the actual active passage', typeof description === 'string' && description.startsWith('Practice passage: '));
      return description.slice('Practice passage: '.length);
    };
    const verifyRecord = async (record, kind) => {
      const candidate = record.candidate;
      check(`${kind}: owned observed canonical record`, record.ownerId === 'guest' && record.provenance === 'observed' && record.schemaVersion === 3 && record.payloadVersion === 'forge-v3' && candidate?.ownerScope === 'guest' && candidate.clientSessionId === record.clientSessionId);
      check(`${kind}: private local-only record without certification`, record.privateContent === true && record.cloudConsent === false && record.state === 'local-only' && !record.accepted && !record.courseEvidence && !candidate.configuration.settings?.course && domain.courseAssessmentForRecord(record, 'guest') === null);
      check(`${kind}: immutable canonical payload hash`, record.payloadHash === await domain.payloadIdentity(candidate));
      const replay = domain.replaySnapshot(candidate.configuration, candidate.events, candidate.elapsedMs, { targetText: candidate.targetText, pauseIntervals: candidate.pauseIntervals, issuedTargetSegments: candidate.issuedTargetSegments });
      check(`${kind}: exact attempt accuracy and no pauses`, replay.metrics.inputAccuracy === 100 && replay.metrics.incorrectAttempts === 0 && replay.metrics.correctAttempts === replay.metrics.insertionAttempts && replay.metrics.insertionAttempts >= 25 && candidate.pauseIntervals.length === 0);
      check(`${kind}: individual native keyboard evidence`, candidate.events.length >= 25 && candidate.events.every(event => event.provenance === 'keyboard' && event.type !== 'composition' && event.compositionId === undefined && event.text.length <= 1));
      return { candidate, metrics: replay.metrics };
    };

    stage = 'open optional placement without entering a course';
    await page.goto(new URL('lessons', origin).href);
    await expect(studio.getByRole('button', { name: 'Try optional placement', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Start learning', exact: true })).toBeEnabled();
    check('fresh browser history is empty', (await rows()).length === 0);
    await courseZero();
    check('no guidance exists before observed placement', await guidanceHeading().count() === 0);
    await studio.getByRole('button', { name: 'Try optional placement', exact: true }).click();
    let observedPlacement, firstPartStarted;
    for (let part = 0; part < 3; part += 1) {
      stage = `real placement part ${part + 1}: native exact input and ordinary 45-second timeout`;
      await expect(studio.getByText(`Placement part ${part + 1} of 3 · 45 seconds · English/QWERTY`, { exact: true })).toBeVisible();
      check(`part ${part + 1}: placement does not display a private-practice goal`, await studio.getByText(/Personal practice goal:/).count() === 0);
      const target = await exactTarget(), boundary = target.lastIndexOf(' ', 100);
      check(`part ${part + 1}: real DOM prefix has enough individual attempts`, boundary >= 25);
      const typed = target.slice(0, boundary + 1);
      const input = studio.getByRole('textbox', { name: 'Typing input', exact: true });
      await input.scrollIntoViewIfNeeded(); await input.focus();
      const clock = await page.evaluate(() => ({ wall: Date.now(), monotonic: performance.now(), visibility: document.visibilityState }));
      check(`part ${part + 1}: active document is visible`, clock.visibility === 'visible');
      const partStarted = performance.now();
      if (firstPartStarted === undefined) firstPartStarted = partStarted;
      await input.pressSequentially(typed, { delay: 24 });
      await expect(input).toHaveValue(typed);
      await expect(studio.getByText(`Placement part ${part + 1} complete`, { exact: true })).toBeVisible({ timeout: 57000 });
      const actualMs = performance.now() - partStarted;
      const endClock = await page.evaluate(() => ({ wall: Date.now(), monotonic: performance.now() }));
      check(`part ${part + 1}: real 45 seconds elapsed`, actualMs >= 45000, { actualMs });
      check(`part ${part + 1}: browser monotonic clock advanced through the full part`, endClock.monotonic - clock.monotonic >= 45000);
      await expect(studio.getByText('Personal practice; no course checkpoint awarded.', { exact: false })).toBeVisible();
      const records = await savedCount(part + 1);
      const record = records.find(item => item.candidate?.configuration?.settings?.training?.stage === part);
      check(`part ${part + 1}: exactly one matching saved placement stage`, records.filter(item => item.candidate?.configuration?.settings?.training?.stage === part).length === 1);
      const { candidate, metrics } = await verifyRecord(record, `placement-${part + 1}`);
      check(`part ${part + 1}: canonical ordinary timeout`, candidate.status === 'finished' && candidate.finishReason === 'timeout' && candidate.elapsedMs === 45000 && candidate.configuration.durationMs === 45000);
      check(`part ${part + 1}: placement result never receives a private-practice goal`, domain.assessPracticeGoal(candidate, []) === null && await studio.getByText(/Personal practice goal:/).count() === 0);
      const evidence = domain.placementPartFromResult(candidate);
      check(`part ${part + 1}: retained placement projection matches actual replay`, Boolean(evidence) && JSON.stringify(evidence) === JSON.stringify(record.placementEvidence));
      check(`part ${part + 1}: recorded native text is the exact DOM prefix`, candidate.finalText === typed && metrics.insertionAttempts === typed.length);
      check(`part ${part + 1}: no foreign owner or course record`, records.every(item => item.ownerId === 'guest' && !item.courseEvidence && !item.candidate.configuration.settings?.course));
      report.parts.push({ part: part + 1, activeDurationMs: candidate.elapsedMs, observedRealDurationMs: actualMs, observedBrowserMonotonicMs: endClock.monotonic - clock.monotonic, observedWallMs: endClock.wall - clock.wall, attempts: metrics.insertionAttempts, correctAttempts: metrics.correctAttempts, inputAccuracy: metrics.inputAccuracy, wpm: metrics.wpm, payloadHash: record.payloadHash, retainedProjection: true, localGuidanceOnly: true });
      if (part < 2) {
        check(`part ${part + 1}: incomplete run has no final guidance`, await guidanceHeading().count() === 0);
        const next = studio.getByRole('button', { name: 'Next placement part', exact: true });
        await expect(next).toBeEnabled(); await next.click();
      } else {
        observedPlacement = domain.assessPlacementRecords(records, 'guest');
        check('three observed stages produce one owner-scoped guidance run', Boolean(observedPlacement) && observedPlacement.sessionIds.length === 3 && new Set(records.map(item => item.placementEvidence.runId)).size === 1 && domain.assessPlacementRecords(records, 'different-owner') === null);
      }
    }
    report.realPlacementJourneyMs = performance.now() - firstPartStarted;
    check('full placement used at least 135 real seconds', report.realPlacementJourneyMs >= 135000);
    stage = 'verify persisted guidance and unearned course checkpoints after reload';
    await expect(guidanceHeading()).toBeVisible();
    const guidance = studio.getByRole('complementary').filter({ has: page.getByRole('heading', { name: 'Your placementV1 guidance', exact: true }) });
    await expect(guidance).toContainText(`Median ${observedPlacement.wpm.toFixed(1)} WPM across 3 parts · 100.0% attempt-weighted accuracy.`);
    await expect(guidance.getByRole('link', { name: /^Explore / })).toHaveAttribute('href', `/lessons?lesson=${encodeURIComponent(observedPlacement.recommendedLessonId)}`);
    await expect(guidance).toContainText('Local guidance, not a ranking or certificate.');
    await courseZero();
    const placementHashes = (await rows()).map(row => row.payloadHash).sort();
    await page.reload();
    await expect(guidanceHeading()).toBeVisible();
    const reloaded = await savedCount(3);
    check('reload retains all three original canonical records', JSON.stringify(reloaded.map(row => row.payloadHash).sort()) === JSON.stringify(placementHashes));
    check('reload recomputes the same actual placement guidance', JSON.stringify(domain.assessPlacementRecords(reloaded, 'guest')) === JSON.stringify(observedPlacement));
    await courseZero();

    stage = 'verify private free-practice goal excludes placement evidence';
    await studio.getByRole('combobox', { name: 'Practice type', exact: true }).selectOption('home-row');
    await studio.getByRole('button', { name: 'Start free practice', exact: true }).click();
    const target = await exactTarget();
    check('finite private drill is bounded', target.length >= 25 && target.length <= 1000);
    const input = studio.getByRole('textbox', { name: 'Typing input', exact: true });
    await input.scrollIntoViewIfNeeded(); await input.focus();
    await input.pressSequentially(target, { delay: 18 });
    await expect(studio.getByText('Practice recorded', { exact: true })).toBeVisible();
    const records = await savedCount(4), practice = records.find(row => row.candidate?.configuration?.contentRevision === 'training-practice-v1');
    check('private practice records one distinct actual result', Boolean(practice) && records.filter(row => row.candidate?.configuration?.contentRevision === 'training-practice-v1').length === 1);
    const inspected = await verifyRecord(practice, 'private-practice');
    const goal = domain.assessPracticeGoal(inspected.candidate, reloaded.map(row => row.candidate));
    check('placement evidence never sets the private practice goal cohort', goal?.version === 'training-goal-v1' && goal.source === 'cold-start' && goal.comparableAttempts === 0 && goal.courseQualification === false);
    await expect(studio.getByText(/Personal practice goal:/)).toContainText('comfortable starting target');
    await expect(studio.getByText(/Personal practice goal:/)).toContainText('These do not become course stars or checkpoints.');
    check('private practice has no placement or course qualification', !practice.placementEvidence && !practice.courseEvidence && domain.courseAssessmentForRecord(practice, 'guest') === null);
    check('adding private practice preserves only the original placement guidance', JSON.stringify(domain.assessPlacementRecords(records, 'guest')) === JSON.stringify(observedPlacement));
    await courseZero();
    check('no unexpected live/account API request occurred', report.apiRequests.length >= 1 && report.apiRequests.every(request => request.guestFixture));
    check('no service worker context was installed', context.serviceWorkers().length === 0);
    check('no page error occurred', report.pageErrors.length === 0);
    report.guidance = { version: observedPlacement.version, parts: 3, attempts: observedPlacement.attempts, medianWpm: observedPlacement.wpm, inputAccuracy: observedPlacement.inputAccuracy, qualification: observedPlacement.qualification, persistedAfterReload: true, courseCheckpoints: 0 };
    report.privateGoal = { version: goal.version, source: goal.source, comparableAttempts: goal.comparableAttempts, courseQualification: goal.courseQualification };
  };
  await Promise.race([
    perform(),
    new Promise((_, reject) => { watchdog = setTimeout(() => { const error = new Error('Real journey exceeded the declared 210-second cap.'); error.auditCode = 'journey-watchdog-210s'; reject(error); }, 210000); }),
  ]);
  check('journey stays within the declared 210-second cap', performance.now() - started <= 210000);
  report.status = 'PASS-SCOPED';
} catch (error) {
  report.status = 'FAILED';
  report.failure = { stage, name: error?.name || 'Error', code: error?.auditCode || 'operation-failed', detail: 'Named operation failed. Raw passage text, assertion values and request credentials are intentionally omitted.' };
} finally {
  clearTimeout(watchdog);
  try { if (context) await context.close(); if (browser) await browser.close(); report.ownedBrowserClosed = !browser || !browser.isConnected(); }
  catch { report.ownedBrowserClosed = false; report.status = 'FAILED'; }
  if (temporary) {
    assert.equal(path.dirname(path.resolve(temporary)), path.resolve(tmpdir()));
    assert.match(path.basename(temporary), /^sparow-placement-verify-[A-Za-z0-9_-]+$/);
    await rm(temporary, { recursive: true, force: true });
  }
  try {
    const after = await sourceIntegrity();
    report.integrity = { sourceFiles: after.compared, mismatches: after.mismatches, driverUnchanged: hash(await readFile(import.meta.filename)) === driverHash, dependenciesUnchanged: hash(await readFile(path.join(root, 'package-lock.json'))) === dependencyHash, servedBuildUnchanged: JSON.stringify(await fetch(new URL('offline-build.json', origin), { signal: AbortSignal.timeout(10000) }).then(response => response.json())) === JSON.stringify(build) };
    if (after.mismatches.length || !report.integrity.driverUnchanged || !report.integrity.dependenciesUnchanged || !report.integrity.servedBuildUnchanged) report.status = 'FAILED';
  } catch { report.status = 'FAILED'; report.integrity = { verificationFailed: true }; }
  report.finishedAt = new Date().toISOString(); report.durationMs = performance.now() - started;
  report.passed = report.checks.filter(item => item.pass).length; report.failed = report.checks.filter(item => !item.pass).length;
  await rawHandle.writeFile(JSON.stringify(report, null, 2) + '\n'); await rawHandle.close();
}
console.log(JSON.stringify({ status: report.status, passed: report.passed, failed: report.failed, completedPlacementParts: report.parts.length, durationMs: report.durationMs, report: path.relative(root, rawPath).replaceAll('\\', '/') }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
