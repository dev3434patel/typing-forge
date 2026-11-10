// Independent assessment only. Never launches, retries or filters a trial.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-11-05-followup', prefix = 'final36';
const output = `${directory}/${prefix}-input-independent-assessment.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const expectedBuild = 'd89f84d74519bf2bbae0';
const inputs = [], checks = [], problems = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) });
async function bytes(file, required = true) {
  try {
    const value = await readFile(file);
    inputs.push({ file, sha256: createHash('sha256').update(value).digest('hex'), bytes: value.length });
    return value;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    inputs.push({ file, status: required ? 'MISSING-REQUIRED' : 'NOT-PRESENT-OPTIONAL', sha256: null });
    if (required) problems.push({ file, error: 'MISSING-REQUIRED' });
    return null;
  }
}
async function json(file, required = true) {
  const value = await bytes(file, required);
  if (value === null) return null;
  try { return JSON.parse(value); }
  catch (error) { problems.push({ file, error: 'INVALID-JSON', message: error.message }); return null; }
}
await bytes(import.meta.filename);
await bytes(`${directory}/run-input-final36.mjs`);
const frozen = await json(`${directory}/${prefix}-source.json`);
const protocol = await json(`${directory}/${prefix}-input-protocol.json`);
const resultSet = await json(`${directory}/${prefix}-input-results.json`);
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const original = await bytes(originalFile);
const driver = await bytes(`${directory}/${prefix}-input-driver.mjs`);
const oldDirectory = "const directory = 'audit/correction-experience-2026-10-20';";
check('driver differs from the original only at its single output-directory declaration', original !== null && driver !== null && original.toString().split(oldDirectory).length === 2 && driver.toString() === original.toString().replace(oldDirectory, `const directory = '${directory}';`));
check('protocol binds the exact original immutable driver SHA256', protocol?.originalDriver === originalFile && original !== null && protocol.originalDriverSha256 === createHash('sha256').update(original).digest('hex') && protocol.driverOnlyChange === 'Report output directory');
check('all three declared trials retain zero retries, zero filtering and the original scenario', protocol?.runs === 3 && protocol.automaticRetries === 0 && protocol.resultFiltering === false && protocol.freshProfiles === true && protocol.cpuThrottle === 4 && protocol.repetitions === 16 && protocol.interCharacterDelayMs === 0 && protocol.quietSeconds === 5 && protocol.rotation === '390×844 to844×390 halfway through495 characters');
check('actual frozen build matches source36 and its served manifest', frozen?.local?.version === expectedBuild && isDeepStrictEqual(frozen.local, frozen.served) && isDeepStrictEqual(protocol?.build, frozen.local));
check('result set retains the exact declared protocol and all three ordered runs', isDeepStrictEqual(resultSet?.protocol, protocol) && resultSet?.runs?.length === 3 && resultSet.runs.every((row, index) => row.run === index + 1));
let sourceAfter = null;
try { sourceAfter = (await verifyFrozenSource(`${directory}/${prefix}-source.json`)).receipt; }
catch (error) { problems.push({ file: `${directory}/${prefix}-source.json`, error: 'SOURCE-VERIFICATION-FAILED', message: error.message }); }
check('all 506 frozen production files remain unchanged', sourceAfter?.compared === 506 && sourceAfter.mismatches.length === 0 && sourceAfter.expectedBuild === expectedBuild);
const runs = [];
for (let run = 1; run <= 3; run++) {
  const file = `${directory}/${prefix}-input-${run}.json`;
  const raw = await json(file);
  const process = await json(`${directory}/${prefix}-input-${run}-process.json`);
  const declared = resultSet?.runs?.find(row => row.run === run);
  const derived = raw ? { run, build: raw.build?.version, exact: raw.finalTextExact, attempts: raw.attempts, accuracy: raw.inputAccuracy, p98Ms: raw.p98ObservedTypingEventDurationMs, maxMs: raw.maxObservedTypingEventDurationMs, rotation: raw.resize, errors: raw.errors } : null;
  const tests = {
    originalChildExitedSuccessfully: process?.code === 0,
    correctActualBuild: raw !== null && isDeepStrictEqual(raw.build, frozen?.local) && isDeepStrictEqual(raw.servedBuild, frozen?.local),
    originalTimingScenario: raw?.origin === 'http://127.0.0.1:4173' && isDeepStrictEqual(raw.viewport, { width: 390, height: 844 }) && raw.cpuThrottle === 4 && raw.requestedInterCharacterDelayMs === 0 && raw.fontsAndFiniteAnimationsSettled === true,
    exact495AttemptsAndEventsAt100Percent: raw?.targetUnits === 495 && raw.finalTextExact === true && raw.attempts === 495 && raw.inputAccuracy === 100 && raw.observedBeforeInputEvents === 495,
    retained247CharacterRotationPrefixWithoutOverflow: raw?.resize?.beforeLength === 247 && raw.resize.afterLength === 247 && raw.resize.retainedExactly === true && raw.resize.overflow === false,
    noBrowserOrPageErrors: Array.isArray(raw?.errors) && raw.errors.length === 0,
    observedEventTimingAvailable: raw?.eventTimingSupported === true && Number.isInteger(raw.eventTimingEntriesAtLeast16ms) && raw.eventTimingEntriesAtLeast16ms > 0,
    everyTrialStrictP98Below100Ms: Number.isFinite(raw?.p98ObservedTypingEventDurationMs) && raw.p98ObservedTypingEventDurationMs >= 0 && raw.p98ObservedTypingEventDurationMs < 100,
    maximumRetainedAndInternallyConsistentWithoutANewMaxThreshold: Number.isFinite(raw?.maxObservedTypingEventDurationMs) && raw.maxObservedTypingEventDurationMs >= raw.p98ObservedTypingEventDurationMs,
    aggregateIsAnExactUnfilteredProjectionOfThisRawTrial: derived !== null && isDeepStrictEqual(derived, declared),
  };
  runs.push({ run, raw: file, status: Object.values(tests).every(Boolean) ? 'PASS-SCOPED' : 'FAILED', p98Ms: raw?.p98ObservedTypingEventDurationMs ?? null, maxMs: raw?.maxObservedTypingEventDurationMs ?? null, tests });
}
const outer = await json(`${directory}/${prefix}-input-process.json`, false);
if (outer) check('optional outer wrapper process confirms successful completion when present', (outer.exit_code ?? outer.exitCode ?? outer.code) === 0);
const status = checks.every(row => row.pass) && runs.every(row => row.status === 'PASS-SCOPED') && problems.length === 0 ? 'PASS-SCOPED' : 'FAILED';
const report = { status, recordedAt: new Date().toISOString(), build: expectedBuild, criterion: 'Each of all three original-driver trials must independently have observed typing-event p98 strictly below100ms,495 exact insertion attempts/events,100% input accuracy, retained247-character rotation prefix,zero browser/page errors and no overflow. No median, selection, retry or original-result rewrite.', checks, runs, problems, sourceAfter, inputs, limits: 'Desktop Chromium390x844 at4xCPU and844x390 rotation; thresholded/quantized Event Timing rather than physical-device or field INP. Maxima are retained without inventing a maximum-event latency criterion. Intro is disabled only in this isolated benchmark and separately tested at full quality.', existingHarnessesOrResultsModified: false, trialsExecutedByAssessment: 0 };
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status, output, p98Ms: runs.map(row => row.p98Ms), maxMs: runs.map(row => row.maxMs), failedChecks: checks.filter(row => !row.pass).map(row => row.name), failedRuns: runs.filter(row => row.status !== 'PASS-SCOPED').map(row => row.run), problems }));
process.exitCode = status === 'PASS-SCOPED' ? 0 : 1;
