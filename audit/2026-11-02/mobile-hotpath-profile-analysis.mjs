// Pure audit analysis. This module reads no files and starts no instrumentation.
const LIMITS = Object.freeze({ nodes: 100000, samples: 500000, events: 20000, frames: 1024, scriptsPerFrame: 64, tasks: 20000, stackDepth: 256, top: 20 });
const finite = value => typeof value === 'number' && Number.isFinite(value);
const number = value => finite(value) ? value : null;
const rounded = value => finite(value) ? Math.round(value * 1000) / 1000 : null;
const label = (value, fallback = '') => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 160) : fallback;
const array = value => Array.isArray(value) ? value : [];
const overlap = (a, b, c, d) => Math.max(0, Math.min(b, d) - Math.max(a, c));

function resourcePath(value) {
  if (typeof value !== 'string' || !value) return '';
  const raw = value.slice(0, 4000);
  if (raw.startsWith('data:')) return '[data-script]';
  if (raw.startsWith('blob:')) return '[blob-script]';
  try {
    const url = new URL(raw, 'https://audit.invalid/');
    if (url.protocol === 'file:') return `file:[${url.pathname.split('/').at(-1).slice(0, 120)}]`;
    if (!['https:', 'http:'].includes(url.protocol)) return '[other-script-url]';
    return label(url.pathname).slice(0, 256);
  } catch { return label(raw.split(/[?#]/)[0].replaceAll('\\', '/').split('/').at(-1)); }
}

function metric(response, name) {
  const found = array(response?.metrics).find(item => item?.name === name);
  return number(found?.value);
}

function clockAlignment(profile, diagnostic) {
  const navigationBefore = metric(diagnostic.performanceBefore, 'NavigationStart');
  const navigationAfter = metric(diagnostic.performanceAfter, 'NavigationStart');
  const timestampBefore = metric(diagnostic.performanceBefore, 'Timestamp');
  const timestampAfter = metric(diagnostic.performanceAfter, 'Timestamp');
  const start = number(profile?.startTime), end = number(profile?.endTime);
  const exact = navigationBefore !== null && navigationBefore > 0 && navigationBefore === navigationAfter &&
    timestampBefore !== null && timestampAfter !== null && timestampAfter >= timestampBefore &&
    start !== null && end !== null && end >= start && start / 1e6 >= timestampBefore && end / 1e6 <= timestampAfter;
  if (exact) return {
    status: 'VERIFIED-SCOPED-TIME-TICKS-BOUNDS', method: 'Profiler microsecond TimeTicks minus unchanged CDP NavigationStart',
    profileStartPerformanceNowMs: start / 1000 - navigationBefore * 1000, uncertaintyMs: 0,
    navigationBeforeSeconds: navigationBefore, navigationAfterSeconds: navigationAfter,
    timestampBeforeSeconds: timestampBefore, timestampAfterSeconds: timestampAfter,
    profileStartMicroseconds: start, profileEndMicroseconds: end,
    rangeChecksPassed: true,
  };
  const before = number(diagnostic.profileClockBracket?.beforePerformanceNow);
  const after = number(diagnostic.profileClockBracket?.afterPerformanceNow);
  const bracketUsable = before !== null && after !== null && after >= before;
  return {
    status: 'UNVERIFIED-TIME-TICKS-ALIGNMENT', method: bracketUsable ? 'Conservative Profiler.start performance.now bracket fallback' : 'No usable clock mapping',
    profileStartPerformanceNowMs: bracketUsable ? (before + after) / 2 : null,
    uncertaintyMs: bracketUsable ? (after - before) / 2 : null,
    navigationBeforeSeconds: navigationBefore, navigationAfterSeconds: navigationAfter,
    timestampBeforeSeconds: timestampBefore, timestampAfterSeconds: timestampAfter,
    profileStartMicroseconds: start, profileEndMicroseconds: end,
    rangeChecksPassed: false, bracketBeforePerformanceNowMs: before, bracketAfterPerformanceNowMs: after,
  };
}

function interval(start, end, exclusiveEnd = false) {
  return { startMs: number(start), endMs: number(end), exclusiveEnd,
    valid: finite(start) && finite(end) && end >= start, empty: finite(start) && finite(end) && end === start };
}

function contained(start, end, phase) {
  return phase.valid && !phase.empty && finite(start) && finite(end) && start >= phase.startMs &&
    (phase.exclusiveEnd ? end < phase.endMs : end <= phase.endMs);
}

function frameRecord(frame, index) {
  const start = number(frame?.startTime), duration = number(frame?.duration);
  return { index, startTime: start, duration, endTime: start !== null && duration !== null ? start + duration : null,
    blockingDuration: number(frame?.blockingDuration), renderStart: number(frame?.renderStart),
    styleAndLayoutStart: number(frame?.styleAndLayoutStart), firstUIEventTimestamp: number(frame?.firstUIEventTimestamp),
    originalScriptCount: array(frame?.scripts).length,
    scripts: array(frame?.scripts).slice(0, LIMITS.scriptsPerFrame).map(script => ({
      executionStart: number(script?.executionStart), duration: number(script?.duration),
      forcedStyleAndLayoutDuration: number(script?.forcedStyleAndLayoutDuration), pauseDuration: number(script?.pauseDuration),
      resourcePath: resourcePath(script?.sourceURL), functionName: label(script?.sourceFunctionName, '(unreported)'),
      sourceCharPosition: number(script?.sourceCharPosition), invoker: label(script?.invoker), invokerType: label(script?.invokerType),
    })),
  };
}

function functionRecord(node) {
  const frame = node?.callFrame ?? {};
  const value = { functionName: label(frame.functionName) || '(anonymous)', resourcePath: resourcePath(frame.url),
    lineNumber: number(frame.lineNumber), columnNumber: number(frame.columnNumber) };
  return { ...value, key: JSON.stringify(value) };
}

function topFunctions(weights, assignedWeightMs, field) {
  return [...weights.values()].sort((left, right) => right[field] - left[field] || left.key.localeCompare(right.key)).slice(0, LIMITS.top)
    .map(({ key, ...row }) => ({ ...row, selfSampleWeightMs: rounded(row.selfSampleWeightMs),
      inclusiveSampleWeightMs: rounded(row.inclusiveSampleWeightMs),
      shareOfAssignedSampleWeight: assignedWeightMs > 0 ? rounded(row[field] / assignedWeightMs) : null }));
}

/** Sampling and overlap evidence only. No returned field certifies latency or causality. */
export function summarizeHotpathProfile(profile = {}, diagnostic = {}) {
  const alignment = clockAlignment(profile, diagnostic);
  const input = diagnostic.input ?? {};
  const insertions = array(input.beforeInputs).filter(item => finite(item?.at)).slice(0, LIMITS.events).sort((a, b) => a.at - b.at);
  const firstInsertion = insertions[0]?.at ?? null, lastInsertion = insertions.at(-1)?.at ?? null;
  const phases = {
    fullInputCall: interval(input.callStartAt, input.returnedAt),
    strictPreFinalInsertion: interval(firstInsertion, lastInsertion, true),
    finalInsertionAndReturn: interval(lastInsertion, input.returnedAt),
  };
  const rawNodes = array(profile.nodes), nodes = rawNodes.slice(0, LIMITS.nodes);
  const nodeById = new Map(nodes.filter(node => Number.isInteger(node?.id)).map(node => [node.id, node]));
  const parentById = new Map();
  for (const node of nodes) for (const child of array(node.children)) if (!parentById.has(child)) parentById.set(child, node.id);
  const functions = new Map([...nodeById].map(([id, node]) => [id, functionRecord(node)]));
  const samples = array(profile.samples), deltas = array(profile.timeDeltas);
  const count = Math.min(samples.length, deltas.length, LIMITS.samples);
  const cpu = Object.fromEntries(Object.entries(phases).map(([name, bounds]) => [name, {
    bounds, sampledIntervalsAssigned: 0, assignedSampleWeightMs: 0, intervalsOutsideOrCrossingBounds: 0,
    missingLeafNodes: 0, stackCyclesOrDepthLimits: 0, weights: new Map(),
  }]));
  let cumulativeUs = 0, negativeDeltaCount = 0, invalidDeltaCount = 0, negativeDeltaMicroseconds = 0;
  let firstInvalidDeltaIndex = null, intervalsUnplaceableAfterInvalidDelta = 0;
  let minimumCumulativeUs = 0, maximumCumulativeUs = 0;
  const signedBacksteps = [];
  const origin = alignment.profileStartPerformanceNowMs, uncertainty = alignment.uncertaintyMs;
  for (let index = 0; index < count; index++) {
    const delta = deltas[index];
    if (!finite(delta)) { invalidDeltaCount++; firstInvalidDeltaIndex ??= index; continue; }
    const previousUs = cumulativeUs; cumulativeUs += delta;
    minimumCumulativeUs = Math.min(minimumCumulativeUs, cumulativeUs); maximumCumulativeUs = Math.max(maximumCumulativeUs, cumulativeUs);
    if (delta < 0) {
      negativeDeltaCount++; negativeDeltaMicroseconds += delta;
      if (signedBacksteps.length < LIMITS.top) signedBacksteps.push({ sampleIndex: index, deltaMicroseconds: delta, cumulativeMicroseconds: cumulativeUs });
      continue;
    }
    if (firstInvalidDeltaIndex !== null) { intervalsUnplaceableAfterInvalidDelta++; continue; }
    if (origin === null || uncertainty === null) continue;
    const earliest = origin + previousUs / 1000 - uncertainty, latest = origin + cumulativeUs / 1000 + uncertainty;
    for (const state of Object.values(cpu)) {
      if (!contained(earliest, latest, state.bounds)) { state.intervalsOutsideOrCrossingBounds++; continue; }
      const weight = delta / 1000; state.sampledIntervalsAssigned++; state.assignedSampleWeightMs += weight;
      if (!nodeById.has(samples[index])) { state.missingLeafNodes++; continue; }
      const seenNodes = new Set(), seenFunctions = new Set();
      let nodeId = samples[index], depth = 0;
      while (nodeById.has(nodeId) && depth < LIMITS.stackDepth && !seenNodes.has(nodeId)) {
        seenNodes.add(nodeId); const fn = functions.get(nodeId);
        const entry = state.weights.get(fn.key) ?? { ...fn, selfSampleWeightMs: 0, inclusiveSampleWeightMs: 0, selfSamples: 0, inclusiveSamples: 0 };
        if (depth === 0) { entry.selfSampleWeightMs += weight; entry.selfSamples++; }
        if (!seenFunctions.has(fn.key)) { entry.inclusiveSampleWeightMs += weight; entry.inclusiveSamples++; seenFunctions.add(fn.key); }
        state.weights.set(fn.key, entry); nodeId = parentById.get(nodeId); depth++;
      }
      if (nodeById.has(nodeId)) state.stackCyclesOrDepthLimits++;
    }
  }
  const frames = array(diagnostic.loafs).slice(0, LIMITS.frames).map(frameRecord);
  const tasks = array(diagnostic.longTasks).slice(0, LIMITS.tasks).filter(task => finite(task?.startTime) && finite(task?.duration));
  const names = new Set(['keydown', 'keyup', 'keypress', 'beforeinput', 'input']);
  const allEvents = array(diagnostic.events).slice(0, LIMITS.events);
  const events = allEvents.filter(event => names.has(event?.name) && finite(event.startTime) && finite(event.duration));
  const eventStatistics = list => {
    const durations = list.map(item => item.duration).sort((a, b) => a - b);
    return { status: 'DIAGNOSTIC-ONLY-NOT-AN-ACCEPTANCE-RESULT', observedEvents: list.length,
      p98ObservedDurationMs: durations.length ? durations[Math.ceil(durations.length * .98) - 1] : null,
      maxObservedDurationMs: durations.at(-1) ?? null };
  };
  const phaseSummaries = Object.fromEntries(Object.entries(cpu).map(([name, state]) => {
    const { weights, ...plain } = state;
    const framesOverlapping = state.bounds.valid ? frames.filter(frame => frame.endTime !== null && overlap(frame.startTime, frame.endTime, state.bounds.startMs, state.bounds.endMs) > 0) : [];
    const scripts = framesOverlapping.flatMap(frame => frame.scripts);
    let reportedForcedOverlap = 0, reportedForcedContained = 0, forcedUnreported = 0;
    const invokers = new Map();
    for (const script of scripts) {
      if (script.executionStart === null || script.duration === null || !state.bounds.valid ||
        overlap(script.executionStart, script.executionStart + script.duration, state.bounds.startMs, state.bounds.endMs) <= 0) continue;
      const key = script.invokerType || '(unreported)';
      const entry = invokers.get(key) ?? { invokerType: key, scripts: 0, reportedScriptDurationMs: 0, reportedForcedStyleAndLayoutMs: 0 };
      entry.scripts++; entry.reportedScriptDurationMs += script.duration;
      if (script.forcedStyleAndLayoutDuration === null) forcedUnreported++;
      else {
        entry.reportedForcedStyleAndLayoutMs += script.forcedStyleAndLayoutDuration;
        reportedForcedOverlap += script.forcedStyleAndLayoutDuration;
        if (contained(script.executionStart, script.executionStart + script.duration, state.bounds)) reportedForcedContained += script.forcedStyleAndLayoutDuration;
      }
      invokers.set(key, entry);
    }
    const matchingEvents = events.filter(event => state.bounds.valid && event.startTime >= state.bounds.startMs &&
      (state.bounds.exclusiveEnd ? event.startTime < state.bounds.endMs : event.startTime <= state.bounds.endMs));
    const matchingTasks = tasks.filter(task => state.bounds.valid && overlap(task.startTime, task.startTime + task.duration, state.bounds.startMs, state.bounds.endMs) > 0);
    return [name, { ...plain, diagnosticPhaseStatus: !state.bounds.valid || state.bounds.empty ? 'UNVERIFIED-EMPTY-OR-INVALID-PHASE' : 'DIAGNOSTIC-ONLY',
      assignedSampleWeightMs: rounded(state.assignedSampleWeightMs),
      topSelfFunctions: topFunctions(weights, state.assignedSampleWeightMs, 'selfSampleWeightMs'),
      topInclusiveFunctions: topFunctions(weights, state.assignedSampleWeightMs, 'inclusiveSampleWeightMs'),
      eventStatisticsByEventStartTime: eventStatistics(matchingEvents),
      overlappingLongAnimationFrames: framesOverlapping.length,
      reportedForcedStyleAndLayoutForOverlappingScriptsMs: rounded(reportedForcedOverlap),
      reportedForcedStyleAndLayoutForFullyContainedScriptsMs: rounded(reportedForcedContained),
      overlappingScriptsWithoutForcedLayoutField: forcedUnreported,
      invokerCategories: [...invokers.values()].map(row => ({ ...row, reportedScriptDurationMs: rounded(row.reportedScriptDurationMs), reportedForcedStyleAndLayoutMs: rounded(row.reportedForcedStyleAndLayoutMs) })),
      overlappingLongTasks: matchingTasks.length,
      maxReportedOverlappingLongTaskMs: matchingTasks.length ? Math.max(...matchingTasks.map(task => task.duration)) : null,
      overlapTotalsAreNonexclusive: true }];
  }));
  const longEventTimeline = [...events].sort((a, b) => b.duration - a.duration || a.startTime - b.startTime).slice(0, LIMITS.top).map(event => {
    const end = event.startTime + event.duration;
    const matchingFrames = frames.filter(frame => frame.endTime !== null && overlap(event.startTime, end, frame.startTime, frame.endTime) > 0);
    const matchingTasks = tasks.filter(task => overlap(event.startTime, end, task.startTime, task.startTime + task.duration) > 0);
    return { name: label(event.name), startTime: event.startTime, duration: event.duration, interactionId: number(event.interactionId),
      processingStart: number(event.processingStart), processingEnd: number(event.processingEnd),
      inputDelayMs: finite(event.processingStart) ? rounded(event.processingStart - event.startTime) : null,
      processingDurationMs: finite(event.processingEnd) && finite(event.processingStart) ? rounded(event.processingEnd - event.processingStart) : null,
      phaseMembershipByStartTime: Object.entries(phases).filter(([, phase]) => phase.valid && event.startTime >= phase.startMs && (phase.exclusiveEnd ? event.startTime < phase.endMs : event.startTime <= phase.endMs)).map(([name]) => name),
      overlapFrameCount: matchingFrames.length,
      overlappingFrames: matchingFrames.slice(0, LIMITS.top).map(frame => ({ ...frame,
        overlapWithEventSpanMs: rounded(overlap(event.startTime, end, frame.startTime, frame.endTime)) })),
      overlapLongTaskCount: matchingTasks.length, overlappingLongTasks: matchingTasks.slice(0, LIMITS.top).map(task => ({ startTime: task.startTime, duration: task.duration,
        overlapWithEventSpanMs: rounded(overlap(event.startTime, end, task.startTime, task.startTime + task.duration)) })),
    };
  });
  const loafSupport = diagnostic.supports?.longAnimationFrame ?? diagnostic.longAnimationFrameSupported;
  return {
    status: 'DIAGNOSTIC-ONLY-NOT-ACCEPTANCE-OR-CAUSAL-PROOF', caseId: label(diagnostic.caseId), clockAlignment: alignment,
    cpuProfileAvailability: !nodes.length || !samples.length || !deltas.length ? 'UNVERIFIED-EMPTY-CPU-PROFILE' :
      alignment.rangeChecksPassed ? 'CAPTURED-WITH-VERIFIED-TIME-TICKS-BOUNDS' : 'CAPTURED-WITH-UNVERIFIED-CLOCK-ALIGNMENT',
    phaseBounds: phases, firstBeforeInputAtMs: firstInsertion, lastBeforeInputAtMs: lastInsertion, observedBeforeInputCount: insertions.length,
    profilingEndAtMs: number(diagnostic.endAt),
    longAnimationFrameAvailability: loafSupport === true ? 'SUPPORTED-REPORTED-BY-OBSERVER-SETUP' : loafSupport === false ? 'UNAVAILABLE-UNVERIFIED' : 'SUPPORT-METADATA-MISSING-UNVERIFIED',
    captured: { profileNodes: rawNodes.length, profileSamples: samples.length, profileTimeDeltas: deltas.length,
      sampledIntervalsAnalyzed: count, longAnimationFrames: frames.length, longTasks: tasks.length, typingEvents: events.length,
      nonTypingEventsOutsideThisView: allEvents.length - events.length },
    signedClock: { cumulativeDeltaMicroseconds: cumulativeUs, minimumCumulativeMicroseconds: minimumCumulativeUs, maximumCumulativeMicroseconds: maximumCumulativeUs,
      negativeDeltaCount, negativeDeltaMicroseconds, negativeDeltaIntervalsExcludedFromWeights: negativeDeltaCount, signedBacksteps,
      invalidDeltaCount, firstInvalidDeltaIndex, intervalsUnplaceableAfterInvalidDelta, negativeDeltasWereNotClampedInTimeline: true },
    phaseSummaries, longEventTimeline,
    analysisBounds: { ...LIMITS, nodesTruncated: rawNodes.length > LIMITS.nodes, samplesTruncated: Math.min(samples.length, deltas.length) > LIMITS.samples,
      eventsTruncated: array(diagnostic.events).length > LIMITS.events, framesTruncated: array(diagnostic.loafs).length > LIMITS.frames,
      tasksTruncated: array(diagnostic.longTasks).length > LIMITS.tasks,
      frameScriptListsTruncated: array(diagnostic.loafs).slice(0, LIMITS.frames).some(frame => array(frame?.scripts).length > LIMITS.scriptsPerFrame),
      missingSampleOrDeltaRows: Math.abs(samples.length - deltas.length) },
    limits: [
      'The retained Learn and localBOT112ms failures are unchanged; this instrumented run cannot replace ordinary acceptance measurements.',
      'Profiler sampling, observer callbacks and added markers introduce overhead. Sample weights are approximate wall intervals associated with sampled stacks, not exact function CPU duration.',
      'CPU intervals are assigned only when their entire signed interval plus alignment uncertainty lies in a phase. Boundary-crossing and inverted intervals are excluded; negative deltas still change the cumulative timeline.',
      'Inclusive aggregation deduplicates recursive occurrences of the same function within a sample stack.',
      'Strict pre-final-insertion excludes the final Learn input and its automatic result transition; earlier asynchronous work can still overlap normal input.',
      'Events are classified by their start times; a duration may extend across phase boundaries and includes quantized presentation delay.',
      'LoAF/script/long-task totals describe overlaps and are not independent or exclusive CPU components. Only fully-contained-script forced-layout totals exclude boundary-spanning scripts.',
      'A missing LoAF field or observer is unverified, not proof of zero forced layout. Empty captures and minified names limit attribution.',
      'Resource URLs are reduced to pathnames or file basenames; query strings, fragments, origins, raw typed text, request bodies, headers and credentials are not emitted by this helper.',
      'No returned timing establishes causality, field INP, physical-phone performance or preserved3D quality; those require their separately scoped evidence.',
    ],
  };
}
