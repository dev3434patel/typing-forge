import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Text-only preparation. This script never spawns Playwright or changes product/tests.
const directory = 'audit/2026-10-21';
const genericPath = `${directory}/run-browser-checkpoint.mjs`;
const helperPath = `${directory}/run-browser-checkpoint-final17.mjs`;
const matrixPath = `${directory}/run-final17-browser-matrix.mjs`;
const receiptPath = `${directory}/final17-traceoff-checkpoint-prepared.json`;
for (const file of [helperPath, receiptPath]) await assert.rejects(access(file), { code: 'ENOENT' });
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalize = value => value.replace(/\r\n/g, '\n');
const genericBytes = await readFile(genericPath);
const generic = normalize(genericBytes.toString('utf8'));
const matrixBytes = await readFile(matrixPath);
const matrix = normalize(matrixBytes.toString('utf8'));
const originalConfig = await readFile('playwright.config.ts', 'utf8');
assert.match(originalConfig, /trace:\s*["']retain-on-failure["']/);
assert.match(originalConfig, /screenshot:\s*["']only-on-failure["']/);
const changes = [
  { before: "'--retries=0', '--reporter=list,json'", after: "'--retries=0', '--trace=off', '--reporter=list,json'" },
  { before: 'const protocol = { declaredAt:', after: "assert.match(await readFile('playwright.config.ts', 'utf8'), /trace:\\s*[\"']retain-on-failure[\"']/);\nassert.match(await readFile('playwright.config.ts', 'utf8'), /screenshot:\\s*[\"']only-on-failure[\"']/);\nconst protocol = { declaredAt:" },
  { before: 'browsers, workers, automaticRetries: 0, scope:', after: "browsers, workers, automaticRetries: 0, tracing: 'off', configuredTracing: 'retain-on-failure', instrumentationChanged: true, failureScreenshots: 'only-on-failure', instrumentationScope: 'Separate declared functional validation configuration. Original failures and traces remain retained; this change does not establish that tracing caused them.', scope:" },
];
const replaceOnce = (source, before, after) => {
  assert.equal(source.split(before).length - 1, 1, `Expected one exact preparation match: ${before}`);
  return source.replace(before, after);
};
let helper = generic;
for (const change of changes) helper = replaceOnce(helper, change.before, change.after);
let reversed = helper;
for (const change of [...changes].reverse()) reversed = replaceOnce(reversed, change.after, change.before);
assert.equal(reversed, generic, 'Only the declared tracing and protocol changes may differ from the generic helper.');
const matrixChange = {
  before: '`${directory}/run-browser-checkpoint.mjs`',
  after: '`${directory}/run-browser-checkpoint-final17.mjs`',
};
const amendedMatrix = replaceOnce(matrix, matrixChange.before, matrixChange.after);
assert.equal(replaceOnce(amendedMatrix, matrixChange.after, matrixChange.before), matrix);
assert.match(amendedMatrix, /SPAROWTYPE_FINAL17_BUILD_ID/);
assert.match(amendedMatrix, /chromium,edge,firefox,webkit/);
assert.match(amendedMatrix, /Every current spec must be covered exactly once/);
await writeFile(helperPath, helper, { flag: 'wx' });
await writeFile(matrixPath, amendedMatrix);
assert.equal(sha256(await readFile(genericPath)), sha256(genericBytes), 'Generic checkpoint changed during preparation.');
const receipt = {
  schemaVersion: 1,
  preparedAt: new Date().toISOString(),
  status: 'NOT-RUN',
  scope: 'Audit-only text preparation; no product, E2E, config or generic/16 runner changes. No Playwright execution.',
  generic: { path: genericPath, rawSha256: sha256(genericBytes), normalizedSha256: sha256(generic), unchanged: true },
  helper: { path: helperPath, normalizedSha256: sha256(helper), exactChanges: changes, reverseNormalizedSha256: sha256(reversed), reverseRestoresGenericExactly: true },
  matrix: { path: matrixPath, beforeRawSha256: sha256(matrixBytes), beforeNormalizedSha256: sha256(matrix), afterNormalizedSha256: sha256(amendedMatrix), exactChange: matrixChange, reverseRestoresPrepared17MatrixExactly: true },
  declaredInstrumentation: { tracing: 'off', originalConfiguration: 'retain-on-failure', instrumentationChanged: true, failureScreenshots: 'only-on-failure', automaticRetries: 0 },
  unchanged: ['assertions', 'test deadlines', 'expectation deadlines', 'batch worker counts', 'four-engine requirement', 'source/dependency hash checks', 'build identity guards', 'exact spec partition', 'automatic retry count'],
  qualification: 'A future pass applies to this separately declared instrumentation configuration. It cannot relabel source16 failures or prove trace overhead caused any original failure.',
  actualBuildIdentity: null,
  execution: 'NOT-RUN — actual frozen final17 build ID is required by the matrix wrapper.',
};
await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, helper: helperPath, matrix: matrixPath, reverseChecks: true, productOrTestChanges: false }));
