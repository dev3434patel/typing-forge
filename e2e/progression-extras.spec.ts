import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import { settlePageVisuals } from './helpers';
test.use({ serviceWorkers: 'block', timezoneId: 'UTC' });
test.beforeEach(async ({ context }) => {
  await context.route('**/api/**', route => route.fulfill({ json: { user: null, csrfToken: 'collection-ui-fixture' } }));
  await context.addInitScript(() => {
    localStorage.setItem('sparowtype.opening-animation.enabled', 'false');
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
    if (localStorage.getItem('sparowtype:progression:v1:guest')) return;
    const at = Date.now() - 100000;
    const receipts = Array.from({ length: 25 }, (_, index) => ({ version: 1, id: `collection-ui-${index}`, ownerId: 'guest', verification: 'local', payloadHash: `fixture:${index}`, at: at + index * 1000, timeZone: 'UTC', kind: 'lesson', completedChars: 300, attempts: 300, correctAttempts: 300, lessonQualified: true, raceWin: false, personalBest30: false, skills: [] }));
    localStorage.setItem('sparowtype:progression:v1:guest', JSON.stringify({ version: 1, ownerId: 'guest', receipts, commands: [], pending: [] }));
  });
});
test('earned theme and frame apply, persist on the real profile and return to default appearance', async ({ page }) => {
  await page.goto('/progression');
  const palette = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Aurora palette', exact: true }) });
  await palette.getByRole('button', { name: 'Unlock', exact: true }).click();
  await palette.getByRole('button', { name: 'Equip', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  const frame = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Orbit profile frame', exact: true }) });
  await frame.getByRole('button', { name: 'Unlock', exact: true }).click();
  await frame.getByRole('button', { name: 'Equip', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Equipped', exact: true })).toBeDisabled();
  await expect.poll(() => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('sparowtype:progression:v1:guest') ?? 'null') as { commands?: Array<{ kind: string; value?: string | boolean }> } | null;
    return stored?.commands?.filter(command => command.kind === 'equip').at(-1)?.value ?? null;
  })).toBe('frame-orbit');
  await page.goto('/profile');
  await expect(page.getByRole('region', { name: 'Your practice identity', exact: true })).toContainText('Orbit profile frame');
  await page.goto('/progression');
  await page.getByRole('button', { name: 'Use default appearance', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sparow-dark');
  await page.goto('/profile');
  await expect(page.getByRole('region', { name: 'Your practice identity', exact: true })).toContainText('A clear space for your next practice.');
});
test('progress image is a real1200×630 PNG and reminders require an explicit persisted choice', async ({ page }) => {
  await page.goto('/progression');
  const reminder = page.getByRole('checkbox', { name: 'Enable reminders', exact: true });
  await expect(reminder).not.toBeChecked();
  await reminder.check(); await page.getByRole('button', { name: 'Save reminder choice', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sparowtype.reminders.v1:guest')!).enabled)).toBe(true);
  await reminder.uncheck(); await page.getByRole('button', { name: 'Save reminder choice', exact: true }).click();
  await page.reload(); await expect(reminder).not.toBeChecked();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Share progress image', exact: true }).click();
  const download = await pending, bytes = await readFile((await download.path())!);
  expect(download.suggestedFilename()).toBe('sparowtype-progress.png');
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
});
for (const width of [390, 1440]) test(`collection and personal appearance have automated accessible surfaces at${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ['/progression', '/profile']) {
    await page.goto(route); await expect(page.locator('main#main-content')).toBeVisible(); await settlePageVisuals(page); await page.evaluate(axe.source);
    const violations = await page.evaluate(async () => (await (window as typeof window & { axe: typeof axe }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
    expect(violations).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
