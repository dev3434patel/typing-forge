import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { THEMES } from '../src/lib/themes';
import axe from 'axe-core';
import { settlePageVisuals, focusTyping } from './helpers';

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false')); });
test('studio themes, local JSON and Hindi navigation survive reload without network fonts', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', request => { const url = new URL(request.url()); if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') foreign.push(url.origin); });
  await page.goto('/studio');
  await page.getByRole('button', { name: 'Skyline', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'skyline');
  await page.getByLabel('Local theme JSON', { exact: true }).fill(JSON.stringify(THEMES[0]));
  await page.getByRole('button', { name: 'Validate and apply theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'local-custom');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'local-custom');
  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('hi');
  await expect(page.getByRole('heading', { name: 'अभ्यास स्टूडियो', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await page.getByRole('combobox', { name: 'इंटरफ़ेस की भाषा', exact: true }).selectOption('en');
  await page.getByRole('button', { name: 'Reset local studio choices', exact: true }).click();
  expect(foreign).toEqual([]);
});
test('font validation rejects foreign files, accepts local WOFF2 and restores defaults', async ({ page }) => {
  await page.goto('/studio');
  const upload = page.locator('input[type="file"][aria-label="Local passage font"]');
  await upload.setInputFiles({ name: 'bad.woff2', mimeType: 'font/woff2', buffer: Buffer.from('not a font') });
  await expect(page.locator('main').getByRole('status')).toContainText('WOFF2');
  const font = await readFile('public/fonts/jetbrains-mono-latin-wght-normal.woff2');
  await upload.setInputFiles({ name: 'local.woff2', mimeType: 'font/woff2', buffer: font });
  await expect(page.getByRole('button', { name: 'Use default passage font', exact: true })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--practice-font'))).toBe('SparowLocalPractice');
  await page.getByRole('button', { name: 'Use default passage font', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--practice-font'))).toBe('');
});
test('classic preset keeps its content pool and input after rotation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Classic60s curated200 preset', exact: true }).click();
  const input = await focusTyping(page);
  const prefix = (await page.getByTestId('typing-target').textContent())!.slice(0, 12);
  await input.pressSequentially(prefix, { delay: 20 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(input).toHaveValue(prefix);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
for (const width of [390, 1440]) test(`studio accessibility at${width}px including RTL pseudo-locale`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/studio');
  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('ar-XB');
  await settlePageVisuals(page);
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: string, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
    return (await axe.run('#main-content', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations;
  });
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
