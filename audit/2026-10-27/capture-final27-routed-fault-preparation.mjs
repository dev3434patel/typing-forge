// File/source and existing safe-attachment inspection only; no runtime launch.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const fixture = 'e2e/php-human-race.spec.ts';
const archiveName = `${directory}/php-human-race-before-routing-isolation.source27`;
const archive = await readFile(archiveName);
assert.equal(hash(archive), 'ee8e568399a9829461cfca58af083105285fc671a0d537bdfaee48e2033d6b3e');
const current = await readFile(fixture);
let reversed = current.toString('utf8');
const edits = [];
const reverse = (from, to) => {
  assert.equal(reversed.split(from).length - 1, 1, `Expected one scoped fixture edit: ${from.slice(0, 70)}`);
  edits.push({ insertedSha256: hash(from), previousSha256: hash(to), insertedBytes: Buffer.byteLength(from), previousBytes: Buffer.byteLength(to) });
  reversed = reversed.replace(from, to);
};
reverse('test.describe("route-controlled human-race feedback", () => {\ntest.use({ serviceWorkers: "block" });\n', '');
reverse('  const peerContext = await browser.newContext({ baseURL, serviceWorkers: "block" });', '  const peerContext = await browser.newContext({ baseURL });');
reverse(`    // BEGIN route hit control and opt-in event witness.
    routeAudit.routeHitCount++;
    if (routeAuditEnabled) {
      if (routeAudit.routeEvents.length < 24) routeAudit.routeEvents.push({ atMs: auditTime(), phase, method: route.request().method() });
    }
    // END route hit control and opt-in event witness.`, `    // BEGIN opt-in route hit witness.
    if (routeAuditEnabled) {
      routeAudit.routeHitCount++;
      if (routeAudit.routeEvents.length < 24) routeAudit.routeEvents.push({ atMs: auditTime(), phase, method: route.request().method() });
    }
    // END opt-in route hit witness.`);
reverse('    for (const target of [page, peer])\n      expect(await target.evaluate(() => navigator.serviceWorker?.controller ? new URL(navigator.serviceWorker.controller.scriptURL).pathname : null)).toBeNull();\n', '');
reverse('    expect(routeAudit.routeHitCount).toBeGreaterThan(0);\n', '');
reverse('      routeHitCount: routeAudit.routeHitCount, serviceWorkersBlockedOnlyForThisFaultCase: true,\n      originalHumanRaceAndPwaServiceWorkerBehaviorChanged: false,\n', '');
reverse('        hostState, peerState, serviceWorkersBlockedOnlyForThisFaultCase: true,\n        headersBodiesCredentialsAndDomTextCollected: false,', '        hostState, peerState, headersBodiesCredentialsAndDomTextCollected: false,');
assert.ok(reversed.endsWith('});\n});\n'));
reversed = reversed.slice(0, -4);
assert.deepEqual(Buffer.from(reversed), archive, 'Reversing only local routing isolation/controls must restore the public fixture exactly.');
const originalBoundary = 'test("real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish"';
const oldPrefix = archive.toString('utf8').slice(0, archive.toString('utf8').indexOf(originalBoundary));
const newPrefix = current.toString('utf8').slice(0, current.toString('utf8').indexOf('test.describe("route-controlled human-race feedback"'));
assert.equal(newPrefix, oldPrefix, 'All imports and the entire original human-race scenario must be byte-identical.');
const rawName = `${directory}/pack-native-final27-fault-route-diagnostic-6a2da7a72dc80e8e-1793124995921-browser.json`;
const rawBytes = await readFile(rawName);
const raw = JSON.parse(rawBytes);
assert.equal(raw.stats.expected, 0);
assert.equal(raw.stats.unexpected, 1);
const attachments = [];
const collect = suite => {
  for (const spec of suite.specs ?? []) for (const item of spec.tests ?? []) for (const result of item.results ?? [])
    attachments.push(...(result.attachments ?? []).filter(value => value.name === 'fault-route-interception-audit'));
  for (const child of suite.suites ?? []) collect(child);
};
for (const suite of raw.suites) collect(suite);
assert.equal(attachments.length, 1);
const trace = JSON.parse(Buffer.from(attachments[0].body, 'base64').toString('utf8'));
assert.equal(trace.routeHitCount, 0);
assert.equal(trace.injectedFailures, 0);
assert.equal(trace.submitRequestCount, 11);
assert.equal(trace.submitResponseCount, 11);
assert.equal(trace.acceptedCheckpoints, 5);
assert.equal(trace.serviceWorkerResponseCount, 0);
assert.ok(trace.responseEvents.every(item => item.matchesExpectedUrl && item.status === 200 && item.fromServiceWorker === false));
const frozen = await verifyFrozenSource(`${directory}/final27-source.json`);
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
const wrappers = [`${directory}/pack-native-browser-final27-routed-fault-confirmation.mjs`, `${directory}/run-final27-native-routed-fault-confirmation.mjs`];
const wrapperHashes = [];
for (const file of wrappers) wrapperHashes.push({ file, sha256: hash(await readFile(file)), syntaxCheckCommand: `node --check ${file}`, syntaxCheckExitCode: 0 });
const report = {
  status: 'ROUTING-ISOLATION-FIXTURE-PREPARED; FOUR-ENGINE-CONFIRMATION-NOT-RUN', capturedAt: new Date().toISOString(),
  source: frozen.receipt, build: frozen.frozen.local.version, appProductOrSwSourceChanged: false,
  priorDiagnostic: {
    raw: rawName, sha256: hash(rawBytes), status: 'FAILED', passed: 0, failed: 1,
    observed: { routeHitCount: trace.routeHitCount, injectedFailures: trace.injectedFailures, matchingSubmitRequests: trace.submitRequestCount, matchingSubmitResponses: trace.submitResponseCount, allResponseStatus200: true, acceptedHostCheckpoints: trace.acceptedCheckpoints, fromServiceWorkerTrueResponses: 0, hostState: trace.hostState, peerState: trace.peerState },
    conclusion: 'The intended request abort never executed although normal matching checkpoint requests and200 responses were observed. The diagnostic therefore did not exercise application error recovery.',
    limit: 'All11 responses reported fromServiceWorker=false. Controller presence alone does not establish SW-handled-response causality or the underlying Playwright/WebKit routing cause.',
  },
  scopedFixtureChange: {
    file: fixture, rawSha256: hash(current),
    description: 'A local describe/test.use blocks service workers only in the appended route-controlled fault test, retaining project context options; its separately created peer context explicitly blocks them too.',
    extraControls: ['Both page controller path values must be null before the race is created.', 'A positive host route-hit count must accompany the first observed injected error.'],
    existingAssertionsAndTimeoutsPreserved: true, sharedClockOrScoringChanged: false,
    originalHumanRaceScenarioAndSharedImportsExactlyUnchanged: true,
    originalHumanRaceOrPwaTestsWorkerBehaviorChanged: false,
    noMockedSuccessfulResponseOrFakeClockAdded: true,
  },
  publicArchiveAndReversal: { archive: archiveName, sha256: hash(archive), exactByteReversalVerified: true, editHashes: edits, finalDescribeClosingDelimiterRemovedDuringReversal: true },
  officialGuidanceReviewedByParent: ['https://playwright.dev/docs/network#missing-network-events-and-service-workers', 'https://playwright.dev/docs/api/class-page#page-route'],
  preparedConfirmation: {
    status: 'NOT-RUN', engines: ['chromium', 'edge', 'firefox', 'webkit'], cases: 4,
    title: 'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish',
    workers: 1, retries: 0, traces: false, separateFreshOwnerWithNoPriorNativeRunsRequired: true,
    windowFlag: 'SPAROWTYPE_FINAL27_NATIVE_ROUTED_FAULT_CONFIRMATION_WINDOW=1', wrapper: wrappers[1], inputs: wrapperHashes,
    safeOptInRouteAuditEnabled: true, countersResetOrLimitsWidenedOrOldOwnerReseeded: false,
  },
  originalFailedReportsRewritten: false, fullMatrixPassingClaim: false, runtimeOrTestOrBuildLaunchedByThisCapture: false, physicalDevices: 'UNVERIFIED',
};
await writeFile(`${directory}/final27-routed-fault-confirmation-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, exactByteReversalVerified: true, originalScenarioUnchanged: true, sourceFiles: 505, expectedCases: 4, serviceWorkerResponseCausality: 'UNPROVEN' }));
