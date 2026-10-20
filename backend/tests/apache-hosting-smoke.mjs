import assert from 'node:assert/strict';
import { readdir, writeFile } from 'node:fs/promises';

// Point this at an isolated Apache document root containing the actual generated
// hosting package. The optional /private-probe alias is a test-only exposure of
// the private directory to verify its deny rule; it is never shipped by packaging.
const base = process.env.SPAROWTYPE_HOSTING_TEST_URL || 'http://127.0.0.1:8091';
const checks = [];
let html;
for (const route of ['/', '/learn', '/lessons', '/race/ABC123', '/settings']) {
  const response = await fetch(base + route);
  const body = await response.text();
  assert.equal(response.status, 200, route);
  assert.match(body, /<div id="root"/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  checks.push({ route, status: response.status, spa: true, securityHeaders: true });
  html ??= body;
}
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map(match => match[1]);
const packageAssets = await readdir(new URL('../../hosting-build/public_html/assets/', import.meta.url));
const css = packageAssets.find(name => name.endsWith('.css'));
assert(css, 'The actual hosting package must include its lazy app CSS.');
assets.push('/assets/' + css);
assert(assets.length > 0, 'A built frontend asset must be present.');
for (const route of [...new Set(assets)]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('content-type'), route.endsWith('.css') ? /text\/css/ : /(?:javascript|ecmascript)/);
  checks.push({ route, status: response.status, correctMime: true, bytes: (await response.arrayBuffer()).byteLength });
}
const health = await fetch(base + '/api/health');
const healthBody = await health.json();
assert.equal(health.status, 200);
assert.equal(healthBody.ok, true);
assert.equal(healthBody.backend, 'php-mysql');
checks.push({ route: '/api/health', status: health.status, nativeBackend: true });
for (const route of ['/private-probe/schema.sql', '/private-probe/config.example.php', '/private-probe/config.php', '/private-probe/src/AuthService.php', '/private-probe/resources/typing-course-v1.json', '/sparowtype-private/config.example.php']) {
  const response = await fetch(base + route);
  const body = await response.text();
  // Unknown SPA URLs may legitimately resolve to the public index shell.
  assert([200, 403, 404].includes(response.status), route);
  if (route.startsWith('/private-probe/')) assert([403, 404].includes(response.status), 'The private test alias must deny source, configuration and curriculum files.');
  if (response.status === 200) assert.match(body, /<div id="root"/);
  assert.doesNotMatch(body, /<\?php|CREATE TABLE|password_hash VARCHAR/);
  checks.push({ route, status: response.status, privateSourceExposed: false });
}
let build;
for (const route of ['/index.html', '/sw.js', '/offline-build.json']) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  assert.match(response.headers.get('cache-control'), /no-cache/, route);
  if (route === '/offline-build.json') build = await response.json();
  else await response.text();
  checks.push({ route, status: response.status, cacheControl: response.headers.get('cache-control') });
}
const initial = await fetch(base + '/api/auth/session');
const session = await initial.json();
assert.equal(initial.status, 200);
assert.equal(session.user, null);
assert.match(session.csrfToken, /^[a-f0-9]{64}$/);
assert.match(initial.headers.get('cache-control'), /no-store/);
assert(initial.headers.getSetCookie().some(cookie => /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie)));
checks.push({ route: '/api/auth/session', status: initial.status, csrfPresent: true, httpOnlyCookie: true, noStore: true });
const denied = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
assert.equal(denied.status, 403);
assert.equal((await denied.json()).error.code, 'csrf');
checks.push({ route: '/api/auth/signup', status: denied.status, missingCsrfBlocked: true });
const report = { date: new Date().toISOString(), server: 'isolated Apache2.4 + native mod_php8.2 + MariaDB PDO', build, checks, passed: checks.length, failed: 0, externalDeployment: false };
if (process.env.SPAROWTYPE_HOSTING_TEST_REPORT) await writeFile(process.env.SPAROWTYPE_HOSTING_TEST_REPORT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
