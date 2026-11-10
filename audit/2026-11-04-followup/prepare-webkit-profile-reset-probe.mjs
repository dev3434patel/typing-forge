import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(source.receipt.compared, 505); assert.deepEqual(source.receipt.mismatches, []);
const names = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
const inputFiles = ['audit/2026-11-04-followup/webkit-reset-probe/probe.config.ts', 'audit/2026-11-04-followup/webkit-reset-probe/profile-reset.spec.ts', 'audit/2026-11-04-followup/run-webkit-profile-reset-probe.mjs', 'audit/2026-11-04/source34-browser-matrix-reconciliation.json', 'audit/2026-11-04/source34-course-reset-native-result.json', 'audit/2026-11-04/source34-test-synchronization-freeze.json', ...names];
const inputHashes = Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, hash(await readFile(file))])));
const productionFiles = ['src/pages/Profile.tsx', 'src/components/layout/AccountWorkspace.tsx', 'src/hooks/useTestResults.tsx', 'src/hooks/useAuth.tsx', 'src/services/session-repository.ts', 'src/services/workspace-reset.ts', 'src/services/account-data.ts'];
const productionHashes = Object.fromEntries(await Promise.all(productionFiles.map(async file => [file, hash(await readFile(file))])));
const sceneReference = JSON.parse(await readFile('audit/2026-11-04/source34-final-state-identity.json', 'utf8'));
const brandHashes = Object.fromEntries(await Promise.all(sceneReference.brandSources.map(async row => [row.file, hash(await readFile(row.file))])));
assert.equal(Object.keys(brandHashes).length, 21);
for (const row of sceneReference.brandSources) assert.equal(brandHashes[row.file], row.currentRawSha256);
const plan = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(), head: '9b21e255ea1840508cbc35b625d0ccde8f3af7cc',
  kind: 'Bounded controlled native Profile confirmation/reset observations; not acceptance or a proven cause for original case1014',
  source: source.receipt, build: source.frozen.local.version, inputHashes, productionHashes, brandHashes,
  browsers: ['webkit', 'chromium'], workers: 1, retries: 0, expectedCases: 8, deadlineMsPerCase: 60000, nativeCourseCadenceMs: 65,
  cases: [
    'first mount accepts native fill beginning at document commit',
    'three real course attempts retain DELETE through native fill and reset completion',
    'first mount native keyboard input controls for fill-specific behavior',
    'controlled pending reset records remount and hard-navigation ordering',
  ],
  causalQuestions: ['Does native fill begin/return, retain its value, and produce trusted input before a later state clear?', 'Does confirmation node identity change before reset or only at the intentional reset boundary?', 'Can controlled pending extras loading distinguish remount from durable completion and navigation?'],
  observer: { maximumRowsPerCase: 350, nativeValueSetterOrSchedulerPatched: false, storesOnlyScalarNodeInputResetMilestones: true, privateTextOrAuthCaptured: false },
  modifications: { production: false, existingTests: false, typingEngine: false, threeD: false, browserServiceWorkers: 'blocked only in this declared diagnostic to control the extras response', api: 'owned anonymous route fixture; no backend contacted', intro: 'disabled only in diagnostic setup; original quality inputs remain unchanged' },
  protocolRequiredBeforeExecution: true, runtimeRequiresSeparateRootGo: true,
  existingOriginalFailureRetained: true, source34FullMatrixRelabeled: false,
};
await writeFile('audit/2026-11-04-followup/webkit-profile-reset-probe-preparation.json', JSON.stringify(plan, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: plan.status, expectedCases: 8, source505: source.receipt.compared, inputFiles: inputFiles.length, brandFiles: 21 }));
