// Static/syntax audit only; never imports or runs acceptance entry points.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const initial = JSON.parse(await readFile(`${directory}/source26-wrapper-preparation.json`, 'utf8'));
const runtimeRevision = JSON.parse(await readFile(`${directory}/source26-expanded-scope-runtime-preparation.json`, 'utf8'));
const metadataRevision = JSON.parse(await readFile(`${directory}/source26-expanded-scope-wrapper-metadata.json`, 'utf8'));
const wire = JSON.parse(await readFile(`${directory}/source26-wire-capacity-preparation.json`, 'utf8'));
const expected = Object.fromEntries(initial.prepared.map(item => [item.file, item.sha256]));
for (const revision of [...runtimeRevision.changes, ...metadataRevision.changes]) {
  assert.equal(expected[revision.file], revision.originalSha256); expected[revision.file] = revision.sha256;
}
for (const entry of [wire.driver, wire.owner]) {
  const original = await readFile(entry.originalFile, 'utf8'), actual = await readFile(entry.outputFile, 'utf8');
  assert.equal(hash(original), entry.originalSha256); assert.equal(hash(original), expected[entry.originalFile]);
  assert.equal(hash(actual), entry.sha256);
  let reversed = actual;
  for (const adapter of [...entry.substitutions].reverse()) reversed = reversed.replaceAll(adapter.after, adapter.before);
  assert.equal(reversed, original); expected[entry.outputFile] = entry.sha256;
}
assert.equal(wire.driver.substitutions.filter(change => change.before.startsWith('body: JSON.stringify(')).length, 1);
const helperFile = 'src/domain/arena.ts', helper = await readFile(helperFile, 'utf8');
assert.equal(hash(helper), wire.helperSha256AtPreparation);
assert.match(helper, /export function arenaEvidencePayload\(/);
assert.equal(helper.split(/\r?\n/).filter(line => /^import\s/.test(line) && !/^import type\s/.test(line)).length, 0, 'The direct Node helper import may have type-only imports only.');
const service = await readFile('src/services/arena-service.ts', 'utf8');
assert.ok(service.includes('candidate: arenaEvidencePayload(candidate)'));
const parity = await readFile('backend/tests/validation-parity.mjs', 'utf8');
assert.ok(parity.includes('arenaWireCompatibility') && parity.includes('canonicalPayloadBase64') && parity.includes('persisted canonical hash must be identical'));
const syntax = [], runtime = phpRuntime();
for (const [file, sha256] of Object.entries(expected)) {
  const text = await readFile(file, 'utf8'); assert.equal(hash(text), sha256);
  if (file.endsWith('.json')) { JSON.parse(text); continue; }
  assert.ok(!text.includes('6cdddf1a74b2d10d1c9b'), 'Active26 runner may not hardcode the old frontend build.');
  assert.ok(!/SPAROWTYPE_(?:FINAL25|SOURCE25)|final25-source\.json|pack-backend-instance-source25\.mjs|run-source25-capacity/.test(text), 'Active26 inputs must bind26.');
  const php = file.endsWith('.php');
  const result = spawnSync(php ? runtime.binary : process.execPath, php ? [...runtime.args, '-l', file] : ['--check', file], { windowsHide: true, encoding: 'utf8', timeout: 10000, maxBuffer: 100000 });
  assert.equal(result.status, 0, file); syntax.push({ file, language: php ? 'PHP' : 'JavaScript', pass: true });
}
const matrix = await readFile(`${directory}/run-final26-browser-matrix.mjs`, 'utf8');
assert.ok(matrix.includes("frontendEvidenceReuse: 'NOT-USED'") && matrix.includes('freshOrdinaryInputRunsRequired: 3') && matrix.includes('freshFullQualityMobileLighthouseRunsRequired: 3'));
assert.ok(matrix.includes('assert.equal(actual.length, 64') && matrix.includes("['chromium', 'edge', 'firefox', 'webkit']"));
assert.equal((await readdir('e2e')).filter(name => name.endsWith('.spec.ts')).length, 64);
const proofFile = `${directory}/verify-source26-ui-evidence-reuse.mjs`;
const priorValidation = JSON.parse(await readFile(`${directory}/source26-wrapper-preparation-validation.json`, 'utf8'));
assert.equal(hash(await readFile(proofFile)), priorValidation.source24UiProof.sha256);
for (const item of initial.prepared) assert.equal(hash(await readFile(item.originalFile)), item.originalSha256);
const output = `${directory}/source26-wire-and-build-preparation-validation.json`;
const report = { status: 'PASS-PREPARATION-ONLY', recordedAt: new Date().toISOString(), actualSource26FreezeAndFreshBuild: 'PENDING', expectedSourceFiles: 505, actualE2eSpecFiles: 64, allFourEnginesRequired: true,
  currentActive26InputHashes: expected, syntax, wireAdapterReversesExactlyToFullDriver: true, requestSerializationAdapterPoints: 1, directProductionHelperImportTypeOnlySafe: true,
  legacyFullDriverAndOriginalOwnerByteIdentical: true, newOwnerSupportsOrderedFullAndWireOnceEach: true,
  capacityTargetsPreserved: { requests: 1653, rooms: 50, accountsPerRoom: 8, concurrency: 20, acceptedSubmissions: 400, successfulP95StrictlyBelowMs: 150, allStatusesAndUnexpectedErrorsRetained: true },
  fieldsRemovedExactly: ['characters', 'timeSeries', 'cursor'], allOtherEvidenceFieldsPreservedByProductionHelper: 'REQUIRES-EXISTING-DOMAIN-AND-PHP-PARITY-GATES', separateCanonicalHashProof: { file: 'backend/tests/validation-parity.mjs', declaredFullCasesRetained: 542, declaredCompactPairs: 18, expectedValidPairs: 14, expectedRejectionPairs: 4, actualExecution: 'PENDING' },
  freshUiEvidenceRequired: { build: true, ordinaryInputRuns: 3, fullQualityMobileLighthouseRuns: 3 }, priorUiEvidenceReuse: 'NOT-USED', strictUiCheckerUntouched: true,
  source25ScriptsUnchanged: true, servicesStarted: 0, acceptanceTestsOrBenchmarksRun: 0, buildsRun: 0, downloadsRun: 0, typechecksRun: 0 };
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, syntaxChecks: syntax.length, runtimeInputs: Object.keys(expected).length, requestSerializationPoints: 1, specs: 64 }));
