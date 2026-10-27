import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

assert.equal(process.env.SPAROWTYPE_LOAF_DIAGNOSTIC, '1', 'Explicit diagnostic opt-in required');
const directory = 'audit/2026-10-21';
const prefix = process.argv[2] ?? 'final14-loaf-native-diagnostic';
assert.match(prefix, /^final14-[a-z0-9-]+$/);
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const sourceFile = `${directory}/final14-source.json`;
const generatedFile = `${directory}/.${prefix}.generated.mjs`;
for (const file of [generatedFile, `${directory}/${prefix}-protocol.json`, `${directory}/${prefix}.json`, `${directory}/${prefix}-timeline.json`])
  await assert.rejects(access(file), { code: 'ENOENT' });
const original = await readFile(originalFile, 'utf8');
const frozen = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(frozen.local.version, '945bd4aa37e6b3c9ec40');
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => {
  assert.equal(response.ok, true);
  return response.json();
});
assert.deepEqual(served, frozen.local);

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
replaceOnce('  let resize = null;', `  await page.evaluate(${installDiagnostic.toString()});\n  let resize = null;`, 'Install bounded numeric LoAF/EventTiming/native geometry observation before unchanged typing actions');
replaceOnce('  const observation = await page.evaluate(() => window.typingBench);', `  const timeline = await page.evaluate(() => window.sparowLoafDiagnostic.finish());
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
  scope: 'One numeric LoAF/EventTiming/native-read diagnostic only. No acceptance replacement, retries, filtering, clock mutation, added waits, text data, geometry modification, CSS or production changes.',
  sourceFile, build: frozen.local, originalFile, originalSha256: sha(original), generatedFile, generatedSha256: sha(generated), originalActionsAndAssertionsRestoredExactly: true,
  cpuThrottle: 4, repetitions: 16, characters: 495, requestedDelayMs: 0, fontsAndFiniteAnimationsSettled: true, viewport: { width:390,height:844 }, realRotation: { width:844,height:390 },
  caps: { geometryCalls: 20000, eventEntries: 10000, longFrames: 2000, scriptsPerFrame: 20 }, watchdogMs:150000,
  cleanup: 'Observer disconnection/native-descriptor restoration before original result export; on failure the retained original browser finally/watchdog destroys this owned context.',
},null,2), { flag:'wx' });
process.env.TYPING_BENCH_CPU_RATE = '4';
process.env.TYPING_BENCH_REPETITIONS = '16';
process.env.TYPING_BENCH_DELAY_MS = '0';
process.env.TYPING_BENCH_SETTLE = '1';
process.env.TYPING_BENCH_REPORT_NAME = prefix;
process.env.TYPING_BENCH_BUILD_FILE = sourceFile;
await import(`./.${prefix}.generated.mjs`);
