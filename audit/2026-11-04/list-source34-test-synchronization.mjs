import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const root = 'audit/2026-11-04';
const adoptionFile = `${root}/source34-test-synchronization-adoption.json`;
const adoption = JSON.parse(await readFile(adoptionFile, 'utf8'));
const originals = {};
const protocols = ['final34-ci-extra-protocol.json', 'final34-existing-protocol.json', 'final34-first-input-timing-protocol.json', 'final34-isolated-protocol.json', 'final34-new-features-protocol.json'];
for (const name of protocols) {
  const protocol = JSON.parse(await readFile(`audit/2026-11-02/${name}`, 'utf8'));
  for (const [file, expected] of Object.entries(protocol.testHashes ?? {})) {
    assert.ok(!originals[file] || originals[file] === expected, `Conflicting original test input: ${file}`);
    originals[file] = expected;
  }
}
const edited = new Map(adoption.edits.map(row => [row.file, row]));
const before = {};
for (const [file, expected] of Object.entries(originals)) {
  const actual = hash(await readFile(file));
  assert.equal(actual, edited.get(file)?.afterSha256 ?? expected, `Unexpected dependency mutation: ${file}`);
  if (edited.has(file)) assert.equal(expected, edited.get(file).beforeSha256);
  before[file] = actual;
}
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...adoption.followupFiles, '--list', '--reporter=json'], { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4173', PLAYWRIGHT_BROWSERS: 'chromium,edge,firefox,webkit' } });
await writeFile(`${root}/source34-five-file-followup-list.json`, result.stdout);
await writeFile(`${root}/source34-five-file-followup-list-stderr.log`, result.stderr);
assert.equal(result.status, 0, 'Playwright discovery must succeed');
const listed = JSON.parse(result.stdout);
const counts = {}, pairs = [];
function walk(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const key = `${test.projectName}:${spec.file}`;
      counts[key] = (counts[key] ?? 0) + 1;
      pairs.push({ project: test.projectName, file: spec.file, title: spec.title });
    }
    walk(suite.suites);
  }
}
walk(listed.suites);
const after = {};
for (const [file, expected] of Object.entries(before)) { const actual = hash(await readFile(file)); assert.equal(actual, expected); after[file] = actual; }
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(frozen.receipt.compared, 505); assert.deepEqual(frozen.receipt.mismatches, []);
assert.equal(new Set(pairs.map(row => row.project)).size, 4);
assert.equal(new Set(pairs.map(row => row.file)).size, 5);
const receipt = { recordedAt: new Date().toISOString(), status: 'STABLE-DISCOVERY-ONLY-NO-BROWSER-EXECUTED', adoptionFile, adoptionSha256: hash(await readFile(adoptionFile)), source: frozen.receipt, originalProtocolFiles: protocols, dependencyCount: Object.keys(before).length, allDependencyHashesUnchangedThroughDiscovery: true, testHashes: after, completeFileCount: 5, projectCount: 4, discoveredCaseCount: pairs.length, counts, cases: pairs, listFile: `${root}/source34-five-file-followup-list.json`, listSha256: hash(result.stdout), semanticTypecheckClaimed: false, syntaxCheck: 'TypeScript transpileModule zero errors for all four changed test files; Playwright discovery compiled all selected files.', noServicesStarted: true, noBrowserStarted: true, runtimeFollowup: 'NOT RUN; requires separate root GO' };
await writeFile(`${root}/source34-test-synchronization-ready.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ ready: true, dependencyCount: receipt.dependencyCount, cases: pairs.length, counts, receiptSha256: hash(JSON.stringify(receipt, null, 2) + '\n') }));
