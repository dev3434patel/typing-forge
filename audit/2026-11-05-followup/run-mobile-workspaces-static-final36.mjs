import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { filesWithin, hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_MOBILE_STATIC_ACCEPTANCE, '1', 'Only execute in the coordinated quiet measurement window.');
const root = path.resolve(import.meta.dirname, '../..');
process.chdir(root);
const audit = 'audit/2026-11-05-followup';
const prefix = process.argv[2] || 'mobile-workspaces-final36-static';
assert.match(prefix, /^mobile-workspaces-final36-static(?:-[a-z0-9]+)*$/);
assert.ok(process.argv.length <= 3);
const directory = 'dist-static-final36-vercel';
const sourceFile = `${audit}/final36-source.json`;
const sourceIdentity = process.env.SPAROWTYPE_FINAL36_BUILD_ID;
assert.match(sourceIdentity ?? '', /^[a-f0-9]{20}$/);
const artifactIdentity = process.env.SPAROWTYPE_FINAL36_STATIC_BUILD_ID;
assert.match(artifactIdentity ?? '', /^[a-f0-9]{20}$/);
const originalDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';
const driver = `${audit}/measure-mobile-workspaces-static-final36.mjs`;
const originalProtocol = 'audit/2026-10-21/mobile-workspaces-final7-protocol.json';
const protocolFile = `${audit}/${prefix}-protocol.json`;
const buildFile = `${audit}/${prefix}-build.json`;
const processFile = `${audit}/${prefix}-process.json`;
const logFile = `${audit}/${prefix}.log`;
const resultFile = `${audit}/${prefix}.json`;
for (const file of [protocolFile, buildFile, processFile, logFile, resultFile, `${audit}/${prefix}-run-protocol.json`])
  await assert.rejects(access(file), { code: 'ENOENT' }, 'A unique prefix is required; earlier measurements must never be replaced.');
const driverHash = hash(await readFile(driver));
const wrapperHash = hash(await readFile(import.meta.filename));
const referenceChanges = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-11-05-followup';"],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final36-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final36-static-protocol.json`'],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final36-static-build.json`'],
];
const original = await readFile(originalDriver, 'utf8');
let expected = original;
for (const [from, to] of referenceChanges) {
  assert.equal(expected.split(from).length - 1, 1);
  expected = expected.replace(from, to);
}
assert.equal(await readFile(driver, 'utf8'), expected, 'Only audit directory and default protocol/build/output references may differ; input, timing and every assertion remain identical.');
const originalHash = hash(original);
const protocolBytes = await readFile(originalProtocol);
const originalProtocolHash = hash(protocolBytes);
const protocol = JSON.parse(protocolBytes);
assert.equal(protocol.cpuThrottle, 4);
assert.equal(protocol.caseTimeoutMs, 33000);
assert.equal(protocol.totalWatchdogMs, 145000);
assert.deepEqual(protocol.cases.map(item => item.id), ['learn', 'course', 'local-bot', 'games']);
const frozen = await verifyFrozenSource(sourceFile);
assert.equal(frozen.frozen.local.version, sourceIdentity);
assert.equal(frozen.receipt.compared, 506);
assert.equal(frozen.frozen.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
assert.equal(frozen.frozen.fullIntroSourceUnchanged, true);
assert.deepEqual(frozen.receipt.mismatches, []);
const historicalArtifactVerification = JSON.parse(await readFile(`${audit}/final36-static-artifacts.json`, 'utf8'));
assert.equal(historicalArtifactVerification.status, 'PASS-SCOPED');
const declaredArtifact = historicalArtifactVerification.artifacts.find(item => item.directory === directory);
assert.equal(declaredArtifact.build.version, artifactIdentity);

async function verifyArtifact() {
  const deployment = JSON.parse(await readFile(`${directory}/deployment.json`, 'utf8'));
  const build = JSON.parse(await readFile(`${directory}/offline-build.json`, 'utf8'));
  assert.deepEqual(deployment, declaredArtifact.deployment);
  assert.deepEqual(build, declaredArtifact.build);
  assert.equal(deployment.frontendOnly, true); assert.equal(deployment.api, 'disabled'); assert.equal(deployment.base, '/');
  const worker = await readFile(`${directory}/sw.js`, 'utf8');
  const paths = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)?.[1] || 'null');
  assert.ok(Array.isArray(paths));
  assert.equal(paths.length, build.publicFiles); assert.equal(new Set(paths).size, paths.length);
  const template = await readFile('public/sw.js', 'utf8');
  const digest = createHash('sha256').update(template).update(JSON.stringify({ base: deployment.base, frontendOnly: true }));
  let bytes = 0;
  for (const name of paths) {
    assert.ok(name.startsWith('/') && !name.includes('..') && !/[?#\\]/.test(name));
    const contents = await readFile(path.join(directory, name.slice(1)));
    digest.update(name); digest.update(contents); bytes += contents.length;
  }
  assert.equal(digest.digest('hex').slice(0, 20), artifactIdentity, 'Every declared public byte must recompute the original artifact version.');
  assert.equal(bytes, build.bytes);
  assert.equal(worker, template.replace('__SPAROWTYPE_BUILD__', artifactIdentity)
    .replace('/*__SPAROWTYPE_PRECACHE__*/ []', JSON.stringify(paths))
    .replace('/*__SPAROWTYPE_BASE__*/ "/"', JSON.stringify(deployment.base))
    .replace('/*__SPAROWTYPE_STATIC__*/ false', 'true'));
  const hashes = Object.fromEntries(await Promise.all((await filesWithin(directory)).map(async file => [file, hash(await readFile(path.join(directory, file)))])));
  return { deployment, build, publicFilesRecomputed: paths.length, publicBytesRecomputed: bytes, versionDigestRecomputed: true, hashes };
}

const before = await verifyArtifact();
const report = {
  status: 'RUNNING', declaredAt: new Date().toISOString(), source: frozen.receipt,
  deploymentMode: 'Real frontend-only Vercel build, owned loopback directory server; API disabled in compiled artifact. No mocks or PHP.',
  artifactDirectory: directory, artifactBefore: before,
  preservedNormalReport: 'audit/2026-10-21/mobile-workspaces-final7.json',
  measurementDriver: { file: driver, sha256: driverHash, original: originalDriver, originalSha256: originalHash, referenceChanges, assertionsAndTimingByteIdentical: true },
  automaticRetries: 0, resultFiltering: false, ownBrowserChildExited: false,
};
const receipt = await open(processFile, 'wx');
let temporary, server, child, log;
try {
  const require = createRequire(import.meta.url);
  const { build } = createRequire(require.resolve('vite'))('esbuild');
  temporary = await mkdtemp(path.join(tmpdir(), 'sparow-mobile-static-'));
  const helper = path.join(temporary, 'static-server.mjs');
  await build({ entryPoints: ['e2e/frontend-static-server.ts'], outfile: helper, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  const { startFrontendStaticServer } = await import(pathToFileURL(helper).href);
  server = await startFrontendStaticServer(directory);
  report.origin = server.baseURL.replace(/\/$/, '');
  const actualProtocol = {
    ...protocol, preparedAt: new Date().toISOString(), status: 'DECLARED BEFORE THIS STATIC EXECUTION',
    origin: report.origin, buildFile, expectedBuild: artifactIdentity,
    sourceFile, sourceExpectedBuild: sourceIdentity,
    deploymentMode: 'frontend-only-vercel; real API-disabled artifact; no mocks, no PHP, no live account or database',
    artifactDirectory: directory, originalNormalProtocol: originalProtocol,
    comparability: 'Separate explicitly declared frontend-only measurement. The earlier backend-enabled run and all failures remain preserved; this does not replace it or establish field INP.',
  };
  await writeFile(buildFile, JSON.stringify({ local: before.build, sourceFile, sourceExpectedBuild: sourceIdentity, sourceFiles: frozen.receipt.compared, deployment: before.deployment, publicVersionDigestRecomputed: true }, null, 2) + '\n', { flag: 'wx' });
  await writeFile(protocolFile, JSON.stringify(actualProtocol, null, 2) + '\n', { flag: 'wx' });
  log = await open(logFile, 'wx');
  report.command = [process.execPath, driver, prefix, protocolFile];
  report.startedAt = new Date().toISOString();
  child = spawn(process.execPath, report.command.slice(1), { cwd: root, windowsHide: true, stdio: ['ignore', log.fd, log.fd] });
  report.pid = child.pid;
  const exit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (code, signal) => resolve({ code, signal })); });
  report.exitCode = exit.code; report.signal = exit.signal; report.ownBrowserChildExited = true;
  const measured = JSON.parse(await readFile(resultFile, 'utf8'));
  report.measured = { report: resultFile, completed: measured.completed, watchdogExpired: measured.watchdogExpired,
    cases: measured.cases.map(item => ({ id: item.id, passed: item.passed, timing: item.timing, evidence: item.evidence, pageErrors: item.pageErrors, consoleErrors: item.consoleErrors, failure: item.failure })) };
  report.status = exit.code === 0 && measured.completed && measured.cases.length === 4 && measured.cases.every(item => item.passed) ? 'PASS-SCOPED' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.error = { name: error.name, message: error.message }; }
finally {
  if (log) await log.close();
  report.serverRequests = server?.requests || [];
  report.apiRequests = report.serverRequests.filter(request => /^\/(?:api|auth\/v1|rest\/v1|functions\/v1)(?:\/|$)/.test(request.path));
  if (report.apiRequests.length) report.status = 'FAILED';
  await server?.stop(); report.ownedServerClosed = Boolean(server);
  if (temporary) {
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()));
    assert.match(path.basename(temporary), /^sparow-mobile-static-/);
    await rm(temporary, { recursive: true, force: true });
  }
  try {
    const after = await verifyFrozenSource(sourceFile);
    report.sourceAfter = after.receipt;
    report.artifactAfter = await verifyArtifact();
    report.hashesUnchanged = JSON.stringify(before.hashes) === JSON.stringify(report.artifactAfter.hashes);
    report.driverUnchanged = hash(await readFile(driver)) === driverHash && hash(await readFile(import.meta.filename)) === wrapperHash && hash(await readFile(originalDriver)) === originalHash;
    report.originalProtocolUnchanged = hash(await readFile(originalProtocol)) === originalProtocolHash;
    if (after.receipt.mismatches.length || !report.hashesUnchanged || !report.driverUnchanged || !report.originalProtocolUnchanged) report.status = 'FAILED';
  } catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: error.message }; }
  report.finishedAt = new Date().toISOString();
  await receipt.writeFile(JSON.stringify(report, null, 2) + '\n'); await receipt.close();
}
console.log(JSON.stringify({ status: report.status, sourceBuild: sourceIdentity, artifactBuild: artifactIdentity, report: processFile, cases: report.measured?.cases.map(item => ({ id: item.id, passed: item.passed, p98: item.timing?.p98ObservedTypingEventDurationMs })), apiRequests: report.apiRequests.length, ownBrowserChildExited: report.ownBrowserChildExited, ownedServerClosed: report.ownedServerClosed }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
