import { webkit, devices } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await webkit.launch();
const reports = [];
for (let index = 0; index < 3; index++) {
  const context = await browser.newContext({ ...devices['Desktop Safari'], reducedMotion: 'reduce' });
  const page = await context.newPage();
  const network = new Map();
  const errors = [];
  page.on('request', request => {
    if (request.url().startsWith('http://127.0.0.1:4173/')) network.set(request.url(), { path: new URL(request.url()).pathname, status: 'pending' });
  });
  page.on('response', response => {
    const item = network.get(response.url());
    if (item) item.status = response.status();
  });
  page.on('requestfinished', request => { const item = network.get(request.url()); if (item) item.finished = true; });
  page.on('requestfailed', request => { const item = network.get(request.url()); if (item) item.failure = request.failure()?.errorText; });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  let ready = true;
  try { await page.getByRole('textbox', { name: 'Typing input', exact: true }).waitFor({ timeout: 5000 }); }
  catch { ready = false; }
  reports.push({ index, ready, errors, network: [...network.values()], page: await page.evaluate(() => ({ title: document.title, text: document.body.innerText, readyState: document.readyState, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, fonts: document.fonts.status })) });
  await context.close();
}
await writeFile('audit/sparowtype-2026-10-16/webkit-network-diagnostic.json', JSON.stringify(reports, null, 2));
await browser.close();
