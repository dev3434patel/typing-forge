// Read-only review: importing this preflight starts no owner, database, API or browser.
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { verifyPreparedOrdinarySource35 } from './source35-ordinary-preflight.mjs';
const directory = 'audit/2026-11-05-followup';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const file = `${directory}/source35-ordinary-capacity-preparation-v3.json`;
const bytes = await readFile(file), plan = JSON.parse(bytes);
assert.equal(sha(bytes), '3f3906bed12850a8f13b35ea63d45a79cbf9dd67ab51556b877bc86a971b318b');
assert.equal(process.env.SPAROWTYPE_SOURCE35_CAPACITY_PREPARATION_SHA256, sha(bytes));
assert.equal(process.env.SPAROWTYPE_FINAL35_BUILD_ID, 'd89f84d74519bf2bbae0');
const active = ['pack-capacity-instance-source35.mjs', 'pack-capacity-instance-source35-wire.mjs', 'run-source35-capacity-burst.mjs', 'run-source35-capacity-wire-burst.mjs', 'run-source35-native-rate.mjs', 'native-rate-worker-source35.php'];
const activeFiles = [];
const actualManifestDeclarations = [];
for (const name of active) {
  const path = `${directory}/${name}`, code = await readFile(path, 'utf8');
  assert.equal(/final34-source\.json|source34|FINAL34|\b505\b|332e23584f1e36465df2|275c8c24d65054abae18713c1eee4dad18888332/.test(code), false, `Stale operative checkpoint: ${name}`);
  activeFiles.push({ file: path, sha256: sha(await readFile(path)) });
  if (name.startsWith('run-')) {
    const declaration = code.match(/const (sourceFile|source) = `\$\{directory\}\/([^`]+)`/);
    assert.ok(declaration, `Read the actual manifest declaration: ${name}`);
    assert.equal(declaration[2], 'final35-source.json');
    assert.ok(code.includes("'audit/2026-11-05-followup'"));
    assert.ok(code.includes('SPAROWTYPE_FINAL35_BUILD_ID'));
    assert.ok(code.includes('.receipt.compared, 506)'));
    actualManifestDeclarations.push({ file: path, variable: declaration[1], literal: '${directory}/' + declaration[2], resolved: `${directory}/${declaration[2]}` });
    if (name.includes('capacity-')) {
      for (const expected of ['expectedArenaOperations: 1653', 'p95TargetMs: 150', 'concurrency: 20', 'rooms: 50', 'accountsPerRoom: 8', 'retries: 0', 'resultFiltering: false', 'rateCountersReset: false']) assert.ok(code.includes(expected), `${name}: ${expected}`);
    }
  } else if (name.startsWith('pack-')) {
    const guardAt = code.indexOf('await verifyPreparedOrdinarySource35();');
    assert.ok(guardAt >= 0 && guardAt < code.indexOf('const root ='));
    assert.ok(code.includes('assert.equal(actual.opcodeCacheEnabled,false'));
    assert.ok(code.includes('assert.equal(actual.pdoMysqlLoaded,true)'));
    assert.ok(code.includes('assert.equal(actual.nativeMysqlDriverAvailable,true)'));
  }
}
const preflight = await verifyPreparedOrdinarySource35();
assert.equal(preflight.source.compared, 506); assert.deepEqual(preflight.source.mismatches, []);
assert.equal(preflight.build.version, 'd89f84d74519bf2bbae0');
const manifest = JSON.parse(await readFile(`${directory}/final35-source.json`, 'utf8'));
assert.equal(manifest.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
assert.equal(manifest.fullIntroSourceUnchanged, true);
assert.ok(isDeepStrictEqual(preflight.runtimeInputs, plan.preflight.runtimeInputs));
for (const row of actualManifestDeclarations) assert.equal((await stat(row.resolved)).isFile(), true);
const names = [...(await readdir('e2e')).filter(name => name.endsWith('.ts')).map(name => `e2e/${name}`), 'playwright.config.ts'].sort();
const hashes = Object.fromEntries(await Promise.all(names.map(async path => [path, sha(await readFile(path))])));
assert.equal(names.length, 73);
assert.equal(sha(JSON.stringify(hashes)), '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');
const receipt = {
  status: 'PASS-SCOPED-READONLY-PREFLIGHT-NATIVE-FACTS-STILL-REQUIRED', recordedAt: new Date().toISOString(),
  reviewedPreparation: { file, sha256: sha(bytes) }, activeFiles, actualManifestDeclarations,
  actualCanonicalPreflight: preflight, baselineVerified: manifest.baseline,
  all73DependencyHashesUnchanged: true, dependencySha256: sha(JSON.stringify(hashes)),
  allExplicitRequiredPathsExist: true, actualRuntimeInputsMatchFrozenV3: true,
  knownHistoricalLabelsRetainedIntentionally: ['pack-native-rate33-complete', 'audit-native-rate33:<owned random run>', 'Source20 assertion text'],
  remainingNativeOnlyPreconditions: ['Fresh MariaDB PID/datadir/port and isolated schema identity', 'Owned Apache worker parent/PID, private ini/config and session namespace', 'Actual OPcache OFF, PDO MySQL extension and native driver availability', 'Native application clock/rate/CSRF/receipt behavior and strict1653-request timing', 'Graceful owned cleanup and absence of residual processes'],
  actualCapacityRequestsPerformed: 0, processesOrServicesOrBrowsersStarted: 0,
  privateOriginalConfigurationRead: false, activeHelpersOrAppOrTestsEdited: false,
  setupFailuresReclassifiedAsCapacityAttempts: false,
  runtimeRequiresNewRootGoAndConfirmedPriorCleanup: true,
};
await writeFile(`${directory}/source35-capacity-independent-preflight.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, actualManifestDeclarations: actualManifestDeclarations.length, sourceFiles: preflight.source.compared, build: preflight.build.version, requiredPaths: preflight.requiredPaths.length, runtimeInputs: Object.keys(preflight.runtimeInputs).length, servicesStarted: 0 }));
