// Prepared diagnostic only; execution requires a separately coordinated window.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SELECTION_GETTER_DIAGNOSTIC, '1', 'Wait for root GO before starting this diagnostic.');
const directory = 'audit/2026-10-27';
const prefix = process.argv[2] ?? 'final22-selection-getters-native';
assert.match(prefix, /^final22-[a-z0-9-]+$/);
const sourceFile = `${directory}/final22-source.json`;
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const generatedFile = `${directory}/.${prefix}.generated.mjs`;
const rawGettersFile = `${directory}/.${prefix}.getters.json`;
const rawTraceFile = `${directory}/.${prefix}.trace.json`;
const summaryFile = `${directory}/${prefix}-summary.json`;
const protocolFile = `${directory}/${prefix}-protocol.json`;
for (const file of [generatedFile, rawGettersFile, rawTraceFile, summaryFile, protocolFile, `${directory}/${prefix}.json`])
  await assert.rejects(access(file), { code: 'ENOENT' }, 'Preserve every prior diagnostic under its original name.');
const frozen = await verifyFrozenSource(sourceFile);
assert.equal(frozen.frozen.local.version, 'f957b00588200c8f376e');
assert.equal(frozen.receipt.compared, 504);
assert.deepEqual(frozen.receipt.mismatches, []);
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), frozen.frozen.local);
const original = await readFile(originalFile, 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');

function installSelectionGetterDiagnostic() {
  const prototype = HTMLTextAreaElement.prototype;
  const names = ['selectionStart', 'selectionEnd'];
  const descriptors = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(prototype, name)]));
  for (const descriptor of descriptors.values())
    if (!descriptor || !descriptor.configurable || typeof descriptor.get !== 'function')
      throw new Error('Configurable native textarea selection getters are required.');
  const blank = () => ({ count: 0, totalMs: 0, maxMs: 0, throws: 0 });
  const getters = Object.fromEntries(names.map(name => [name, blank()]));
  const eventTypes = new Set(['keydown', 'keypress', 'keyup', 'beforeinput', 'input', 'select', 'selectionchange',
    'focus', 'blur', 'focusin', 'focusout', 'compositionstart', 'compositionupdate', 'compositionend']);
  const byEventType = {};
  const events = [];
  const intervals = [];
  const slowStacks = [];
  const eventRecords = new WeakMap();
  const caps = { eventRecords: false, intervals: false, slowStacks: false };
  let nextEventId = 1;
  let finished = false;
  const update = (row, duration, threw) => {
    row.count++; row.totalMs += duration; row.maxMs = Math.max(row.maxMs, duration);
    if (threw) row.throws++;
  };
  const record = (property, startTime, endTime, threw) => {
    const duration = endTime - startTime;
    update(getters[property], duration, threw);
    // Chromium exposes the actual current dispatch through window.event. No
    // listeners, dispatch rewrites, DOM reads or event-property mutations occur.
    const current = window.event;
    const actualEvent = current instanceof Event ? current : null;
    const type = actualEvent ? eventTypes.has(actualEvent.type) ? actualEvent.type : 'other-native-event' : 'outside-native-dispatch';
    const typeRow = byEventType[type] ??= Object.fromEntries(names.map(name => [name, blank()]));
    update(typeRow[property], duration, threw);
    let eventRecord = actualEvent ? eventRecords.get(actualEvent) : null;
    if (actualEvent && !eventRecord) {
      eventRecord = { id: nextEventId++, type, firstGetterStartMs: startTime, lastGetterEndMs: endTime,
        getters: Object.fromEntries(names.map(name => [name, blank()])) };
      eventRecords.set(actualEvent, eventRecord);
      if (events.length < 12000) events.push(eventRecord); else caps.eventRecords = true;
    }
    if (eventRecord) {
      eventRecord.lastGetterEndMs = endTime;
      update(eventRecord.getters[property], duration, threw);
    }
    if (intervals.length < 30000)
      intervals.push({ property, startTime, endTime, duration, threw, eventId: eventRecord?.id ?? null, eventType: type });
    else caps.intervals = true;
    if (duration >= 2) {
      if (slowStacks.length < 40)
        slowStacks.push({ property, startTime, endTime, duration, eventId: eventRecord?.id ?? null, eventType: type,
          stack: new Error('selection-getter-diagnostic').stack });
      else caps.slowStacks = true;
    }
  };
  for (const name of names) {
    const descriptor = descriptors.get(name);
    const nativeGetter = descriptor.get;
    Object.defineProperty(prototype, name, { ...descriptor, get: function () {
      const startTime = performance.now();
      let returned = false;
      try {
        const result = Reflect.apply(nativeGetter, this, []);
        returned = true;
        return result;
      } finally {
        const endTime = performance.now();
        // Accounting happens after the native call and cannot replace its
        // return value or original exception, even if diagnostics fail.
        try { record(name, startTime, endTime, !returned); } catch { /* Preserve native behavior. */ }
      }
    } });
  }
  window.sparowSelectionGetterDiagnostic = {
    finish() {
      if (finished) throw new Error('Selection getter descriptors have already been restored.');
      finished = true;
      for (const [name, descriptor] of descriptors) Object.defineProperty(prototype, name, descriptor);
      return { getters, byEventType, events, intervals, slowStacks, caps, descriptorsRestored: true,
        setterDescriptorsUnchanged: [...descriptors].every(([name, descriptor]) => Object.getOwnPropertyDescriptor(prototype, name).set === descriptor.set),
        nativeEventAttribution: 'Actual Chromium window.event object identity via WeakMap; no inferred timing ownership.' };
    },
  };
}

function summarizeGetterDiagnostic(raw, trace, before, after) {
  const metrics = source => Object.fromEntries(source.metrics.filter(item => ['Timestamp', 'NavigationStart', 'TaskDuration',
    'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount'].includes(item.name)).map(item => [item.name, item.value]));
  const first = metrics(before), last = metrics(after), navigation = first.NavigationStart;
  if (!Number.isFinite(navigation) || navigation <= 0 || navigation !== last.NavigationStart)
    throw new Error('Native getter/trace alignment needs unchanged NavigationStart.');
  const candidates = new Map();
  for (const event of trace.traceEvents ?? []) {
    if (event.name !== 'EventDispatch' || event.args?.data?.type !== 'keypress') continue;
    const key = `${event.pid}:${event.tid}`;
    const row = candidates.get(key) ?? { pid: event.pid, tid: event.tid, count: 0 }; row.count++; candidates.set(key, row);
  }
  const renderers = [...candidates.values()];
  if (renderers.length !== 1 || renderers[0].count !== 495) throw new Error('Exactly one owned renderer with495 actual keypresses is required.');
  const renderer = renderers[0];
  const native = (trace.traceEvents ?? []).filter(event => event.pid === renderer.pid && event.tid === renderer.tid &&
    event.ph === 'X' && ['Layout', 'UpdateLayoutTree'].includes(event.name) && Number.isFinite(event.dur)).map((event, index) => ({
      index, name: event.name, startTime: event.ts / 1000 - navigation * 1000,
      endTime: (event.ts + event.dur) / 1000 - navigation * 1000, duration: event.dur / 1000,
    })).sort((a, b) => a.startTime - b.startTime);
  const blank = () => ({ gettersWithContainedNativeWork: 0, containedLayoutCount: 0, containedLayoutMs: 0,
    containedStyleCount: 0, containedStyleMs: 0, boundaryOverlapCount: 0 });
  const byGetter = { selectionStart: blank(), selectionEnd: blank() };
  const byEventType = {};
  const containedIndices = new Set();
  const slowIntervals = [];
  let cursor = 0;
  for (const interval of raw.intervals) {
    while (cursor < native.length && native[cursor].endTime < interval.startTime) cursor++;
    const work = [];
    let boundaries = 0;
    for (let i = cursor; i < native.length && native[i].startTime <= interval.endTime; i++) {
      const event = native[i];
      if (event.endTime < interval.startTime) continue;
      if (event.startTime >= interval.startTime && event.endTime <= interval.endTime) {
        work.push(event); containedIndices.add(event.index);
      } else boundaries++;
    }
    const apply = row => {
      if (work.length) row.gettersWithContainedNativeWork++;
      row.boundaryOverlapCount += boundaries;
      for (const event of work) {
        if (event.name === 'Layout') { row.containedLayoutCount++; row.containedLayoutMs += event.duration; }
        else { row.containedStyleCount++; row.containedStyleMs += event.duration; }
      }
    };
    apply(byGetter[interval.property]);
    apply(byEventType[interval.eventType] ??= blank());
    if (work.length) slowIntervals.push({ ...interval, containedNativeWork: work.map(event => ({ name: event.name, durationMs: event.duration })) });
  }
  const frames = stack => {
    const found = [];
    for (const line of String(stack ?? '').split('\n')) {
      const match = line.match(/https?:\/\/[^/\s]+\/assets\/([A-Za-z0-9._-]+\.js):(\d+):(\d+)/);
      if (match) found.push({ asset: match[1], line: Number(match[2]), column: Number(match[3]) });
      if (found.length >= 12) break;
    }
    return found;
  };
  const slowGetters = raw.slowStacks.map(item => ({ property: item.property, startTime: item.startTime, durationMs: item.duration,
    eventId: item.eventId, eventType: item.eventType, compiledFrames: frames(item.stack) })).sort((a, b) => b.durationMs - a.durationMs);
  const eventCost = event => Object.values(event.getters).reduce((sum, row) => sum + row.totalMs, 0);
  const metricDeltas = {};
  for (const name of ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount'])
    if (Number.isFinite(first[name]) && Number.isFinite(last[name])) metricDeltas[name] = last[name] - first[name];
  return { status: 'DIAGNOSTIC-NOT-ACCEPTANCE', getters: raw.getters, getterCountsByActualEventType: raw.byEventType,
    actualEventsWithGetterCalls: raw.events.length, recordedGetterIntervals: raw.intervals.length, caps: raw.caps,
    descriptorsRestored: raw.descriptorsRestored, setterDescriptorsUnchanged: raw.setterDescriptorsUnchanged,
    nativeEventAttribution: raw.nativeEventAttribution, renderer, metricDeltas,
    nativeWorkInsideSynchronousGetters: { containment: 'Whole native Layout/UpdateLayoutTree event strictly within real native getter start/end; zero tolerance or clock adjustment. Boundary overlaps separately excluded from contained totals.',
      byGetter, byEventType, distinctContainedNativeEvents: containedIndices.size, totalNativeEvents: native.length,
      topContainedIntervals: slowIntervals.sort((a, b) => b.duration - a.duration).slice(0, 20) },
    slowGetterStackCapture: 'First40 calls taking at least2ms, sorted for display; not an uncapped ranking of every call.',
    slowGetters, slowActualEvents: [...raw.events].sort((a, b) => eventCost(b) - eventCost(a)).slice(0, 20),
    alignment: { before: first, after: last, unchangedNavigation: true, traceToDocumentMilliseconds: 'trace.ts / 1000 - NavigationStart * 1000' },
    limits: ['Native getter durations exclude accounting/stack capture; tracing and instrumentation still perturb later work. No input acceptance or physical-device/field-INP claim.',
      'Whole native style/layout events contained by a synchronous native getter are direct timing witnesses; caller stacks and invalidation ownership still require source review.',
      'Performance clock quantization can miss boundary work. Caps remain explicit; all aggregate getter totals continue after detailed-record caps.',
      'Only counts, numeric timing, standard event types and compiled asset basenames/source locations are public. Selection values, typed text, arbitrary URLs and raw stacks are excluded.'] };
}

const replacements = [];
let generated = original;
function replaceOnce(from, to, description) {
  assert.equal(generated.split(from).length, 2, `Unique adapter boundary required: ${description}`);
  generated = generated.replace(from, to); replacements.push({ from, to, description });
}
replaceOnce("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`, 'Output path');
replaceOnce('  let resize = null;', `  await page.evaluate(${installSelectionGetterDiagnostic.toString()});
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  const selectionMetricsBefore = await cdp.send('Performance.getMetrics');
  const selectionTraceComplete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReturnAsStream' });
  let resize = null;`, 'Native descriptor-preserving getter accounting and narrowly scoped native trace before unchanged original typing');
replaceOnce('  const observation = await page.evaluate(() => window.typingBench);', `  const getterDiagnostic = await page.evaluate(() => window.sparowSelectionGetterDiagnostic.finish());
  await writeFile('${rawGettersFile}', JSON.stringify(getterDiagnostic), { flag: 'wx' });
  await cdp.send('Tracing.end');
  const selectionTrace = await Promise.race([selectionTraceComplete, new Promise((_,reject) => { const timer=setTimeout(() => reject(new Error('Native trace completion exceeded10000ms')),10000); timer.unref(); })]);
  if (!selectionTrace.stream) throw new Error('Native selection diagnostic trace stream missing');
  let selectionTraceBody = '', selectionTraceBytes = 0;
  try {
    while (true) {
      const part = await cdp.send('IO.read', { handle: selectionTrace.stream, size: 1024 * 1024 });
      const bytes = part.base64Encoded ? Buffer.from(part.data,'base64') : Buffer.from(part.data);
      selectionTraceBytes += bytes.length;
      if (selectionTraceBytes > 64 * 1024 * 1024) throw new Error('Native selection trace exceeded64MiB cap');
      selectionTraceBody += bytes.toString('utf8');
      if (part.eof) break;
    }
  } finally { await cdp.send('IO.close', { handle: selectionTrace.stream }); }
  await writeFile('${rawTraceFile}', selectionTraceBody, { flag: 'wx' });
  const selectionMetricsAfter = await cdp.send('Performance.getMetrics');
  const getterSummary = (${summarizeGetterDiagnostic.toString()})(getterDiagnostic,JSON.parse(selectionTraceBody),selectionMetricsBefore,selectionMetricsAfter);
  await writeFile('${summaryFile}', JSON.stringify({ ...getterSummary, build, rawTraceBytes: selectionTraceBytes, rawFilesIgnored: true },null,2), { flag: 'wx' });
  const observation = await page.evaluate(() => window.typingBench);`, 'Restore native descriptors, persist ignored raw traces/stacks and safe bounded summary, then unchanged original export and assertions');
let reversed = generated;
for (const item of [...replacements].reverse()) reversed = reversed.replace(item.to, item.from);
assert.equal(reversed, original);
await writeFile(generatedFile, generated, { flag: 'wx' });
await writeFile(protocolFile, JSON.stringify({ declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN',
  scope: 'One selection getter timing/caller/native-layout diagnostic only. No handler removal, React internals, getter/setter result changes, added geometry reads, clock changes or production edits.',
  sourceFile, sourceBefore: frozen.receipt, build: frozen.frozen.local,
  originalFile, originalSha256: hash(original), generatedFile, generatedSha256: hash(generated),
  originalActionsAndAssertionsRestoredExactly: true, nativeGetterReceiverArgumentsReturnAndThrowsPreserved: true,
  setterAndDescriptorFlagsPreserved: true, traceCategories: ['devtools.timeline'],
  cpuThrottle: 4, repetitions: 16, characters: 495, requestedDelayMs: 0,
  viewport: { width: 390, height: 844 }, realRotation: { width: 844, height: 390 }, originalWatchdogMs: 150000,
  fontsAndFiniteAnimationsSettled: true, caps: { getterIntervals: 30000, perEventRecords: 12000, slowStacks: 40,
    stackCaptureMinimumNativeMs: 2, publicContainedIntervals: 20, publicSlowActualEvents: 20, compiledFramesPerStack: 12, rawTraceBytes: 64 * 1024 * 1024 },
  rawGettersFile, rawTraceFile, summaryFile, rawPrivacy: 'Dot-prefixed .final22 files are covered by the existing audit/**/.final* ignore rule; never stage raw traces or URL stacks.',
  cleanup: 'Native descriptors restored before original result export; the unchanged original finally/watchdog closes the owned browser even on diagnostics failure.',
  acceptanceStatus: 'NOT-MEASURED-BY-THIS-DIAGNOSTIC',
}, null, 2) + '\n', { flag: 'wx' });
process.env.TYPING_BENCH_CPU_RATE = '4';
process.env.TYPING_BENCH_REPETITIONS = '16';
process.env.TYPING_BENCH_DELAY_MS = '0';
process.env.TYPING_BENCH_SETTLE = '1';
process.env.TYPING_BENCH_REPORT_NAME = prefix;
process.env.TYPING_BENCH_BUILD_FILE = sourceFile;
await import(`./.${prefix}.generated.mjs`);
const after = await verifyFrozenSource(sourceFile);
assert.deepEqual(after.receipt.mismatches, []);
assert.equal(hash(await readFile(originalFile, 'utf8')), hash(original));
console.log(JSON.stringify({ status: 'DIAGNOSTIC-COMPLETE-NOT-ACCEPTANCE', summaryFile, originalDriverUnchanged: true, sourceUnchanged: true }));
