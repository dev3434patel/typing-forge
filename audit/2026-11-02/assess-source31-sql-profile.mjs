// Read-only diagnostic assessment. Never starts/retries a service or request.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifySource31SqlProfileClone } from './source31-sql-profile-guard.mjs';

const directory = 'audit/2026-11-02';
const owner = process.argv[2];
assert.match(owner ?? '', /^[a-f0-9]{16}$/);
const sourceFile = `${directory}/source31-capacity-wire-sql-profile-${owner}.json`;
const output = `${directory}/source31-sql-profile-${owner}-assessment.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const rawBytes = await readFile(sourceFile), raw = JSON.parse(rawBytes);
assert.equal(raw.protocol.ownerId, owner);
assert.equal(raw.protocol.diagnosticOnly, true);
const identity = await verifySource31SqlProfileClone();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function summary(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const count = sorted.length;
  if (!count) return { count: 0, min: null, p50: null, p95: null, p99: null, max: null, total: 0 };
  const rank = p => sorted[Math.max(0, Math.ceil(count * p) - 1)];
  return { count, min: sorted[0], p50: rank(.5), p95: rank(.95), p99: rank(.99), max: sorted[count - 1], total: sorted.reduce((a, b) => a + b, 0) };
}
function parse(header) {
  if (typeof header !== 'string' || header.length > 6000) return { valid: false, reason: 'Missing/oversized Server-Timing header.' };
  const pattern = /([a-z_]{1,48});dur=(\d+(?:\.\d+)?);desc="n=(\d+),err=(\d+)"/g;
  const matches = [...header.matchAll(pattern)];
  if (!matches.length || matches.map(match => match[0]).join(', ') !== header || matches.length > 48) return { valid: false, reason: 'Unexpected/unbounded timing grammar.' };
  const metrics = {};
  for (const match of matches) {
    if (metrics[match[1]]) return { valid: false, reason: 'Duplicate timing label.' };
    const ms = Number(match[2]), calls = Number(match[3]), errors = Number(match[4]);
    if (!Number.isFinite(ms) || !Number.isSafeInteger(calls) || calls < 1 || !Number.isSafeInteger(errors) || errors < 0 || errors > calls) return { valid: false, reason: 'Invalid duration/count.' };
    metrics[match[1]] = { ms, calls, errors };
  }
  const valid = metrics.profile_marker?.ms === 31 && metrics.profile_overflow?.ms === 0 && metrics.php_total?.calls === 1 && metrics.sql_connect?.calls === 1 && metrics.sql_prepare?.calls > 0 && metrics.sql_execute?.calls > 0 && metrics.sql_fetch?.calls > 0;
  return { valid, reason: valid ? null : 'Missing native-call marker/control, overflow or unexpected total count.', metrics };
}
const topLevelStages = ['bootstrap', 'session', 'connect', 'auth_rate', 'body_read', 'json_decode', 'arena', 'session_close', 'json_encode'];
const sqlMethods = ['connect', 'prepare', 'execute', 'fetch', 'query', 'exec', 'begin', 'commit', 'rollback'];
const rows = raw.rawRequests.map(row => {
  const parsed = parse(row.serverTiming);
  const metrics = parsed.metrics ?? {};
  const stageMs = Object.fromEntries(Object.entries(metrics).filter(([name]) => name.startsWith('stage_')).map(([name, value]) => [name.slice(6), value.ms]));
  const nativeSqlMs = sqlMethods.reduce((total, name) => total + (metrics[`sql_${name}`]?.ms ?? 0), 0);
  const phpMs = metrics.php_total?.ms ?? null;
  const stageSum = topLevelStages.reduce((total, name) => total + (stageMs[name] ?? 0), 0);
  const subReplayControls = row.phase !== 'submit' || metrics.stage_candidate_validate?.calls === 1 && metrics.stage_locked_replay?.calls === 1;
  return { request: row.request, phase: row.phase, actorIndex: row.actorIndex, roomIndex: row.roomIndex, httpStatus: row.status, expected: row.expected, httpMs: row.ms, queuedMs: row.queuedMs, parsed: parsed.valid && subReplayControls, reason: parsed.valid && subReplayControls ? null : (parsed.reason ?? 'Missing candidate/locked-replay timing control.'), metrics,
    phpMs, nativeSqlMs: parsed.valid ? nativeSqlMs : null,
    httpMinusPhpMs: phpMs === null ? null : row.ms - phpMs,
    phpOutsideTopLevelStagesMs: phpMs === null ? null : phpMs - stageSum,
    stageMs };
});
const allLabels = [...new Set(rows.flatMap(row => Object.keys(row.metrics)))].sort();
const groups = ['all', ...Object.keys(raw.protocol.expectedOperations)];
const summaries = groups.map(phase => {
  const selected = phase === 'all' ? rows : rows.filter(row => row.phase === phase);
  return { phase, requests: selected.length, validTimingRequests: selected.filter(row => row.parsed).length,
    httpMs: summary(selected.map(row => row.httpMs)), phpMs: summary(selected.map(row => row.phpMs)), nativeSqlMs: summary(selected.map(row => row.nativeSqlMs)),
    signedHttpMinusPhpMs: summary(selected.map(row => row.httpMinusPhpMs)), signedPhpOutsideTopLevelStagesMs: summary(selected.map(row => row.phpOutsideTopLevelStagesMs)),
    negativeHttpResidualCount: selected.filter(row => row.httpMinusPhpMs < 0).length, negativePhpResidualCount: selected.filter(row => row.phpOutsideTopLevelStagesMs < 0).length,
    timings: Object.fromEntries(allLabels.map(label => [label, { durationsMs: summary(selected.filter(row => row.metrics[label]).map(row => row.metrics[label].ms)), calls: selected.reduce((n, row) => n + (row.metrics[label]?.calls ?? 0), 0), errors: selected.reduce((n, row) => n + (row.metrics[label]?.errors ?? 0), 0) }])) };
});
const requestChecks = raw.checks.filter(row => row.name !== 'successful-request p95 remains strictly below150ms');
const complete = raw.total === 1653 && rows.length === 1653 && rows.every(row => row.parsed) && raw.unexpectedRequests.length === 0 && raw.failure === null && !raw.watchdogExpired && requestChecks.every(row => row.pass) && raw.inputsUnchanged && identity.cloneAndPrimaryHashesMatchPreparation;
const cleanupFile = `${directory}/pack-backend-${owner}-cleanup.json`;
let cleanup = null, cleanupSha256 = null;
try { const bytes = await readFile(cleanupFile); cleanup = JSON.parse(bytes); cleanupSha256 = sha(bytes); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const report = { status: complete ? 'COMPLETE-SCOPED-DIAGNOSTIC' : 'FAILED-DIAGNOSTIC', recordedAt: new Date().toISOString(), owner,
  evidence: { sourceFile, sha256: sha(rawBytes), cleanupFile, cleanupSha256, assessor: import.meta.filename, assessorSha256: sha(await readFile(import.meta.filename)) },
  strictInstrumentedCapacityStatus: raw.status, strictCapacityPassed: raw.targetMet, strictP95Ms: raw.p95Ms, originalStrictTargetMs: raw.protocol.p95TargetMs,
  originalOrdinaryFailuresReplaced: false, profileIdentity: identity, timingRows: rows, summaries,
  missingOrInvalidTimingRequests: rows.filter(row => !row.parsed).map(({ metrics, stageMs, ...row }) => row),
  cleanup,
  interpretation: ['Native call durations measure elapsed time inside real PDO/statement methods with original arguments and authority/lock positions. Execute includes network/DBwait/scheduling and is not pureSQLCPU or exclusive row-lock attribution.',
    'SQL categories are a partition of outer execute/query/exec intervals; SQL totals include other native methods. Stage clocks are inclusive and overlap SQL, while arena overlaps candidate validation and authoritative replay. Never add these as exclusive HTTP time.',
    'Signed HTTP-minus-PHP is an unassigned residual including Apache/Zend initialization, wrapper compile, response flush/network/client queues and shutdown; negative values are preserved rather than clamped.',
    'PHP outside top-level stages includes app dispatch/autoload/compile/guards/profiling overhead. Timing header generation and buffered flush occur after php_total; buffering and instrumentation change diagnostic cost.',
    'Source31 backend38+17fixture dependencies remain bound independently; later frontend UI is explicitly excluded. No physical-device,productionhosting,currentfull-product or ordinary-capacity pass is implied.'],
  servicesStartedByAssessment: 0, trialsFilteredOrRetried: 0, productionSourceChanged: false };
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, strictCapacityPassed: report.strictCapacityPassed, strictP95Ms: report.strictP95Ms, requests: rows.length, invalidTimings: report.missingOrInvalidTimingRequests.length, summaries: summaries.map(row => ({ phase: row.phase, httpP95Ms: row.httpMs.p95, phpP95Ms: row.phpMs.p95, nativeSqlP95Ms: row.nativeSqlMs.p95, signedHttpMinusPhpP95Ms: row.signedHttpMinusPhpMs.p95 })) }));
process.exitCode = complete ? 0 : 1;
