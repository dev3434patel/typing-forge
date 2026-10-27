import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

assert.equal(process.env.SPAROWTYPE_PLACEMENT_ACCEPTANCE, '1');
const root = path.resolve(import.meta.dirname, '../..');
const receipt = path.join(root, 'audit/2026-10-21/final7-placement-label-dom-probe.json');
const source = JSON.parse(await readFile(path.join(root, 'audit/2026-10-21/final7-source.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const integrity = async () => {
  const mismatches = [];
  for (const [file, expected] of Object.entries(source.sourceHashes)) {
    const bytes = await readFile(path.join(root, file));
    const normalized = /\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes;
    if (hash(normalized) !== expected) mismatches.push(file);
  }
  return { compared: Object.keys(source.sourceHashes).length, mismatches };
};
const report = { status: 'RUNNING', declaredAt: new Date().toISOString(), expectedBuild: 'f3ac03affbc33168655a', scope: 'One fresh guest Chromium DOM locator probe only; no placement results, seeded sessions, clocks, live API or product edits.', retries: 0, apiRequests: [], pageErrors: [] };
let browser, context, timer;
const started = performance.now();
try {
  report.before = await integrity();
  assert.deepEqual(report.before.mismatches, []);
  const build = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json());
  assert.equal(build.version, report.expectedBuild);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') { report.apiRequests.push({ path: url.pathname, allowed: false }); await route.abort(); return; }
    if (!/^\/api(?:\/|$)/.test(url.pathname)) { await route.continue(); return; }
    const allowed = request.method() === 'GET' && url.pathname === '/api/auth/session' && !url.search;
    report.apiRequests.push({ path: url.pathname, allowed });
    if (allowed) await route.fulfill({ status: 200, json: { user: null, csrfToken: 'placement-probe-guest-fixture' }, headers: { 'Cache-Control': 'no-store' } });
    else await route.abort();
  });
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => report.pageErrors.push({ name: error.name }));
  await Promise.race([(async () => {
    await page.goto('http://127.0.0.1:4173/lessons');
    const studio = page.getByRole('region', { name: 'Placement and practice studio', exact: true });
    await expect(studio.getByRole('button', { name: 'Try optional placement', exact: true })).toBeVisible();
    const combo = studio.getByRole('combobox', { name: 'Practice type', exact: true });
    report.locators = {
      exactLabelCount: await studio.getByLabel('Practice type', { exact: true }).count(),
      prefixLabelCount: await studio.getByLabel(/^Practice type/).count(),
      exactRoleCount: await combo.count(),
      wrappedLabelText: await combo.evaluate(element => [...element.labels].map(label => label.textContent.replace(/\s+/g, ' ').trim())),
    };
    assert.equal(report.locators.exactLabelCount, 0);
    assert.equal(report.locators.prefixLabelCount, 1);
    assert.equal(report.locators.exactRoleCount, 1);
    await combo.selectOption('home-row');
    await expect(combo).toHaveValue('home-row');
    await expect(studio.getByRole('button', { name: 'Start free practice', exact: true })).toBeEnabled();
    report.roleSelectorSelectsHomeRow = true;
    assert.ok(report.apiRequests.every(request => request.allowed));
    assert.deepEqual(report.pageErrors, []);
  })(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Bounded DOM probe timed out.')), 30000); })]);
  report.status = 'PASS-SCOPED';
} catch (error) {
  report.status = 'FAILED';
  report.failure = { name: error.name, detail: 'DOM probe assertion or operation failed; no passage, credentials or request body retained.' };
} finally {
  clearTimeout(timer);
  await context?.close();
  await browser?.close();
  report.ownedBrowserClosed = !browser || !browser.isConnected();
  report.after = await integrity();
  if (report.after.mismatches.length || !report.ownedBrowserClosed) report.status = 'FAILED';
  report.finishedAt = new Date().toISOString();
  report.durationMs = performance.now() - started;
  await writeFile(receipt, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ status: report.status, locators: report.locators, report: path.relative(root, receipt).replaceAll('\\', '/') }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
