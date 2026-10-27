import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const originalFile = 'audit/2026-10-21/run-final-browser-matrix.mjs';
const revisedFile = 'audit/2026-10-21/run-final14-browser-matrix.mjs';
const original = await readFile(originalFile, 'utf8');
const anchor = "  { id: 'isolated', files: baseline.isolated.files, workers: 1 },";
assert.equal(original.split(anchor).length, 2);
const addition = "\n  { id: 'first-input-timing', files: ['e2e/independent-challenge-timing.spec.ts'], workers: 2 },";
const revised = original.replace(anchor, anchor + addition);
assert.equal(revised.replace(addition, ''), original);
await writeFile(revisedFile, revised, { flag: 'wx' });
await writeFile('audit/2026-10-21/final14-browser-matrix-prepared.json', JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', originalFile, revisedFile,
  originalSha256: createHash('sha256').update(original).digest('hex'),
  revisedSha256: createHash('sha256').update(revised).digest('hex'),
  scope: 'Original61-file/three-batch partition plus the one new independent first-input-timing spec in an explicit fourth batch. Original action/time budgets, projects, worker counts, retries0, accounting and every-current-file-exactly-once assertion are unchanged. Static builds and conditional native credentials retain separate acceptance.',
}, null, 2), { flag: 'wx' });
