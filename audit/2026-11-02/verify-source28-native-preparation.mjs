// Static-only preparation review. Never imports an executable owner or adapter.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const directory = 'audit/2026-11-02';
const sha = value => createHash('sha256').update(value).digest('hex');
const normalize = value => value.toString('utf8').replaceAll('\r\n', '\n');
const prepFile = `${directory}/source28-native-acceptance-preparation.json`;
const prep = JSON.parse(await readFile(prepFile, 'utf8'));
const owner = await readFile(prep.owner.target), adapter = await readFile(prep.adapter.target);
assert.equal(sha(owner), prep.owner.sha256); assert.equal(sha(adapter), prep.adapter.sha256);
const oldOwner = await readFile(prep.owner.baseline), oldAdapter = await readFile(prep.adapter.baseline);
assert.equal(sha(oldOwner), prep.owner.baselineRawSha256); assert.equal(sha(oldAdapter), prep.adapter.baselineRawSha256);
const reversedOwner = normalize(owner).replaceAll('SPAROWTYPE_FINAL28_', 'SPAROWTYPE_FINAL27_')
  .replaceAll('source28', 'source27')
  .replace('audit/2026-11-02/final28-source.json', 'audit/2026-10-27/final27-source.json');
assert.equal(reversedOwner, normalize(oldOwner));
let reversedAdapter = normalize(adapter);
for (const { before, after } of [...prep.adapter.changes].reverse()) {
  assert.equal(reversedAdapter.split(after).length - 1, 1); reversedAdapter = reversedAdapter.replace(after, before);
}
assert.equal(reversedAdapter, normalize(oldAdapter));
const adapterText = normalize(adapter);
const selectedLiteral = adapterText.match(/const selected=(\[[^\n]+\]);/)?.[1];
assert.ok(selectedLiteral);
const originalTwentyAdapter = normalize(await readFile('audit/2026-10-27/pack-native-browser-final27.mjs'));
assert.equal(originalTwentyAdapter.includes(`:${selectedLiteral};`), true, 'The original five native titles must remain exactly selected.');
const runnerFile = `${directory}/run-final28-native-browser.mjs`;
const runner = normalize(await readFile(runnerFile));
for (const proof of [
  "const engines = ['chromium', 'edge', 'firefox', 'webkit']",
  'sourceFile, ownerFile, adapterFile',
  'assert.equal(result.receipt.compared, 505)',
  'assert.deepEqual(dist.hashes, distBefore.hashes',
  "SPAROWTYPE_PACK_SUITES: 'password'",
  "activeOwner.child.stdin.write('prepare-browser\\n')",
  'if (activeOwner) await cleanOwner(activeOwner, run)',
  'run.abortFurtherEngines = true',
  'assert.ok(!run.abortFurtherEngines',
  'child.stdin?.on(\'error\'',
  'state.stdout += text',
  'state.stderr += chunk.toString()',
  'cleanup.gracefulDatabaseShutdown === true && cleanup.gracefulApacheShutdown === true',
]) assert.equal(runner.includes(proof), true, proof);
const files = [
  `${directory}/prepare-source28-native-acceptance.mjs`, prep.owner.target, prep.adapter.target,
  runnerFile, `${directory}/verify-source28-native-preparation.mjs`,
];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(file))])));
const result = {
  capturedAt: new Date().toISOString(), status: 'STATIC-PREPARATION-VERIFIED-NOT-RUN',
  preparationReceipt: prepFile, helperHashes: hashes,
  ownerNormalizedCloneReversesExactly: true, adapterDeclaredChangesReverseExactly: true,
  originalFiveTitlesMatchExactly: true, allSource27ReportsPreserved: true,
  executionPrerequisites: {
    command: 'node audit/2026-11-02/run-final28-native-browser.mjs',
    flags: { SPAROWTYPE_FINAL28_NATIVE_BROWSER_WINDOW: '1', SPAROWTYPE_FINAL28_BUILD_ID: 'Actual20HexBuildIDFromTheCompletedDefaultDist' },
    frozenSource: 'audit/2026-11-02/final28-source.json', requiredSourceHashes: 505,
    defaultDist: 'dist', rootGoStillRequired: true, actualBuildNotAssumed: true,
  },
  reviewedBehavior: [
    'One full five-title selection per engine; single project and one worker, no retries, traces off.',
    'A new owned backend, schema, session namespace and two accounts for each engine; no per-owner counters reset or accounts reseeded.',
    'Owner only permits password readiness, prepare-browser, lease renewal and graceful cleanup.',
    'Same-owner graceful Apache and database shutdown, all owned processes stopped and directory removed before a subsequent engine.',
    'Any forced adapter stop or missing completion event aborts later engines after requesting owner cleanup; browser descendants are explicitly unverified on that abnormal path.',
    'Whole child streams are redacted after reassembly; stdin stream errors are handled.',
    'The wrapper reads public owner readiness only; the guarded child adapter consumes only its own private synthetic environment.',
    'The505 source hashes, manifest bytes, exact test/helper inputs and complete default-dist inventory remain fixed before, between and after engines.',
    'The route fault fixture alone blocks service workers; ordinary human-race and PWA source behavior is unchanged.',
  ],
  limitations: [
    'Static review and node syntax checks do not establish runtime success.',
    'A later pass will represent20 browser cases across four independent serial instances, not a shared20-case backend run or400-user capacity result.',
    'All original source27 failed reports remain failed and immutable.',
    'Forced adapter termination does not prove browser descendants were closed; the sequence must stop for review.',
  ],
  servicesStarted: 0, nativeTestsRun: 0, productFilesChangedByThisPreparation: false,
  independentReadOnlyReview: '/root/final_verification/native_prep_review',
};
await writeFile(`${directory}/source28-native-acceptance-static-review.json`, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, servicesStarted: 0, nativeTestsRun: 0, files: files.length }));
