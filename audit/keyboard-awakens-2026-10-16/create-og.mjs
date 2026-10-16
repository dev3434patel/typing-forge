import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4173/about', { waitUntil: 'domcontentloaded' });
  const png = await page.evaluate(async () => {
    await document.fonts.load('700 110px Sora');
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#07070A'; ctx.fillRect(0, 0, 1200, 630); ctx.font = '700 110px Sora';
    const text = [...'SparowType'];
    const width = text.reduce((sum, char) => sum + ctx.measureText(char).width - 4.4, 0);
    let x = (1200 - width) / 2;
    text.forEach((char, index) => { ctx.fillStyle = index < 6 ? '#EDEDF2' : '#C6FF3D'; ctx.fillText(char, x, 350); x += ctx.measureText(char).width - 4.4; });
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await writeFile('public/og-sparowtype.png', Buffer.from(png, 'base64'));
  for (const size of [64, 192, 512]) {
    const icon = await page.evaluate(size => {
      const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#07070A'; ctx.fillRect(0, 0, size, size);
      ctx.font = `700 ${Math.round(size * .72)}px Sora`; ctx.fillStyle = '#EDEDF2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('S', size / 2, size * .52);
      return canvas.toDataURL('image/png').split(',')[1];
    }, size);
    const bytes = Buffer.from(icon, 'base64');
    if (size !== 64) await writeFile(`public/icon-${size}.png`, bytes);
    else { const header = Buffer.alloc(22); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4); header[6] = 64; header[7] = 64; header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(bytes.length, 14); header.writeUInt32LE(22, 18); await writeFile('public/favicon.ico', Buffer.concat([header, bytes])); }
  }
} finally { await browser.close(); }
