import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import assert from 'node:assert/strict';

const directory = 'audit/mobile-games-static-2026-10-20';
const phase = process.argv[2];
assert.match(phase ?? '', /^(before|after-[1-9][0-9]*)$/);
const buildFile = `${directory}/${phase}-build.json`;
const build = JSON.parse(await readFile(buildFile, 'utf8')).local;
const protocol = { phase, declaredAt: new Date().toISOString(), build, runs: 3,
  cpuThrottle: 4, repetitions: 16, interCharacterDelayMs: 0, freshProfiles: true,
  automaticRetries: 0, resultFiltering: false, rotation: '390×844 to 844×390 after 247 of 495 characters',
  method: 'Same browser input driver as the prior correction audit, with settled fonts and finite animations. Intro disabled only for isolated input measurement; full-quality intro measured separately with Lighthouse. Event Timing is thresholded/quantized lab evidence, not field INP.' };
await writeFile(`${directory}/${phase}-input-protocol.json`, JSON.stringify(protocol, null, 2));
let benchmark = await readFile('audit/correction-experience-2026-10-20/measure-typing.mjs', 'utf8');
benchmark = benchmark.replace("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`);
const benchmarkFile = `${directory}/measure-input.mjs`;
await writeFile(benchmarkFile, benchmark);
const runs = [];
for (let run = 1; run <= protocol.runs; run++) {
  await pause(5000);
  const name = `${phase}-input-${run}`;
  const processResult = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [benchmarkFile], { windowsHide: true, env: { ...process.env,
      TYPING_BENCH_CPU_RATE: '4', TYPING_BENCH_REPETITIONS: '16', TYPING_BENCH_DELAY_MS: '0',
      TYPING_BENCH_SETTLE: '1', TYPING_BENCH_REPORT_NAME: name, TYPING_BENCH_BUILD_FILE: buildFile } });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(`${directory}/${name}-process.json`, JSON.stringify(processResult, null, 2));
  assert.equal(processResult.code, 0, `Input measurement ${name} must complete without retries`);
  const report = JSON.parse(await readFile(`${directory}/${name}.json`, 'utf8'));
  const result = { run, build: report.build.version, exact: report.finalTextExact, attempts: report.attempts,
    accuracy: report.inputAccuracy, p98Ms: report.p98ObservedTypingEventDurationMs,
    maxMs: report.maxObservedTypingEventDurationMs, correctCharacterWpm: report.correctCharacterWpm,
    rotation: report.resize, errors: report.errors };
  runs.push(result);
  await writeFile(`${directory}/${phase}-input-results.json`, JSON.stringify({ protocol, runs }, null, 2));
  console.log(JSON.stringify(result));
}
