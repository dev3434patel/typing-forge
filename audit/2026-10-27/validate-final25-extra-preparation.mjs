// Read-only source/availability inspection and syntax checks; no suites execute.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { hash, normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const preparationFile = `${directory}/final25-native-ci-preparation.json`;
const preparation = JSON.parse(await readFile(preparationFile, 'utf8'));
const original = await readFile(preparation.originalFile, 'utf8'), actual = await readFile(preparation.outputFile, 'utf8');
assert.equal(hash(original), preparation.originalSha256);
assert.equal(hash(actual), preparation.sha256);
let reversed = actual;
for (const adapter of [...preparation.substitutions].reverse()) reversed = reversed.replaceAll(adapter.after, adapter.before);
assert.equal(reversed, original);
const originalPreparation = JSON.parse(await readFile(`${directory}/source25-wrapper-preparation.json`, 'utf8'));
assert.equal(hash(original), originalPreparation.prepared.find(item => item.file === preparation.originalFile).sha256);
const files = ['prepare-final25-native-ci.mjs', 'run-final25-native-ci.mjs', 'run-final25-ci-extra.mjs', 'validate-final25-extra-preparation.mjs'];
const syntax = [];
for (const name of files) {
  const file = `${directory}/${name}`, result = spawnSync(process.execPath, ['--check', file], { windowsHide: true, encoding: 'utf8', timeout: 10000, maxBuffer: 100000 });
  assert.equal(result.status, 0, file);
  syntax.push({ file, sha256: hash(await readFile(file)), pass: true });
}
const legacy = [];
for (const name of ['submit-session', 'race-operation', 'delete-account']) {
  const file = `supabase/functions/${name}/index.ts`, source = await readFile(file);
  const prior = spawnSync('git', ['show', `275c8c24d65054abae18713c1eee4dad18888332:${file}`], { windowsHide: true, maxBuffer: 100000 });
  assert.equal(prior.status, 0);
  const unchanged = normalizedSourceHash(file, source) === normalizedSourceHash(file, prior.stdout);
  assert.ok(unchanged);
  legacy.push({ file, sha256: hash(source), unchangedFromBaseline: '275c8c24d65054abae18713c1eee4dad18888332' });
}
const probe = spawnSync('where.exe', ['deno.exe'], { windowsHide: true, encoding: 'utf8', timeout: 5000, maxBuffer: 100000 });
const report = { status: 'PASS-PREPARATION-ONLY', recordedAt: new Date().toISOString(), syntax,
  nativeCi: { preparationFile, reversibleByteIdentity: true, originalFiveSuiteWrapperUnchanged: true, expectedSourceFiles: 504, exactSuites: preparation.allEightSuitesExactlyOnce, addedCiLifecycleSuites: ['data', 'race', 'course'], execution: 'NOT-RUN' },
  extraCi: { file: `${directory}/run-final25-ci-extra.mjs`, sha256: hash(await readFile(`${directory}/run-final25-ci-extra.mjs`)), commands: ['npm run test:database', 'deno check --node-modules-dir=none --no-lock supabase/functions/submit-session/index.ts supabase/functions/race-operation/index.ts supabase/functions/delete-account/index.ts'], denoAvailabilityReadOnlyProbe: { command: 'where.exe deno.exe', exitCode: probe.status, state: probe.status === 0 ? 'AVAILABLE-PENDING-ACTUAL-CHECK' : 'UNAVAILABLE' }, missingDenoMeansUnverifiedAndNonzeroExit: true, perCommandDeadlineMs: 180000, deadlineCleanupGuard: 'Exact direct child PID/parent/unique command-line marker before taskkill tree; abort further commands if unverified.', legacyFunctions: legacy, execution: 'NOT-RUN' },
  servicesStarted: 0, browsersStarted: 0, databaseTestsRun: 0, typechecksRun: 0, privateConfigRead: false, oldReceiptsChanged: false };
const output = `${directory}/final25-extra-ci-preparation-validation.json`;
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, nativeSuites: preparation.allEightSuitesExactlyOnce.length, syntaxChecks: syntax.length, denoAvailability: report.extraCi.denoAvailabilityReadOnlyProbe.state }));
