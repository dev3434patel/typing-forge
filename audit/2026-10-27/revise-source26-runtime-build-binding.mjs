// Audit-only correction for expanded source26 frontend scope. No runtime runs.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27', preparation = JSON.parse(await readFile(`${directory}/source26-wrapper-preparation.json`, 'utf8'));
const changes = [
  { file: `${directory}/setup-final26-portable-deno.mjs`, before: "assert.equal(initial.frozen.local.version, '6cdddf1a74b2d10d1c9b');", after: "assert.match(initial.frozen.local.version, /^[a-f0-9]{20}$/);" },
  { file: `${directory}/final26-portable-deno-plan.json`, before: 'Verify actual frozen source26 inventory505/build6cdddf1a74b2d10d1c9b and verify the ignored destination boundary.', after: 'Verify actual frozen source26 inventory505 and the fresh build explicitly bound by SPAROWTYPE_FINAL26_BUILD_ID; verify the ignored destination boundary.' },
];
const actual = [];
for (const change of changes) {
  const original = await readFile(change.file, 'utf8'), prior = preparation.prepared.find(item => item.file === change.file);
  assert.equal(hash(original), prior.sha256); assert.equal(original.split(change.before).length - 1, 1);
  const revised = original.replace(change.before, change.after); assert.equal(revised.replace(change.after, change.before), original);
  await writeFile(change.file, revised);
  actual.push({ ...change, originalSha256: hash(original), sha256: hash(revised), reversibleByteIdentity: true });
}
const source25Plan = JSON.parse(await readFile(`${directory}/final25-portable-deno-plan.json`, 'utf8'));
const source26Plan = JSON.parse(await readFile(`${directory}/final26-portable-deno-plan.json`, 'utf8'));
for (const key of ['release', 'archive', 'checksumSidecar']) assert.deepEqual(source26Plan[key], source25Plan[key]);
const setup = await readFile(`${directory}/setup-final26-portable-deno.mjs`, 'utf8');
assert.ok(setup.includes('assert.equal(process.env.SPAROWTYPE_FINAL26_BUILD_ID, initial.frozen.local.version);'));
assert.ok(setup.includes('assert.equal(initial.receipt.compared, 505)'));
const proofFile = `${directory}/verify-source26-ui-evidence-reuse.mjs`;
const report = { status: 'PREPARED-AUDIT-ONLY-BUILD-BINDING-CORRECTED-NOT-RUN', recordedAt: new Date().toISOString(), reason: 'Source26 scope now includes the production Arena wire helper and service, so the earlier unchanged-frontend proposal is superseded. Fresh build, three ordinary input runs and three full-quality mobile Lighthouse runs are required.',
  changes: actual, frozenSourceCountGuardPreserved: 505, actualFreshBuildEnvironmentMatchRequired: true, officialDenoReleaseAndBothHashesUnchanged: '2.9.8',
  originalPrepared26ReceiptsPreservedAsHistoricalProposal: true, strictUiReuseChecker: { file: proofFile, sha256: hash(await readFile(proofFile)), status: 'NOT-USED', assertionsRelaxed: false },
  acceptanceTestsRun: 0, buildsRun: 0, downloadsRun: 0, typechecksRun: 0, servicesStarted: 0 };
await writeFile(`${directory}/source26-expanded-scope-runtime-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, correctedAuditFiles: actual.length, officialDenoVersion: '2.9.8', source26UiReuse: 'NOT-USED' }));
