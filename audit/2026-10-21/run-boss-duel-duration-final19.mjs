import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, access } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
import { verifyFrozenSource } from './artifact-verification.mjs';

const operationStart = performance.now(), directory = 'audit/2026-10-21';
const prefix = process.argv[2] || 'boss-duel-final19';
assert.match(prefix, /^[a-z][a-z0-9-]+$/);
const protocolFile = process.argv[3] || `${directory}/boss-duel-final19-protocol.json`;
const output = `${directory}/${prefix}.json`, declaration = `${directory}/${prefix}-run-protocol.json`, evidenceFile = `${directory}/${prefix}-evidence.json`;
for (const file of [output, declaration, evidenceFile]) await assert.rejects(access(file), { code: 'ENOENT' }, 'Choose a new prefix. Prior evidence must never be overwritten.');
const protocol = JSON.parse(await readFile(protocolFile, 'utf8'));
assert.equal(protocol.expectedBuildEnv, 'SPAROWTYPE_FINAL19_BUILD');
protocol.expectedBuild = process.env.SPAROWTYPE_FINAL19_BUILD;
assert.match(protocol.expectedBuild || '', /^[a-f0-9]{20}$/, 'The frozen final19 build identity must be supplied explicitly.');
assert.equal(protocol.totalWatchdogMs, 105000); assert.equal(protocol.typingWindowMs, 80000);
assert.equal(protocol.expectedDurationMs, 90000); assert.equal(protocol.automaticRetries, 0);
const origin = new URL(protocol.origin);
assert.equal(origin.origin, 'http://127.0.0.1:4173'); assert.equal(origin.pathname, '/');
const report = { declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-COMPLETE', protocolFile, protocol, scope: 'One real90-second local Boss Duel mission using native browser typing. Functional duration/evidence only; no physical-device, human-input, ranking or performance claim.', machine: { platform: process.platform, architecture: process.arch, totalMemoryBytes: os.totalmem(), freeMemoryBytesBeforeRun: os.freemem(), node: process.version },
  pageErrors: [], consoleErrors: [], apiRequests: [], progress: [], completed: false, watchdogExpired: false };
await writeFile(declaration, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
let browser, context, page, watchdog, hardStop;
const persist = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const stopOwnBrowser = async () => { await browser?.close().catch(() => undefined); };
const remaining = () => Math.max(1, protocol.totalWatchdogMs - (performance.now() - operationStart));
// Start owned-browser cleanup2seconds before the declared hard deadline. This
// leaves the full ordinary90-second run intact without unbounded teardown.
watchdog = setTimeout(() => {
  report.watchdogExpired = true; report.status = 'FAILED'; report.failure = 'Declared operation/cleanup watchdog reached; no manual game completion was substituted.';
  void persist().finally(stopOwnBrowser);
}, Math.max(1, remaining() - 2000));
hardStop = setTimeout(() => { report.watchdogExpired = true; report.status = 'FAILED'; report.failure ??= 'Declared105-second hard deadline exceeded.'; void persist().finally(() => process.exit(2)); }, remaining());

try {
  const { frozen, receipt } = await verifyFrozenSource(protocol.buildFile);
  assert.equal(frozen.local.version, protocol.expectedBuild);
  assert.deepEqual(receipt.mismatches, [], 'The frozen source must remain current before execution.');
  report.source = receipt;
  const servedResponse = await fetch(new URL('offline-build.json', origin), { signal: AbortSignal.timeout(5000) });
  assert.equal(servedResponse.status, 200);
  const served = await servedResponse.json(); assert.deepEqual(served, frozen.local, 'The served artifact must exactly match the declared build.');
  report.build = served; report.sourceRecordSha256 = createHash('sha256').update(await readFile(protocol.buildFile)).digest('hex');
  await persist();
  browser = await chromium.launch({ timeout: 10000 }); report.browser = browser.version();
  context = await browser.newContext({ viewport: protocol.viewport, acceptDownloads: true, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  page = await context.newPage(); page.setDefaultTimeout(5000); page.setDefaultNavigationTimeout(10000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await page.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const allowed = url.origin === origin.origin && url.pathname === '/api/auth/session' && request.method() === 'GET';
    report.apiRequests.push({ method: request.method(), path: url.pathname, disposition: allowed ? 'owned guest bootstrap fixture' : 'unexpected operation rejected' });
    await route.fulfill(allowed ? { json: { user: null, csrfToken: 'boss-duel-duration-guest-fixture' } } : { status: 501, json: { error: { code: 'fixture-unexpected', message: 'The duration fixture owns guest authentication only.' } } });
  });
  assert.equal((await page.goto(new URL('arcade/boss-duel', origin).href))?.status(), 200);
  await expect(page.getByRole('heading', { name: 'Boss Duel', exact: true })).toBeVisible();
  await expect(page.locator('.arcade-contract')).toContainText('declared 35 WPM practice baseline');
  await page.getByRole('combobox', { name: 'Arcade difficulty', exact: true }).selectOption('normal');
  await page.getByRole('combobox', { name: 'Arcade run variant', exact: true }).selectOption('mission');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => undefined))); });
  report.readiness = await page.evaluate(() => ({ documentReady: document.readyState, fontsReady: document.fonts.status, visibility: document.visibilityState, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, guestHistoryEmpty: localStorage.getItem('sparowtype.arcade.v1:guest') === null }));
  assert.equal(report.readiness.visibility, 'visible'); assert.equal(report.readiness.reducedMotion, false, 'This declared run keeps normal motion; no visual-quality override is applied.');
  assert.equal(report.readiness.guestHistoryEmpty, true);
  await page.evaluate(() => {
    window.bossDurationObservation = { beforeInputs: 0, insertedUnits: 0, firstInputAt: null, lastInputAt: null, windowBlurs: 0, hiddenEvents: 0 };
    document.addEventListener('beforeinput', event => {
      if (event.target?.id !== 'arcade-native-input' || event.inputType !== 'insertText') return;
      const observation = window.bossDurationObservation, now = performance.now();
      observation.beforeInputs++; observation.insertedUnits += [...(event.data ?? '')].length;
      observation.firstInputAt ??= now; observation.lastInputAt = now;
    });
    window.addEventListener('blur', () => window.bossDurationObservation.windowBlurs++);
    document.addEventListener('visibilitychange', () => { if (document.hidden) window.bossDurationObservation.hiddenEvents++; });
  });
  const beforePlay = performance.now();
  await page.getByRole('button', { name: 'Play Boss Duel', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Arcade typing input', exact: true });
  await expect(input).toBeEnabled();
  await expect(page.locator('.arcade-tracks').getByText('BOT boss · 105% of 35 WPM baseline', { exact: true })).toBeVisible();
  await page.locator('.arcade-target-alternative summary').click();
  await input.focus(); await expect(input).toBeFocused();
  const typingStart = performance.now(), words = []; let typedChars = 0, lastProgress = 0;
  report.startedPlayingAt = new Date().toISOString(); report.status = 'RUNNING'; await persist();
  while (performance.now() - typingStart < protocol.typingWindowMs - 1500 && words.length < protocol.maximumWords) {
    await expect(input).toBeEnabled(); await expect(input).toBeFocused();
    const label = await page.locator('.arcade-target-alternative li').first().textContent();
    assert.ok(label); const word = label.split(' · ')[0]; assert.match(word, /^[a-z]{4,7}$/);
    await input.pressSequentially(word, { delay: protocol.characterDelayMs });
    await expect(input).toHaveValue(''); words.push(word); typedChars += word.length;
    const elapsed = performance.now() - typingStart;
    if (elapsed - lastProgress >= 10000) { lastProgress = elapsed; const checkpoint = { elapsedTypingMs: elapsed, completedWords: words.length, actualTypedChars: typedChars }; report.progress.push(checkpoint); await persist(); console.log(JSON.stringify({ status: 'RUNNING', ...checkpoint })); }
    await delay(protocol.betweenWordDelayMs);
  }
  report.finishedTypingAt = new Date().toISOString(); report.typedWords = words.length; report.actualTypedChars = typedChars;
  assert.ok(words.length > 20, 'The duration run must contain substantive actual native word input.');
  assert.ok(performance.now() - typingStart >= 75000, 'Native typing must span roughly the declared80-second window.');
  await expect(page.getByRole('region', { name: 'Arcade result', exact: true })).toBeVisible({ timeout: Math.max(1, Math.min(20000, remaining() - 2500)) });
  report.resultObservedAfterPlayMs = performance.now() - beforePlay;
  assert.ok(report.resultObservedAfterPlayMs >= 89000, 'No manual early completion is substituted.');
  const resultRegion = page.getByRole('region', { name: 'Arcade result', exact: true });
  await expect(resultRegion).toContainText('LOCAL PRACTICE'); await expect(resultRegion).toContainText('A local score is not a verified ranking.');
  const downloading = page.waitForEvent('download', { timeout: Math.min(5000, remaining()) });
  await resultRegion.getByRole('button', { name: 'Export canonical game JSON', exact: true }).click();
  const download = await downloading, downloadedFile = await download.path(); assert.ok(downloadedFile);
  const raw = await readFile(downloadedFile, 'utf8'), evidence = JSON.parse(raw), session = evidence.session, metrics = session.metrics;
  await writeFile(evidenceFile, raw, { flag: 'wx' }); report.evidenceFile = evidenceFile; report.evidenceSha256 = createHash('sha256').update(raw).digest('hex');
  assert.equal(evidence.gameId, 'boss-duel'); assert.equal(evidence.difficulty, 'normal'); assert.equal(evidence.variant, 'mission');
  assert.equal(evidence.verification, 'local-unverified'); assert.equal(session.ownerScope, 'guest');
  assert.equal(session.configuration.settings.arcadeGame, 'boss-duel'); assert.equal(session.configuration.settings.localOnly, true);
  assert.equal(session.configuration.inputMethod, 'keyboard'); assert.equal(session.configuration.correctionPolicy, 'current-word');
  assert.ok(session.elapsedMs >= 90000 && session.elapsedMs <= 93000, 'Exported ordinary active duration must be approximately90seconds.');
  assert.equal(session.pauseIntervals.length, 0); assert.deepEqual(session.assistance, []);
  assert.equal(metrics.insertionAttempts, typedChars); assert.equal(metrics.correctAttempts, typedChars); assert.equal(metrics.incorrectAttempts, 0); assert.equal(metrics.inputAccuracy, 100);
  assert.equal(session.finalTranscript, words.join('')); assert.equal(evidence.completedWords, words.length);
  assert.equal(session.events.filter(event => event.type === 'submit' && event.text === '').length, words.length);
  assert.ok(evidence.gameEvents.at(-1)?.type === 'finish' && evidence.gameEvents.at(-1).offsetMs >= 90000);
  const native = await page.evaluate(() => window.bossDurationObservation);
  assert.equal(native.beforeInputs, typedChars); assert.equal(native.insertedUnits, typedChars); assert.equal(native.windowBlurs, 0); assert.equal(native.hiddenEvents, 0);
  assert.ok(native.firstInputAt !== null && native.lastInputAt - native.firstInputAt >= 75000, 'Actual native insertion timestamps must span at least75seconds.');
  const bossCorrectCharacterThreshold = 35 * 1.05 * 5 * 90 / 60;
  const wonFromMeasuredEvidence = metrics.creditedUnits > bossCorrectCharacterThreshold && metrics.inputAccuracy >= 95 && session.elapsedMs >= 90000;
  const expectedOutcome = wonFromMeasuredEvidence ? 'Duel won: more measured progress and at least 95% accuracy.' : 'Duel complete. Build accuracy and try the same pace again.';
  assert.equal(evidence.outcome, expectedOutcome); await expect(resultRegion.getByRole('heading', { level: 2, exact: true, name: evidence.outcome })).toBeVisible();
  assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.consoleErrors, []);
  assert.ok(report.apiRequests.every(request => request.disposition === 'owned guest bootstrap fixture'));
  report.measured = { activeDurationMs: session.elapsedMs, correctAttempts: metrics.correctAttempts, insertionAttempts: metrics.insertionAttempts, incorrectAttempts: metrics.incorrectAttempts, inputAccuracy: metrics.inputAccuracy, creditedUnits: metrics.creditedUnits, canonicalWpm: metrics.wpm, correctCharacterWpm: metrics.correctCharacterWpm, completedWords: evidence.completedWords, native, outcome: evidence.outcome, wonFromMeasuredEvidence, declaredBotBaselineWpm: 35, botMultiplier: 1.05, bossCorrectCharacterThreshold, manualEndRunClicked: false, virtualClockUsed: false };
  report.status = 'PASS-SCOPED'; report.completed = true;
} catch (error) {
  report.status = 'FAILED'; report.failure = { name: error.name, message: error.message };
  if (page && !page.isClosed()) await page.screenshot({ path: `${directory}/${prefix}-failure.png`, fullPage: true, timeout: 1000 }).catch(() => undefined);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString(); report.totalWallMs = performance.now() - operationStart;
  await persist(); await stopOwnBrowser(); clearTimeout(watchdog); clearTimeout(hardStop);
}
console.log(JSON.stringify({ status: report.status, completed: report.completed, output, measured: report.measured, failure: report.failure ?? null }));
