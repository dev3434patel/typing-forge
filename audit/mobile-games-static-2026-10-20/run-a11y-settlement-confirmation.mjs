import { spawn } from 'node:child_process';
import { readFile, writeFile, open, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { summarizeReport } from './summarize-browsers.mjs';
import { reportCases } from './run-quiet-confirmation.mjs';

const directory = path.resolve('audit/mobile-games-static-2026-10-20');
const prefix = 'after-5-a11y-settlement-confirmation';
const build = JSON.parse(await readFile(`${directory}/after-5-build.json`, 'utf8')).local;
const origin = 'http://127.0.0.1:4173';
const reportFile = `${directory}/${prefix}.json`;
const logFile = `${directory}/${prefix}.log`;
const protocolFile = `${directory}/${prefix}-protocol.json`;
for (const file of [reportFile, logFile, protocolFile, `${directory}/${prefix}-summary.json`])
  await assert.rejects(access(file), { code: 'ENOENT' });
assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(value => value.json()), build);
const protocol = {
  declaredAt: new Date().toISOString(), build, origin,
  workers: 1, automaticRetries: 0, modifiedTestBudgets: false,
  cases: 'Both existing all-page automated accessibility sizes across Chromium, Edge, Firefox and WebKit; eight total.',
  priorReceipt: 'after-5-quiet-confirmation.json',
  fixtureRepair: 'Shared settlement waits two real animation frames before enumerating finite animations and waits actual Auth panel computed opacity=1 for JS-driven Framer. No runtime change, reduced-motion override, disabled animation, or changed contrast assertion.',
  helperSha256: createHash('sha256').update(await readFile('e2e/helpers.ts')).digest('hex'),
  scopedLint: { command: 'npx eslint e2e/helpers.ts', exitCode: 0 },
  completed: false,
};
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
const handle = await open(logFile, 'wx');
const args = ['node_modules/@playwright/test/cli.js', 'test', 'e2e/accessibility-audit.spec.ts',
  '--workers=1', '--retries=0', '--reporter=list,json',
  `--output=${directory}/.playwright-artifacts-${prefix}`];
console.log(JSON.stringify({ prefix, build: build.version, cases: 8, workers: 1, retries: 0 }));
const began = performance.now();
let code;
try {
  code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: origin,
        PLAYWRIGHT_BROWSERS: 'chromium,edge,firefox,webkit', PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
      stdio: ['ignore', handle.fd, handle.fd] });
    child.once('error', reject); child.once('exit', resolve);
  });
} finally { await handle.close(); }
const result = JSON.parse(await readFile(reportFile, 'utf8'));
const outcomes = reportCases(result);
const integrityErrors = [];
if (outcomes.length !== 8) integrityErrors.push(`Expected eight cases, recorded ${outcomes.length}.`);
for (const item of outcomes) {
  if (item.timeout !== 120_000) integrityErrors.push(`Changed budget: ${item.project}/${item.titlePath.join('/')}`);
  if (item.results.length !== 1 || item.results[0].retry !== 0) integrityErrors.push(`Unexpected retry: ${item.project}/${item.titlePath.join('/')}`);
}
const summary = { ...summarizeReport(result), integrityErrors,
  scope: 'Separate confirmation after test-only entrance settlement correction; retains the prior 33/34 receipt and all historical failures. No runtime/build change.' };
protocol.completed = true;
protocol.finishedAt = new Date().toISOString();
protocol.exitCode = code;
protocol.durationMs = performance.now() - began;
protocol.integrityErrors = integrityErrors;
await writeFile(`${directory}/${prefix}-summary.json`, JSON.stringify(summary, null, 2));
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
assert.deepEqual(await fetch(`${origin}/offline-build.json`).then(value => value.json()), build);
console.log(JSON.stringify({ code, totals: summary.totals, integrityErrors }));
if (code !== 0 || integrityErrors.length) process.exitCode = 1;
