import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import assert from 'node:assert/strict';

const directory = 'audit/correction-experience-2026-10-20';
const protocol = { declaredAt: new Date().toISOString(), build: JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local,
  runCount: 2, automaticRetries: 0, quietBeforeEachSeconds: 10, repetitions: 16, requestedDriverDelayMs: 0,
  runs: [{ name: 'typing-unthrottled', cpuRate: 1 }, { name: 'typing-throttled', cpuRate: 4 }],
  note: 'Single browser after functional jobs exit. Fonts/finite animations settle before measurement. The intro is disabled only for this isolated typing benchmark; separate Lighthouse runs use the full intro. Both runs rotate the viewport. Quantized Event Timing is lab evidence, not field INP or physical-device acceptance.' };
await writeFile(`${directory}/typing-protocol.json`, JSON.stringify(protocol, null, 2));
for (const run of protocol.runs) {
  await pause(protocol.quietBeforeEachSeconds * 1000);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`${directory}/measure-typing.mjs`], { windowsHide: true,
      env: { ...process.env, TYPING_BENCH_SETTLE: '1', TYPING_BENCH_REPETITIONS: String(protocol.repetitions), TYPING_BENCH_DELAY_MS: '0', TYPING_BENCH_CPU_RATE: String(run.cpuRate), TYPING_BENCH_REPORT_NAME: run.name } });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, stdout, stderr }));
  });
  await writeFile(`${directory}/${run.name}-process.json`, JSON.stringify(result, null, 2));
  assert.equal(result.code, 0, run.name);
  const report = JSON.parse(await readFile(`${directory}/${run.name}.json`, 'utf8'));
  console.log(JSON.stringify({ name: run.name, exact: report.finalTextExact, attempts: report.attempts,
    accuracy: report.inputAccuracy, measuredWpm: report.correctCharacterWpm, p98ObservedEventMs: report.p98ObservedTypingEventDurationMs,
    maxObservedEventMs: report.maxObservedTypingEventDurationMs, rotation: report.resize }));
}
