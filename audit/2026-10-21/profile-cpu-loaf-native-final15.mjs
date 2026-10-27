import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

assert.equal(process.env.SPAROWTYPE_CPU_LOAF_DIAGNOSTIC, '1', 'Explicit diagnostic opt-in required');
const directory = 'audit/2026-10-21';
const prefix = process.argv[2] ?? 'final15-cpu-loaf-native-diagnostic';
assert.match(prefix, /^final15-[a-z0-9-]+$/);
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const sourceFile = `${directory}/final15-source.json`;
const generatedFile = `${directory}/.${prefix}.generated.mjs`;
for (const file of [generatedFile, `${directory}/${prefix}-protocol.json`, `${directory}/${prefix}.json`, `${directory}/${prefix}-timeline.json`, `${directory}/${prefix}.cpuprofile`, `${directory}/${prefix}-stacks.json`])
  await assert.rejects(access(file), { code: 'ENOENT' });
const original = await readFile(originalFile, 'utf8');
const frozen = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(frozen.local.version, '7ef96ccd3c02d170a757');
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => {
  assert.equal(response.ok, true);
  return response.json();
});
assert.deepEqual(served, frozen.local);

function summarizeAlignedCpu(profile, before, after, timeline, performanceBefore, performanceAfter) {
  const metrics = values => Object.fromEntries(values.metrics.filter(metric => [
    'Timestamp', 'NavigationStart', 'TaskDuration', 'ScriptDuration', 'LayoutDuration',
    'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount', 'Nodes', 'JSHeapUsedSize',
  ].includes(metric.name)).map(metric => [metric.name, metric.value]));
  const firstMetrics = metrics(before), lastMetrics = metrics(after);
  const navigationStart = firstMetrics.NavigationStart;
  if (!Number.isFinite(navigationStart) || navigationStart <= 0 || navigationStart !== lastMetrics.NavigationStart)
    throw new Error('CPU/EventTiming alignment unavailable: missing or changed NavigationStart');
  if (!Array.isArray(profile.samples) || !Array.isArray(profile.timeDeltas) || profile.samples.length === 0 || profile.samples.length !== profile.timeDeltas.length)
    throw new Error('CPU/EventTiming alignment unavailable: missing paired samples/timeDeltas');
  if (![profile.startTime, profile.endTime, firstMetrics.Timestamp, lastMetrics.Timestamp].every(Number.isFinite))
    throw new Error('CPU/EventTiming alignment unavailable: nonfinite clock metadata');
  if (profile.startTime/1_000_000 < firstMetrics.Timestamp || profile.endTime/1_000_000 > lastMetrics.Timestamp || profile.endTime < profile.startTime)
    throw new Error('CPU/EventTiming alignment unavailable: profile outside TimeTicks metric brackets');
  const nodes = new Map(profile.nodes.map(node => [node.id, node]));
  const parents = new Map();
  for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
  const frame = node => {
    const source = node.callFrame;
    let asset = 'native-or-inline';
    try {
      const pathname = new URL(source.url).pathname;
      if (/\/assets\/[^/]+\.js$/.test(pathname)) asset = pathname.slice(pathname.lastIndexOf('/') + 1);
    } catch { /* Keep arbitrary URLs and source text out of public output. */ }
    return { asset, functionName: String(source.functionName || '(anonymous)').slice(0, 100), line: source.lineNumber, column: source.columnNumber };
  };
  const stacks = new Map();
  for (const node of profile.nodes) {
    const frames = [];
    let id = node.id;
    while (id !== undefined && frames.length < 28) {
      const current = nodes.get(id);
      if (!current) break;
      frames.push(frame(current)); id = parents.get(id);
    }
    stacks.set(node.id, { leafFirst: frames, truncatedAncestors: id !== undefined });
  }
  let microseconds = profile.startTime;
  const samples = profile.samples.map((id, index) => {
    const delta = profile.timeDeltas[index];
    if (!Number.isFinite(delta) || delta < 0 || !nodes.has(id))
      throw new Error('CPU/EventTiming alignment unavailable: invalid sample delta/node');
    microseconds += delta;
    return { id, time: microseconds / 1000 - navigationStart * 1000 };
  });
  const eventStart = Math.min(...timeline.events.map(event => event.startTime));
  const eventEnd = Math.max(...timeline.events.map(event => event.startTime+event.duration));
  if (timeline.events.length && !samples.some(sample => sample.time >= eventStart && sample.time <= eventEnd))
    throw new Error('CPU/EventTiming alignment unavailable: no samples overlap actual document events');
  const summarize = (start, end) => {
    const selected = samples.filter(sample => sample.time >= start && sample.time <= end);
    const leaves = new Map();
    const functions = new Map();
    const sessionBranches = new Map();
    const categories = { program: 0, idle: 0, garbageCollector: 0, compiledJs: 0, otherNativeOrUnattributed: 0 };
    for (const sample of selected) {
      leaves.set(sample.id, (leaves.get(sample.id) ?? 0) + 1);
      const leaf = stacks.get(sample.id).leafFirst[0];
      const functionKey = JSON.stringify(leaf);
      const previousFunction = functions.get(functionKey);
      functions.set(functionKey, { frame: leaf, sampledHits: (previousFunction?.sampledHits ?? 0)+1 });
      const session = stacks.get(sample.id).leafFirst.filter(frame => frame.asset.startsWith('session-'));
      if (session.length) {
        const branch = session.some(frame => ['finish','result','get result'].includes(frame.functionName)) ? 'finish-or-result'
          : session.some(frame => frame.functionName === 'snapshot') ? 'snapshot-without-finish-ancestor' : 'other-session-ancestor';
        const key = JSON.stringify({ branch, leaf });
        const previous = sessionBranches.get(key);
        sessionBranches.set(key, { branch, leaf, sampledHits: (previous?.sampledHits ?? 0)+1 });
      }
      if (leaf.functionName === '(program)') categories.program++;
      else if (leaf.functionName === '(idle)') categories.idle++;
      else if (leaf.functionName === '(garbage collector)') categories.garbageCollector++;
      else if (leaf.asset !== 'native-or-inline') categories.compiledJs++;
      else categories.otherNativeOrUnattributed++;
    }
    return { startTime: start, endTime: end, sampleCount: selected.length, categories,
      topLeafFunctions: [...functions.values()].sort((a,b) => b.sampledHits-a.sampledHits).slice(0,12),
      sessionAncestorLeafFunctions: [...sessionBranches.values()].sort((a,b) => b.sampledHits-a.sampledHits).slice(0,16),
      topNestedStacks: [...leaves].sort((a,b) => b[1]-a[1]).slice(0,6).map(([id,count]) => ({ sampledHits: count, ...stacks.get(id) })) };
  };
  const slowEvents = ['keypress', 'input'].flatMap(name => [...timeline.events].filter(event => event.name === name)
    .sort((a,b) => b.duration-a.duration).slice(0,6)).map(event => ({ event,
      processing: summarize(event.processingStart ?? event.startTime, event.processingEnd ?? event.startTime+event.duration),
      throughPresentation: summarize(event.startTime, event.startTime+event.duration) }));
  const overlappingFrames = timeline.frames.filter(frame => slowEvents.some(({event}) =>
    event.startTime < frame.startTime+frame.duration && frame.startTime < event.startTime+event.duration));
  const slowFrames = [...overlappingFrames].sort((a,b) => b.duration-a.duration).slice(0,8).map(frame => ({ frame,
    cpu: summarize(frame.startTime,frame.startTime+frame.duration) }));
  return { scope: 'Instrumented CPU/LoAF co-occurrence only; nested compiled stacks are sampled, not call counts or proof that vendor/program/native samples belong to one application function.',
    alignment: { formula: '(profile.startTime + cumulative timeDeltas) / 1000 - NavigationStart * 1000',
      profilerTimeUnit: 'microseconds, monotonic TimeTicks', performanceMetricsTimeUnit: 'seconds, monotonic TimeTicks', documentEventsTimeUnit: 'milliseconds since NavigationStart',
      before: firstMetrics, after: lastMetrics, pagePerformanceBefore: performanceBefore, pagePerformanceAfter: performanceAfter,
      profileStartTime: profile.startTime, profileEndTime: profile.endTime, sampleCount: samples.length,
      firstSampleDocumentMs: samples[0].time, lastSampleDocumentMs: samples.at(-1).time,
      profileStartDocumentMs: profile.startTime/1000-navigationStart*1000, profileEndDocumentMs: profile.endTime/1000-navigationStart*1000,
      eventStartDocumentMs: timeline.events.length ? eventStart : null, eventEndDocumentMs: timeline.events.length ? eventEnd : null,
      unchangedNavigation: true },
    allProfileSamples: summarize(samples[0].time, samples.at(-1).time), slowEvents, slowFrames,
    limits: ['Six slowest observed keypresses and six inputs, plus eight overlapping long frames; same input can appear in multiple windows.',
      'Program/native samples remain unattributed. Compiled JS includes vendor code; names are matched to frozen asset structure without source-map precision.',
      'Sampling and added diagnostics affect timing. No acceptance replacement, clock changes, event fabrication or performance PASS.',
      'Raw CPU profile is ignored; public stacks contain asset basenames, numeric source locations and bounded function names only.'] };
}

function installDiagnostic() {
  const input = document.querySelector('textarea[aria-label="Typing input"]');
  if (!(input instanceof HTMLTextAreaElement)) throw new Error('Diagnostic typing input missing');
  const state = { events: [], frames: [], geometry: [], counts: { getClientRects: 0, getBoundingClientRect: 0 },
    capped: { events: false, frames: false, geometry: false },
    supported: { event: PerformanceObserver.supportedEntryTypes.includes('event'), loaf: PerformanceObserver.supportedEntryTypes.includes('long-animation-frame') } };
  window.sparowLoafDiagnostic = state;
  const observers = [];
  const collectors = [];
  const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const eventEntries = entries => {
    for (const entry of entries) {
      if (!['keydown', 'keyup', 'keypress', 'beforeinput', 'input'].includes(entry.name)) continue;
      if (state.events.length >= 10_000) { state.capped.events = true; break; }
      state.events.push({ name: entry.name, startTime: finite(entry.startTime), duration: finite(entry.duration),
        processingStart: finite(entry.processingStart), processingEnd: finite(entry.processingEnd), interactionId: finite(entry.interactionId) });
    }
  };
  const frameEntries = entries => {
    for (const entry of entries) {
      if (state.frames.length >= 2_000) { state.capped.frames = true; break; }
      state.frames.push({ startTime: finite(entry.startTime), duration: finite(entry.duration), blockingDuration: finite(entry.blockingDuration),
        renderStart: finite(entry.renderStart), styleAndLayoutStart: finite(entry.styleAndLayoutStart), firstUIEventTimestamp: finite(entry.firstUIEventTimestamp),
        scripts: (entry.scripts ?? []).slice(0, 20).map(script => {
          let asset = 'inline-or-other';
          try {
            const pathname = new URL(script.sourceURL, location.href).pathname;
            if (/\/assets\/[^/]+\.js$/.test(pathname)) asset = pathname.slice(pathname.lastIndexOf('/') + 1);
          } catch { /* No arbitrary script URLs or query strings enter this public report. */ }
          return { asset, functionName: String(script.sourceFunctionName ?? '').slice(0, 80), sourceCharPosition: finite(script.sourceCharPosition),
            startTime: finite(script.startTime), executionStart: finite(script.executionStart), duration: finite(script.duration),
            forcedStyleAndLayoutDuration: finite(script.forcedStyleAndLayoutDuration), pauseDuration: finite(script.pauseDuration), invokerType: script.invokerType ?? null };
        }),
      });
    }
  };
  if (state.supported.event) {
    const observer = new PerformanceObserver(list => eventEntries(list.getEntries()));
    observer.observe({ type: 'event', durationThreshold: 16 });
    observers.push(observer); collectors.push(eventEntries);
  }
  if (state.supported.loaf) {
    const observer = new PerformanceObserver(list => frameEntries(list.getEntries()));
    observer.observe({ type: 'long-animation-frame' });
    observers.push(observer); collectors.push(frameEntries);
  }
  const methods = ['getClientRects', 'getBoundingClientRect'];
  const descriptors = new Map(methods.map(name => [name, Object.getOwnPropertyDescriptor(Element.prototype, name)]));
  for (const name of methods) {
    const descriptor = descriptors.get(name);
    if (!descriptor || typeof descriptor.value !== 'function') throw new Error('Native geometry unavailable');
    const native = descriptor.value;
    Object.defineProperty(Element.prototype, name, { ...descriptor, value: function (...args) {
      const startTime = performance.now();
      // Identical receiver, arguments and returned object. Native exceptions
      // escape unchanged; accounting never makes an additional geometry call.
      const result = Reflect.apply(native, this, args);
      const endTime = performance.now();
      try {
        state.counts[name]++;
        if (state.geometry.length < 20_000) {
          const rawIndex = this.dataset?.slotIndex;
          const rect = name === 'getClientRects' ? result[0] : result;
          state.geometry.push({ method: name, atLength: input.value.length, startTime, endTime, duration: endTime - startTime,
            slotIndex: rawIndex === undefined ? null : Number(rawIndex), space: this.dataset?.expected === ' ',
            width: finite(rect?.width), height: finite(rect?.height) });
        } else state.capped.geometry = true;
      } catch { /* Preserve the original native call's exact observable behavior. */ }
      return result;
    } });
  }
  state.finish = () => {
    for (let i = 0; i < observers.length; i++) {
      collectors[i](observers[i].takeRecords());
      observers[i].disconnect();
    }
    for (const [name, descriptor] of descriptors) Object.defineProperty(Element.prototype, name, descriptor);
    return { supported: state.supported, capped: state.capped, counts: state.counts, events: state.events, frames: state.frames, geometry: state.geometry };
  };
}

const replacements = [];
let generated = original;
function replaceOnce(from, to, description) {
  assert.equal(generated.split(from).length, 2, `Unique substitution required: ${description}`);
  generated = generated.replace(from, to);
  replacements.push({ from, to, description });
}
replaceOnce("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`, 'Output directory');
replaceOnce('  let resize = null;', `  await page.evaluate(${installDiagnostic.toString()});
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  const cpuMetricsBefore = await cdp.send('Performance.getMetrics');
  const cpuPerformanceBefore = await page.evaluate(() => ({ now: performance.now(), timeOrigin: performance.timeOrigin }));
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  let resize = null;`, 'Install identical bounded numeric observers plus CPU profiler/TimeTicks metrics before unchanged typing actions');
replaceOnce('  const observation = await page.evaluate(() => window.typingBench);', `  const { profile: cpuProfile } = await cdp.send('Profiler.stop');
  const cpuMetricsAfter = await cdp.send('Performance.getMetrics');
  const cpuPerformanceAfter = await page.evaluate(() => ({ now: performance.now(), timeOrigin: performance.timeOrigin }));
  await writeFile(directory + '/${prefix}.cpuprofile', JSON.stringify(cpuProfile), { flag: 'wx' });
  const timeline = await page.evaluate(() => window.sparowLoafDiagnostic.finish());
  const alignedCpu = (${summarizeAlignedCpu.toString()})(cpuProfile, cpuMetricsBefore, cpuMetricsAfter, timeline, cpuPerformanceBefore, cpuPerformanceAfter);
  await writeFile(directory + '/${prefix}-stacks.json', JSON.stringify({ build, ...alignedCpu },null,2), { flag:'wx' });
  const overlaps = (start, end, otherStart, otherEnd) => start < otherEnd && otherStart < end;
  const slowEvents = [...timeline.events].sort((a,b) => b.duration-a.duration).slice(0,50).map(event => {
    const start = event.processingStart ?? event.startTime;
    const end = event.processingEnd ?? event.startTime + event.duration;
    const geometry = timeline.geometry.filter(read => overlaps(start, end, read.startTime, read.endTime));
    const presentationGeometry = timeline.geometry.filter(read => overlaps(event.startTime, event.startTime + event.duration, read.startTime, read.endTime));
    const frames = timeline.frames.filter(frame => overlaps(event.startTime, event.startTime + event.duration, frame.startTime, frame.startTime + frame.duration));
    return { ...event, overlappingNativeGeometryCalls: geometry.length, overlappingNativeGeometryMs: geometry.reduce((sum,read) => sum+read.duration,0),
      presentationWindowNativeGeometryCalls: presentationGeometry.length, presentationWindowNativeGeometryMs: presentationGeometry.reduce((sum,read) => sum+read.duration,0),
      overlappingLongFrames: frames.length, overlappingFrameBlockingMs: frames.reduce((sum,frame) => sum+(frame.blockingDuration ?? 0),0),
      overlappingFrameScriptForcedLayoutMs: frames.reduce((sum,frame) => sum+frame.scripts.reduce((total,script) => total+(script.forcedStyleAndLayoutDuration ?? 0),0),0) };
  });
  const byInputLength = {};
  for (const read of timeline.geometry) {
    const row = byInputLength[read.atLength] ??= { calls: 0, duration: 0, maxNativeCallMs: 0 };
    row.calls++; row.duration += read.duration; row.maxNativeCallMs = Math.max(row.maxNativeCallMs,read.duration);
  }
  await writeFile(directory + '/${prefix}-timeline.json', JSON.stringify({ scope: 'One instrumented diagnostic, not acceptance. Numeric timestamps share the same document performance clock. Interval overlap shows co-occurrence, not independent causal attribution; frame totals may repeat across related events. Native method durations exclude accounting after the return and never include additional geometry calls.', build,
    supported: timeline.supported, capped: timeline.capped, counts: timeline.counts, byInputLength, slowEvents,
    limitations: ['LoAF threshold50ms and EventTiming threshold16ms censor shorter work.', 'Observer delivery can exclude an unfinished final frame; buffered records are drained without adding an extra wait or modifying original actions.', 'Instrumentation adds overhead, and repeated overlaps must not be summed as total CPU cost.', 'No text values, account identifiers, private URLs, source text or credentials are collected.'], ...timeline }, null,2), { flag: 'wx' });
  const observation = await page.evaluate(() => window.typingBench);`, 'Drain observers/restore native methods, export bounded safe timeline, then original result export and assertions');
let restored = generated;
for (const replacement of [...replacements].reverse()) restored = restored.replace(replacement.to, replacement.from);
assert.equal(restored, original);
const sha = value => createHash('sha256').update(value).digest('hex');
await writeFile(generatedFile, generated, { flag: 'wx' });
await writeFile(`${directory}/${prefix}-protocol.json`, JSON.stringify({ declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN',
  scope: 'One combined CPU/LoAF/EventTiming/native-read diagnostic only. No acceptance replacement, retries, filtering, clock mutation, added action waits, text data, geometry modification, CSS or production changes.',
  sourceFile, build: frozen.local, originalFile, originalSha256: sha(original), generatedFile, generatedSha256: sha(generated), originalActionsAndAssertionsRestoredExactly: true,
  cpuThrottle: 4, repetitions: 16, characters: 495, requestedDelayMs: 0, fontsAndFiniteAnimationsSettled: true, viewport: { width:390,height:844 }, realRotation: { width:844,height:390 },
  caps: { geometryCalls: 20000, eventEntries: 10000, longFrames: 2000, scriptsPerFrame: 20 }, watchdogMs:150000,
  cpuAlignment: 'Profile samples use monotonic microseconds plus cumulative timeDeltas minus unchanged Performance.NavigationStart seconds; expose before/after numeric metadata and fail on missing/changed clock/sample data.',
  publicStackBounds: { eventsPerKind:6, eventKinds:['keypress','input'], overlappingFrames:8, stacksPerWindow:6, framesPerStack:28, leafFunctionsPerWindow:12, sessionAncestorLeafFunctionsPerWindow:16 },
  cleanup: 'Observer disconnection/native-descriptor restoration before original result export; on failure the retained original browser finally/watchdog destroys this owned context.',
},null,2), { flag:'wx' });
process.env.TYPING_BENCH_CPU_RATE = '4';
process.env.TYPING_BENCH_REPETITIONS = '16';
process.env.TYPING_BENCH_DELAY_MS = '0';
process.env.TYPING_BENCH_SETTLE = '1';
process.env.TYPING_BENCH_REPORT_NAME = prefix;
process.env.TYPING_BENCH_BUILD_FILE = sourceFile;
await import(`./.${prefix}.generated.mjs`);
