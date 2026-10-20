import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const directory = 'audit/keyboard-viewport-2026-10-20';
const json = async name => JSON.parse(await readFile(`${directory}/${name}`, 'utf8'));
const frozen = await json('source-build.json');
for (const [file, hash] of Object.entries(frozen.normalizedSourceSha256 ?? frozen.sourceSha256)) {
  const bytes = await readFile(file);
  const content = frozen.normalizedSourceSha256 ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes;
  assert.equal(createHash('sha256').update(content).digest('hex'), hash, `Source changed after freeze: ${file}`);
}
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(r => r.json()), frozen.local);
const initial = await json('acceptance-initial.json');
const confirmation = await json('accessibility-final.json');
assert.equal(initial.stats.expected, 163);
assert.equal(initial.stats.unexpected, 1);
assert.equal(confirmation.stats.expected, 16);
for (const run of [initial, confirmation]) {
  for (const field of ['skipped', 'flaky']) assert.equal(run.stats[field], 0);
  assert.deepEqual(run.errors, []);
}
assert.equal(confirmation.stats.unexpected, 0);
const byProject = {}, byFile = {};
const accepted = new Map();
function walk(suites, receipt) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      assert.equal(test.results.length, 1, 'No result-based retries');
      const key = `${spec.file}::${spec.title}::${test.projectName}`;
      if (receipt === 'accessibility-final.json') {
        assert.ok(accepted.has(key), 'Confirm only existing affected scenarios');
        assert.equal(test.status, 'expected');
        assert.equal(test.results[0].status, 'passed');
      }
      accepted.set(key, { file: spec.file, test, receipt });
    }
    walk(suite.suites ?? [], receipt);
  }
}
walk(initial.suites, 'acceptance-initial.json');
walk(confirmation.suites, 'accessibility-final.json');
assert.equal(accepted.size, 164);
for (const { file, test } of accepted.values()) {
  assert.equal(test.status, 'expected');
  assert.equal(test.results[0].status, 'passed');
  byProject[test.projectName] = (byProject[test.projectName] ?? 0) + 1;
  byFile[file] = (byFile[file] ?? 0) + 1;
}
const help = await json('help-text-check.json');
assert.deepEqual(help.build, frozen.local);
assert.ok(help.results.length === 4 && help.results.every(r => r.openAfterTextClick && r.closedOnEscape && r.summaryFocused && !r.error));
const screenshots = await json('screenshots.json');
assert.ok(screenshots.length === 5 && screenshots.every(r => JSON.stringify(r.build) === JSON.stringify(frozen.local) && r.browser === 'installed Google Chrome' && r.geometry.scale === 1 && r.geometry.keyboard.bottom <= r.height));
const typing = await json('typing-burst.json');
assert.deepEqual(typing.build, frozen.local);
assert.ok(typing.finalTextExact && typing.attempts === typing.targetUnits && typing.inputAccuracy === 100 && typing.errors.length === 0);
const comparison = await json('typing-comparison.json');
assert.deepEqual(comparison.protocol.current, frozen.local);
assert.equal(comparison.runs.length, 2);
assert.ok(comparison.runs.every(r => r.finalTextExact && r.attempts === 247 && r.errors.length === 0));
const unthrottled = await json('typing-current-native.json');
assert.deepEqual(unthrottled.build, frozen.local);
assert.ok(unthrottled.cpuThrottle === 1 && unthrottled.finalTextExact && unthrottled.attempts === 247 && unthrottled.errors.length === 0);
const mobile = await json('mobile-results.json');
assert.deepEqual(mobile.protocol.build, frozen.local);
assert.equal(mobile.runs.length, 3);
assert.ok(mobile.runs.every(r => !r.runtimeError && Object.values(r.scores).every(score => score >= 95)));
const hosting = await json('hosting-package.json');
assert.deepEqual(hosting.build, frozen.local);
assert.ok(hosting.exactPublicAndPrivateFileSetsAndHashes && !hosting.privateConfigIncluded && !hosting.frontendRebuiltDuringPackaging);
const unit = await readFile(`${directory}/unit-final.log`, 'utf8');
assert.match(unit, /824 passed/);
assert.match(unit, /59 passed/);
const lint = await readFile(`${directory}/lint-final.log`, 'utf8');
assert.match(lint, /0 errors, 9 warnings/);
const typecheck = await readFile(`${directory}/typecheck-final.log`, 'utf8');
assert.ok(typecheck.includes('tsc -p tsconfig.app.json') && !/error TS\d/.test(typecheck));
const report = { checkedAt: new Date().toISOString(), build: frozen.local, sourceHashesStillMatch: true, canonicalMetricsFull3DAndBackendUnchanged: frozen.canonicalMetricsFull3DAndBackendUnchanged,
  acceptance: { uniqueConfirmedScenarios: accepted.size, byProject, byFile, workers: initial.config.workers, retries: 0, initial: initial.stats, affectedAccessibilityConfirmation: confirmation.stats, method: 'Initial163/164; one Firefox scan caught a finite entrance fade. After a test-only settle correction, all16 affected accessibility scenarios confirmed. The148 unaffected passing scenarios and16 confirmations cover164 unique scenarios on unchanged product build c6eda8be1c3db12c2b06. This is not a claim of a single clean164-case run.' },
  unit: { passed: 824, files: 59 }, static: { typecheck: 'pass', lintErrors: 0, existingLintWarnings: 9, bundle: 'pass; see bundle-final.txt' },
  installedChrome: screenshots.map(r => ({ name: r.name, version: r.version, geometry: r.geometry })), help: help.results,
  typing: { targetUnits: typing.targetUnits, exact: typing.finalTextExact, attempts: typing.attempts, accuracy: typing.inputAccuracy, cpuThrottle: typing.cpuThrottle, wpm: typing.correctCharacterWpm, p98EventDurationMs: typing.p98ObservedTypingEventDurationMs, note: typing.limitation },
  typingControlledComparison: { runs: comparison.runs.map(r => ({ name: r.name, build: r.build, wpm: r.correctCharacterWpm, p98EventDurationMs: r.p98ObservedTypingEventDurationMs, exact: r.finalTextExact, attempts: r.attempts })), currentToPreviousWpmRatio: comparison.currentToPreviousWpmRatio, caveat: comparison.protocol.method },
  typingUnthrottled: { cpuThrottle: unthrottled.cpuThrottle, exact: unthrottled.finalTextExact, attempts: unthrottled.attempts, p98EventDurationMs: unthrottled.p98ObservedTypingEventDurationMs, maximumEventDurationMs: unthrottled.maxObservedTypingEventDurationMs, longTasks: unthrottled.longTasksThroughResultsTransition, caveat: 'Synthetic local Chromium input; not a physical native-device test or a real human speed score.' },
  mobile: mobile.runs.map(r => ({ run: r.run, scores: r.scores, metrics: r.metrics })), hosting,
  limits: ['Finite local browser coverage; no universal perfection claim', 'The sub100ms event-latency target is NOT MET in this4x CPU lab: both previous and current controlled p98 were120ms; unthrottled current p98 was24ms', 'Native Safari/macOS/iOS and physical mobile soft-keyboard acceptance remain unverified', 'Lighthouse is a local lab measurement, not field performance', 'Very short windows, large text and expanded content may require normal document scrolling', 'No hosted deployment or new backend acceptance performed for this frontend correction'] };
await writeFile(`${directory}/verification-summary.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
