import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { filesWithin, hash, verifyFrozenSource, sceneAssets, qualityBaseline, compareQuality } from './artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_MOBILE_NATIVE_PIPELINE, '1', 'Wait for the separately coordinated source28 DIAGNOSTIC window.');
const root = path.resolve(import.meta.dirname, '../..');
process.chdir(root);
const audit = 'audit/2026-11-02';
const prefix = process.argv[2] || 'final28-mobile-native-pipeline';
assert.match(prefix, /^final28-mobile-native-pipeline(?:-[a-z0-9]+)*$/);
assert.ok(process.argv.length <= 3);
const directory = 'dist-static-final28-candidate-vercel';
const sourceFile = `${audit}/final28-source.json`;
const sourceIdentity = process.env.SPAROWTYPE_FINAL28_BUILD_ID;
assert.match(sourceIdentity ?? '', /^[a-f0-9]{20}$/);
const artifactIdentity = process.env.SPAROWTYPE_FINAL28_STATIC_BUILD_ID;
assert.match(artifactIdentity ?? '', /^[a-f0-9]{20}$/);
const originalDriver = 'audit/2026-11-02/measure-mobile-workspaces-static-final28.mjs';
const driver = `${audit}/measure-mobile-native-pipeline-final28.mjs`;
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
const planFile = 'audit/2026-11-02/final28-mobile-native-pipeline-preparation-v2.json';
const plan = JSON.parse(await readFile(planFile, 'utf8'));
const referenceChanges = plan.driverTransforms;
const original = await readFile(originalDriver, 'utf8');
let reversed = await readFile(driver, 'utf8');
for (const item of [...referenceChanges].reverse()) { assert.equal(reversed.split(item.to).length-1,item.count); reversed = reversed.replaceAll(item.to,item.from); }
assert.equal(reversed,original,'Only declared diagnostic insertions may differ; original input actions and functional assertions remain.');
const originalHash = hash(original);
assert.equal(originalHash,plan.originalDriverSha256);
const helperFiles = ['audit/2026-11-02/mobile-native-pipeline-runtime.mjs','audit/2026-11-02/mobile-native-pipeline-analysis.mjs',planFile,sourceFile];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file=>[file,hash(await readFile(file))])));
for(const [file,expected] of Object.entries(plan.helperHashes))assert.equal(helperHashes[file],expected);
for(const id of ['learn','local-bot'])for(const suffix of ['-trace.json','-timeline.json']){
 const file=`${audit}/.${prefix}-${id}${suffix}`;
 assert.equal(spawnSync('git',['check-ignore',file],{encoding:'utf8',windowsHide:true}).status,0,'Raw trace artifacts must stay Git-ignored.');
}
const protocolBytes = await readFile(originalProtocol);
const originalProtocolHash = hash(protocolBytes);
const protocol = JSON.parse(protocolBytes);
assert.equal(protocol.cpuThrottle, 4);
assert.equal(protocol.caseTimeoutMs, 33000);
assert.equal(protocol.totalWatchdogMs, 145000);
assert.deepEqual(protocol.cases.map(item => item.id), ['learn', 'course', 'local-bot', 'games']);
const frozen = await verifyFrozenSource(sourceFile);
assert.equal(frozen.frozen.local.version, sourceIdentity);
assert.equal(frozen.receipt.compared, 505);
assert.equal(frozen.frozen.baseline, '275c8c24d65054abae18713c1eee4dad18888332');
assert.equal(frozen.frozen.fullIntroSourceUnchanged, true);
assert.deepEqual(frozen.receipt.mismatches, []);
// Candidate runs before the separate full67-check/two-target static gate. Bind
// the actual candidate manifests and compare the original 3D render assets now;
// this does not reuse or relabel a normal static acceptance receipt.
const declaredArtifact = {
  directory,
  build: JSON.parse(await readFile(`${directory}/offline-build.json`, 'utf8')),
  deployment: JSON.parse(await readFile(`${directory}/deployment.json`, 'utf8')),
};
assert.equal(declaredArtifact.build.version, artifactIdentity);
assert.equal(declaredArtifact.deployment.target, 'vercel');
const candidateSceneAssets = await sceneAssets(directory);
const candidateQuality = compareQuality(candidateSceneAssets, await qualityBaseline('audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json'));
assert.equal(candidateQuality.length, 5);
assert.ok(candidateQuality.every(item => item.pass), 'Candidate preserves every original3D asset quality check.');

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
  deploymentMode: 'Candidate-only real frontend-only Vercel build, owned loopback directory server; API disabled in compiled artifact. No mocks or PHP.',
  candidateOnly: true, wholeProductAcceptance: false, normalStaticEvidenceReused: false, candidateSceneAssets, candidateQuality,
  acceptanceLimit: 'One source28 candidate production build and unchanged four-case mobile diagnostic. Full67-check/two-target static validation and three ordinary mobile trials remain separate required gates.',
  artifactDirectory: directory, artifactBefore: before,
  preservedNormalReport: 'audit/2026-10-21/mobile-workspaces-final7.json',
  measurementDriver: { file: driver, sha256: driverHash, original: originalDriver, originalSha256: originalHash, referenceChanges, assertionsAndOriginalInputSequencePreserved: true, diagnosticTimingOverhead: true, timingAcceptanceReused: false },
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
    artifactDirectory: directory, originalNormalProtocol: originalProtocol, diagnostic: true,
    cases: protocol.cases.filter(item => ['learn','local-bot'].includes(item.id)),
    setterProbeEnabled: process.env.SPAROWTYPE_MOBILE_NATIVE_SETTER_PROBE === '1',
    instrumentation: 'Typing-window streamed CDP devtools.timeline + blink.user_timing;32MB trace buffer/64MB raw-file cap; no screenshots or V8 sampling. Optional transparent native textarea setters installed before React; exact prototype descriptor restoration.',
    comparability: 'DIAGNOSTIC only: Learn and local BOT selected before execution, identical native actions and4xCPU. Source28 candidate104/64/120/24ms and source27 failures remain unchanged. Tracing and getters perturb execution; no SLO or field INP claim.',
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
  report.status = exit.code === 0 && measured.completed && measured.cases.length === 2 && measured.cases.every(item => item.passed && item.pipeline?.status === 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') ? 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE' : 'FAILED';
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
    report.helperInputsUnchanged = (await Promise.all(helperFiles.map(async file=>hash(await readFile(file))===helperHashes[file]))).every(Boolean);
    if (after.receipt.mismatches.length || !report.hashesUnchanged || !report.driverUnchanged || !report.originalProtocolUnchanged || !report.helperInputsUnchanged) report.status = 'FAILED';
  } catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: error.message }; }
  report.finishedAt = new Date().toISOString();
  await receipt.writeFile(JSON.stringify(report, null, 2) + '\n'); await receipt.close();
}
console.log(JSON.stringify({ status: report.status, sourceBuild: sourceIdentity, artifactBuild: artifactIdentity, report: processFile, cases: report.measured?.cases.map(item => ({ id: item.id, passed: item.passed, p98: item.timing?.p98ObservedTypingEventDurationMs })), apiRequests: report.apiRequests.length, ownBrowserChildExited: report.ownBrowserChildExited, ownedServerClosed: report.ownedServerClosed }));
if (report.status !== 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') process.exitCode = 1;
