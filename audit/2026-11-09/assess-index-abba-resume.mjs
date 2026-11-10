import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const directory = 'audit/2026-11-05-followup';
const ownerId = '15643f7ac91af72a';
const output = 'audit/2026-11-09/index-abba-resume-assessment.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const hash = value => createHash('sha256').update(value).digest('hex');
const references = {};
async function json(file) {
  const bytes = await readFile(file);
  references[file] = hash(bytes);
  return JSON.parse(bytes);
}
const ownedReceipt = suffix => `${directory}/pack-backend-${ownerId}-${suffix}.json`;
const preparation = await json(`${directory}/index-abba-preparation-v2.json`);
assert.equal(references[`${directory}/index-abba-preparation-v2.json`], 'eaf8b7cfcc121b9337a5013c7c4ee6b0303fa3c35d937fbe291e651692d43d52');
const summary = await json(ownedReceipt('index-abba-summary'));
const runtime = await json(ownedReceipt('apache-runtime'));
const cleanup = await json(ownedReceipt('cleanup'));
const finalInputs = await json(ownedReceipt('index-abba-final-inputs'));
const privateBefore = await json(ownedReceipt('index-abba-private-input-hashes-before'));
const privateFinal = await json(ownedReceipt('index-abba-private-input-hashes-final'));
const startup = await json(ownedReceipt('index-abba-startup-resources'));
assert.equal(summary.allFourCompleted, true);
assert.equal(summary.allInputsUnchanged, true);
assert.equal(summary.diagnosticOnly, true);
assert.equal(summary.ordinaryAcceptance, false);
assert.equal(summary.failed, true);
assert.equal(runtime.status, 'PASS');
assert.equal(runtime.sapi, 'apache2handler');
assert.equal(runtime.opcodeCacheEnabled, false);
assert.equal(runtime.pdoMysqlLoaded, true);
assert.equal(runtime.nativeMysqlDriverAvailable, true);
assert.equal(runtime.privateIniMatched, true);
assert.equal(runtime.privateConfigMatched, true);
assert.equal(finalInputs.allInputsUnchanged, true);
assert.deepEqual(finalInputs.verification, preparation.preflight);
assert.deepEqual(privateFinal.hashes, privateBefore.hashes);
assert.equal(Object.keys(privateBefore.hashes).length, 6);
assert.equal(cleanup.ownProcessesStopped, true);
assert.equal(cleanup.gracefulDatabaseShutdown, true);
assert.equal(cleanup.gracefulApacheShutdown, true);
assert.equal(cleanup.forcedOwnDatabaseStop, false);
assert.equal(cleanup.forcedOwnApacheStop, false);
assert.deepEqual(cleanup.apacheResidualPids, []);
assert.equal(cleanup.ownTemporaryDirectoryRemoved, false);
assert.equal(cleanup.originalConfigRead, false);
assert.equal(cleanup.noWindowsServiceCreated, true);
const ignored = spawnSync('git', ['check-ignore', '--', `backend/storage/pack-instance-${ownerId}/ownership.json`], { encoding: 'utf8', windowsHide: true });
assert.equal(ignored.status, 0, 'The retained failed-run private directory must remain Git-ignored.');

const minimumBytes = 2 * 1024 * 1024 * 1024;
assert.ok(startup.collector.freeMemoryBytes >= minimumBytes);
const phases = [], hostContexts = [{ phase: 'startup', when: 'before services', observation: startup }];
for (const [phase, variant] of [['1A', 'A'], ['2B', 'B'], ['3B', 'B'], ['4A', 'A']]) {
  const raw = await json(`${directory}/index-abba-${ownerId}-${phase}.json`);
  const ownerSummary = await json(ownedReceipt(`index-abba-${phase}-summary`));
  const before = await json(ownedReceipt(`index-abba-${phase}-host-before`));
  const after = await json(ownedReceipt(`index-abba-${phase}-host-after`));
  const privateAfter = await json(ownedReceipt(`index-abba-${phase}-private-input-hashes-after`));
  await json(`${directory}/index-abba-${ownerId}-${phase}-protocol.json`);
  assert.equal(raw.protocol.diagnosticPhase, phase);
  assert.equal(raw.protocol.diagnosticVariant, variant);
  assert.equal(raw.protocol.concurrency, 20);
  assert.equal(raw.protocol.p95TargetMs, 150);
  assert.equal(raw.protocol.retries, 0);
  assert.equal(raw.protocol.resultFiltering, false);
  assert.equal(raw.protocol.source.compared, 506);
  assert.deepEqual(raw.sourceAfter, raw.protocol.source);
  assert.equal(raw.total, 1653);
  assert.equal(raw.successful, 1651);
  assert.deepEqual(raw.statusCounts, { 200: 1651, 403: 1, 409: 1 });
  assert.equal(raw.failure, null);
  assert.equal(raw.watchdogExpired, false);
  assert.equal(raw.unexpectedRequests.length, 0);
  assert.equal(raw.allocatedRooms, 50);
  assert.equal(raw.occupiedSeats, 400);
  assert.equal(raw.cleanup.deletedOwnAccounts, 400);
  assert.equal(raw.cleanup.removedOwnSessions, 400);
  assert.equal(raw.inputsUnchanged, true);
  assert.equal(raw.targetMet, false);
  const failedChecks = raw.checks.filter(check => !check.pass);
  assert.equal(failedChecks.length, 1);
  assert.equal(failedChecks[0].name, 'successful-request p95 remains strictly below150ms');
  assert.equal(raw.checks.find(check => check.name === 'every measured request uses declared index variant with no Server-Timing')?.pass, true);
  assert.equal(ownerSummary.correctness, true);
  assert.equal(ownerSummary.exitCode, 1);
  assert.equal(ownerSummary.p95Ms, raw.p95Ms);
  assert.ok(before.collector.freeMemoryBytes >= minimumBytes);
  assert.equal(privateAfter.allInputsUnchanged, true);
  assert.deepEqual(privateAfter.hashes, privateBefore.hashes);
  const preparationCheck = raw.checks.find(check => check.detail?.evidencePreparationMs !== undefined);
  assert.equal(preparationCheck?.pass, true);
  assert.equal(preparationCheck.detail.accepted, 400);
  const operation = name => raw.phases.find(row => row.phase === name);
  assert.equal(operation('submit').successful, 400);
  assert.equal(operation('leave').successful, 400);
  const minimumSampledFreeBytes = Math.min(...raw.resourceSamples.map(row => row.freeMemoryBytes));
  phases.push({
    phase, variant, targetMet: false, globalP95Ms: raw.p95Ms,
    submitP95Ms: operation('submit').p95SuccessfulMs,
    nonSubmitP95Ms: Object.fromEntries(raw.phases.filter(row => row.phase !== 'submit').map(row => [row.phase, row.p95SuccessfulMs])),
    evidencePreparationMs: preparationCheck.detail.evidencePreparationMs,
    totalOperations: raw.total, successful2xx: raw.successful,
    expectedRejections: { forbidden: 1, conflict: 1 }, unexpectedStatuses: 0,
    fixtureAccountsRemoved: 400, fixtureSessionsRemoved: 400,
    beforePhaseFreeBytes: before.collector.freeMemoryBytes,
    sampledMinimumFreeBytes: minimumSampledFreeBytes,
    sampledBelowStartupThreshold: minimumSampledFreeBytes < minimumBytes,
    sampledPeakRssBytes: Math.max(...raw.resourceSamples.map(row => row.rssBytes)),
    sampledPeakHeapBytes: Math.max(...raw.resourceSamples.map(row => row.heapUsedBytes)),
    resourceSampleCount: raw.resourceSamples.length,
    producer: raw.protocol.producer,
    correctnessPassed: true, sourceAndInputsUnchanged: true,
  });
  hostContexts.push({ phase, when: 'before', observation: before }, { phase, when: 'after', observation: after });
}
assert.deepEqual(phases.map(row => row.phase), summary.phases.map(row => row.phase));
assert.ok(phases.every(row => JSON.stringify(row.producer) === JSON.stringify(phases[0].producer)));
const a = phases.filter(row => row.variant === 'A'), b = phases.filter(row => row.variant === 'B');
const mean = rows => rows.reduce((sum, row) => sum + row.globalP95Ms, 0) / rows.length;
const result = {
  recordedAt: new Date().toISOString(), status: 'COMPLETE-DIAGNOSTIC-ALL-FOUR-LATENCY-GATES-FAILED',
  ownerId, diagnosticOnly: true, ordinaryAcceptance: false,
  source: { files: 506, build: 'd89f84d74519bf2bbae0', testConfigDependencies: 73, unchanged: true },
  protocolUnchanged: true, retries: 0, filtering: false, strictP95TargetMs: 150,
  totalOperationsAcrossFourPhases: 6612, totalAcceptedSubmissions: 1600, totalAcceptedLeaves: 1600,
  unexpectedStatuses: 0, apiOrWorkloadWatchdogFailure: false,
  phases,
  descriptiveComparisonOnly: {
    meanOfAPhaseP95Ms: mean(a), meanOfBPhaseP95Ms: mean(b),
    differenceMs: mean(a) - mean(b),
    notAnAcceptanceAverage: true,
    interpretation: 'Both B phase p95s and both A phase p95s fail. Current lazy allocation is descriptively lower on average in this single balanced-order diagnostic; it does not establish a server-only causal improvement or a normal production capacity pass.',
  },
  resourceQualification: {
    startupAndEveryPhaseStartGatePassed: true,
    minimumRequiredAtGateBytes: minimumBytes,
    startupFreeBytes: startup.collector.freeMemoryBytes,
    lowerInPhaseSamples: phases.filter(row => row.sampledBelowStartupThreshold).map(row => ({ phase: row.phase, bytes: row.sampledMinimumFreeBytes })),
    interpretation: 'The frozen protocol gates before services and before each phase, not continuously. Recorded in-phase memory dips remain visible and limit stronger clean-host claims.',
    windowsContext: hostContexts.map(row => ({ phase: row.phase, when: row.when, status: row.observation.windows.status, exitCode: row.observation.windows.exitCode ?? null, errorName: row.observation.windows.errorName ?? null })),
    windowsFailureCause: 'UNVERIFIED: later collections recorded only status UNVERIFIED, exitCode null and Error. The exact error code was not retained; no precise timeout cause is asserted.',
    aggregateCpuQualification: 'The recorded aggregate includes System Idle Process and is not a direct busy-CPU percentage. Nominal CIM clock reporting is not effective-frequency measurement.',
  },
  attributionLimits: [
    'evidencePreparationMs measures unchanged Node-only insertion/pacing work before HTTP submit; index allocation cannot directly affect that segment.',
    'HTTP duration includes client checkpoint serialization/event-loop work, loopback transport, queues and server execution. No profiler or Server-Timing was added, so server-only time is unavailable.',
    'The same owned database warms across four independent fixture namespaces in declared A-B-B-A order; this is one diagnostic, not repeated ordinary acceptance.',
    'All submitted evidence remains full payload and independently validated. No rate-limit, durability, native-PDO, timing, threshold or 3D setting was relaxed.',
  ],
  privateConfigurationHashesUnchanged: true,
  gracefulCleanup: { apache: true, database: true, forcedStops: false, apacheResidualPids: [], ownProcessesStopped: true, failedRunDiagnosticsRetainedGitIgnored: true },
  ownerProcessExit: { exitCode: 1, observedBy: '/root/capacity_resume', tool: 'write_stdin', sessionId: 90035, chunkId: 'c9a0f2', interpretation: 'Expected nonzero owner exit preserves declared latency failures; the diagnostic completed all four phases and then cleaned up.' },
  furtherWorkloadStarted: false,
  references,
};
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, sha256: hash(await readFile(output)), status: result.status, phases: phases.map(({ phase, globalP95Ms, evidencePreparationMs }) => ({ phase, globalP95Ms, evidencePreparationMs })), ordinaryAcceptance: false, gracefulCleanup: result.gracefulCleanup }));
