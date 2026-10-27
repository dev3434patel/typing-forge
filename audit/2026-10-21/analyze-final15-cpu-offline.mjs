import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const directory = 'audit/2026-10-21';
const profileFile = `${directory}/final15-cpu-loaf-native-diagnostic.cpuprofile`;
const outputFile = `${directory}/final15-cpu-offline-analysis.json`;
await assert.rejects(access(outputFile), { code: 'ENOENT' });
const raw = await readFile(profileFile);
const profile = JSON.parse(raw.toString('utf8'));
assert.equal(profile.samples.length, profile.timeDeltas.length);
const nodes = new Map(profile.nodes.map(node => [node.id,node]));
const parents = new Map();
for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child,node.id);
function safeFrame(node) {
  const frame = node.callFrame;
  let asset = 'native-or-inline';
  try { const pathname = new URL(frame.url).pathname; if (/\/assets\/[^/]+\.js$/.test(pathname)) asset=pathname.slice(pathname.lastIndexOf('/')+1); } catch { /* Numeric/compiled evidence only. */ }
  return { asset, functionName: frame.functionName || '(anonymous)', line: frame.lineNumber, column: frame.columnNumber };
}
const stackFor = new Map();
for (const node of profile.nodes) {
  const stack = [], seen = new Set();
  let id = node.id;
  while (id !== undefined && !seen.has(id)) { seen.add(id); const current=nodes.get(id); if (!current) break; stack.push(safeFrame(current)); id=parents.get(id); }
  stackFor.set(node.id,stack);
}
const branches = {};
const functions = new Map(), stacks = new Map();
const negativeDeltas = [], missingNodes = [];
let timestamp=profile.startTime;
for (let i=0;i<profile.samples.length;i++) {
  const id=profile.samples[i], delta=profile.timeDeltas[i];
  assert.equal(Number.isFinite(delta),true);
  timestamp+=delta; // Signed delta retained exactly; no clamp or reordering.
  if (delta<0) negativeDeltas.push({index:i,deltaMicroseconds:delta,nodeId:id,sampleMicroseconds:timestamp});
  if (!nodes.has(id)) { missingNodes.push({index:i,nodeId:id}); continue; }
  const stack=stackFor.get(id), leaf=stack[0];
  const key=JSON.stringify(leaf);
  functions.set(key,{frame:leaf,sampledHits:(functions.get(key)?.sampledHits??0)+1});
  stacks.set(id,(stacks.get(id)??0)+1);
  const session=stack.filter(frame=>frame.asset.startsWith('session-'));
  const branch=session.some(frame=>['finish','result','get result'].includes(frame.functionName))?'finish-or-result'
    :session.some(frame=>frame.functionName==='snapshot')?'snapshot-without-finish-ancestor'
    :session.length?'other-session-ancestor':'no-session-ancestor';
  const row=branches[branch]??={samples:0,freezeLeafSamples:0,freezeOnStackSamples:0,functions:new Map()};
  row.samples++;
  const freeze=frame=>frame.asset.startsWith('session-')&&frame.functionName==='w'&&frame.line===0&&frame.column===167;
  if (freeze(leaf)) row.freezeLeafSamples++;
  if (stack.some(freeze)) {
    row.freezeOnStackSamples++;
    row.functions.set(key,{frame:leaf,sampledHits:(row.functions.get(key)?.sampledHits??0)+1});
  }
}
for (const branch of Object.values(branches)) branch.functions=[...branch.functions.values()].sort((a,b)=>b.sampledHits-a.sampledHits).slice(0,12);
const freezeFrames=[...functions.values()].filter(({frame})=>frame.asset.startsWith('session-')&&frame.functionName==='w');
const top=[...functions.values()].sort((a,b)=>b.sampledHits-a.sampledHits).slice(0,35);
const report={capturedAt:new Date().toISOString(),status:'OFFLINE-RECOVERY-NOT-TIME-ALIGNED',profileFile,
  rawSha256:createHash('sha256').update(raw).digest('hex'),rawBytes:raw.length,nodes:profile.nodes.length,samples:profile.samples.length,
  clockAlignment:'UNAVAILABLE: NavigationStart and before/after CDP metrics were not persisted before original helper exception; raw CPU profile contains no document clock origin.',
  analysisFailure:{cause:'Audit helper rejected delta<0 although the actual profile has one finite signed -63microsecond delta and no absent sample nodes.',negativeDeltas,missingNodes,
    rawStartMicroseconds:profile.startTime,rawEndMicroseconds:profile.endTime,summedSignedDeltaMicroseconds:timestamp-profile.startTime,lastSampleMicroseconds:timestamp},
  freezeIdentification:'Compiled session chunk function w at0:167, verified against prior/current frozen artifact structure as recursive freeze; no precision source maps.',
  freezeFrames,branches,topLeafFunctions:top,
  topNestedStacks:[...stacks].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,sampledHits])=>({sampledHits,leafFirst:stackFor.get(id).slice(0,32),truncated:stackFor.get(id).length>32})),
  limitations:['Whole-profile sampled ancestry only, not slow-event correlation or invocation counts.','Related recursion frames count once per sample for inclusive freeze; leaf and inclusive counts must not be added.','Program/native samples remain unattributed. Raw bytes and original failed protocol are unchanged.','No browser, resample, clock mutation, product change or acceptance replacement.']};
await writeFile(outputFile,JSON.stringify(report,null,2),{flag:'wx'});
console.log(JSON.stringify({outputFile,samples:report.samples,negativeDeltas,missingNodes,branches,topLeafFunctions:top.slice(0,12)},null,2));
