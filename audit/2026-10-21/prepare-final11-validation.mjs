import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// The source11 fix changes only worker availability. These copies retain every
// static/mobile assertion and keep source10 results, including failures intact.
const directory = 'audit/2026-10-21';
const names = [
  'run-final10-static.mjs',
  'run-mobile-workspaces-static-final10.mjs',
  'measure-mobile-workspaces-static-final10.mjs',
];
const hash = source => createHash('sha256').update(source).digest('hex');
const records = [];
for (const name of names) {
  const from = `${directory}/${name}`;
  const to = `${directory}/${name.replaceAll('final10', 'final11')}`;
  const original = await readFile(from, 'utf8');
  const revised = original.replaceAll('final10', 'final11').replaceAll('FINAL10', 'FINAL11');
  assert.notEqual(revised, original);
  assert.equal(revised.replaceAll('final11', 'final10').replaceAll('FINAL11', 'FINAL10'), original);
  await writeFile(to, revised, { flag: 'wx' });
  records.push({ from, to, originalSha256: hash(original), revisedSha256: hash(revised), reverseExact: true });
}
await writeFile(`${directory}/final11-validation-drivers-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', records,
  scope: 'Reference-only copies; no actions, budgets, assertions, sources or acceptance results changed.',
}, null, 2), { flag: 'wx' });
