import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const originalSuite = 'audit/mega-pack-2026-10-21/run-arena-http.mjs';
const targetSuite = 'audit/2026-11-02/run-source33-arena-chart-http.mjs';
const originalOwner = 'audit/2026-11-02/pack-capacity-instance-source33.mjs';
const targetOwner = 'audit/2026-11-02/pack-arena-chart-instance-source33.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const original = await readFile(originalSuite, 'utf8'), eol = original.includes('\r\n') ? '\r\n' : '\n';
const helper = `function sameProjection(left, right) {
  if (typeof left === 'number' && typeof right === 'number') return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= Math.max(1e-9, Math.abs(left) * 1e-12);
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const keys = Object.keys(left).sort();
    return Array.isArray(left) === Array.isArray(right) && JSON.stringify(keys) === JSON.stringify(Object.keys(right).sort()) && keys.every(key => sameProjection(left[key], right[key]));
  }
  return left === right;
}
async function persistedFinal(account, sessionId) {
  const response = await fetch(new URL('sessions?expectedOwner=' + encodeURIComponent(account.id), origin), { headers: { Cookie: account.cookie }, signal: AbortSignal.timeout(15000) });
  const value = await response.json();
  requests.push({ action: 'read-owned-finished-chart', status: response.status, error: value.error?.code ?? null });
  return { status: response.status, rows: Array.isArray(value.sessions) ? value.sessions.filter(row => row.clientSessionId === sessionId) : [] };
}
`.replaceAll('\n', eol);
const before = `  const persistedBeforeRetry = await persistedFinal(a, id);
  const storedFinal = persistedBeforeRetry.rows[0];
  check('new Arena finish persists the complete independently expected chart', persistedBeforeRetry.status === 200 && persistedBeforeRetry.rows.length === 1 && Array.isArray(storedFinal?.accepted?.timeSeries) && storedFinal.accepted.timeSeries.length === 15 && sameProjection(storedFinal.accepted.timeSeries, final.timeSeries));
  check('finished history retains every canonical chart point', Array.isArray(storedFinal?.summary?.wpmHistory) && sameProjection(storedFinal.summary.wpmHistory, final.timeSeries.map(point => point.wpm ?? 0)));
`.replaceAll('\n', eol);
const after = `  const persistedAfterRetry = await persistedFinal(a, id);
  check('final retry preserves one persisted result, payload hash and full chart', persistedAfterRetry.status === 200 && persistedAfterRetry.rows.length === 1 && persistedAfterRetry.rows[0].payloadHash === storedFinal.payloadHash && JSON.stringify(persistedAfterRetry.rows[0].accepted.timeSeries) === JSON.stringify(storedFinal.accepted.timeSeries));
`.replaceAll('\n', eol);
let suite = original;
const functionAnchor = 'function evidence(';
assert.equal(suite.split(functionAnchor).length - 1, 1);
suite = suite.replace(functionAnchor, helper + functionAnchor);
const retryLine = suite.split(eol).find(line => line.startsWith("  check('immutable final retry is idempotent',"));
assert.ok(retryLine);
assert.equal(suite.split(retryLine).length - 1, 1);
suite = suite.replace(retryLine, before + retryLine + eol + after.trimEnd());
assert.equal(suite.replace(helper, '').replace(before, '').replace(eol + after.trimEnd(), ''), original, 'All original29 assertions and actions remain byte-identical.');
await writeFile(targetSuite, suite, { flag: 'wx' });
const owner = await readFile(originalOwner, 'utf8');
const from = "'arena-http':'audit/mega-pack-2026-10-21/run-arena-http.mjs'", to = "'arena-http':'audit/2026-11-02/run-source33-arena-chart-http.mjs'";
assert.equal(owner.split(from).length - 1, 1);
const ownerCopy = owner.replace(from, to);
assert.equal(ownerCopy.replace(to, from), owner);
await writeFile(targetOwner, ownerCopy, { flag: 'wx' });
for (const file of [targetSuite, targetOwner]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}
const report = { recordedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN', originalSuite, targetSuite, originalOwner, targetOwner, suiteSha256: digest(suite), ownerSha256: digest(ownerCopy), originalSuiteSha256: digest(original), originalOwnerSha256: digest(owner), helper, before, after, retryLine, original29AssertionsAndActionsRetained: true, additionalChartPersistenceAssertions: 3, baselineNumericToleranceUnchanged: 'max(1e-9,abs(expected)*1e-12)', nativeClockAndTimeoutsUnchanged: true, source33SourceOrFrozenTestsChanged: false, servicesStarted: 0, runtimeExecuted: false };
await writeFile('audit/2026-11-04/source33-arena-chart-http-preparation.json', `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, targetSuite, targetOwner, originalAssertions: 29, additionalAssertions: 3 }));
