import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { filesystemSource36Preflight } from './source36-ordinary-preflight.mjs';

const directory = 'audit/2026-11-05-followup';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedBuild = 'd89f84d74519bf2bbae0';
const expectedDependencySha256 = '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37';
const original32 = 'audit/2026-11-02/run-source34-arena-chart-http.mjs';
const original29 = 'audit/mega-pack-2026-10-21/run-arena-http.mjs';
const baseOwner = `${directory}/pack-backend-instance-source36.mjs`;
const ordinaryPreparation = `${directory}/source36-ordinary-capacity-preparation-v3.json`;

export const source36NativeArena32RuntimeFiles = Object.freeze([
  `${directory}/pack-source36-native-arena-http32.mjs`,
  `${directory}/run-source36-native-arena-http32.mjs`,
  `${directory}/source36-native-arena32-preflight.mjs`,
  original32, original29, baseOwner,
  'backend/tests/arena-audit-admin.php',
  'scripts/php-runtime.mjs',
  'audit/2026-10-21/pack-apache-runtime.mjs',
]);

const checkNames = text => [...text.matchAll(/\bcheck\(\s*'((?:\\.|[^'\\])*)'\s*,/g)].map(match => match[1]);

/** Filesystem/hash proof only; importing this module never starts a native process. */
export async function filesystemSource36NativeArena32Preflight(buildId) {
  assert.equal(buildId, expectedBuild, 'The native functional window must use the declared current source36 build.');
  const ordinary = await filesystemSource36Preflight(buildId);
  assert.equal(ordinary.source.compared, 506);
  assert.deepEqual(ordinary.source.mismatches, []);
  assert.equal(ordinary.build.version, expectedBuild);
  assert.equal(ordinary.requiredPaths.length, 36);
  assert.equal(Object.keys(ordinary.runtimeInputs).length, 10);
  assert.equal(ordinary.producerDependenciesVerified, 18);
  const ordinaryBytes = await readFile(ordinaryPreparation);
  const ordinaryPlan = JSON.parse(ordinaryBytes);
  assert.deepEqual(ordinary.runtimeInputs, ordinaryPlan.preflight.runtimeInputs, 'The ten ordinary runtime helpers must remain frozen.');
  assert.equal(ordinary.sourceManifestSha256, ordinaryPlan.preflight.sourceManifestSha256);

  const runtimeInputs = {};
  for (const file of [...source36NativeArena32RuntimeFiles].sort()) {
    assert.equal((await stat(file)).isFile(), true, `Required source36 native Arena32 input: ${file}`);
    runtimeInputs[file] = sha256(await readFile(file));
  }
  assert.equal(runtimeInputs[original32], '5bd4b0c068681ccad6dddecef61923650c2cbac8790dbdb6d69cb15a4bd69007', 'The original full32 lifecycle must retain its exact bytes.');
  assert.equal(runtimeInputs[original29], '6f0a3b526a7477f1c720f6036f5ce22cc78b6d71d80d8d3498504681f566f407', 'The original29 lifecycle must retain its exact bytes.');
  assert.equal(runtimeInputs[baseOwner], '733a101abae7a45f70bb6d400ce06a00e2e31271539b657e4687f3b56c2041a2', 'The source36 base owner must remain frozen.');
  const names29 = checkNames(await readFile(original29, 'utf8'));
  const names32 = checkNames(await readFile(original32, 'utf8'));
  assert.equal(names29.length, 29);
  assert.equal(names32.length, 32);
  assert.equal(new Set(names29).size, 29);
  assert.equal(new Set(names32).size, 32);
  let cursor = 0;
  for (const name of names29) {
    const position = names32.indexOf(name, cursor);
    assert.ok(position >= cursor, 'Every original29 check must remain in the full32 suite in its original order.');
    cursor = position + 1;
  }

  const dependencyFiles = [
    ...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`),
    'playwright.config.ts',
  ].sort();
  assert.equal(dependencyFiles.length, 73);
  assert.ok(dependencyFiles.includes('e2e/helpers.ts'));
  const dependencyHashes = Object.fromEntries(await Promise.all(dependencyFiles.map(async file => [file, sha256(await readFile(file))])));
  const dependencySha256 = sha256(JSON.stringify(dependencyHashes));
  assert.equal(dependencySha256, expectedDependencySha256, 'All current e2e/config files must retain the approved stable digest.');

  return {
    ordinary, runtimeInputs,
    frozenOrdinaryPreparation: { file: ordinaryPreparation, sha256: sha256(ordinaryBytes), tenRuntimeInputsUnchanged: true },
    suites: {
      original29: { file: original29, sha256: runtimeInputs[original29], checks: 29, names: names29 },
      full32: { file: original32, sha256: runtimeInputs[original32], checks: 32, names: names32 },
      original29PreservedInOrder: true,
    },
    dependencyFiles, dependencyHashes, dependencySha256,
    all73TestConfigDependenciesUnchanged: true,
    scope: 'Filesystem proof for a separately authorized source36 native Arena32 functional lifecycle. No capacity workload or ordinary owner is executed by this guard.',
    ordinaryOwnerExecuted: false, productionEdited: false,
    servicesStarted: 0, privateOriginalConfigurationRead: false,
  };
}

/** Must complete before the owner starts any process and before the wrapper creates fixtures. */
export async function verifyPreparedSource36NativeArena32() {
  const file = `${directory}/source36-native-arena32-preparation.json`;
  const bytes = await readFile(file);
  const expected = process.env.SPAROWTYPE_SOURCE36_ARENA_HTTP_PREPARATION_SHA256;
  assert.match(expected ?? '', /^[a-f0-9]{64}$/, 'Bind the independently reviewed native Arena32 preparation.');
  assert.equal(sha256(bytes), expected, 'Caller preparation identity changed before native startup.');
  const plan = JSON.parse(bytes);
  assert.equal(process.env.SPAROWTYPE_FINAL36_BUILD_ID, expectedBuild);
  const actual = await filesystemSource36NativeArena32Preflight(process.env.SPAROWTYPE_FINAL36_BUILD_ID);
  assert.deepEqual(actual, plan.preflight, 'Every prepared source, helper, lifecycle and test dependency must still match before native execution.');
  return actual;
}
