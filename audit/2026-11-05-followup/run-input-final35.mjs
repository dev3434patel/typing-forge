import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory = 'audit/2026-11-05-followup', prefix = process.argv[2]; assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
const buildFile = `${directory}/${prefix}-source.json`, build = JSON.parse(await readFile(buildFile, 'utf8')).local;
const sourceFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs', source = await readFile(sourceFile, 'utf8');
const previousDirectory = "const directory = 'audit/correction-experience-2026-10-20';";
assert.equal(source.split(previousDirectory).length, 2);
const driver = source.replace(previousDirectory, `const directory = '${directory}';`), driverFile = `${directory}/${prefix}-input-driver.mjs`;
await assert.rejects(access(driverFile), { code: 'ENOENT' });
const protocol = { declaredAt: new Date().toISOString(), build, runs: 3, automaticRetries: 0, resultFiltering: false, freshProfiles: true, cpuThrottle: 4, repetitions: 16, interCharacterDelayMs: 0, quietSeconds: 5, rotation: '390×844 to844×390 halfway through495 characters', originalDriver: sourceFile, originalDriverSha256: createHash('sha256').update(source).digest('hex'), driverOnlyChange: 'Report output directory', scope: 'Matched prior lab driver; thresholded/quantized Event Timing, not field INP. Intro disabled only for this isolated input benchmark; separately measured at normal full quality.' };
await assert.rejects(access(`${directory}/${prefix}-input-protocol.json`), { code: 'ENOENT' });
await writeFile(driverFile, driver); await writeFile(`${directory}/${prefix}-input-protocol.json`, JSON.stringify(protocol, null, 2));
const runs = [];
for (let run = 1; run <= 3; run++) {
  const name = `${prefix}-input-${run}`; await assert.rejects(access(`${directory}/${name}.json`), { code: 'ENOENT' }); await pause(5000);
  assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), build);
  const result = await new Promise((resolve, reject) => { const child = spawn(process.execPath, [driverFile], { windowsHide: true, env: { ...process.env, TYPING_BENCH_CPU_RATE: '4', TYPING_BENCH_REPETITIONS: '16', TYPING_BENCH_DELAY_MS: '0', TYPING_BENCH_SETTLE: '1', TYPING_BENCH_REPORT_NAME: name, TYPING_BENCH_BUILD_FILE: buildFile } }); let stdout = '', stderr = ''; child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; }); child.once('error', reject); child.once('exit', code => resolve({ code, stdout, stderr })); });
  await writeFile(`${directory}/${name}-process.json`, JSON.stringify(result, null, 2)); assert.equal(result.code, 0);
  const report = JSON.parse(await readFile(`${directory}/${name}.json`, 'utf8'));
  const value = { run, build: report.build.version, exact: report.finalTextExact, attempts: report.attempts, accuracy: report.inputAccuracy, p98Ms: report.p98ObservedTypingEventDurationMs, maxMs: report.maxObservedTypingEventDurationMs, rotation: report.resize, errors: report.errors }; runs.push(value); console.log(JSON.stringify(value)); await writeFile(`${directory}/${prefix}-input-results.json`, JSON.stringify({ protocol, runs }, null, 2));
}
