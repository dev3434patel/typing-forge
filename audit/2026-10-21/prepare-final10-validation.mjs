import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Reference-only copies. Keep all prior declared runs and their failures.
const directory = 'audit/2026-10-21';
const names = [
  'run-final9-native.mjs',
  'run-final9-static.mjs',
  'run-mobile-workspaces-static-final9.mjs',
  'measure-mobile-workspaces-static-final9.mjs',
  'standalone-placement-real135-final9.mjs',
  'run-boss-duel-duration-final9.mjs',
  'boss-duel-final9-protocol.json',
];
const sha256 = source => createHash('sha256').update(source).digest('hex');
const records = [];
for (const name of names) {
  const from = `${directory}/${name}`;
  const to = `${directory}/${name.replaceAll('final9', 'final10')}`;
  const original = await readFile(from, 'utf8');
  const revised = original.replaceAll('final9', 'final10').replaceAll('FINAL9', 'FINAL10');
  assert.notEqual(revised, original);
  assert.equal(revised.replaceAll('final10', 'final9').replaceAll('FINAL10', 'FINAL9'), original);
  await writeFile(to, revised, { flag: 'wx' });
  if (to.endsWith('.json')) JSON.parse(revised);
  records.push({ from, to, originalSha256: sha256(original), revisedSha256: sha256(revised),
    reverseExact: true, changes: 'Checkpoint, build-env and output references only.' });
}
await writeFile(`${directory}/final10-validation-drivers-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', automaticRetries: 0,
  scope: 'No execution or acceptance claim. Identical input actions, assertions, budgets and cleanup contracts.', records,
}, null, 2), { flag: 'wx' });
