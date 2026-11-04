// Explicit focused confirmation only; original source27 failures remain retained.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_NOV02_MOTION_CONFIRMATION, '1', 'Wait for the separately coordinated confirmation window.');
assert.equal(process.env.SPAROWTYPE_AUDIT_BROWSERS, 'chromium,edge,firefox,webkit');
assert.equal(process.env.SPAROWTYPE_BROWSER_WORKERS, '1');
assert.equal(process.env.SPAROWTYPE_FINAL27_BUILD_ID, '11de46af5d4a80e0e830');
assert.equal(process.argv.length, 2, 'This confirmation has fixed files and no grep or extra CLI filters.');
const directory = 'audit/2026-11-02';
const prefix = 'final27-nov02-motion-confirmation';
const sourceFile = 'audit/2026-10-27/final27-source.json';
const runner = directory + '/run-browser-checkpoint-final27.mjs';
const originalRunner = 'audit/2026-10-27/run-browser-checkpoint-final27.mjs';
const files = ['e2e/live-keyboard.spec.ts', 'e2e/typing-render-budget.spec.ts'];
const output = directory + '/' + prefix + '-guard.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const before = await verifyFrozenSource(sourceFile);
assert.equal(before.frozen.local.version, process.env.SPAROWTYPE_FINAL27_BUILD_ID);
assert.equal(before.receipt.compared, 505);
assert.deepEqual(before.receipt.mismatches, []);
assert.equal(JSON.parse(await readFile('dist/offline-build.json', 'utf8')).version, before.frozen.local.version);
const original = await readFile(originalRunner, 'utf8');
const from = "path.resolve('audit/2026-10-27')";
const to = "path.resolve('audit/2026-11-02')";
assert.equal(original.split(from).length, 2);
assert.equal(await readFile(runner, 'utf8'), original.replace(from, to), 'Only the report output directory may differ in the cloned generic runner.');
const inputs = [import.meta.filename, runner, originalRunner, sourceFile, ...files, 'playwright.config.ts'];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const report = {
  declaredAt: new Date().toISOString(), status: 'RUNNING', sourceBefore: before.receipt,
  build: before.frozen.local.version, files, browsers: ['chromium', 'edge', 'firefox', 'webkit'],
  workers: 1, automaticRetries: 0, tracing: 'off', grepOrCaseFiltering: false,
  sourceManifestRemainsHistorical27: true, expectedSourceFiles: 505, inputHashes,
  originalFailureReport: 'audit/2026-10-27/final27-browser-matrix.json',
  correction: 'Exactly two stale90ms expectations become exact55ms, matching the already-frozen2D transform contract.240ms ripple, transform property,2px motion, geometry, colors and all other assertions/deadlines remain unchanged.',
  scope: 'Entire two affected spec files across all four engines. No new typing latency, Lighthouse, native backend, physical-device or hosted claim.',
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
try {
  const child = spawn(process.execPath, [runner, prefix, ...files], { windowsHide: true, stdio: 'inherit', env: process.env });
  report.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  report.childExited = true;
  report.summary = JSON.parse(await readFile(directory + '/' + prefix + '-summary.json', 'utf8'));
  report.protocol = JSON.parse(await readFile(directory + '/' + prefix + '-protocol.json', 'utf8'));
} catch (error) {
  report.failure = { name: error.name, message: String(error.message).slice(0, 600) };
} finally {
  try {
    report.sourceAfter = (await verifyFrozenSource(sourceFile)).receipt;
    report.inputsUnchanged = (await Promise.all(inputs.map(async file => hash(await readFile(file)) === inputHashes[file]))).every(Boolean);
    const totals = report.summary?.totals;
    const projects = report.summary?.projects?.map(row => row.project).sort();
    const passed = !report.failure && report.childExited && report.exitCode === 0 &&
      report.sourceAfter.compared === 505 && report.sourceAfter.mismatches.length === 0 && report.inputsUnchanged &&
      totals?.total > 0 && totals.failed === 0 && totals.flaky === 0 && totals.skipped === 0 &&
      JSON.stringify(projects) === JSON.stringify(['chromium', 'edge', 'firefox', 'webkit'].sort()) &&
      report.protocol?.workers === 1 && report.protocol?.automaticRetries === 0 && report.protocol?.tracing === 'off' &&
      Object.values(report.protocol?.integrity ?? {}).length === 3 && Object.values(report.protocol.integrity).every(Boolean);
    report.status = passed ? 'PASS-SCOPED' : 'FAILED';
  } catch (error) {
    report.status = 'FAILED'; report.finalizationFailure = { name: error.name, message: String(error.message).slice(0, 600) };
  }
  report.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ output, status: report.status, exitCode: report.exitCode, totals: report.summary?.totals }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
