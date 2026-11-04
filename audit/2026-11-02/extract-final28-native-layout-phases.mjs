// Read-only extraction of the completed diagnostic; no browser or product work.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const hash = value => createHash('sha256').update(value).digest('hex');
const rounded = value => Math.round(value * 1000) / 1000;
const union = rows => {
  const spans = rows.map(row => [row.start, row.end]).sort((a, b) => a[0] - b[0]);
  let total = 0, first = null, last = null;
  for (const [start, end] of spans) {
    if (first === null) { first = start; last = end; }
    else if (start <= last) last = Math.max(last, end);
    else { total += last - first; first = start; last = end; }
  }
  return rounded(total + (first === null ? 0 : last - first));
};
const within = (inner, outer) => inner.start >= outer.start && inner.end <= outer.end;
const cases = [];
for (const id of ['learn', 'local-bot']) {
  const prefix = `${directory}/final28-mobile-native-pipeline-${id}`;
  const summaryBytes = await readFile(`${prefix}-pipeline-summary.json`);
  const report = JSON.parse(summaryBytes);
  const timeline = JSON.parse(await readFile(`${directory}/.final28-mobile-native-pipeline-${id}-timeline.json`, 'utf8'));
  const trace = JSON.parse(await readFile(`${directory}/.final28-mobile-native-pipeline-${id}-trace.json`, 'utf8'));
  const clock = report.summary.clockAlignment;
  assert.equal(clock.status, 'VERIFIED-USER-TIMING-MARKER-ALIGNMENT');
  const at = event => event.ts / 1000 - clock.traceMinusPerformanceNowMs;
  const events = trace.traceEvents.map((event, index) => ({ event, index })).filter(({ event }) => event.pid === clock.mainRenderer.pid && event.tid === clock.mainRenderer.tid);
  const spans = events.filter(({ event }) => event.ph === 'X' && typeof event.dur === 'number').map(({ event, index }) => ({
    type: event.name, start: at(event), end: at(event) + event.dur / 1000, duration: event.dur / 1000,
    eventType: event.name === 'EventDispatch' ? event.args?.data?.type ?? null : null,
    index, event,
  }));
  const first = timeline.input.beforeInputs[0].at, last = timeline.input.beforeInputs.at(-1).at;
  const inputEnd = timeline.input.returnedAt;
  const nativeTextInput = spans.filter(span => span.type === 'EventDispatch' && span.eventType === 'textInput');
  const inputDispatch = spans.filter(span => span.type === 'EventDispatch' && span.eventType === 'input');
  const groups = new Map();
  const selected = spans.filter(span => ['Layout', 'UpdateLayoutTree'].includes(span.type) && span.start >= first && span.end < last);
  for (const span of selected) {
    const parent = nativeTextInput.filter(text => within(span, text)).sort((a, b) => a.duration - b.duration)[0];
    let phase = 'outside-native-textInput';
    if (inputDispatch.some(input => within(span, input))) phase = 'inside-app-input-dispatch';
    else if (parent) {
      const inputs = inputDispatch.filter(input => within(input, parent)).sort((a, b) => a.start - b.start);
      if (!inputs.length) phase = 'textInput-without-observed-input-dispatch';
      else if (span.end <= inputs[0].start) phase = 'native-textInput-before-app-input';
      else if (span.start >= inputs.at(-1).end) phase = 'native-textInput-after-app-input';
      else phase = 'textInput-crossing-app-input-boundary';
    }
    const key = `${span.type}:${phase}`;
    const rows = groups.get(key) ?? []; rows.push(span); groups.set(key, rows);
  }
  const counts = [...groups].map(([key, rows]) => ({ type: key.slice(0, key.indexOf(':')), phase: key.slice(key.indexOf(':') + 1), count: rows.length,
    inclusiveDurationMs: rounded(rows.reduce((sum, row) => sum + row.duration, 0)), unionDurationMs: union(rows) }));
  const topLayouts = selected.filter(span => span.type === 'Layout').sort((a, b) => b.duration - a.duration).slice(0, 8).map(layout => {
    const enclosing = spans.filter(span => ['EventDispatch', 'FunctionCall'].includes(span.type) && within(layout, span)).sort((a, b) => a.duration - b.duration);
    const parentText = nativeTextInput.filter(span => within(layout, span)).sort((a, b) => a.duration - b.duration)[0];
    const relatedInputs = parentText ? inputDispatch.filter(span => within(span, parentText)) : [];
    const nodeNumbers = {};
    for (const container of [layout.event.args?.beginData, layout.event.args?.data, layout.event.args?.endData]) {
      for (const [key, value] of Object.entries(container ?? {})) if (typeof value === 'number' || typeof value === 'boolean') nodeNumbers[key] = value;
    }
    return { traceIndex: layout.index, startMs: rounded(layout.start), endMs: rounded(layout.end), durationMs: rounded(layout.duration),
      enclosingSpans: enclosing.slice(0, 6).map(span => ({ type: span.type, eventType: span.eventType, startMs: rounded(span.start), endMs: rounded(span.end), durationMs: rounded(span.duration) })),
      relatedInputDispatch: relatedInputs.map(span => ({ startMs: rounded(span.start), endMs: rounded(span.end), durationMs: rounded(span.duration) })),
      layoutArgsNumericAndBoolean: nodeNumbers,
    };
  });
  const unmatched = [];
  const stack = [];
  for (const { event, index } of [...events].sort((a, b) => a.event.ts - b.event.ts || a.index - b.index)) {
    if (event.ph === 'B') stack.push({ event, index });
    else if (event.ph === 'E') stack.pop();
  }
  for (const { event, index } of stack) unmatched.push({ name: event.name, traceIndex: index, startMs: rounded(at(event)),
    startsAfterInputReturn: at(event) >= inputEnd, startsAfterFinalBeforeInput: at(event) >= last });
  cases.push({ id, sourceSummary: `${prefix}-pipeline-summary.json`, sourceSummarySha256: hash(summaryBytes),
    originalSummaryStatus: report.summary.status, strictBounds: { firstBeforeInput: first, finalBeforeInputExclusive: last },
    nativeEditingPhases: counts, topLayouts,
    unmatchedBeginsOnMeasuredRenderer: unmatched,
    setterKindsStrictPreFinal: report.summary.phases.strictPreFinalInput.nativeSetters.kinds,
    shape: report.nativeTextareaShape, nodeEvidence: report.layoutNodeEvidence,
    qualification: 'These are complete X spans with strict pre-final containment. Input dispatch containment separates measured native editing from app dispatch but does not prove one CSS property or node caused a layout. Inclusive categories can nest; union durations are within category only. Original summaries, including partial status, remain unchanged.' });
}
const processBytes = await readFile(`${directory}/final28-mobile-native-pipeline-process.json`);
const processReport = JSON.parse(processBytes);
assert.equal(processReport.status, 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE');
assert.deepEqual(processReport.apiRequests, []);
assert.equal(processReport.hashesUnchanged, true);
assert.equal(processReport.ownBrowserChildExited, true);
assert.equal(processReport.ownedServerClosed, true);
const output = `${directory}/final28-native-layout-phase-observations.json`;
await writeFile(output, `${JSON.stringify({ capturedAt: new Date().toISOString(), status: 'MEASURED-DIAGNOSTIC-ASSOCIATIONS-NOT-ACCEPTANCE-OR-EXCLUSIVE-CAUSE',
  sourceBuild: 'c79352750d221e3b7479', staticBuild: '9c75d9897f5ff28e45b5',
  processReport: `${directory}/final28-mobile-native-pipeline-process.json`, processReportSha256: hash(processBytes),
  originalAcceptanceP98Ms: { source27: { learn: 112, localBot: 112 }, source28: { learn: 104, localBot: 120 } },
  acceptanceFailuresStillFailed: true, cases,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, cases: cases.map(item => ({ id: item.id, phases: item.nativeEditingPhases, unmatched: item.unmatchedBeginsOnMeasuredRenderer, largestLayout: item.topLayouts[0] })) }));
