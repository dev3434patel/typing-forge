import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { verifyFrozenSource } from './artifact-verification.mjs';

const prefix = process.argv[2];
assert.match(prefix ?? '', /^final6(?:-[a-z0-9]+)*$/);
const directory = 'audit/2026-10-21';
const output = `${directory}/${prefix}-confirmations.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const matrix = JSON.parse(await readFile(`${directory}/final6-browser-matrix.json`, 'utf8'));
assert.equal(matrix.results.length, 3, 'The original complete matrix must finish first.');
assert.ok(matrix.finishedAt);
const resetSpec = await readFile('e2e/game-data-controls.spec.ts', 'utf8');
assert.ok(resetSpec.includes('hasText: "This device workspace has been reset."'));
assert.ok(!resetSpec.includes('hasText: "Guest workspace reset."'));
const source = await verifyFrozenSource(`${directory}/final6-source.json`);
assert.deepEqual(source.receipt.mismatches, []);
const stages = [
  { id: 'edge-confirmation', browsers: 'edge', files: ['e2e/arcade.spec.ts', 'e2e/progression.spec.ts'], reason: 'Separate serial unchanged-budget observation of the four original Edge failure scopes, including all tests in their affected files.' },
  { id: 'reset-copy-confirmation', browsers: 'chromium,edge,firefox,webkit', files: ['e2e/game-data-controls.spec.ts'], reason: 'Exact successful completion-copy assertion updated after the original matrix; all storage and other-owner isolation checks are unchanged.' },
  { id: 'offline-confirmation', browsers: 'firefox,webkit', files: ['e2e/offline-pwa.spec.ts'], reason: 'Separate serial unchanged-budget checks of the original full-workflow timeout scopes. The two original failures remain retained.' },
];
const report = { declaredAt: new Date().toISOString(), status: 'PARTIAL', build: source.frozen.local, originalMatrix: 'final6-browser-matrix.json', source: source.receipt, workers: 1, automaticRetries: 0, timeoutChanges: false, resultFiltering: false, stages, results: [], scope: 'Declared affected-file confirmations, not a rewritten full-suite pass. No original receipt is replaced.' };
await writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx' });
for (const stage of stages) {
  const runPrefix = `${prefix}-${stage.id}`;
  const args = [`${directory}/run-browser-checkpoint.mjs`, runPrefix, ...stage.files];
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { windowsHide: true, env: { ...process.env, SPAROWTYPE_AUDIT_BROWSERS: stage.browsers, SPAROWTYPE_BROWSER_WORKERS: '1' }, stdio: 'inherit' });
    child.once('error', reject); child.once('exit', resolve);
  });
  report.results.push({ id: stage.id, exitCode, summary: JSON.parse(await readFile(`${directory}/${runPrefix}-summary.json`, 'utf8')) });
  await writeFile(output, JSON.stringify(report, null, 2));
}
const after = await verifyFrozenSource(`${directory}/final6-source.json`);
report.sourceAfter = after.receipt;
report.finishedAt = new Date().toISOString();
report.status = report.results.every(row => row.exitCode === 0) && !after.receipt.mismatches.length ? 'PASS-SCOPED' : 'FAILED';
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, status: report.status, results: report.results.map(row => ({ id: row.id, exitCode: row.exitCode, totals: row.summary.totals })) }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
