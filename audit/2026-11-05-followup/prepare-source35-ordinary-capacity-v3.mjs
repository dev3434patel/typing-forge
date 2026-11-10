import assert from'node:assert/strict';
import{readFile,writeFile,mkdir,access}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{filesystemSource35Preflight}from'./source35-ordinary-preflight.mjs';
const directory='audit/2026-11-05-followup',archive=`${directory}/capacity-v2-before`,sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(archive,{recursive:true});
const cleanupFile=`${directory}/pack-backend-c07524e1e4962966-cleanup.json`,cleanup=JSON.parse(await readFile(cleanupFile));assert.equal(cleanup.ownProcessesStopped,true);assert.equal(cleanup.gracefulDatabaseShutdown,true);assert.equal(cleanup.gracefulApacheShutdown,true);assert.equal(cleanup.forcedOwnDatabaseStop,false);assert.equal(cleanup.forcedOwnApacheStop,false);assert.deepEqual(cleanup.apacheResidualPids,[]);
for(const name of['source35-capacity-c07524e1e4962966.json','source35-capacity-c07524e1e4962966-protocol.json','source35-capacity-wire-c07524e1e4962966.json'])await assert.rejects(access(`${directory}/${name}`),{code:'ENOENT'});
const changes=[];
for(const name of['run-source35-capacity-burst.mjs','run-source35-capacity-wire-burst.mjs','run-source35-native-rate.mjs','pack-capacity-instance-source35.mjs','pack-capacity-instance-source35-wire.mjs']){
  const file=`${directory}/${name}`,archiveFile=`${archive}/${name}`;let original;
  try{original=await readFile(archiveFile,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;original=await readFile(file,'utf8');await writeFile(archiveFile,original,{flag:'wx'});}let text=original;const edits=[];
  const replace=(from,to)=>{assert.equal(text.split(from).length,2,`Unique v3 source span ${file}`);text=text.replace(from,to);edits.push({from,to});};
  if(name.startsWith('run-'))replace('final34-source.json','final35-source.json');
  else{
    replace("import readline from 'node:readline';","import readline from 'node:readline';\nimport { verifyPreparedOrdinarySource35 } from './source35-ordinary-preflight.mjs';");
    replace("assert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'","await verifyPreparedOrdinarySource35(); // Before initialization, process spawn or private configuration creation.\nassert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'");
  }
  let reversed=text;for(const edit of[...edits].reverse()){assert.equal(reversed.split(edit.to).length,2);reversed=reversed.replace(edit.to,edit.from);}assert.equal(reversed,original);
  const current=await readFile(file,'utf8');assert.ok(current===original||current===text,'Only the exact archived source or declared prepared revision may be present.');await writeFile(file,text);const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0);
  changes.push({file,beforeSha256:sha(original),afterSha256:sha(text),edits,exactReverse:true,nodeSyntaxExit:result.status});
}
const preflight=await filesystemSource35Preflight('d89f84d74519bf2bbae0');
const priorFile=`${directory}/source35-ordinary-capacity-preparation-v2.json`,prior=JSON.parse(await readFile(priorFile));
const receipt={preparedAt:new Date().toISOString(),status:'V3-FROZEN-FS-SOURCE-BUILD-PREFLIGHT-PASS-WAITING-INDEPENDENT-REVIEW-AND-NEW-ROOT-GO',priorPreparationFile:priorFile,priorPreparationSha256:sha(await readFile(priorFile)),retainedSetupFailures:[{owner:'8c164ff7da01c733',reason:'Missing baseowner identity file',actualCapacityRequests:0,gracefulCleanup:true},{owner:'c07524e1e4962966',reason:'Unconverted lowercase final34 manifest template path',actualCapacityRequests:0,gracefulCleanup:true,cleanupFile,cleanupSha256:sha(await readFile(cleanupFile))}],filePreparationFailure:{stage:'Explicit source35 producer dependency count',expected:17,observed:18,reason:'The newly added source35 core regression-test file is included in the506-file manifest. Corrected exact expected count to18; no source hash or acceptance threshold was relaxed.',nativeProcessesStarted:0},changes,preflight,entry:`${directory}/pack-capacity-instance-source35-wire.mjs`,newRequiredEnvironment:'SPAROWTYPE_SOURCE35_CAPACITY_PREPARATION_SHA256 must equal this exact independently reviewed receipt SHA256',flags:prior.flags,commands:prior.commands,predeclaredRepeatedAcceptance:prior.predeclaredRepeatedAcceptance,retainedHistoricalMetadataLabels:{nativeCompletionEvent:'pack-native-rate33-complete',nativeWorkerNamespace:'audit-native-rate33:<fresh random run>',assertionCopy:'Source20 capacity requires the real owned Apache runtime.',meaning:'Inherited metadata labels, not source-manifest reads. Native namespace is consistent between work and inspect. No orchestration currently waits that optional counter event.'},measuredApiActionsHeadersTimingOrPoliciesChanged:false,profilingEnabled:false,servicesStartedByPreparation:0,allPreparationAndSetupFailuresRetained:true};
const out=`${directory}/source35-ordinary-capacity-preparation-v3.json`,bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(out,bytes,{flag:'wx'});console.log(JSON.stringify({file:out,sha256:sha(bytes),requiredPaths:preflight.requiredPaths.length,sourceFiles:preflight.source.compared,producerDependencies:preflight.producerDependenciesVerified,runtimeInputs:Object.keys(preflight.runtimeInputs).length,build:preflight.build.version,servicesStarted:0}));
