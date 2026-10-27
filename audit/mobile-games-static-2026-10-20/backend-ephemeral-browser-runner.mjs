// Only run after the separately coordinated isolated API/preview is ready.
// Never print generated credentials or capture Playwright traces.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

assert.equal(process.env.SPAROWTYPE_EPHEMERAL_BROWSER_ACCEPTANCE, '1', 'Explicit browser-stage coordination is required.');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const ready = JSON.parse(await readFile(path.join(here, 'backend-ephemeral-browser-ready.json'), 'utf8'));
const privateFile = await realpath(ready.privateBrowserEnvFile);
const directory = path.dirname(privateFile);
assert.equal(path.dirname(directory).toLowerCase(), (await realpath(path.join(root, 'backend/storage'))).toLowerCase());
assert.match(path.basename(directory), /^mobile-games-instance-[a-f0-9]{16}$/);
assert.equal(path.basename(privateFile), 'browser-env.json');
const marker = JSON.parse(await readFile(path.join(directory, 'ownership.json'), 'utf8'));
assert.equal(path.basename(directory), `mobile-games-instance-${marker.id}`);
const browserEnv = JSON.parse(await readFile(privateFile, 'utf8'));
const remaining = process.env.SPAROWTYPE_EPHEMERAL_BROWSER_GROUP === 'remaining';
const quietFirefox = process.env.SPAROWTYPE_EPHEMERAL_BROWSER_GROUP === 'quiet-firefox-auth';
const after6Account = process.env.SPAROWTYPE_EPHEMERAL_BROWSER_GROUP === 'after6-account-flow';
assert.equal(browserEnv.PHP_E2E_ACCEPTANCE, '1');
assert.equal(new URL(browserEnv.PLAYWRIGHT_BASE_URL).hostname, '127.0.0.1');
assert.equal(new URL(browserEnv.SPAROWTYPE_PHP_URL).hostname, '127.0.0.1');
assert.notEqual(new URL(browserEnv.SPAROWTYPE_PHP_URL).port, '8081');
assert.equal(browserEnv.PLAYWRIGHT_BASE_URL, ready.baseUrl);
assert.equal(browserEnv.VITE_API_BASE_URL, '/api');
for (const role of ['HOST', 'OPPONENT']) {
  assert.match(browserEnv[`PHP_E2E_RACE_${role}_EMAIL`], new RegExp(`^native-browser-${marker.id}-(host|opponent)@example\\.test$`));
  assert.match(browserEnv[`PHP_E2E_RACE_${role}_PASSWORD`], /^NativeAudit![a-f0-9]{48}$/);
}
if (remaining || quietFirefox) {
  browserEnv.FORGE_E2E_AUTH_EMAIL = browserEnv.PHP_E2E_RACE_HOST_EMAIL;
  browserEnv.FORGE_E2E_AUTH_PASSWORD = browserEnv.PHP_E2E_RACE_HOST_PASSWORD;
}
const group = after6Account ? 'after6-account-flow' : quietFirefox ? 'quiet-firefox-auth' : remaining ? 2 : 1;
const files = after6Account ? ['e2e/php-account-flow.spec.ts'] : quietFirefox ? ['e2e/php-account-flow.spec.ts', 'e2e/auth-flow.spec.ts'] : remaining ? ['e2e/auth-flow.spec.ts', 'e2e/race-mode.spec.ts'] : ['e2e/php-account-flow.spec.ts', 'e2e/php-human-race.spec.ts'];
const filter = quietFirefox ? ['--grep', 'real PHP account signup, replay upload, independent-device history/preferences and account deletion|real account sign in with dedicated deployment credentials'] : remaining ? ['--grep', 'real account sign in with dedicated deployment credentials|PHP two-account race authorization and server-owned countdown'] : [];
const engines = quietFirefox ? ['firefox'] : ['chromium', 'edge', 'firefox', 'webkit'];
if (after6Account) {
  const localBuild = await readFile(path.join(root, 'dist/offline-build.json'));
  const remoteResponse = await fetch(new URL('/offline-build.json', browserEnv.PLAYWRIGHT_BASE_URL), { signal: AbortSignal.timeout(3000) });
  assert.equal(remoteResponse.ok, true, 'Owned preview build readiness failed before browser launch.');
  const remoteBuild = Buffer.from(await remoteResponse.arrayBuffer());
  assert.equal(createHash('sha256').update(localBuild).digest('hex'), createHash('sha256').update(remoteBuild).digest('hex'), 'Preview and local final build bytes differ.');
  const version = JSON.parse(remoteBuild).version;
  assert.equal(version, process.env.SPAROWTYPE_EPHEMERAL_EXPECT_BUILD, 'Explicit after6 build provenance does not match.');
  const app = JSON.parse(await readFile(path.join(directory, 'app.json'), 'utf8'));
  const sessionResponse = await fetch(new URL('/api/auth/session', browserEnv.PLAYWRIGHT_BASE_URL), { signal: AbortSignal.timeout(3000) });
  assert.equal(sessionResponse.ok, true, 'Owned API readiness failed before browser launch.');
  assert.equal(sessionResponse.headers.getSetCookie().some(value => value.startsWith(`${app.session_name}=`)), true, 'Owned API cookie namespace differs.');
  const provenance = { date: new Date().toISOString(), version, localRemoteBuildBytesMatch: true, exactIsolatedNamespacePassed: true, accountsReseeded: false, countersReset: false };
  await writeFile(path.join(here, `backend-ephemeral-native-browser-${group}-provenance.json`), JSON.stringify(provenance, null, 2) + '\n');
  console.log(JSON.stringify({ stage: 'native-after6-readiness', ...provenance }));
}
const artifactTag = quietFirefox ? 'quiet-firefox-auth-restored' : group;
const args = [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', ...files, ...filter, '--workers=1', '--retries=0', '--trace=off', '--reporter=json', '--output', path.join(here, `.playwright-artifacts-native-http-${artifactTag}`)];
console.log(JSON.stringify({ stage: 'native-browser-start', group, engines, expectedCases: after6Account ? 4 : quietFirefox ? 2 : 8, workers: 1, retries: 0, traces: false, intro: remaining ? 'Auth page disables intro; race authorization case uses API contexts only.' : 'Selected browser specs disable intro in all browser contexts.', dedicatedEphemeralDatabase: true }));
const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...browserEnv, PLAYWRIGHT_BROWSERS: engines.join(',') }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
child.stdout.on('data', chunk => { stdout += chunk; });
child.stderr.on('data', chunk => { stderr += chunk; });
const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
// Defensive redaction also protects receipts if a future assertion prints an
// input value. Browser traces are disabled at the CLI, including failed runs.
for (const [key, value] of Object.entries(browserEnv)) if (key.endsWith('_PASSWORD')) {
  stdout = stdout.replaceAll(value, '[REDACTED]'); stderr = stderr.replaceAll(value, '[REDACTED]');
}
// The account-flow spec creates its own password inside the browser test.
stdout = stdout.replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]');
stderr = stderr.replace(/Acceptance![a-f0-9-]{36}/g, '[REDACTED]');
await writeFile(path.join(here, `backend-ephemeral-native-browser-${group}.json`), stdout);
await writeFile(path.join(here, `backend-ephemeral-native-browser-${group}.log`), stderr);
let stats = null;
try { stats = JSON.parse(stdout).stats; } catch { /* Raw diagnostic retained. */ }
console.log(JSON.stringify({ stage: 'native-browser-complete', group, exitCode: code, stats, traces: false, passwordsPrinted: false }));
process.exitCode = code ?? 1;
