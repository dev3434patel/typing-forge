import { spawn } from 'node:child_process';
import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const prefix = process.argv[2]; assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
const directory = 'audit/2026-10-21', output = `${directory}/${prefix}-browser-matrix.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const baseline = JSON.parse(await readFile('audit/mobile-games-static-2026-10-20/browser-partition.json', 'utf8'));
const features = ['arcade', 'arena', 'studio-polish', 'learning-analytics-v2', 'classroom-lite', 'progression', 'workspace-reset', 'progression-extras', 'friends', 'arcade-data-isolation', 'arcade-offline'].map(id => `e2e/${id}.spec.ts`);
const batches = [
  { id: 'new-features', files: features, workers: 2 },
  { id: 'existing', files: baseline.ordinary.files, workers: 2 },
  { id: 'isolated', files: baseline.isolated.files, workers: 1 },
  { id: 'first-input-timing', files: ['e2e/independent-challenge-timing.spec.ts'], workers: 2 },
];
const all = batches.flatMap(batch => batch.files), actual = (await readdir('e2e')).filter(file => file.endsWith('.spec.ts')).map(file => `e2e/${file}`).sort();
assert.equal(new Set(all).size, all.length); assert.deepEqual([...all].sort(), actual, 'Every current spec must be covered exactly once.');
const report = { declaredAt: new Date().toISOString(), status: 'PARTIAL', build: JSON.parse(await readFile('dist/offline-build.json', 'utf8')), browsers: ['chromium', 'edge', 'firefox', 'webkit'], automaticRetries: 0, filesCoveredExactlyOnce: actual.length, batches, results: [], scope: 'Full source-file partition; native credential cases require the separately guarded16-case backend run. Static artifacts have their separate root/subpath execution. Conditional skips remain explicit.' };
await writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx' });
for (const batch of batches) {
  const runPrefix = `${prefix}-${batch.id}`;
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${directory}/run-browser-checkpoint.mjs`, runPrefix, ...batch.files], { windowsHide: true, env: { ...process.env, SPAROWTYPE_BROWSER_WORKERS: String(batch.workers) }, stdio: 'inherit' });
    child.once('error', reject); child.once('exit', resolve);
  });
  report.results.push({ id: batch.id, exitCode, summary: JSON.parse(await readFile(`${directory}/${runPrefix}-summary.json`, 'utf8')) });
  await writeFile(output, JSON.stringify(report, null, 2));
}
report.finishedAt = new Date().toISOString(); report.status = report.results.every(row => row.exitCode === 0) ? 'PASS-SCOPED' : 'FAILED';
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, status: report.status, results: report.results.map(row => ({ id: row.id, exitCode: row.exitCode, totals: row.summary.totals })) }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
