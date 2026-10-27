import { createServer as createHttpServer } from 'node:http';
import { lstat, readFile, realpath, unlink, writeFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import { createServer, isFileLoadingAllowed, loadConfigFromFile } from 'vite';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Choose before or after.');
const root = path.resolve('.');
const storage = path.resolve(root, 'backend/storage');
if (!(await lstat(storage)).isDirectory() || (await lstat(storage)).isSymbolicLink() || (await realpath(storage)).toLowerCase() !== storage.toLowerCase()) throw new Error('Canary storage must be the existing ordinary workspace directory.');
const name = `sparowtype-dev-boundary-${randomUUID()}.txt`;
const canary = path.resolve(storage, name);
if (path.dirname(canary) !== storage) throw new Error('Canary path escaped its owned directory.');
const marker = `NONSECRET-DEV-BOUNDARY-CANARY-${randomUUID()}`;
await writeFile(canary, marker, { flag: 'wx' });
const proxyRequests = [];
const fixture = createHttpServer((request, response) => {
  proxyRequests.push(request.url);
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ nonsecretFixture: true }));
});
let vite;
const previousApi = process.env.SPAROWTYPE_PHP_URL;
const checks = [];
try {
  await new Promise((resolve, reject) => { fixture.once('error', reject); fixture.listen(0, '127.0.0.1', resolve); });
  process.env.SPAROWTYPE_PHP_URL = `http://127.0.0.1:${fixture.address().port}`;
  const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, path.join(root, 'vite.config.ts'));
  if (!loaded) throw new Error('Project config was not loaded.');
  // Rendering plugins are irrelevant to raw file serving and otherwise trigger
  // dependency prebundling. Retain the actual project server/proxy configuration.
  vite = await createServer({ ...loaded.config, configFile: false, plugins: [], server: { ...loaded.config.server, host: '127.0.0.1', port: 4271, strictPort: true, watch: null, preTransformRequests: false, warmup: { clientFiles: [] } }, optimizeDeps: { noDiscovery: true, include: [] } });
  await vite.listen();
  const origin = 'http://127.0.0.1:4271';
  const relative = `/backend/storage/${name}`;
  const fsUrl = '/@fs/' + canary.replaceAll('\\', '/');
  const canaryRoutes = [[relative, 'backend-storage-canary'], [relative + '?raw', 'backend-storage-canary-query'], [fsUrl, 'raw-fs-canary'], [fsUrl + '?raw', 'raw-fs-canary-query']];
  if (phase === 'after') canaryRoutes.push(
    [relative.toUpperCase(), 'backend-storage-canary-windows-uppercase'],
    [fsUrl.toUpperCase().replace('/@FS/', '/@fs/'), 'raw-fs-canary-windows-uppercase'],
    [relative.replace('/backend/storage/', '/%62ackend/%73torage/'), 'backend-storage-canary-encoded-directory'],
    [fsUrl.replace('/backend/storage/', '/%62ackend/%73torage/'), 'raw-fs-canary-encoded-directory'],
  );
  for (const [url, route] of canaryRoutes) {
    const response = await fetch(origin + url, { signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    checks.push({ route, status: response.status, exposesCanary: text.includes(marker) });
  }
  const response = await fetch(origin + '/api/dev-boundary-fixture', { signal: AbortSignal.timeout(5000) });
  checks.push({ route: 'api-proxy-to-isolated-fixture-only', status: response.status, correctFixture: (await response.json()).nonsecretFixture === true });
  if (phase === 'after') {
    for (const suffix of ['', '?import']) {
      const response = await fetch(origin + '/backend/resources/typing-course-v1.json' + suffix, { signal: AbortSignal.timeout(5000) });
      checks.push({ route: 'public-course-catalog' + (suffix ? '-module' : ''), status: response.status, correctPublicResource: (await response.text()).includes('typing-course-v1') });
    }
    const privatePaths = [
      ['backend-main-config-policy', 'backend/config.php'],
      ['backend-local-config-policy', 'backend/nonsecret-config.local.php'],
      ['backend-storage-policy', 'backend/storage/nonsecret-policy-probe.txt'],
      ['hosting-package-policy', 'hosting-build/nonsecret-policy-probe.txt'],
      ['hosting-archive-policy', 'hosting-archive/nonsecret-policy-probe.txt'],
      ['hosting-staging-policy', '.hosting-stage-nonsecret/nonsecret-policy-probe.txt'],
      ['default-env-policy', '.env'],
      ['default-env-variant-policy', '.env.nonsecret-policy-probe'],
      ['default-certificate-policy', 'nonsecret-policy-probe.crt'],
      ['default-private-key-policy', 'nonsecret-policy-probe.pem'],
      ['default-git-policy', '.git/nonsecret-policy-probe'],
    ];
    for (const [route, relativePath] of privatePaths) {
      // This is a pure pathname predicate: never open or HTTP-request private files.
      const denied = !isFileLoadingAllowed(vite.config, path.resolve(root, relativePath).replaceAll('\\', '/'));
      checks.push({ route, denied, scope: 'Vite pathname policy only; no file read or HTTP request' });
    }
    checks.push({ route: 'installed-vite-default-deny-preserved', preserved: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**'].every(pattern => vite.config.server.fs.deny.includes(pattern)) });
  }
  const report = { recordedAt: new Date().toISOString(), phase, viteVersion: JSON.parse(await readFile('node_modules/vite/package.json', 'utf8')).version, projectConfiguredHost: loaded.config.server.host, host: vite.config.server.host, port: 4271, scope: 'Loaded project server/proxy options with render-only plugins omitted and dependency prebundling disabled; loopback HTTP only, no browser/build.', effectiveDeny: vite.config.server.fs.deny, canary: { type: 'fresh nonsecret text', location: 'ignored backend/storage', sha256: createHash('sha256').update(marker).digest('hex') }, checks, proxyRequests, realConfigOrUserDataRequested: false, cleanup: 'Owned canary and both disposable loopback servers are removed in finally.' };
  await writeFile(`audit/mobile-games-static-2026-10-20/dev-file-boundary-${phase}.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ phase, checks, effectiveDeny: report.effectiveDeny }));
  if (phase === 'after' && checks.some(check => check.exposesCanary !== undefined ? check.status !== 403 || check.exposesCanary : check.correctFixture !== undefined ? check.status !== 200 || !check.correctFixture : check.correctPublicResource !== undefined ? check.status !== 200 || !check.correctPublicResource : check.denied !== undefined ? !check.denied : !check.preserved)) throw new Error('Development file boundary regression failed; inspect the sanitized receipt.');
} finally {
  await vite?.close();
  await new Promise(resolve => { fixture.close(resolve); fixture.closeAllConnections(); });
  if (previousApi === undefined) delete process.env.SPAROWTYPE_PHP_URL; else process.env.SPAROWTYPE_PHP_URL = previousApi;
  if ((await readFile(canary, 'utf8')) !== marker) throw new Error('Owned canary content changed; preserve rather than delete.');
  await unlink(canary);
}
