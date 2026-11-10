import { test, expect, type Page } from '@playwright/test';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { focusTyping } from '../../../e2e/helpers';

const directory = path.resolve('audit/2026-11-04-followup');
const catalog = JSON.parse(readFileSync('backend/resources/typing-course-v1.json', 'utf8')) as { lessons: { id: string; title: string; variants: { id: string; text: string }[] }[] };
const [first, second] = catalog.lessons;
type Probe = { sequence: number; elapsedMs: number; type: string; value: string; node: number; connected: boolean; focused: boolean; reset: boolean; complete: boolean; saved: number | null };

async function observe(page: Page, name: string) {
  const file = path.join(directory, `webkit-profile-reset-${test.info().project.name}-${name}-events.jsonl`);
  const began = performance.now(); let count = 0;
  const write = (row: Record<string, unknown>) => {
    if (++count > 350) return;
    appendFileSync(file, JSON.stringify({ nodeElapsedMs: Math.round((performance.now() - began) * 1000) / 1000, ...row }) + '\n');
  };
  await page.exposeBinding('__resetProbe', (_source, value: Probe) => {
    if (!value || typeof value !== 'object' || Object.keys(value).sort().join(',') !== 'complete,connected,elapsedMs,focused,node,reset,saved,sequence,type,value') throw new Error('Unexpected observer shape');
    if (!['absent', '', 'DELETE', 'other'].includes(value.value) || !['attach', 'remove', 'focus', 'blur', 'beforeinput', 'input', 'change', 'reset', 'complete', 'pagehide', 'frame'].includes(value.type)) throw new Error('Unexpected observer value');
    write({ kind: 'browser', ...value });
  });
  await page.addInitScript(() => {
    const host = window as Window & { __resetProbe: (value: unknown) => Promise<void> };
    let sequence = 0, nextNode = 0, previous: HTMLInputElement | null = null, frames = 0;
    const ids = new WeakMap<Element, number>();
    const id = (element: Element | null) => { if (!element) return 0; if (!ids.has(element)) ids.set(element, ++nextNode); return ids.get(element)!; };
    const snapshot = (type: string) => {
      const input = document.querySelector<HTMLInputElement>('#delete-confirmation');
      const value = input ? ['', 'DELETE'].includes(input.value) ? input.value : 'other' : 'absent';
      const header = [...document.querySelectorAll('p')].find(node => /saved sessions ·/.test(node.textContent ?? ''))?.textContent?.match(/^(\d+) saved sessions/);
      void host.__resetProbe({ sequence: ++sequence, elapsedMs: Math.round(performance.now() * 1000) / 1000, type, value, node: id(input), connected: input?.isConnected ?? false, focused: input === document.activeElement, reset: localStorage.getItem('sparowtype.workspace-reset.v1:guest') !== null, complete: [...document.querySelectorAll('[role="status"]')].some(node => node.textContent?.includes('This device workspace has been reset.')), saved: header ? Number(header[1]) : null }).catch(() => undefined);
    };
    const watch = () => { const current = document.querySelector<HTMLInputElement>('#delete-confirmation'); if (current !== previous) { snapshot(current ? 'attach' : 'remove'); previous = current; } };
    new MutationObserver(watch).observe(document, { subtree: true, childList: true });
    for (const type of ['focus', 'blur', 'beforeinput', 'input', 'change']) document.addEventListener(type, event => { if ((event.target as Element | null)?.id === 'delete-confirmation') snapshot(type); }, true);
    window.addEventListener('sparowtype:workspace-reset', () => snapshot('reset'));
    window.addEventListener('sparowtype:workspace-reset-result', () => snapshot('complete'));
    window.addEventListener('pagehide', () => snapshot('pagehide'));
    const frame = () => { if (document.querySelector('#delete-confirmation') && frames++ < 32) snapshot('frame'); if (frames < 32) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  });
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) write({ kind: 'navigation', path: new URL(frame.url()).pathname }); });
  page.on('pageerror', error => write({ kind: 'pageerror', name: error.name }));
  return async (label: string, action: () => Promise<unknown>) => {
    write({ kind: 'action', label, phase: 'begin' });
    try { const value = await action(); write({ kind: 'action', label, phase: 'end' }); return value; }
    catch (error) { write({ kind: 'action', label, phase: 'error', errorName: error instanceof Error ? error.name : 'Unknown' }); throw error; }
  };
}

test.beforeEach(async ({ page, context }) => {
  if (process.env.SPAROWTYPE_WEBKIT_RESET_PROBE !== '1') throw new Error('A separate coordinated diagnostic GO is required');
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  await context.route('**/api/**', route => route.fulfill({ json: { user: null, csrfToken: 'owned-reset-observer-fixture' } }));
});

async function courseAttempt(page: Page, variant = 'a') {
  const input = await focusTyping(page);
  await input.pressSequentially(first.variants.find(item => item.id === variant)!.text, { delay: 65 });
  await expect(page.getByRole('region', { name: 'Course lesson result', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Saving this attempt' })).toHaveCount(0);
}
async function beginCourse(page: Page) {
  await page.goto(`/lessons?lesson=${first.id}`);
  await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
}
async function confirmation(page: Page) {
  return page.getByLabel('Type DELETE to enable this action', { exact: true });
}

test('first mount accepts native fill beginning at document commit', async ({ page }) => {
  const action = await observe(page, 'early-fill');
  await action('goto-profile-commit', () => page.goto('/profile', { waitUntil: 'commit' }));
  const field = await confirmation(page);
  await action('native-fill', () => field.fill('DELETE'));
  await action('assert-value', () => expect(field).toHaveValue('DELETE'));
  await action('assert-reset-enabled', () => expect(page.getByRole('button', { name: 'Reset guest workspace', exact: true })).toBeEnabled());
});

test('three real course attempts retain DELETE through native fill and reset completion', async ({ page }) => {
  const action = await observe(page, 'course-fill');
  await action('begin-course', () => beginCourse(page));
  await action('attempt-a', () => courseAttempt(page));
  await page.getByRole('button', { name: 'Repeat this passage', exact: true }).click();
  await action('repeat-a', () => courseAttempt(page));
  await page.getByRole('button', { name: 'Start the next passage', exact: true }).click();
  await action('attempt-b', () => courseAttempt(page, 'b'));
  await page.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await action('reload-next-lesson', () => page.reload());
  await expect(page.getByRole('button', { name: 'Start lesson', exact: true })).toBeEnabled();
  await action('goto-profile', () => page.goto('/profile'));
  const field = await confirmation(page);
  await action('native-fill', () => field.fill('DELETE'));
  await expect(field).toHaveValue('DELETE');
  await action('reset-click', () => page.getByRole('button', { name: 'Reset guest workspace', exact: true }).click());
  await action('durable-public-completion', () => expect(page.getByRole('status').filter({ hasText: 'This device workspace has been reset.' })).toBeVisible());
  await action('goto-locked-lesson', () => page.goto(`/lessons?lesson=${second.id}`));
  await expect(page.getByText('Build the previous skill first.', { exact: true })).toBeVisible();
});

test('first mount native keyboard input controls for fill-specific behavior', async ({ page }) => {
  const action = await observe(page, 'native-keys');
  await action('goto-profile-commit', () => page.goto('/profile', { waitUntil: 'commit' }));
  const field = await confirmation(page);
  await action('native-focus', () => field.focus());
  await action('native-keys', () => field.pressSequentially('DELETE'));
  await action('assert-value', () => expect(field).toHaveValue('DELETE'));
  await expect(page.getByRole('button', { name: 'Reset guest workspace', exact: true })).toBeEnabled();
});

test('controlled pending reset records remount and hard-navigation ordering', async ({ page }) => {
  const action = await observe(page, 'pending-reset-navigation');
  let unblock!: () => void, requested!: () => void;
  const held = new Promise<void>(resolve => { unblock = resolve; });
  const seen = new Promise<void>(resolve => { requested = resolve; });
  await beginCourse(page); await courseAttempt(page);
  await page.goto('/profile');
  const field = await confirmation(page); await field.fill('DELETE');
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => /\/local-adapter-[^/]+\.js(?:\?|$)/.test(entry.name)))).toBe(false);
  // workspace-extras itself is a static account-data dependency. Its classroom
  // adapter is requested only by export/reset on these routes, after mount.
  await page.route('**/local-adapter-*.js', async route => { requested(); await held; if (!route.request().failure()) await route.continue(); });
  await action('reset-click', () => page.getByRole('button', { name: 'Reset guest workspace', exact: true }).click());
  await action('extras-response-held', () => seen);
  const pending = await page.evaluate(() => ({ marker: localStorage.getItem('sparowtype.workspace-reset.v1:guest') !== null, confirmationEmpty: (document.querySelector('#delete-confirmation') as HTMLInputElement | null)?.value === '', complete: [...document.querySelectorAll('[role="status"]')].some(node => node.textContent?.includes('This device workspace has been reset.')), progressionPresent: localStorage.getItem('sparowtype:progression:v1:guest') !== null }));
  await test.info().attach('controlled-pending-state', { contentType: 'application/json', body: JSON.stringify(pending) });
  expect(pending.marker).toBe(true); expect(pending.complete).toBe(false);
  try {
    await action('hard-navigation-before-completion', () => page.goto('/lessons', { waitUntil: 'commit' }));
  } finally { unblock(); }
  await expect(page.getByRole('heading', { name: /Find your rhythm/ })).toBeVisible();
  const after = await page.evaluate(() => ({ resetMarker: localStorage.getItem('sparowtype.workspace-reset.v1:guest') !== null, progressionPresent: localStorage.getItem('sparowtype:progression:v1:guest') !== null }));
  await test.info().attach('after-hard-navigation', { contentType: 'application/json', body: JSON.stringify(after) });
});
