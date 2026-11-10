import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const base = 'audit/2026-11-05-followup';
const expected = {
  [`${base}/lazy-services/candidate/backend/public/index.php`]: 'f02f477750838614113cf0900143a79218dfc8299b1cb963aab570b7f6683c84',
  [`${base}/lazy-services/candidate/backend/src/ArenaService.php`]: '07ba6e0f26c7a17f15746d457b3fc95f5f2f663acd3b283bb5e1fb8b61c36635',
  [`${base}/lazy-services/candidate/backend/src/ArenaEvidence.php`]: '3932346a67e8f81694d3b12c521ddb8ee906bd0e77069c64127f170e707ee6c1',
};
for (const [file, hash] of Object.entries(expected)) assert.equal(sha(await readFile(file)), hash);
const pureFile = `${base}/lazy-arena-autoload-result.json`, pureBytes = await readFile(pureFile), pure = JSON.parse(pureBytes);
assert.equal(pure.status, 'PASS-SCOPED-PURE'); assert.equal(pure.passed, 24); assert.equal(pure.failed, 0); assert.equal(pure.inputsStable, true);
const receipt = { status: 'APPROVED-STATIC-EXACT-CANDIDATE-HTTP-ACCEPTANCE-PENDING', recordedAt: new Date().toISOString(), candidateHashes: expected, preparation: { file: `${base}/lazy-arena-services-candidate-preparation.json`, sha256: sha(await readFile(`${base}/lazy-arena-services-candidate-preparation.json`)) }, actualAutoloadContractReadNotReexecuted: { file: pureFile, sha256: sha(pureBytes), passed: 24, failed: 0 }, findings: ['No hidden validator/data consumers on non-submit Arena paths.', 'Non-Arena paths still receive both required instances, including existing receipt consumers.', 'Constructor property promotion has no SQL/session/receipt side effects in the reviewed source.', 'Strict boolean finish classification and malformed candidate/finish validation precede missing-dependency guards.', 'Same validator instance handles prepare and locked replay; explicit LogicException guards prevent missing replay or persistence before writes.', 'Existing code/receipt/member/clock/transaction/persistence sequence remains unchanged apart from unused dependency loading.'], qualifiedDifference: 'Class-load/parse failures in an incomplete deployment may occur later or be omitted on routes not using that class. Complete frozen artifact integrity and syntax gates remain required.', remainingAcceptance: ['Actual index route/error control flow', 'Native account/Arena finish/retry behavior', 'Fresh uncached full/wire capacity and graceful cleanup under a new frozen checkpoint'], productionOrTestsEdited: false, phpOrBrowserOrServicesStartedByReview: 0 };
await writeFile(`${base}/arena-lazy-candidate-independent-review.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, candidateFiles: 3, pureContractsRead: 24, runtimeStarted: 0 }));
