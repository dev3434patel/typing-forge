import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { installNativePipelineProbe, beginNativePipelineDiagnostic, markNativePipelineInputStart, endNativePipelineDiagnostic, abortNativePipelineDiagnostic } from './mobile-native-pipeline-runtime.mjs';

const startedAtMonotonic = performance.now();
const directory = 'audit/2026-11-02';
const prefix = process.argv[2] ?? 'final28-mobile-native-pipeline';
assert.match(prefix, /^[a-z0-9-]+$/);
const protocolFile = process.argv[3] ?? `${directory}/final28-mobile-native-pipeline-protocol.json`;
const protocol = JSON.parse(await readFile(protocolFile, 'utf8'));
const buildFile = protocol.buildFile ?? `${directory}/final28-mobile-native-pipeline-build.json`;
const output = `${directory}/${prefix}.json`;
await assert.rejects(access(output), { code: 'ENOENT' }, 'Choose a new output prefix; prior evidence is never overwritten.');
await assert.rejects(access(`${directory}/${prefix}-run-protocol.json`), { code: 'ENOENT' }, 'Choose a new output prefix; a prior run declaration is never overwritten.');
const buildRecord = JSON.parse(await readFile(buildFile, 'utf8'));
assert.equal(buildRecord.local.version, protocol.expectedBuild);
const served = await fetch(`${protocol.origin}/offline-build.json`, { signal: AbortSignal.timeout(5000) }).then(response => {
  assert.equal(response.status, 200, 'The served build identity must be readable.');
  return response.json();
});
assert.deepEqual(served, buildRecord.local, 'The served build must match the frozen measured build.');
const report = { protocol, protocolFile, buildFile, declaredAt: new Date().toISOString(), build: buildRecord.local, servedBuild: served,
  origin: protocol.origin, browser: null, cases: [], watchdogExpired: false, completed: false };
await writeFile(`${directory}/${prefix}-run-protocol.json`, JSON.stringify(report, null, 2));
const browser = await chromium.launch();
report.browser = browser.version();
const persist = () => writeFile(output, JSON.stringify(report, null, 2));
const watchdog = setTimeout(() => {
  report.watchdogExpired = true;
  void persist().finally(async () => { await browser.close().catch(() => undefined); process.exit(2); });
}, Math.max(1, protocol.totalWatchdogMs - (performance.now() - startedAtMonotonic)));

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations()
      .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)));
  });
}

async function focusTyping(page) {
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await expect(input).toBeVisible();
  if (!await input.evaluate(element => element === document.activeElement))
    await page.getByRole('button', { name: /^(Click here or tab to start typing|Continue typing)/ }).click();
  await expect(input).toBeFocused();
  return input;
}

async function targetText(locator) {
  return locator.locator('[data-slot-index][data-expected]').evaluateAll(elements => elements
    .sort((a, b) => Number(a.dataset.slotIndex) - Number(b.dataset.slotIndex))
    .map(element => element.dataset.expected).join(''));
}

async function beginObservation(page, context, input, caseId) {
  await settle(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: protocol.cpuThrottle });
  await input.evaluate(element => element.focus({ preventScroll: true }));
  await page.evaluate(() => {
    const observation = { start: performance.now(), end: null, entries: [], tasks: [], beforeInput: 0,
      supported: PerformanceObserver.supportedEntryTypes.includes('event'), observers: [] };
    window.mobileWorkspaceBench = observation;
    document.addEventListener('beforeinput', event => {
      if (observation.end === null && event.inputType === 'insertText') observation.beforeInput++;
    });
    for (const type of ['event', 'longtask']) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      const consume = entries => {
        for (const entry of entries) {
          if (entry.startTime < observation.start || (observation.end !== null && entry.startTime > observation.end)) continue;
          if (type === 'event' && observation.entries.length < 20000)
            observation.entries.push({ name: entry.name, duration: entry.duration, interactionId: entry.interactionId, startTime: entry.startTime });
          else if (type === 'longtask') observation.tasks.push(entry.duration);
        }
      };
      const observer = new PerformanceObserver(list => consume(list.getEntries()));
      observer.observe(type === 'event' ? { type, durationThreshold: 16 } : { type });
      observation.observers.push({ observer, consume });
    }
  });
  await beginNativePipelineDiagnostic(page, cdp, caseId, prefix, protocol);
}

async function endObservation(page) {
  await page.evaluate(() => { window.mobileWorkspaceBench.end = performance.now(); });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const observation = await page.evaluate(() => {
    const { observers, ...value } = window.mobileWorkspaceBench;
    for (const { observer, consume } of observers) { consume(observer.takeRecords()); observer.disconnect(); }
    return { ...value, entries: window.mobileWorkspaceBench.entries, tasks: window.mobileWorkspaceBench.tasks };
  });
  const typingEvents = observation.entries.filter(entry => ['keydown', 'keyup', 'keypress', 'input', 'beforeinput'].includes(entry.name));
  const durations = typingEvents.map(entry => entry.duration).sort((a, b) => a - b);
  const interactions = new Map();
  for (const entry of typingEvents) if (entry.interactionId > 0)
    interactions.set(entry.interactionId, Math.max(interactions.get(entry.interactionId) ?? 0, entry.duration));
  const interactionDurations = [...interactions.values()].sort((a, b) => a - b);
  const p98 = values => values.length ? values[Math.ceil(values.length * .98) - 1] : null;
  return { eventTimingSupported: observation.supported, observedTypingEventsAtLeast16ms: typingEvents.length,
    p98ObservedTypingEventDurationMs: p98(durations), maxObservedTypingEventDurationMs: durations.at(-1) ?? null,
    measuredInteractionsAtLeast16ms: interactions.size, p98ObservedInteractionMaximumMs: p98(interactionDurations),
    observedBeforeInputEvents: observation.beforeInput, measuredWallMs: observation.end - observation.start,
    longTasksThroughTypingAndResult: observation.tasks };
}

async function exportedResult(page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await pending;
  const file = await download.path();
  assert.ok(file, 'An actual result export must be downloaded.');
  return JSON.parse(await readFile(file, 'utf8'));
}

function checkResult(result, text) {
  assert.equal(result.finalText, text, 'Exported retained input must exactly equal the typed passage.');
  assert.equal(result.metrics.insertionAttempts, [...text].length);
  assert.equal(result.metrics.incorrectAttempts, 0);
  assert.equal(result.metrics.inputAccuracy, 100);
  return { targetUnits: [...text].length, finalTextExact: true, attempts: result.metrics.insertionAttempts,
    incorrectAttempts: result.metrics.incorrectAttempts, inputAccuracy: result.metrics.inputAccuracy,
    elapsedMs: result.elapsedMs, correctCharacterWpm: result.metrics.correctCharacterWpm,
    exportedClientSessionId: result.clientSessionId };
}

async function runWorkspace(specification, page, context, receipt) {
  await page.goto(new URL(specification.route, `${protocol.origin}/`).href);
  let input;
  if (specification.id === 'learn') {
    input = page.getByRole('textbox', { name: 'Type the practice text', exact: true });
    await expect(input).toBeVisible();
    const text = await targetText(page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text'));
    assert.ok(text.length > 0, 'The initial adaptive target must exist.');
    await beginObservation(page, context, input, specification.id);
    await markNativePipelineInputStart(page);
    await input.pressSequentially(text, { delay: 0 });
    receipt.pipeline = await endNativePipelineDiagnostic(page);
    await expect(page.getByRole('region', { name: 'Session results', exact: true })).toBeVisible();
    receipt.timing = await endObservation(page);
    receipt.evidence = checkResult(await exportedResult(page), text);
  } else if (specification.id === 'course') {
    await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
    input = await focusTyping(page);
    const text = await targetText(page.getByTestId('typing-target'));
    const catalog = JSON.parse(await readFile('backend/resources/typing-course-v1.json', 'utf8'));
    assert.ok(catalog.lessons[0].variants.some(variant => variant.text === text), 'The actual first guided target must match a published variant.');
    await beginObservation(page, context, input, specification.id);
    await markNativePipelineInputStart(page);
    await input.pressSequentially(text, { delay: 0 });
    receipt.pipeline = await endNativePipelineDiagnostic(page);
    await expect(page.getByRole('region', { name: 'Course lesson result', exact: true })).toBeVisible();
    receipt.timing = await endObservation(page);
    await page.getByText('View full session results', { exact: true }).click();
    receipt.evidence = checkResult(await exportedResult(page), text);
  } else if (specification.id === 'local-bot') {
    await page.getByRole('combobox', { name: 'Difficulty', exact: true }).selectOption('beginner');
    await page.getByRole('button', { name: 'Start bot practice', exact: true }).click();
    input = await focusTyping(page);
    const text = (await targetText(page.getByTestId('typing-target'))).slice(0, 100);
    assert.equal(text.length, 100);
    await beginObservation(page, context, input, specification.id);
    await markNativePipelineInputStart(page);
    await input.pressSequentially(text, { delay: 0 });
    receipt.pipeline = await endNativePipelineDiagnostic(page);
    await expect(input).toHaveValue(text);
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Bot practice complete', exact: true })).toBeVisible();
    receipt.timing = await endObservation(page);
    const result = await exportedResult(page);
    assert.equal(result.configuration.settings?.localBot, true);
    assert.equal(result.configuration.mode, 'race');
    assert.ok(result.configuration.challengeId.startsWith('local-bot:'));
    receipt.evidence = { ...checkResult(result, text), localBot: true };
  } else {
    await page.getByRole('button', { name: 'Start calm journey', exact: true }).click();
    input = page.getByRole('textbox', { name: 'Your word', exact: true });
    await expect(input).toBeFocused();
    await beginObservation(page, context, input, specification.id);
    const typed = [];
    for (let gate = 0; gate < 18; gate++) {
      const label = await page.getByTestId('game-target').getAttribute('aria-label');
      assert.ok(label?.startsWith('Target word: '));
      const word = label.slice('Target word: '.length);
      assert.match(word, /^[a-z]+$/);
      await input.pressSequentially(word, { delay: 0 });
      await expect(input).toHaveValue(word);
      typed.push(word);
      await input.press('Enter');
      if (gate < 17) await expect(input).toHaveValue('');
    }
    await expect(page.getByTestId('signal-run')).toHaveAttribute('data-phase', 'complete');
    await expect(page.getByTestId('game-gates')).toHaveText('18 / 18');
    await expect(page.getByTestId('game-accuracy')).toHaveText('100.0%');
    const units = typed.join('').length;
    await expect(page.getByTestId('game-attempt-evidence')).toContainText(`${units} / ${units} correct character attempts`);
    receipt.timing = await endObservation(page);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sparowtype.signal-run.v1:guest') || '{}').calm?.gates)).toBe(18);
    const best = await page.evaluate(() => JSON.parse(localStorage.getItem('sparowtype.signal-run.v1:guest')).calm);
    assert.equal(best.mode, 'calm'); assert.equal(best.gates, 18); assert.equal(best.cleanGates, 18); assert.equal(best.accuracy, 100);
    assert.equal(best.paused, false);
    assert.deepEqual(Object.keys(best).sort(), ['version', 'mode', 'gates', 'cleanGates', 'accuracy', 'elapsedMs', 'paused'].sort());
    receipt.evidence = { targetUnits: units, attempts: units, inputAccuracy: 100, finalInputValuesExact: true,
      completedGates: typed.length, localBest: best, rawTypedTextStored: false };
  }
  assert.equal(receipt.timing.observedBeforeInputEvents, receipt.evidence.targetUnits, 'Every expected insertion must reach native beforeinput exactly once.');
  receipt.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(receipt.horizontalOverflow, false);
  assert.equal(receipt.pageErrors.length, 0);
  assert.equal(receipt.consoleErrors.length, 0);
}

try {
  for (const specification of protocol.cases) {
    const receipt = { id: specification.id, startedAt: new Date().toISOString(), passed: false, pageErrors: [], consoleErrors: [] };
    report.cases.push(receipt);
    const context = await browser.newContext({ viewport: protocol.viewport, isMobile: true, hasTouch: true,
      acceptDownloads: true, serviceWorkers: 'block' });
    await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
    await installNativePipelineProbe(context, specification.id, protocol);
    const page = await context.newPage();
    page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(12000);
    page.on('pageerror', error => receipt.pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') receipt.consoleErrors.push(message.text()); });
    let timeout;
    try {
      await Promise.race([
        runWorkspace(specification, page, context, receipt),
        new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error(`Declared ${protocol.caseTimeoutMs}ms workspace bound exceeded`)), protocol.caseTimeoutMs); }),
      ]);
      receipt.passed = true;
    } catch (error) {
      receipt.failure = { message: error.message, stack: error.stack };
      await page.screenshot({ path: `${directory}/${prefix}-${specification.id}-failure.png`, fullPage: true, timeout: 2000 }).catch(() => undefined);
    } finally {
      clearTimeout(timeout);
      const unfinished = await abortNativePipelineDiagnostic(page);
      if (unfinished) { receipt.diagnosticIncomplete = unfinished; receipt.passed = false; }
      await context.close();
      receipt.finishedAt = new Date().toISOString();
      await persist();
    }
    console.log(JSON.stringify(receipt));
  }
  report.completed = true;
  report.finishedAt = new Date().toISOString();
  await persist();
  if (report.cases.some(receipt => !receipt.passed)) process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  await browser.close();
}
