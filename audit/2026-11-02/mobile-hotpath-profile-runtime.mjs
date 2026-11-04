// Diagnostic instrumentation only. No production module is imported or edited.
import assert from 'node:assert/strict';
import { access, writeFile } from 'node:fs/promises';
import { summarizeHotpathProfile } from './mobile-hotpath-profile-analysis.mjs';

const active = new WeakMap();
const directory = 'audit/2026-11-02';
export async function beginHotpathDiagnostic(page, cdp, caseId, prefix, protocol) {
  assert.equal(process.env.SPAROWTYPE_MOBILE_HOTPATH_PROFILE, '1');
  assert.equal(protocol.diagnostic, true);
  assert.ok(['learn', 'local-bot'].includes(caseId));
  assert.equal(active.has(page), false);
  const rawProfile = `${directory}/.${prefix}-${caseId}.cpuprofile`;
  const rawTimeline = `${directory}/.${prefix}-${caseId}-timeline.json`;
  const summaryFile = `${directory}/${prefix}-${caseId}-profile-summary.json`;
  for (const file of [rawProfile, rawTimeline, summaryFile]) await assert.rejects(access(file), { code: 'ENOENT' });
  const state = { cdp, caseId, rawProfile, rawTimeline, summaryFile, stopped: false, profiling: false };
  active.set(page, state);
  await page.evaluate(({ caseId }) => {
    const supported = PerformanceObserver.supportedEntryTypes;
    const numeric = value => Number.isFinite(value) ? value : null;
    const pathname = value => { try { const url = new URL(value, location.href); return /^https?:$/.test(url.protocol) ? url.pathname.slice(0, 240) : 'native-or-inline'; } catch { return 'native-or-inline'; } };
    const diagnostic = { caseId,
      supports: { longAnimationFrame: supported.includes('long-animation-frame'), eventTiming: supported.includes('event'), longTask: supported.includes('longtask') },
      profileClockBracket: {}, input: { callStartAt: null, returnedAt: null, beforeInputs: [] },
      loafs: [], events: [], longTasks: [], dropped: { beforeInputs: 0, loafs: 0, scripts: 0, events: 0, longTasks: 0 },
      observers: [], endAt: null, rawTextCollected: false };
    const beforeInput = event => {
      if (diagnostic.input.returnedAt !== null || event.inputType !== 'insertText') return;
      if (diagnostic.input.beforeInputs.length >= 4096) { diagnostic.dropped.beforeInputs++; return; }
      diagnostic.input.beforeInputs.push({ sequence: diagnostic.input.beforeInputs.length + 1, at: performance.now(), timeStamp: event.timeStamp, inputType: event.inputType });
    };
    document.addEventListener('beforeinput', beforeInput, true);
    for (const type of ['long-animation-frame', 'event', 'longtask']) {
      if (!supported.includes(type)) continue;
      const consume = entries => {
        for (const entry of entries) {
          if (type === 'event') {
            if (!['keydown', 'keyup', 'keypress', 'beforeinput', 'input'].includes(entry.name)) continue;
            if (diagnostic.events.length >= 20000) { diagnostic.dropped.events++; continue; }
            diagnostic.events.push({ name: entry.name, startTime: entry.startTime, duration: entry.duration,
              processingStart: entry.processingStart, processingEnd: entry.processingEnd, interactionId: entry.interactionId });
          } else if (type === 'longtask') {
            if (diagnostic.longTasks.length >= 1024) { diagnostic.dropped.longTasks++; continue; }
            diagnostic.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
          } else {
            if (diagnostic.loafs.length >= 512) { diagnostic.dropped.loafs++; continue; }
            const scripts = Array.from(entry.scripts ?? []);
            diagnostic.dropped.scripts += Math.max(0, scripts.length - 40);
            diagnostic.loafs.push({ startTime: entry.startTime, duration: entry.duration, blockingDuration: numeric(entry.blockingDuration),
              renderStart: numeric(entry.renderStart), styleAndLayoutStart: numeric(entry.styleAndLayoutStart), firstUIEventTimestamp: numeric(entry.firstUIEventTimestamp),
              scripts: scripts.slice(0, 40).map(script => ({ executionStart: numeric(script.executionStart), duration: numeric(script.duration),
                forcedStyleAndLayoutDuration: numeric(script.forcedStyleAndLayoutDuration), pauseDuration: numeric(script.pauseDuration),
                sourceURL: pathname(script.sourceURL), sourceFunctionName: String(script.sourceFunctionName || '(anonymous)').slice(0, 100),
                sourceCharPosition: numeric(script.sourceCharPosition), invoker: String(script.invoker || '').slice(0, 120), invokerType: String(script.invokerType || '').slice(0, 80) })) });
          }
        }
      };
      const observer = new PerformanceObserver(list => consume(list.getEntries()));
      observer.observe(type === 'event' ? { type, durationThreshold: 16 } : { type });
      diagnostic.observers.push({ observer, consume });
    }
    window.mobileHotpathDiagnostic = { diagnostic, beforeInput };
  }, { caseId });
  await cdp.send('Performance.enable');
  state.performanceBefore = await cdp.send('Performance.getMetrics');
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  const beforePerformanceNow = await page.evaluate(() => performance.now());
  await cdp.send('Profiler.start'); state.profiling = true;
  const afterPerformanceNow = await page.evaluate(() => performance.now());
  await page.evaluate(bracket => { window.mobileHotpathDiagnostic.diagnostic.profileClockBracket = bracket; }, { beforePerformanceNow, afterPerformanceNow });
}

export async function markHotpathInputStart(page) {
  assert.ok(active.get(page)?.profiling, 'A diagnostic profile must be active before the original typing call.');
  await page.evaluate(() => { window.mobileHotpathDiagnostic.diagnostic.input.callStartAt = performance.now(); });
}

async function collect(page, state, incomplete) {
  const diagnostic = await page.evaluate(() => {
    const bundle = window.mobileHotpathDiagnostic;
    const diagnostic = bundle.diagnostic;
    for (const { observer, consume } of diagnostic.observers) { consume(observer.takeRecords()); observer.disconnect(); }
    document.removeEventListener('beforeinput', bundle.beforeInput, true);
    diagnostic.endAt = performance.now();
    const { observers, ...value } = diagnostic;
    return value;
  });
  const stopped = await state.cdp.send('Profiler.stop'); state.stopped = true;
  const performanceAfter = await state.cdp.send('Performance.getMetrics');
  await state.cdp.send('Profiler.disable');
  diagnostic.performanceBefore = state.performanceBefore;
  diagnostic.performanceAfter = performanceAfter;
  diagnostic.incomplete = incomplete;
  diagnostic.profileWindowEndsBeforeManualBotFinish = state.caseId === 'local-bot';
  diagnostic.learnLastInputMayContainAutomaticResultWork = state.caseId === 'learn';
  await writeFile(state.rawProfile, JSON.stringify(stopped.profile), { flag: 'wx' });
  await writeFile(state.rawTimeline, JSON.stringify(diagnostic, null, 2) + '\n', { flag: 'wx' });
  const summary = summarizeHotpathProfile(stopped.profile, diagnostic);
  const report = { status: incomplete ? 'INCOMPLETE-DIAGNOSTIC' : 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE', caseId: state.caseId,
    files: { ignoredRawProfile: state.rawProfile, ignoredRawTimeline: state.rawTimeline, summary: state.summaryFile },
    profile: { nodes: stopped.profile.nodes?.length ?? 0, samples: stopped.profile.samples?.length ?? 0, startTime: stopped.profile.startTime, endTime: stopped.profile.endTime },
    summary, rawTypedTextCollected: false,
    qualification: 'Instrumentation changes execution cost. Original112ms Learn/BOT latency failures remain unchanged. CPU/LoAF overlap alone does not prove one-function causality. Learn strict pre-final-insertion summaries exclude automatic result work; BOT profile stops before manual Finish.' };
  await writeFile(state.summaryFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  active.delete(page);
  return { status: report.status, report: state.summaryFile, profile: report.profile, supports: diagnostic.supports,
    inputMarkers: { callStartAt: diagnostic.input.callStartAt, returnedAt: diagnostic.input.returnedAt, beforeInputCount: diagnostic.input.beforeInputs.length,
      firstBeforeInputAt: diagnostic.input.beforeInputs[0]?.at ?? null, lastBeforeInputAt: diagnostic.input.beforeInputs.at(-1)?.at ?? null },
    incomplete, rawTypedTextCollected: false };
}

export async function endHotpathDiagnostic(page) {
  const state = active.get(page); assert.ok(state?.profiling && !state.stopped);
  await page.evaluate(() => { window.mobileHotpathDiagnostic.diagnostic.input.returnedAt = performance.now(); });
  // Drain event delivery before stopping. This explicit diagnostic buffer is
  // outside the original typing call and never extends an acceptance deadline.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return collect(page, state, false);
}

export async function abortHotpathDiagnostic(page) {
  const state = active.get(page);
  if (!state) return null;
  if (state.stopped) { active.delete(page); return { status: 'INCOMPLETE-DIAGNOSTIC', reason: 'Profile stopped but its summary did not complete.' }; }
  try { return await collect(page, state, true); }
  catch (error) { active.delete(page); return { status: 'INCOMPLETE-DIAGNOSTIC', reason: String(error.message).slice(0, 300) }; }
}
