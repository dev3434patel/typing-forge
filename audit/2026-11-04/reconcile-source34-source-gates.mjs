// Pure reconciliation. Never reruns, retries or overwrites any original gate.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from '../2026-11-02/artifact-verification.mjs';

const output = 'audit/2026-11-04/source34-source-gates-reconciled.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const originalFile = 'audit/2026-11-02/final34-source-gates.json';
const correctionFile = 'audit/2026-11-04/source34-evidence-contract-correction.json';
const confirmationFile = 'audit/2026-11-04/source34-arena-confirmation.json';
const sourceFile = 'audit/2026-11-02/final34-source.json';
const [originalBytes, correctionBytes, confirmationBytes, sourceBytes] = await Promise.all([
  readFile(originalFile), readFile(correctionFile), readFile(confirmationFile), readFile(sourceFile),
]);
const original = JSON.parse(originalBytes), correction = JSON.parse(correctionBytes);
const confirmation = JSON.parse(confirmationBytes), source = JSON.parse(sourceBytes);
const expectedIds = ['typecheck', 'lint', 'coverage', 'php-replay', 'php-course', 'php-progression',
  'php-classroom', 'php-social', 'php-arena', 'php-race-clock', 'content', 'dependencies'];
assert.equal(original.status, 'FAILED');
assert.deepEqual(original.results.map(row => row.id), expectedIds);
assert.equal(original.automaticRetries, 0);
const failures = original.results.filter(row => row.exitCode !== 0 || row.status !== 'PASS-SCOPED');
assert.equal(failures.length, 1); assert.equal(failures[0].id, 'php-arena');
assert.equal(failures[0].command, 'npm run test:arena-php');
assert.equal(failures[0].status, 'FAILED'); assert.equal(failures[0].exitCode, 1);
const originalPassed = original.results.filter(row => row.id !== 'php-arena');
assert.equal(originalPassed.length, 11); assert.ok(originalPassed.every(row => row.exitCode === 0 && row.status === 'PASS-SCOPED'));
assert.equal(confirmation.status, 'PASS-SCOPED'); assert.equal(confirmation.passed, 802);
assert.equal(confirmation.failed, 0); assert.equal(confirmation.checks.length, 802);
assert.ok(confirmation.checks.every(row => row.pass === true));
assert.equal(correction.kind, 'source34-test-only-checkpoint-contract-update');
assert.equal(correction.file, 'backend/tests/arena-evidence-lock-contract.php');
assert.equal(correction.productionEdited, false); assert.equal(correction.originalFailedGateRetained, true);
assert.equal(correction.afterSha256, '685c8bd2bd89eabca0544baccd39dce380ce97b3093450eac0fdabdfdc94e8ae');
const correctedTestBytes = await readFile(correction.file);
assert.equal(hash(correctedTestBytes), correction.afterSha256);
assert.ok(Date.parse(confirmation.recordedAt) > Date.parse(correction.recordedAt));
assert.ok(Date.parse(confirmation.recordedAt) > Math.max(...original.results.map(row => Date.parse(row.finishedAt))));
const verified = await verifyFrozenSource(sourceFile);
assert.equal(verified.receipt.compared, 505); assert.deepEqual(verified.receipt.mismatches, []);
assert.equal(source.local.version, '332e23584f1e36465df2');
const originalLogs = [];
for (const row of original.results) {
  const bytes = await readFile(row.file);
  originalLogs.push({ id: row.id, file: row.file, sha256: hash(bytes), bytes: bytes.length });
}
const composite = original.results.map(row => row.id === 'php-arena'
  ? { id: row.id, command: row.command, status: 'PASS-SCOPED',
    evidence: confirmationFile, checksPassed: confirmation.passed, checksFailed: confirmation.failed,
    testOnlyRevisionRequired: true, originalFailurePreserved: true }
  : { id: row.id, command: row.command, status: row.status, exitCode: row.exitCode,
    evidence: originalFile, originalFinishedAt: row.finishedAt });
assert.equal(composite.length, 12); assert.ok(composite.every(row => row.status === 'PASS-SCOPED'));
for (const [file, bytes] of [[originalFile, originalBytes], [correctionFile, correctionBytes],
  [confirmationFile, confirmationBytes], [sourceFile, sourceBytes]]) assert.equal(hash(await readFile(file)), hash(bytes));
const report = {
  status: 'PASS-SCOPED', recordedAt: new Date().toISOString(),
  scope: 'Composite12-command reconciliation under a disclosed test-only contract revision: eleven original successful process exits plus a later complete802-check Arena confirmation. No new combined suite or retry is claimed.',
  source: verified.receipt, sourceManifestSha256: hash(sourceBytes), build: source.local.version,
  original: { file: originalFile, sha256: hash(originalBytes), status: original.status,
    commands: 12, passed: 11, failed: 1, failedId: 'php-arena', unchanged: true, logs: originalLogs },
  correction: { file: correctionFile, sha256: hash(correctionBytes), recordedAt: correction.recordedAt,
    testFile: correction.file, beforeSha256: correction.beforeSha256, afterSha256: correction.afterSha256,
    currentCorrectedTestSha256: hash(correctedTestBytes), exactCurrentTestHashVerified: true,
    productionEdited: false, reason: correction.why },
  correctiveConfirmation: { file: confirmationFile, sha256: hash(confirmationBytes),
    recordedAt: confirmation.recordedAt, status: confirmation.status, passed: 802, failed: 0,
    qualification: 'The confirmation receipt records pure PHP/TS check completion; no separate process-exit field is invented for that JSON receipt.' },
  composite, compositeCommands: 12, compositePassed: 12,
  chronologicalOriginalStatusRetained: 'FAILED', singleCombinedCleanRunClaimed: false,
  browserOrNativeOrCapacityPassClaimed: false, currentAssessmentCommandsExecuted: 0,
  originalFilesOverwritten: false, sourceOrTestsEditedByReconciliation: false,
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, status: report.status, originalStatus: original.status,
  originalPassed: 11, originalFailed: 1, correctiveArenaPassed: 802, compositePassed: 12,
  source505Unchanged: true, correctedTestSha256: hash(correctedTestBytes), testsExecuted: 0 }));
