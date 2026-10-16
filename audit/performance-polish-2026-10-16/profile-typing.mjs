import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = 'audit/performance-polish-2026-10-16';
const variant = process.env.TYPING_PROFILE_VARIANT ?? 'baseline';
if (!['baseline', 'hidden-marker'].includes(variant)) throw new Error('Unknown diagnostic variant');
const prefix = process.env.TYPING_PROFILE_PREFIX ?? 'typing';
if (!/^[a-z0-9-]+$/.test(prefix)) throw new Error('Invalid diagnostic output prefix');
const expected = JSON.parse(await readFile(`${directory}/final-build-identity.json`, 'utf8'));
const served = await fetch('http://127.0.0.1:4175/offline-build.json').then(response => response.json());
if (expected.version !== served.version) throw new Error('Profiling server is not the frozen candidate');
const browser = await chromium.launch();
const watchdog = setTimeout(() => { void browser.close().finally(() => process.exit(2)); }, 90_000);
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/');
  await page.getByRole('group', { name: 'Test mode', exact: true }).getByRole('button', { name: 'Custom', exact: true }).click();
  const passage = 'calm hands build steady rhythm '.repeat(40).trim();
  await page.getByRole('textbox', { name: 'Custom practice passage', exact: true }).fill(passage);
  await page.getByRole('button', { name: 'Start private practice', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await input.focus();
  // This assisted diagnostic prefill is intentionally excluded from performance
  // acceptance and is not exported as a legitimate score or measured WPM.
  const prefillUnits = 800;
  const nativeUnits = 150;
  await input.fill(passage.slice(0, prefillUnits));
  await expect(input).toHaveValue(passage.slice(0, prefillUnits));
  if (variant === 'hidden-marker') {
    await page.addStyleTag({ content: '.typing-text .forge-caret[style*="hidden"] { display: none !important; }' });
    await page.evaluate(() => {
      const actualBounds = Element.prototype.getBoundingClientRect;
      const actualRects = Element.prototype.getClientRects;
      Element.prototype.getBoundingClientRect = function () {
        if (this instanceof HTMLElement && this.style.visibility === 'hidden' && this.matches('.typing-text .forge-caret')) {
          const character = this.closest('[data-current="true"]');
          const bounds = character && actualRects.call(character)[0];
          if (bounds) return new DOMRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
        return actualBounds.call(this);
      };
    });
  }
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  await cdp.send('Profiler.start');
  const began = performance.now();
  await input.pressSequentially(passage.slice(prefillUnits, prefillUnits + nativeUnits), { delay: 0 });
  const nativeDriverElapsedMs = performance.now() - began;
  const { profile } = await cdp.send('Profiler.stop');
  const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end');
  const { stream } = await completed;
  let traceText = '';
  for (;;) {
    const chunk = await cdp.send('IO.read', { handle: stream });
    traceText += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  await writeFile(`${directory}/${prefix}-cpu-profile.cpuprofile`, JSON.stringify(profile));
  await writeFile(`${directory}/${prefix}-timeline-trace.json`, traceText);
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const parent = new Map();
  for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);
  const self = new Map(), inclusive = new Map();
  for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
    const id = profile.samples[i], duration = profile.timeDeltas[i] ?? 0;
    self.set(id, (self.get(id) ?? 0) + duration);
    for (let current = id; current !== undefined; current = parent.get(current)) inclusive.set(current, (inclusive.get(current) ?? 0) + duration);
  }
  const sourceCache = new Map();
  async function entry(id, microseconds) {
    const node = nodes.get(id), frame = node.callFrame;
    let snippet;
    if (frame.url.startsWith('http://127.0.0.1:4175/assets/')) {
      const filename = new URL(frame.url).pathname.slice(1);
      if (!sourceCache.has(filename)) sourceCache.set(filename, (await readFile(path.join('dist', filename), 'utf8')).split('\n'));
      const line = sourceCache.get(filename)[frame.lineNumber] ?? '';
      snippet = line.slice(Math.max(0, frame.columnNumber - 100), frame.columnNumber + 220);
    }
    return { id, name: frame.functionName, milliseconds: microseconds / 1000, url: frame.url, line: frame.lineNumber + 1, column: frame.columnNumber + 1, snippet };
  }
  const top = async map => Promise.all([...map].sort((a, b) => b[1] - a[1]).slice(0, 35).map(([id, time]) => entry(id, time)));
  const trace = JSON.parse(traceText);
  const timeline = new Map();
  for (const event of trace.traceEvents ?? []) {
    if (event.ph !== 'X' || !event.dur) continue;
    const row = timeline.get(event.name) ?? { name: event.name, count: 0, totalMs: 0, maxMs: 0 };
    row.count++;
    row.totalMs += event.dur / 1000;
    row.maxMs = Math.max(row.maxMs, event.dur / 1000);
    timeline.set(event.name, row);
  }
  const report = {
    build: expected, served, browser: await browser.version(), viewport: { width: 390, height: 844 }, cpuThrottle: 4, variant,
    targetUnits: passage.length, assistedDiagnosticPrefillUnits: prefillUnits, measuredNativeCharacterUnits: nativeUnits,
    finalPrefixExact: await input.inputValue() === passage.slice(0, prefillUnits + nativeUnits), nativeDriverElapsedMs, errors,
    limitation: 'Diagnostic assisted prefill, followed by150real native input characters. Not an accepted typing score or throughput/WPM result. Hidden-marker variant additionally hides only measurement markers and returns the actual current character client rect to that measurement call. CPU sampling and timeline instrumentation add overhead; aggregate nested durations are not additive.',
    self: await top(self), inclusive: await top(inclusive),
    timeline: [...timeline.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 35),
  };
  await writeFile(`${directory}/${prefix}-profile-summary.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, self: report.self.slice(0, 15), inclusive: report.inclusive.slice(0, 18), timeline: report.timeline.slice(0, 18) }, null, 2));
} finally {
  await browser.close();
  clearTimeout(watchdog);
}
