import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const directory = 'audit/2026-10-21';
const prefix = 'final18-pwa-before-fix-jsx-corrected';
const sourceFile = `${directory}/final17-source.json`;
const spec = 'e2e/pwa-snapshot-consistency.spec.ts';
const output = `${directory}/${prefix}-source.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const sourceBytes = await readFile(sourceFile);
const before = await verifyFrozenSource(sourceFile);
assert.equal(before.frozen.local.version, '0572d723495d6be303a8');
assert.equal(before.receipt.compared, 499);
assert.deepEqual(before.receipt.mismatches, []);
const specHash = hash(await readFile(spec));
assert.equal(specHash, '2a0dfef0a87a97d7d146f56ad9eb2154e7d7d08e95ea526e78fc545635d2c228');
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), sourceBefore: before.receipt,
  manifestSha256Before: hash(sourceBytes), spec, specHash, expectedCases: 16,
  scope: 'Deterministic real React consumer/store-boundary regression against unchanged source17 components. Owned controlled store and layout stubs; not a native PWA or hosted/device check.',
  expectedOldOutcome: 'Exactly four render-to-passive-gap failures; twelve before-render/after-subscription/unmount controls pass.',
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
try {
  const env = { ...process.env, SPAROWTYPE_AUDIT_BROWSERS: 'chromium,edge,firefox,webkit', SPAROWTYPE_BROWSER_WORKERS: '1', PHP_E2E_ACCEPTANCE: '0' };
  for (const name of ['SPAROWTYPE_STATIC_OUTPUTS', 'FORGE_E2E_AUTH_EMAIL', 'FORGE_E2E_AUTH_PASSWORD', 'PHP_E2E_RACE_HOST_EMAIL', 'PHP_E2E_RACE_HOST_PASSWORD', 'PHP_E2E_RACE_OPPONENT_EMAIL', 'PHP_E2E_RACE_OPPONENT_PASSWORD']) delete env[name];
  report.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${directory}/run-browser-checkpoint-final17.mjs`, prefix, spec], { env, windowsHide: true, stdio: 'inherit' });
    child.once('error', reject); child.once('exit', resolve);
  });
  const summary = JSON.parse(await readFile(`${directory}/${prefix}-summary.json`, 'utf8'));
  report.totals = summary.totals;
  report.failureTitles = summary.failures.map(failure => ({ project: failure.project, title: failure.title }));
  report.status = report.exitCode === 1 && summary.totals.total === 16 && summary.totals.passed === 12 && summary.totals.failed === 4 && summary.totals.skipped === 0 && summary.totals.flaky === 0 && summary.failures.every(failure => failure.title.includes('recover a publication between render and passive subscription')) ? 'REPRODUCED' : 'FAILED';
} catch (error) {
  report.status = 'FAILED'; report.error = { name: error.name, message: error.message };
} finally {
  report.sourceAfter = (await verifyFrozenSource(sourceFile)).receipt;
  report.manifestSha256After = hash(await readFile(sourceFile));
  report.specUnchanged = hash(await readFile(spec)) === specHash;
  if (report.sourceAfter.mismatches.length || report.sourceAfter.compared !== 499 || report.manifestSha256After !== report.manifestSha256Before || !report.specUnchanged) report.status = 'FAILED';
  report.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ output, status: report.status, totals: report.totals }));
process.exitCode = report.status === 'REPRODUCED' ? 0 : 1;
