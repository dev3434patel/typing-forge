// Preparation only: source32 assessor with the actual source33 checkpoint binding.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-02';
const original = `${directory}/assess-source32-home-input.mjs`;
const target = `${directory}/assess-source33-home-input.mjs`;
const output = `${directory}/source33-home-input-assessor-preparation.json`;
for (const file of [target, output]) await assert.rejects(access(file), { code: 'ENOENT' });
const sourceFile = `${directory}/final33-source.json`;
const sourceBytes = await readFile(sourceFile);
const source = JSON.parse(sourceBytes);
const actualBuild = '332e23584f1e36465df2';
assert.equal(source.local.version, actualBuild);
assert.equal(Object.keys(source.sourceHashes).length, 505);
const before = await readFile(original, 'utf8');
assert.equal(before.split(`const expectedBuild = '${actualBuild}';`).length - 1, 1);
const after = before.replaceAll('source32', 'source33').replaceAll('final32', 'final33');
assert.equal(after.replaceAll('source33', 'source32').replaceAll('final33', 'final32'), before);
const hash = value => createHash('sha256').update(value).digest('hex');
await writeFile(target, after, { flag: 'wx' });
const syntax = [import.meta.filename, target].map(file => {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
});
assert.ok(syntax.every(item => item.exitCode === 0));
await writeFile(output, `${JSON.stringify({
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  original, originalSha256: hash(before), entry: target, sha256: hash(after),
  exactPrefixSourceIdentityReversal: true, buildLiteralChanged: false,
  actualBuild, source: { file: sourceFile, sha256: hash(sourceBytes), capturedAt: source.capturedAt },
  reasonBuildLiteralUnchanged: 'Source33 changes only two PHP files; the completed frontend artifact has the same actual332e build identity as source32.',
  requiredRawTrials: [1, 2, 3], strictP98EachTrialBelowMs: 100,
  exactAttemptsAndNativeBeforeInputEventsEach: 495, accuracyPercent: 100,
  rotationRetainedPrefixUnits: 247, browserErrorsRequired: 0, overflowAllowed: false,
  originalDriverOnlyDirectoryChangeVerifiedAtAssessment: true,
  noMaximumLatencyThresholdAdded: true, maximaRetained: true,
  syntax, trialsLaunchedByAssessment: 0, existingHarnessOrResultEdits: false,
  rootGoRequiredAfterAllThreeTrials: true,
  executionDateQualification: 'Prepared4November UTC in the continuing audit/2026-11-02 checkpoint. Directory name does not date the execution; no trial is claimed run by this preparation.',
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: 'PREPARED-NOT-RUN', target, actualBuild, exactReversal: true, syntaxChecks: syntax.length, trialsExecuted: 0 }));
