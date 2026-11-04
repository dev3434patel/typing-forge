// Metadata preparation only. No test, browser, build or service is started.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-02';
const priorReceiptFile = `${directory}/source33-validation-harness-preparation.json`;
const activeFile = `${directory}/run-final33-browser-matrix.mjs`;
const archiveFile = `${activeFile}.source-v1`;
const output = `${directory}/source33-validation-harness-preparation-v2.json`;
for (const file of [archiveFile, output]) await assert.rejects(access(file), { code: 'ENOENT' });
const hash = value => createHash('sha256').update(value).digest('hex');
const priorBytes = await readFile(priorReceiptFile);
const prior = JSON.parse(priorBytes);
const originalEntry = prior.files.find(file => file.target === activeFile);
assert.ok(originalEntry);
const before = await readFile(activeFile, 'utf8');
assert.equal(hash(before), originalEntry.targetSha256);
const from = 'newLearnCasesInExistingSpec: 4';
const to = 'newLearnCasesInExistingSpec: 8';
assert.equal(before.split(from).length - 1, 1);
const after = before.replace(from, to);
assert.equal(after.split(to).length - 1, 1);
assert.equal(after.replace(to, from), before, 'Only one descriptive metadata value may change.');
await writeFile(archiveFile, before, { flag: 'wx' });
assert.equal(hash(await readFile(archiveFile)), hash(before));
await writeFile(activeFile, after);
assert.equal(await readFile(activeFile, 'utf8'), after);
const syntax = [import.meta.filename, activeFile].map(file => {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
});
assert.ok(syntax.every(row => row.exitCode === 0));
const otherHelpers = await Promise.all(prior.files.filter(file => file.target !== activeFile).map(async file => {
  const actual = hash(await readFile(file.target));
  assert.equal(actual, file.targetSha256);
  return { file: file.target, sha256: actual, unchanged: true };
}));
assert.equal(hash(await readFile(priorReceiptFile)), hash(priorBytes));
const report = {
  status: 'PREPARED-NOT-RUN', version: 2, recordedAt: new Date().toISOString(),
  authorization: 'Root requested this metadata-only correction before source33 matrix execution.',
  priorReceipt: { file: priorReceiptFile, sha256: hash(priorBytes), preserved: true },
  activeHelper: { file: activeFile, beforeSha256: hash(before), afterSha256: hash(after) },
  preservedVersion1: { file: archiveFile, sha256: hash(before), byteExact: true },
  exactSingleReplacement: { from, to, occurrences: 1, exactReverseVerified: true },
  reason: 'The matrix compares against source27. Four source28 Learn cases and four source32 native-draft cases were added to the same existing spec: eight added test definitions total.',
  operationalCoverage: { specFilesExactlyOnce: 64, engines: ['chromium', 'edge', 'firefox', 'webkit'], actualCaseCountsDerivedAtRuntime: true, metadataUsedToFilterCases: false },
  assertionsChanged: false, thresholdsChanged: false, inputActionsChanged: false,
  timeoutsChanged: false, workersChanged: false, retriesChanged: false, testFilesChanged: false,
  otherHelpers, syntax, productFilesEdited: false, runtimeJobsStarted: 0,
  browsersStarted: 0, buildsStarted: 0, servicesStarted: 0,
  executionPrerequisite: 'Stable actual source33 manifest/build IDs and a separate root runtime GO remain required.',
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, exactSingleReplacement: true,
  otherHelpersUnchanged: otherHelpers.length, syntaxChecks: syntax.length, runtimeJobsStarted: 0 }));
