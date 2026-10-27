// Reconcile completed receipts only; never reruns a check or rewrites originals.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {
  directory, originalGateFile, confirmationFile, rawFile, logFile,
  sourceSnapshot, inputSnapshot, json, rawHash, originalGates,
  inspectCoverage, requireCompleteCoverage,
} from './coverage-confirmation-support.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL18_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Actual frozen18 identity required.');
const original = await json(originalGateFile), confirmation = await json(confirmationFile);
const failedCoverage = originalGates(original);
assert.equal(confirmation.status, 'PASS-SCOPED'); assert.equal(confirmation.build.version, expectedBuild);
assert.equal(confirmation.originalGate.rawSha256, await rawHash(originalGateFile));
assert.equal(confirmation.originalGate.coverageLogSha256, await rawHash(failedCoverage.file));
assert.deepEqual(confirmation.originalGate.coverageRow, failedCoverage);
assert.equal(confirmation.rawReportSha256, await rawHash(rawFile)); assert.equal(confirmation.logSha256, await rawHash(logFile));
assert.equal(confirmation.profile.maxWorkers, 2); assert.equal(confirmation.profile.automaticRetries, 0);
for (const key of ['timeoutsChanged', 'assertionsChanged', 'casesFiltered']) assert.equal(confirmation.profile[key], false);
for (const key of ['sourceUnchanged', 'inputsUnchanged', 'originalFailedGateUnchanged', 'ownedChildExited']) assert.equal(confirmation[key], true);
const current = await sourceSnapshot(expectedBuild), inputs = await inputSnapshot();
assert.deepEqual(current.receipt.mismatches, []); assert.deepEqual(current.hashes, confirmation.sourceHashesAfter);
assert.deepEqual(inputs.hashes, confirmation.inputHashesAfter); assert.deepEqual(inputs.unitFiles, confirmation.inputFilesAfter);
const inspected = inspectCoverage(await json(rawFile), await readFile(logFile, 'utf8')); requireCompleteCoverage(inspected);
assert.deepEqual(inspected.summary, confirmation.summary); assert.deepEqual(inspected.coveragePercent, confirmation.coveragePercent);
const replacement = {
  id: 'coverage', command: confirmation.command.join(' '), startedAt: confirmation.startedAt,
  finishedAt: confirmation.finishedAt, exitCode: 0, status: 'PASS-SCOPED', file: logFile,
  confirmationReceipt: confirmationFile, changedValidationProfile: true, maxWorkers: 2,
  originalFailurePreserved: true,
};
const results = original.results.map(row => row.id === 'coverage' ? replacement : row);
assert.equal(results.length, 12);
assert.deepEqual(results.filter(row => row.id !== 'coverage'), original.results.filter(row => row.id !== 'coverage'));
const output = `${directory}/final18-source-gates-confirmed.json`;
const report = {
  status: 'PASS-SCOPED', capturedAt: new Date().toISOString(), build: confirmation.build,
  scope: 'Composite of the unchanged11 originally passing rows and a separately declared worker2 full coverage confirmation. Original12-command receipt remains FAILED with14timeouts; no hidden retry or original-result rewrite.',
  automaticRetries: 0, changedValidationProfile: true,
  originalGate: { file: originalGateFile, status: 'FAILED', rawSha256: await rawHash(originalGateFile), coverageRow: failedCoverage, coverageLogSha256: await rawHash(failedCoverage.file) },
  coverageConfirmation: {
    file: confirmationFile, rawSha256: await rawHash(confirmationFile), rawReport: rawFile,
    rawReportSha256: confirmation.rawReportSha256, log: logFile, logSha256: confirmation.logSha256,
    profile: confirmation.profile, summary: confirmation.summary, coveragePercent: confirmation.coveragePercent,
  },
  sourceBefore: confirmation.sourceBefore, sourceAfter: confirmation.sourceAfter,
  sourceManifestSha256: current.sourceManifestSha256, currentSource: current.receipt,
  inputsUnchanged: true, sourceUnchanged: true, results,
};
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, originalStatus: report.originalGate.status, commands: results.length, summary: inspected.summary, coveragePercent: inspected.coveragePercent }));
