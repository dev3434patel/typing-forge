// Read-only fixture provenance. No browser/test/build/service is executed.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { hash, normalizedSourceHash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const fixture = 'e2e/php-human-race.spec.ts';
const normalize = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n');
const bytes = await readFile(fixture);
const text = normalize(bytes);
const firstInputBlock = `    const passage = (await page.getByTestId("typing-target").textContent())!;
    expect(await peer.getByTestId("typing-target").textContent()).toBe(passage);
    const hostText = passage.split(" ").slice(0, 3).join(" ") + " ";
    const peerText = passage.split(" ").slice(0, 2).join(" ") + " ";
    const hostInput = await focusTyping(page);
    // A real accepted key focuses the native input and publishes its running
    // snapshot before the fixture waits for the first periodic checkpoint.
    await hostInput.pressSequentially(hostText.slice(0, 1), { delay: 90 });
    await expect(hostInput).toHaveValue(hostText.slice(0, 1));
    phase = "first-failure";
`;
assert.equal(text.split(firstInputBlock).length - 1, 1);
let reversed = text.replace(firstInputBlock, '');
const oldHostBlock = `    const passage = (await page.getByTestId("typing-target").textContent())!;
    expect(await peer.getByTestId("typing-target").textContent()).toBe(passage);
    const hostText = passage.split(" ").slice(0, 3).join(" ") + " ";
    const peerText = passage.split(" ").slice(0, 2).join(" ") + " ";
    const hostInput = await focusTyping(page);
    await hostInput.pressSequentially(hostText, { delay: 90 });`;
reversed = reversed.replace('    await hostInput.pressSequentially(hostText.slice(1), { delay: 90 });', oldHostBlock);
reversed = reversed.replace('let phase: "first-failure" | "hold-recovery" | "normal" | "hold-late" | "late-held" = "normal";', 'let phase: "first-failure" | "hold-recovery" | "normal" | "hold-late" | "late-held" = "first-failure";');
reversed = reversed.replace('      firstCheckpointFailureArmedAfterAcceptedTargetCharacter: true,\n', '');
const originalPreparation = JSON.parse(await readFile(`${directory}/final27-race-recovery-preparation.json`, 'utf8'));
const oldHash = originalPreparation.ownedFiles.find(item => item.file === fixture).normalizedSha256;
assert.equal(normalizedSourceHash(fixture, Buffer.from(reversed)), oldHash, 'Only the declared first-input fixture precondition may change.');
const originalTitle = 'real two-browser PHP human race shares opponent pace and settles server results';
const faultTitle = 'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish';
const baseline = normalize(execFileSync('git', ['show', `275c8c24d65054abae18713c1eee4dad18888332:${fixture}`]));
const baselineBody = baseline.slice(baseline.indexOf(`test("${originalTitle}"`)).trimEnd();
const currentBody = text.slice(text.indexOf(`test("${originalTitle}"`), text.indexOf(`test("${faultTitle}"`)).trimEnd();
assert.equal(currentBody, baselineBody);
const rawName = `${directory}/pack-native-final27-webkit-auth-confirmation-7bbf2372eea5cde5-1793124041120-browser.json`;
const rawBytes = await readFile(rawName);
const raw = JSON.parse(rawBytes);
const cases = [];
const collect = suite => {
  for (const spec of suite.specs ?? []) for (const item of spec.tests ?? []) cases.push({ title: spec.title, engine: item.projectName, status: item.status, result: item.results[0] });
  for (const child of suite.suites ?? []) collect(child);
};
for (const suite of raw.suites) collect(suite);
assert.equal(cases.length, 5);
assert.equal(raw.stats.expected, 3);
assert.equal(raw.stats.unexpected, 2);
const fault = cases.find(item => item.title === faultTitle);
assert.equal(fault.engine, 'webkit');
assert.equal(fault.status, 'unexpected');
assert.ok(fault.result.error.message.includes('getByRole') && fault.result.error.message.includes('alert'));
assert.equal(cases.find(item => item.title === originalTitle).status, 'expected');
const frozen = await verifyFrozenSource(`${directory}/final27-source.json`);
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
const wrappers = [`${directory}/pack-native-browser-final27-fault-confirmation.mjs`, `${directory}/run-final27-native-fault-confirmation.mjs`];
const wrapperHashes = [];
for (const file of wrappers) wrapperHashes.push({ file, sha256: hash(await readFile(file)), syntaxCheck: { command: `node --check ${file}`, exitCode: 0 } });
const report = {
  status: 'FIXTURE-ONLY-REPAIR-PREPARED; FOUR-ENGINE-FOLLOWUP-NOT-RUN', capturedAt: new Date().toISOString(),
  source: frozen.receipt, build: frozen.frozen.local.version, productionFilesChanged: 0,
  originalFreshWebkit5: { file: rawName, sha256: hash(rawBytes), status: 'FAILED', passed: 3, failed: 2, skipped: raw.stats.skipped },
  originalCaseOutcomes: cases.map(item => ({ title: item.title, engine: item.engine, status: item.status, durationMs: item.result.duration })),
  actualFaultFailureStage: 'Missing expected first-checkpoint network-error alert at unchanged5000ms assertion, before any typing in the old fault fixture. It never reached recovery/final/late-failure assertions.',
  separateAccountTimeout: 'Original90s timeout retained; independent bounded diagnosis owned by gaming_review. This receipt does not attribute its cause.',
  fixtureRepair: {
    file: fixture, rawSha256: hash(bytes), normalizedSha256: normalizedSourceHash(fixture, bytes),
    originalFaultFixtureSha256AfterReversingOnlyThisPatch: oldHash,
    originalRaceScenarioBodyUnchanged: true, originalScenarioNormalizedBodySha256: hash(currentBody),
    changes: ['Allow normal pass-through until first actual target character is typed and native value asserted.', 'Arm the first abort after that accepted-input precondition.', 'After failed-then-successful real checkpoint recovery, type only hostText.slice(1), preserving the exact full intended transcript.'],
    oldAssertionsPreserved: true, sharedClockUnchanged: true, apiAndTestTimeoutsUnchanged: true, individualKeyDelayMsUnchanged: 90,
    scoredResponseMockOrFakeClockAdded: false,
  },
  confirmation: {
    status: 'NOT-RUN', title: faultTitle, engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4,
    workers: 1, retries: 0, traces: false, freshSeparateOwnerRequired: true, priorNativeRunsPermitted: 0,
    rejectedOldOwners: ['3d44c37ac589c270', '7bbf2372eea5cde5'],
    counterResetOrRateLimitChangeOrOldOwnerReseed: false,
    wrapper: wrappers[1], windowFlag: 'SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW=1', artifacts: wrapperHashes,
  },
  originalFailuresRewritten: false, fullMatrixPassingClaim: false,
  browserOrTestOrBuildOrServiceExecutedByThisCapture: false, physicalDevices: 'UNVERIFIED',
};
await writeFile(`${directory}/final27-fault-fixture-followup-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, productionChanges: 0, originalScenarioUnchanged: true, exactReversibleFixturePatch: true, sourceFiles: 505, expectedFollowupCases: 4 }));
