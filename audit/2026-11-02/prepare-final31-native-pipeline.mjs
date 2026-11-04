// Preparation only; the separately guarded runner performs the approved job.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runtimeOriginalFile = `${directory}/mobile-native-pipeline-runtime.mjs`;
const runtimeFile = `${directory}/mobile-native-pipeline-runtime-final31.mjs`;
const driverOriginalFile = `${directory}/measure-mobile-workspaces-static-final31.mjs`;
const driverFile = `${directory}/measure-mobile-native-pipeline-final31.mjs`;
const wrapperOriginalFile = `${directory}/run-final28-mobile-native-pipeline.mjs`;
const wrapperFile = `${directory}/run-final31-mobile-native-pipeline.mjs`;
const planFile = `${directory}/final31-mobile-native-pipeline-preparation-v2.json`;
for (const file of [runtimeFile, driverFile, wrapperFile, planFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const oldPlan = JSON.parse(await readFile(`${directory}/final28-mobile-native-pipeline-preparation-v2.json`, 'utf8'));
const runtimeOriginal = await readFile(runtimeOriginalFile, 'utf8');
let runtime = runtimeOriginal.replaceAll('SPAROWTYPE_FINAL28_', 'SPAROWTYPE_FINAL31_');
const runtimeTransforms = [];
function replaceRuntime(from, to) {
  assert.equal(runtime.split(from).length - 1, 1, from.slice(0, 100));
  runtime = runtime.replace(from, to); runtimeTransforms.push({ from, to, count: 1 });
}
replaceRuntime('      shapeBefore: null, shapeAfter: null, observer: null };', `      shapeBefore: null, shapeAfter: null, observer: null, eventObserver: null,
      eventTimings: [], droppedEventTimings: 0 };`);
replaceRuntime('    const control = {', `    function consumeEvents(entries) {
      for (const entry of entries) {
        if (!['keydown','keyup','keypress','beforeinput','input'].includes(entry.name)) continue;
        if (probe.eventTimings.length >= 20000) { probe.droppedEventTimings++; continue; }
        probe.eventTimings.push({ name: entry.name, startTime: entry.startTime, duration: entry.duration,
          processingStart: entry.processingStart, processingEnd: entry.processingEnd, interactionId: entry.interactionId });
      }
    }
    const control = {`);
replaceRuntime('        probe.shapeBefore = shape(probe.target);', `        probe.shapeBefore = shape(probe.target);
        if (PerformanceObserver.supportedEntryTypes.includes('event')) {
          probe.eventObserver = new PerformanceObserver(list => consumeEvents(list.getEntries()));
          probe.eventObserver.observe({ type: 'event', durationThreshold: 16 });
        }`);
replaceRuntime('        const { observer, target, active, ...safe } = probe;', '        const { observer, eventObserver, target, active, ...safe } = probe;');
replaceRuntime('    window.sparowNativePipelineDiagnostic = control;', `    control.finishEventTimings = () => {
      if (probe.eventObserver) { consumeEvents(probe.eventObserver.takeRecords()); probe.eventObserver.disconnect(); }
      return { input: probe.input, eventTimings: probe.eventTimings, droppedEventTimings: probe.droppedEventTimings,
        originalObservation: { start: window.mobileWorkspaceBench?.start ?? null, end: window.mobileWorkspaceBench?.end ?? null } };
    };
    window.sparowNativePipelineDiagnostic = control;`);
runtime += `
export async function finishNativePipelineEventObservation(page, caseId, prefix, originalTiming) {
  const value = await page.evaluate(() => window.sparowNativePipelineDiagnostic.finishEventTimings());
  const rows = value.eventTimings.filter(row => row.startTime >= value.originalObservation.start && row.startTime <= value.originalObservation.end);
  const first = value.input.beforeInputs[0]?.at, last = value.input.beforeInputs.at(-1)?.at;
  const summarize = entries => {
    const sorted = entries.map(row => row.duration).sort((a,b)=>a-b);
    return { count: entries.length, p98Ms: sorted.length ? sorted[Math.ceil(sorted.length*.98)-1] : null,
      maxMs: sorted.at(-1) ?? null, topEvents: [...entries].sort((a,b)=>b.duration-a.duration).slice(0,12) };
  };
  const full = summarize(rows);
  const phases = {
    fullyContainedBeforeFinalInput: summarize(rows.filter(row => row.startTime >= first && row.startTime + row.duration < last)),
    startsBeforeFinalButOverlapsFinalOrResult: summarize(rows.filter(row => row.startTime < last && row.startTime + row.duration >= last)),
    startsAtOrAfterFinalInput: summarize(rows.filter(row => row.startTime >= last)),
    processingFullyContainedBeforeFinalInput: summarize(rows.filter(row => row.processingStart >= first && row.processingEnd < last)),
  };
  const matches = full.count === originalTiming.observedTypingEventsAtLeast16ms && full.p98Ms === originalTiming.p98ObservedTypingEventDurationMs && full.maxMs === originalTiming.maxObservedTypingEventDurationMs;
  const raw = \`\${directory}/.\${prefix}-\${caseId}-eventtimings.json\`;
  const output = \`\${directory}/\${prefix}-\${caseId}-event-phase-summary.json\`;
  await writeFile(raw, JSON.stringify(value)+'\\n', { flag: 'wx' });
  await writeFile(output, JSON.stringify({ status: matches && value.droppedEventTimings === 0 ? 'MATCHED-ORIGINAL-DIAGNOSTIC-OBSERVATION-NOT-ACCEPTANCE' : 'UNVERIFIED-OBSERVER-MATCH',
    caseId, ignoredRawEventTimings: raw, originalTiming, originalSummaryMatchesCollectedTimeline: matches,
    originalObservation: value.originalObservation, beforeInputs: value.input.beforeInputs.length,
    firstBeforeInput: first, lastBeforeInput: last, inputCallReturned: value.input.returnedAt, full, phases,
    droppedEventTimings: value.droppedEventTimings,
    qualification: 'Diagnostic timing only. Retains the original start-based observation window including results. Duration boundaries classify complete event latency; processing boundaries classify processing alone. Boundary overlaps remain separate. Source31 ordinary trial3 Learn128ms remains failed.' }, null, 2)+'\\n', { flag: 'wx' });
  return { report: output, originalSummaryMatchesCollectedTimeline: matches, full: { count: full.count, p98Ms: full.p98Ms, maxMs: full.maxMs } };
}
`;
let runtimeReversed = runtime.slice(0, runtime.indexOf('\nexport async function finishNativePipelineEventObservation'));
for (const change of [...runtimeTransforms].reverse()) runtimeReversed = runtimeReversed.replace(change.to, change.from);
assert.equal(runtimeReversed.replaceAll('SPAROWTYPE_FINAL31_', 'SPAROWTYPE_FINAL28_'), runtimeOriginal);

const driverOriginal = await readFile(driverOriginalFile, 'utf8');
const rename = value => value.replaceAll('final28', 'final31').replaceAll('mobile-native-pipeline-runtime.mjs', 'mobile-native-pipeline-runtime-final31.mjs');
const driverTransforms = oldPlan.driverTransforms.map(change => ({ ...change, from: rename(change.from), to: rename(change.to) }));
driverTransforms[0].to = driverTransforms[0].to.replace('abortNativePipelineDiagnostic }', 'abortNativePipelineDiagnostic, finishNativePipelineEventObservation }');
driverTransforms.push({ from: '    receipt.timing = await endObservation(page);', to: '    receipt.timing = await endObservation(page);\n    receipt.eventPhaseSummary = await finishNativePipelineEventObservation(page, specification.id, prefix, receipt.timing);', count: 4 });
let driver = driverOriginal;
for (const change of driverTransforms) { assert.equal(driver.split(change.from).length - 1, change.count, change.from.slice(0, 80)); driver = driver.replaceAll(change.from, change.to); }
let reverted = driver;
for (const change of [...driverTransforms].reverse()) { assert.equal(reverted.split(change.to).length - 1, change.count); reverted = reverted.replaceAll(change.to, change.from); }
assert.equal(reverted, driverOriginal);

const wrapperOriginal = await readFile(wrapperOriginalFile, 'utf8');
let wrapper = wrapperOriginal.replaceAll('FINAL28', 'FINAL31').replaceAll('final28', 'final31')
  .replaceAll('mobile-native-pipeline-runtime.mjs', 'mobile-native-pipeline-runtime-final31.mjs')
  .replace("const directory = 'dist-static-final31-candidate-vercel';", "const directory = 'dist-static-final31-vercel';")
  .replace("['-trace.json','-timeline.json']", "['-trace.json','-timeline.json','-eventtimings.json']");
let wrapperReverted = wrapper.replace("['-trace.json','-timeline.json','-eventtimings.json']", "['-trace.json','-timeline.json']")
  .replace("const directory = 'dist-static-final31-vercel';", "const directory = 'dist-static-final31-candidate-vercel';")
  .replaceAll('mobile-native-pipeline-runtime-final31.mjs', 'mobile-native-pipeline-runtime.mjs')
  .replaceAll('FINAL31', 'FINAL28').replaceAll('final31', 'final28');
assert.equal(wrapperReverted, wrapperOriginal);
await writeFile(runtimeFile, runtime, { flag: 'wx' });
await writeFile(driverFile, driver, { flag: 'wx' });
await writeFile(wrapperFile, wrapper, { flag: 'wx' });
const helperFiles = [runtimeFile, `${directory}/mobile-native-pipeline-analysis.mjs`];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file=>[file,hash(await readFile(file))])));
await writeFile(planFile, JSON.stringify({ preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  sourceBuild: 'f52d0372fe7656817259', staticBuild: 'ce843cf42b5a6554ee78', sourceFiles: 505,
  originalDriver: driverOriginalFile, originalDriverSha256: hash(driverOriginal), driverFile, driverSha256: hash(driver), driverTransforms,
  originalWrapper: wrapperOriginalFile, originalWrapperSha256: hash(wrapperOriginal), wrapperFile, wrapperSha256: hash(wrapper),
  wrapperCloneExactReversal: true, runtimeOriginalFile, runtimeOriginalSha256: hash(runtimeOriginal), runtimeFile, runtimeTransforms,
  runtimeStructuralReversalVerified: true, helperHashes, setterProbeRequiredOff: true,
  declaredCases: ['learn','local-bot'], originalFourWorkspaceActionsAndAssertionsPreserved: true,
  eventTimingExtension: 'Separate bounded observer through the original endObservation; compare count/p98/max to original summary, then classify complete pre-final latency versus boundary overlaps/results.',
  trace: 'Same categories,32MB buffer/64MB stream cap, no CPU sampling/screenshots. Trace itself ends at original pressSequentially return; later EventTiming observation is separate.',
  ordinaryTrial3Learn128FailureRetained: true, productionFilesEdited: false, runtimeJobsStarted: 0,
}, null, 2)+'\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', runtimeFile, driverFile, wrapperFile, planFile, exactReversal: true }));
