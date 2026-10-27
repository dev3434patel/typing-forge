// Read-only inventory and raw-count reconciliation. This does not launch tests,
// replace a release gate, read private credentials, or certify an entire product.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from './artifact-verification.mjs';
import { summarizeReport } from '../mobile-games-static-2026-10-20/summarize-browsers.mjs';

const expectedBuild = process.env.SPAROWTYPE_FINAL19_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen19 build identity.');
const audit = path.resolve(import.meta.dirname);
const source = await verifyFrozenSource('audit/2026-10-21/final19-source.json');
assert.equal(source.frozen.local.version, expectedBuild);
assert.deepEqual(source.receipt.mismatches, []);
const engines = ['chromium', 'edge', 'firefox', 'webkit'];
const witnesses = [];
async function readReceipt(name) {
  assert.match(name, /^[a-z0-9][a-z0-9.-]*\.json$/, 'Only public same-directory JSON receipts are readable.');
  const file = path.join(audit, name);
  try {
    const bytes = await readFile(file);
    const value = JSON.parse(bytes.toString('utf8'));
    witnesses.push({ file: name, sha256: createHash('sha256').update(bytes).digest('hex') });
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Public receipt is unreadable: ${name}`);
  }
}
const identity = value => typeof value === 'string' ? value : value?.version;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const rows = [];
const row = (id, file, value, details = {}) => {
  const result = { id, receipt: file, present: Boolean(value), reportedStatus: value?.status ?? null, ...details };
  rows.push(result);
  return result;
};
const file = name => `final19-${name}.json`;

const gates = await readReceipt(file('source-gates'));
row('source-commands', file('source-gates'), gates, {
  completedCommands: gates?.results?.filter(item => item.finishedAt).length ?? 0,
  failedCommands: gates?.results?.filter(item => item.exitCode !== 0).map(item => item.id) ?? [],
  declaredCommands: gates?.results?.length ?? 0,
  qualification: 'Command outcomes only. Unit counts/coverage and actual19 source binding require their own raw/log review; historical18 confirmations are excluded.',
});
const bundle = await readReceipt(file('bundle'));
row('bundle', file('bundle'), bundle, {
  introGzipBytes: bundle?.introDeferredJsGzipBytes ?? null,
  introBudgetBytes: bundle?.budgets?.introDeferredJsGzipBytes ?? null,
  qualification: 'Reported bundle budgets; no performance or visual-quality conclusion is inferred from size alone.',
});
const hosting = await readReceipt(file('hosting-package-verification'));
row('hosting-structure', file('hosting-package-verification'), hosting, {
  buildMatches: hosting ? identity(hosting.build) === expectedBuild : null,
  passedChecks: hosting?.checks?.filter(item => item.pass === true).length ?? 0,
  failedChecks: hosting?.checks?.filter(item => item.pass !== true).map(item => item.name) ?? [],
  visualByteComparisons: hosting?.visualComparisons?.map(item => ({ kind: item.kind, pass: item.pass })) ?? [],
});
const matrix = await readReceipt(file('browser-matrix'));
const batches = [];
for (const result of matrix?.results ?? []) {
  assert.ok(['new-features', 'existing', 'isolated', 'first-input-timing'].includes(result.id));
  const raw = await readReceipt(file(result.id));
  const protocol = await readReceipt(file(`${result.id}-protocol`));
  const summary = raw ? summarizeReport(raw) : null;
  batches.push({ id: result.id, exitCode: result.exitCode, rawPresent: Boolean(raw),
    actualTotals: summary?.totals ?? null, actualProjects: summary?.projects ?? null,
    declaredWorkers: protocol?.workers ?? null, protocolBuildMatches: protocol ? identity(protocol.build) === expectedBuild : null,
    integrity: protocol?.integrity ?? null, globalErrors: raw?.errors?.length ?? null });
}
row('full-matrix', file('browser-matrix'), matrix, {
  buildMatches: matrix ? identity(matrix.build) === expectedBuild : null,
  filesCoveredExactlyOnce: matrix?.filesCoveredExactlyOnce ?? null,
  finished: Boolean(matrix?.finishedAt && matrix?.results?.length === 4), batches,
  qualification: 'Raw outcomes remain separate from native16/static/physical devices. Every skip remains unverified. Partial logs are never counted as completed cases.',
});
const artifacts = await readReceipt(file('static-artifacts'));
row('static-artifacts', file('static-artifacts'), artifacts, {
  sourceBuildMatches: artifacts ? artifacts.source?.expectedBuild === expectedBuild : null,
  passedChecks: artifacts?.checks?.filter(item => item.pass === true).length ?? 0,
  artifacts: artifacts?.artifacts?.map(item => ({ directory: item.directory, build: item.build, deployment: item.deployment })) ?? [],
});
const staticProcess = await readReceipt(file('static-process'));
row('static-browser', file('static-process'), staticProcess, {
  expectedBuildMatches: staticProcess ? staticProcess.expectedBuild === expectedBuild : null,
  deployment: staticProcess?.deployment ?? null, gameAccessibility: staticProcess?.['game-accessibility'] ?? null,
  ownedChildProcessExited: staticProcess?.ownedChildProcessExited ?? null,
  qualification: 'Local directory hosting only; no deployed Vercel/Pages or native Safari certification.',
});
const mobileName = 'mobile-workspaces-final19-static.json';
const mobile = await readReceipt(mobileName);
const mobileProcess = await readReceipt('mobile-workspaces-final19-static-process.json');
row('mobile-four', mobileName, mobile, {
  completed: mobile?.completed ?? null, watchdogExpired: mobile?.watchdogExpired ?? null,
  cases: mobile?.cases?.map(item => ({ id: item.id, passed: item.passed,
    attempts: item.evidence?.attempts, inputAccuracy: item.evidence?.inputAccuracy,
    p98Ms: item.timing?.p98ObservedTypingEventDurationMs,
    below100ms: finite(item.timing?.p98ObservedTypingEventDurationMs) ? item.timing.p98ObservedTypingEventDurationMs < 100 : null })) ?? [],
  processStatus: mobileProcess?.status ?? null, ownedServerClosed: mobileProcess?.ownedServerClosed ?? null,
  qualification: 'Functional correctness and laboratory latency are distinct. Emulation does not prove physical OS keyboard behavior.',
});
const input = await readReceipt(file('input-results'));
row('matched-input', file('input-results'), input, {
  protocolBuildMatches: input ? identity(input.protocol?.build) === expectedBuild : null,
  runs: input?.runs?.map(item => ({ run: item.run, buildMatches: item.build === expectedBuild,
    exact: item.exact, attempts: item.attempts, accuracy: item.accuracy, p98Ms: item.p98Ms,
    below100ms: finite(item.p98Ms) ? item.p98Ms < 100 : null, maxMs: item.maxMs,
    rotationRetained: item.rotation?.retainedExactly, errors: item.errors?.length ?? null })) ?? [],
});
const lighthouse = await readReceipt(file('mobile-results'));
row('lighthouse', file('mobile-results'), lighthouse, {
  protocolBuildMatches: lighthouse ? identity(lighthouse.protocol?.build) === expectedBuild : null,
  runs: lighthouse?.runs?.map(item => ({ buildMatches: identity(item.build) === expectedBuild,
    scores: item.scores, runtimeError: item.runtimeError,
    lcpMs: item.metrics?.['largest-contentful-paint'], cls: item.metrics?.['cumulative-layout-shift'] })) ?? [],
  qualification: 'Review full-quality/fresh-profile/protocol guards and all three runs. Historical scores do not transfer to19; local Lighthouse is not field INP.',
});
const native = await readReceipt(file('native-browser'));
let nativeRaw = null, cleanup = null, apache = null;
if (native?.nativeResult?.rawReport) nativeRaw = await readReceipt(path.basename(native.nativeResult.rawReport.replaceAll('\\', '/')));
const owned = native?.readyReceipt?.match(/^pack-backend-([a-f0-9]{16})-browser-ready\.json$/);
if (owned) {
  cleanup = await readReceipt(`pack-backend-${owned[1]}-cleanup.json`);
  apache = await readReceipt(`pack-backend-${owned[1]}-apache-runtime.json`);
}
row('native16', file('native-browser'), native, {
  buildMatches: native ? native.build === expectedBuild : null,
  actual: nativeRaw ? summarizeReport(nativeRaw) : null,
  sourceAfter: native?.sourceAfter ?? null, inputsUnchanged: native?.inputsUnchanged ?? null,
  apacheRuntime: apache, cleanup,
  qualification: 'Only public receipts are read. Fresh owned instance, exact four engines/16 cases and successful same-instance cleanup must all be reviewed. No capacity/production claim.',
});
const placement = await readReceipt(file('placement-real135-raw'));
row('placement135', file('placement-real135-raw'), placement, {
  buildMatches: placement ? identity(placement.build) === expectedBuild : null,
  checks: placement?.checks?.length ?? 0, passed: placement?.passed ?? 0, failed: placement?.failed ?? 0,
  durationMs: placement?.durationMs ?? null, parts: placement?.parts?.length ?? 0,
  ownedBrowserClosed: placement?.ownedBrowserClosed ?? null,
});
console.log(JSON.stringify({ capturedAt: new Date().toISOString(), status: 'READ-ONLY-RECONCILIATION-SNAPSHOT',
  expectedBuild, source: source.receipt, engines, completeReleaseClaimed: false, rows, witnesses,
  missingReceipts: rows.filter(item => !item.present).map(item => item.receipt),
  scope: 'Inventory and raw-count reconciliation only. This is not a replacement release verifier; missing/running/failed gates and original historical failures remain explicit. It never starts browser/build/native jobs or reads private configuration.',
}, null, 2));
