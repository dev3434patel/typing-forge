import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-21';
const names = ['run-final13-static.mjs', 'run-mobile-workspaces-static-final13.mjs', 'measure-mobile-workspaces-static-final13.mjs', 'standalone-placement-real135-final13.mjs'];
const hash = value => createHash('sha256').update(value).digest('hex');
const records = [];
for (const name of names) {
  const from = `${directory}/${name}`, to = `${directory}/${name.replaceAll('final13', 'final14')}`;
  const original = await readFile(from, 'utf8');
  const revised = original.replaceAll('final13', 'final14').replaceAll('FINAL13', 'FINAL14');
  assert.notEqual(revised, original);
  assert.equal(revised.replaceAll('final14', 'final13').replaceAll('FINAL14', 'FINAL13'), original);
  await writeFile(to, revised, { flag: 'wx' });
  records.push({ from, to, originalSha256: hash(original), revisedSha256: hash(revised), reverseExact: true });
}
await writeFile(`${directory}/final14-validation-drivers-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', records,
  scope: 'Checkpoint/build/output references only. No input actions, assertions or timing budgets changed. Source13 and older failures remain preserved. Placement12/13 were prepared but not executed; final14 will use real three45s ordinary deadlines.',
}, null, 2), { flag: 'wx' });
