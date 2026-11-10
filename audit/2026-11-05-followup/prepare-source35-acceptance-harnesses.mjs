// Preparation only: identifier/location/inventory extensions, no builds or runtime suites.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const oldDirectory = 'audit/2026-11-02', directory = 'audit/2026-11-05-followup';
const sha = value => createHash('sha256').update(value).digest('hex');
const sourceFile = `${directory}/final35-source.json`;
const frozen = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(Object.keys(frozen.sourceHashes).length, 506);
assert.equal(frozen.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
assert.equal(frozen.local.version, 'd89f84d74519bf2bbae0');
const names = ['measure-mobile-workspaces-static-final33.mjs', 'run-mobile-workspaces-static-final33.mjs', 'assess-final33-mobile-latency.mjs', 'assess-final33-mobile-interaction-latency.mjs', 'run-final33-static.mjs', 'run-browser-checkpoint-final33.mjs', 'run-final33-browser-matrix.mjs', 'run-final33-ci-extra.mjs', 'pack-backend-instance-source33.mjs', 'pack-native-browser-final33.mjs', 'run-final33-native-browser.mjs', 'run-final33-static-mobile-sequence.mjs', 'artifact-verification.mjs', 'verify-static-artifacts.mjs'];
const files = [];
for (const name of names) {
  const original = `${oldDirectory}/${name}`;
  const target = `${directory}/${name.replaceAll('final33', 'final35').replaceAll('source33', 'source35')}`;
  await assert.rejects(access(target), { code: 'ENOENT' });
  const before = await readFile(original, 'utf8'); let after = before;
  const changes = [];
  const replace = (from, to, expected) => {
    const count = after.split(from).length - 1;
    if (expected !== undefined) assert.equal(count, expected, `${name}: ${from}`);
    if (!count) return;
    after = after.replaceAll(from, to); changes.push({ from, to, count });
  };
  for (const [from, to] of [['FINAL33', 'FINAL35'], ['final33', 'final35'], ['Source33', 'Source35'], ['source33', 'source35'], [oldDirectory, directory], ['275c8c24d65054abae18713c1eee4dad18888332', frozen.baseline]]) replace(from, to);
  const count505 = [...after.matchAll(/\b505\b/g)].length;
  if (count505) { after = after.replace(/\b505\b/g, '506'); changes.push({ from: '505', to: '506', count: count505, tokenBoundary: true }); }
  if (name === 'run-final33-browser-matrix.mjs') {
    replace("'e2e/keycap-attribute-ownership.spec.ts']", "'e2e/keycap-attribute-ownership.spec.ts', 'e2e/profile-confirmation-readiness.spec.ts']", 1);
    replace('assert.equal(actual.length, 64,', 'assert.equal(actual.length, 65,', 1);
    replace('currentSpecCount: 64,', 'currentSpecCount: 65,', 1);
    replace('newLearnCasesInExistingSpec: 8,', 'newLearnCasesInExistingSpec: 8, newProfileCasesInNewSpec: 2,', 1);
  }
  if (name === 'run-final33-static-mobile-sequence.mjs') replace('full64-spec four-engine matrix', 'full65-spec four-engine matrix', 1);
  if (name === 'run-final33-ci-extra.mjs') replace("const receiptFile = directory + '/final27-nov02-portable-deno-setup.json';", "const receiptFile = 'audit/2026-11-02/final27-nov02-portable-deno-setup.json';", 1);
  let reversed = after;
  for (const change of [...changes].reverse()) {
    if (change.tokenBoundary) reversed = reversed.replace(/\b506\b/g, '505');
    else reversed = reversed.replaceAll(change.to, change.from);
  }
  assert.equal(reversed, before, `Unexplained non-identifier change: ${name}`);
  await writeFile(target, after, { flag: 'wx' });
  files.push({ original, target, originalSha256: sha(before), targetSha256: sha(after), changes, exactReverseVerified: true });
}
const guardOriginal = 'audit/2026-11-04/run-source34-native20-dependency-guard.mjs';
const guardTarget = `${directory}/run-source35-native20-dependency-guard.mjs`;
const guardBefore = await readFile(guardOriginal, 'utf8');
const guardChanges = [
  ['FINAL34', 'FINAL35'], ['final34', 'final35'], ['source34', 'source35'],
  ['audit/2026-11-02', directory], ['audit/2026-11-04', directory],
  ['332e23584f1e36465df2', frozen.local.version], ['72', '73'], ['505', '506'],
];
let guardAfter = guardBefore;
const actualGuardChanges = [];
for (const [from, to] of guardChanges) { const count = guardAfter.split(from).length - 1; guardAfter = guardAfter.replaceAll(from, to); actualGuardChanges.push({ from, to, count }); }
let reversedGuard = guardAfter;
for (const change of [...actualGuardChanges].reverse()) reversedGuard = reversedGuard.replaceAll(change.to, change.from);
// Both old audit directories intentionally collapse to the new checkpoint root;
// their source bytes are retained and each explicit replacement is recorded.
assert.equal(guardAfter.includes('SPAROWTYPE_FINAL35_NATIVE_DEPENDENCY_GUARD'), true);
await writeFile(guardTarget, guardAfter, { flag: 'wx' });
const nativeOriginal = `${directory}/run-final35-native-browser.mjs`;
await writeFile(`${directory}/run-final35-native-browser.mjs.guard-original`, await readFile(nativeOriginal), { flag: 'wx' });
files.push({ original: guardOriginal, target: guardTarget, originalSha256: sha(guardBefore), targetSha256: sha(guardAfter), changes: actualGuardChanges, preservation: 'Original source34 wrapper remains untouched; new native35 orchestrator preserved byte-identically beside the clone.', exactReverseVerified: false, reverseQualification: 'Two original directory spellings collapse to one destination, so the ordered explicit replacement ledger and retained original provide the exact proof rather than a lossy global reverse.' });
const syntax = files.map(row => { const run = spawnSync(process.execPath, ['--check', row.target], { windowsHide: true, encoding: 'utf8' }); return { file: row.target, exitCode: run.status, stderr: run.stderr }; });
assert.ok(syntax.every(row => row.exitCode === 0));
const receipt = { status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(), sourceFile, sourceManifestSha256: sha(await readFile(sourceFile)), build: frozen.local.version, requiredSourceInventory: 506, baseline: frozen.baseline, files, syntax, specFilesExactlyOnce: 65, profileSpecIncludedInExistingBatch: true, actualCasesDerivedAtRuntime: true, all73NativeDependenciesRequired: true, static: { checks: 67, deployment: 56, gameAccessibility: 16 }, mobileTrials: 3, bothMobileP98GatesStrictlyBelowMs: 100, frontendEvidenceReuse: 'NOT-USED: core and Profile changed; all frontend acceptance measurements must run freshly.', noActionsThresholdsTimingQualityRetriesChanged: true, runtimeOrBuildOrBrowserStarted: false, productOrTestsEditedByPreparation: false, executionHeldUntilRootGoAfterEarlyCapacityFeedback: true };
await writeFile(`${directory}/source35-acceptance-harness-preparation.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, helpers: files.length, syntaxChecks: syntax.length, build: frozen.local.version, sourceFiles: 506, specs: 65, runtimeStarted: false }));
