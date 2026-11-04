// PREPARATION ONLY. Never starts builds, browsers, services or measurements.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-02';
const priorFile = `${directory}/source32-validation-harness-preparation.json`;
const prior = JSON.parse(await readFile(priorFile, 'utf8'));
const sequenceFile = `${directory}/source32-dual-latency-sequence-preparation.json`;
const sequence = JSON.parse(await readFile(sequenceFile, 'utf8'));
const reportFile = `${directory}/source33-validation-harness-preparation.json`;
await assert.rejects(access(reportFile), { code: 'ENOENT' });
const hash = value => createHash('sha256').update(value).digest('hex');
const replacements = [['FINAL32', 'FINAL33'], ['final32', 'final33'], ['Source32', 'Source33'], ['source32', 'source33']];
const originals = [...prior.files.map(item => ({ file: item.target, expected: item.targetSha256 })),
  { file: `${directory}/assess-final32-mobile-interaction-latency.mjs` },
  { file: sequence.target, expected: sequence.targetSha256 }];
assert.equal(originals.length, 13);
const files = [];
for (const original of originals) {
  const before = await readFile(original.file, 'utf8');
  if (original.expected) assert.equal(hash(before), original.expected, `Prepared source32 helper changed: ${original.file}`);
  const target = original.file.replaceAll('final32', 'final33').replaceAll('source32', 'source33');
  assert.notEqual(target, original.file);
  await assert.rejects(access(target), { code: 'ENOENT' }, 'Never overwrite a prior helper or measurement.');
  let after = before;
  const substitutions = replacements.map(([from, to]) => {
    const count = after.split(from).length - 1;
    after = after.replaceAll(from, to);
    return { from, to, count };
  });
  let reversed = after;
  for (const item of [...substitutions].reverse()) {
    assert.equal(reversed.split(item.to).length - 1, item.count);
    reversed = reversed.replaceAll(item.to, item.from);
  }
  assert.equal(reversed, before, 'Only checkpoint identifiers may change.');
  files.push({ original: original.file, target, before, after, substitutions });
}

const originalDriverFile = 'audit/2026-10-21/measure-mobile-workspaces.mjs';
const driverOriginal = await readFile(originalDriverFile, 'utf8');
const driverReferences = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-11-02';"],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final33-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final33-static-protocol.json`'],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final33-static-build.json`'],
];
let expectedDriver = driverOriginal;
for (const [from, to] of driverReferences) {
  assert.equal(expectedDriver.split(from).length - 1, 1);
  expectedDriver = expectedDriver.replace(from, to);
}
assert.equal(files.find(item => item.target.endsWith('/measure-mobile-workspaces-static-final33.mjs')).after, expectedDriver);
for (const file of files) await writeFile(file.target, file.after, { flag: 'wx' });
const syntax = [import.meta.filename, ...files.map(item => item.target)].map(file => {
  const run = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
});
assert.ok(syntax.every(item => item.exitCode === 0), 'Every preparation/helper file must parse.');
const testFiles = ['e2e/learning-v3.spec.ts', 'e2e/live-keyboard.spec.ts', 'e2e/typing-render-budget.spec.ts'];
const report = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  priorPreparation: { file: priorFile, sha256: hash(await readFile(priorFile)) },
  priorSequencePreparation: { file: sequenceFile, sha256: hash(await readFile(sequenceFile)) },
  files: files.map(file => ({ original: file.original, target: file.target,
    originalSha256: hash(file.before), targetSha256: hash(file.after), substitutions: file.substitutions, exactReversalVerified: true })),
  originalDriver: { file: originalDriverFile, sha256: hash(driverOriginal), driverReferences,
    originalActionsTimingsEventFilterAndAssertionsUnchanged: true },
  syntax,
  requiredSourceFile: `${directory}/final33-source.json`, requiredSourceHashes: 505,
  actualSourceBuildRequired: 'SPAROWTYPE_FINAL33_BUILD_ID', actualStaticBuildRequired: 'SPAROWTYPE_FINAL33_STATIC_BUILD_ID',
  source33ManifestOrBuildAlreadyClaimed: false,
  candidateEntry: `${directory}/run-mobile-workspaces-static-final33-candidate.mjs`,
  originalEventGate: 'Every workspace in every trial requires measured p98ObservedTypingEventDurationMs strictly below100ms.',
  additionalInteractionGate: 'Every workspace in every trial additionally requires measured p98ObservedInteractionMaximumMs strictly below100ms. Neither gate replaces the other; unsupported/null is UNVERIFIED.',
  eventCardinalityDisclosure: 'The source32 Learn trusted cancelable beforeinput path prevents redundant native insertion/input events. Original native actions and filters are retained; sample counts and interaction maxima remain required. No percentage comparison based only on event-weight changes is established.',
  fullStaticSequence: { artifactChecks: 67, deploymentCases: 56, gameAccessibilityCases: 16, ordinaryMobileTrials: 3, preserveEveryTrial: true, retries: 0 },
  browserMatrix: { currentSpecFiles: 64, everyFileExactlyOnce: true, engines: ['chromium', 'edge', 'firefox', 'webkit'], workers: 1, retries: 0 },
  nativeBrowserPlan: { freshOwnedBackends: 4, sequential: true, exactCasesPerEngine: 5, expectedTotal: 20, ratePolicyUnchanged: true },
  homeAssessor: 'Deferred until the actual source33 build is known because source32 home assessor binds its actual build literal; no stale-ID helper is declared ready.',
  protectedCurrentTestHashes: Object.fromEntries(await Promise.all(testFiles.map(async file => [file, hash(await readFile(file))]))),
  originalSource32ReportsAndHelpersModified: false, productFilesEdited: false, testsEdited: false,
  runtimeJobsStarted: 0, buildsStarted: 0, browsersStarted: 0, servicesStarted: 0,
  executionPrerequisite: 'Root GO after stable source33 manifest/build IDs and the shared heavy-job window are explicitly supplied.',
};
await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ reportFile, status: report.status, helpers: files.length, syntaxChecks: syntax.length,
  originalDriverReversal: true, runtimeJobsStarted: 0 }));
