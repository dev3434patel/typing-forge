import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/correction-experience-2026-10-20';
const origin = process.env.TYPING_BENCH_ORIGIN ?? 'http://127.0.0.1:4173';
const settle = process.env.TYPING_BENCH_SETTLE === '1';
const cpuThrottle = Number(process.env.TYPING_BENCH_CPU_RATE ?? 4);
if (!Number.isFinite(cpuThrottle) || cpuThrottle < 1 || cpuThrottle > 8) throw new Error('Invalid CPU throttle');
const repetitions = Number(process.env.TYPING_BENCH_REPETITIONS ?? 8);
const requestedDelay = Number(process.env.TYPING_BENCH_DELAY_MS ?? 0);
const reportName = process.env.TYPING_BENCH_REPORT_NAME ?? (repetitions > 8 ? 'typing-sustained' : 'typing-burst');
if (!/^[a-z0-9-]+$/.test(reportName)) throw new Error('Invalid report name');
const buildRecord = JSON.parse(await readFile(process.env.TYPING_BENCH_BUILD_FILE ?? `${directory}/source-build.json`, 'utf8'));
const build = buildRecord.local ?? buildRecord;
const servedBuild = await fetch(`${origin}/offline-build.json`).then(response => {
  if (!response.ok) throw new Error(`Cannot identify served build: ${response.status}`);
  return response.json();
});
if (JSON.stringify(build) !== JSON.stringify(servedBuild)) throw new Error('Served typing benchmark build differs from frozen build');
const browser = await chromium.launch();
const watchdog = setTimeout(async () => {
  await browser.close().catch(() => undefined);
  process.exit(2);
}, 150_000);
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/`);
  await page.getByRole('group', { name: 'Test mode', exact: true }).getByRole('button', { name: 'Custom', exact: true }).click();
  const passage = 'calm hands build steady rhythm '.repeat(repetitions).trim();
  await page.getByRole('textbox', { name: 'Custom practice passage', exact: true }).fill(passage);
  await page.getByRole('button', { name: 'Start private practice', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await input.focus();
  if (settle) await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => undefined)));
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });
  await page.evaluate(() => {
    window.typingBench = { entries: [], tasks: [], beforeInput: 0, supported: PerformanceObserver.supportedEntryTypes.includes('event') };
    document.addEventListener('beforeinput', event => { if (event.inputType === 'insertText') window.typingBench.beforeInput++; });
    if (window.typingBench.supported) {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries())
          if (window.typingBench.entries.length < 20_000)
            window.typingBench.entries.push({ name: entry.name, duration: entry.duration, interactionId: entry.interactionId });
      }).observe({ type: 'event', durationThreshold: 16 });
    }
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.typingBench.tasks.push(entry.duration);
      }).observe({ type: 'longtask' });
    }
  });
  let resize = null;
  if (repetitions > 8) {
    const split = Math.floor(passage.length / 2);
    await input.pressSequentially(passage.slice(0, split), { delay: requestedDelay });
    const before = await input.inputValue();
    await page.setViewportSize({ width: 844, height: 390 });
    const after = await input.inputValue();
    resize = { beforeLength: before.length, afterLength: after.length, retainedExactly: before === after, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) };
    await input.pressSequentially(passage.slice(split), { delay: requestedDelay });
  } else await input.pressSequentially(passage, { delay: requestedDelay });
  await expect(page.getByRole('region', { name: 'Session results', exact: true })).toBeVisible();
  const observation = await page.evaluate(() => window.typingBench);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await downloadPromise;
  const result = JSON.parse(await readFile(await download.path(), 'utf8'));
  const typingEvents = observation.entries.filter(entry => ['keydown', 'keyup', 'keypress', 'input', 'beforeinput'].includes(entry.name));
  const durations = typingEvents.map(entry => entry.duration).sort((a, b) => a - b);
  const report = {
    build, servedBuild, origin, fontsAndFiniteAnimationsSettled: settle,
    browser: await browser.version(), viewport: { width: 390, height: 844 }, cpuThrottle,
    requestedInterCharacterDelayMs: requestedDelay, targetUnits: Array.from(passage).length,
    finalTextExact: result.finalText === passage, attempts: result.metrics.insertionAttempts,
    inputAccuracy: result.metrics.inputAccuracy, elapsedMs: result.elapsedMs,
    correctCharacterWpm: result.metrics.correctCharacterWpm,
    observedBeforeInputEvents: observation.beforeInput, eventTimingSupported: observation.supported,
    eventTimingEntriesAtLeast16ms: typingEvents.length,
    p98ObservedTypingEventDurationMs: durations.length ? durations[Math.ceil(durations.length * .98) - 1] : null,
    maxObservedTypingEventDurationMs: durations.length ? durations.at(-1) : null,
    longTasksThroughResultsTransition: observation.tasks, resize, errors,
    limitation: 'Local Chromium lab run, CPU-throttled after loading a custom test. Event Timing is quantized and thresholded, not field INP or native-device acceptance. Requested driver delay is not observed typing speed. Sustained scenario includes a real viewport rotation midway.'
  };
  await writeFile(`${directory}/${reportName}.json`, JSON.stringify(report, null, 2));
  if (!report.finalTextExact || report.attempts !== report.targetUnits || report.inputAccuracy !== 100 || errors.length || resize?.retainedExactly === false || resize?.overflow) throw new Error('Typing throughput evidence mismatch');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  clearTimeout(watchdog);
}
