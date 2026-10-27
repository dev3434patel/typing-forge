import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const from = 'audit/2026-10-21/standalone-placement-real135-final10.mjs';
const to = 'audit/2026-10-21/standalone-placement-real135-final12.mjs';
const original = await readFile(from, 'utf8');
const revised = original.replaceAll('final10', 'final12').replaceAll('FINAL10', 'FINAL12');
assert.notEqual(revised, original);
assert.equal(revised.replaceAll('final12', 'final10').replaceAll('FINAL12', 'FINAL10'), original);
await writeFile(to, revised, { flag: 'wx' });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await writeFile('audit/2026-10-21/final12-placement-prepared.json', JSON.stringify({
  status: 'PREPARED-NOT-RUN', preparedAt: new Date().toISOString(), from, to,
  originalSha256: hash(original), revisedSha256: hash(revised), reverseExact: true,
  scope: 'The placement UI uses TypingArea, which changed in12. Repeat the unchanged real135-second protocol on the actual12 artifact. References only; no action, assertion, timer, retry or budget changes.',
}, null, 2), { flag: 'wx' });
