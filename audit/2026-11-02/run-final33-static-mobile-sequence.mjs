// Explicitly coordinated sequence only. Preparation never executes this file.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, open, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';
assert.equal(process.env.SPAROWTYPE_FINAL33_STATIC_MOBILE_WINDOW, '1', 'Wait for the parent-coordinated static/mobile window after source gates and capacity close.');
const build = process.env.SPAROWTYPE_FINAL33_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/, 'Bind the stable actual source33 default build.');
assert.equal(process.env.SPAROWTYPE_STATIC_OUTPUTS, undefined, 'The dedicated static runner owns its artifact selection.');
const directory = 'audit/2026-11-02';
const sourceFile = `${directory}/final33-source.json`;
const output = `${directory}/final33-static-mobile-sequence.json`;
const protocolFile = `${directory}/final33-static-mobile-sequence-protocol.json`;
const staticFile = `${directory}/run-final33-static.mjs`;
const mobileFile = `${directory}/run-mobile-workspaces-static-final33.mjs`;
const assessmentFile = `${directory}/assess-final33-mobile-latency.mjs`;
const interactionFile = `${directory}/assess-final33-mobile-interaction-latency.mjs`;
const trials = [1, 2, 3].map(index => `mobile-workspaces-final33-static-${index}`);
const inputs = [import.meta.filename, sourceFile, staticFile, mobileFile, assessmentFile, interactionFile,
  `${directory}/measure-mobile-workspaces-static-final33.mjs`, `${directory}/artifact-verification.mjs`,
  `${directory}/verify-static-artifacts.mjs`, 'e2e/frontend-static-server.ts',
  'e2e/frontend-deployment.spec.ts', 'e2e/frontend-game-accessibility.spec.ts',
  'audit/2026-10-21/measure-mobile-workspaces.mjs', 'audit/2026-10-21/mobile-workspaces-final7-protocol.json',
  'e2e/live-keyboard.spec.ts', 'e2e/typing-render-budget.spec.ts', 'package-lock.json', 'playwright.config.ts'];
const source = await verifyFrozenSource(sourceFile);
assert.equal(source.receipt.compared, 505); assert.equal(source.frozen.local.version, build);
assert.equal(source.frozen.fullIntroSourceUnchanged, true); assert.deepEqual(source.receipt.mismatches, []);
const defaultBuild = await readFile('dist/offline-build.json');
assert.equal(JSON.parse(defaultBuild).version, build);
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
for (const file of [output, protocolFile, `${directory}/final33-static-process.json`,
  `${directory}/final33-static-artifacts.json`, 'dist-static-final33-vercel', 'dist-static-final33-pages',
  ...trials.flatMap(prefix => [`${directory}/${prefix}.json`, `${directory}/${prefix}-process.json`, `${directory}/${prefix}-latency-assessment.json`, `${directory}/${prefix}-interaction-latency-assessment.json`])])
  await assert.rejects(access(file), { code: 'ENOENT' }, 'The sequence never replaces any completed or partial result.');
const protocol = { declaredAt: new Date().toISOString(), build, sourceBefore: source.receipt, inputHashes,
  staticPrefix: 'final33', staticExpected: { artifactChecks: 67, deploymentBrowserCases: 56, gameAccessibilityCases: 16 },
  mobileTrials: trials, mobileCasesPerTrial: ['learn', 'course', 'local-bot', 'games'],
  mobileAcceptance: 'All four original cases in every declared trial must remain functionally valid and have measured p98 observed typing-event duration strictly below100ms. Null/unsupported is UNVERIFIED.',
  interactionAcceptance: 'Additionally every workspace in every declared trial must have p98ObservedInteractionMaximumMs strictly below100ms; event and interaction counts are retained and neither gate replaces the other.',
  source33EventCardinalityChangeDisclosed: true,
  workers: 1, retries: 0, staticAndMobileRunSequentially: true, automaticRetries: 0, resultFiltering: false,
  inputActionsTimingAssertionsChanged: false, fullQualitySceneChecksRetained: true,
  rootOwnedSeparateWindows: ['three ordinary home input trials', 'three full-quality mobile Lighthouse trials', 'full64-spec four-engine matrix', 'fresh-owner20 native cases', 'database/Deno CI-extra'],
  previousCandidateAndFailedReportsReusedAsAcceptance: false, actualPublicHostingClaimed: false, physicalDeviceOrFieldInpClaimed: false };
await writeFile(protocolFile, `${JSON.stringify(protocol, null, 2)}\n`, { flag: 'wx' });
const handle = await open(output, 'wx');
const report = { status: 'RUNNING', protocol: protocolFile, declaredAt: protocol.declaredAt, build,
  stages: [], mobileTrials: [], childClosed: true, source27And28And30FailuresPreserved: true };
let child = null, interrupted = false;
async function persistReport() {
  const body = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  await handle.truncate(0);
  for (let offset = 0; offset < body.length;) {
    const written = await handle.write(body, offset, body.length - offset, offset);
    assert.ok(written.bytesWritten > 0); offset += written.bytesWritten;
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { interrupted = true; if (child) child.kill(signal); });
async function integrity() {
  const state = await verifyFrozenSource(sourceFile);
  assert.equal(state.frozen.local.version, build); assert.equal(state.receipt.compared, 505); assert.deepEqual(state.receipt.mismatches, []);
  assert.equal(hash(await readFile('dist/offline-build.json')), hash(defaultBuild));
  for (const [file, expected] of Object.entries(inputHashes)) assert.equal(hash(await readFile(file)), expected, `Declared input changed: ${file}`);
  return { source: state.receipt, inputHashesUnchanged: true, defaultBuildMetadataUnchanged: true };
}
async function run(id, file, args = [], extra = {}) {
  assert.equal(interrupted, false, 'An interrupted sequence does not start a new stage.');
  await integrity();
  const logFile = `${directory}/final33-static-mobile-${id}.log`;
  const log = await open(logFile, 'wx');
  const row = { id, file, args, log: logFile, startedAt: new Date().toISOString(), status: 'RUNNING' };
  report.stages.push(row);
  console.log(JSON.stringify({ stage: 'final33-static-mobile-stage-start', id }));
  try {
    child = spawn(process.execPath, [file, ...args], { cwd: process.cwd(), windowsHide: true,
      env: { ...process.env, SPAROWTYPE_FINAL33_BUILD_ID: build, ...extra }, stdio: ['ignore', log.fd, log.fd] });
    row.pid = child.pid; report.childClosed = false;
    const result = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
    row.exitCode = result.code; row.signal = result.signal; report.childClosed = true;
    row.status = result.code === 0 && !interrupted ? 'PASS-SCOPED' : 'FAILED';
  } finally { child = null; row.finishedAt = new Date().toISOString(); await log.close(); }
  row.integrityAfter = await integrity();
  await persistReport();
  console.log(JSON.stringify({ stage: 'final33-static-mobile-stage-complete', id, status: row.status, exitCode: row.exitCode }));
  return row;
}
try {
  const staticRun = await run('static', staticFile, ['final33'], { SPAROWTYPE_STATIC_ACCEPTANCE: '1' });
  assert.equal(staticRun.status, 'PASS-SCOPED', 'Static gate failed; retain it and do not start mobile acceptance.');
  const staticReceipt = JSON.parse(await readFile(`${directory}/final33-static-process.json`, 'utf8'));
  const artifacts = JSON.parse(await readFile(`${directory}/final33-static-artifacts.json`, 'utf8'));
  assert.equal(staticReceipt.status, 'PASS-SCOPED');
  assert.equal(artifacts.status, 'PASS-SCOPED'); assert.equal(artifacts.checks.length, 67); assert.ok(artifacts.checks.every(item => item.pass));
  for (const [name, total] of [['deployment', 56], ['game-accessibility', 16]]) {
    assert.equal(staticReceipt[name].total, total); assert.equal(staticReceipt[name].pass, total);
    for (const field of ['fail', 'skip', 'flaky', 'errors']) assert.equal(staticReceipt[name][field], 0);
  }
  const vercel = artifacts.artifacts.find(item => item.directory === 'dist-static-final33-vercel');
  assert.ok(vercel); assert.equal(vercel.deployment.frontendOnly, true); assert.equal(vercel.deployment.api, 'disabled');
  report.static = { process: `${directory}/final33-static-process.json`, artifacts: `${directory}/final33-static-artifacts.json`,
    build: vercel.build, artifactChecks: 67, deploymentCases: 56, gameAccessibilityCases: 16,
    sceneIdentityProof: 'Every existing original scene/bloom/three/worker/bridge check in the67-check artifact receipt must pass; no candidate quality claim is substituted.' };
  for (const prefix of trials) {
    const measured = await run(prefix, mobileFile, [prefix], { SPAROWTYPE_MOBILE_STATIC_ACCEPTANCE: '1', SPAROWTYPE_FINAL33_STATIC_BUILD_ID: vercel.build.version });
    const processPath = `${directory}/${prefix}-process.json`;
    const raw = JSON.parse(await readFile(processPath, 'utf8'));
    assert.equal(raw.ownBrowserChildExited, true); assert.equal(raw.ownedServerClosed, true); assert.deepEqual(raw.apiRequests, []);
    const assessed = await run(`${prefix}-assessment`, assessmentFile, [prefix]);
    const assessmentPath = `${directory}/${prefix}-latency-assessment.json`;
    const assessment = JSON.parse(await readFile(assessmentPath, 'utf8'));
    const interactionRun = await run(`${prefix}-interaction-assessment`, interactionFile, [prefix]);
    const interactionPath = `${directory}/${prefix}-interaction-latency-assessment.json`;
    const interaction = JSON.parse(await readFile(interactionPath, 'utf8'));
    report.mobileTrials.push({ prefix, measurementStatus: measured.status, process: processPath,
      latencyStatus: assessment.status, assessment: assessmentPath, cases: assessment.cases,
      interactionGateStatus: interaction.status, interactionAssessment: interactionPath, interactionCases: interaction.cases });
    if (interactionRun.status !== 'PASS-SCOPED') report.anyMobileInteractionFailure = true;
    // All three declared trials remain retained even if one latency assessment
    // fails. No failure is retried, filtered, averaged away or replaced.
    assert.ok(['PASS-SCOPED', 'FAILED', 'UNVERIFIED'].includes(assessment.status));
    if (assessed.status !== 'PASS-SCOPED') report.anyMobileLatencyFailure = true;
  }
  report.status = !interrupted && report.mobileTrials.length === 3
    && report.stages.every(stage => stage.status === 'PASS-SCOPED')
    && report.mobileTrials.every(trial => trial.latencyStatus === 'PASS-SCOPED' && trial.interactionGateStatus === 'PASS-SCOPED') ? 'PASS-SCOPED-STATIC-AND-THREE-MOBILE-TRIALS' : 'FAILED';
} catch (error) { report.status = 'FAILED'; report.error = { name: error.name, message: String(error.message).slice(0, 500) }; }
finally {
  try { report.integrityAfter = await integrity(); } catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: String(error.message).slice(0, 500) }; }
  report.interrupted = interrupted; report.finishedAt = new Date().toISOString();
  await persistReport(); await handle.close();
}
console.log(JSON.stringify({ output, status: report.status, trials: report.mobileTrials.map(trial => ({ prefix: trial.prefix, status: trial.latencyStatus, interactionGateStatus: trial.interactionGateStatus, p98: trial.cases.map(item => ({ id: item.id, ms: item.p98ObservedTypingEventDurationMs })) })), childClosed: report.childClosed }));
process.exitCode = report.status === 'PASS-SCOPED-STATIC-AND-THREE-MOBILE-TRIALS' ? 0 : 1;
