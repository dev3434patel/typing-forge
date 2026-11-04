// Preparation only: extend the preserved five-suite runner without executing it.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const originalFile = `${directory}/run-final25-native-modules.mjs`;
const outputFile = `${directory}/run-final25-native-ci.mjs`;
const original = await readFile(originalFile, 'utf8');
let text = original;
const substitutions = [];
const adapt = (before, after, expected) => {
  const count = text.split(before).length - 1;
  assert.equal(count, expected, `Exact adapter: ${before}`);
  text = text.replaceAll(before, after); substitutions.push({ before, after, count });
};
adapt('SPAROWTYPE_FINAL25_NATIVE_MODULES', 'SPAROWTYPE_FINAL25_NATIVE_CI', 1);
adapt('final25-native-modules', 'final25-native-ci', 2);
adapt("const suites = ['progression', 'social', 'classroom', 'arena-http', 'password'];", "const suites = ['data', 'race', 'course', 'progression', 'social', 'classroom', 'arena-http', 'password'];", 1);
adapt("'backend/tests/pack-progression-lifecycle.mjs'", "'backend/tests/data-lifecycle.mjs', 'backend/tests/data-fixture.php', 'backend/tests/race-lifecycle.mjs', 'backend/tests/race-fixtures.php', 'backend/tests/course-lifecycle.mjs', 'backend/tests/course-fixture.php', 'backend/tests/pack-social-fixture.php', 'backend/tests/classroom-fixture.php', 'backend/tests/arena-audit-admin.php', '.github/workflows/ci.yml', 'backend/tests/pack-progression-lifecycle.mjs'", 1);
adapt('results.length === 5', 'results.length === 8', 1);
adapt('Fresh source25 progression/social/classroom/Arena HTTP contracts after native browser16; no browser or capacity workload.', 'Fresh source25 native CI lifecycle acceptance: data, race, course, progression, social, classroom, Arena HTTP and password exactly once; no browser or capacity workload.', 1);
adapt('sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false, inputHashes,', "sourceBefore: before.receipt, suites, automaticRetries: 0, capacityLoad: false, inputHashes,\n  coverageExtension: { preservedFiveSuiteWrapper: 'audit/2026-10-27/run-final25-native-modules.mjs', addedCiLifecycleSuites: ['data', 'race', 'course'], requiredExactSuiteCount: 8, allOriginalFiveIncludedExactlyOnce: true, ciWorkflow: '.github/workflows/ci.yml', testAssertionsOrOwnerCleanupChanged: false },", 1);
let reversed = text;
for (const adapter of [...substitutions].reverse()) reversed = reversed.replaceAll(adapter.after, adapter.before);
assert.equal(reversed, original);
await writeFile(outputFile, text, { flag: 'wx' });
assert.equal(hash(await readFile(originalFile)), hash(original));
const report = { status: 'PREPARED-NOT-RUN', preparedAt: new Date().toISOString(), originalFile, originalSha256: hash(original), outputFile, sha256: hash(text), substitutions, reversibleByteIdentity: true, originalFiveSuiteRunnerUnchanged: true, allEightSuitesExactlyOnce: ['data', 'race', 'course', 'progression', 'social', 'classroom', 'arena-http', 'password'], expectedSourceFiles: 504, requiredBuildEnvironment: 'SPAROWTYPE_FINAL25_BUILD_ID', requiredOptIn: 'SPAROWTYPE_FINAL25_NATIVE_CI=1', servicesStarted: 0, testsRun: 0, browserStarted: false };
await writeFile(`${directory}/final25-native-ci-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, outputFile, suites: report.allEightSuitesExactlyOnce.length }));
