import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-21';
const names = ['run-final12-static.mjs', 'run-mobile-workspaces-static-final12.mjs', 'measure-mobile-workspaces-static-final12.mjs', 'standalone-placement-real135-final12.mjs'];
const hash = value => createHash('sha256').update(value).digest('hex');
const records = [];
for (const name of names) {
  const from = `${directory}/${name}`, to = `${directory}/${name.replaceAll('final12', 'final13')}`;
  const original = await readFile(from, 'utf8');
  const revised = original.replaceAll('final12', 'final13').replaceAll('FINAL12', 'FINAL13');
  assert.notEqual(revised, original);
  assert.equal(revised.replaceAll('final13', 'final12').replaceAll('FINAL13', 'FINAL12'), original);
  await writeFile(to, revised, { flag: 'wx' });
  records.push({ from, to, originalSha256: hash(original), revisedSha256: hash(revised), reverseExact: true });
}
await writeFile(`${directory}/final13-validation-drivers-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', records,
  scope: 'Checkpoint/build/output references only. No input actions, assertions or timing budgets changed. Earlier results remain preserved. Source12 placement was prepared but not executed; source13 will repeat actual135s because its TypingArea marker integration changes.',
}, null, 2), { flag: 'wx' });
