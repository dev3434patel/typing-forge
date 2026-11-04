// Explicit diagnostic instrumentation; no production imports or edits.
import assert from 'node:assert/strict';
import { access, open, readFile, writeFile } from 'node:fs/promises';
import { summarizeNativePipelineTrace } from './mobile-native-pipeline-analysis.mjs';
const active = new WeakMap();
const directory = 'audit/2026-11-02';
const byteLimit = 64 * 1024 * 1024;

export async function installNativePipelineProbe(context, caseId, protocol) {
  assert.equal(protocol.diagnostic, true);
  await context.addInitScript(({ caseId, setterProbeEnabled }) => {
    const prototype = HTMLTextAreaElement.prototype;
    const names = ['value', 'selectionStart', 'selectionEnd', 'selectionDirection', 'setSelectionRange'];
    const descriptors = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(prototype, name)]));
    const savedGet = name => descriptors.get(name)?.get;
    const range = element => ({
      start: Reflect.apply(savedGet('selectionStart'), element, []),
      end: Reflect.apply(savedGet('selectionEnd'), element, []),
      direction: Reflect.apply(savedGet('selectionDirection'), element, []),
    });
    const probe = { caseId, active: false, target: null, setterProbeEnabled, setterCalls: [],
      droppedSetterCalls: 0, observerErrors: 0, input: { callStartAt: null, returnedAt: null, beforeInputs: [] },
      droppedBeforeInputs: 0, longAnimationFrames: [], droppedLongAnimationFrames: 0,
      setterDescriptorProof: { installedBeforeReactMount: true, wrappersActiveDuringInput: false,
        capturedWrappersPassThroughAfterStop: false, descriptorsRestoredExactly: false,
        observedProperties: setterProbeEnabled ? names : [], ownReactDescriptorMutated: false,
        qualification: 'Prototype descriptors are restored exactly. React may retain its captured reference to an inactive transparent wrapper until this isolated context closes. Selection getter observations add diagnostic overhead.' },
      shapeBefore: null, shapeAfter: null, observer: null };
    const wrappers = new Map();
    function observe(kind, original, element, args) {
      if (!probe.active || element !== probe.target) return Reflect.apply(original, element, args);
      if (probe.setterCalls.length >= 8192) { probe.droppedSetterCalls++; return Reflect.apply(original, element, args); }
      let before, scrollBefore;
      try { before = range(element); scrollBefore = { top: element.scrollTop, left: element.scrollLeft }; }
      catch { probe.observerErrors++; return Reflect.apply(original, element, args); }
      const requestedRange = kind === 'setSelectionRange' ? {
        start: typeof args[0] === 'number' && Number.isFinite(args[0]) ? args[0] : null,
        end: typeof args[1] === 'number' && Number.isFinite(args[1]) ? args[1] : null,
        direction: ['forward', 'backward', 'none'].includes(args[2]) ? args[2] : args.length < 3 ? 'none' : null,
      } : null;
      const id = probe.setterCalls.length + 1;
      const markStartAt = performance.now();
      try { performance.mark(`sparow-native-setter-start-${id}`, { startTime: markStartAt }); }
      catch { probe.observerErrors++; }
      const startAt = performance.now();
      let threw = false;
      try { return Reflect.apply(original, element, args); }
      catch (error) { threw = true; throw error; }
      finally {
        const endAt = performance.now();
        try {
          performance.mark(`sparow-native-setter-end-${id}`, { startTime: endAt });
          performance.measure(`sparow-native-setter-${id}`, { start: startAt, end: endAt });
          const after = range(element);
          const sameRangeBeforeAfter = before.start === after.start && before.end === after.end && before.direction === after.direction;
          probe.setterCalls.push({ id, kind, startAt, endAt, durationMs: endAt - startAt, wrapperStartMarkOverheadMs: startAt - markStartAt, before, after,
            requestedRange, sameRangeBeforeAfter,
            requestedAlreadyCurrent: requestedRange ? requestedRange.start === before.start && requestedRange.end === before.end && requestedRange.direction === before.direction : null,
            requestedValueLength: kind === 'value' && typeof args[0] === 'string' ? args[0].length : null,
            scrollBefore, scrollAfter: { top: element.scrollTop, left: element.scrollLeft }, threw });
        } catch { probe.observerErrors++; }
      }
    }
    if (setterProbeEnabled) for (const name of names) {
      const descriptor = descriptors.get(name);
      if (!descriptor?.configurable) throw new Error(`Native diagnostic descriptor unavailable: ${name}`);
      const original = name === 'setSelectionRange' ? descriptor.value : descriptor.set;
      const wrapped = function (...args) { return observe(name, original, this, args); };
      wrappers.set(name, wrapped);
      Object.defineProperty(prototype, name, name === 'setSelectionRange' ? { ...descriptor, value: wrapped } : { ...descriptor, set: wrapped });
    }
    const beforeInput = event => {
      if (!probe.active || event.target !== probe.target || event.inputType !== 'insertText') return;
      if (probe.input.beforeInputs.length >= 4096) { probe.droppedBeforeInputs++; return; }
      const sequence = probe.input.beforeInputs.length + 1, at = performance.now();
      performance.mark(`sparow-native-beforeinput-${sequence}`, { startTime: at });
      probe.input.beforeInputs.push({ sequence, at, timeStamp: event.timeStamp });
    };
    document.addEventListener('beforeinput', beforeInput, true);
    function shape(element) {
      if (!element) return null;
      const style = getComputedStyle(element);
      return { isConnected: element.isConnected, clientWidth: element.clientWidth, clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight, scrollTop: element.scrollTop, scrollLeft: element.scrollLeft,
        wrap: element.wrap, whiteSpace: style.whiteSpace, overflowX: style.overflowX, overflowY: style.overflowY,
        fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight,
        ownReactValueDescriptorPresent: Object.hasOwn(element, 'value') };
    }
    function consumeLoafs(entries) {
      for (const entry of entries) {
        if (probe.longAnimationFrames.length >= 512) { probe.droppedLongAnimationFrames++; continue; }
        probe.longAnimationFrames.push({ startTime: entry.startTime, duration: entry.duration, blockingDuration: entry.blockingDuration,
          renderStart: entry.renderStart, styleAndLayoutStart: entry.styleAndLayoutStart,
          scripts: Array.from(entry.scripts ?? []).slice(0, 32).map(script => ({ executionStart: script.executionStart,
            duration: script.duration, forcedStyleAndLayoutDuration: script.forcedStyleAndLayoutDuration,
            invoker: String(script.invoker || '').slice(0, 120), invokerType: script.invokerType,
            sourceFunctionName: String(script.sourceFunctionName || '').slice(0, 100), sourceCharPosition: script.sourceCharPosition,
            sourceURL: (() => { try { return new URL(script.sourceURL, location.href).pathname.slice(0, 240); } catch { return 'native-or-inline'; } })() })) });
      }
    }
    const control = {
      prepare() {
        probe.target = document.activeElement;
        if (!(probe.target instanceof HTMLTextAreaElement)) throw new Error('Expected the native focused textarea.');
        probe.shapeBefore = shape(probe.target);
        if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
          probe.observer = new PerformanceObserver(list => consumeLoafs(list.getEntries()));
          probe.observer.observe({ type: 'long-animation-frame' });
        }
      },
      start() {
        probe.active = true; probe.setterDescriptorProof.wrappersActiveDuringInput = setterProbeEnabled;
        const at = performance.now(); probe.input.callStartAt = at;
        performance.mark('sparow-native-input-start', { startTime: at });
      },
      returned() {
        const at = performance.now(); probe.input.returnedAt = at;
        performance.mark('sparow-native-input-returned', { startTime: at });
        probe.active = false;
      },
      collect() {
        probe.active = false;
        if (probe.observer) { consumeLoafs(probe.observer.takeRecords()); probe.observer.disconnect(); }
        document.removeEventListener('beforeinput', beforeInput, true);
        for (const name of setterProbeEnabled ? names : []) Object.defineProperty(prototype, name, descriptors.get(name));
        probe.setterDescriptorProof.descriptorsRestoredExactly = names.every(name => {
          const old = descriptors.get(name), current = Object.getOwnPropertyDescriptor(prototype, name);
          return ['get', 'set', 'value', 'writable', 'configurable', 'enumerable'].every(key => old?.[key] === current?.[key]);
        });
        probe.setterDescriptorProof.capturedWrappersPassThroughAfterStop = true;
        probe.shapeAfter = shape(probe.target);
        const { observer, target, active, ...safe } = probe;
        return safe;
      },
    };
    window.sparowNativePipelineDiagnostic = control;
  }, { caseId, setterProbeEnabled: protocol.setterProbeEnabled === true });
}

export async function beginNativePipelineDiagnostic(page, cdp, caseId, prefix, protocol) {
  assert.equal(process.env.SPAROWTYPE_MOBILE_NATIVE_PIPELINE, '1');
  assert.ok(['learn', 'local-bot'].includes(caseId));
  assert.equal(active.has(page), false);
  const state = { cdp, caseId, stopped: false,
    rawTrace: `${directory}/.${prefix}-${caseId}-trace.json`,
    rawTimeline: `${directory}/.${prefix}-${caseId}-timeline.json`,
    summaryFile: `${directory}/${prefix}-${caseId}-pipeline-summary.json`,
    maxTraceBufferUsage: 0 };
  for (const file of [state.rawTrace, state.rawTimeline, state.summaryFile]) await assert.rejects(access(file), { code: 'ENOENT' });
  active.set(page, state);
  await page.evaluate(() => window.sparowNativePipelineDiagnostic.prepare());
  state.bufferListener = event => { state.maxTraceBufferUsage = Math.max(state.maxTraceBufferUsage, event.percentFull ?? event.value ?? 0); };
  cdp.on('Tracing.bufferUsage', state.bufferListener);
  await cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', streamFormat: 'json', streamCompression: 'none',
    bufferUsageReportingInterval: 500,
    traceConfig: { recordMode: 'recordUntilFull', traceBufferSizeInKb: 32768, enableSampling: false,
      enableSystrace: false, enableArgumentFilter: true,
      includedCategories: ['devtools.timeline', 'blink.user_timing'], excludedCategories: ['*'] } });
  state.tracing = true;
}
export async function markNativePipelineInputStart(page) {
  assert.equal(active.get(page)?.tracing, true);
  await page.evaluate(() => window.sparowNativePipelineDiagnostic.start());
}
async function endTrace(state) {
  const completed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { state.cdp.off('Tracing.tracingComplete', receive); reject(new Error('Tracing completion exceeded10000ms.')); }, 10000);
    const receive = event => { clearTimeout(timer); resolve(event); };
    state.cdp.once('Tracing.tracingComplete', receive);
  });
  await state.cdp.send('Tracing.end'); state.stopped = true;
  const complete = await completed;
  assert.ok(complete.stream, 'A streamed trace handle is required.');
  const file = await open(state.rawTrace, 'wx');
  let bytes = 0, eof = false, byteLimitExceeded = false;
  try {
    while (!eof) {
      const chunk = await state.cdp.send('IO.read', { handle: complete.stream, size: 262144 });
      const data = Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8');
      if (bytes + data.length > byteLimit) { byteLimitExceeded = true; break; }
      await file.write(data); bytes += data.length; eof = Boolean(chunk.eof);
    }
  } finally { await file.close(); await state.cdp.send('IO.close', { handle: complete.stream }); }
  return { bytes, byteLimit, byteLimitExceeded, eof, dataLossOccurred: complete.dataLossOccurred,
    maxTraceBufferUsage: state.maxTraceBufferUsage, streamed: true, screenshots: false, cpuSampling: false };
}
async function resolveLayoutNodes(cdp, trace, summary, timeline) {
  const clock = summary.clockAlignment;
  if (clock?.status !== 'VERIFIED-USER-TIMING-MARKER-ALIGNMENT') return { status: 'UNVERIFIED-CLOCK', nodes: [] };
  const references = new Map();
  const recognized = new Set(['nodeId', 'backendNodeId', 'rootNode', 'rootNodeId', 'rootBackendNodeId']);
  const visit = (value, eventName, depth = 0, field = '') => {
    if (depth > 6 || references.size >= 32 || !value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (references.size >= 32) return;
      if (recognized.has(key) && Number.isSafeInteger(item) && item > 0 && !references.has(item)) references.set(item, { id: item, field: key, eventName });
      else if (item && typeof item === 'object') visit(item, eventName, depth + 1, key || field);
    }
  };
  const events = Array.isArray(trace) ? trace : trace.traceEvents ?? [];
  for (const event of events) {
    if (!['Layout', 'UpdateLayoutTree'].includes(event.name) || event.pid !== clock.mainRenderer.pid || event.tid !== clock.mainRenderer.tid) continue;
    const at = event.ts / 1000 - clock.traceMinusPerformanceNowMs;
    if (at >= timeline.input.callStartAt && at <= timeline.input.returnedAt) visit(event.args, event.name);
    if (references.size >= 32) break;
  }
  const nodes = [];
  for (const reference of references.values()) {
    try {
      const response = await cdp.send('DOM.describeNode', { backendNodeId: reference.id, depth: 0, pierce: false });
      const node = response.node, attrs = new Map();
      for (let index = 0; index < (node.attributes?.length ?? 0); index += 2) if (['id', 'class', 'data-testid'].includes(node.attributes[index])) attrs.set(node.attributes[index], node.attributes[index + 1]);
      const safe = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : null;
      nodes.push({ reference, status: 'RESOLVED-AS-BACKEND-NODE', backendNodeId: node.backendNodeId,
        tag: safe(node.localName || node.nodeName, 40), id: safe(attrs.get('id'), 100),
        className: safe(attrs.get('class'), 280), testId: safe(attrs.get('data-testid'), 100) });
    } catch { nodes.push({ reference, status: 'UNRESOLVED-AS-BACKEND-NODE' }); }
  }
  return { status: references.size ? 'BOUNDED-TRACE-NODE-REFERENCES' : 'NO-NUMERIC-LAYOUT-NODE-REFERENCES-OBSERVED',
    maximumUniqueReferences: 32, nodes,
    qualification: 'Trace argument filtering may omit node IDs. Only numeric root/node references emitted by measured main-thread Layout/style events are queried. No DOM text, input values or arbitrary attributes are retained. A resolved node identifies trace scope, not an exclusive layout cause.' };
}
async function collect(page, state, incomplete) {
  const stream = await endTrace(state);
  state.cdp.off('Tracing.bufferUsage', state.bufferListener);
  const timeline = await page.evaluate(() => window.sparowNativePipelineDiagnostic.collect());
  timeline.trace = stream; timeline.incomplete = incomplete;
  timeline.traceDataLossOccurred = stream.dataLossOccurred;
  timeline.learnLastInputMayIncludeAutomaticResults = state.caseId === 'learn';
  timeline.botTraceEndsBeforeManualFinish = state.caseId === 'local-bot';
  await writeFile(state.rawTimeline, `${JSON.stringify(timeline, null, 2)}\n`, { flag: 'wx' });
  const traceValid = stream.eof && !stream.byteLimitExceeded && stream.dataLossOccurred === false;
  const trace = traceValid ? JSON.parse(await readFile(state.rawTrace, 'utf8')) : null;
  const summary = trace ? summarizeNativePipelineTrace(trace, timeline) : { status: 'UNVERIFIED-INCOMPLETE-TRACE' };
  const layoutNodeEvidence = trace ? await resolveLayoutNodes(state.cdp, trace, summary, timeline) : { status: 'UNVERIFIED-INCOMPLETE-TRACE', nodes: [] };
  const scripts = timeline.longAnimationFrames.flatMap(frame => frame.scripts);
  const scriptWindow = (start, end, strict) => {
    const rows = scripts.filter(script => script.executionStart >= start
      && (strict ? script.executionStart + script.duration < end : script.executionStart + script.duration <= end));
    return { fullyContainedScripts: rows.length, reportedForcedStyleAndLayoutMs: rows.reduce((sum, row) => sum + (row.forcedStyleAndLayoutDuration || 0), 0),
      topForcedLayout: rows.filter(row => row.forcedStyleAndLayoutDuration > 0).sort((a, b) => b.forcedStyleAndLayoutDuration - a.forcedStyleAndLayoutDuration).slice(0, 8),
      qualification: 'LoAF reported script work only, with full temporal containment; not an exclusive or complete renderer CPU breakdown.' };
  };
  const status = !incomplete && traceValid && timeline.setterDescriptorProof.descriptorsRestoredExactly
    ? 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE' : 'INCOMPLETE-DIAGNOSTIC';
  await writeFile(state.summaryFile, `${JSON.stringify({ status, caseId: state.caseId,
    sourceBuild: process.env.SPAROWTYPE_FINAL28_BUILD_ID, staticBuild: process.env.SPAROWTYPE_FINAL28_STATIC_BUILD_ID,
    files: { ignoredRawTrace: state.rawTrace, ignoredRawTimeline: state.rawTimeline }, trace: stream, summary,
    layoutNodeEvidence,
    nativeTextareaShape: { before: timeline.shapeBefore, after: timeline.shapeAfter },
    probeIntegrity: { setterProbeEnabled: timeline.setterProbeEnabled, setterCalls: timeline.setterCalls.length,
      observerErrors: timeline.observerErrors, droppedSetterCalls: timeline.droppedSetterCalls,
      droppedBeforeInputs: timeline.droppedBeforeInputs, droppedLongAnimationFrames: timeline.droppedLongAnimationFrames },
    longAnimationFrameEvidence: { strictPreFinalInput: scriptWindow(timeline.input.beforeInputs[0]?.at, timeline.input.beforeInputs.at(-1)?.at, true),
      fullInput: scriptWindow(timeline.input.callStartAt, timeline.input.returnedAt, false) },
    rawTypedTextCollectedByProbe: false,
    qualification: 'Timeline tracing and native setter getter/mark observations perturb execution. Source28 candidate Learn104/BOT120ms acceptance failures and all source27 failures remain unchanged. Temporal containment is association, not exclusive causality. No V8 sampling or screenshots.' }, null, 2)}\n`, { flag: 'wx' });
  active.delete(page);
  return { status, report: state.summaryFile, trace: stream, inputMarkers: {
    callStartAt: timeline.input.callStartAt, returnedAt: timeline.input.returnedAt,
    beforeInputCount: timeline.input.beforeInputs.length,
    firstBeforeInputAt: timeline.input.beforeInputs[0]?.at ?? null,
    lastBeforeInputAt: timeline.input.beforeInputs.at(-1)?.at ?? null },
    setterCalls: timeline.setterCalls.length, descriptorsRestoredExactly: timeline.setterDescriptorProof.descriptorsRestoredExactly };
}
export async function endNativePipelineDiagnostic(page) {
  const state = active.get(page); assert.ok(state?.tracing && !state.stopped);
  await page.evaluate(() => window.sparowNativePipelineDiagnostic.returned());
  return collect(page, state, false);
}
export async function abortNativePipelineDiagnostic(page) {
  const state = active.get(page); if (!state) return null;
  if (!state.tracing || state.stopped) {
    try { await page.evaluate(() => window.sparowNativePipelineDiagnostic.collect()); } catch { /* Context closure discards isolated state. */ }
    active.delete(page);
    return { status: 'INCOMPLETE-DIAGNOSTIC', reason: 'Trace did not start or stopped before its summary completed.' };
  }
  try { return await collect(page, state, true); }
  catch (error) {
    try { await page.evaluate(() => window.sparowNativePipelineDiagnostic.collect()); } catch { /* Context closure also discards the isolated prototypes. */ }
    active.delete(page); return { status: 'INCOMPLETE-DIAGNOSTIC', reason: String(error.message).slice(0, 300) };
  }
}
