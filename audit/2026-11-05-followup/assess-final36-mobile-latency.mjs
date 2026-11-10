// Pure evidence assessment. This never launches, repeats, filters or changes a
// browser measurement, and never changes the original functional wrapper result.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

const prefix = process.argv[2];
assert.match(prefix ?? '', /^mobile-workspaces-final36-static(?:-[a-z0-9]+)*$/);
assert.equal(process.argv.length, 3);
const directory = 'audit/2026-11-05-followup';
const output = `${directory}/${prefix}-latency-assessment.json`;
await assert.rejects(access(output), { code: 'ENOENT' }, 'Earlier evidence must never be replaced.');
const sourceFile = `${directory}/final36-source.json`;
const expectedBuild = process.env.SPAROWTYPE_FINAL36_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/);
const source = await verifyFrozenSource(sourceFile);
assert.equal(source.frozen.local.version, expectedBuild);
assert.equal(source.receipt.compared, 506);
assert.deepEqual(source.receipt.mismatches, []);
const rawFile = `${directory}/${prefix}.json`;
const processFile = `${directory}/${prefix}-process.json`;
const protocolFile = `${directory}/${prefix}-protocol.json`;
const rawBytes = await readFile(rawFile);
const processBytes = await readFile(processFile);
const protocolBytes = await readFile(protocolFile);
const raw = JSON.parse(rawBytes);
const processReceipt = JSON.parse(processBytes);
const protocol = JSON.parse(protocolBytes);
assert.equal(protocol.sourceFile, sourceFile);
assert.equal(protocol.sourceExpectedBuild, expectedBuild);
assert.equal(raw.build.version, protocol.expectedBuild);
assert.equal(raw.completed, true);
assert.equal(raw.watchdogExpired, false);
assert.deepEqual(raw.cases.map(item => item.id), ['learn', 'course', 'local-bot', 'games']);
const targetMs = 100;
const cases = raw.cases.map(item => {
  const timing = item.timing;
  const p98 = timing?.p98ObservedTypingEventDurationMs;
  const measured = timing?.eventTimingSupported === true &&
    Number.isFinite(p98) && p98 >= 0 &&
    Number.isInteger(timing?.observedTypingEventsAtLeast16ms) &&
    timing.observedTypingEventsAtLeast16ms > 0;
  return {
    id: item.id,
    functionalPassed: item.passed === true,
    eventTimingSupported: timing?.eventTimingSupported ?? null,
    observedTypingEventsAtLeast16ms: timing?.observedTypingEventsAtLeast16ms ?? null,
    p98ObservedTypingEventDurationMs: p98 ?? null,
    targetMs,
    comparison: '<',
    latencyStatus: !measured ? 'UNVERIFIED' : p98 < targetMs ? 'PASS-SCOPED' : 'FAILED',
  };
});
const functionalPassed = processReceipt.status === 'PASS-SCOPED' && cases.every(item => item.functionalPassed);
const status = !functionalPassed || cases.some(item => item.latencyStatus === 'FAILED') ? 'FAILED' :
  cases.some(item => item.latencyStatus === 'UNVERIFIED') ? 'UNVERIFIED' : 'PASS-SCOPED';
const report = {
  assessedAt: new Date().toISOString(), status, source: source.receipt,
  inputs: Object.fromEntries([[rawFile, rawBytes], [processFile, processBytes], [protocolFile, protocolBytes]].map(([file, bytes]) => [file, hash(bytes)])),
  originalFunctionalWrapperStatus: processReceipt.status,
  functionalPassed,
  cases,
  acceptance: 'All four original cases must remain functionally valid and have measured p98 observed typing-event duration strictly below100ms. A null or unsupported measurement is UNVERIFIED and never becomes zero.',
  originalWrapperCriteriaChanged: false,
  browserMeasurementsExecuted: 0,
  automaticRetries: 0,
  resultFiltering: false,
  fieldInpClaimed: false,
  scope: 'Assessment of the entire existing four-case, 4x CPU-throttled laboratory measurement including its unchanged typing/result observation window. This is not field INP or a physical-device claim.',
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status, originalFunctionalWrapperStatus: processReceipt.status, cases }));
process.exitCode = status === 'PASS-SCOPED' ? 0 : 1;
