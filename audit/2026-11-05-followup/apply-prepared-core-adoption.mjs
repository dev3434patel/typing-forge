import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const preparationFile = 'audit/2026-11-05-followup/core-adoption-prep/core-adoption-preparation.json';
const bytes = await readFile(preparationFile), plan = JSON.parse(bytes);
const profile = 'src/pages/Profile.tsx';
assert.equal(sha(await readFile(profile)), '596a7031ddf98ccb99691b2a46e9457bc7e11f301ea5bdbff5f7636714d88fb7');
for (const row of plan.brand) assert.equal(sha(await readFile(row.file)), row.sha256);
for (const item of plan.files) {
  assert.equal(sha(await readFile(item.candidate)), item.expectedAfter);
  if (item.expectedBefore) {
    assert.equal(sha(await readFile(item.destination)), item.expectedBefore);
    assert.equal(sha(await readFile(item.archive)), item.expectedBefore);
  } else await assert.rejects(access(item.destination), { code: 'ENOENT' });
}
for (const item of plan.files) await writeFile(item.destination, await readFile(item.candidate));
for (const item of plan.files) assert.equal(sha(await readFile(item.destination)), item.expectedAfter);
assert.equal(sha(await readFile(profile)), '596a7031ddf98ccb99691b2a46e9457bc7e11f301ea5bdbff5f7636714d88fb7');
for (const row of plan.brand) assert.equal(sha(await readFile(row.file)), row.sha256);
assert.ok((await readFile('src/lib/typing-core/transcript.ts', 'utf8')).includes('if (targetCache.size >= 16)'));
const paths = ['src', 'public', 'build', 'scripts', 'backend/src', 'backend/resources', 'backend/migrations', 'backend/bin', 'backend/public', 'backend/bootstrap.php', 'backend/router.php', 'backend/schema.sql', 'package.json', 'package-lock.json', 'vite.config.ts', 'vercel.json'];
const inventory = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', ...paths], { encoding: 'utf8', windowsHide: true }).trim().split(/\r?\n/).filter(Boolean))].sort();
const receipt = { status: 'APPLIED-FROZEN-NO-RUNTIME-TESTS', recordedAt: new Date().toISOString(), rootGoReceivedAfterBackendPairedHttpClosure: true, preparation: { file: preparationFile, sha256: sha(bytes) }, exactFiles: plan.files, protectedProfileSha256: sha(await readFile(profile)), all21BrandHashesUnchanged: true, sourceInventoryPaths: paths, actualSourceInventoryCount: inventory.length, sourceInventorySha256: sha(JSON.stringify(inventory)), targetMapStrongEntries: 16, perFactoryTargetMetadataLimits: { graphemeUnits: 8192, words: 1024 }, weakMetadataQualification: 'Caller-held factory targets may retain their weak metadata beyond strong-map eviction; no global16-target memory bound is claimed.', runtimeTestsExecuted: false, buildExecuted: false, noFurtherSourceEditsPlanned: true };
await writeFile('audit/2026-11-05-followup/core-adoption-frozen.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, actualSourceInventoryCount: inventory.length, sourceInventorySha256: receipt.sourceInventorySha256, profileSha256: receipt.protectedProfileSha256, files: plan.files.map(row => ({ file: row.destination, sha256: row.expectedAfter })) }));
