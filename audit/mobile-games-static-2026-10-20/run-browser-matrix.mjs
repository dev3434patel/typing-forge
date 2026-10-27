import { spawn } from 'node:child_process';
import { readFile, writeFile, access, open } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { summarizeReport } from './summarize-browsers.mjs';

const directory = path.resolve('audit/mobile-games-static-2026-10-20');
const phase = process.argv[2];
assert.match(phase ?? '', /^after-[1-9][0-9]*$/);
const requestedGroup = process.argv[3] ?? 'all';
assert.ok(['all', 'ordinary', 'isolated'].includes(requestedGroup));
const selectedGroups = requestedGroup === 'all' ? ['ordinary', 'isolated'] : [requestedGroup];
const build = JSON.parse(await readFile(`${directory}/${phase}-build.json`, 'utf8')).local;
const partition = JSON.parse(await readFile(`${directory}/browser-partition.json`, 'utf8'));
const baseURL = 'http://127.0.0.1:4173';
const protocol = { declaredAt: new Date().toISOString(), phase, build, baseURL,
  browsers: ['chromium', 'edge', 'firefox', 'webkit'], automaticRetries: 0,
  partition, selectedGroups, groups: [], completed: false };
const protocolFile = `${directory}/${phase}-browser-matrix.json`;
await assert.rejects(access(protocolFile), { code: 'ENOENT' });
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
let failed = false;
for (const group of selectedGroups) {
  assert.deepEqual(await fetch(`${baseURL}/offline-build.json`).then(response => response.json()), build);
  const selected = partition[group];
  const prefix = `${phase}-browser-${group}`;
  const reportFile = `${directory}/${prefix}.json`;
  const logFile = `${directory}/${prefix}.log`;
  await assert.rejects(access(reportFile), { code: 'ENOENT' });
  const handle = await open(logFile, 'wx');
  const args = ['node_modules/@playwright/test/cli.js', 'test', ...selected.files,
    `--workers=${selected.workers}`, '--retries=0',
    `--output=${directory}/.playwright-artifacts-${prefix}`, '--reporter=list,json'];
  console.log(JSON.stringify({ group, files: selected.files.length, workers: selected.workers, build: build.version, startedAt: new Date().toISOString() }));
  const began = performance.now();
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL, PLAYWRIGHT_BROWSERS: protocol.browsers.join(','), PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile },
      stdio: ['ignore', handle.fd, handle.fd] });
    child.on('error', reject); child.on('exit', resolve);
  });
  await handle.close();
  const report = JSON.parse(await readFile(reportFile, 'utf8'));
  const summary = summarizeReport(report);
  await writeFile(`${directory}/${prefix}-summary.json`, JSON.stringify(summary, null, 2));
  protocol.groups.push({ group, code, durationMs: performance.now() - began, logFile, reportFile, summary });
  await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
  console.log(JSON.stringify({ group, code, durationMs: performance.now() - began, totals: summary.totals }));
  if (code !== 0) failed = true;
}
protocol.completed = true;
await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
if (failed) process.exitCode = 1;
