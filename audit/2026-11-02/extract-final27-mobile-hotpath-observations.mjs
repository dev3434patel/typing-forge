// Read-only post-processing of the explicitly diagnostic baseline capture.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02', hashes = {};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function read(file) { const value = await readFile(file); hashes[file] = hash(value); return value; }
async function json(file) { return JSON.parse(await read(file)); }
const stats = values => {
  const sorted = values.map(value => value.duration).sort((a,b)=>a-b);
  return { count: sorted.length, maxObservedDurationMs: sorted.at(-1) ?? null, p98ObservedDurationMs: sorted.length ? sorted[Math.ceil(sorted.length*.98)-1] : null };
};
const mappings = [
  { asset: 'Learn-CSXy2Boo.js', line: 1, column: 9742, source: 'src/components/keybr/KeybrLessonMode.tsx', method: 'measureCaret', proof: '--learn-caret-visible' },
  { asset: 'Learn-CSXy2Boo.js', line: 1, column: 5830, source: 'src/components/keybr/KeybrLessonMode.tsx', method: 'KeybrLessonMode component', proof: 'focusKeys:' },
  { asset: 'TypingArea-DgEiVcsJ.js', line: 0, column: 9212, source: 'src/components/typing/TypingArea.tsx', method: 'measureCaret', proof: 'getClientRects()[0]' },
  { asset: 'TypingArea-DgEiVcsJ.js', line: 0, column: 7060, source: 'src/components/typing/TypingArea.tsx', method: 'TypingArea component', proof: 'onTestComplete:' },
  { asset: 'Learn-CSXy2Boo.js', line: 1, column: 1814, source: 'src/components/keybr/KeybrResults.tsx', method: 'result-focus useEffect callback in baseline27', proof: 'current?.focus()' },
];
for (const mapping of mappings) {
  const file = `dist-static-final27-vercel/assets/${mapping.asset}`;
  const line = (await read(file)).toString('utf8').split('\n')[mapping.line];
  mapping.excerpt = line.slice(mapping.column, mapping.column + 650);
  assert.ok(mapping.excerpt.includes(mapping.proof)); mapping.generatedCoordinatesAreZeroBased = true;
}
const cases = [];
for (const id of ['learn','local-bot']) {
  const prefix = `${directory}/final27-mobile-hotpath-profile-${id}`;
  const summary = await json(`${prefix}-profile-summary.json`);
  const diagnostic = await json(`${directory}/.final27-mobile-hotpath-profile-${id}-timeline.json`);
  const profile = await json(`${directory}/.final27-mobile-hotpath-profile-${id}.cpuprofile`);
  assert.equal(summary.status, 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE');
  assert.equal(summary.summary.clockAlignment.rangeChecksPassed, true);
  const first = diagnostic.input.beforeInputs[0].at, last = diagnostic.input.beforeInputs.at(-1).at;
  const beforeEvents = diagnostic.events.filter(event=>event.startTime>=first && event.startTime<last);
  const containedEvents = beforeEvents.filter(event=>event.startTime+event.duration<=last);
  const boundaryEvents = beforeEvents.filter(event=>event.startTime+event.duration>last);
  const scripts = diagnostic.loafs.flatMap(frame=>frame.scripts.map(script=>({...script,frameStart:frame.startTime,frameDuration:frame.duration})));
  const beforeScripts = scripts.filter(script=>script.executionStart>=first && script.executionStart+script.duration<=last);
  const afterScripts = scripts.filter(script=>script.executionStart>=last);
  const nodes = new Map(profile.nodes.map(node=>[node.id,node])), parents = new Map();
  for(const node of profile.nodes)for(const child of node.children??[])parents.set(child,node.id);
  const nav = diagnostic.performanceBefore.metrics.find(item=>item.name==='NavigationStart').value;
  const resources = new Map(), focus = new Map(); let us = profile.startTime;
  for(let i=0;i<profile.samples.length;i++){
    const previous = us; us += profile.timeDeltas[i];
    const start = previous/1000-nav*1000, end = us/1000-nav*1000, node=nodes.get(profile.samples[i]);
    if(profile.timeDeltas[i]<0)continue;
    if(start>=first && end<last){
      let resource = `native:${node.callFrame.functionName}`;
      try{resource=new URL(node.callFrame.url).pathname;}catch{}
      resources.set(resource,(resources.get(resource)??0)+profile.timeDeltas[i]/1000);
    }
    if(node.callFrame.functionName==='focus'){
      const item=focus.get(node.id)??{nodeId:node.id,samples:0,sampleWeightMs:0,firstAt:end,lastAt:end,stack:[]};
      item.samples++;item.sampleWeightMs+=profile.timeDeltas[i]/1000;item.lastAt=end;
      if(!item.stack.length){let current=node.id;for(let depth=0;depth<18&&current;depth++,current=parents.get(current)){
        const frame=nodes.get(current).callFrame;let resource='native-or-inline';try{resource=new URL(frame.url).pathname;}catch{}
        item.stack.push({functionName:frame.functionName,resource,line:frame.lineNumber,column:frame.columnNumber});
      }}
      focus.set(node.id,item);
    }
  }
  cases.push({id,window:{firstBeforeInputAt:first,lastBeforeInputAt:last,inputReturnedAt:diagnostic.input.returnedAt},
    profilePhaseSummaries:Object.fromEntries(Object.entries(summary.summary.phaseSummaries).map(([name,value])=>[name,{
      bounds:value.bounds,assignedSampleWeightMs:value.assignedSampleWeightMs,
      programSample:value.topSelfFunctions.find(item=>item.functionName==='(program)'),
      reportedForcedStyleAndLayoutForFullyContainedScriptsMs:value.reportedForcedStyleAndLayoutForFullyContainedScriptsMs,
      reportedForcedStyleAndLayoutForOverlappingScriptsMs:value.reportedForcedStyleAndLayoutForOverlappingScriptsMs,
      overlappingLongAnimationFrames:value.overlappingLongAnimationFrames,
    }])),
    descriptiveEventBoundaryViews:{notAcceptanceFilters:true,byEventStartBeforeLastInsertion:stats(beforeEvents),fullyContainedBeforeLastInsertion:stats(containedEvents),
      boundaryCrossing:boundaryEvents.map(event=>({name:event.name,startTime:event.startTime,duration:event.duration,endTime:event.startTime+event.duration})),
      explanation:'Keydown/keypress may start before the final beforeinput marker yet span automatic result work. Their entire duration cannot be attributed to steady typing.'},
    fullyPreFinalScripts:beforeScripts.map(script=>({executionStart:script.executionStart,duration:script.duration,forcedStyleAndLayoutDuration:script.forcedStyleAndLayoutDuration,source:script.sourceURL,functionName:script.sourceFunctionName,invoker:script.invoker})),
    scriptsStartingAfterFinalInsertion:afterScripts.map(script=>({executionStart:script.executionStart,duration:script.duration,forcedStyleAndLayoutDuration:script.forcedStyleAndLayoutDuration,source:script.sourceURL,functionName:script.sourceFunctionName,invoker:script.invoker})),
    resourceSelfSampleWeightsBeforeFinal:[...resources].sort((a,b)=>b[1]-a[1]).slice(0,24).map(([resource,sampleWeightMs])=>({resource,sampleWeightMs})),
    nativeFocusSamples:[...focus.values()],
  });
}
const processReport = await json(`${directory}/final27-mobile-hotpath-profile-process.json`);
assert.equal(processReport.status, 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE');
assert.deepEqual(processReport.apiRequests, []);assert.equal(processReport.hashesUnchanged,true);
assert.equal(processReport.ownedServerClosed,true);assert.equal(processReport.ownBrowserChildExited,true);
const report = { capturedAt:new Date().toISOString(),status:'DIAGNOSTIC-OBSERVATIONS-NOT-ACCEPTANCE-OR-EXCLUSIVE-CAUSE',
  sourceBuild:'11de46af5d4a80e0e830',staticBuild:'fac344923bbf9cbde394',mappings,cases,
  interpretation:[
    'The original112ms Learn and112ms BOT acceptance failures remain unchanged. Diagnostic144/112ms and phase-specific event views cannot replace them.',
    'Learn steady pre-final fully-contained LoAF scripts report41.2ms forced layout; the final input script separately reports274ms duration and148.2ms forced layout.',
    'Baseline Learn native focus samples map directly to KeybrResults plain-focus effect and occur after the final insertion. This supports a bounded focus/scroll candidate, not a claim that all steady-state latency is solved.',
    'BOT reports10.8ms fully-contained forced layout in two pre-final LoAF scripts; its manual result Finish occurs after the profile stops.',
    'The70.4% Learn and73.4% BOT pre-final(program) sample weight is unattributed runtime time, not an exclusive layout, painting, throttling, or JavaScript bottleneck.',
    'LetterProgressPanel/keybr-engine do execute during Learn input, but their self weights are modest. Removing unrelated repeated UI/model work is a bounded hypothesis requiring a fresh ordinary acceptance run.',
  ],
  boundedCandidates:[
    {area:'Learn stats',proposal:'Reuse already memoized current-owner/dimension/revision stats, memoize stable evidence panel and selection handler; preserve refresh/invalidation on actual data/model changes.',proofLimit:'Observed repeated panel/model execution is not proof of the full112ms cause.'},
    {area:'Learn result focus',proposal:'Preserve accessible focus while using preventScroll:true, consistent with existing SessionResults. Verify viewport summary visibility in portrait, landscape and previously scrolled contexts before accepting.',proofLimit:'This targets the final transition, not all steady typing; no delayed or fake acceptance window.'},
    {area:'BOT presentation',proposal:'Review stable opponent presentation props and parent/child HUD reconciliation with every canonical edit and true clock update retained.',proofLimit:'Alignment caching already exists. Do not add duplicate core caches or reduce bot event/timing accuracy based on unattributed(program) samples.'},
  ],
  reviewerActions:{newProfiles:0,newBrowsers:0,newServices:0,productEditsForThisExtraction:0},
  limits:['CPU sample weights and LoAF/script durations overlap and cannot be summed into exclusive component costs.','Minified mappings use exact public-bundle positions and distinctive code; no new build or source map was generated.','One dynamic passage per diagnostic workspace, sampling/observer overhead, event quantization and profile timing limit generalization.'],
  inputHashes:hashes,
};
const output=`${directory}/final27-mobile-hotpath-evidence-observations.json`;
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status:report.status,sourceMappedFunctions:mappings.length,profiledCases:cases.length,newProfiles:0}));
