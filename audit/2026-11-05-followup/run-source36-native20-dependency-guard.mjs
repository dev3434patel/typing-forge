// Guard-only wrapper. The preserved native20 orchestrator and its runtime behavior are unchanged.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL36_NATIVE_DEPENDENCY_GUARD, '1', 'Separate root authorization is required for guarded native20.');
assert.equal(process.env.SPAROWTYPE_FINAL36_NATIVE_BROWSER_WINDOW, '1');
assert.equal(process.env.SPAROWTYPE_FINAL36_BUILD_ID, 'd89f84d74519bf2bbae0');
assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC, undefined);
const expectedDependencyDigest = process.env.SPAROWTYPE_FINAL36_NATIVE_EXPECTED_DEPENDENCIES_SHA256;
assert.match(expectedDependencyDigest ?? '', /^[a-f0-9]{64}$/, 'Supply the approved final stable73-dependency digest after the test/helper revision.');
const output = 'audit/2026-11-05-followup/source36-native20-dependency-guard.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const original = 'audit/2026-11-05-followup/run-final36-native-browser.mjs';
const preserved = 'audit/2026-11-05-followup/run-final36-native-browser.mjs.guard-original';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const originalBytes = await readFile(original);
assert.equal(sha(originalBytes), sha(await readFile(preserved)), 'The native orchestrator must retain its exact preserved bytes.');
const dependencySnapshot = async () => {
  const files = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
  assert.equal(files.length, 73, 'Every current e2e TypeScript/config dependency must be included.');
  assert.ok(files.includes('e2e/helpers.ts'));
  const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(file))])));
  return { count: files.length, sha256: sha(JSON.stringify(hashes)), hashes };
};
const sourceIdentity = async () => {
  const source = await verifyFrozenSource('audit/2026-11-05-followup/final36-source.json');
  assert.equal(source.frozen.local.version, 'd89f84d74519bf2bbae0');
  assert.equal(source.receipt.compared, 506);
  assert.deepEqual(source.receipt.mismatches, []);
  assert.equal(JSON.parse(await readFile('dist/offline-build.json', 'utf8')).version, source.frozen.local.version);
  return source.receipt;
};
const before = await dependencySnapshot();
assert.equal(before.sha256, expectedDependencyDigest, 'Current dependencies differ from the approved final stable revision.');
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(),
  scope: 'Guard-only parent around the byte-identical original four-owner native20 orchestrator. All73 e2e/config dependency hashes, including generic helpers.ts, must match the approved final stable revision and remain unchanged across all20 cases.',
  original: { file: original, preserved, sha256: sha(originalBytes), byteIdentical: true },
  wrapperSha256: sha(await readFile(import.meta.filename)),
  sourceBefore: await sourceIdentity(),
  before, expectedDependencyDigest,
  buildMetadataBeforeSha256: sha(await readFile('dist/offline-build.json')),
  command: `node ${original}`,
  originalArgumentsChanged: false, originalEnvironmentChanged: false,
  behaviorAssertionsTitlesTimeoutsRetriesChanged: false,
  originalOrchestratorEdited: false,
  privateConfigOrEnvironmentValuesPublished: false,
};
await writeFile(output, JSON.stringify(report, null, 2), { flag: 'wx' });
let code = null;
try {
  code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [original], { cwd: process.cwd(), windowsHide: true, env: process.env, stdio: 'inherit' });
    child.once('error', reject); child.once('close', resolve);
  });
  report.originalExitCode = code;
} catch (error) {
  report.failure = { name: error.name, message: String(error.message).slice(0, 300) };
} finally {
  try {
    report.after = await dependencySnapshot();
    report.sourceAfter = await sourceIdentity();
    report.dependenciesUnchanged = JSON.stringify(report.after.hashes) === JSON.stringify(before.hashes);
    report.originalOrchestratorUnchanged = sha(await readFile(original)) === report.original.sha256;
    report.wrapperUnchanged = sha(await readFile(import.meta.filename)) === report.wrapperSha256;
    report.buildMetadataUnchanged = sha(await readFile('dist/offline-build.json')) === report.buildMetadataBeforeSha256;
    const nativeFile = 'audit/2026-11-05-followup/final36-native-browser.json';
    const nativeBytes = await readFile(nativeFile);
    const native = JSON.parse(nativeBytes);
    report.nativeReport = { file: nativeFile, sha256: sha(nativeBytes), status: native.status, engineRuns: native.engineRuns.map(run => ({ engine: run.engine, status: run.status, ownerId: run.ownerId, gracefulCleanupVerified: run.gracefulCleanupVerified })) };
    report.status = code === 0 && !report.failure && report.dependenciesUnchanged && report.originalOrchestratorUnchanged && report.wrapperUnchanged && report.buildMetadataUnchanged && native.status === 'PASS-SCOPED-NATIVE-BROWSER' ? 'PASS-SCOPED' : 'FAILED';
  } catch (error) {
    report.status = 'FAILED';
    report.verificationFailure = { name: error.name, message: String(error.message).slice(0, 300) };
  }
  report.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ output, status: report.status, originalExitCode: code, dependenciesUnchanged: report.dependenciesUnchanged, sourceFiles: report.sourceAfter?.compared }));
  process.exitCode = report.status === 'PASS-SCOPED' ? 0 : 1;
}
