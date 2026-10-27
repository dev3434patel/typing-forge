import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { open, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';
import { summarizeReport } from '../mobile-games-static-2026-10-20/summarize-browsers.mjs';

const directory = 'audit/2026-10-21', prefix = 'final17-keyboard-focus-corrected';
const sourceFile = `${directory}/final17-source.json`;
const before = await verifyFrozenSource(sourceFile);
assert.equal(before.frozen.local.version, process.env.SPAROWTYPE_FINAL17_BUILD_ID);
assert.deepEqual(before.receipt.mismatches, []);
const inputs = ['e2e/live-keyboard.spec.ts', 'e2e/helpers.ts', 'playwright.config.ts'];
const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const raw = `${directory}/${prefix}-raw.json`;
const receipt = { declaredAt: new Date().toISOString(), status: 'PARTIAL', build: before.frozen.local, source: before.receipt, expectedCases: 16,
  browsers: ['chromium', 'edge', 'firefox', 'webkit'], workers: 1, automaticRetries: 0, tracing: 'off', instrumentationChanged: true,
  filter: 'layout-contained ', inputs: hashes, scope: 'Only the four new native keyboard containment regressions, each in four engines. No full-suite, latency, physical-device or animated pixel-identity claim.' };
const handle = await open(`${directory}/${prefix}.json`, 'wx');
const log = await open(`${directory}/${prefix}.log`, 'wx');
await writeFile(raw, '', { flag: 'wx' });
try {
  const args = ['node_modules/@playwright/test/cli.js', 'test', 'e2e/live-keyboard.spec.ts', '--grep', receipt.filter, '--workers=1', '--retries=0', '--trace=off', '--reporter=list,json', `--output=${directory}/.playwright-artifacts-${prefix}`];
  receipt.command = [process.execPath, ...args];
  receipt.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true, env: { ...process.env, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4173', PLAYWRIGHT_BROWSERS: receipt.browsers.join(','), PLAYWRIGHT_JSON_OUTPUT_NAME: raw }, stdio: ['ignore', log.fd, log.fd] });
    child.once('error', reject); child.once('exit', resolve);
  });
  receipt.summary = summarizeReport(JSON.parse(await readFile(raw, 'utf8')));
  assert.equal(receipt.summary.totals.total, receipt.expectedCases);
  assert.deepEqual(receipt.summary.projects.map(row => row.project).sort(), [...receipt.browsers].sort());
  assert.equal(receipt.exitCode, 0);
  assert.equal(receipt.summary.totals.passed, receipt.expectedCases);
  receipt.status = 'PASS-SCOPED';
} catch (error) { receipt.status = 'FAILED'; receipt.error = { name: error.name, message: error.message }; }
finally {
  await log.close();
  receipt.sourceAfter = (await verifyFrozenSource(sourceFile)).receipt;
  receipt.inputsUnchanged = (await Promise.all(inputs.map(async file => hash(await readFile(file)) === hashes[file]))).every(Boolean);
  if (receipt.sourceAfter.mismatches.length || !receipt.inputsUnchanged) receipt.status = 'FAILED';
  receipt.finishedAt = new Date().toISOString();
  await handle.writeFile(JSON.stringify(receipt, null, 2)); await handle.close();
}
console.log(JSON.stringify({ status: receipt.status, build: receipt.build.version, totals: receipt.summary?.totals }));
process.exitCode = receipt.status === 'PASS-SCOPED' ? 0 : 1;
