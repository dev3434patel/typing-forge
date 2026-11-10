import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { filesWithin } from '../2026-10-21/artifact-verification.mjs';
import { verifyDiagnosticClone } from './arena-diagnostic-guard.mjs';
const directory='audit/2026-11-04-capacity-followup';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const preparationFile=`${directory}/owned-arena-diagnostic-observation-preparation.json`;
const bytes=await readFile(preparationFile),preparation=JSON.parse(bytes);
assert.equal(sha(bytes),process.env.SPAROWTYPE_ARENA_DIAGNOSTIC_OBSERVATION_SHA256);
assert.equal(sha(await readFile(import.meta.filename)),preparation.controllerSha256);
assert.equal(sha(await readFile(preparation.mainManifestFile)),preparation.mainManifestSha256);
assert.equal(process.env.SPAROWTYPE_ARENA_DIAGNOSTIC_PREPARATION_SHA256,preparation.mainManifestSha256);
const snapshot=async()=>{
  const files=[...(await readdir('e2e')).filter(name=>name.endsWith('.ts')).map(name=>`e2e/${name}`),'playwright.config.ts'].sort();
  assert.equal(files.length,73);
  const tests=Object.fromEntries(await Promise.all(files.map(async file=>[file,sha(await readFile(file))])));
  const artifacts=Object.fromEntries(await Promise.all((await filesWithin('dist')).map(async file=>[file,sha(await readFile(`dist/${file}`))])));
  const build=JSON.parse(await readFile('dist/offline-build.json'));
  return {tests,artifacts,build};
};
const before=await snapshot();assert.deepEqual(before,preparation.snapshot);
const identity=await verifyDiagnosticClone();
const prefix=`${directory}/owned-arena-diagnostic`;
await writeFile(`${prefix}-observation-protocol.json`,JSON.stringify({declaredAt:new Date().toISOString(),preparationFile,preparationSha256:sha(bytes),mainManifestSha256:preparation.mainManifestSha256,source:identity.source,actualFrontendBuildMetadata:before.build,testDependencyCount:73,artifactFiles:Object.keys(before.artifacts).length,order:['native-lock-proof','baseline-full1653','cache-full1653','graceful-cleanup'],qualification:'One fresh owned OPcache-disabled service; baseline then candidate use original producer and protocol. The candidate follows a populated/warmed database. This is instrumented ordered diagnosis, not final ordinary or independently cold acceptance.',noAddedWarmup:true,retries:0},null,2)+'\n',{flag:'wx'});
const child=spawn(process.execPath,[`${directory}/run-owned-arena-diagnostic.mjs`],{windowsHide:true,env:process.env,stdio:['pipe','pipe','pipe']});
let log='',ownerId=null,ownedConfig=null,configSha256=null,sourceIntegrity=true,closure=null,queue=Promise.resolve(),handlingError=null;
const milestones=[];
const lines=readline.createInterface({input:child.stdout});
async function retainConfigHash(){assert.ok(ownedConfig);const actual=sha(await readFile(ownedConfig));if(configSha256===null)configSha256=actual;assert.equal(actual,configSha256);return actual;}
const command=value=>child.stdin.write(value+'\n');
lines.on('line',line=>{
  log+=line+'\n';process.stdout.write(line+'\n');
  let event;try{event=JSON.parse(line);}catch{return;}
  queue=queue.then(async()=>{
    if(event.stage==='ephemeral-holding'){
      ownerId=event.ownerId;assert.match(ownerId,/^[a-f0-9]{16}$/);ownedConfig=event.privateConfigFile;
      assert.ok(typeof ownedConfig==='string'&&ownedConfig.replaceAll('\\','/').endsWith(`/backend/storage/pack-instance-${ownerId}/app-config.php`));
      await retainConfigHash();await verifyDiagnosticClone();milestones.push({at:new Date().toISOString(),stage:'owned-ready',privateConfigSha256:configSha256});command('db-proof');
    }else if(event.stage==='diagnostic-db-proof-closed'){
      await retainConfigHash();await verifyDiagnosticClone();milestones.push({at:new Date().toISOString(),stage:'native-lock-proof',passed:event.passed,failed:event.failed});command('baseline-full');
    }else if(event.stage==='diagnostic-http-closed'){
      await retainConfigHash();await verifyDiagnosticClone();
      assert.deepEqual(await snapshot(),before);
      milestones.push({at:new Date().toISOString(),stage:event.variant,total:event.total,p95Ms:event.p95Ms,targetMet:event.targetMet,privateConfigUnchanged:true});
      command(event.variant==='baseline'?'candidate-full':'cleanup');
    }else if(event.stage==='ephemeral-cleanup')closure=event;
  }).catch(error=>{sourceIntegrity=false;handlingError={name:error.name,message:String(error.message).slice(0,300)};if(!child.stdin.destroyed)command('cleanup');});
});
child.stderr.on('data',chunk=>{const value=chunk.toString();log+=value;process.stderr.write(value);});
const exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});await queue;
await writeFile(`${prefix}-output.log`,log,{flag:'wx'});
let sourceAfter=null,after=null;try{sourceAfter=await verifyDiagnosticClone();after=await snapshot();assert.deepEqual(after,before);}catch(error){sourceIntegrity=false;handlingError??={name:error.name,message:String(error.message).slice(0,300)};}
const complete=milestones.some(row=>row.stage==='baseline')&&milestones.some(row=>row.stage==='candidate');
const graceful=closure?.ownProcessesStopped===true&&closure.gracefulDatabaseShutdown===true&&closure.gracefulApacheShutdown===true&&closure.forcedOwnDatabaseStop===false&&closure.forcedOwnApacheStop===false&&closure.apacheResidualPids?.length===0;
const result={closedAt:new Date().toISOString(),status:exitCode===0&&complete&&sourceIntegrity&&graceful?'DIAGNOSTIC-CLOSED-SCOPED':'FAILED',childExitCode:exitCode,ownerId,milestones,privateConfigurationSha256:configSha256,privateConfigurationContentsExported:false,source505AndInputsStable:sourceIntegrity,sourceAfter:sourceAfter?.source??null,actualFrontendBuildMetadata:before.build,testDependencies73Unchanged:after!==null&&JSON.stringify(after.tests)===JSON.stringify(before.tests),artifactFilesUnchanged:after!==null&&JSON.stringify(after.artifacts)===JSON.stringify(before.artifacts),closure,complete,handlingError,capacityAcceptanceClaimed:false,ordinarySource34FailuresRetained:true};
await writeFile(`${prefix}-observation-result.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({diagnosticClosed:true,status:result.status,childExitCode:exitCode,ownerId,milestones,source505AndInputsStable:sourceIntegrity,allOwnedServicesClosedGracefully:graceful}));
if(result.status!=='DIAGNOSTIC-CLOSED-SCOPED')process.exitCode=1;
