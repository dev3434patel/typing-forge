import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-21';
const names = ['run-final11-static.mjs', 'run-mobile-workspaces-static-final11.mjs', 'measure-mobile-workspaces-static-final11.mjs'];
const hash = source => createHash('sha256').update(source).digest('hex');
const records = [];
for (const name of names) {
  const from = `${directory}/${name}`, to = `${directory}/${name.replaceAll('final11', 'final12')}`;
  const original = await readFile(from, 'utf8');
  const revised = original.replaceAll('final11', 'final12').replaceAll('FINAL11', 'FINAL12');
  assert.notEqual(revised, original);
  assert.equal(revised.replaceAll('final12', 'final11').replaceAll('FINAL12', 'FINAL11'), original);
  await writeFile(to, revised, { flag: 'wx' });
  records.push({ from, to, originalSha256: hash(original), revisedSha256: hash(revised), reverseExact: true });
}
await writeFile(`${directory}/final12-validation-drivers-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', records,
  scope: 'Checkpoint/build/output references only. No input actions, assertions, timing budgets or source edited. Earlier results are preserved.',
}, null, 2), { flag: 'wx' });
