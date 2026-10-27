// Preparation only until an explicit operator invokes the opt-in below.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, open, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  directory, confirmationFile, rawFile, logFile, reportsDirectory, originalGateFile,
  inputSnapshot, sourceSnapshot, json, rawHash, originalGates, inspectCoverage,
  requireCompleteCoverage, priorWorker2,
} from './coverage-confirmation-workers1-support.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL18_COVERAGE_CONFIRM_WORKERS1, '1', 'Explicit one-run confirmation opt-in required.');
const expectedBuild = process.env.SPAROWTYPE_FINAL18_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen18 build identity.');
assert.equal(path.resolve(process.cwd()), path.resolve(import.meta.dirname, '../..'), 'Run only from the repository root.');
for (const file of [confirmationFile, rawFile, logFile, reportsDirectory]) await assert.rejects(access(file), { code: 'ENOENT' });
assert.equal(path.dirname(path.resolve(reportsDirectory)), path.resolve(directory));
assert.equal(path.basename(reportsDirectory), '.final18-coverage-workers1');
assert.ok((await readFile('.gitignore', 'utf8')).split(/\r?\n/).includes('audit/**/.final*'), 'Private coverage outputs must be ignored.');
assert.equal((await json('package.json')).scripts['test:coverage'], 'vitest run --coverage', 'Base suite command must remain exact.');

const original = await json(originalGateFile), failedCoverage = originalGates(original);
const before = await sourceSnapshot(expectedBuild);
assert.deepEqual(before.receipt.mismatches, []);
const inputsBefore = await inputSnapshot();
const prior = await priorWorker2(expectedBuild);
assert.deepEqual(before.hashes, prior.data.sourceHashesAfter, 'Same frozen product source as failed worker2.');
assert.deepEqual(inputsBefore.hashes, prior.data.inputHashesAfter, 'Same full-suite/config/dependencies as failed worker2.');
assert.deepEqual(inputsBefore.unitFiles, prior.data.inputFilesAfter);
const profile = {
  originalMaxWorkers: 'unset/config-default', priorMaxWorkers: 2, maxWorkers: 1, automaticRetries: 0,
  timeoutsChanged: false, assertionsChanged: false, casesFiltered: false,
  reportsOnlyChanges: true,
  basePackageCommand: 'npm run test:coverage -> vitest run --coverage',
  reporterChanges: 'Additional JSON/default console reporters and fresh ignored report destination; coverage include/exclude/provider/floors unchanged.',
};
const command = [process.execPath, 'node_modules/vitest/vitest.mjs', 'run', '--coverage', '--maxWorkers=1', '--reporter=default', '--reporter=json', `--outputFile=${rawFile}`, `--coverage.reportsDirectory=${reportsDirectory}`];
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), build: before.build,
  scope: 'One separately declared full coverage confirmation. Original14-timeout and separately declared worker2fuzz-timeout failures remain failed; only worker ceiling and output reporters/destinations differ. No assertions, timeouts, cases, coverage floors or application source change.',
  originalGate: { file: originalGateFile, status: original.status, rawSha256: await rawHash(originalGateFile), coverageRow: failedCoverage, coverageLogSha256: await rawHash(failedCoverage.file) },
  priorCoverageConfirmations: [prior.receipt],
  profile, command, rawReport: rawFile, log: logFile, reportsDirectory,
  sourceBefore: before.receipt, sourceManifestSha256Before: before.sourceManifestSha256,
  sourceHashesBefore: before.hashes, inputFilesBefore: inputsBefore.unitFiles, inputHashesBefore: inputsBefore.hashes,
  automaticRetries: 0, processStartedByWrapper: false,
};
await writeFile(confirmationFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
await mkdir(reportsDirectory);
const log = await open(logFile, 'wx');
try {
  report.startedAt = new Date().toISOString();
  const outcome = await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { windowsHide: true, stdio: ['ignore', log.fd, log.fd], env: { ...process.env, NO_COLOR: '1' } });
    report.childPid = child.pid; report.processStartedByWrapper = true;
    child.once('error', reject);
    child.once('close', (exitCode, signal) => resolve({ exitCode, signal }));
  });
  report.exitCode = outcome.exitCode; report.signal = outcome.signal; report.ownedChildExited = true;
} catch (error) { report.error = { name: error.name, message: 'Coverage runner could not complete; see the unique raw/log outputs.' }; }
finally {
  await log.close();
  try {
    const after = await sourceSnapshot(expectedBuild), inputsAfter = await inputSnapshot();
    report.sourceAfter = after.receipt; report.sourceManifestSha256After = after.sourceManifestSha256; report.sourceHashesAfter = after.hashes;
    report.inputFilesAfter = inputsAfter.unitFiles; report.inputHashesAfter = inputsAfter.hashes;
    report.sourceUnchanged = JSON.stringify(before.hashes) === JSON.stringify(after.hashes) && after.receipt.mismatches.length === 0 && before.sourceManifestSha256 === after.sourceManifestSha256;
    report.inputsUnchanged = JSON.stringify(inputsBefore) === JSON.stringify(inputsAfter);
    report.originalFailedGateUnchanged = await rawHash(originalGateFile) === report.originalGate.rawSha256 && await rawHash(failedCoverage.file) === report.originalGate.coverageLogSha256;
    const priorAfter = await priorWorker2(expectedBuild);
    report.priorFailedCoverageUnchanged = JSON.stringify(priorAfter.receipt) === JSON.stringify(prior.receipt);
    report.rawReportSha256 = await rawHash(rawFile); report.logSha256 = await rawHash(logFile);
    const inspected = inspectCoverage(await json(rawFile), await readFile(logFile, 'utf8'));
    report.summary = inspected.summary; report.coveragePercent = inspected.coveragePercent;
    requireCompleteCoverage(inspected);
    const actualFiles = inspected.fileNames.map(file => path.relative(process.cwd(), file).replaceAll('\\', '/')).sort();
    assert.deepEqual(actualFiles, inputsBefore.unitFiles);
    assert.equal(report.exitCode, 0); assert.equal(report.signal, null);
    assert.equal(report.sourceUnchanged, true); assert.equal(report.inputsUnchanged, true); assert.equal(report.originalFailedGateUnchanged, true);
    assert.equal(report.priorFailedCoverageUnchanged, true);
    assert.equal(report.ownedChildExited, true); assert.equal(report.error, undefined);
    report.coverageFinalSha256 = await rawHash(`${reportsDirectory}/coverage-final.json`);
    report.status = 'PASS-SCOPED';
  } catch (error) {
    report.status = 'FAILED';
    report.verificationError = { name: error.name, message: 'Confirmation did not meet every declared source/input/full-suite/coverage constraint; original results retained.' };
  }
  report.finishedAt = new Date().toISOString();
  await writeFile(confirmationFile, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ status: report.status, report: confirmationFile, summary: report.summary, coveragePercent: report.coveragePercent, sourceUnchanged: report.sourceUnchanged, inputsUnchanged: report.inputsUnchanged }));
process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
