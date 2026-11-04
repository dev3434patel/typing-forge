import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const output = 'audit/2026-11-04/source34-native20-readiness-v1.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const sha = value => createHash('sha256').update(value).digest('hex');
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const runner = 'audit/2026-11-02/run-final34-native-browser.mjs';
const adapter = 'audit/2026-11-02/pack-native-browser-final34.mjs';
const owner = 'audit/2026-11-02/pack-backend-instance-source34.mjs';
const code = await readFile(runner, 'utf8');
const adapterCode = await readFile(adapter, 'utf8');
for (const fragment of ["SPAROWTYPE_FINAL34_NATIVE_BROWSER_WINDOW", "freshOwnedBackendAndAccountsPerEngine: true", "accountsReseededWithinOwner: false", "productionRatePolicyChanged: false", "expectedCases: 20", "retries: 0", "gracefulCleanupVerified", "505"]) assert.ok(code.includes(fragment), fragment);
const selectedTitles = [
  'real PHP account signup, replay upload, independent-device history/preferences and account deletion',
  'real two-browser PHP human race shares opponent pace and settles server results',
  'real account sign in with dedicated deployment credentials',
  'PHP two-account race authorization and server-owned countdown',
  'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish',
];
for (const title of selectedTitles) assert.ok(code.includes(title) && adapterCode.includes(title));
for (const file of ['audit/2026-11-02/final34-native-browser.json', 'audit/2026-11-02/final34-native-browser.log']) await assert.rejects(access(file), { code: 'ENOENT' });
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(frozen.receipt.compared, 505);
assert.deepEqual(frozen.receipt.mismatches, []);
assert.equal(frozen.frozen.local.version, '332e23584f1e36465df2');
const dependencies = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'];
const receipt = {
  status: 'PREPARED-NOT-RUN-FINAL-TEST-REVISION-PENDING',
  recordedAt: new Date().toISOString(),
  source: frozen.receipt,
  build: frozen.frozen.local.version,
  harnesses: await Promise.all([runner, adapter, owner].map(bind)),
  currentDependencyHashes: await Promise.all(dependencies.sort().map(bind)),
  currentDependencyQualification: 'Readiness snapshot before any approved post-matrix test/helper correction. Fresh runtime must bind the final stable revision; this snapshot does not certify a future helper revision.',
  browsers: ['chromium', 'edge', 'firefox', 'webkit'],
  ownersRequired: 4,
  freshOwnerForEveryEngine: true,
  casesPerOwner: 5,
  expectedExactCases: 20,
  selectedTitles,
  workers: 1,
  retries: 0,
  backendInstancesConcurrent: 1,
  nextEngineRequiresPriorGracefulCleanup: true,
  reusedOwnersOrAccounts: false,
  resetCountersOrReseedWithinOwner: false,
  productionAuthenticationQuotasChanged: false,
  runtimeEnvironment: {
    SPAROWTYPE_FINAL34_NATIVE_BROWSER_WINDOW: '1',
    SPAROWTYPE_FINAL34_BUILD_ID: '332e23584f1e36465df2',
    SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC: 'MUST-BE-UNSET',
  },
  entry: `node ${runner}`,
  servicesStarted: false,
  browserStarted: false,
  testsExecuted: false,
  privateConfigurationRead: false,
  sourceOrTestsEdited: false,
  executionRequiresSeparateRootGo: true,
};
await writeFile(output, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ output, status: receipt.status, dependencyCount: dependencies.length, sourceFiles: frozen.receipt.compared, expectedCases: receipt.expectedExactCases }));
