import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
const directory = 'audit/keyboard-viewport-2026-10-20';
const current = JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local;
const previousFile = 'hosting-archive/1792512026550/public_html/offline-build.json';
const previous = JSON.parse(await readFile(previousFile, 'utf8'));
assert.equal(previous.version, '5c8082579f9884ef34fc');
const protocol = { declaredAt: new Date().toISOString(), runCount: 2, order: ['previous', 'current'], quietBeforeEachSeconds: 20, automaticRetries: 0, scoreFiltering: false, cpuThrottle: 4, targetUnits: 247, freshBrowserProfiles: true, settleFontsAndFiniteAnimations: true, previous, current, method: 'One matched sequential pair. Same browser, device viewport, passage, benchmark code and CPU throttle; archived previous public package on owned localhost4174 and current production preview on4173. This is a finite diagnostic comparison, not field INP or a universal speed guarantee.' };
await writeFile(`${directory}/typing-comparison-protocol.json`, JSON.stringify(protocol, null, 2));
const runs = [];
for (const name of protocol.order) {
  await pause(20_000);
  const reportName = `typing-${name}-quiet`;
  const env = { ...process.env, TYPING_BENCH_ORIGIN: name === 'previous' ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:4173', TYPING_BENCH_SETTLE: '1', TYPING_BENCH_REPORT_NAME: reportName, TYPING_BENCH_BUILD_FILE: name === 'previous' ? previousFile : `${directory}/source-build.json` };
  const processResult = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${directory}/measure-typing.mjs`], { env, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => stdout += data); child.stderr.on('data', data => stderr += data);
    child.on('error', reject); child.on('exit', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(`${directory}/${reportName}-process.json`, JSON.stringify(processResult, null, 2));
  assert.equal(processResult.code, 0);
  runs.push({ name, ...JSON.parse(await readFile(`${directory}/${reportName}.json`, 'utf8')) });
}
const report = { protocol, runs, currentToPreviousElapsedRatio: runs[1].elapsedMs / runs[0].elapsedMs, currentToPreviousWpmRatio: runs[1].correctCharacterWpm / runs[0].correctCharacterWpm, priorImmediateMeasurementRetainedAt: 'typing-burst.json', interpretation: 'Both measured runs are reported without filtering. Read timings as local lab observations; input preservation is checked separately from event latency.' };
await writeFile(`${directory}/typing-comparison.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
