// Prepared only. Do not execute before root releases the separate tooling window.
import assert from 'node:assert/strict';
import { access, mkdir, open, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL25_DENO_PORTABLE, '1', 'Portable runtime download requires the separately coordinated GO.');
assert.equal(process.platform, 'win32'); assert.equal(process.arch, 'x64');
const directory = 'audit/2026-10-27';
const planFile = `${directory}/final25-portable-deno-plan.json`, plan = JSON.parse(await readFile(planFile, 'utf8'));
const output = `${directory}/final25-portable-deno-setup.json`, protocolFile = `${directory}/final25-portable-deno-setup-protocol.json`;
for (const file of [output, protocolFile, plan.workspaceDirectory]) await assert.rejects(access(file), { code: 'ENOENT' });
const sourceFile = `${directory}/final25-source.json`, initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.receipt.compared, 504); assert.deepEqual(initial.receipt.mismatches, []);
assert.equal(initial.frozen.local.version, '6cdddf1a74b2d10d1c9b');
assert.equal(process.env.SPAROWTYPE_FINAL25_BUILD_ID, initial.frozen.local.version);
const repositoryRoot = await realpath('.'), runtimeRoot = path.resolve(plan.workspaceDirectory);
assert.equal(path.dirname(runtimeRoot), path.resolve(directory)); assert.equal(path.basename(runtimeRoot), '.final25-runtime');
const ignored = spawnSync('git', ['check-ignore', plan.binaryRelativePath], { windowsHide: true, encoding: 'utf8', timeout: 5000 });
assert.equal(ignored.status, 0); assert.equal(ignored.stdout.trim(), plan.binaryRelativePath);
const inputs = [import.meta.filename, planFile, sourceFile];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const protocol = { declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN', build: initial.frozen.local.version, sourceBefore: initial.receipt, inputHashes, pinnedVersion: plan.release.version, releaseUrl: plan.release.url, pinnedApiUrl: plan.release.apiPinnedMetadataSource,
  archive: plan.archive, checksumSidecar: plan.checksumSidecar, destinationIgnored: true, downloadAttemptsPerAsset: 1, automaticRetries: 0, globalInstall: false, pathOrProfileChange: false, typecheckIncluded: false, servicesStarted: false, privateConfigRead: false };
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
let failure = null, metadata = null, archive = null, sidecar = null, executable = null, version = null, extraction = null;
const writeAll = async (file, chunk) => {
  let offset = 0;
  while (offset < chunk.length) {
    const { bytesWritten } = await file.write(chunk, offset, chunk.length - offset);
    assert.ok(bytesWritten > 0, 'Asset write made no progress.'); offset += bytesWritten;
  }
};
const request = async (url, maximumBytes, callback) => {
  const controller = new AbortController(), deadline = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal, headers: { 'User-Agent': 'SparowType-audit-portable-runtime', Accept: url.includes('api.github.com') ? 'application/vnd.github+json' : 'application/octet-stream' } });
    assert.equal(response.ok, true, `Official request failed with HTTP${response.status}`);
    const final = new URL(response.url);
    assert.equal(final.protocol, 'https:');
    assert.ok(['api.github.com', 'github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(final.hostname));
    const digest = createHash('sha256'); let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length; assert.ok(bytes <= maximumBytes, 'Official asset exceeded the declared bound.');
      digest.update(chunk); await callback(chunk);
    }
    return { bytes, sha256: digest.digest('hex'), finalHost: final.hostname };
  } finally { clearTimeout(deadline); }
};
try {
  const jsonChunks = [];
  await request(plan.release.apiPinnedMetadataSource, 2000000, chunk => { jsonChunks.push(Buffer.from(chunk)); });
  const release = JSON.parse(Buffer.concat(jsonChunks).toString('utf8'));
  assert.equal(release.id, plan.release.id); assert.equal(release.tag_name, plan.release.tag); assert.equal(release.draft, false); assert.equal(release.prerelease, false);
  assert.equal(release.published_at, plan.release.publishedAt); assert.equal(release.html_url, plan.release.url);
  for (const asset of [plan.archive, plan.checksumSidecar]) {
    const matches = release.assets.filter(actual => actual.name === asset.name);
    assert.equal(matches.length, 1);
    const actual = matches[0]; assert.equal(actual.id, asset.id); assert.equal(actual.size, asset.bytes);
    assert.equal(actual.browser_download_url, asset.url); assert.equal(actual.digest, `sha256:${asset.sha256}`);
  }
  metadata = { releaseId: release.id, tag: release.tag_name, publishedAt: release.published_at, pinnedAssetsMatched: true };
  await mkdir(runtimeRoot);
  assert.equal(await realpath(runtimeRoot), runtimeRoot);
  assert.ok(runtimeRoot.startsWith(repositoryRoot + path.sep));
  const binaryDirectory = path.join(runtimeRoot, `deno-${plan.release.tag}`), cacheDirectory = path.join(runtimeRoot, 'cache');
  await mkdir(binaryDirectory); await mkdir(cacheDirectory);
  const checksumPath = path.join(runtimeRoot, plan.checksumSidecar.name), checksumFile = await open(checksumPath, 'wx');
  try { sidecar = await request(plan.checksumSidecar.url, plan.checksumSidecar.bytes, chunk => writeAll(checksumFile, chunk)); }
  finally { await checksumFile.close(); }
  assert.equal(sidecar.bytes, plan.checksumSidecar.bytes); assert.equal(sidecar.sha256, plan.checksumSidecar.sha256);
  assert.equal(hash(await readFile(checksumPath)), plan.checksumSidecar.sha256);
  const checksumText = await readFile(checksumPath, 'utf8'), tokens = checksumText.match(/\b[a-f0-9]{64}\b/gi) ?? [];
  assert.deepEqual(tokens.map(value => value.toLowerCase()), [plan.archive.sha256]); assert.ok(checksumText.includes(plan.archive.name));
  const archivePath = path.join(runtimeRoot, plan.archive.name), partPath = `${archivePath}.part`, archiveFile = await open(partPath, 'wx');
  try { archive = await request(plan.archive.url, plan.archive.bytes, chunk => writeAll(archiveFile, chunk)); }
  finally { await archiveFile.close(); }
  assert.equal(archive.bytes, plan.archive.bytes); assert.equal(archive.sha256, plan.archive.sha256);
  const downloadedArchive = await readFile(partPath); assert.equal(downloadedArchive.length, plan.archive.bytes); assert.equal(hash(downloadedArchive), plan.archive.sha256);
  await rename(partPath, archivePath);
  const quote = value => `'${value.replaceAll("'", "''")}'`;
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; $a=[System.IO.Compression.ZipFile]::OpenRead(${quote(archivePath)}); try { if($a.Entries.Count -ne 1){throw 'Unexpected archive entry count'}; $e=$a.Entries[0]; if($e.FullName -cne 'deno.exe' -or $e.Length -lt 1000000 -or $e.Length -gt 200000000){throw 'Unexpected archive executable boundary'}; [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e,${quote(path.join(binaryDirectory, 'deno.exe'))},$false); @{entry='deno.exe';bytes=$e.Length;entries=$a.Entries.Count}|ConvertTo-Json -Compress } finally {$a.Dispose()}`;
  const expanded = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, encoding: 'utf8', timeout: 30000, maxBuffer: 100000 });
  assert.equal(expanded.status, 0, 'Verified ZIP extraction failed.'); assert.equal(expanded.stderr, ''); extraction = JSON.parse(expanded.stdout);
  assert.equal(extraction.entries, 1); assert.equal(extraction.entry, 'deno.exe');
  const binary = await realpath(plan.binaryRelativePath); assert.equal(path.dirname(binary), binaryDirectory);
  const binaryBytes = await readFile(binary); assert.equal(binaryBytes.length, extraction.bytes);
  executable = { relativePath: plan.binaryRelativePath, absolutePath: binary, bytes: binaryBytes.length, sha256: hash(binaryBytes) };
  const check = spawnSync(binary, ['--version'], { windowsHide: true, encoding: 'utf8', timeout: 15000, maxBuffer: 100000, env: { ...process.env, DENO_DIR: cacheDirectory, DENO_NO_UPDATE_CHECK: '1' } });
  assert.equal(check.status, 0); assert.equal(check.stderr, '');
  assert.match(check.stdout, /^deno 2\.9\.8 \(stable, release, x86_64-pc-windows-msvc\)/);
  version = { command: 'Verified absolute portable binary --version', exitCode: check.status, output: check.stdout.trim(), typecheckExecuted: false };
} catch (error) { failure = { name: error.name, message: String(error.message).slice(0, 400) }; }
finally {
  const after = (await verifyFrozenSource(sourceFile)).receipt;
  const inputsUnchanged = (await Promise.all(inputs.map(async file => hash(await readFile(file)) === inputHashes[file]))).every(Boolean);
  const passed = !failure && metadata && archive && sidecar && executable && version && after.compared === 504 && after.mismatches.length === 0 && inputsUnchanged;
  const report = { status: passed ? 'PASS-SCOPED-PORTABLE-RUNTIME-VERIFIED' : 'FAILED', finishedAt: new Date().toISOString(), protocol, metadata, archive, sidecar, extraction, executable, version, failure, sourceAfter: after, inputsUnchanged,
    nextCiEnvironment: passed ? { SPAROWTYPE_DENO_BINARY: executable.absolutePath, DENO_DIR: path.join(runtimeRoot, 'cache'), DENO_NO_UPDATE_CHECK: '1' } : null,
    globalInstallationOrPathChange: false, sourcePackageOrLockfileChanged: false, servicesStarted: false, databaseConnected: false, typecheckExecuted: false,
    historicalPathUnavailableProbePreserved: true, runtimeFilesGitIgnored: true, partialRuntimeFilesRetainedOnFailure: true, automaticRetry: false };
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, output, version: plan.release.version, verifiedBinary: passed ? executable.absolutePath : null }));
  process.exitCode = passed ? 0 : 1;
}
