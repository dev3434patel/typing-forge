import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
const directory='audit/2026-11-05-followup',sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldPlanFile=`${directory}/source35-ordinary-capacity-preparation-v3.json`,oldPlan=JSON.parse(await readFile(oldPlanFile));
const pairs=[['source35','source36'],['SOURCE35','SOURCE36'],['Source35','Source36'],['FINAL35','FINAL36'],['final35','final36'],['capacity35','capacity36'],['rate-native35','rate-native36'],['ordinary35','ordinary36']];
const map=value=>pairs.reduce((text,[from,to])=>text.replaceAll(from,to),value);
const changes=[];
for(const name of['pack-capacity-instance-source35.mjs','pack-capacity-instance-source35-wire.mjs','run-source35-capacity-burst.mjs','run-source35-capacity-wire-burst.mjs','run-source35-native-rate.mjs','native-rate-worker-source35.php','source35-ordinary-preflight.mjs']){
 const originalFile=`${directory}/${name}`,original=await readFile(originalFile,'utf8'),file=map(originalFile);let text=original;const replacements=[];
 for(const[from,to]of pairs){const count=text.split(from).length-1;if(count){text=text.replaceAll(from,to);replacements.push({from,to,count});}}
 let reversed=text;for(const edit of[...replacements].reverse()){assert.equal(reversed.split(edit.to).length-1,edit.count);reversed=reversed.replaceAll(edit.to,edit.from);}assert.equal(reversed,original);
 assert.ok(!/(?:source35|SOURCE35|Source35|FINAL35|final35|capacity35|rate-native35|ordinary35)/.test(text));
 await writeFile(file,text,{flag:'wx'});const result=file.endsWith('.mjs')?spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true}):null;if(result)assert.equal(result.status,0);
 changes.push({originalFile,originalSha256:sha(original),file,sha256:sha(text),replacements,exactReverse:true,nodeSyntaxExit:result?.status??null});
}
const{filesystemSource36Preflight}=await import('./source36-ordinary-preflight.mjs');
const preflight=await filesystemSource36Preflight('d89f84d74519bf2bbae0');
const flags=Object.fromEntries(Object.entries(oldPlan.flags).map(([key,value])=>[map(key),typeof value==='string'?map(value):value]));
const receipt={preparedAt:new Date().toISOString(),status:'SOURCE36-V3-FROZEN-PREFLIGHT-PASS-WAITING-INDEPENDENT-REVIEW-AND-NEW-ROOT-GO',formatVersion:3,formatQualification:'V3 names the independently corrected shared adapter/preflight format inherited from Source35. No Source36 runtime or setup attempt has occurred.',priorAdapter:{file:oldPlanFile,sha256:sha(await readFile(oldPlanFile)),source35Failure:'Ordinary full166.6268ms FAILED,wire140.5566ms PASS; previous Source35 setup failures remain retained separately.'},changes,preflight,entry:`${directory}/pack-capacity-instance-source36-wire.mjs`,newRequiredEnvironment:'SPAROWTYPE_SOURCE36_CAPACITY_PREPARATION_SHA256 must equal this exact independently reviewed receipt SHA256',flags,commands:['capacity36','capacity36-wire','cleanup'],predeclaredRepeatedAcceptance:oldPlan.predeclaredRepeatedAcceptance,retainedHistoricalMetadataLabels:oldPlan.retainedHistoricalMetadataLabels,noMeasuredApplicationActionTimingOrPolicyChanges:true,noProfilerOrVariantHeaders:true,OPcacheOffReadinessRequired:true,persistentPDO:false,actualCapacityAttempts:0,servicesStarted:0,allSource35ResultsRetained:true};
const file=`${directory}/source36-ordinary-capacity-preparation-v3.json`,bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(file,bytes,{flag:'wx'});console.log(JSON.stringify({file,sha256:sha(bytes),sourceFiles:preflight.source.compared,build:preflight.build.version,requiredPaths:preflight.requiredPaths.length,runtimeInputs:Object.keys(preflight.runtimeInputs).length,producerDependencies:preflight.producerDependenciesVerified,activeSourcePaths:changes.filter(row=>row.file.includes('run-source36-')).map(row=>row.file),runtime:false}));
