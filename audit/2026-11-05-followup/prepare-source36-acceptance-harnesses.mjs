// File preparation only. No build, measurement, browser, backend or tests run.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const directory = 'audit/2026-11-05-followup';
const sha = value => createHash('sha256').update(value).digest('hex');
const previousFile = `${directory}/source35-acceptance-harness-preparation.json`;
const previous = JSON.parse(await readFile(previousFile, 'utf8'));
const names = previous.files.map(row => row.target).filter(file => /(?:final35|source35)/.test(file));
names.push(`${directory}/run-input-final35.mjs`, `${directory}/run-final35-lighthouse.mjs`, `${directory}/assess-source35-home-input.mjs`);
assert.equal(names.length, 16);
const files = [];
for (const original of names) {
  const before = await readFile(original, 'utf8');
  const target = original.replaceAll('final35', 'final36').replaceAll('source35', 'source36');
  await assert.rejects(access(target), { code: 'ENOENT' });
  let after = before; const changes = [];
  const replace = (from, to, expected) => { const count = after.split(from).length - 1; if (expected !== undefined) assert.equal(count, expected, `${original}: ${from}`); if (count) { after = after.replaceAll(from, to); changes.push({ from, to, count }); } };
  for (const [from, to] of [['FINAL35', 'FINAL36'], ['final35', 'final36'], ['Source35', 'Source36'], ['source35', 'source36']]) replace(from, to);
  if (original.endsWith('/run-final35-browser-matrix.mjs')) {
    replace("frontendEvidenceReuse: 'NOT-USED'", "frontendEvidenceReuse: 'BUILD-ONLY-SOURCE35-IDENTICAL-FRONTEND-NO-PERFORMANCE-REUSE'", 1);
    replace('freshFrontendBuildRequired: true,', 'freshFrontendBuildRequired: false, retainedFrontendBuildIdentityRequired: true,', 1);
  }
  let reversed = after;
  for (const row of [...changes].reverse()) reversed = reversed.replaceAll(row.to, row.from);
  assert.equal(reversed, before);
  await writeFile(target, after, { flag: 'wx' });
  files.push({ original, target, originalSha256: sha(before), targetSha256: sha(after), changes, exactReversalVerified: true });
}
const originalNative = `${directory}/run-final36-native-browser.mjs`;
await writeFile(`${originalNative}.guard-original`, await readFile(originalNative), { flag: 'wx' });
const syntax = files.map(row => { const run = spawnSync(process.execPath, ['--check', row.target], { windowsHide: true, encoding: 'utf8' }); return { file: row.target, exitCode: run.status, stderr: run.stderr }; });
assert.ok(syntax.every(row => row.exitCode === 0));
const receipt = { status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(), previousPreparation: { file: previousFile, sha256: sha(await readFile(previousFile)) }, files, syntax, sharedUnchangedGenericHelpers: await Promise.all(['artifact-verification.mjs', 'verify-static-artifacts.mjs'].map(async name => ({ file: `${directory}/${name}`, sha256: sha(await readFile(`${directory}/${name}`)) }))), requiredSourceFile: `${directory}/final36-source.json`, expectedSourceCount: 506, expectedDefaultBuild: 'd89f84d74519bf2bbae0', baseline: '9b21e255ea1840508cbc35b625d0ccde8f3af7cc', source36BuildReuse: 'Same current source35 frontend build only; backend-only adoption. No source35 frontend runtime measurements exist.', freshFrontendMeasurementsRequired: { staticArtifacts: 67, deploymentCases: 56, gameAccessibilityCases: 16, mobileTrials: 3, bothMobileP98StrictlyBelowMs: 100, homeInputTrials: 3, fullQualityLighthouseTrials: 3, fullSpecFiles: 65, nativeCases: 20, nativeFreshOwners: 4, nativeDependencyCount: 73, databaseAndDenoCI: true }, unchangedDependencySha256: '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37', actionsThresholdsTimingsAssertionsQualityRetriesChanged: false, runtimeOrBuildStarted: 0, executionRequiresNewRootGoAfterSource36EarlyUncachedCapacity: true, sourceOrTestsOrSource35HelpersEdited: false };
await writeFile(`${directory}/source36-acceptance-harness-preparation.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, helpers: files.length, syntaxChecks: syntax.length, sameFrontendBuild: receipt.expectedDefaultBuild, performanceReuse: false, runtimeStarted: 0 }));
