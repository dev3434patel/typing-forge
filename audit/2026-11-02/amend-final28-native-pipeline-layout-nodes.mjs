// Preparation amendment only. Preserve the first immutable plan; no runtime jobs.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const oldPath = `${directory}/final28-mobile-native-pipeline-preparation.json`;
const newPath = `${directory}/final28-mobile-native-pipeline-preparation-v2.json`;
const bytes = await readFile(oldPath), plan = JSON.parse(bytes);
const hash = value => createHash('sha256').update(value).digest('hex');
plan.preparedAt = new Date().toISOString();
plan.previousPreparation = { file: oldPath, sha256: hash(bytes), runtimeExecuted: false };
plan.preparationAmendment = 'Root requested bounded resolution of numeric Layout/style root/backend node references before context closure. First plan is retained; no production or acceptance source changed.';
for (const change of plan.wrapperTransforms) change.to = change.to.replace(oldPath, newPath);
const wrapper = await readFile(plan.wrapperFile, 'utf8');
let reversed = wrapper;
for (const item of [...plan.wrapperTransforms].reverse()) {
  assert.equal(reversed.split(item.to).length - 1, item.count); reversed = reversed.replaceAll(item.to, item.from);
}
assert.equal(reversed, await readFile(plan.originalWrapper, 'utf8'));
plan.wrapperSha256 = hash(wrapper);
for (const file of Object.keys(plan.helperHashes)) plan.helperHashes[file] = hash(await readFile(file));
plan.instrumentation.layoutNodeResolution = 'At most32 numeric Layout/style root/backend-node references, resolved by CDP after trace capture; retain tag/id/class/data-testid only, no DOM text or values.';
await writeFile(newPath, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', newPath, wrapperExactReversal: true, servicesStarted: 0, testsRun: 0 }));
