// Bounded diagnostic only. Original tests, screenshots and application files are unchanged.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { webkit, devices } from '@playwright/test';
import { startFrontendStaticServer } from '../../e2e/frontend-static-server.ts';
import { verifyFrozenSource } from '../2026-11-05-followup/artifact-verification.mjs';

const directory = 'audit/2026-11-09/webkit-capture-diagnostic';
await mkdir(directory);
const before = await verifyFrozenSource('audit/2026-11-05-followup/final36-source.json');
assert.equal(before.receipt.compared, 506); assert.deepEqual(before.receipt.mismatches, []);
assert.equal(before.frozen.local.version, 'd89f84d74519bf2bbae0');
const server = await startFrontendStaticServer('dist-static-final36-vercel');
const report = { status: 'RUNNING-DIAGNOSTIC', startedAt: new Date().toISOString(), sourceBefore: before.receipt, staticBuild: JSON.parse(await readFile('dist-static-final36-vercel/offline-build.json', 'utf8')), settings: devices['Desktop Safari'], reducedMotion: 'reduce', openingAnimationEnabled: false, deadlineMs: 60000, observations: [], originalFilesEdited: false };
let browser = null, context = null, timedOut = false;
const timer = setTimeout(() => { timedOut = true; void browser?.close().catch(() => {}); }, report.deadlineMs);
const measure = page => page.evaluate(() => {
  const rect = selector => { const node = document.querySelector(selector); if (!node) return null; const r = node.getBoundingClientRect(); return { selector, left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, overflowX: getComputedStyle(node).overflowX }; };
  const viewport = visualViewport;
  return { innerWidth, innerHeight, outerWidth, outerHeight, dpr: devicePixelRatio, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth, bodyClientWidth: document.body.clientWidth, bodyScrollWidth: document.body.scrollWidth, visualViewport: viewport ? { width: viewport.width, height: viewport.height, scale: viewport.scale, offsetLeft: viewport.offsetLeft, offsetTop: viewport.offsetTop, pageLeft: viewport.pageLeft, pageTop: viewport.pageTop } : null, screen: { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight }, phase: document.querySelector('[data-testid="signal-run"]')?.getAttribute('data-phase'), activeElement: { tag: document.activeElement?.tagName, ariaLabel: document.activeElement?.getAttribute('aria-label') }, bounds: ['html', 'body', 'header', 'main', '[data-testid="signal-run"]', '[data-testid="game-target"]', 'input[aria-label="Your word"]'].map(rect).filter(Boolean) };
});
async function capture(page, width, state) {
  const row = { width, state, before: await measure(page), screenshots: [] };
  for (const scale of ['device', 'css']) {
    const file = `${directory}/webkit-${width}-${state}-${scale}.png`;
    const bytes = await page.screenshot({ path: file, fullPage: true, ...(scale === 'css' ? { scale: 'css' } : {}) });
    row.screenshots.push({ file, scale, pngWidth: bytes.readUInt32BE(16), pngHeight: bytes.readUInt32BE(20), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), domAfter: await measure(page) });
  }
  report.observations.push(row);
}
try {
  browser = await webkit.launch({ headless: true });
  report.browserVersion = browser.version();
  for (const width of [390, 1440]) {
    context = await browser.newContext({ ...devices['Desktop Safari'] });
    const page = await context.newPage(); page.setDefaultTimeout(7000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
    await page.goto(new URL('games', server.baseURL).href);
    await page.locator('[data-testid="signal-run"][data-phase="ready"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await capture(page, width, 'ready');
    if (width === 390) {
      await page.getByRole('button', { name: 'Start calm journey', exact: true }).click();
      const input = page.getByRole('textbox', { name: 'Your word', exact: true });
      await input.waitFor();
      await input.evaluate(node => node.blur());
      await capture(page, width, 'playing-blurred');
      await input.focus();
      await capture(page, width, 'playing-focused');
      const word = (await page.getByTestId('game-target').getAttribute('aria-label')).replace('Target word: ', '');
      await input.pressSequentially(word); await input.press('Enter');
      await capture(page, width, 'playing-after-enter');
    }
    await context.close(); context = null;
  }
  report.status = 'DIAGNOSTIC-RECORDED';
} catch (error) { report.status = 'FAILED-DIAGNOSTIC'; report.failure = { name: error.name, message: String(error.message).slice(0, 400) }; }
finally {
  clearTimeout(timer);
  if (context) await context.close().catch(() => {});
  if (browser) { await browser.close(); report.browserClosed = true; }
  await server.stop(); report.serverClosed = true;
  report.sourceAfter = (await verifyFrozenSource('audit/2026-11-05-followup/final36-source.json')).receipt;
  report.sourceUnchanged = report.sourceAfter.compared === 506 && report.sourceAfter.mismatches.length === 0;
  report.timedOut = timedOut; report.finishedAt = new Date().toISOString();
  await writeFile(`${directory}/result.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ status: report.status, sourceUnchanged: report.sourceUnchanged, browserClosed: report.browserClosed, serverClosed: report.serverClosed, observations: report.observations.map(row => ({ width: row.width, state: row.state, innerWidth: row.before.innerWidth, clientWidth: row.before.documentClientWidth, scrollWidth: row.before.documentScrollWidth, dpr: row.before.dpr, visualViewport: row.before.visualViewport, main: row.before.bounds.find(bound => bound.selector === 'main'), png: row.screenshots.map(shot => ({ scale: shot.scale, width: shot.pngWidth, height: shot.pngHeight })) })) }));
process.exitCode = report.status === 'DIAGNOSTIC-RECORDED' && report.sourceUnchanged && !report.timedOut ? 0 : 1;
