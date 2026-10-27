import assert from 'node:assert/strict';
import { webkit, devices, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_WEBKIT_LAYOUT_ACCEPTANCE, '1', 'Only execute during the explicitly coordinated browser window.');
const root = path.resolve(import.meta.dirname, '../..');
process.chdir(root);
const prefix = process.argv[2] || 'final7-webkit-games-layout';
assert.match(prefix, /^final7-webkit-games-layout(?:-[a-z0-9]+)*$/);
assert.ok(process.argv.length <= 3);
const audit = 'audit/2026-10-21';
const output = `${audit}/${prefix}.json`;
const declaration = `${audit}/${prefix}-protocol.json`;
const screenshots = `${audit}/${prefix}-screenshots`;
const sourceFile = `${audit}/final7-source.json`;
const expectedBuild = 'f3ac03affbc33168655a';
const initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.frozen.local.version, expectedBuild);
assert.deepEqual(initial.receipt.mismatches, []);
await mkdir(screenshots);
const driverHash = hash(await readFile(import.meta.filename));
const { defaultBrowserType: _browserType, ...device } = devices['Desktop Safari'];
const protocol = {
  declaredAt: new Date().toISOString(), expectedBuild, sourceFile,
  sourceFiles: initial.receipt.compared, driverHash, browser: 'webkit', device,
  directories: ['dist-static-final7-vercel', 'dist-static-final7-pages'], widths: [390, 1440], height: 1000,
  contexts: 4, workers: 1, retries: 0, automaticRetries: 0, resultFiltering: false,
  maximumJourneyMs: 90000, intro: false, reducedMotion: 'reduce (matches original screenshot fixture)',
  scale: 'No CSS zoom, transform, viewport scaling, DPR override or layout mutation. Compare screenshot scale=device/css and full-page/viewport capture only.',
  states: ['ready', 'playing after one native word and Enter'],
  scope: 'Separate real document overflow/critical element bounds from WebKit screenshot dimension anomalies. DOM receipts, screenshots and original errors retained; no physical Safari, mobile device, performance or all-feature claim.',
};
await writeFile(declaration, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
await writeFile(output, JSON.stringify({ status: 'RUNNING', protocol: declaration }, null, 2) + '\n', { flag: 'wx' });
const report = { status: 'RUNNING', declaredAt: protocol.declaredAt, protocol: declaration, cases: [], sourceIntegrity: initial.receipt };
let browser, temporary, watchdog, timeoutReject;
const started = performance.now();
const timeout = new Promise((_, reject) => { timeoutReject = reject; });
const persist = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const readDimensions = async page => page.evaluate(() => {
  const rectangle = node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
  };
  const root = document.documentElement, body = document.body;
  const candidates = [...body.querySelectorAll('*')].flatMap(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 1 || rect.height < 1 || (rect.right <= root.clientWidth + 0.02 && rect.left >= -0.02)) return [];
    return [{ tag: node.tagName, id: node.id, classes: String(node.getAttribute('class') || '').slice(0, 160), role: node.getAttribute('role'), rect: rectangle(node), overflowX: style.overflowX, position: style.position }];
  });
  const criticalSelectors = ['header', '.forge-shell', 'main', '.signal-game', '[data-testid="signal-run"]', '.signal-game aside', '#signal-word'];
  return {
    innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio,
    screen: { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight },
    visualViewport: visualViewport && { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop },
    document: { clientWidth: root.clientWidth, clientHeight: root.clientHeight, scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight, rect: rectangle(root), zoom: getComputedStyle(root).zoom, transform: getComputedStyle(root).transform },
    body: { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth, scrollHeight: body.scrollHeight, rect: rectangle(body), zoom: getComputedStyle(body).zoom, transform: getComputedStyle(body).transform },
    critical: criticalSelectors.map(selector => {
      const node = document.querySelector(selector);
      return node ? { selector, rect: rectangle(node), display: getComputedStyle(node).display } : { selector, absent: true };
    }),
    geometricCandidates: candidates.slice(0, 80), geometricCandidateCount: candidates.length,
    documentOverflow: root.scrollWidth > innerWidth + 1 || body.scrollWidth > innerWidth + 1,
  };
});
try {
  const require = createRequire(import.meta.url);
  const { build } = createRequire(require.resolve('vite'))('esbuild');
  temporary = await mkdtemp(path.join(tmpdir(), 'sparow-layout-probe-'));
  const helper = path.join(temporary, 'static-server.mjs');
  await build({ entryPoints: ['e2e/frontend-static-server.ts'], outfile: helper, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  const { startFrontendStaticServer } = await import(pathToFileURL(helper).href);
  watchdog = setTimeout(() => {
    report.watchdogExpired = true;
    timeoutReject(new Error('The declared 90-second layout probe limit was reached.'));
    void browser?.close();
  }, 90000);
  const perform = async () => {
    browser = await webkit.launch({ headless: true });
    report.browserVersion = browser.version();
    for (const directory of protocol.directories) for (const width of protocol.widths) {
      const result = { directory, requestedWidth: width, requestedHeight: protocol.height, states: [], pageErrors: [] };
      report.cases.push(result);
      let context, server;
      try {
        server = await startFrontendStaticServer(directory);
        result.deployment = server.deployment;
        context = await browser.newContext(device);
        const page = await context.newPage();
        page.setDefaultTimeout(5000); page.setDefaultNavigationTimeout(10000);
        page.on('pageerror', error => result.pageErrors.push({ name: error.name, message: error.message }));
        await page.setViewportSize({ width, height: protocol.height });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
        await page.goto(new URL('games', server.baseURL).href);
        await expect(page.getByTestId('signal-run')).toHaveAttribute('data-phase', 'ready');
        const capture = async state => {
          await page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
          const before = await readDimensions(page);
          const reading = { state, viewport: page.viewportSize(), before, images: [] };
          result.states.push(reading);
          for (const mode of [
            { label: 'full-device', fullPage: true, scale: 'device' },
            { label: 'full-css', fullPage: true, scale: 'css' },
            { label: 'viewport-css', fullPage: false, scale: 'css' },
          ]) {
            const file = `${screenshots}/${server.deployment.target}-${width}-${state}-${mode.label}.png`;
            await page.screenshot({ path: file, fullPage: mode.fullPage, scale: mode.scale, timeout: 10000 });
            const bytes = await readFile(file);
            reading.images.push({ file, ...mode, pngWidth: bytes.readUInt32BE(16), pngHeight: bytes.readUInt32BE(20), sha256: hash(bytes) });
          }
          reading.after = await readDimensions(page);
          reading.captureChangedViewport = reading.after.innerWidth !== before.innerWidth || reading.after.document.clientWidth !== before.document.clientWidth;
          await persist();
        };
        await capture('ready');
        await page.getByRole('button', { name: 'Start calm journey', exact: true }).click();
        const input = page.getByRole('textbox', { name: 'Your word', exact: true });
        const word = (await page.getByTestId('game-target').getAttribute('aria-label')).replace('Target word: ', '');
        await input.pressSequentially(word);
        await input.press('Enter');
        await expect(page.getByTestId('game-gates')).toContainText('1 / 18');
        await capture('playing');
        result.status = result.states.every(state => !state.before.documentOverflow && !state.after.documentOverflow) ? 'PASS-DOCUMENT-OVERFLOW-SCOPE' : 'FAILED-DOCUMENT-OVERFLOW';
      } catch (error) { result.status = 'FAILED'; result.error = { name: error.name, message: error.message }; }
      finally {
        // Close the page/context before its owned origin, keeping shutdown errors
        // out of the captured app-stage measurements. Never touch another app.
        await context?.close(); await server?.stop();
      }
      await persist();
    }
  };
  await Promise.race([perform(), timeout]);
  report.status = report.cases.length === 4 && report.cases.every(result => result.status === 'PASS-DOCUMENT-OVERFLOW-SCOPE') ? 'PASS-DOCUMENT-OVERFLOW-SCOPE' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.error = { name: error.name, message: error.message }; }
finally {
  clearTimeout(watchdog);
  await browser?.close().catch(() => undefined);
  if (temporary) {
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()));
    assert.match(path.basename(temporary), /^sparow-layout-probe-/);
    await rm(temporary, { recursive: true, force: true });
  }
  const after = await verifyFrozenSource(sourceFile);
  report.finalSourceIntegrity = after.receipt;
  report.driverUnchanged = hash(await readFile(import.meta.filename)) === driverHash;
  if (after.receipt.mismatches.length || !report.driverUnchanged) report.status = 'FAILED';
  report.finishedAt = new Date().toISOString(); report.durationMs = performance.now() - started;
  await persist();
}
console.log(JSON.stringify({ status: report.status, cases: report.cases.length, report: output, screenshotDirectory: screenshots }));
if (report.status !== 'PASS-DOCUMENT-OVERFLOW-SCOPE') process.exitCode = 1;
