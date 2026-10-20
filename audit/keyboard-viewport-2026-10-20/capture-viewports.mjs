import { chromium, webkit, devices } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const directory = 'audit/keyboard-viewport-2026-10-20';
const frozen = JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local;
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(r => r.json()), frozen);
const browser = await chromium.launch({ channel: 'chrome' });
const receipts = [];
try {
  for (const item of [
    { name: 'chrome-1810x900', width: 1810, height: 900, path: '/' },
    { name: 'chrome-1366x768', width: 1366, height: 768, path: '/' },
    { name: 'chrome-1280x720-error', width: 1280, height: 720, path: '/', wrong: true },
    { name: 'chrome-course-1440x900', width: 1440, height: 900, path: '/lessons', course: true },
    { name: 'chrome-phone-keyboard-390x844', width: 390, height: 844, path: '/', scroll: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: item.width, height: item.height } });
    await context.addInitScript(() => {
      localStorage.setItem('sparowtype.opening-animation.enabled', 'false');
      const registration = Object.assign(new EventTarget(), { installing: null, waiting: { state: 'installed', postMessage() {} } });
      Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: Object.assign(new EventTarget(), { controller: {}, register: async () => registration }) });
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4173${item.path}`);
    if (item.course) {
      // Resolve the real first catalog ID rather than relying on a guessed slug.
      const catalog = JSON.parse(await readFile('backend/resources/typing-course-v1.json', 'utf8'));
      await page.goto(`http://127.0.0.1:4173/lessons?lesson=${catalog.lessons[0].id}`);
      await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
    }
    await page.getByTestId('live-keyboard-board').waitFor();
    await page.getByRole('complementary', { name: 'App availability', exact: true }).waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
    });
    if (item.wrong) {
      const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
      await input.focus();
      const expected = await page.locator('[data-current="true"][data-expected]').first().getAttribute('data-expected');
      await input.pressSequentially(expected === 'x' ? 'q' : 'x');
      await page.getByTestId('keyboard-last-input').waitFor();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (item.scroll) await page.getByTestId('live-keyboard').scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const r = document.querySelector('[data-testid="live-keyboard"]').getBoundingClientRect();
      return { width: innerWidth, height: innerHeight, scrollY, keyboard: { top: r.top, bottom: r.bottom }, scale: visualViewport?.scale, dpr: devicePixelRatio };
    });
    assert.equal(geometry.width, item.width);
    assert.equal(geometry.height, item.height);
    assert.equal(geometry.scale, 1);
    assert.ok(geometry.keyboard.top >= 0 && geometry.keyboard.bottom <= item.height);
    await page.screenshot({ path: `${directory}/${item.name}.png`, fullPage: false, animations: 'disabled' });
    receipts.push({ ...item, build: frozen, browser: 'installed Google Chrome', version: await browser.version(), geometry });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${directory}/screenshots.json`, JSON.stringify(receipts, null, 2));
const safari = await webkit.launch();
try {
  const context = await safari.newContext({ ...devices['Desktop Safari'], viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  const read = () => page.evaluate(() => ({ innerWidth, innerHeight, devicePixelRatio, visualViewportScale: visualViewport?.scale, url: location.href }));
  const before = await read();
  const corrected = { width: Math.round(1366 * 1366 / before.innerWidth), height: Math.round(768 * 768 / before.innerHeight) };
  await page.setViewportSize(corrected);
  const after = await read();
  assert.ok(Math.abs(after.innerWidth - 1366) <= 1 && Math.abs(after.innerHeight - 768) <= 1);
  await writeFile(`${directory}/webkit-host-viewport.json`, JSON.stringify({ requested: { width: 1366, height: 768 }, before, correctedProtocolViewport: corrected, after, explanation: 'Blank-page Windows WebKit host display-scale discrepancy. No product loaded. Calibration changes driver window size only, then all layout assertions use measured CSS viewport bounds.' }, null, 2));
} finally { await safari.close(); }
console.log(JSON.stringify(receipts, null, 2));
