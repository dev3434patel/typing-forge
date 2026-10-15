import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

type ProbeEvent = { kind: string; at: number; value?: string };
test.beforeEach(async ({ page }, info) => {
  if (info.title.includes('foreground')) await page.bringToFront();
  await page.addInitScript(() => {
    const probe = { events: [] as ProbeEvent[] };
    Object.assign(window, { forgeLoadingProbe: probe });
    const add = (kind: string, value?: string) => probe.events.push({ kind, at: performance.now(), value });
    add('bootstrap-visibility', document.visibilityState);
    document.addEventListener('visibilitychange', () => add('visibility', document.visibilityState));
    document.addEventListener('DOMContentLoaded', () => add('dom-content-loaded'));
    window.addEventListener('load', () => add('window-load'));
    let lastState = '';
    new MutationObserver(() => {
      const main = document.querySelector('main');
      const next = main?.textContent?.includes('Loading your workspace') ? 'fallback' : main ? 'view' : 'empty';
      if (next !== lastState) { add('root', next); lastState = next; }
    }).observe(document, { subtree: true, childList: true, characterData: true });
    requestAnimationFrame(() => add('first-animation-frame'));
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { add('initial-message-channel'); channel.port1.close(); channel.port2.close(); };
    channel.port2.postMessage(null);
  });
});

test.afterEach(async ({ page }, info) => {
  const browserErrors: string[] = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  const data = await page.evaluate(async () => {
    const probe = (window as unknown as { forgeLoadingProbe: { events: ProbeEvent[] } }).forgeLoadingProbe;
    const start = performance.now();
    const channelLatency = await new Promise<number>(resolve => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve(performance.now() - start); };
      channel.port2.postMessage(null);
    });
    return {
      now: performance.now(), visibility: document.visibilityState,
      events: probe?.events, postTestMessageChannelLatency: channelLatency,
      title: document.title, url: location.pathname,
      currentRoot: document.querySelector('main')?.textContent?.slice(0, 140),
      resources: performance.getEntriesByType('resource').map(entry => {
        const resource = entry as PerformanceResourceTiming;
        return { name: new URL(resource.name).pathname, start: resource.startTime, end: resource.responseEnd, duration: resource.duration, type: resource.initiatorType };
      }),
    };
  }).catch(error => ({ collectionError: String(error) }));
  const report = { case: info.title, status: info.status, duration: info.duration, browserErrors, data };
  await mkdir('audit/keyboard-lab-2026-10-15/loading-probe/observations', { recursive: true });
  await writeFile(`audit/keyboard-lab-2026-10-15/loading-probe/observations/${info.title.replace(/[^a-z0-9]/gi, '-')}.json`, JSON.stringify(report, null, 2));
});

for (const foreground of [false, true]) for (let iteration = 1; iteration <= 3; iteration++) {
  const label = `${foreground ? 'foreground' : 'baseline'} ${iteration}`;
  test(`${label} mobile route readiness`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    await expect(nav.getByRole('link', { name: 'Test', exact: true })).toHaveAttribute('href', '/');
    await nav.getByRole('link', { name: 'Learn', exact: true }).click();
    await expect(page).toHaveURL('/learn');
    await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  });
  test(`${label} keyboard command readiness`, async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: 'Typing Forge commands', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('Aurora');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  });
  test(`${label} direct learn readiness`, async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Type the practice text', exact: true })).toBeVisible();
  });
}
