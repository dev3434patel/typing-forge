// Deliberate diagnostic, not an acceptance test. No production source is changed.
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { webkit } from '@playwright/test';
import { verifyFrozenSource, filesWithin, hash } from './artifact-verification.mjs';

const output = 'audit/2026-10-21/final13-webkit-pwa-navigation-diagnostic.json';
const sourceFile = 'audit/2026-10-21/final13-source.json';
const started = performance.now();
const now = () => Math.round((performance.now() - started) * 1000) / 1000;
const report = {
  declaredAt: new Date().toISOString(), status: 'PARTIAL', kind: 'deliberate-diagnostic-not-acceptance',
  expectedBuild: 'b00993b05c14117dca60', automaticRetries: 0, pageErrorFiltering: false,
  scope: 'Owned loopback server, fresh guest WebKit contexts, tiny same-origin controls and unchanged frozen dist. API is an explicit unavailable 503 fixture; this is not native-backend or static-deployment acceptance.',
  protocol: { maxWallMs: 180000, nativeWrappers: 'ENTER ONLY. Reflect.apply original method and return its original result unchanged; no settlement handler attached.', heldNavigationBoundary: 'Server has received replacement-document request; response is withheld until old-document calls finish or the bounded cell fails.', outcomeHandling: 'Fixture operations catch their own results deliberately; all native pageerror and console-error events remain in ledger.', privateData: 'No accounts, credentials, cookies, headers, cache contents, raw trace or query parameters are saved.' },
  cells: [], events: [], requests: [], actions: [], cleanup: {},
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
const persist = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const checkpoint = async label => { await persist(); console.log(JSON.stringify({ diagnostic: label, elapsedMs: now(), cells: report.cells.length, pageErrors: report.events.filter(event => event.type === 'pageerror').length })); };
let browser, server, origin = '', activeCell = '', watchdog;
const gateMap = new Map();
const artifactRoot = path.resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const sanitize = value => String(value ?? '').replaceAll(origin || 'no-origin-to-replace', '<owned-origin>').replace(/https?:\/\/[^\s)'"<>]+/g, url => { try { return `<origin>${new URL(url).pathname}`; } catch { return '<url>'; } }).slice(0, 1800);
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function gate(key) { const result = { arrived: deferred(), released: deferred() }; gateMap.set(key, result); return result; }
async function bounded(promise, ms, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: ${ms}ms diagnostic bound exceeded`)), ms); })]); }
  finally { clearTimeout(timer); }
}
function instrumentation() {
  const id = Math.random().toString(36).slice(2, 10);
  const emit = (type, details = {}) => {
    try { console.debug('SPAROW_PWA_DIAG:' + JSON.stringify({ type, documentId: id, timeOrigin: performance.timeOrigin, at: performance.now(), path: location.pathname, readyState: document.readyState, visibility: document.visibilityState, ...details })); } catch { /* Diagnostic side channel only. */ }
  };
  Object.defineProperty(window, '__pwaDiagnosticDocument', { value: id });
  emit('document-created');
  for (const name of ['beforeunload', 'pagehide', 'pageshow', 'visibilitychange']) {
    window.addEventListener(name, event => emit('lifecycle', { event: name, persisted: 'persisted' in event ? event.persisted : null }));
  }
  window.addEventListener('error', event => emit('window-error', { name: event.error?.name ?? '', message: String(event.message ?? ''), line: event.lineno, column: event.colno }));
  window.addEventListener('unhandledrejection', event => emit('unhandledrejection', { name: event.reason?.name ?? '', message: String(event.reason?.message ?? event.reason ?? '') }));
  const wrap = (prototype, type, names) => {
    if (!prototype) return;
    for (const method of names) {
      const original = prototype[method];
      if (typeof original !== 'function') continue;
      prototype[method] = function (...args) {
        emit('native-entry', { api: `${type}.${method}`, caller: new Error().stack?.split('\n').slice(2, 6).join('\n') ?? '' });
        return Reflect.apply(original, this, args);
      };
    }
  };
  wrap(globalThis.ServiceWorkerContainer?.prototype, 'ServiceWorkerContainer', ['register', 'getRegistration', 'getRegistrations']);
  wrap(globalThis.ServiceWorkerRegistration?.prototype, 'ServiceWorkerRegistration', ['update', 'unregister']);
  wrap(globalThis.CacheStorage?.prototype, 'CacheStorage', ['keys', 'open', 'match', 'has', 'delete']);
  wrap(globalThis.Cache?.prototype, 'Cache', ['match', 'addAll']);
  localStorage.setItem('sparowtype.opening-animation.enabled', 'false');
}
async function newPage(label) {
  const context = await browser.newContext();
  await context.addInitScript(instrumentation);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('console', message => {
    if (message.type() === 'debug' && message.text().startsWith('SPAROW_PWA_DIAG:')) {
      try {
        const parsed = JSON.parse(message.text().slice('SPAROW_PWA_DIAG:'.length));
        if (parsed.caller) parsed.caller = sanitize(parsed.caller);
        if (parsed.message) parsed.message = sanitize(parsed.message);
        report.events.push({ receivedAtMs: now(), cell: activeCell || label, ...parsed });
      } catch { report.events.push({ receivedAtMs: now(), cell: activeCell || label, type: 'diagnostic-decode-error' }); }
    } else if (message.type() === 'error') report.events.push({ receivedAtMs: now(), cell: activeCell || label, type: 'console-error', message: sanitize(message.text()) });
  });
  page.on('pageerror', error => report.events.push({ receivedAtMs: now(), cell: activeCell || label, type: 'pageerror', name: error.name, message: sanitize(error.message), stack: sanitize(error.stack) }));
  return { context, page };
}
async function tinySetup(page, label) {
  await page.goto(`${origin}/__diag/${label}/old.html`, { waitUntil: 'load', timeout: 10000 });
  return page.evaluateHandle(async () => {
    const cache = await caches.open('sparowtype-diagnostic-synthetic');
    await cache.put('/__diag/public.txt', new Response('synthetic public diagnostic content'));
    return { documentId: window.__pwaDiagnosticDocument, cache };
  });
}
async function tinyCalls(handle, label, includeRegister) {
  return handle.evaluate(async (old, options) => {
    const rows = [];
    const call = async (api, operation) => {
      try { const result = await operation(); rows.push({ api, outcome: 'fulfilled', resultType: result === undefined ? 'undefined' : typeof result }); }
      catch (error) { rows.push({ api, outcome: 'rejected-caught-by-fixture', name: error.name, message: error.message }); }
    };
    await Promise.all([
      call('CacheStorage.keys', () => caches.keys()),
      call('CacheStorage.open', () => caches.open('sparowtype-diagnostic-synthetic')),
      call('Cache.match', () => old.cache.match('/__diag/public.txt')),
      ...(options.includeRegister ? [call('ServiceWorkerContainer.register', () => navigator.serviceWorker.register(`/__diag/${options.label}/worker.js`, { scope: `/__diag/${options.label}/` }))] : []),
    ]);
    return { expectedOldDocument: old.documentId, actualDocument: window.__pwaDiagnosticDocument, rows };
  }, { label, includeRegister });
}
async function runCell(label, operation) {
  activeCell = label;
  const cell = { label, startedAtMs: now(), status: 'PARTIAL' };
  report.cells.push(cell);
  const offset = report.events.length;
  try { Object.assign(cell, await operation()); cell.status = 'OBSERVED'; }
  catch (error) { cell.status = 'DIAGNOSTIC-BOUND-OR-ERROR'; cell.error = sanitize(error.message); }
  finally { cell.finishedAtMs = now(); cell.pageErrors = report.events.slice(offset).filter(event => event.type === 'pageerror').map(event => ({ atMs: event.receivedAtMs, name: event.name, message: event.message })); await checkpoint(label); }
  return cell;
}
async function artifactInventory() {
  return Object.fromEntries(await Promise.all((await filesWithin('dist')).map(async file => [file, hash(await readFile(path.join('dist', file)))])));
}
try {
  watchdog = setTimeout(() => {
    report.watchdogExpired = true;
    for (const value of gateMap.values()) value.released.resolve();
    void browser?.close();
    server?.closeAllConnections();
    server?.close();
  }, 180000);
  const before = await verifyFrozenSource(sourceFile);
  report.sourceBefore = before.receipt;
  assert.equal(before.frozen.local.version, report.expectedBuild);
  assert.deepEqual(before.receipt.mismatches, []);
  const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
  assert.equal(build.version, report.expectedBuild);
  const artifactsBefore = await artifactInventory();
  server = createServer(async (request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://owned.invalid').pathname); }
    catch { response.writeHead(400).end(); return; }
    const record = { atMs: now(), cell: activeCell, path: pathname, status: null };
    report.requests.push(record);
    response.on('finish', () => { record.status = response.statusCode; record.finishedAtMs = now(); });
    const requestGate = gateMap.get(pathname);
    if (requestGate) { requestGate.arrived.resolve(); await requestGate.released.promise; }
    if (response.destroyed) return;
    try {
      if (/^\/__diag\/.+\/worker\.js$/.test(pathname)) {
        response.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
        response.end("self.addEventListener('install',event=>event.waitUntil(self.skipWaiting())); self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));"); return;
      }
      if (/^\/__diag\/.+\/(?:old|replacement)\.html$/.test(pathname)) {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
        response.end('<!doctype html><html><head><title>Owned PWA diagnostic</title></head><body><main id="diag">Synthetic guest diagnostic</main></body></html>'); return;
      }
      if (/^\/api(?:\/|$)/.test(pathname)) {
        response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ error: { code: 'diagnostic-backend-unavailable', message: 'No backend is attached to this isolated diagnostic.' } })); return;
      }
      let file = path.resolve(artifactRoot, '.' + pathname);
      if (!file.startsWith(artifactRoot + path.sep) && file !== artifactRoot) { response.writeHead(403).end(); return; }
      let fileStat;
      try { fileStat = await stat(file); } catch { /* Resolve an app route below. */ }
      if (fileStat?.isDirectory()) file = path.join(file, 'index.html');
      else if (!fileStat && !path.extname(pathname)) file = path.join(artifactRoot, 'index.html');
      const bytes = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); response.end(bytes);
    } catch { response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('Owned diagnostic resource not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  report.fixture = { originAlias: '<owned-origin>', newRandomPort: true, originalServicesUntouched: true };
  browser = await webkit.launch({ headless: true, timeout: 30000 });
  report.browser = { engine: 'webkit', version: browser.version(), package: 'playwright 1.64.1 (installed)', configuredRevision: '2370' };

  const control = await runCell('tiny-no-navigation-control', async () => {
    const { context, page } = await newPage(activeCell);
    try { const handle = await tinySetup(page, 'control'); return { operations: await bounded(tinyCalls(handle, 'control', true), 10000, 'control native operations') }; }
    finally { await context.close(); }
  });
  const validControl = control.status === 'OBSERVED' && control.pageErrors.length === 0 && control.operations?.rows.length === 4 && control.operations.rows.every(row => row.outcome === 'fulfilled');
  report.controlValid = validControl;
  assert.ok(validControl, 'Tiny native CacheStorage and registration control must pass before interpreting dependent cells.');

  await runCell('tiny-held-replacement-cache-and-register', async () => {
    const { context, page } = await newPage(activeCell);
    const key = '/__diag/held/replacement.html', held = gate(key);
    let navigation;
    try {
      const handle = await tinySetup(page, 'held');
      navigation = page.goto(origin + key, { timeout: 15000, waitUntil: 'load' }).then(() => ({ outcome: 'loaded' }), error => ({ outcome: 'error', message: sanitize(error.message) }));
      await bounded(held.arrived.promise, 5000, 'replacement server ingress');
      report.actions.push({ atMs: now(), cell: activeCell, action: 'replacement-request-arrived-response-held' });
      let operations;
      try { operations = await bounded(tinyCalls(handle, 'held', true), 8000, 'old-document native calls during held replacement'); }
      finally { held.released.resolve(); }
      return { operations, navigation: await navigation, boundary: 'All four old-document calls initiated after replacement request ingress, before response release.' };
    } finally { held.released.resolve(); if (navigation) await navigation; await context.close(); gateMap.delete(key); }
  });

  await runCell('tiny-inflight-registration-script-held-then-replacement', async () => {
    const { context, page } = await newPage(activeCell);
    const scriptKey = '/__diag/inflight/worker.js', replacementKey = '/__diag/inflight/replacement.html';
    const scriptHeld = gate(scriptKey), replacementHeld = gate(replacementKey);
    let navigation;
    try {
      await tinySetup(page, 'inflight');
      // This explicit fixture promise catches its own rejection. Instrumentation still does not observe settlements.
      await page.evaluate(() => { window.__fixtureRegistrationResult = navigator.serviceWorker.register('/__diag/inflight/worker.js', { scope: '/__diag/inflight/' }).then(() => ({ outcome: 'fulfilled' }), error => ({ outcome: 'rejected-caught-by-fixture', name: error.name, message: error.message })); });
      await bounded(scriptHeld.arrived.promise, 5000, 'worker-script server ingress');
      navigation = page.goto(origin + replacementKey, { timeout: 15000, waitUntil: 'load' }).then(() => ({ outcome: 'loaded' }), error => ({ outcome: 'error', message: sanitize(error.message) }));
      await bounded(replacementHeld.arrived.promise, 5000, 'inflight replacement server ingress');
      report.actions.push({ atMs: now(), cell: activeCell, action: 'worker-and-replacement-requests-arrived-both-responses-held' });
      scriptHeld.released.resolve();
      let registration;
      try { registration = await bounded(page.evaluate(() => window.__fixtureRegistrationResult), 8000, 'inflight registration settlement'); }
      finally { replacementHeld.released.resolve(); }
      return { registration, navigation: await navigation, boundary: 'Worker response released while replacement response is still held; registration started before replacement ingress.' };
    } finally { scriptHeld.released.resolve(); replacementHeld.released.resolve(); if (navigation) await navigation; await context.close(); gateMap.delete(scriptKey); gateMap.delete(replacementKey); }
  });

  await runCell('frozen-app-original-rapid-hard-navigation-sequence', async () => {
    const { context, page } = await newPage(activeCell);
    const routes = ['/auth', '/ranked', '/race', '/leaderboard', '/', '/learn', '/lessons', '/games', '/stats', '/settings', '/keyboard-lab', '/privacy'];
    const results = [];
    try {
      for (const route of routes) {
        for (const reload of (['/auth', '/ranked', '/race', '/leaderboard'].includes(route) ? [false] : [false, true])) {
          const action = { atMs: now(), cell: activeCell, action: reload ? 'hard-reload' : 'hard-goto', path: route }; report.actions.push(action);
          try {
            const response = reload ? await page.reload({ timeout: 12000, waitUntil: 'load' }) : await page.goto(origin + route, { timeout: 12000, waitUntil: 'load' });
            await page.locator('#main-content').waitFor({ state: 'visible', timeout: 5000 });
            action.endMs = now(); results.push({ path: route, reload, status: response?.status(), visibleWithinOriginal5000ms: true });
          } catch (error) { action.endMs = now(); results.push({ path: route, reload, error: sanitize(error.message), visibleWithinOriginal5000ms: false }); }
        }
      }
      return { routes: results, navigationCount: results.length, failedRouteObservations: results.filter(row => !row.visibleWithinOriginal5000ms).length, attribution: 'Native API entry caller stacks, lifecycle events and all pageerrors are retained. Original promises and error propagation are not intercepted.' };
    } finally { await context.close(); }
  });
  report.sourceAfter = (await verifyFrozenSource(sourceFile)).receipt;
  assert.deepEqual(report.sourceAfter.mismatches, []);
  const artifactsAfter = await artifactInventory();
  report.artifactIntegrity = { files: Object.keys(artifactsBefore).length, byteHashesUnchanged: JSON.stringify(artifactsBefore) === JSON.stringify(artifactsAfter), observedBuild: build.version };
  assert.equal(report.artifactIntegrity.byteHashesUnchanged, true);
  report.status = 'DIAGNOSTIC-COMPLETED';
} catch (error) { report.status = 'DIAGNOSTIC-FAILED'; report.error = sanitize(error.message); }
finally {
  for (const value of gateMap.values()) value.released.resolve();
  if (browser) { try { await bounded(browser.close(), 10000, 'owned browser cleanup'); report.cleanup.ownedBrowserClosed = true; } catch (error) { report.cleanup.browserError = sanitize(error.message); } }
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); report.cleanup.ownedServerClosed = true; }
  clearTimeout(watchdog);
  report.cleanup.originalServicesUntouched = true;
  report.finishedAt = new Date().toISOString(); report.elapsedMs = now();
  report.nativePageErrorCount = report.events.filter(event => event.type === 'pageerror').length;
  report.causality = 'Interpret exact per-cell native entry/lifecycle/error order; analogous upstream behavior alone is not same-operation proof. No production fix or acceptance claim is made by this diagnostic.';
  await checkpoint('finished');
}
if (report.status !== 'DIAGNOSTIC-COMPLETED') process.exitCode = 1;
