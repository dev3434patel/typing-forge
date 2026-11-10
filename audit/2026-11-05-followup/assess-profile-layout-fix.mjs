import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const root = 'audit/2026-11-05-followup';
const beforeFile = 'audit/2026-11-04-followup/webkit-profile-reset-probe-result.json';
const afterFile = `${root}/webkit-profile-reset-probe-v3-result.json`;
const regressionFile = `${root}/profile-readiness-regressions-result.json`;
const before = JSON.parse(await readFile(beforeFile, 'utf8'));
const after = JSON.parse(await readFile(afterFile, 'utf8'));
const regression = JSON.parse(await readFile(regressionFile, 'utf8'));
assert.equal(before.reportedStats.expected, 7); assert.equal(before.reportedStats.unexpected, 1);
assert.equal(after.reportedStats.expected, 8); assert.equal(after.reportedStats.unexpected, 0);
assert.equal(after.childExitCode, 0);
assert.ok(after.inputs.every(row => row.unchanged) && after.brand.every(row => row.unchanged));
assert.equal(regression.status, 'PASS-SCOPED-ALL-FOUR-ENGINE-REGRESSIONS');
assert.equal(regression.stats.expected, 8); assert.equal(regression.stats.unexpected, 0); assert.equal(regression.stats.skipped, 0);
assert.equal(regression.inputsUnchanged, true);
const eventsFile = `${root}/webkit-profile-reset-v3-webkit-course-fill-events.jsonl`;
const events = (await readFile(eventsFile, 'utf8')).trim().split(/\r?\n/).map(line => JSON.parse(line));
const input = events.find(row => row.kind === 'browser' && row.type === 'input' && row.value === 'DELETE');
const reset = events.find(row => row.kind === 'action' && row.label === 'reset-click' && row.phase === 'begin');
const completed = events.find(row => row.kind === 'action' && row.label === 'durable-public-completion' && row.phase === 'end');
assert.ok(input && reset && completed);
const retained = events.filter(row => row.kind === 'browser' && row.nodeElapsedMs > input.nodeElapsedMs && row.nodeElapsedMs < reset.nodeElapsedMs && row.node === input.node);
assert.ok(retained.every(row => row.value === 'DELETE'));
const profileFile = 'src/pages/Profile.tsx', testFile = 'e2e/profile-confirmation-readiness.spec.ts';
const code = await readFile(profileFile, 'utf8');
assert.ok(code.includes("typeof window === 'undefined' ? useEffect : useLayoutEffect"));
assert.ok(code.includes("useIsomorphicLayoutEffect(()=>{setConfirmation('');},[ownerId]);"));
const files = [beforeFile, afterFile, regressionFile, eventsFile, `${root}/profile-layout-fix-preparation.json`, `${root}/profile-only-build-quality.json`, `${root}/profile-readiness-regressions-protocol.json`, `${root}/webkit-profile-input-erasure-assessment.json`, profileFile, testFile];
const assessment = {
  status: 'PASS-SCOPED-REPRODUCED-INPUT-RACE-FIX', recordedAt: new Date().toISOString(),
  scope: 'Profile-only frontend candidate6e456d1e2ceaa9a6d71f, not a final combined release checkpoint or a new performance claim.',
  before: { result: beforeFile, passed: 7, failed: 1, observedFailure: 'WebKit native fill emitted DELETE and returned, then the same connected/focused field became empty before reset was clicked.' },
  productionFix: { file: profileFile, sha256: sha(await readFile(profileFile)), change: 'Initial/owner confirmation reset executes synchronously in layout phase before paint; passive message clearing and explicit reset action remain unchanged.', ownerSafety: 'Every actual owner transition still clears; no reference-skip or stored owner-draft cache can revive A after A→B→A.', ssrGuardPresent: true, ssrRuntimeExecuted: false },
  after: { result: afterFile, passed: 8, failed: 0, skipped: 0, retries: 0, sameNativeActionMethodAndBudgets: true, nativeDeleteInput: input, beforeResetObservations: retained, noObservedPrematureErasure: true, durableResetCompleted: completed },
  permanentRegressions: { result: regressionFile, actualCases: 8, passed: 8, failed: 0, skipped: 0, retries: 0, engines: ['chromium', 'edge', 'firefox', 'webkit'], completeFile: testFile, sourceAnd73InputHashesUnchanged: true, apiOwnedByFixtures: true, includesAfterPaintRetentionAndActualOwnerABA: true },
  quality: 'All21 protected brand sources and five original emitted scene checks passed for the Profile-only build; scene quality was not reduced. No new Lighthouse/physical-device claim.',
  historicalQualification: 'The new erasure reproduces the old focused-empty-field/three-session state and exposes a concrete late-clear hazard. Original case1014 had only a global60s timeout, so its precise historical call stack is not retroactively proven. Original failures and7/1 diagnostic remain retained.',
  noAdditionalRuntimeOrSourceEditsByAssessment: true, bindings: await Promise.all(files.map(bind)),
};
await writeFile(`${root}/profile-layout-fix-assessment.json`, JSON.stringify(assessment, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: assessment.status, originalDiagnostic: '7/8 with one retained failure', postFixDiagnostic: '8/8', permanentRegressions: '8/8 all4 engines', profileSha256: assessment.productionFix.sha256, testSha256: sha(await readFile(testFile)) }));
