// Preparation only. No browser, server, build, benchmark or test suite runs.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-02';
const priorFile = `${directory}/source33-validation-harness-preparation.json`;
const priorV2File = `${directory}/source33-validation-harness-preparation-v2.json`;
const priorBytes = await readFile(priorFile), prior = JSON.parse(priorBytes);
const priorV2Bytes = await readFile(priorV2File), priorV2 = JSON.parse(priorV2Bytes);
const output = `${directory}/source34-final-runtime-harness-preparation.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const names = ['run-browser-checkpoint-final33.mjs', 'run-final33-browser-matrix.mjs',
  'pack-backend-instance-source33.mjs', 'pack-native-browser-final33.mjs',
  'run-final33-native-browser.mjs', 'run-final33-ci-extra.mjs'];
const replacements = [['FINAL33', 'FINAL34'], ['final33', 'final34'], ['Source33', 'Source34'], ['source33', 'source34']];
const hash = value => createHash('sha256').update(value).digest('hex');
const files = [];
for (const name of names) {
  const original = `${directory}/${name}`;
  const declaration = prior.files.find(item => item.target === original);
  assert.ok(declaration);
  const before = await readFile(original, 'utf8');
  const expected = original === priorV2.activeHelper.file ? priorV2.activeHelper.afterSha256 : declaration.targetSha256;
  assert.equal(hash(before), expected, `Active source33 helper changed: ${original}`);
  const target = original.replaceAll('final33', 'final34').replaceAll('source33', 'source34');
  await assert.rejects(access(target), { code: 'ENOENT' });
  let after = before;
  const substitutions = replacements.map(([from, to]) => {
    const count = after.split(from).length - 1;
    after = after.replaceAll(from, to);
    return { from, to, count };
  });
  let reversed = after;
  for (const change of [...substitutions].reverse()) {
    assert.equal(reversed.split(change.to).length - 1, change.count);
    reversed = reversed.replaceAll(change.to, change.from);
  }
  assert.equal(reversed, before);
  files.push({ original, target, before, after, substitutions });
}
assert.equal(files.length, 6);
for (const item of files) await writeFile(item.target, item.after, { flag: 'wx' });
const syntax = [import.meta.filename, ...files.map(file => file.target)].map(file => {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
});
assert.ok(syntax.every(row => row.exitCode === 0));
const report = {
  status: 'PREPARED-NOT-RUN', version: 1, recordedAt: new Date().toISOString(),
  originalSource33Preparation: { file: priorFile, sha256: hash(priorBytes), unchanged: true },
  originalSource33MatrixV2: { file: priorV2File, sha256: hash(priorV2Bytes), unchanged: true },
  files: files.map(file => ({ original: file.original, target: file.target, originalSha256: hash(file.before),
    targetSha256: hash(file.after), substitutions: file.substitutions, exactIdentifierReversalVerified: true })),
  requiredSourceManifest: `${directory}/final34-source.json`, requiredSourceHashes: 505,
  actualSourceBuildFlag: 'SPAROWTYPE_FINAL34_BUILD_ID', syntax,
  matrix: { specFiles: 64, everyFileExactlyOnce: true, engines: ['chromium', 'edge', 'firefox', 'webkit'],
    workers: 1, automaticRetries: 0, caseCountDerivedFromActualReports: true, newLearnCasesComparedWithSource27: 8 },
  native: { exactCases: 20, freshOwnedBackends: 4, unchangedRatePolicy: true },
  ci: { actualPgliteAndExactThreeEntryDenoCommandsRequired: true, verifiedPortableRuntimeOnly: true },
  noStaticMobileOrHomeHelpersCopied: true,
  frontendReuse: 'The initial exact clone retains historical planning metadata. A separately archived metadata-only v2 must declare explicit source33 frontend/artifact proof before matrix execution. Existing source33 measurements are not relabeled as new source34 executions.',
  primarySourceEdited: false, testsEdited: false, source33HelpersOrReceiptsEdited: false,
  runtimeJobsStarted: 0, servicesStarted: 0, browsersStarted: 0,
  executionPrerequisite: 'Actual stable source34 manifest/build, completed frontend reuse proof and explicit root runtime GO.',
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, helpers: files.length, syntaxChecks: syntax.length,
  identifierReversalVerified: true, runtimeJobsStarted: 0 }));
