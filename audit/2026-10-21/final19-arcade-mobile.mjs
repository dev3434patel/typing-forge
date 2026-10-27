// Opt-in, bounded native-input audit of the actual frozen source19 build.
// This does not alter app quality, bypass game timing or use a fake clock.
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';

assert.equal(process.env.SPAROWTYPE_FINAL19_ARCADE_MOBILE, '1', 'Explicit arcade mobile acceptance opt-in required.');
const expectedBuild = process.env.SPAROWTYPE_FINAL19_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/);
const directory = 'audit/2026-10-21', prefix = process.argv[2] ?? 'final19-arcade-mobile';
assert.match(prefix, /^final19-[a-z0-9-]+$/);
const reportFile = `${directory}/${prefix}.json`, mobileImage = `${directory}/${prefix}-390-partial-target.png`, desktopImage = `${directory}/${prefix}-1440-partial-target.png`;
for (const file of [reportFile, mobileImage, desktopImage]) await assert.rejects(access(file), { code: 'ENOENT' });
const frozen = JSON.parse(await readFile(`${directory}/final19-source.json`, 'utf8'));
assert.equal(frozen.local.version, expectedBuild);
const origin = 'http://127.0.0.1:4173';
const served = await fetch(`${origin}/offline-build.json`).then(response => { assert.equal(response.ok, true); return response.json(); });
assert.deepEqual(served, frozen.local, 'Preview must serve the actual frozen source19 build.');
const guardedFiles = ['src/games/engine/arcade-machine.ts', 'src/games/ui/NativeGameInput.tsx', 'src/games/ui/ArcadeScene.tsx', 'src/games/ui/ArcadePlayer.tsx', 'src/games/ui/arcade.css', 'src/games/ui/target-feedback.ts'];
const hashes = async () => Object.fromEntries(await Promise.all(guardedFiles.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')])));
const beforeHashes = await hashes();
for (const file of guardedFiles) assert.equal(beforeHashes[file], frozen.sourceHashes[file], `Game source changed after freeze: ${file}`);
const report = {
  declaredAt: new Date().toISOString(), status: 'RUNNING', build: frozen.local, served, origin,
  protocol: { browser: 'Chromium', freshProfiles: true, normalGameQuality: true, reducedMotionOverride: false, openingOverrides: false, cpuThrottle: 4, requestedInterCharacterDelayMs: 0, minimumCorrectInsertionAttempts: 150, rotationAtOrAfterCorrectAttempts: 75, quietBeforeTypingMs: 5000, perTargetRealPrefixDeleteRetypeCycles: 4, automaticRetries: 0, resultFiltering: false, watchdogMs: 150000, guestAuthBootstrapFixtureOnly: true },
  functionalStatus: 'NOT-RUN', performanceStatus: 'NOT-RUN', errors: [], consoleErrors: [], mobile: null, desktop: null,
  sourceHashes: beforeHashes,
  limitations: ['Thresholded and quantized Event Timing in a desktop Chromium mobile viewport is not field INP or physical iOS/Android acceptance.', 'The structured stress scenario repeats a real current-word prefix correction four times per actual target; it is not an uninterrupted prose-speed benchmark.', 'This bounded Word Invaders check does not prove full endurance, every game mode, every browser or physical GPU fidelity.'],
};
await writeFile(reportFile, JSON.stringify(report, null, 2));
const browser = await chromium.launch();
const watchdog = setTimeout(async () => { report.status = 'FAILED'; report.error = '150-second watchdog reached'; await writeFile(reportFile, JSON.stringify(report, null, 2)); await browser.close().catch(() => undefined); process.exitCode = 2; }, 150000);
const observedErrors = (page, label) => {
  page.on('pageerror', error => report.errors.push({ context: label, message: error.message }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ context: label, message: message.text() }); });
};
async function guestContext(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block', acceptDownloads: true });
  await context.route(/\/auth\/session(?:\?|$)/, route => route.fulfill({ json: { user: null, csrfToken: 'arcade-controlled-guest' } }));
  return context;
}
async function begin(page) {
  page.setDefaultTimeout(15000);
  await page.goto(`${origin}/arcade/word-invaders`);
  await expect(page.getByTestId('opening-experience')).toHaveCount(0, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), false);
  await page.getByRole('combobox', { name: 'Arcade difficulty', exact: true }).selectOption('easy');
  await page.getByRole('combobox', { name: 'Arcade run variant', exact: true }).selectOption('endless');
  await expect(page.getByRole('checkbox', { name: 'Quieter Focus Mode', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Play Word Invaders', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Arcade typing input', exact: true });
  await expect(input).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.arcade-target-alternative summary').click();
  await input.focus();
  return input;
}
async function visibleTarget(page) {
  const first = page.locator('.arcade-target-alternative li').first();
  await expect(first).toBeVisible();
  const word = (await first.textContent()).split(' · ')[0];
  assert.match(word, /^[a-z]+$/);
  return word;
}
try {
  report.browserVersion = await browser.version();
  const context = await guestContext({ width: 390, height: 844 });
  const page = await context.newPage(); observedErrors(page, '390-mobile');
  const input = await begin(page);
  await input.press('Shift'); await input.press('Backspace');
  await expect(page.locator('.arcade-metrics > div').filter({ has: page.getByText('Active time', { exact: true }) }).locator('dd')).toHaveText('0.0s');
  const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await pause(5000);
  await page.evaluate(() => {
    window.arcadeBench = { entries: [], beforeInputInsertions: 0, eventTimingSupported: PerformanceObserver.supportedEntryTypes.includes('event') };
    document.addEventListener('beforeinput', event => { if (event.inputType === 'insertText') window.arcadeBench.beforeInputInsertions++; });
    if (window.arcadeBench.eventTimingSupported) new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (window.arcadeBench.entries.length < 20000) window.arcadeBench.entries.push({ name: entry.name, duration: entry.duration, interactionId: entry.interactionId });
    }).observe({ type: 'event', durationThreshold: 16 });
  });
  await input.pressSequentially('#', { delay: 0 });
  await expect(page.locator('.arcade-key-feedback')).toContainText('incorrect attempt recorded');
  await expect(page.getByText('Type your first character to start the clock and moving targets.', { exact: false })).toHaveCount(0);
  const completed = []; let correctAttempts = 0, deletedUnits = 0, rotation = null, screenshotTaken = false;
  while (correctAttempts < 150) {
    const candidate = await visibleTarget(page); await input.focus();
    await input.pressSequentially(candidate[0], { delay: 0 }); correctAttempts++;
    const word = (await page.locator('.arcade-key-feedback strong').textContent()).trim();
    assert.match(word, /^[a-z]{3,}$/); assert.equal(word[0], candidate[0]);
    await input.pressSequentially(word[1], { delay: 0 }); correctAttempts++;
    await expect(input).toHaveValue(word.slice(0, 2));
    await expect(page.locator('.arcade-target-prefix')).toHaveText(word.slice(0, 2));
    await expect(page.locator('.arcade-target-next')).toHaveText(word[2]);
    if (!screenshotTaken) { await page.locator('.arcade-player').screenshot({ path: mobileImage }); screenshotTaken = true; }
    if (!rotation && correctAttempts >= 75) {
      const before = await input.inputValue(); await page.setViewportSize({ width: 844, height: 390 });
      const after = await input.inputValue();
      rotation = { atCorrectAttempts: correctAttempts, before, after, retainedExactly: before === after, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) };
      assert.equal(rotation.retainedExactly, true); assert.equal(rotation.overflow, false);
      await expect(page.locator('.arcade-target-prefix')).toHaveText(before);
    }
    for (let cycle = 0; cycle < 4; cycle++) {
      await input.press('Backspace'); deletedUnits++;
      await expect(input).toHaveValue(word[0]);
      await expect(page.locator('.arcade-target-prefix')).toHaveText(word[0]);
      await input.pressSequentially(word[1], { delay: 0 }); correctAttempts++;
    }
    await input.pressSequentially(word.slice(2), { delay: 0 }); correctAttempts += word.length - 2;
    await expect(input).toHaveValue(''); completed.push(word);
  }
  assert.ok(rotation, 'Rotation must occur while a real prefix is retained.');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Arcade result', exact: true })).toBeVisible();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const observation = await page.evaluate(() => window.arcadeBench);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export canonical game JSON', exact: true }).click();
  const downloaded = await downloading, evidence = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
  const metrics = evidence.session.metrics;
  assert.equal(evidence.gameId, 'word-invaders'); assert.equal(evidence.completedWords, completed.length);
  assert.equal(evidence.session.configuration.startImmediately, false);
  assert.equal(evidence.session.events.find(event => event.text)?.offsetMs, 0);
  assert.equal(metrics.correctAttempts, correctAttempts); assert.equal(metrics.incorrectAttempts, 1);
  assert.equal(metrics.insertionAttempts, correctAttempts + 1); assert.equal(metrics.deletedUnits, deletedUnits);
  assert.equal(evidence.session.finalTranscript, completed.join(''));
  assert.ok(Math.abs(metrics.inputAccuracy - correctAttempts / (correctAttempts + 1) * 100) < 1e-9);
  const durations = observation.entries.filter(entry => ['keydown', 'keyup', 'keypress', 'input', 'beforeinput'].includes(entry.name)).map(entry => entry.duration).sort((a, b) => a - b);
  const p98Ms = durations.length ? durations[Math.ceil(durations.length * 0.98) - 1] : null;
  const maxMs = durations.length ? durations.at(-1) : null;
  report.mobile = { initialViewport: { width: 390, height: 844 }, finalViewport: page.viewportSize(), correctAttempts, incorrectAttempts: 1, deletedUnits, completedWords: completed.length, retainedTextExact: true, nativeBeforeInputInsertions: observation.beforeInputInsertions, rotation, eventTimingSupported: observation.eventTimingSupported, eventTimingEntriesAtLeast16ms: durations.length, p98ObservedTypingEventDurationMs: p98Ms, maxObservedTypingEventDurationMs: maxMs, metrics, elapsedMs: evidence.session.elapsedMs, screenshot: mobileImage, screenshotScope: 'Controlled guest partial current target; no account or private passage.' };
  report.performanceStatus = p98Ms === null ? 'UNVERIFIED' : p98Ms < 100 ? 'PASS-SCOPED' : 'FAILED';
  await context.close();
  const desktopContext = await guestContext({ width: 1440, height: 1000 });
  const desktopPage = await desktopContext.newPage(); observedErrors(desktopPage, '1440-desktop');
  const desktopInput = await begin(desktopPage), desktopTarget = await visibleTarget(desktopPage);
  await desktopInput.pressSequentially(desktopTarget.slice(0, 2), { delay: 0 });
  await expect(desktopPage.locator('.arcade-target-prefix')).toHaveText(desktopTarget.slice(0, 2));
  await desktopPage.locator('.arcade-player').screenshot({ path: desktopImage });
  report.desktop = { viewport: desktopPage.viewportSize(), screenshot: desktopImage, retainedPrefixExact: await desktopInput.inputValue() === desktopTarget.slice(0, 2), overflow: await desktopPage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), screenshotScope: 'Separate fresh controlled guest context; original normal game quality.' };
  assert.equal(report.desktop.overflow, false); await desktopContext.close();
  assert.deepEqual(await hashes(), beforeHashes); assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(response => response.json()), served);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.consoleErrors, []);
  report.functionalStatus = 'PASS-SCOPED';
  report.status = report.performanceStatus === 'PASS-SCOPED' ? 'PASS-SCOPED' : report.performanceStatus;
} catch (error) {
  report.status = 'FAILED'; report.functionalStatus = 'FAILED'; report.error ??= { name: error.name, message: error.message };
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog); await browser.close(); report.finishedAt = new Date().toISOString();
  await writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ report: reportFile, status: report.status, functionalStatus: report.functionalStatus, performanceStatus: report.performanceStatus, correctAttempts: report.mobile?.correctAttempts, p98Ms: report.mobile?.p98ObservedTypingEventDurationMs, maxMs: report.mobile?.maxObservedTypingEventDurationMs }));
}
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
