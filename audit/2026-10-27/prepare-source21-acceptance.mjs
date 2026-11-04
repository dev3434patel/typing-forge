// Preparation only: path/identity adapters for the original acceptance protocols.
// This file never launches browsers, services, builds or measurements.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const previous = 'audit/2026-10-21';
const current = 'audit/2026-10-27';
const prepared = [];
const digest = value => createHash('sha256').update(value).digest('hex');
async function adapt(from, to, substitutions = []) {
  const original = await readFile(from, 'utf8');
  let output = original;
  const changes = [];
  for (const [before, after, expected] of substitutions) {
    const count = output.split(before).length - 1;
    assert.ok(count > 0, `${from}: adapter input not present: ${before}`);
    if (expected !== undefined) assert.equal(count, expected, `${from}: exact adapter cardinality`);
    output = output.replaceAll(before, after);
    changes.push({ before, after, occurrences: count });
  }
  try { await writeFile(to, output, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    assert.equal(await readFile(to, 'utf8'), output, `Refusing to change a different existing prepared file: ${to}`);
  }
  prepared.push({ original: from, originalSha256: digest(original), adapter: to, adapterSha256: digest(output), substitutions: changes });
}
const identity = [['final19', 'final21'], ['FINAL19', 'FINAL21']];
const directory = [[previous, current]];
const historicalHelper = [["from './artifact-verification.mjs'", "from '../2026-10-21/artifact-verification.mjs'", 1]];

await adapt(`${current}/pack-backend-instance-source20.mjs`, `${current}/pack-backend-instance-source21.mjs`, [
  ['source20', 'source21'], ['capacity20', 'capacity21'],
]);
await adapt(`${current}/run-source20-capacity-burst.mjs`, `${current}/run-source21-capacity-burst.mjs`, [
  ['source20', 'source21'], ['SOURCE20', 'SOURCE21'], ['final20', 'final21'], ['FINAL20', 'FINAL21'],
]);
await adapt(`${previous}/run-final19-browser-matrix.mjs`, `${current}/run-final21-browser-matrix.mjs`, [
  ...identity, ...directory, ...historicalHelper,
  ['Source18 includes the new PWA snapshot consistency spec exactly once.', 'Source21 includes the PWA snapshot consistency spec exactly once.', 1],
]);
await adapt(`${previous}/run-browser-checkpoint-final19.mjs`, `${current}/run-browser-checkpoint-final21.mjs`, [
  identity[1], ...directory,
  ['Supply the actual frozen18 build identity.', 'Supply the actual frozen source21 build identity.', 1],
]);
// The verifier's only output-path dependency is reserve(). All verification
// logic and quality baselines stay identical to the historical module.
await adapt(`${previous}/artifact-verification.mjs`, `${current}/artifact-verification.mjs`, [
  ["export const auditDirectory = 'audit/2026-10-21';", "export const auditDirectory = 'audit/2026-10-27';", 1],
]);
await adapt(`${previous}/verify-static-artifacts.mjs`, `${current}/verify-static-artifacts.mjs`);
await adapt(`${previous}/run-final19-static.mjs`, `${current}/run-final21-static.mjs`, [
  ...identity, ...directory,
]);
await adapt(`${previous}/pack-native-browser.mjs`, `${current}/pack-native-browser.mjs`);
await adapt(`${previous}/run-final19-native-browser.mjs`, `${current}/run-final21-native-browser.mjs`, [
  ...identity, ...directory, ...historicalHelper,
  ['newly frozen source17 build', 'newly frozen source21 build', 1],
  ['`${directory}/pack-backend-instance.mjs`', '`${directory}/pack-backend-instance-source21.mjs`', 1],
  ['`${directory}/pack-apache-runtime.mjs`', "'audit/2026-10-21/pack-apache-runtime.mjs'", 1],
]);
const mobileReferences = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-10-27';", 1],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final21-static'", 1],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final21-static-protocol.json`', 1],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final21-static-build.json`', 1],
];
await adapt(`${previous}/measure-mobile-workspaces.mjs`, `${current}/measure-mobile-workspaces-static-final21.mjs`, mobileReferences);
await adapt(`${previous}/run-mobile-workspaces-static-final19.mjs`, `${current}/run-mobile-workspaces-static-final21.mjs`, [
  ...identity, ...directory, ...historicalHelper,
  ['const originalDriver = `${audit}/measure-mobile-workspaces.mjs`;', "const originalDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';", 1],
  ['const originalProtocol = `${audit}/mobile-workspaces-final7-protocol.json`;', "const originalProtocol = 'audit/2026-10-21/mobile-workspaces-final7-protocol.json';", 1],
  ['preservedNormalReport: `${audit}/mobile-workspaces-final7.json`,', "preservedNormalReport: 'audit/2026-10-21/mobile-workspaces-final7.json',", 1],
  ['const referenceChanges = [', 'const referenceChanges = [\n  ["const directory = \'audit/2026-10-21\';", "const directory = \'audit/2026-10-27\';"],', 1],
  ['Only default protocol/build/output references may differ;', 'Only audit directory and default protocol/build/output references may differ;', 1],
]);

await writeFile(`${current}/source21-wrapper-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  scope: 'New source21 audit namespaces and path adapters only. No production, tests, assertions, deadlines, event timings, quality assets or historical receipts are changed. Source20 preparations remain preserved.',
  sourceFileExpectedAtExecution: `${current}/final21-source.json`,
  buildEnvironmentAtExecution: 'SPAROWTYPE_FINAL21_BUILD_ID',
  testsExecuted: false, servicesStarted: false, buildsExecuted: false,
  prepared,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', files: prepared.map(item => item.adapter), originalFilesUnchanged: true }));
