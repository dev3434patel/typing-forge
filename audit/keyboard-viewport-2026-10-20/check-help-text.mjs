import { chromium, firefox, webkit } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const directory = 'audit/keyboard-viewport-2026-10-20';
const build = JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local;
const results = [];
for (const [name, type, options] of [['chromium', chromium, {}], ['edge', chromium, { channel: 'msedge' }], ['firefox', firefox, {}], ['webkit', webkit, {}]]) {
  const browser = await type.launch(options);
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    await page.goto('http://127.0.0.1:4173/');
    await page.getByTestId('live-keyboard-board').waitFor();
    await page.locator('summary[aria-label="Typing shortcuts"]').click();
    await page.locator('.typing-shortcut-panel p').first().click();
    const openAfterTextClick = await page.locator('.typing-shortcut-help').evaluate(el => el.open);
    const activeAfterTextClick = await page.evaluate(() => document.activeElement.tagName);
    await page.keyboard.press('Escape');
    const closedOnEscape = await page.locator('.typing-shortcut-help').evaluate(el => !el.open);
    const summaryFocused = await page.locator('summary[aria-label="Typing shortcuts"]').evaluate(el => el === document.activeElement);
    results.push({ name, version: await browser.version(), openAfterTextClick, activeAfterTextClick, closedOnEscape, summaryFocused });
  } catch (error) { results.push({ name, error: String(error) }); }
  finally { await browser.close(); }
}
await writeFile(`${directory}/help-text-check.json`, JSON.stringify({ build, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some(r => r.error || !r.openAfterTextClick || !r.closedOnEscape || !r.summaryFocused)) process.exitCode = 1;
