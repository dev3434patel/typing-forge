import { spawn } from 'node:child_process';
import { access, open, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { summarizeReport } from './summarize-browsers.mjs';

const directory = path.resolve('audit/mobile-games-static-2026-10-20');
const [prefix, buildFile, browserList, scope = 'full'] = process.argv.slice(2);
assert.ok(['negative', 'full', 'fixtures', 'integration'].includes(scope));
assert.match(prefix ?? '', /^[a-z0-9-]+$/);
assert.ok(buildFile && browserList);
const browsers = browserList.split(',');
assert.ok(browsers.every(value => ['chromium', 'edge', 'firefox', 'webkit'].includes(value)));
const build = JSON.parse(await readFile(buildFile, 'utf8')).local;
const origin = 'http://127.0.0.1:4173';
const reportFile = `${directory}/${prefix}.json`;
const logFile = `${directory}/${prefix}.log`;
const protocolFile = `${directory}/${prefix}-protocol.json`;
for (const file of [reportFile, logFile, protocolFile, `${directory}/${prefix}-summary.json`])
  await assert.rejects(access(file), { code: 'ENOENT' });
assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(response => response.json()), build);
const protocol = {
  declaredAt: new Date().toISOString(), buildFile, build, origin, browsers,
  scope, expectedCases: browsers.length * (scope === 'negative' ? 2 : scope === 'integration' ? 14 : scope === 'fixtures' ? 12 : 11), workers: 1, automaticRetries: 0,
  testFileSha256: createHash('sha256').update(await readFile('e2e/account-workspace.spec.ts')).digest('hex'),
  method: 'Actual route/UI tests intercept every API request and hold auth/session to prove interactive owner controllers do not mount prematurely, then retain resolved-owner practice. Public auth remains available. No real account, credentials, backend writes, fake clock, or relaxed assertion.',
  grep: scope === 'negative' ? 'initial owner readiness protects (Test|Lessons) with a delayed account session' : 'initial owner readiness|public sign-in remains available',
  completed: false,
};
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
const log = await open(logFile, 'wx');
const args = ['node_modules/@playwright/test/cli.js', 'test', 'e2e/account-workspace.spec.ts',
  ...(scope === 'integration' ? ['e2e/accessibility-audit.spec.ts'] : scope === 'fixtures' ? [] : ['--grep', protocol.grep]),
  '--workers=1', '--retries=0', '--reporter=list,json',
  `--output=${directory}/.playwright-artifacts-${prefix}`];
console.log(JSON.stringify({ prefix, build: build.version, browsers, expectedCases: protocol.expectedCases }));
const began = performance.now();
let code;
try {
  code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: origin, PLAYWRIGHT_BROWSERS: browserList,
        PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile }, stdio: ['ignore', log.fd, log.fd] });
    child.once('error', reject); child.once('exit', resolve);
  });
} finally { await log.close(); }
const report = JSON.parse(await readFile(reportFile, 'utf8'));
const summary = summarizeReport(report);
assert.equal(summary.totals.total, protocol.expectedCases);
protocol.completed = true;
protocol.finishedAt = new Date().toISOString();
protocol.exitCode = code;
protocol.durationMs = performance.now() - began;
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
await writeFile(`${directory}/${prefix}-summary.json`, JSON.stringify(summary, null, 2));
assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(response => response.json()), build);
console.log(JSON.stringify({ code, totals: summary.totals }));
process.exitCode = code;
