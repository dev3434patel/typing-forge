import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const root = new URL('../../', import.meta.url);
const read = name => readFile(new URL(name, root));
const normalize = bytes => bytes.toString('utf8').replace(/\r\n/g, '\n');
const owned = [
  'src/pages/Race.tsx',
  'src/lib/race-state-machine.ts',
  'src/lib/__tests__/race-state-machine.test.ts',
  'e2e/php-human-race.spec.ts',
  'src/components/typing/LiveKeyboard.tsx',
  'src/lib/pressed-key-attribute.ts',
  'src/lib/__tests__/pressed-key-attribute.test.ts',
];
const frozenBytes = await read('audit/2026-10-27/final26-source.json');
const frozen = JSON.parse(frozenBytes);
const sourceDifferences = [];
for (const [name, previous] of Object.entries(frozen.sourceHashes)) {
  const actual = normalizedSourceHash(name, await read(name));
  if (actual !== previous) sourceDifferences.push({ file: name, source26Sha256: previous, currentSha256: actual });
}
if (sourceDifferences.length !== 6 || sourceDifferences.some(row => !owned.includes(row.file)))
  throw new Error('Unexpected source26 change outside the six owned existing source files.');

const originalTitle = 'real two-browser PHP human race shares opponent pace and settles server results';
const appendedTitle = 'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish';
const before = normalize(execFileSync('git', ['show', `${frozen.baseline}:e2e/php-human-race.spec.ts`], { cwd: root }));
const after = normalize(await read('e2e/php-human-race.spec.ts'));
const originalBefore = before.slice(before.indexOf(`test("${originalTitle}"`)).trimEnd();
const originalAfter = after.slice(after.indexOf(`test("${originalTitle}"`), after.indexOf(`test("${appendedTitle}"`)).trimEnd();
if (!originalBefore || originalBefore !== originalAfter)
  throw new Error('The existing original human-race scenario body changed.');
const rawName = 'audit/2026-10-27/pack-native-00863696a5bdfabe-1793122106429-browser.json';
const rawBytes = await read(rawName);
const raw = JSON.parse(rawBytes);
const hashes = [];
for (const file of owned) {
  const bytes = await read(file);
  hashes.push({ file, rawSha256: sha(bytes), normalizedSha256: normalizedSourceHash(file, bytes) });
}
const report = {
  status: 'IMPLEMENTED-PENDING-SOURCE27-VALIDATION',
  recordedAt: new Date().toISOString(),
  source26: {
    file: 'audit/2026-10-27/final26-source.json', sha256: sha(frozenBytes),
    build: frozen.local.version, inventory: Object.keys(frozen.sourceHashes).length,
    changedExistingSourceFiles: sourceDifferences,
    allOtherFrozenHashesUnchanged: Object.keys(frozen.sourceHashes).length - sourceDifferences.length,
    source27Build: 'PENDING; current dist remains the old source26 artifact',
  },
  originalFailurePreserved: {
    raw: rawName, sha256: sha(rawBytes),
    passed: raw.stats.expected, failed: raw.stats.unexpected, skipped: raw.stats.skipped,
    engine: 'chromium', test: originalTitle,
    stage: 'Session results visible; existing no-alert assertion found one child-session alert',
    observedAlert: 'ApiError: The PHP API could not be reached. Your local practice and history remain available.',
    observedButton: 'Retry finish',
    attributionLimit: 'Original request URL/status/timeline unavailable; this does not establish the original network-failure cause or a backend outage.',
  },
  repair: {
    feedback: 'Monotonic per-operation request provenance for checkpoint, finish and local save; only matching pending completions can change their own channel.',
    recovery: 'Successful newer checkpoint clears its old error. Final begin supersedes checkpoint feedback; matching final ACK clears checkpoint/finish errors only.',
    preservedErrors: 'Local-save errors remain independent; real finish errors retain Retry finish, disabled only while its retry is pending. Room polling cannot acknowledge the client finish.',
    keyboard: 'Unbinding a physical key store removes its owned held attribute. Every keycap commit repairs store-driven or static true/false state.',
    newProductionFiles: 0,
    serverClockScoresTimeoutsAndThreeDimensionalIntroChanged: false,
  },
  testsPrepared: {
    pureFeedbackRegressions: 9, pureAttributeHandoffRegressions: 2,
    appendedRealBackendTest: appendedTitle,
    addedNativeCases: 4, expectedNativeTotal: 20, expectedSpecFileCount: 64,
    originalScenarioBodyNormalizedSha256: sha(originalAfter), originalScenarioUnchanged: true,
    faultInjection: 'Host checkpoint route.abort; real successful recovery; separate checkpoint held within final four ordinary seconds and aborted only after data-finish-confirmed=true.',
    noMockedSuccessfulApiResponseOrFakeClock: true,
  },
  verification: { testsExecutedByThisPreparation: false, browserExecuted: false, buildExecuted: false, performanceClaim: false },
  physicalDeviceTesting: 'UNVERIFIED',
  ownedFiles: hashes,
};
await writeFile(new URL('audit/2026-10-27/final27-race-recovery-preparation.json', root), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, sourceChanges: sourceDifferences.length, originalScenarioUnchanged: true, nativeCases: 20 }));
