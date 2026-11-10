// Preparation only: clone stable measurement helpers without running any trial.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-05-followup';
const sourceFile = `${directory}/final35-source.json`;
const sourceBytes = await readFile(sourceFile);
const source = JSON.parse(sourceBytes);
assert.equal(Object.keys(source.sourceHashes).length, 506);
assert.equal(source.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
assert.equal(source.fullIntroSourceUnchanged, true);
assert.match(source.local.version, /^[a-f0-9]{20}$/);
assert.equal(source.local.version, 'd89f84d74519bf2bbae0');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const plans = [
  {
    original: 'audit/2026-11-02/run-input-final.mjs',
    target: `${directory}/run-input-final35.mjs`,
    changes: [["const directory = 'audit/2026-11-02',", `const directory = '${directory}',`]],
  },
  {
    original: 'audit/2026-11-02/run-final-lighthouse.mjs',
    target: `${directory}/run-final35-lighthouse.mjs`,
    changes: [["path.resolve('audit/2026-11-02')", `path.resolve('${directory}')`]],
  },
  {
    original: 'audit/2026-11-02/assess-source33-home-input.mjs',
    target: `${directory}/assess-source35-home-input.mjs`,
    changes: [
      ["const directory = 'audit/2026-11-02', prefix = 'final33';", `const directory = '${directory}', prefix = 'final35';`],
      ["const expectedBuild = '332e23584f1e36465df2';", `const expectedBuild = '${source.local.version}';`],
      ['`${directory}/run-input-final.mjs`', '`${directory}/run-input-final35.mjs`'],
      ["'actual frozen build matches source33 and its served manifest'", "'actual frozen build matches source35 and its served manifest'"],
      ["'all 505 frozen production files remain unchanged'", "'all 506 frozen production files remain unchanged'"],
      ['sourceAfter?.compared === 505', 'sourceAfter?.compared === 506'],
    ],
  },
];

const files = [];
for (const plan of plans) {
  await assert.rejects(access(plan.target), { code: 'ENOENT' });
  const bytes = await readFile(plan.original);
  const before = bytes.toString('utf8');
  let after = before;
  const changes = [];
  for (const [from, to] of plan.changes) {
    assert.equal(after.split(from).length - 1, 1, `Exact replacement count: ${plan.target}: ${from}`);
    after = after.replace(from, to);
    changes.push({ from, to, occurrences: 1 });
  }
  let reversed = after;
  for (const change of [...changes].reverse()) {
    assert.equal(reversed.split(change.to).length - 1, 1);
    reversed = reversed.replace(change.to, change.from);
  }
  assert.equal(reversed, before, 'No actions, thresholds, timing, retry or quality changes are allowed.');
  await writeFile(plan.target, after, { flag: 'wx' });
  assert.equal(hash(await readFile(plan.original)), hash(bytes));
  files.push({ original: plan.original, target: plan.target, originalSha256: hash(bytes), targetSha256: hash(Buffer.from(after)), changes, exactReverseVerified: true, originalUnchanged: true });
}
const syntax = [import.meta.filename, ...files.map(row => row.target)].map(file => {
  const run = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  return { file, exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
});
assert.ok(syntax.every(row => row.exitCode === 0));
const receipt = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  source: { file: sourceFile, sha256: hash(sourceBytes), capturedAt: source.capturedAt, actualBuild: source.local.version, inventory: 506, baseline: source.baseline },
  files, syntax,
  entryCommands: [
    'node audit/2026-11-05-followup/run-input-final35.mjs final35',
    'node audit/2026-11-05-followup/assess-source35-home-input.mjs',
    'node audit/2026-11-05-followup/run-final35-lighthouse.mjs final35-lighthouse',
  ],
  home: { runs: 3, cpuThrottle: 4, repetitions: 16, interCharacterDelayMs: 0, quietSeconds: 5, attempts: 495, rotationPrefix: 247, everyTrialStrictP98BelowMs: 100, originalImmutableDriverPreserved: true, maximaRetainedWithoutNewThreshold: true },
  lighthouse: { runs: 3, freshProfiles: true, quietBeforeEachSeconds: 30, qualityOverrides: false, introSkip: false, reducedMotionOverride: false, medianPerformanceAtLeast: 95, everyRunOtherCategories: 100, lcpAtMostMs: 2500, clsAtMost: 0.05 },
  inputActionsChanged: false, timingChanged: false, assertionsOrThresholdsChanged: false,
  automaticRetriesChanged: false, historicalMeasurementEvidenceReused: false,
  testsExecuted: false, buildsStarted: false, browsersStarted: false, servicesStarted: false,
  executionRequiresSeparateRootGoAfterEarlyCapacityFeedback: true,
};
await writeFile(`${directory}/source35-home-lighthouse-preparation.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, actualBuild: source.local.version, helpers: files.length, syntaxChecks: syntax.length, files: files.map(row => ({ file: row.target, sha256: row.targetSha256 })) }));
