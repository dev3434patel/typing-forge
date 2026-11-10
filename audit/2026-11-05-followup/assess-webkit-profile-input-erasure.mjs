import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const root = 'audit/2026-11-04-followup/';
const resultFile = `${root}webkit-profile-reset-probe-result.json`;
const rawFile = `${root}webkit-profile-reset-probe-raw.json`;
const eventsFile = `${root}webkit-profile-reset-webkit-course-fill-events.jsonl`;
const result = JSON.parse(await readFile(resultFile, 'utf8'));
const raw = JSON.parse(await readFile(rawFile, 'utf8'));
const events = (await readFile(eventsFile, 'utf8')).trim().split(/\r?\n/).map(line => JSON.parse(line));
assert.equal(result.childExitCode, 1);
assert.equal(result.reportedStats.expected, 7); assert.equal(result.reportedStats.unexpected, 1);
assert.equal(result.sourceAfter.compared, 505); assert.deepEqual(result.sourceAfter.mismatches, []);
assert.ok(result.inputs.every(row => row.unchanged) && result.brand.every(row => row.unchanged));
const flatten = suites => suites.flatMap(suite => [...(suite.specs ?? []).flatMap(spec => spec.tests.map(test => ({ spec, test }))), ...flatten(suite.suites ?? [])]);
const cases = flatten(raw.suites);
assert.equal(cases.length, 8);
const failures = cases.filter(row => row.test.results.some(run => run.status !== 'passed'));
assert.equal(failures.length, 1);
const failed = failures[0];
assert.equal(failed.test.projectName, 'webkit');
assert.ok(failed.spec.title.startsWith('three real course attempts'));
const input = events.find(row => row.kind === 'browser' && row.type === 'input' && row.value === 'DELETE');
const returned = events.find(row => row.kind === 'action' && row.label === 'native-fill' && row.phase === 'end');
assert.ok(input && returned);
const emptied = events.find(row => row.kind === 'browser' && row.nodeElapsedMs > returned.nodeElapsedMs && row.value === '' && row.node === input.node);
assert.ok(emptied);
assert.equal(emptied.focused, true); assert.equal(emptied.connected, true); assert.equal(emptied.reset, false);
assert.ok(!events.some(row => row.kind === 'action' && row.label === 'reset-click'));
assert.ok(!events.some(row => row.kind === 'browser' && row.reset === true));
const files = [resultFile, rawFile, eventsFile, `${root}webkit-profile-reset-probe-protocol.json`, `${root}webkit-profile-reset-probe-preparation-v2.json`, 'src/pages/Profile.tsx'];
const bindings = await Promise.all(files.map(async file => ({ file, sha256: sha(await readFile(file)) })));
const assessment = {
  status: 'REPRODUCED-NATIVE-INPUT-ERASURE-BEFORE-RESET', recordedAt: new Date().toISOString(),
  actualExecution: { utcStart: result.reportedStats.startTime, localCalendarDate: '2026-11-05', directoryQualification: 'Pack was prepared before local midnight in2026-11-04-followup; UTC timestamps remain authoritative.', cases: 8, passed: 7, failed: 1, skipped: 0, retries: 0 },
  source505And78InputsAnd21BrandUnchanged: true,
  failure: { project: failed.test.projectName, title: failed.spec.title, caseId: failed.spec.id, errors: failed.test.results.flatMap(run => run.errors ?? []), attachments: failed.test.results.flatMap(run => run.attachments ?? []) },
  causalObservations: { inputEvent: input, nativeFillReturned: returned, sameNodeEmptyAfterReturn: emptied, delayAfterInputMs: emptied.nodeElapsedMs - input.nodeElapsedMs, delayAfterFillReturnMs: emptied.nodeElapsedMs - returned.nodeElapsedMs, resetNeverClicked: true, resetNeverPublished: true, sameConnectedFocusedNode: true, savedHistoryEventuallyThree: events.some(row => row.kind === 'browser' && row.saved === 3) },
  controls: cases.filter(row => row !== failed).map(row => ({ project: row.test.projectName, title: row.spec.title, passedOnce: row.test.results.length === 1 && row.test.results[0].status === 'passed' })),
  interpretation: 'A real native insertion is erased after fill returns and before any reset action/navigation. This reproduces the observable original case1014 state and rules out reset-remount/navigation as the cause of this newly observed erasure. Static Profile source contains a mount/owner passive effect clearing confirmation; it is the leading causal candidate. No effect stack was captured, so the historical60-second timeout is not retroactively declared conclusively explained.',
  proposedChangeNotApplied: 'Scope confirmation draft state to its owner and derive empty text on mismatch, replacing the passive confirmation clear while retaining message clearing. Native follow-up must test actual value retention and owner isolation.',
  originalEvidenceOverwritten: false, productOrExistingTestsEdited: false, additionalRuntimeStarted: false,
  bindings,
};
await writeFile('audit/2026-11-05-followup/webkit-profile-input-erasure-assessment.json', JSON.stringify(assessment, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: assessment.status, delayAfterFillReturnMs: assessment.causalObservations.delayAfterFillReturnMs, sameNode: input.node, resetNeverClicked: true }));
