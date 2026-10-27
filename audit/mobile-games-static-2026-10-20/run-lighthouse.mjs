import { spawn } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const directory = path.resolve('audit/mobile-games-static-2026-10-20');
const phase = process.argv[2];
assert.match(phase ?? '', /^after-[1-9][0-9]*$/);
const prefix = `${phase}-mobile`;
for (const name of [`${prefix}-protocol.json`, `${prefix}-results.json`, ...[1, 2, 3].map(run => `${prefix}-${run}.report.json`)]) {
  const exists = await access(`${directory}/${name}`).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
  assert.equal(exists, false, `Preserve the existing measurement: ${name}`);
}
const previous = JSON.parse(await readFile('audit/correction-experience-2026-10-20/mobile-protocol.json', 'utf8'));
const build = JSON.parse(await readFile(`${directory}/${phase}-build.json`, 'utf8')).local;
const protocol = { declaredAt: new Date().toISOString(), runCount: 3, automaticRetries: 0,
  quietBeforeEachSeconds: 20, qualityOverrides: false, introSkip: false, reducedMotionOverride: false,
  freshProfiles: true, scoreFiltering: false, build, url: 'http://127.0.0.1:4173/', cli: previous.cli, chrome: previous.chrome,
  method: 'Default Lighthouse mobile simulated throttling; full normal first-visit intro. Sequential runs after functional browser jobs have exited. No user processes are stopped or result-based retries performed.' };
await writeFile(`${directory}/${prefix}-protocol.json`, JSON.stringify(protocol, null, 2));
const runs = [];
for (let run = 1; run <= protocol.runCount; run++) {
  await pause(20_000);
  assert.deepEqual(await fetch(`${protocol.url}offline-build.json`).then(response => response.json()), build);
  const args = [protocol.cli, protocol.url, '--chrome-flags=--headless=new --no-sandbox', '--output=json', '--output=html', '--only-categories=performance,accessibility,best-practices,seo', '--quiet', `--output-path=${directory}/${prefix}-${run}`];
  const began = performance.now();
  const output = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env: { ...process.env, CHROME_PATH: protocol.chrome }, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject); child.on('exit', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(`${directory}/${prefix}-${run}-process.json`, JSON.stringify({ command: [process.execPath, ...args], durationMs: performance.now() - began, ...output }, null, 2));
  assert.equal(output.code, 0, `Lighthouse run ${run}`);
  const report = JSON.parse(await readFile(`${directory}/${prefix}-${run}.report.json`, 'utf8'));
  const result = { run, build, lighthouseVersion: report.lighthouseVersion, fetchTime: report.fetchTime,
    scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
    metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(key => [key, report.audits[key].numericValue])), warnings: report.runWarnings, runtimeError: report.runtimeError ?? null };
  runs.push(result);
  await writeFile(`${directory}/${prefix}-results.json`, JSON.stringify({ protocol, runs }, null, 2));
  console.log(JSON.stringify(result));
}
if (runs.some(run => run.runtimeError || Object.values(run.scores).some(score => score < 95))) process.exitCode = 1;
