import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const folder = new URL('./', import.meta.url);
const root = new URL('../../', folder);
const read = path => readFile(new URL(path, root));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const beforePath = 'audit/2026-11-02/KeybrResults-before-preserve-scroll.source27';
const afterPath = 'src/components/keybr/KeybrResults.tsx';
const specBeforePath = 'audit/2026-11-02/learning-v3-before-result-focus-regression.source27';
const specAfterFocusPath = 'audit/2026-11-02/learning-v3-before-stats-regression.after-results-focus';
const [before, after, specBefore, specAfterFocus, specCurrent] = await Promise.all([
  read(beforePath), read(afterPath), read(specBeforePath), read(specAfterFocusPath), read('e2e/learning-v3.spec.ts'),
]);
const oldLine = 'useEffect(() => { root.current?.focus(); }, [result.clientSessionId]);';
const newLine = 'useEffect(() => { root.current?.focus({ preventScroll: true }); }, [result.clientSessionId]);';
const normalize = buffer => buffer.toString('utf8').replaceAll('\r\n', '\n');
assert.equal(normalize(after).replace(newLine, oldLine), normalize(before));
assert.equal(normalize(specAfterFocus).startsWith(normalize(specBefore)), true);
assert.equal(specCurrent.subarray(0, specAfterFocus.length).equals(specAfterFocus), true);
const appended = normalize(specAfterFocus).slice(normalize(specBefore).length);
for (const proof of [
  "{ name: 'portrait', width: 390, height: 844",
  "{ name: 'landscape', width: 844, height: 390",
  "{ name: 'previously scrolled portrait', width: 390, height: 844",
  'await expect(learningResults).toBeFocused()',
  "getByText('Session complete', { exact: true })).toBeInViewport({ ratio: 1 })",
  'expect(evidence.metrics.inputAccuracy).toBe(100)',
]) assert.equal(appended.includes(proof), true, proof);
const report = {
  capturedAt: new Date().toISOString(),
  status: 'SOURCE-CANDIDATE-APPLIED-UNDER-ROOT-GO-TESTS-PENDING',
  baselineBuild: '11de46af5d4a80e0e830',
  baselineStaticBuild: 'fac344923bbf9cbde394',
  productFile: afterPath,
  archive: beforePath,
  normalizedSourceReversesExactlyByOneLine: true,
  sourceBeforeSha256: hash(before),
  sourceCandidateSha256: hash(after),
  change: { before: oldLine, after: newLine },
  preserved: ['result root keyboard focus', 'existing focus effect dependency', 'result announcements', 'scoring', 'clocks', '3D intro'],
  evidenceScope: {
    originalLearnAcceptanceP98Ms: 112,
    originalBotAcceptanceP98Ms: 112,
    baselineNativeFocusSampleWeightMs: 150.32,
    baselineFinalInsertionForcedStyleAndLayoutMs: 148.2,
    conclusion: 'The native focus samples occur after the final beforeinput; this candidate addresses completion focus/scroll work. It does not establish or resolve the entire pre-final typing latency cause.',
    evidenceReport: 'audit/2026-11-02/final27-mobile-hotpath-evidence-observations.json',
  },
  regression: {
    spec: 'e2e/learning-v3.spec.ts',
    rawOriginalArchive: specBeforePath,
    rawFocusAppendArchive: specAfterFocusPath,
    originalNormalizedTextPreservedAsPrefix: true,
    rawFormattingDifference: 'Only the original trailing empty-line terminator differs: original CRLF became LF before the new cases. Original test bodies and assertions are unchanged after CRLF normalization.',
    focusAppendRawBytesPreservedBySubsequentStatsAppend: true,
    originalBytes: specBefore.length,
    focusCandidateBytes: specAfterFocus.length,
    focusAppendBytes: specAfterFocus.length - specBefore.length,
    viewports: ['390x844 portrait', '844x390 landscape', '390x844 previously scrolled portrait'],
    assertions: ['automatic result root focus before any click/export', 'actual summary line entirely in viewport', 'no horizontal overflow', 'native-input final text exact', 'all insertion attempts correct', '100% exported input accuracy'],
    runtimeStatus: 'NOT-RUN-BY-THIS-AGENT',
    visibilityCaveat: 'If preserving scroll leaves the summary outside a small or scrolled viewport, retain the assertion and investigate controlled scrolling after paint. Do not weaken accessibility visibility to obtain a pass.',
  },
  runtimeJobsRunByThisAgent: 0,
  acceptanceStatus: 'UNVERIFIED-AFTER-CANDIDATE',
};
await writeFile(new URL('learning-result-focus-adoption.json', folder), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, sourceReversal: true, focusAppendPreserved: true, testsRun: 0 }));
