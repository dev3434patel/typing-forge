import { verifyPreparedSource37FrontendPerformance } from './source37-frontend-performance-preflight.mjs';
assert.equal(process.env.SPAROWTYPE_SOURCE37_FRONTEND_PERFORMANCE_WINDOW, '1', 'Wait for the separately coordinated source37 frontend performance window.');
assert.match(process.argv[2] ?? '', /^final37-mobile(?:-[a-z0-9]+)*$/, 'Use a fresh source37 Lighthouse output prefix.');
const source37PerformanceBefore = await verifyPreparedSource37FrontendPerformance();
import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const directory = path.resolve('audit/2026-11-05-followup'), prefix = process.argv[2];
assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
for (const name of [`${prefix}-protocol.json`, `${prefix}-results.json`, ...[1, 2, 3].map(run => `${prefix}-${run}.report.json`)]) await assert.rejects(access(path.join(directory, name)), { code: 'ENOENT' });
const tools = JSON.parse(await readFile('audit/correction-experience-2026-10-20/mobile-protocol.json', 'utf8'));
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const protocol = { declaredAt: new Date().toISOString(), build, url: 'http://127.0.0.1:4173/', runCount: 3, automaticRetries: 0, quietBeforeEachSeconds: 30, freshProfiles: true, qualityOverrides: false, introSkip: false, reducedMotionOverride: false, scoreFiltering: false, cli: tools.cli, chrome: tools.chrome, method: 'Three sequential fresh-profile Lighthouse mobile simulated-throttling runs with the complete first-visit 3D intro. All functional browser/native/load jobs must have exited; no user process is stopped.' };
await writeFile(path.join(directory, `${prefix}-protocol.json`), JSON.stringify(protocol, null, 2));
const runs = [];
for (let run = 1; run <= 3; run++) {
  await pause(30000);
  assert.deepEqual(await fetch(`${protocol.url}offline-build.json`).then(response => response.json()), build);
  const args = [protocol.cli, protocol.url, '--chrome-flags=--headless=new --no-sandbox', '--output=json', '--output=html', '--only-categories=performance,accessibility,best-practices,seo', '--quiet', `--output-path=${directory}/${prefix}-${run}`];
  const began = performance.now();
  const output = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env: { ...process.env, CHROME_PATH: protocol.chrome }, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
    child.once('error', reject); child.once('exit', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(path.join(directory, `${prefix}-${run}-process.json`), JSON.stringify({ args, durationMs: performance.now() - began, ...output }, null, 2));
  assert.equal(output.code, 0, `Lighthouse process${run}`);
  const report = JSON.parse(await readFile(path.join(directory, `${prefix}-${run}.report.json`), 'utf8'));
  const result = { run, build, lighthouseVersion: report.lighthouseVersion, fetchTime: report.fetchTime, scores: Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(key => [key, report.audits[key].numericValue])), warnings: report.runWarnings, runtimeError: report.runtimeError ?? null };
  runs.push(result); console.log(JSON.stringify(result));
  await writeFile(path.join(directory, `${prefix}-results.json`), JSON.stringify({ protocol, status: 'PARTIAL', runs }, null, 2));
}
const medianPerformance = [...runs].map(run => run.scores.performance).sort((a, b) => a - b)[1];
const pass = medianPerformance >= 95 && runs.every(run => !run.runtimeError && ['accessibility', 'best-practices', 'seo'].every(key => run.scores[key] === 100) && run.metrics['largest-contentful-paint'] <= 2500 && run.metrics['cumulative-layout-shift'] <= 0.05);
await writeFile(path.join(directory, `${prefix}-results.json`), JSON.stringify({ protocol, status: pass ? 'PASS-SCOPED' : 'FAILED', medianPerformance, runs }, null, 2));
process.exitCode = pass ? 0 : 1;

assert.deepEqual(await verifyPreparedSource37FrontendPerformance(), source37PerformanceBefore);
