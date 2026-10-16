import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

const directory = 'audit/performance-polish-2026-10-16';
const summary = { clock: 'Real production wall clock; no virtual clock or shader mocks.', cases: [] };
const browser = await chromium.launch();
const deadline = setTimeout(() => process.exit(2), 85_000);
try {
  for (const [name, viewport, touch] of [
    ['desktop', { width: 1440, height: 1000 }, false],
    ['mobile', { width: 390, height: 844 }, true],
  ]) {
    const context = await browser.newContext({ viewport, hasTouch: touch });
    const page = await context.newPage();
    const started = performance.now();
    const result = { name, viewport, workers: [], errors: [], captures: [] };
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
    page.on('worker', worker => result.workers.push(worker.url()));
    await page.addInitScript(() => {
      window.introWorkerEvents = [];
      const Original = window.Worker;
      window.Worker = new Proxy(Original, {
        construct(Target, args) {
          const worker = Reflect.construct(Target, args);
          worker.addEventListener('message', ({ data }) => {
            window.introWorkerEvents.push({ time: performance.now(), type: data.type, diagnostics: data.diagnostics, phase: data.phase, letter: data.letter });
          });
          return worker;
        },
      });
      const observer = new MutationObserver(() => {
        const opening = document.querySelector('[data-testid="opening-experience"]');
        if (opening && !window.introMountedAt) window.introMountedAt = performance.now();
      });
      observer.observe(document, { subtree: true, childList: true });
    });
    await page.goto('http://127.0.0.1:4175/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    try {
      await page.waitForFunction(() => window.introWorkerEvents.some(event => event.type === 'ready'), undefined, { timeout: 6000 });
      result.nativeWorkerReady = true;
    } catch { result.nativeWorkerReady = false; }
    for (const [targetAge, stage] of [[1850, 'assembled'], [3150, 'typed']]) {
      const age = await page.evaluate(() => performance.now() - (window.introMountedAt || performance.now()));
      if (age < targetAge) await new Promise(resolve => setTimeout(resolve, targetAge - age));
      const opening = page.getByTestId('opening-experience');
      if (await opening.count()) {
        const state = await opening.evaluate(element => ({ renderer: element.dataset.renderer, age: performance.now() - window.introMountedAt, scene: document.querySelector('.awakening-canvas')?.dataset.scene, typed: document.querySelector('.awakening-title-typed')?.textContent, viewport: { width: innerWidth, height: innerHeight }, controls: [...element.querySelectorAll('button,.awakening-title,.awakening-caption')].map(item => { const r = item.getBoundingClientRect(); return { text: item.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }), documentWidth: document.documentElement.scrollWidth }));
        const path = `${directory}/front-${name}-${stage}.png`;
        await page.screenshot({ path, timeout: 6000 });
        result.captures.push({ path, ...state, scene: state.scene ? JSON.parse(state.scene) : null });
      } else result.captures.push({ stage, missingOpeningAtCapture: true, age });
    }
    const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
    try {
      await input.waitFor({ state: 'visible', timeout: 6000 });
      result.practice = { value: await input.inputValue(), status: await page.getByRole('region', { name: 'Typing session', exact: true }).getAttribute('data-status'), elapsedMs: Math.round(performance.now() - started), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1) };
    } catch (error) { result.practiceFailure = String(error); }
    result.events = await page.evaluate(() => window.introWorkerEvents);
    summary.cases.push(result);
    await writeFile(`${directory}/visual-worker-smoke.json`, JSON.stringify(summary, null, 2));
    await context.close();
  }
} finally {
  await writeFile(`${directory}/visual-worker-smoke.json`, JSON.stringify(summary, null, 2));
  await browser.close();
  clearTimeout(deadline);
}
console.log(JSON.stringify(summary.cases.map(({ name, nativeWorkerReady, workers, errors, captures, practice }) => ({ name, nativeWorkerReady, workers: workers.length, errors, captures: captures.map(({ path, age, renderer, scene }) => ({ path, age, renderer, scene })), practice })), null, 2));
