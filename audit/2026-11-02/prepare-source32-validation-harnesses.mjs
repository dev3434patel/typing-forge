// PREPARATION ONLY. Source31 failed ordinary acceptance remains unchanged.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const previousFile = `${directory}/source31-validation-harness-preparation.json`;
const previous = JSON.parse(await readFile(previousFile, 'utf8'));
const output = `${directory}/source32-validation-harness-preparation.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const replacements = [['FINAL31','FINAL32'],['final31','final32'],['Source31','Source32'],['source31','source32']];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [];
for (const item of previous.files) {
  const original = item.target, target = original.replaceAll('final31','final32').replaceAll('source31','source32');
  await assert.rejects(access(target), { code: 'ENOENT' });
  const before = await readFile(original, 'utf8'); assert.equal(hash(before), item.targetSha256);
  let after = before;
  const substitutions = replacements.map(([from,to]) => { const count = after.split(from).length-1; after=after.replaceAll(from,to); return {from,to,count}; });
  let reversed = after;
  for (const change of [...substitutions].reverse()) { assert.equal(reversed.split(change.to).length-1,change.count); reversed=reversed.replaceAll(change.to,change.from); }
  assert.equal(reversed,before); files.push({original,target,before,after,substitutions});
}
const originalMobile = 'audit/2026-10-21/measure-mobile-workspaces.mjs';
let expected = await readFile(originalMobile,'utf8');
const references = [
  ["const directory = 'audit/2026-10-21';", "const directory = 'audit/2026-11-02';"],
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final32-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`','`${directory}/mobile-workspaces-final32-static-protocol.json`'],
  ['`${directory}/after-1-build.json`','`${directory}/mobile-workspaces-final32-static-build.json`'],
];
for(const[from,to]of references){assert.equal(expected.split(from).length-1,1);expected=expected.replace(from,to);}
assert.equal(files.find(file=>file.target.endsWith('/measure-mobile-workspaces-static-final32.mjs')).after,expected);
for(const file of files)await writeFile(file.target,file.after,{flag:'wx'});
await writeFile(output,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',
  previousPreparation:previousFile,files:files.map(file=>({original:file.original,target:file.target,originalSha256:hash(file.before),targetSha256:hash(file.after),substitutions:file.substitutions,exactReversalVerified:true})),
  originalMobileDriver:originalMobile,originalMobileDriverSha256:hash(await readFile(originalMobile)),references,
  originalNativeActionsTimingEventFilterAndAssertionsUnchanged:true,requiredSourceHashes:505,
  requiredManifest:`${directory}/final32-source.json`,sourceBuildFlag:'SPAROWTYPE_FINAL32_BUILD_ID',staticBuildFlag:'SPAROWTYPE_FINAL32_STATIC_BUILD_ID',actualIdsRequiredAfterStableFreeze:true,
  originalEventLatencyGate:'Every workspace in every trial p98ObservedTypingEventDurationMs<100ms; retained unmodified.',
  additionalInteractionLatencyGate:'Separate assessment of every workspace p98ObservedInteractionMaximumMs<100ms; both gates required. No historical assessment edited.',
  nativeEventCardinalityDisclosure:'The proposed source32 trusted/cancelable insertion fast path naturally prevents redundant native insertion/input events. Original native actions, beforeinput accounting and event filter stay identical. Counts must be reported; interaction-max acceptance is additionally required so event-cardinality changes cannot alone establish success.',
  source31OrdinaryTrial3Learn128FailureRetained:true,source31DiagnosticPreFinal112AndFull136Retained:true,
  native:{freshOwnedBackends:4,sequential:true,exactCasesPerEngine:5,expectedTotal:20,unchangedRatePolicy:true},
  servicesStarted:0,testsRun:0,buildsRun:0,productFilesEdited:false,
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status:'PREPARED-NOT-RUN',files:files.length,originalDriverReversal:true,runtimeJobs:0}));
