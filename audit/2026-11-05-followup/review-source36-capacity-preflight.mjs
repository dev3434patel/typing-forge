// Read-only independent readiness review. Never imports either service owner.
import assert from 'node:assert/strict';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyPreparedOrdinarySource36 } from './source36-ordinary-preflight.mjs';
const directory = 'audit/2026-11-05-followup';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const preparationFile = `${directory}/source36-ordinary-capacity-preparation-v3.json`;
const preparationBytes = await readFile(preparationFile);
const expectedPreparationSha256 = '20d39a2f43241388d33260b9082554207d9fce8ba7b31b88a28e424a7dced7af';
assert.equal(sha(preparationBytes), expectedPreparationSha256);
const preparation = JSON.parse(preparationBytes);
const activeFiles = [];
for (const row of preparation.changes) {
  const body = await readFile(row.file), text = body.toString('utf8');
  assert.equal(sha(body), row.sha256);
  assert.ok(!/(?:source35|Source35|SOURCE35|final35|FINAL35|capacity35|ordinary35|rate-native35|332e23584f1e36465df2|275c)/.test(text), row.file);
  activeFiles.push({ file: row.file, sha256: sha(body) });
}
assert.equal(activeFiles.length, 7);
const actualManifestDeclarations = [];
const actualInputDeclarations = [];
for (const name of ['run-source36-capacity-burst.mjs', 'run-source36-capacity-wire-burst.mjs', 'run-source36-native-rate.mjs']) {
  const file = `${directory}/${name}`, text = await readFile(file, 'utf8');
  const variable = name === 'run-source36-native-rate.mjs' ? 'source' : 'sourceFile';
  const literal = text.match(new RegExp(`const ${variable} = \\x60([^\\x60]+)\\x60`))?.[1];
  assert.equal(literal, '${directory}/final36-source.json', file);
  assert.match(text, /sourceBefore\.receipt\.compared, 506/);
  assert.match(text, /SPAROWTYPE_FINAL36_BUILD_ID/);
  actualManifestDeclarations.push({ file, variable, literal, resolved: `${directory}/final36-source.json` });
  const declaration = text.match(/const (?:inputs|inputPaths) = \[([^\]]+)\];/)?.[1];
  assert.ok(declaration, file);
  const paths = [...declaration.matchAll(/'([^']+)'|`([^`]+)`/g)].map(match => (match[1] ?? match[2]).replace('${directory}', directory).replace('${driver}', `${directory}/native-rate-worker-source36.php`));
  if (declaration.startsWith('driver,')) paths.unshift(`${directory}/native-rate-worker-source36.php`);
  assert.ok(paths.length >= 4, file);
  const inputs = [];
  for (const path of paths) { assert.equal((await stat(path)).isFile(), true); inputs.push({ file: path, sha256: sha(await readFile(path)) }); }
  actualInputDeclarations.push({ file, inputs });
}
const ownerEntryGuards = [];
for (const name of ['pack-capacity-instance-source36.mjs', 'pack-capacity-instance-source36-wire.mjs']) {
  const file = `${directory}/${name}`, text = await readFile(file, 'utf8');
  const guard = text.indexOf('await verifyPreparedOrdinarySource36();');
  assert.ok(guard > 0 && guard < text.indexOf('const id = randomBytes'));
  assert.match(text, /from '\.\/source36-ordinary-preflight\.mjs'/);
  ownerEntryGuards.push({ file, canonicalGuardBeforeOwnerIdentityAndInitialization: true });
}
process.env.SPAROWTYPE_SOURCE36_CAPACITY_PREPARATION_SHA256 = expectedPreparationSha256;
process.env.SPAROWTYPE_FINAL36_BUILD_ID = 'd89f84d74519bf2bbae0';
const actualCanonicalPreflight = await verifyPreparedOrdinarySource36();
assert.equal(actualCanonicalPreflight.requiredPaths.length, 36);
assert.equal(Object.keys(actualCanonicalPreflight.runtimeInputs).length, 10);
const manifest = JSON.parse(await readFile(`${directory}/final36-source.json`, 'utf8'));
assert.equal(manifest.baseline, '9b21e255ea1840508cbc35b625d0ccde8f3af7cc');
const dependencies = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
assert.equal(dependencies.length, 73);
const dependencyHashes = Object.fromEntries(await Promise.all(dependencies.map(async file => [file, sha(await readFile(file))])));
const dependencySha256 = sha(JSON.stringify(dependencyHashes));
assert.equal(dependencySha256, '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');
const receipt = {
  status: 'PASS-SCOPED-READONLY-PREFLIGHT-NATIVE-FACTS-STILL-REQUIRED', recordedAt: new Date().toISOString(),
  reviewedPreparation: { file: preparationFile, sha256: expectedPreparationSha256 }, activeFiles,
  actualManifestDeclarations, actualInputDeclarations, ownerEntryGuards, actualCanonicalPreflight,
  baselineVerified: manifest.baseline, all73DependencyHashesUnchanged: true, dependencySha256,
  allExplicitRequiredPathsExist: true, actualRuntimeInputsMatchFrozenV3: true,
  strictWorkloadUnchanged: preparation.predeclaredRepeatedAcceptance,
  knownHistoricalLabelsRetainedIntentionally: preparation.retainedHistoricalMetadataLabels,
  remainingNativeOnlyPreconditions: [
    'Fresh MariaDB PID/datadir/port and isolated schema identity',
    'Owned Apache worker parent/PID, private ini/config and session namespace',
    'Actual OPcache OFF, PDO MySQL extension and native driver availability',
    'Native application clock/rate/CSRF/receipt behavior and strict1653-request timing',
    'Graceful owned cleanup and absence of residual processes',
  ],
  actualCapacityRequestsPerformed: 0, processesOrServicesOrBrowsersStarted: 0, privateOriginalConfigurationRead: false,
  activeHelpersOrAppOrTestsEdited: false, setupFailuresReclassifiedAsCapacityAttempts: false,
  runtimeRequiresNewRootGoAndConfirmedPriorCleanup: true,
};
const output = `${directory}/source36-capacity-independent-preflight.json`;
await writeFile(output, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, output, sourceFiles: actualCanonicalPreflight.source.compared, requiredPaths: 36, runtimeInputs: 10, dependencies: 73, servicesStarted: 0 }));
