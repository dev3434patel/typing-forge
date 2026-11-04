// Read-only public report/source and bounded allowed error-context extraction.
// No config, env, database, server log, browser or service is opened.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const originalOwner = '3d44c37ac589c270';
const originalName = `${directory}/pack-native-final27-${originalOwner}-1793123443072-browser.json`;
const originalBytes = await readFile(originalName);
const original = JSON.parse(originalBytes);
const cases = [];
function collect(suite) {
  for (const spec of suite.specs ?? []) for (const item of spec.tests ?? [])
    cases.push({ title: spec.title, engine: item.projectName, status: item.status, result: item.results[0] });
  for (const child of suite.suites ?? []) collect(child);
}
for (const suite of original.suites) collect(suite);
assert.equal(cases.length, 20);
assert.equal(original.stats.expected, 16);
assert.equal(original.stats.unexpected, 4);
assert.equal(original.stats.skipped, 0);
const rateSentence = 'Too many requests. Wait briefly before retrying.';
const failures = [];
for (const item of cases.filter(value => value.status !== 'expected')) {
  assert.equal(item.engine, 'webkit');
  const contextName = item.result.attachments.find(value => value.name === 'error-context')?.path;
  assert.ok(contextName && path.resolve(contextName).startsWith(path.resolve(`${directory}/.playwright-artifacts-pack-native-final27-${originalOwner}-1793123443072`) + path.sep));
  const contextBytes = await readFile(contextName);
  const context = contextBytes.toString('utf8');
  const snapshot = context.split('# Test source')[0];
  const rateTextObserved = snapshot.includes(rateSentence);
  failures.push({
    title: item.title, engine: item.engine, actualStatus: item.result.status,
    startedAt: item.result.startTime, durationMs: item.result.duration,
    stage: item.title.startsWith('PHP two-account') ? 'Direct API host signin: response.ok() false; room creation unreached' : 'UI signin: still /auth at unchanged5000ms home-URL assertion; room/typing assertions unreached',
    errorContext: path.relative(process.cwd(), contextName).replaceAll('\\', '/'),
    errorContextSha256: hash(contextBytes),
    observedRateLimitUiSentence: rateTextObserved ? rateSentence : null,
    rawHttpStatus: 'UNOBSERVED', rawHttpBody: 'UNOBSERVED', exactRejectedBucket: 'UNOBSERVED',
    sourceDerivedStatus: rateTextObserved ? 429 : null,
    sourceDerivedStatusBoundary: rateTextObserved ? 'The observed literal is thrown by Security::rate as ApiException429; the original response status itself was not captured.' : 'The failed ok() assertion alone does not establish a response status or body.',
  });
}
assert.equal(failures.filter(item => item.observedRateLimitUiSentence).length, 3);
const authBytes = await readFile('backend/src/AuthService.php');
const securityBytes = await readFile('backend/src/Security.php');
const auth = authBytes.toString('utf8');
const security = securityBytes.toString('utf8');
assert.ok(auth.includes("'signup', 8, 3600"));
assert.ok(auth.includes("'signin-ip', 30, 900"));
assert.ok(auth.includes("'signin-account', 12, 900, $email, false"));
assert.ok(security.includes("new ApiException(429, 'rate-limit', 'Too many requests. Wait briefly before retrying.')"));
const frozen = await verifyFrozenSource(`${directory}/final27-source.json`);
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
const passedEngines = ['chromium', 'edge', 'firefox'];
for (const engine of passedEngines) assert.equal(cases.filter(item => item.engine === engine && item.status === 'expected').length, 5);
const originalInputs = JSON.parse(await readFile(`${directory}/final27-native-browser.json`, 'utf8')).inputs;
const inputChanges = [];
for (const [file, expected] of Object.entries(originalInputs)) if (hash(await readFile(file)) !== expected) inputChanges.push(file);
assert.deepEqual(inputChanges, []);
const firstHostSignin = Math.min(...cases.filter(item => passedEngines.includes(item.engine)).map(item => Date.parse(item.result.startTime)));
const lastFailure = Math.max(...failures.map(item => Date.parse(item.startedAt) + item.durationMs));
assert.equal(Math.floor(firstHostSignin / 900_000), Math.floor(lastFailure / 900_000));
const bucketStart = Math.floor(firstHostSignin / 900_000) * 900_000;
const preparedFiles = [
  `${directory}/prepare-final27-webkit-auth-confirmation.mjs`,
  `${directory}/pack-native-browser-final27-webkit-auth-confirmation.mjs`,
  `${directory}/run-final27-native-webkit-auth-confirmation.mjs`,
];
const runnerInputs = [];
for (const file of preparedFiles) runnerInputs.push({ file, sha256: hash(await readFile(file)) });
const report = {
  status: 'ORIGINAL-FAILED-RATE-LIMIT-EVIDENCE; SEPARATE-FRESH-WEBKIT-CONFIRMATION-PREPARED-NOT-RUN',
  capturedAt: new Date().toISOString(), build: frozen.frozen.local.version, source: frozen.receipt,
  original: { raw: originalName, sha256: hash(originalBytes), status: 'FAILED', expectedCases: 20, passed: 16, failed: 4, skipped: 0, originalInputsUnchanged: true },
  engines: ['chromium', 'edge', 'firefox', 'webkit'].map(engine => ({ engine, passed: cases.filter(item => item.engine === engine && item.status === 'expected').length, failed: cases.filter(item => item.engine === engine && item.status !== 'expected').length })),
  failures,
  sourceEvidence: [
    { file: 'backend/src/AuthService.php', sha256: hash(authBytes), limits: { signupIp: { attempts: 8, seconds: 3600 }, signinIp: { attempts: 30, seconds: 900 }, signinAccountAcrossIps: { attempts: 12, seconds: 900 } } },
    { file: 'backend/src/Security.php', sha256: hash(securityBytes), operation: 'atomic increment; reject attempts >limit; fixed floor(time/window) bucket;429 rate-limit with the observed literal' },
  ],
  mechanism: {
    passedEngines: passedEngines.length, successfulDedicatedHostSigninsPerPassedEngine: 4,
    successfulHostSigninsBeforeWebkit: 12,
    hostSigninSources: ['dedicated auth scenario', 'original human-race scenario', 'new checkpoint-fault scenario', 'API two-account race scenario'],
    sameFixedSigninBucket: { from: new Date(bucketStart).toISOString(), until: new Date(bucketStart + 900_000).toISOString() },
    inference: 'The three passed engines exhaust the dedicated host account allowance in the same fixed900s bucket. WebKit then attempts another signin with that same account. This explains the observed quota feedback without implying a cookie/input/runtime fault.',
    attributionLimit: 'No live/private rate-limit rows, original request status/body, or request timeline were inspected. Exact rejecting IP/account bucket remains UNOBSERVED. Declared call arithmetic is not a captured HTTP census.',
    declaredMinimumCalls: { hostSigninsBeforeWebkit: 12, totalSigninCallsAcrossAllScenarios: 29, signupCallsIncludingOwnerProvision: 6 },
  },
  confirmationPreparation: {
    status: 'NOT-RUN', freshOwnerRequired: true, rejectedOldOwner: originalOwner, expectedCases: 5, engine: 'webkit',
    workers: 1, retries: 0, traces: false, originalTestAssertionsAndTimeoutsUnchanged: true,
    noCounterResetOrRateLimitWideningOrOldOwnerReseed: true,
    wrapper: `${directory}/run-final27-native-webkit-auth-confirmation.mjs`,
    requiredWindow: 'SPAROWTYPE_FINAL27_NATIVE_WEBKIT_AUTH_CONFIRMATION_WINDOW=1',
    artifacts: runnerInputs,
    syntaxOnlyChecks: [{ file: preparedFiles[1], command: `node --check ${preparedFiles[1]}`, exitCode: 0 }, { file: preparedFiles[2], command: `node --check ${preparedFiles[2]}`, exitCode: 0 }],
  },
  privateConfigEnvironmentLogOrDatabaseRead: false,
  ignoredContextExport: 'Only the fixed literal rate-limit sentence, stage, path and SHA256; no captured form values are exported.',
  productOrTestEdits: false, servicesOrBrowsersOrTestsStartedByThisCapture: false,
  physicalDevices: 'UNVERIFIED', fullMatrixPassingClaim: false,
};
await writeFile(`${directory}/final27-native-auth-quota-diagnosis.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'DIAGNOSIS-CAPTURED; CONFIRMATION-NOT-RUN', originalPassed: 16, originalFailed: 4, uiRateTextObserved: 3, sourceFiles: 505, originalInputsUnchanged: true }));
