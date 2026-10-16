import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/performance-polish-2026-10-16';
const before = await readFile(`${directory}/favicon-before.svg`, 'utf8');
const after = await readFile('public/sparowtype.svg', 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 520 } });
  const result = await page.evaluate(async ({ before, after }) => {
    async function pixels(svg, size) {
      const picture = new Image();
      picture.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await picture.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d');
      context.drawImage(picture, 0, 0, size, size);
      return context.getImageData(0, 0, size, size).data;
    }
    const cases = [];
    for (const size of [16, 32, 64, 448]) {
      const old = await pixels(before, size), current = await pixels(after, size);
      let changedPixels = 0, maxChannelDifference = 0;
      for (let index = 0; index < old.length; index += 4) {
        let changed = false;
        for (let channel = 0; channel < 4; channel++) {
          const difference = Math.abs(old[index + channel] - current[index + channel]);
          maxChannelDifference = Math.max(maxChannelDifference, difference);
          changed ||= difference > 0;
        }
        if (changed) changedPixels++;
      }
      cases.push({ size, changedPixels, totalPixels: size * size, maxChannelDifference });
    }
    document.body.style.cssText = 'margin:0;padding:24px;background:#151520;color:#ededf2;font:16px sans-serif;display:flex;gap:20px';
    for (const [title, svg] of [['Original font', before], ['Single-letter font', after]]) {
      const panel = document.createElement('section');
      const label = document.createElement('p');
      label.textContent = title;
      const image = new Image(400, 400);
      image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
      await image.decode();
      panel.append(label, image);
      document.body.append(panel);
    }
    return cases;
  }, { before, after });
  await page.screenshot({ path: `${directory}/favicon-comparison.png` });
  await writeFile(`${directory}/favicon-render-comparison.json`, JSON.stringify({ browser: await browser.version(), cases: result }, null, 2));
  if (result.some(test => test.changedPixels)) throw new Error('The subset favicon differs from the original rendering.');
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
