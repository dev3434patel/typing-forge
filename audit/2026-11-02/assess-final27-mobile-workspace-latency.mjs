// Independent interpretation of retained reports. Starts no measurement.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const resultFile = 'audit/2026-10-27/mobile-workspaces-final27-static.json';
const processFile = 'audit/2026-10-27/mobile-workspaces-final27-static-process.json';
const bytes = await readFile(resultFile), processBytes = await readFile(processFile);
const result = JSON.parse(bytes), processReport = JSON.parse(processBytes);
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(result.protocol.cpuThrottle, 4); assert.deepEqual(result.protocol.viewport, { width: 390, height: 844 });
assert.equal(result.protocol.isMobile, true); assert.equal(result.protocol.hasTouch, true);
assert.equal(result.protocol.automaticRetries, 0); assert.equal(result.protocol.resultFiltering, false);
assert.equal(result.build.version, 'fac344923bbf9cbde394');
assert.equal(result.protocol.sourceExpectedBuild, '11de46af5d4a80e0e830');
assert.equal(processReport.exitCode, 0); assert.deepEqual(processReport.apiRequests, []);
assert.equal(processReport.ownedServerClosed, true); assert.equal(processReport.hashesUnchanged, true);
assert.equal(processReport.sourceAfter.compared, 505); assert.deepEqual(processReport.sourceAfter.mismatches, []);
const rows = result.cases.map(item => ({
  id: item.id, functionalStatus: item.passed ? 'PASS-SCOPED' : 'FAILED',
  latencyStatus: item.timing.eventTimingSupported && item.timing.observedTypingEventsAtLeast16ms > 0 && item.timing.p98ObservedTypingEventDurationMs < 100 ? 'PASS-SCOPED' : 'FAILED',
  p98TypingEventMs: item.timing.p98ObservedTypingEventDurationMs,
  maxTypingEventMs: item.timing.maxObservedTypingEventDurationMs,
  p98InteractionMaximumMs: item.timing.p98ObservedInteractionMaximumMs,
  observedTypingEventsAtLeast16ms: item.timing.observedTypingEventsAtLeast16ms,
  interactionsAtLeast16ms: item.timing.measuredInteractionsAtLeast16ms,
  beforeInputEvents: item.timing.observedBeforeInputEvents,
  measuredWallMs: item.timing.measuredWallMs,
  exactFinalTextOrInputs: item.evidence.finalTextExact ?? item.evidence.finalInputValuesExact,
  targetUnits: item.evidence.targetUnits, attempts: item.evidence.attempts,
  inputAccuracy: item.evidence.inputAccuracy, completedGates: item.evidence.completedGates ?? null,
  pageErrors: item.pageErrors, consoleErrors: item.consoleErrors, horizontalOverflow: item.horizontalOverflow,
  longTasksThroughTypingAndResult: item.timing.longTasksThroughTypingAndResult,
}));
assert.deepEqual(rows.map(row => [row.id, row.p98TypingEventMs, row.maxTypingEventMs]), [
  ['learn', 112, 312], ['course', 48, 80], ['local-bot', 112, 160], ['games', 40, 56],
]);
assert.ok(rows.every(row => row.functionalStatus === 'PASS-SCOPED' && row.exactFinalTextOrInputs && row.inputAccuracy === 100 && !row.horizontalOverflow && !row.pageErrors.length && !row.consoleErrors.length));
const failures = rows.filter(row => row.latencyStatus === 'FAILED'); assert.equal(failures.length, 2);
const report = {
  capturedAt: new Date().toISOString(), status: 'FAILED-LATENCY-TWO-OF-FOUR-WORKSPACES',
  sourceBuild: result.protocol.sourceExpectedBuild, staticBuild: result.build.version,
  criterion: { p98ObservedTypingEventDurationMs: 'strictly below100ms for EACH declared workspace', thresholdMs: 100, comparison: '<' },
  functionalStatus: 'PASS-SCOPED-FOUR-OF-FOUR', latencyStatus: 'FAILED',
  failedWorkspaceIds: failures.map(row => row.id), passedLatencyWorkspaceIds: rows.filter(row => row.latencyStatus === 'PASS-SCOPED').map(row => row.id),
  rows,
  execution: { topLevelWrapperStatus: processReport.status, topLevelWrapperCoversLatencyCriterion: false,
    actualApiRequests: processReport.apiRequests.length, actualApiRequestRows: processReport.apiRequests, ownedBrowserChildExited: processReport.ownBrowserChildExited,
    ownedServerClosed: processReport.ownedServerClosed, sourceCompared: processReport.sourceAfter.compared,
    sourceMismatches: processReport.sourceAfter.mismatches, artifactHashesUnchanged: processReport.hashesUnchanged,
    measurementRetries: result.protocol.automaticRetries, resultFiltering: result.protocol.resultFiltering },
  limits: [
    'One retained run per workspace, no result filtering or confirmation measurement performed by this reviewer.',
    'Chromium156.0.8078.4 desktop engine with390x844 mobile/touch emulation, deviceScaleFactor1 and4xCPU throttle, not a physical phone.',
    'Thresholded/quantized Event Timing durations include observed entries>=16ms. These p98 values are not field INP or an every-event<100ms guarantee.',
    'A requested0ms driver delay is not a human typing-speed measurement.',
    'Opening was disabled only for this isolated workspace test; the separate normal-full-quality3D Lighthouse evidence is unaffected.',
    'Long-task arrays cover typing THROUGH result rendering, so their largest entries cannot be attributed exclusively to input handlers.',
    'Functional accuracy and zero backend traffic do not establish the latency acceptance criterion.',
  ],
  inputHashes: { [resultFile]: hash(bytes), [processFile]: hash(processBytes) },
  extractionRepair: 'The first extraction attempt incorrectly expected numeric0 for apiRequests; the unchanged source report stores an empty array. The corrected extraction verifies that exact empty array and reports its length. No measurement or source report was changed.',
  reviewerActions: { newTests: 0, newBenchmarks: 0, newBrowsers: 0, newServices: 0, productOrTestEdits: 0 },
};
const output = 'audit/2026-11-02/final27-mobile-workspaces-independent-latency-assessment.json';
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, functional: report.functionalStatus, failedWorkspaceIds: report.failedWorkspaceIds, rows: rows.map(row => ({ id: row.id, p98: row.p98TypingEventMs, max: row.maxTypingEventMs })) }));
