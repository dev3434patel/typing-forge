import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

// A separate diagnostic after the retained three final9 acceptance runs. The
// profiler adapter, input actions and budgets are identical to the earlier one.
const original = await readFile('audit/2026-10-21/profile-input-final7.mjs', 'utf8');
const generated = original.replaceAll('final7', 'final9');
assert.notEqual(generated, original);
assert.equal(generated.replaceAll('final9', 'final7'), original);
const file = 'audit/2026-10-21/.profile-input-final9.generated.mjs';
await writeFile(file, generated, { flag: 'wx' });
await import('./.profile-input-final9.generated.mjs');
