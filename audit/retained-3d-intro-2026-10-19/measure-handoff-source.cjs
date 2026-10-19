const { chromium, expect } = require('../../node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('caret-handoff')) requests.push(request.url());
  });
  try {
    await page.addInitScript(() => {
      window.handoffSourceMeasurements = [];
      window.nativePaintObserved = false;
      const observer = new PerformanceObserver((list) => {
        if (list.getEntries().some((entry) => entry.name === 'first-contentful-paint')) {
          window.nativePaintObserved = true;
          observer.disconnect();
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      Reflect.deleteProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen');
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (...args) {
        const rect = Reflect.apply(original, this, args);
        if (this.classList.contains('awakening-type-caret')) {
          window.handoffSourceMeasurements.push({
            at: performance.now(), width: rect.width, height: rect.height,
            text: this.parentElement.textContent,
            flexShrink: getComputedStyle(this).flexShrink,
            cssWidth: getComputedStyle(this).width,
            parentWidth: Reflect.apply(original, this.parentElement, []).width,
            siblings: Array.from(this.parentElement.children).map((element) => ({
              tag: element.tagName, text: element.textContent,
              width: Reflect.apply(original, element, []).width,
              flexShrink: getComputedStyle(element).flexShrink,
            })),
          });
        }
        return rect;
      };
    });
    await page.clock.install();
    await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 25));
    await page.goto('http://127.0.0.1:4175/', { waitUntil: 'domcontentloaded' });
    const opening = page.getByTestId('opening-experience');
    await expect(opening).toHaveAttribute('data-mode', 'full');
    await page.clock.runFor(80);
    await expect.poll(() => page.evaluate(() => window.nativePaintObserved)).toBe(true);
    await page.clock.runFor(420);
    await expect.poll(async () => {
      await page.clock.runFor(16);
      return opening.getAttribute('data-presentation');
    }, { timeout: 20_000, intervals: [100, 250, 500] }).toBe('playing');
    await page.clock.fastForward(4500);
    await page.clock.runFor(200);
    const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
    await expect(input).toBeVisible();
    await page.clock.runFor(80);
    const measurements = await page.evaluate(() => window.handoffSourceMeasurements);
    const result = {
      build: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../dist/offline-build.json'), 'utf8')),
      browser: browser.version(), requests, measurements,
      method: 'Read-only getBoundingClientRect wrapper; same document-renderer clock progression and native FCP observation as opening-experience helper. No app, CSS, geometry or clock deadlines modified.',
    };
    fs.writeFileSync(path.join(__dirname, 'handoff-source-diagnostic.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
