import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicitly run by the release coordinator after other browser suites finish.
// Passwords exist only in memory/child environment; browser tracing is disabled.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const configFile = resolve(root, 'backend/audit-config.local.php');
const base = 'http://127.0.0.1:4173';
const api = `${base}/api`;
const directApi = 'http://127.0.0.1:8081/api';
for (const name of ['PLAYWRIGHT_BASE_URL', 'PHP_E2E_API_URL']) {
  if (process.env[name]) assert.equal(process.env[name].replace(/\/$/, ''), name === 'PLAYWRIGHT_BASE_URL' ? base : api,
    `${name} must target only the intended loopback acceptance server.`);
}
if (process.env.SPAROWTYPE_CONFIG_FILE) assert.equal(resolve(process.env.SPAROWTYPE_CONFIG_FILE), configFile, 'Only the explicit local audit config is allowed.');
const env = { ...process.env, SPAROWTYPE_CONFIG_FILE: configFile };
const run = randomBytes(6).toString('hex');
const accounts = [];
const cleanup = [];
const outputPrefix = process.env.SPAROWTYPE_COMPETITION_OUTPUT_PREFIX || 'php-real-competition';
assert.ok(['php-real-competition', 'php-real-competition-confirmation'].includes(outputPrefix), 'An explicit owned audit output prefix is required.');
const reportPath = resolve(here, `${outputPrefix}.json`);
const processPath = resolve(here, `${outputPrefix}-process.json`);
const logPath = resolve(here, `${outputPrefix}.log`);
const startedAt = new Date().toISOString();
let childResult;
let failure;
let phase = 'audit deployment guard';
function configGuard() {
  const code = `if (PHP_SAPI !== 'cli') exit(1); $c=require $argv[1].'/backend/bootstrap.php';
    if (!preg_match('/_audit$/D',$c['database']['name']??'') || !str_contains($c['session_name']??'','audit')) throw new RuntimeException('Dedicated audit config/database/session required.');
    $db=\\SparowType\\Database::connect($c);
    if ($db->query('SELECT DATABASE()')->fetchColumn()!==$c['database']['name']) throw new RuntimeException('Database mismatch.');
    echo json_encode(['database'=>$c['database']['name'],'sessionName'=>$c['session_name']]);`;
  const r = spawnSync(process.env.PHP_BINARY || 'php', ['-r', code, root], { env, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, 'Audit configuration/database guard failed; no accounts will be created.');
  return JSON.parse(r.stdout.trim().split(/\r?\n/).at(-1));
}
function client() {
  const cookies = new Map();
  let csrf = '';
  return {
    async call(path, body, expected = 200) {
      const response = await fetch(`${api}${path}`, { method: body === undefined ? 'GET' : 'POST',
        signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json', Cookie: [...cookies].map(([k,v]) => `${k}=${v}`).join('; '),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      for (const value of response.headers.getSetCookie()) {
        const pair = value.split(';', 1)[0]; const split = pair.indexOf('='); cookies.set(pair.slice(0, split), pair.slice(split+1));
      }
      const data = await response.json();
      if (typeof data.csrfToken === 'string') csrf = data.csrfToken;
      assert.equal(response.status, expected, `${phase}: ${path} returned ${response.status} (${data.error?.code || 'unexpected response'}).`);
      return { data, response };
    },
  };
}
async function runPlaywright(childEnv) {
  const args = [resolve(root, 'node_modules/@playwright/test/cli.js'), 'test', 'e2e/auth-flow.spec.ts', 'e2e/php-human-race.spec.ts',
    '--grep', 'real account sign in with dedicated deployment credentials|real two-browser PHP human race shares opponent pace and settles server results',
    '--workers=1', '--retries=0', '--forbid-only', '--trace=off', '--reporter=list,json',
    `--output=${resolve(here, `${outputPrefix}-artifacts`)}`];
  const child = spawn(process.execPath, args, { cwd: root, env: childEnv, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  let output = '';
  const secrets = accounts.map(account => account.password);
  const append = chunk => { let value = String(chunk); for (const secret of secrets) value = value.replaceAll(secret, '[REDACTED]'); output += value; process.stdout.write(value); };
  child.stdout.on('data', append); child.stderr.on('data', append);
  const timeout = setTimeout(() => child.kill(), 10 * 60_000);
  try {
    return await new Promise((accept, reject) => { child.once('error', reject); child.once('close', (code, signal) => accept({ exitCode: code, signal })); });
  } finally { clearTimeout(timeout); await writeFile(logPath, output); }
}
try {
  await mkdir(here, { recursive: true });
  const guard = configGuard();
  for (const url of [`${api}/health`, `${directApi}/health`]) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    assert.equal(response.status, 200); const value = await response.json();
    assert.equal(value.backend, 'php-mysql'); assert.equal(value.ok, true);
  }
  phase = 'create exactly two dedicated accounts';
  for (const role of ['host', 'opponent']) {
    const account = { role, email: `competition-${role}-${run}@example.test`, password: `Audit!${randomUUID()}${randomBytes(12).toString('hex')}`, client: client(), id: null };
    const bootstrap = await account.client.call('/auth/session');
    assert.ok(bootstrap.response.headers.getSetCookie().some(cookie => cookie.startsWith(`${guard.sessionName}=`)), 'HTTP deployment does not match guarded audit session namespace.');
    // Keep a cleanup owner immediately after the successful signup response.
    accounts.push(account);
    const { data } = await account.client.call('/auth/signup', { email: account.email, password: account.password }, 201);
    account.id = data.user?.id; assert.ok(account.id); assert.equal(data.user.email, account.email);
  }
  phase = 'eight real browser journeys';
  const [host, opponent] = accounts;
  childResult = await runPlaywright({ ...env, PLAYWRIGHT_BASE_URL: base, PLAYWRIGHT_BROWSERS: 'chromium,edge,firefox,webkit',
    PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath, PHP_E2E_ACCEPTANCE: '1', PHP_E2E_API_URL: api,
    PHP_E2E_RACE_HOST_EMAIL: host.email, PHP_E2E_RACE_HOST_PASSWORD: host.password,
    PHP_E2E_RACE_OPPONENT_EMAIL: opponent.email, PHP_E2E_RACE_OPPONENT_PASSWORD: opponent.password,
    FORGE_E2E_AUTH_EMAIL: host.email, FORGE_E2E_AUTH_PASSWORD: host.password });
  assert.equal(childResult.exitCode, 0, 'One or more real browser journeys failed; inspect the preserved report.');
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.stats.expected, 8, 'Exactly two journeys across four engines must pass.');
  assert.equal(report.stats.unexpected, 0); assert.equal(report.stats.skipped, 0);
} catch (error) {
  failure = { phase, message: error instanceof Error ? error.message : String(error) };
  process.stderr.write(`${failure.phase}: ${failure.message}\n`);
} finally {
  phase = 'delete only this run accounts through authenticated API';
  for (const account of accounts) {
    try {
      const { data: state } = await account.client.call('/auth/session');
      if (state.user) {
        assert.equal(state.user.email, account.email); assert.ok(account.email.endsWith(`-${run}@example.test`));
        const result = await account.client.call('/account/delete', { expectedOwner: state.user.id, confirmation: 'DELETE MY ACCOUNT' });
        assert.equal(result.data.deleted, true);
        cleanup.push({ role: account.role, deleted: true });
      } else { assert.equal(account.id, null, 'Created account lost its authenticated cleanup context.'); cleanup.push({ role: account.role, deleted: false, accountWasNotCreated: true }); }
    } catch (error) { cleanup.push({ role: account.role, deleted: false, error: error instanceof Error ? error.message : String(error) }); }
  }
  const cleanupFailed = cleanup.some(value => value.error);
  await writeFile(processPath, JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), run, app: base, api, directApi,
    auditConfig: 'backend/audit-config.local.php', provisionedAccounts: accounts.filter(account => account.id).length,
    expectedCases: 8, engines: ['chromium','edge','firefox','webkit'], workers: 1, retries: 0,
    child: childResult || null, failure: failure || null, cleanup, exitCode: failure || cleanupFailed ? 1 : 0,
    limitations: 'Opt-in real UI credentials and two browser contexts; no human timing or native Safari claim. Browser traces disabled to avoid storing synthetic passwords. Production rate limits remain unchanged.',
  }, null, 2));
  if (failure || cleanupFailed) process.exitCode = 1;
}
