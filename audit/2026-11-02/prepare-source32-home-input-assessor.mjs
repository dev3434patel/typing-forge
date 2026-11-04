// Preparation only: exact source31 assessor with32 prefix/source/build identity.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='audit/2026-11-02',original=`${directory}/assess-source31-home-input.mjs`,target=`${directory}/assess-source32-home-input.mjs`;
const output=`${directory}/source32-home-input-assessor-preparation.json`;
for(const file of[target,output])await assert.rejects(access(file),{code:'ENOENT'});
const before=await readFile(original,'utf8');
const after=before.replaceAll('source31','source32').replaceAll('final31','final32').replaceAll('f52d0372fe7656817259','332e23584f1e36465df2');
assert.equal(after.replaceAll('source32','source31').replaceAll('final32','final31').replaceAll('332e23584f1e36465df2','f52d0372fe7656817259'),before);
const hash=value=>createHash('sha256').update(value).digest('hex');
await writeFile(target,after,{flag:'wx'});
await writeFile(output,JSON.stringify({status:'PREPARED-NOT-RUN',recordedAt:new Date().toISOString(),original,originalSha256:hash(before),entry:target,sha256:hash(after),exactPrefixSourceBuildIdentityReversal:true,
  build:'332e23584f1e36465df2',requiredRawTrials:[1,2,3],strictP98EachTrialBelowMs:100,exactAttemptsAndNativeBeforeInputEventsEach:495,accuracyPercent:100,rotationRetainedPrefixUnits:247,browserErrorsRequired:0,overflowAllowed:false,
  originalDriverOnlyDirectoryChangeVerifiedAtAssessment:true,noMaximumLatencyThresholdAdded:true,maximaRetained:true,trialsLaunchedByAssessment:0,existingHarnessOrResultEdits:false,rootGoRequiredAfterAllThreeTrials:true,
  executionDateQualification:'Prepared Nov3 UTC in the ongoing11-02 checkpoint; this is not a claim that trials have run.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status:'PREPARED-NOT-RUN',entry:target,exactReversal:true,trialsExecuted:0}));
