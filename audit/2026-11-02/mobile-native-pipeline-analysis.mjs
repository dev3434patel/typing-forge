// Pure diagnostic analysis: no files, browser calls, services, or production imports.
// Inclusive trace spans may nest. Union durations are supplied separately and
// neither measurement is an exclusive CPU or causal attribution.
const TYPES = Object.freeze(['Layout', 'UpdateLayoutTree', 'PrePaint', 'Paint', 'Layerize', 'EventDispatch', 'FunctionCall']);
const TYPE_SET = new Set(TYPES);
const TOP = 15;
const MAX_EVENTS = 1000000;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const numeric = value => finite(value) ? value : null;
const rounded = value => finite(value) ? Math.round(value * 1000) / 1000 : null;
const array = value => Array.isArray(value) ? value : [];
const safeLabel = (value, max = 120) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : '';
const keyFor = event => `${event.pid}:${event.tid}`;
const validThread = event => Number.isInteger(event?.pid) && Number.isInteger(event?.tid);
const overlaps = (span, phase) => phase.valid && !phase.empty && span.startMs < phase.endMs && span.endMs > phase.startMs;
const contained = (span, phase) => phase.valid && !phase.empty && span.startMs >= phase.startMs
  && (phase.exclusiveEnd ? span.endMs < phase.endMs : span.endMs <= phase.endMs);
const within = (inner, outer) => inner.startMs >= outer.startMs && inner.endMs <= outer.endMs;

function resourcePath(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value.slice(0, 4000), 'https://audit.invalid/');
    return ['http:', 'https:'].includes(url.protocol) ? safeLabel(url.pathname, 240) : '[native-or-nonpublic-script]';
  } catch { return '[unparseable-script-url]'; }
}

function sourceOf(begin, end) {
  const first = begin?.args?.data ?? {}, last = end?.args?.data ?? {};
  const data = { ...last, ...first };
  const frame = data.callFrame ?? array(data.stackTrace)[0] ?? {};
  const path = resourcePath(data.url ?? data.scriptName ?? frame.url);
  return {
    ...(path ? { resourcePath: path } : {}),
    ...(typeof (data.functionName ?? frame.functionName) === 'string' ? { functionName: safeLabel(data.functionName ?? frame.functionName) } : {}),
    ...(finite(data.lineNumber ?? frame.lineNumber) ? { lineNumber: data.lineNumber ?? frame.lineNumber } : {}),
    ...(finite(data.columnNumber ?? frame.columnNumber) ? { columnNumber: data.columnNumber ?? frame.columnNumber } : {}),
    // Event type is a public DOM event category; event.data/key/text are excluded.
    ...(begin?.name === 'EventDispatch' && typeof data.type === 'string' && /^[a-z][a-z0-9-]{0,50}$/i.test(data.type) ? { eventType: data.type } : {}),
  };
}

function unionMs(spans, clip) {
  const intervals = spans.map(span => [clip ? Math.max(span.startMs, clip.startMs) : span.startMs,
    clip ? Math.min(span.endMs, clip.endMs) : span.endMs]).filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let total = 0, start = null, end = null;
  for (const [nextStart, nextEnd] of intervals) {
    if (start === null) { start = nextStart; end = nextEnd; }
    else if (nextStart <= end) end = Math.max(end, nextEnd);
    else { total += end - start; start = nextStart; end = nextEnd; }
  }
  return rounded(total + (start === null ? 0 : end - start));
}

function totals(spans, clip) {
  return {
    count: spans.length,
    inclusiveDurationMs: rounded(spans.reduce((sum, span) => sum + span.endMs - span.startMs, 0)),
    unionDurationMs: unionMs(spans),
    ...(clip ? {
      inclusiveIntersectingDurationMs: rounded(spans.reduce((sum, span) => sum + Math.max(0, Math.min(span.endMs, clip.endMs) - Math.max(span.startMs, clip.startMs)), 0)),
      unionIntersectingDurationMs: unionMs(spans, clip),
    } : {}),
  };
}

function spanRecord(span, phase) {
  return { type: span.type, traceIndex: span.traceIndex,
    ...(span.endTraceIndex === undefined ? {} : { pairedEndTraceIndex: span.endTraceIndex }),
    startAtMs: rounded(span.startMs), endAtMs: rounded(span.endMs), durationMs: rounded(span.endMs - span.startMs),
    ...(phase ? { fullyContainedInPhase: contained(span, phase), boundaryOverlap: !contained(span, phase) && overlaps(span, phase) } : {}),
    ...span.source };
}

function reconstruct(events) {
  const ordered = events.map((event, index) => ({ event, index })).filter(({ event }) => validThread(event) && finite(event.ts))
    .sort((left, right) => left.event.ts - right.event.ts || left.index - right.index);
  const stacks = new Map(), spans = [];
  const counts = { completeX: 0, pairedBE: 0, unmatchedBegins: 0, unmatchedEnds: 0, mismatchedNamedEnds: 0,
    invalidDurations: 0, invalidThreadOrTimestamp: events.length - ordered.length, incompleteSelectedBegins: 0, selectedUnmatchedEnds: 0 };
  const emit = (begin, beginIndex, end, endIndex, endUs, form) => {
    if (!TYPE_SET.has(begin.name)) return;
    if (!finite(endUs) || endUs < begin.ts) { counts.invalidDurations++; return; }
    spans.push({ type: begin.name, pid: begin.pid, tid: begin.tid, traceIndex: beginIndex,
      ...(endIndex === undefined ? {} : { endTraceIndex: endIndex }),
      traceStartUs: begin.ts, traceEndUs: endUs, source: sourceOf(begin, end), form });
  };
  for (const { event, index } of ordered) {
    if (event.ph === 'X') {
      if (TYPE_SET.has(event.name)) {
        if (!finite(event.dur) || event.dur < 0) counts.invalidDurations++;
        else { emit(event, index, null, undefined, event.ts + event.dur, 'X'); counts.completeX++; }
      }
    } else if (event.ph === 'B') {
      const key = keyFor(event), stack = stacks.get(key) ?? [];
      stack.push({ event, index }); stacks.set(key, stack);
    } else if (event.ph === 'E') {
      const stack = stacks.get(keyFor(event)) ?? [];
      if (!stack.length) { counts.unmatchedEnds++; if (TYPE_SET.has(event.name)) counts.selectedUnmatchedEnds++; continue; }
      let match = stack.length - 1;
      if (event.name && event.name !== stack[match].event.name) {
        counts.mismatchedNamedEnds++;
        while (match >= 0 && stack[match].event.name !== event.name) match--;
        if (match < 0) { counts.unmatchedEnds++; if (TYPE_SET.has(event.name)) counts.selectedUnmatchedEnds++; continue; }
      }
      for (const lost of stack.splice(match + 1)) {
        counts.unmatchedBegins++; if (TYPE_SET.has(lost.event.name)) counts.incompleteSelectedBegins++;
      }
      const begin = stack.pop(); emit(begin.event, begin.index, event, index, event.ts, 'BE');
      if (TYPE_SET.has(begin.event.name)) counts.pairedBE++;
    }
  }
  for (const stack of stacks.values()) for (const begin of stack) {
    counts.unmatchedBegins++; if (TYPE_SET.has(begin.event.name)) counts.incompleteSelectedBegins++;
  }
  return { spans, counts };
}

function align(events, timeline) {
  const inputRows = array(timeline?.input?.beforeInputs);
  const bySequence = new Map(), duplicateInputSequences = new Set();
  let invalidInputRows = 0;
  for (const row of inputRows) {
    if (!Number.isInteger(row?.sequence) || row.sequence <= 0 || !finite(row.at)) { invalidInputRows++; continue; }
    if (bySequence.has(row.sequence)) duplicateInputSequences.add(row.sequence);
    else bySequence.set(row.sequence, row);
  }
  const beforeInputs = [...bySequence.values()].sort((a, b) => a.sequence - b.sequence);
  const monotonicInput = beforeInputs.every((row, index) => index === 0 || row.at >= beforeInputs[index - 1].at);
  const groups = new Map();
  for (const event of events) {
    if (!validThread(event) || !finite(event.ts)) continue;
    const matched = typeof event.name === 'string' ? /^sparow-native-beforeinput-(\d+)$/.exec(event.name) : null;
    if (!matched) continue;
    const sequence = Number(matched[1]);
    if (!bySequence.has(sequence)) continue;
    const key = keyFor(event), group = groups.get(key) ?? { pid: event.pid, tid: event.tid, markers: new Map() };
    const items = group.markers.get(sequence) ?? []; items.push(event); group.markers.set(sequence, items); groups.set(key, group);
  }
  const candidates = [...groups.values()].map(group => {
    const pairs = [], duplicates = [];
    for (const [sequence, items] of group.markers) {
      if (items.length !== 1) { duplicates.push(sequence); continue; }
      pairs.push({ sequence, offsetMs: items[0].ts / 1000 - bySequence.get(sequence).at });
    }
    return { ...group, pairs, duplicates, matchCount: pairs.length };
  }).sort((a, b) => b.matchCount - a.matchCount || a.pid - b.pid || a.tid - b.tid);
  const chosen = candidates[0] ?? null;
  const tied = chosen !== null && candidates.length > 1 && candidates[1].matchCount === chosen.matchCount;
  const offsets = chosen ? chosen.pairs.map(item => item.offsetMs).sort((a, b) => a - b) : [];
  const median = offsets.length ? (offsets[Math.floor((offsets.length - 1) / 2)] + offsets[Math.floor(offsets.length / 2)]) / 2 : null;
  const spread = offsets.length ? offsets.at(-1) - offsets[0] : null;
  const mainRenderer = chosen && !tied ? { pid: chosen.pid, tid: chosen.tid } : null;
  const missing = beforeInputs.filter(row => !chosen?.pairs.some(pair => pair.sequence === row.sequence)).map(row => row.sequence);
  const auxiliary = [];
  if (mainRenderer && median !== null) for (const [name, at] of [
    ['sparow-native-input-start', timeline?.input?.callStartAt], ['sparow-native-input-returned', timeline?.input?.returnedAt],
  ]) {
    const marks = events.filter(event => event.pid === mainRenderer.pid && event.tid === mainRenderer.tid && event.name === name && finite(event.ts));
    const residual = marks.length === 1 && finite(at) ? marks[0].ts / 1000 - median - at : null;
    auxiliary.push({ name, count: marks.length, residualMs: rounded(residual), withinOneMs: residual !== null && Math.abs(residual) <= 1 });
  }
  const auxiliaryValid = auxiliary.length === 2 && auxiliary.every(mark => mark.count === 1 && mark.withinOneMs);
  const allPresent = beforeInputs.length > 0 && missing.length === 0 && invalidInputRows === 0 && duplicateInputSequences.size === 0 && (chosen?.duplicates.length ?? 0) === 0;
  const verified = Boolean(mainRenderer && offsets.length >= 2 && spread <= 1 && monotonicInput && allPresent && auxiliaryValid);
  return {
    beforeInputs, offsetMs: verified ? median : null,
    public: {
      status: verified ? 'VERIFIED-USER-TIMING-MARKER-ALIGNMENT' : 'UNVERIFIED-USER-TIMING-MARKER-ALIGNMENT',
      method: 'Independently infer ts/1000 minus performance.now for each unique beforeinput mark on one renderer pid/tid; require all marks, at least two, offset spread <=1ms, and start/returned residuals <=1ms.',
      mainRenderer, rendererCandidateCount: candidates.length, ambiguousTopRenderer: tied,
      traceMinusPerformanceNowMs: rounded(median), offsetSpreadMs: rounded(spread), requiredMaxSpreadMs: 1,
      markerCounts: { timelineBeforeInputs: inputRows.length, validUniqueTimelineBeforeInputs: beforeInputs.length,
        matchedUniqueBeforeInputMarkers: chosen?.matchCount ?? 0, missingBeforeInputMarkers: missing.length,
        duplicateTimelineSequences: duplicateInputSequences.size, duplicateTraceSequencesOnCandidate: chosen?.duplicates.length ?? 0, invalidTimelineRows: invalidInputRows },
      allBeforeInputMarkersPresent: allPresent, inputSequenceTimesMonotonic: monotonicInput,
      missingSequenceExamples: missing.slice(0, TOP), auxiliaryMarkers: auxiliary,
    },
  };
}

function phase(startMs, endMs, exclusiveEnd = false) {
  return { startMs: numeric(startMs), endMs: numeric(endMs), exclusiveEnd,
    valid: finite(startMs) && finite(endMs) && endMs >= startMs,
    empty: finite(startMs) && finite(endMs) && startMs === endMs };
}

function setterRecord(call) {
  const range = value => value && typeof value === 'object' ? {
    start: numeric(value.start), end: numeric(value.end),
    direction: ['forward', 'backward', 'none'].includes(value.direction) ? value.direction : null,
  } : null;
  return {
    id: Number.isInteger(call.id) ? call.id : null, kind: safeLabel(call.kind, 80) || '(unreported)',
    startMs: call.startAt, endMs: call.endAt,
    measuredDurationMs: finite(call.durationMs) ? call.durationMs : call.endAt - call.startAt,
    before: range(call.before), after: range(call.after), requestedRange: range(call.requestedRange),
    sameRangeBeforeAfter: typeof call.sameRangeBeforeAfter === 'boolean' ? call.sameRangeBeforeAfter : null,
    requestedAlreadyCurrent: typeof call.requestedAlreadyCurrent === 'boolean' ? call.requestedAlreadyCurrent : null,
    threw: typeof call.threw === 'boolean' ? call.threw : null,
  };
}

function structuralProof(value, depth = 0, budget = { nodes: 0 }) {
  if (++budget.nodes > 200 || depth > 5) return '[bounded]';
  if (typeof value === 'boolean' || value === null) return value;
  if (finite(value)) return value;
  if (typeof value === 'string') {
    const words = new Set(['HTMLInputElement', 'HTMLTextAreaElement', 'value', 'selectionStart', 'selectionEnd',
      'selectionDirection', 'setSelectionRange', 'get', 'set', 'function', 'boolean', 'number', 'undefined',
      'object', 'string', 'symbol', 'null', 'absent', 'present', 'unchanged', 'restored', 'inactive', 'pass-through']);
    const pieces = value.split(/[.:]/);
    return pieces.length <= 3 && pieces.every(piece => words.has(piece)) ? value : '[nonstructural-string-omitted]';
  }
  if (Array.isArray(value)) return value.slice(0, TOP).map(item => structuralProof(item, depth + 1, budget));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, item]) => [safeLabel(key, 80), structuralProof(item, depth + 1, budget)]));
  return '[unsupported-proof-field]';
}

function eventAssociations(spans, window, beforeInputs) {
  return spans.filter(span => span.type === 'EventDispatch' && overlaps(span, window))
    .sort((a, b) => (b.endMs - b.startMs) - (a.endMs - a.startMs) || a.startMs - b.startMs).slice(0, TOP)
    .map(event => {
      const nested = spans.filter(span => span !== event && ['Layout', 'UpdateLayoutTree', 'FunctionCall'].includes(span.type)
        && within(span, event) && contained(span, window));
      const markers = beforeInputs.filter(row => row.at >= event.startMs && row.at <= event.endMs);
      return { event: spanRecord(event, window), beforeInputMarkerCount: markers.length,
        beforeInputSequenceExamples: markers.slice(0, TOP).map(row => row.sequence),
        fullyContainedNestedSpans: Object.fromEntries(['Layout', 'UpdateLayoutTree', 'FunctionCall'].map(type => [type, totals(nested.filter(span => span.type === type))])),
        nestedCombinedUnionMs: unionMs(nested),
        association: 'Temporal containment only; FunctionCall can contain Layout and style work. Inclusive or per-type durations must not be added as exclusive cost or interpreted as causality.' };
    });
}

function setterSummary(calls, window, spans, traceVerified) {
  const inside = calls.filter(call => contained(call, window)), boundary = calls.filter(call => overlaps(call, window) && !contained(call, window));
  const byKind = new Map();
  for (const call of inside) {
    const group = byKind.get(call.kind) ?? []; group.push(call); byKind.set(call.kind, group);
  }
  const extra = selected => ({ ...totals(selected),
    measuredDurationSumMs: rounded(selected.reduce((sum, call) => sum + call.measuredDurationMs, 0)),
    sameSelectionRangeBeforeAfterCount: selected.filter(call => call.sameRangeBeforeAfter === true).length,
    requestedRangeAlreadyCurrentCount: selected.filter(call => call.requestedRange && call.requestedAlreadyCurrent === true && call.threw === false).length,
    threwCount: selected.filter(call => call.threw === true).length });
  return {
    analysisStatus: window.valid ? 'SCOPED-BROWSER-TIMELINE-COUNTS' : 'UNVERIFIED-INPUT-WINDOW',
    fullyContained: extra(inside), boundaryOverlap: { ...extra(boundary), ...totals(boundary, window) },
    kinds: [...byKind].sort((a, b) => b[1].length - a[1].length).slice(0, TOP).map(([kind, items]) => ({ kind, ...extra(items) })),
    distinctKinds: byKind.size,
    topDurations: inside.concat(boundary).sort((a, b) => b.measuredDurationMs - a.measuredDurationMs).slice(0, TOP).map(call => {
      const nested = traceVerified ? spans.filter(span => ['Layout', 'UpdateLayoutTree'].includes(span.type) && within(span, call) && contained(span, window)) : null;
      return { id: call.id, kind: call.kind, startAtMs: rounded(call.startMs), endAtMs: rounded(call.endMs),
        durationMs: rounded(call.measuredDurationMs), fullyContainedInPhase: contained(call, window),
        before: call.before, after: call.after, requestedRange: call.requestedRange,
        sameRangeBeforeAfter: call.sameRangeBeforeAfter, requestedAlreadyCurrent: call.requestedAlreadyCurrent, threw: call.threw,
        containedLayoutAndStyle: nested === null ? null : { ...totals(nested), combinedUnionMs: unionMs(nested) } };
    }),
    qualification: 'Range equivalence does not prove a value write was redundant. Getter probes used to capture before/after ranges can perturb layout and the observed native path; observed nesting is not exclusive setter causality.',
  };
}

/**
 * @param {Array|{traceEvents:Array}} traceEvents Chrome trace events (ts/dur in microseconds).
 * @param {object} timeline Browser diagnostic with performance.now millisecond input/setter rows.
 * @returns {object} Bounded public structural summary; never dumps args, text, key values, origins, or query strings.
 */
export function summarizeNativePipelineTrace(traceEvents, timeline = {}) {
  const supplied = Array.isArray(traceEvents) ? traceEvents : array(traceEvents?.traceEvents);
  const events = supplied.slice(0, MAX_EVENTS);
  const alignment = align(events, timeline), reconstructed = reconstruct(events);
  const traceVerified = alignment.offsetMs !== null;
  const renderer = alignment.public.mainRenderer;
  const spans = traceVerified ? reconstructed.spans.filter(span => span.pid === renderer.pid && span.tid === renderer.tid)
    .map(span => ({ ...span, startMs: span.traceStartUs / 1000 - alignment.offsetMs, endMs: span.traceEndUs / 1000 - alignment.offsetMs })) : [];
  const input = timeline.input ?? {}, first = alignment.beforeInputs[0]?.at, last = alignment.beforeInputs.at(-1)?.at;
  const phases = { fullInput: phase(input.callStartAt, input.returnedAt), strictPreFinalInput: phase(first, last, true) };
  const rawCalls = array(timeline.setterCalls);
  const calls = rawCalls.filter(call => finite(call?.startAt) && finite(call?.endAt) && call.endAt >= call.startAt
    && (!finite(call.durationMs) || call.durationMs >= 0)).map(setterRecord);
  const dataLoss = typeof timeline.traceDataLossOccurred === 'boolean' ? timeline.traceDataLossOccurred
    : typeof timeline.traceClockMarkers?.dataLossOccurred === 'boolean' ? timeline.traceClockMarkers.dataLossOccurred : null;
  const descriptor = timeline.setterDescriptorProof;
  const summaryPhases = {};
  for (const [name, window] of Object.entries(phases)) {
    const intersecting = traceVerified ? spans.filter(span => overlaps(span, window)) : [];
    summaryPhases[name] = {
      bounds: window,
      traceAnalysisStatus: traceVerified && window.valid ? 'SCOPED-TEMPORAL-COUNTS' : 'UNVERIFIED-CLOCK-OR-WINDOW',
      byType: traceVerified && window.valid ? Object.fromEntries(TYPES.map(type => {
        const selected = intersecting.filter(span => span.type === type);
        return [type, { fullyContained: totals(selected.filter(span => contained(span, window))),
          boundaryOverlap: totals(selected.filter(span => !contained(span, window)), window) }];
      })) : null,
      combinedAllTypesUnionIntersectingMs: traceVerified && window.valid ? unionMs(intersecting, window) : null,
      topDurations: traceVerified && window.valid ? intersecting.sort((a, b) => (b.endMs - b.startMs) - (a.endMs - a.startMs)).slice(0, TOP).map(span => spanRecord(span, window)) : [],
      eventAssociations: traceVerified && window.valid ? eventAssociations(spans, window, alignment.beforeInputs) : [],
      nativeSetters: setterSummary(calls, window, spans, traceVerified),
    };
  }
  const complete = traceVerified && dataLoss === false && events.length === supplied.length
    && phases.fullInput.valid && phases.strictPreFinalInput.valid && rawCalls.length === calls.length
    && reconstructed.counts.incompleteSelectedBegins === 0 && reconstructed.counts.selectedUnmatchedEnds === 0
    && reconstructed.counts.invalidDurations === 0;
  return {
    status: complete ? 'COMPLETE-SCOPED-DIAGNOSTIC-SUMMARY-NOT-ACCEPTANCE' : 'UNVERIFIED-OR-PARTIAL-DIAGNOSTIC-SUMMARY',
    clockAlignment: alignment.public,
    integrity: { dataLossOccurred: dataLoss, allBeforeInputMarkersPresent: alignment.public.allBeforeInputMarkersPresent,
      suppliedTraceEvents: supplied.length, analyzedTraceEvents: events.length, traceInputTruncated: events.length !== supplied.length,
      capturedSetterCalls: rawCalls.length, validSetterCalls: calls.length, invalidSetterCalls: rawCalls.length - calls.length,
      reconstructedSelectedSpansAcrossAllThreads: reconstructed.spans.length, selectedMainRendererSpans: traceVerified ? spans.length : null,
      reconstruction: reconstructed.counts },
    setterDescriptorProof: {
      restorationStatus: descriptor?.descriptorsRestoredExactly === true ? 'VERIFIED-BY-RUNTIME-STRUCTURAL-COMPARISON' : 'UNVERIFIED-OR-NOT-RESTORED',
      descriptorsRestoredExactly: typeof descriptor?.descriptorsRestoredExactly === 'boolean' ? descriptor.descriptorsRestoredExactly : null,
      structuralProof: descriptor ? structuralProof(descriptor) : null,
      qualification: 'Proof is supplied by runtime descriptor comparison, not inferred from trace. React may retain reference-bound wrappers captured before mount; after stop these must be inactive pass-through delegates until context close. No React-owned instance descriptor mutation is inferred.',
    },
    phases: summaryPhases,
    quantificationLimits: [
      'Diagnostic instrumentation perturbs execution; this report does not replace acceptance latency failures or demonstrate field INP.',
      'The fully contained strict interval starts at the first beforeinput and ends strictly before the final beforeinput. Boundary-overlapping events are retained separately and can include automatic result work.',
      'Trace inclusive durations nest. Union spans remove temporal double counting but do not identify exclusive CPU, renderer idle time, or causality. Do not add per-type unions or call program samples layout.',
      'Event and setter associations are temporal containment only. Before/after selection getter probes may trigger or alter style/layout work.',
      'Unmatched B/E spans and durations cut by trace capture remain unquantified. Source URLs are reduced to public HTTP(S) pathnames; raw arguments, typed text, key values, and URL queries are omitted.',
      'Top durations and associations are limited to15 rows each. The runtime retains ignored raw trace/timeline files; this pure function does not read or write them.',
    ],
  };
}
