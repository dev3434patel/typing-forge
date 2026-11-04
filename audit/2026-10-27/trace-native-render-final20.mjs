// One diagnostic against the unchanged current frontend, never acceptance.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_NATIVE_RENDER_TRACE, '1', 'A coordinated quiet-window trace must be explicitly enabled.');
const directory = 'audit/2026-10-27';
const prefix = process.argv[2] ?? 'final20-native-render-trace';
assert.match(prefix, /^final20-[a-z0-9-]+$/);
const sourceFile = `${directory}/final20-source.json`;
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const generatedFile = `${directory}/.${prefix}.generated.mjs`;
const rawFile = `${directory}/.${prefix}.trace.json`;
const protocolFile = `${directory}/${prefix}-protocol.json`;
const summaryFile = `${directory}/${prefix}-summary.json`;
const resultFile = `${directory}/${prefix}.json`;
for (const file of [generatedFile, rawFile, protocolFile, summaryFile, resultFile])
  await assert.rejects(access(file), { code: 'ENOENT' }, 'Every diagnostic has an immutable unique namespace.');
const frozen = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(frozen.local.version, '4c8b30fcf0d2370c79d4');
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), frozen.local);
const frontendFiles = Object.keys(frozen.sourceHashes).filter(file => !file.startsWith('backend/'));
const frontendMismatches = [];
for (const file of frontendFiles)
  if (normalizedSourceHash(file, await readFile(file)) !== frozen.sourceHashes[file]) frontendMismatches.push(file);
assert.deepEqual(frontendMismatches, [], 'The current frontend must match the pre-repair build being diagnosed. Backend-only edits are outside this diagnostic.');
const categories = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink.user_timing'];
const original = await readFile(originalFile, 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

function summarizeNativeTrace(trace, before, after, nativeInput) {
  const metrics = value => Object.fromEntries(value.metrics.filter(metric => [
    'Timestamp', 'NavigationStart', 'TaskDuration', 'ScriptDuration', 'LayoutDuration',
    'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount', 'Nodes', 'JSHeapUsedSize',
  ].includes(metric.name)).map(metric => [metric.name, metric.value]));
  const first = metrics(before), last = metrics(after), navigation = first.NavigationStart;
  if (!Number.isFinite(navigation) || navigation <= 0 || navigation !== last.NavigationStart)
    throw new Error('Native trace alignment requires unchanged actual NavigationStart.');
  const events = trace.traceEvents;
  if (!Array.isArray(events) || events.length === 0) throw new Error('Native trace is empty.');
  const typingTypes = new Set(['keydown', 'keypress', 'keyup', 'beforeinput', 'input']);
  const candidates = new Map();
  for (const event of events) {
    if (event.name !== 'EventDispatch' || !typingTypes.has(event.args?.data?.type)) continue;
    const key = `${event.pid}:${event.tid}`;
    const item = candidates.get(key) ?? { pid: event.pid, tid: event.tid, count: 0 };
    item.count++; candidates.set(key, item);
  }
  const ranked = [...candidates.values()].sort((a, b) => b.count - a.count);
  if (ranked.length !== 1 || ranked[0].count < 495) throw new Error('Single owned renderer typing thread was not identifiable.');
  const main = ranked[0];
  const selected = events.filter(event => event.pid === main.pid && event.tid === main.tid);
  const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const distribution = values => {
    const ordered = values.filter(Number.isFinite).sort((a, b) => a - b);
    const rank = p => ordered.length ? ordered[Math.ceil(ordered.length * p) - 1] : null;
    return { count: ordered.length, inclusiveTotalMs: ordered.reduce((sum, value) => sum + value, 0),
      minMs: ordered[0] ?? null, p50Ms: rank(.5), p95Ms: rank(.95), p98Ms: rank(.98), maxMs: ordered.at(-1) ?? null };
  };
  const safeFrame = frame => {
    let asset = 'native-or-inline';
    try {
      const pathname = new URL(frame.url).pathname;
      if (/\/assets\/[^/]+\.js$/.test(pathname)) asset = pathname.slice(pathname.lastIndexOf('/') + 1);
    } catch { /* Arbitrary URLs or source text never enter the public output. */ }
    return { asset, functionName: String(frame.functionName || '(anonymous)').slice(0, 100), line: finite(frame.lineNumber), column: finite(frame.columnNumber) };
  };
  const dataOf = event => event.args?.data ?? event.args?.beginData ?? {};
  const framesOf = event => {
    const data = dataOf(event);
    const frames = data.stackTrace ?? data.stack?.callFrames ?? event.args?.beginData?.stackTrace ?? [];
    return Array.isArray(frames) ? frames.slice(0, 12).map(safeFrame) : [];
  };
  const safeEvent = event => {
    const data = dataOf(event), numeric = {};
    for (const section of ['data', 'beginData', 'endData']) {
      const value = event.args?.[section];
      if (!value || typeof value !== 'object') continue;
      for (const [name, number] of Object.entries(value))
        if (typeof number === 'number' && Number.isFinite(number)) numeric[`${section}.${name}`] = number;
    }
    const label = typeof data.nodeName === 'string' && /^#?[A-Za-z][A-Za-z0-9-]{0,79}$/.test(data.nodeName) ? data.nodeName : null;
    const rootData = event.args?.endData?.layoutRoots ?? event.args?.data?.layoutRoots ?? [];
    return { name: event.name, startDocumentMs: event.ts / 1000 - navigation * 1000,
      durationMs: finite(event.dur) === null ? null : event.dur / 1000,
      argumentSections: Object.keys(event.args ?? {}).slice(0, 10), dataKeys: Object.keys(data).slice(0, 30), numeric,
      nodeName: label, stack: framesOf(event),
      roots: Array.isArray(rootData) ? rootData.slice(0, 8).map(root => ({ nodeId: finite(root.nodeId), backendNodeId: finite(root.backendNodeId) })) : [] };
  };
  const complete = selected.filter(event => event.ph === 'X' && Number.isFinite(event.dur));
  const categoryNames = ['RunTask', 'EventDispatch', 'FunctionCall', 'UpdateLayoutTree', 'RecalculateStyles', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'CompositeLayers', 'Commit', 'FireAnimationFrame', 'TimerFire', 'MinorGC', 'MajorGC'];
  const byCategory = Object.fromEntries(categoryNames.map(name => [name, distribution(complete.filter(event => event.name === name).map(event => event.dur / 1000))]));
  const nativeKinds = new Set(['UpdateLayoutTree', 'RecalculateStyles', 'Layout', 'PrePaint', 'Paint', 'Layerize', 'CompositeLayers']);
  const nativeWork = complete.filter(event => nativeKinds.has(event.name));
  const slowNative = [...nativeWork].sort((a, b) => b.dur - a.dur).slice(0, 30).map(safeEvent);
  const typing = complete.filter(event => event.name === 'EventDispatch' && typingTypes.has(dataOf(event).type));
  const typingByType = Object.fromEntries([...typingTypes].map(type => [type, distribution(typing.filter(event => dataOf(event).type === type).map(event => event.dur / 1000))]));
  const slowDispatches = typing.filter(event => ['keypress', 'input'].includes(dataOf(event).type))
    .sort((a, b) => b.dur - a.dur).slice(0, 12).map(event => {
      const overlap = nativeWork.filter(item => item.ts < event.ts + event.dur && event.ts < item.ts + item.dur);
      return { type: dataOf(event).type, ...safeEvent(event), overlappingNativeWork: Object.fromEntries([...nativeKinds].map(name => [name, distribution(overlap.filter(item => item.name === name).map(item => item.dur / 1000))])) };
    });
  const invalidations = selected.filter(event => /Invalidation|InvalidateLayout|ScheduleStyleRecalculation/.test(event.name));
  const invalidationGroups = new Map();
  for (const event of invalidations) {
    const data = dataOf(event);
    const reason = typeof data.reason === 'string' ? data.reason.slice(0, 100) : null;
    const key = JSON.stringify({ event: event.name, reason, stack: framesOf(event) });
    const previous = invalidationGroups.get(key);
    invalidationGroups.set(key, { event: event.name, reason, count: (previous?.count ?? 0) + 1, stack: framesOf(event),
      nodeName: typeof data.nodeName === 'string' && /^#?[A-Za-z][A-Za-z0-9-]{0,79}$/.test(data.nodeName) ? data.nodeName : null,
      dataKeys: Object.keys(data).slice(0, 30) });
  }
  const nativeNodeIds = new Set();
  for (const event of nativeWork) {
    const data = dataOf(event);
    for (const id of [data.nodeId, data.backendNodeId, event.args?.beginData?.nodeId]) if (Number.isInteger(id) && id > 0) nativeNodeIds.add(id);
  }
  const metricDeltas = {};
  for (const name of ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount'])
    if (Number.isFinite(first[name]) && Number.isFinite(last[name])) metricDeltas[name] = last[name] - first[name];
  return { status: 'DIAGNOSTIC-NOT-ACCEPTANCE', alignment: { unchangedNavigation: true, navigationStartTimeTicksSeconds: navigation,
      formula: 'trace.ts / 1000 - NavigationStart * 1000', traceTimestampUnit: 'monotonic TimeTicks microseconds', before: first, after: last },
    totalTraceEvents: events.length, rendererThreadCandidates: ranked, selectedRenderer: main, selectedRendererEvents: selected.length,
    completeRendererEvents: complete.length, traceNativeNodeIds: [...nativeNodeIds].slice(0, 30), initialNativeTextarea: nativeInput,
    metricDeltas, byCategory, typingByType, slowNative, slowDispatches,
    invalidationCount: invalidations.length, invalidationGroups: [...invalidationGroups.values()].sort((a, b) => b.count - a.count).slice(0, 30),
    limits: ['Timeline category totals are inclusive and may nest; do not sum them as disjoint CPU time.',
      'Slow dispatch/native work overlap is co-occurrence, not proof that a textarea or script caused the work.',
      'A single diagnostic adds tracing overhead. It cannot replace the original three-run input acceptance or establish physical-mobile/field INP.',
      'Public output contains bounded native event counts/durations, initial CSS geometry and compiled asset basename/source locations only. No typed text, arbitrary URLs, HTML, selectors or account data.'] };
}

const replacements = [];
let generated = original;
function replaceOnce(from, to, description) {
  assert.equal(generated.split(from).length, 2, `Unique insertion boundary required: ${description}`);
  generated = generated.replace(from, to); replacements.push({ from, to, description });
}
replaceOnce("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`, 'Output path only');
replaceOnce('  let resize = null;', `  const nativeInputBeforeTrace = await input.evaluate(element => {
    const css = getComputedStyle(element);
    return { nodeName: element.nodeName, wrap: element.wrap, valueLength: element.value.length,
      clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight,
      whiteSpace: css.whiteSpace, overflowWrap: css.overflowWrap, wordBreak: css.wordBreak, lineHeight: css.lineHeight,
      fontSize: css.fontSize, overflowX: css.overflowX, overflowY: css.overflowY, opacity: css.opacity, position: css.position };
  });
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  const traceMetricsBefore = await cdp.send('Performance.getMetrics');
  const nativeTraceComplete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.start', { categories: ${JSON.stringify(categories.join(','))}, transferMode: 'ReturnAsStream', bufferUsageReportingInterval: 1000 });
  let resize = null;`, 'Start native Chromium rendering trace before original unchanged 495-character actions');
replaceOnce('  const observation = await page.evaluate(() => window.typingBench);', `  await cdp.send('Tracing.end');
  const traceCompletion = await Promise.race([nativeTraceComplete, new Promise((_,reject) => { const timer=setTimeout(() => reject(new Error('Native trace completion exceeded10000ms')),10000); timer.unref(); })]);
  if (!traceCompletion.stream) throw new Error('Native trace stream missing');
  let rawTrace = '', traceBytes = 0;
  try {
    while (true) {
      const part = await cdp.send('IO.read', { handle: traceCompletion.stream, size: 1024 * 1024 });
      const bytes = part.base64Encoded ? Buffer.from(part.data, 'base64') : Buffer.from(part.data);
      traceBytes += bytes.length;
      if (traceBytes > 192 * 1024 * 1024) throw new Error('Native trace exceeded declared192MiB cap');
      rawTrace += bytes.toString('utf8');
      if (part.eof) break;
    }
  } finally { await cdp.send('IO.close', { handle: traceCompletion.stream }); }
  await writeFile('${rawFile}', rawTrace, { flag: 'wx' });
  const traceMetricsAfter = await cdp.send('Performance.getMetrics');
  const nativeSummary = (${summarizeNativeTrace.toString()})(JSON.parse(rawTrace),traceMetricsBefore,traceMetricsAfter,nativeInputBeforeTrace);
  await writeFile('${summaryFile}', JSON.stringify({ ...nativeSummary, build, rawTraceIgnoredFile: '${rawFile}', rawTraceBytes: traceBytes },null,2), { flag: 'wx' });
  const observation = await page.evaluate(() => window.typingBench);`, 'Stop trace, persist ignored raw data and bounded numeric summary, preserve original result export and all assertions');
let reversed = generated;
for (const item of [...replacements].reverse()) reversed = reversed.replace(item.to, item.from);
assert.equal(reversed, original);
await writeFile(generatedFile, generated, { flag: 'wx' });
await writeFile(protocolFile, JSON.stringify({ declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN',
  scope: 'One native renderer attribution diagnostic, not input acceptance. No production/CSS/geometry/timer/event changes or fabricated input.',
  build: frozen.local, sourceFile, frontendFilesCompared: frontendFiles.length, frontendMismatches,
  backendScope: 'Backend-only changes after source20 are intentionally not qualified by this frontend-only trace.',
  originalFile, originalSha256: sha(original), generatedFile, generatedSha256: sha(generated), originalActionsAndAssertionsRestoredExactly: true,
  categories, rawFile, summaryFile, rawTraceMaxBytes: 192 * 1024 * 1024,
  cpuThrottle: 4, repetitions: 16, characters: 495, interCharacterDelayMs: 0, fontsAndFiniteAnimationsSettled: true,
  viewport: { width: 390, height: 844 }, realRotation: { width: 844, height: 390 }, originalWatchdogMs: 150000,
  publicBounds: { slowNative: 30, slowDispatches: 12, invalidationGroups: 30, stackFrames: 12 },
  rawPrivacy: 'Dot-prefixed .final20 trace/generated files are covered by existing audit/**/.final* ignore rule. Never publish or stage raw trace.',
  acceptanceStatus: 'NOT-MEASURED-BY-THIS-DIAGNOSTIC',
}, null, 2) + '\n', { flag: 'wx' });
process.env.TYPING_BENCH_CPU_RATE = '4';
process.env.TYPING_BENCH_REPETITIONS = '16';
process.env.TYPING_BENCH_DELAY_MS = '0';
process.env.TYPING_BENCH_SETTLE = '1';
process.env.TYPING_BENCH_REPORT_NAME = prefix;
process.env.TYPING_BENCH_BUILD_FILE = sourceFile;
await import(`./.${prefix}.generated.mjs`);
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), frozen.local);
assert.equal(sha(await readFile(originalFile, 'utf8')), sha(original));
for (const file of frontendFiles) assert.equal(normalizedSourceHash(file, await readFile(file)), frozen.sourceHashes[file]);
console.log(JSON.stringify({ status: 'DIAGNOSTIC-COMPLETE-NOT-ACCEPTANCE', prefix, summaryFile, resultFile, rawFileIgnored: true, frontendUnchanged: true }));
