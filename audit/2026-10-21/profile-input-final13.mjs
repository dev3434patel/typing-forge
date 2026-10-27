import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const originalFile = 'audit/2026-10-21/profile-input-final7.mjs';
const original = await readFile(originalFile, 'utf8');
const reference = original.replaceAll('final7', 'final13');
assert.notEqual(reference, original);
assert.equal(reference.replaceAll('final13', 'final7'), original);
const oldDescription = 'The three original96/104/96ms timing runs and failed gate remain unchanged.';
const newDescription = 'The three source13 original168/160/184ms timing runs and failed gate remain unchanged.';
assert.equal(reference.split(oldDescription).length, 2);
const generated = reference.replace(oldDescription, newDescription);
assert.equal(generated.replace(newDescription, oldDescription), reference);
const file = 'audit/2026-10-21/.profile-input-final13.generated.mjs';
await writeFile(file, generated, { flag: 'wx' });
await writeFile('audit/2026-10-21/final13-input-profile-prepared.json', JSON.stringify({
  preparedAt: new Date().toISOString(), scope: 'One explicitly instrumented diagnostic; no acceptance replacement. Only checkpoint/output references and retained historical-failure prose differ from the original profiler adapter. Native input, clocks, assertions and profiler actions are unchanged.',
  originalFile, originalSha256: createHash('sha256').update(original).digest('hex'),
  generatedFile: file, generatedSha256: createHash('sha256').update(generated).digest('hex'),
  historicalAcceptance: 'audit/2026-10-21/final13-input-results.json',
}, null, 2), { flag: 'wx' });
await import('./.profile-input-final13.generated.mjs');
