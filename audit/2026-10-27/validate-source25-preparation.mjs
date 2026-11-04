// Syntax and reversible adapters only; never imports acceptance entry points.
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const directory = 'audit/2026-10-27';
const file = `${directory}/source25-wrapper-preparation.json`;
const preparation = JSON.parse(await readFile(file, 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(preparation.prepared.length, 13);
const syntax = [], adapters = [], runtime = phpRuntime();
for (const item of preparation.prepared) {
  const original = await readFile(item.originalFile, 'utf8'), current = await readFile(item.file, 'utf8');
  assert.equal(hash(original), item.originalSha256);
  assert.equal(hash(current), item.sha256);
  let reversed = current;
  for (const adapter of [...item.substitutions].reverse()) reversed = reversed.replaceAll(adapter.after, adapter.before);
  assert.equal(reversed, original);
  const php = item.file.endsWith('.php');
  const result = spawnSync(php ? runtime.binary : process.execPath, php ? [...runtime.args, '-l', item.file] : ['--check', item.file], { windowsHide: true, encoding: 'utf8', timeout: 10000, maxBuffer: 100000 });
  assert.equal(result.status, 0, `Syntax check: ${item.file}`);
  syntax.push({ file: item.file, language: php ? 'PHP' : 'JavaScript', pass: true });
  adapters.push({ file: item.file, originalFile: item.originalFile, originalUnchanged: true, reversibleByteIdentity: true });
}
for (const helper of ['prepare-source25-acceptance.mjs', 'verify-source25-ui-evidence-reuse.mjs', 'validate-source25-preparation.mjs']) {
  const result = spawnSync(process.execPath, ['--check', `${directory}/${helper}`], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, helper);
}
const actualSpecs = (await readdir('e2e')).filter(name => name.endsWith('.spec.ts')).sort();
assert.equal(actualSpecs.length, 64);
const serializer = await readFile(`${directory}/run-source25-serializer-profile.mjs`, 'utf8');
assert.ok(serializer.includes('source22-serializer-diagnostic'));
assert.ok(!serializer.includes('source25-serializer-diagnostic'));
const preservedHistoricalImports = [];
for (const item of preparation.prepared) {
  const original = await readFile(item.originalFile, 'utf8'), current = await readFile(item.file, 'utf8');
  const imports = original.match(/(?:\.\.\/)?2026-10-21\/[^'"`\s,)]+/g) ?? [];
  for (const location of imports) assert.equal(current.split(location).length, original.split(location).length);
  preservedHistoricalImports.push({ file: item.file, unchangedHistoricalImportOccurrences: imports.length });
}
const result = { status: 'PASS-PREPARATION-ONLY', validatedAt: new Date().toISOString(), preparationFile: file, preparationSha256: hash(await readFile(file)), expectedSourceInventory: 504, actualSource25FreezeChecked: false, actualE2eSpecFiles: actualSpecs.length, syntax, adapters, preservedHistoricalImports, serializerFixtureIdentityPreserved: 'source22-serializer-diagnostic', browserOrPerformanceJobsRun: 0, servicesStarted: 0, productionOrE2eEditsMade: false, runtimeAcceptance: 'NOT-RUN' };
const output = `${directory}/source25-wrapper-preparation-validation.json`;
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, output, wrappers: adapters.length, syntaxChecks: syntax.length, specs: actualSpecs.length }));
