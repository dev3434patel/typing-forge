import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const originalFile = 'audit/2026-10-21/run-final8-native.mjs';
const target = 'audit/2026-10-21/run-final9-native.mjs';
const original = await readFile(originalFile, 'utf8');
let next = original.replaceAll('final8', 'final9').replaceAll('FINAL8', 'FINAL9').replaceAll('source8', 'source9');
const before = "assert.equal(initial.frozen.local.version, '349a107f388a8cc499fe');";
const after = "assert.match(process.env.SPAROWTYPE_FINAL9_BUILD_ID ?? '', /^[a-f0-9]{20}$/);\nassert.equal(initial.frozen.local.version, process.env.SPAROWTYPE_FINAL9_BUILD_ID);";
assert.equal(next.split(before).length - 1, 1);
next = next.replace(before, after);
await writeFile(target, next, { flag: 'wx' });
const hash = text => createHash('sha256').update(text).digest('hex');
await writeFile('audit/2026-10-21/final9-native-prepared.json', JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'NOT-RUN', originalFile, originalSha256: hash(original),
  target, targetSha256: hash(next), changes: ['Exclusive source/output/window prefixes9', 'Explicit fail-closed final9 build-ID environment binding'],
  nativeSuitesOrAssertionsChanged: false, automaticRetries: 0, priorNativeFailureRetained: 'audit/2026-10-21/final8-native.json',
}, null, 2), { flag: 'wx' });
console.log('Prepared independent final9 native run; no services or HTTP started.');
