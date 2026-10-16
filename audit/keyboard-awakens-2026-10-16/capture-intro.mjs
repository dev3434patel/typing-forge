import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); });
await page.clock.install();
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'domcontentloaded' });
await page.getByTestId('opening-experience').waitFor();
await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 40));
await page.clock.runFor(120);
try { await page.waitForFunction(() => document.querySelector('[data-testid="opening-experience"]')?.getAttribute('data-renderer') === 'webgl', undefined, { timeout: 15000 }); }
catch { errors.push('WebGL did not become ready within the bounded capture wait.'); }
let elapsed = 160;
for (const [time, name] of [[1850, 'assembled'], [3150, 'typing'], [3575, 'wordmark'], [3850, 'dissolve']]) {
  await page.clock.fastForward(time - elapsed);
  await page.clock.runFor(25);
  elapsed = time + 25;
  await page.screenshot({ path: `audit/keyboard-awakens-2026-10-16/intro-${name}.png` });
}
const diagnostics = await page.locator('.awakening-canvas').getAttribute('data-scene');
await writeFile('audit/keyboard-awakens-2026-10-16/scene-diagnostics.json', JSON.stringify({ diagnostics: diagnostics ? JSON.parse(diagnostics) : null, renderer: await page.getByTestId('opening-experience').getAttribute('data-renderer'), errors }, null, 2));
await page.clock.fastForward(600);
await page.clock.runFor(200);
await page.getByRole('textbox', { name: 'Typing input', exact: true }).waitFor();
await page.clock.resume();
await page.screenshot({ path: 'audit/keyboard-awakens-2026-10-16/practice-lime.png', fullPage: true, animations: 'disabled' });
await context.close();
await browser.close();
