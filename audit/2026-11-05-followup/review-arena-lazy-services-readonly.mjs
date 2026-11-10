// Static review only. No application bootstrap, PHP execution, database or services.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['backend/public/index.php', 'backend/src/SessionValidator.php', 'backend/src/DataService.php', 'backend/src/ArenaService.php', 'backend/src/ArenaEvidence.php'];
const inputs = Object.fromEntries(await Promise.all(files.map(async file => [file, { sha256: sha(await readFile(file)), text: await readFile(file, 'utf8') }])));
assert.equal(inputs['backend/src/SessionValidator.php'].text.includes('function __construct'), false);
for (const file of ['backend/src/DataService.php', 'backend/src/ArenaService.php', 'backend/src/ArenaEvidence.php']) assert.ok(/function __construct\([^\n]+\)\s*\{\}/.test(inputs[file].text));
const arena = inputs['backend/src/ArenaService.php'].text;
assert.equal((arena.match(/\$this->validator/g) ?? []).length, 1);
assert.equal((arena.match(/\$this->data/g) ?? []).length, 1);
const evidence = inputs['backend/src/ArenaEvidence.php'].text;
assert.equal((evidence.match(/\$this->data/g) ?? []).length, 1);
assert.ok(evidence.includes("if($finish&&$flag===null)$this->data->commitValidated"));
const receipt = {
  status: 'READONLY-PLAN-REVIEW-CONDITIONALLY-SOUND-CANDIDATE-NOT-YET-REVIEWED', recordedAt: new Date().toISOString(),
  inputs: Object.fromEntries(Object.entries(inputs).map(([file, value]) => [file, value.sha256])),
  constructorFindings: ['SessionValidator has no constructor; its class load declares methods/constants and empty per-instance cache defaults.', 'DataService, ArenaService and ArenaEvidence constructors only promote typed properties; no SQL, receipt capture, session or lock operation occurs in these current constructors.'],
  consumerFindings: ['ArenaService uses validator/data only when constructing ArenaEvidence in the submit branch.', 'ArenaEvidence always needs a validator for candidate and authoritative replay; DataService is consumed only by an unquarantined finish commit.', 'All other non-Arena consumers in index.php must retain the current validator/data path, including public student routes and request-receipt capture for sessions/social duel-submit.'],
  requiredPreservedOrder: ['Session/extensions/database/auth setup', 'API rate/auth classification', 'CSRF then content-type/body-size/JSON decoding', 'Owner check', 'Arena code validation', 'One server receipt before candidate validation and locks', 'Candidate validation/preflight', 'Account/room/member locks and authoritative replay', 'Member update and eligible finish persistence in the same transaction'],
  requiredGuards: ['Explicit nullable typed constructor parameters/properties where omitted; no passing null to current nonnullable signatures.', 'Fail closed before a validator or persistence dependency is consumed; never use nullsafe calls to silently omit replay or commit.', 'Strict finish===true allocation decision; malformed nonboolean finish retains the existing arena-candidate422 path.', 'One validator instance reused for prepare and locked replay, preserving request-local cache lifetime.', 'Do not move server receipt capture into constructors or factories or alter locked-error precedence.', 'Retain non-Arena service allocation behavior and preserve all DataService captureRequestReceipt consumers.'],
  risks: ['Skipping an unused class load changes file-load/parse failure precedence for a broken deployment; normal candidate evaluation must assume the independently checked complete release artifact.', 'Nullable signatures alone are not proof that PHP avoids autoloading on the fast branch. A controlled class-loader count/class_exists(name,false) contract should establish this without loading private configuration.', 'A client finish flag can choose which dependency is allocated, but it cannot grant a finish or bypass boolean/canonical/clock/member validation.'],
  primaryReferences: [{ title: 'PHP type declarations and nullable types', url: 'https://www.php.net/manual/en/language.types.declarations.php' }, { title: 'PHP autoloading classes', url: 'https://www.php.net/manual/en/language.oop5.autoload.php' }],
  phpAutoloadTimingRuntimeClaimed: false,
  candidatePatchOrFinalApprovalClaimed: false, productOrTestOrHelperEdits: false,
  testsOrPhpOrServicesOrBrowsersStarted: 0,
};
await writeFile('audit/2026-11-05-followup/arena-lazy-services-independent-review.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, reviewedFiles: files.length, runtimeStarted: 0 }));
