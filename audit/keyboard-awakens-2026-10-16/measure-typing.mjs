import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const requestedDelay = Number(process.env.TYPING_BENCH_DELAY_MS ?? 20);
const reportName = requestedDelay === 0 ? 'typing-burst' : 'typing-throughput';
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/');
  await page.getByRole('group', { name: 'Test mode', exact: true }).getByRole('button', { name: 'Custom', exact: true }).click();
  const passage = 'calm hands build steady rhythm '.repeat(8).trim();
  await page.getByRole('textbox', { name: 'Custom practice passage', exact: true }).fill(passage);
  await page.getByRole('button', { name: 'Start private practice', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await input.focus();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    window.typingBench = { entries: [], beforeInput: 0, supported: PerformanceObserver.supportedEntryTypes.includes('event') };
    document.addEventListener('beforeinput', event => { if (event.inputType === 'insertText') window.typingBench.beforeInput++; });
    if (window.typingBench.supported) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries())
          if (window.typingBench.entries.length < 5000)
            window.typingBench.entries.push({ name: entry.name, duration: entry.duration, interactionId: entry.interactionId });
      });
      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    }
  });
  await input.pressSequentially(passage, { delay: requestedDelay });
  await expect(page.getByRole('region', { name: 'Session results', exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await downloadPromise;
  const result = JSON.parse(await readFile(await download.path(), 'utf8'));
  const observation = await page.evaluate(() => window.typingBench);
  const typingEvents = observation.entries.filter(entry => ['keydown', 'keyup', 'keypress', 'input', 'beforeinput'].includes(entry.name));
  const durations = typingEvents.map(entry => entry.duration).sort((a, b) => a - b);
  const report = {
    browser: await browser.version(), viewport: { width: 390, height: 844 }, cpuThrottle: 4,
    requestedInterCharacterDelayMs: requestedDelay, targetUnits: Array.from(passage).length,
    finalTextExact: result.finalText === passage, attempts: result.metrics.insertionAttempts,
    inputAccuracy: result.metrics.inputAccuracy, elapsedMs: result.elapsedMs,
    correctCharacterWpm: result.metrics.correctCharacterWpm,
    observedBeforeInputEvents: observation.beforeInput, eventTimingSupported: observation.supported,
    eventTimingEntriesAtLeast16ms: typingEvents.length,
    p98ObservedTypingEventDurationMs: durations.length ? durations[Math.ceil(durations.length * .98) - 1] : null,
    maxObservedTypingEventDurationMs: durations.length ? durations.at(-1) : null,
    errors,
    limitation: 'One local Chromium run, CPU-throttled after loading a custom test. Event Timing durations are quantized and thresholded; this is not field INP or native Android/Safari acceptance. Requested driver delay is not assumed to equal observed typing speed.'
  };
  await writeFile(`audit/keyboard-awakens-2026-10-16/${reportName}.json`, JSON.stringify(report, null, 2));
  if (!report.finalTextExact || report.attempts !== report.targetUnits || report.inputAccuracy !== 100 || errors.length) throw new Error('Typing throughput evidence mismatch');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
