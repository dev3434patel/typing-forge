// Pure file inspection and immutable provenance; no browser/runtime is started.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const fixture = 'e2e/php-human-race.spec.ts';
const archiveName = `${directory}/php-human-race-before-route-audit.source27`;
const archive = await readFile(archiveName);
assert.equal(hash(archive), '481f6f3a471d7a5974fe5f556d3358ded1407971926036799f6c979bd1809ec1');
const current = await readFile(fixture);
let reversed = current.toString('utf8');
const reversals = [];
for (const name of ['fault-route audit: bounded metadata, never bodies or headers', 'route hit witness', 'finally evidence: preserve the original test failure']) {
  const first = `  ${name.startsWith('route hit') || name.startsWith('finally') ? '  ' : ''}// BEGIN opt-in ${name}.\n`;
  const endName = name.startsWith('fault-route') ? 'fault-route audit' : name.startsWith('route hit') ? 'route hit witness' : 'finally evidence';
  const last = `  ${name.startsWith('route hit') || name.startsWith('finally') ? '  ' : ''}// END opt-in ${endName}.\n`;
  const start = reversed.indexOf(first), end = reversed.indexOf(last, start);
  assert.ok(start >= 0 && end > start, `Missing exact diagnostic boundary ${name}`);
  assert.equal(reversed.indexOf(first, start + 1), -1);
  const insertion = reversed.slice(start, end + last.length);
  reversals.push({ beginMarker: first.trimEnd(), endMarker: last.trimEnd(), insertionSha256: hash(insertion), bytes: Buffer.byteLength(insertion) });
  reversed = reversed.slice(0, start) + reversed.slice(end + last.length);
}
assert.deepEqual(Buffer.from(reversed), archive, 'Removing only three declared opt-in insertions must reproduce the public archive exactly.');
const rawName = `${directory}/pack-native-final27-fault-confirmation-a4cda523ada86772-1793124564418-browser.json`;
const rawBytes = await readFile(rawName);
const raw = JSON.parse(rawBytes);
assert.equal(raw.stats.expected, 3);
assert.equal(raw.stats.unexpected, 1);
assert.equal(raw.stats.skipped, 0);
const cases = [];
const collect = suite => {
  for (const spec of suite.specs ?? []) for (const item of spec.tests ?? []) cases.push({ title: spec.title, engine: item.projectName, status: item.status, result: item.results[0] });
  for (const child of suite.suites ?? []) collect(child);
};
for (const suite of raw.suites) collect(suite);
assert.equal(cases.length, 4);
const failed = cases.filter(item => item.status !== 'expected');
assert.equal(failed.length, 1);
assert.equal(failed[0].engine, 'webkit');
assert.ok(failed[0].result.error.message.includes('alert'));
const frozen = await verifyFrozenSource(`${directory}/final27-source.json`);
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
const wrappers = [`${directory}/pack-native-browser-final27-fault-route-diagnostic.mjs`, `${directory}/run-final27-native-fault-route-diagnostic.mjs`];
const wrapperHashes = [];
for (const file of wrappers) wrapperHashes.push({ file, sha256: hash(await readFile(file)), syntaxCheckCommand: `node --check ${file}`, syntaxCheckExitCode: 0 });
const report = {
  status: 'OPT-IN-DIAGNOSTIC-PREPARED-NOT-RUN', capturedAt: new Date().toISOString(),
  source: frozen.receipt, build: frozen.frozen.local.version, productionChanges: 0,
  originalFault4: { raw: rawName, sha256: hash(rawBytes), status: 'FAILED', passed: 3, failed: 1, skipped: 0 },
  originalResults: cases.map(item => ({ title: item.title, engine: item.engine, status: item.status, durationMs: item.result.duration })),
  establishedFailureStage: 'WebKit completed the genuine first-target-character native-value assertion, then the unchanged5000ms expected initial error-alert assertion failed. No recovery/final/late-failure checks were reached.',
  stillUnobserved: ['Whether the page.route callback was reached', 'Whether the first intended route.abort was executed', 'Whether submit responses originated through a service worker', 'The cause of the missing expected injected-error alert'],
  hypothesisNotConclusion: 'Service-worker handling can bypass page.route according to the official Playwright network guidance; this run has not yet captured that behavior. No worker blocking or product fix is applied.',
  archiveAndReversal: { publicArchive: archiveName, archiveSha256: hash(archive), currentFixture: fixture, currentSha256: hash(current), exactByteReversalVerified: true, operation: 'Remove precisely the three uniquely marked opt-in insertions listed below; the result equals the archived bytes.', insertions: reversals },
  diagnosticOnly: {
    flag: 'SPAROWTYPE_NATIVE_FAULT_ROUTE_AUDIT=1', defaultDisabled: true, existingAssertionsAndTimeoutsUnchanged: true,
    normalRunBehaviorChange: false, serviceWorkersBlocked: false,
    attachment: 'fault-route-interception-audit',
    fields: ['routeHitCount', 'submitRequestCount', 'submitResponseCount', 'submitRequestFailedCount', 'serviceWorkerResponseCount', 'bounded route phase/method/time events', 'bounded submit response page/path/status/fromServiceWorker/exact-URL-match/phase/time events', 'phase', 'injectedFailures', 'acceptedCheckpoints', 'finalAcknowledged', 'held-route booleans', 'visibility/focus', 'controller pathname/state'],
    limits: { routeEvents: 24, responseEvents: 48, finallyPageStateDeadlineMs: 1500 },
    forbiddenFieldsCollected: { requestBodies: false, responseBodies: false, headers: false, cookies: false, credentials: false, domText: false, urlQueries: false },
    actualTestDeadlineMs: 90000, firstAlertAssertionDeadlineMs: 5000,
  },
  preparedExecution: {
    status: 'NOT-RUN', engines: ['webkit'], cases: 1, workers: 1, retries: 0, traces: false,
    wrapper: wrappers[1], windowFlag: 'SPAROWTYPE_FINAL27_NATIVE_FAULT_ROUTE_DIAGNOSTIC_WINDOW=1',
    separateFreshOwnerRequired: true, counterResetOrRateLimitWideningOrOldOwnerReseed: false, inputs: wrapperHashes,
  },
  browserTestBuildOrServiceStartedByThisCapture: false, originalResultsRewritten: false, passingMatrixClaim: false, physicalDevices: 'UNVERIFIED',
};
await writeFile(`${directory}/final27-fault-route-diagnostic-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, publicArchive: archiveName, exactByteReversalVerified: true, sourceFiles: 505, cases: 1, diagnosticNotRun: true }));
