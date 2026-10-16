import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const directory = 'audit/performance-polish-2026-10-16';
const prefix = 'startup-caret-geometry-profile';
const build = JSON.parse(await readFile(`${directory}/final-build-identity.json`, 'utf8'));
const servedBuild = await fetch('http://127.0.0.1:4175/offline-build.json').then(response => response.json());
if (build.version !== servedBuild.version) throw new Error('Unexpected profiling build');
const browser = await chromium.launch();
const watchdog = setTimeout(() => { void browser.close().finally(() => process.exit(2)); }, 90_000);
try {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [], workers = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('worker', worker => workers.push(worker.url()));
  await context.addInitScript(() => {
    window.startupProfileEvidence = { longTasks: [], largestContentfulPaint: [] };
    if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.startupProfileEvidence.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint'))
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.startupProfileEvidence.largestContentfulPaint.push({ start: entry.startTime, size: entry.size, element: entry.element?.className });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReturnAsStream' });
  await cdp.send('Profiler.start');
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const rendererDuringIntro = await page.locator('.awakening-canvas').getAttribute('data-scene').catch(() => null);
  await page.waitForTimeout(3900);
  const evidence = await page.evaluate(() => ({ ...window.startupProfileEvidence, paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, start: entry.startTime })), introPresent: !!document.querySelector('.awakening'), practicePresent: !!document.querySelector('[aria-label="Typing session"]') }));
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
  await writeFile(`${directory}/${prefix}.cpuprofile`, JSON.stringify(profile));
  await writeFile(`${directory}/${prefix}-trace.json`, traceText);
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const parents = new Map();
  for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
  const frames = new Map();
  for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
    const counted = new Set(), duration = (profile.timeDeltas[i] ?? 0) / 1000;
    for (let id = profile.samples[i]; id !== undefined; id = parents.get(id)) {
      const frame = nodes.get(id).callFrame;
      const key = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}:${frame.functionName}`;
      const row = frames.get(key) ?? { ...frame, selfMs: 0, inclusiveMs: 0 };
      if (id === profile.samples[i]) row.selfMs += duration;
      if (!counted.has(key)) row.inclusiveMs += duration;
      counted.add(key);
      frames.set(key, row);
    }
  }
  const sourceCache = new Map();
  async function source(row) {
    let snippet;
    if (row.url.startsWith('http://127.0.0.1:4175/assets/')) {
      const filename = new URL(row.url).pathname.slice(1);
      if (!sourceCache.has(filename)) sourceCache.set(filename, (await readFile(path.join('dist', filename), 'utf8')).split('\n'));
      const line = sourceCache.get(filename)[row.lineNumber] ?? '';
      snippet = line.slice(Math.max(0, row.columnNumber - 80), row.columnNumber + 280);
    }
    return { ...row, line: row.lineNumber + 1, column: row.columnNumber + 1, snippet };
  }
  const trace = JSON.parse(traceText).traceEvents;
  const fcp = trace.find(event => event.name === 'firstContentfulPaint');
  const mainThread = fcp && { pid: fcp.pid, tid: fcp.tid };
  const mainEvents = trace.filter(event => !mainThread || (event.pid === mainThread.pid && event.tid === mainThread.tid));
  const timeline = new Map();
  for (const event of mainEvents) {
    if (event.ph !== 'X' || !event.dur) continue;
    const row = timeline.get(event.name) ?? { name: event.name, count: 0, totalMs: 0, maxMs: 0 };
    row.count++; row.totalMs += event.dur / 1000; row.maxMs = Math.max(row.maxMs, event.dur / 1000);
    timeline.set(event.name, row);
  }
  const top = async key => Promise.all([...frames.values()].sort((a, b) => b[key] - a[key]).slice(0, 45).map(source));
  const report = {
    build, servedBuild, browser: await browser.version(), cpuThrottle: 4, viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75,
    errors, workers, rendererDuringIntro: rendererDuringIntro && JSON.parse(rendererDuringIntro), evidence, mainThread,
    limitation: 'Diagnostic actual CPU throttling, no Lighthouse simulated network. CPU sampling and timeline stacks add overhead. No renderer quality/score options changed. Nested categories and inclusive frames are not additive wall time.',
    self: await top('selfMs'), inclusive: await top('inclusiveMs'),
    timeline: [...timeline.values()].sort((a, b) => b.totalMs - a.totalMs).slice(0, 40),
    longestMainTasks: mainEvents.filter(event => event.name === 'RunTask' && event.ph === 'X').sort((a, b) => b.dur - a.dur).slice(0, 15),
    longestLayouts: mainEvents.filter(event => ['Layout', 'UpdateLayoutTree'].includes(event.name) && event.ph === 'X').sort((a, b) => b.dur - a.dur).slice(0, 15),
  };
  await writeFile(`${directory}/${prefix}-summary.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, self: report.self.slice(0, 15), inclusive: report.inclusive.slice(0, 15), longestLayouts: report.longestLayouts.slice(0, 4), longestMainTasks: report.longestMainTasks.slice(0, 5) }, null, 2));
} finally {
  await browser.close();
  clearTimeout(watchdog);
}
