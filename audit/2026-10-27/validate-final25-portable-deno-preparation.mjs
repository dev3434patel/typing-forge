// Preparation validation only; no network, extraction or runtime invocation.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const planFile = `${directory}/final25-portable-deno-plan.json`, script = `${directory}/setup-final25-portable-deno.mjs`;
const planBytes = await readFile(planFile), plan = JSON.parse(planBytes);
assert.equal(plan.release.tag, 'v2.9.8'); assert.equal(plan.release.version, '2.9.8');
assert.match(plan.archive.sha256, /^[a-f0-9]{64}$/); assert.match(plan.checksumSidecar.sha256, /^[a-f0-9]{64}$/);
assert.equal(plan.archive.bytes, 42917472); assert.equal(plan.checksumSidecar.bytes, 177);
for (const file of [script, import.meta.filename]) {
  const check = spawnSync(process.execPath, ['--check', file], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(check.status, 0, file);
}
const ignored = spawnSync('git', ['check-ignore', plan.binaryRelativePath], { windowsHide: true, encoding: 'utf8', timeout: 5000 });
assert.equal(ignored.status, 0); assert.equal(ignored.stdout.trim(), plan.binaryRelativePath);
await assert.rejects(access(plan.workspaceDirectory), { code: 'ENOENT' });
await assert.rejects(access(`${directory}/final25-portable-deno-setup.json`), { code: 'ENOENT' });
const report = { status: 'PASS-PREPARATION-ONLY', recordedAt: new Date().toISOString(), planFile, planSha256: hash(planBytes), script, scriptSha256: hash(await readFile(script)), syntax: 'PASS', ignoredDestinationChecked: true, destinationAbsent: true, setupReceiptAbsent: true,
  verifiedOfficialMetadata: { source: plan.release.apiLatestMetadataSource, independentBrowserSource: plan.release.url, publishedAt: plan.release.publishedAt, tag: plan.release.tag, releaseId: plan.release.id, archiveAssetId: plan.archive.id, checksumAssetId: plan.checksumSidecar.id, archivePublishedSha256: plan.archive.sha256, sidecarPublishedSha256: plan.checksumSidecar.sha256 },
  metadataResearchOnly: true, binaryOrArchiveDownloaded: false, checksumFileDownloaded: false, extractionRun: false, portableBinaryExecuted: false, typechecksRun: false, globalInstallOrConfigurationChange: false, servicesStarted: false, extraCiRunnerAbsoluteBinarySupported: true,
  executionCommandAfterRootGo: 'Set SPAROWTYPE_FINAL25_DENO_PORTABLE=1 and SPAROWTYPE_FINAL25_BUILD_ID=6cdddf1a74b2d10d1c9b; then node audit/2026-10-27/setup-final25-portable-deno.mjs',
  nextStepAfterVerifiedSetup: 'Use setup receipt nextCiEnvironment values for SPAROWTYPE_DENO_BINARY, DENO_DIR and DENO_NO_UPDATE_CHECK when the separately coordinated extra CI runner executes.',
  historicalDenoPathUnavailableProbeUnchanged: true };
const output = `${directory}/final25-portable-deno-preparation-validation.json`;
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, pinnedVersion: plan.release.version, downloaded: false, runtimeDirectoryCreated: false }));
