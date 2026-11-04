// Read-only evidence review; never invokes another measurement.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const directory = 'audit/2026-11-02';
const prefix = 'mobile-workspaces-final31-static-candidate';
const inputs = [`${directory}/${prefix}-process.json`, `${directory}/${prefix}-latency-assessment.json`, `${directory}/${prefix}.json`];
const bytes = await Promise.all(inputs.map(file => readFile(file)));
const [processReport, assessment, raw] = bytes.map(value => JSON.parse(value));
assert.equal(processReport.status, 'PASS-SCOPED'); assert.equal(assessment.status, 'PASS-SCOPED');
assert.deepEqual(processReport.apiRequests, []);
for (const field of ['ownBrowserChildExited', 'ownedServerClosed', 'hashesUnchanged', 'driverUnchanged', 'originalProtocolUnchanged']) assert.equal(processReport[field], true);
assert.equal(processReport.source.compared, 505); assert.deepEqual(processReport.source.mismatches, []);
assert.equal(processReport.sourceAfter.compared, 505); assert.deepEqual(processReport.sourceAfter.mismatches, []);
assert.equal(processReport.candidateQuality.length, 5); assert.ok(processReport.candidateQuality.every(item => item.pass));
assert.deepEqual(raw.cases.map(item => item.id), ['learn', 'course', 'local-bot', 'games']);
const cases = raw.cases.map((item, index) => {
  assert.equal(item.passed, true); assert.equal(item.evidence.inputAccuracy, 100);
  assert.equal(assessment.cases[index].latencyStatus, 'PASS-SCOPED');
  return { id: item.id, p98ObservedTypingEventDurationMs: item.timing.p98ObservedTypingEventDurationMs,
    maxObservedTypingEventDurationMs: item.timing.maxObservedTypingEventDurationMs,
    targetMs: 100, comparison: '<', observedInputAttempts: item.evidence.attempts, inputAccuracy: 100,
    functionalPass: true, horizontalOverflow: item.horizontalOverflow, pageErrors: item.pageErrors.length, consoleErrors: item.consoleErrors.length };
});
const hash = value => createHash('sha256').update(value).digest('hex');
const review = { reviewedAt: new Date().toISOString(), status: 'PASS-SCOPED-SINGLE-CANDIDATE-LABORATORY-RUN',
  sourceBuild: processReport.source.expectedBuild, staticBuild: raw.build.version,
  inputs: Object.fromEntries(inputs.map((file, index) => [file, hash(bytes[index])])), cases,
  source505BeforeAndAfterUnchanged: true, artifactBytesUnchanged: true, apiRequests: 0,
  ownedBrowserAndServerClosed: true,
  sceneIdentityProof: { qualityChecksPassed: 5, sceneAssets: processReport.candidateSceneAssets, comparisons: processReport.candidateQuality },
  qualification: 'One CPU4x mobile-emulated Chromium laboratory candidate, including the original observation window and all four original functional flows. This establishes neither repeated acceptance, physical-phone behavior, field INP, a clean complete product audit, nor public-hosting success. The normal67-check/two-target static gate, three ordinary mobile trials, home trials, Lighthouse, full matrix, native backend and CI remain separate required gates.',
  earlierFailuresRetained: ['source27 Learn112/BOT112', 'source28 Learn104/BOT120', 'source30 Learn112/BOT80; Learn failed'],
  rerunsOrNewMeasurementsByThisReview: 0,
};
const output = `${directory}/final31-mobile-candidate-scope-review.json`;
await writeFile(output, `${JSON.stringify(review, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: review.status, cases, qualityChecksPassed: 5, newMeasurements: 0 }));
