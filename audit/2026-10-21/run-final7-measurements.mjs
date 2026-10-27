import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, open, readFile, writeFile } from 'node:fs/promises';
import { verifyFrozenSource } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_MEASUREMENT_WINDOW, '1', 'The parent must first finish all browser, build, native and load jobs.');
const directory = 'audit/2026-10-21', output = `${directory}/final7-measurements.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const sourceFile = `${directory}/final7-source.json`;
const initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.frozen.local.version, 'f3ac03affbc33168655a');
assert.deepEqual(initial.receipt.mismatches, []);
const stages = [
  { id: 'typing', args: [`${directory}/run-input-final.mjs`, 'final7'] },
  { id: 'workspaces', args: [`${directory}/measure-mobile-workspaces.mjs`, 'mobile-workspaces-final7', `${directory}/mobile-workspaces-final7-protocol.json`] },
  { id: 'lighthouse', args: [`${directory}/run-final-lighthouse.mjs`, 'final7-mobile'] },
];
const report = { declaredAt: new Date().toISOString(), status: 'PARTIAL', build: initial.frozen.local, source: initial.receipt, stages, automaticRetries: 0, resultFiltering: false, qualityOverrides: false, method: 'Sequential matched4xCPU typing runs, four mobile workspaces, then three fresh full-quality intro Lighthouse runs. Lighthouse enforces30quiet seconds before each run. No other audit browser/build/native/load jobs are permitted.', processes: [] };
await writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx' });
for (const stage of stages) {
  const current = await verifyFrozenSource(sourceFile);
  assert.deepEqual(current.receipt.mismatches, []);
  assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), initial.frozen.local);
  const logPath = `${directory}/final7-measurements-${stage.id}.log`, log = await open(logPath, 'wx');
  const writes = [];
  const began = performance.now(), row = { id: stage.id, startedAt: new Date().toISOString(), args: stage.args, log: logPath };
  report.processes.push(row);
  console.log(JSON.stringify({ stage: stage.id, status: 'STARTED' }));
  try {
    row.exitCode = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, stage.args, { windowsHide: true, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.on('data', data => { writes.push(log.write(data)); process.stdout.write(data); });
      child.stderr.on('data', data => { writes.push(log.write(data)); process.stderr.write(data); });
      child.once('error', reject); child.once('exit', resolve);
    });
  } finally { await Promise.all(writes); await log.close(); row.durationMs = performance.now() - began; row.finishedAt = new Date().toISOString(); }
  row.status = row.exitCode === 0 ? 'PASS-SCOPED' : 'FAILED';
  await writeFile(output, JSON.stringify(report, null, 2));
}
try {
  const input = JSON.parse(await readFile(`${directory}/final7-input-results.json`, 'utf8'));
  report.typingGate = { status: input.runs.length === 3 && input.runs.every(run => run.exact && run.attempts === 495 && run.accuracy === 100 && !run.errors.length && Number.isFinite(run.p98Ms) && run.p98Ms < 100) ? 'PASS-SCOPED' : 'FAILED', runs: input.runs, scope: 'Thresholded/quantized local lab Event Timing, not field INP or native mobile input.' };
} catch {
  report.typingGate = { status: 'FAILED', evidenceMissingOrUnreadable: true };
}
const after = await verifyFrozenSource(sourceFile);
report.sourceAfter = after.receipt;
report.finishedAt = new Date().toISOString();
report.status = report.processes.every(row => row.exitCode === 0) && report.typingGate.status === 'PASS-SCOPED' && !after.receipt.mismatches.length ? 'PASS-SCOPED' : 'FAILED';
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, status: report.status, processes: report.processes, typingGate: report.typingGate.status }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
