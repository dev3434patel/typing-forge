// Bounded diagnostic only; never replaces ordinary acceptance environment.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
assert.equal(process.env.SPAROWTYPE_SOURCE24_DB_PROFILE_ACCEPTANCE,'1');
const directory='audit/2026-10-27',owner=process.env.SPAROWTYPE_CAPACITY_OWNER_ID,build=process.env.SPAROWTYPE_FINAL24_BUILD_ID;
assert.match(owner??'',/^[a-f0-9]{16}$/);assert.match(build??'',/^[a-f0-9]{20}$/);
const source=`${directory}/final24-source.json`,initial=await verifyFrozenSource(source);
assert.equal(initial.frozen.local.version,build);assert.equal(initial.receipt.compared,504);assert.deepEqual(initial.receipt.mismatches,[]);
const prefix=`${directory}/source24-database-profile-${owner}`,runtime=phpRuntime();
for(const suffix of ['-protocol.json','.json','-before.json','-after.json'])await assert.rejects(access(prefix+suffix),{code:'ENOENT'});
const inputs=[import.meta.filename,`${directory}/owned-database-profile-source24.php`,`${directory}/pack-backend-instance-source24-db-profile.mjs`,`${directory}/run-source24-capacity-db-profile.mjs`,`${directory}/run-source24-capacity-burst.mjs`,'scripts/php-runtime.mjs'];
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const inputHashes=Object.fromEntries(await Promise.all(inputs.map(async file=>[file,await hash(file)])));
const protocol={declaredAt:new Date().toISOString(),status:'DECLARED-NOT-RUN',build,source:initial.receipt,ownerId:owner,scope:'One exact1653-operation/concurrency20 capacity burst in a separately owned Performance-Schema-enabled diagnostic environment. All original assertions and strict150ms target retained, without ordinary-environment acceptance claim.',instrumentation:'Statement digest and InnoDB file-wait summary aggregation only; history consumers disabled; no raw SQL/history export.',changes:['Owned MariaDB startup performance_schema OFF→ON','Owned Performance Schema consumer/instrument enablement only'],durabilityLimitsAndApplicationSourceChanged:false,retries:0,queriesBounded:256,digestNullOrLostMeansIncomplete:true,inputHashes,originalConfigRead:false,privateConfigLoadedOnlyByGuardedPhp:'Fresh owner admin.json, never original configuration',serviceCleanup:'Original owner stdin cleanup in finally after completion.'};
await writeFile(prefix+'-protocol.json',JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
let before=null,after=null,capacity=null,failure=null,capacityExitCode=null;
const snapshot=phase=>{
  const run=spawnSync(runtime.binary,[...runtime.args,`${directory}/owned-database-profile-source24.php`,phase],{encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:1024*1024});
  assert.equal(run.status,0,`Guarded ${phase} snapshot failed; private diagnostics suppressed.`);assert.equal(run.stderr,'');
  const value=JSON.parse(run.stdout);assert.equal(value.status,'PASS-SCOPED-OWNED-SNAPSHOT');assert.equal(value.ownerId,owner);assert.equal(value.identityMatched,true);return value;
};
try{
  before=snapshot('before');await writeFile(prefix+'-before.json',JSON.stringify(before,null,2)+'\n',{flag:'wx'});
  const run=spawnSync(process.execPath,['--experimental-transform-types',`${directory}/run-source24-capacity-db-profile.mjs`],{encoding:'utf8',windowsHide:true,timeout:210000,maxBuffer:1024*1024});
  capacityExitCode=run.status;
  assert.ok(run.status===0||run.status===1,'Capacity process interrupted or timed out; no retry.');
  capacity=JSON.parse(await readFile(`${directory}/source24-capacity-db-profile-${owner}.json`,'utf8'));
}catch(error){failure={name:error.name,message:String(error.message).slice(0,300)};}
finally{
  try{after=snapshot('after');await writeFile(prefix+'-after.json',JSON.stringify(after,null,2)+'\n',{flag:'wx'});}catch(error){failure??={name:error.name,message:'Guarded after snapshot unavailable.'};}
  const sourceAfter=(await verifyFrozenSource(source)).receipt,inputsUnchanged=(await Promise.all(inputs.map(async file=>await hash(file)===inputHashes[file]))).every(Boolean);
  const subtract=(newRows,oldRows,key,fields)=>newRows.map(row=>{const prior=oldRows.find(old=>old[key]===row[key])??{};return {...row,...Object.fromEntries(fields.map(field=>[field,row[field]-(prior[field]??0)]))};}).filter(row=>row.count>0);
  const digestDelta=before&&after?subtract(after.digests,before.digests,'digest',['count','totalMs','lockMs','errors','rowsAffected','rowsSent','rowsExamined']):[];
  const fileWaitDelta=before&&after?subtract(after.fileWaits,before.fileWaits,'event',['count','totalMs']):[];
  const statusDelta=before&&after?Object.fromEntries(Object.entries(after.globalStatus).filter(([key])=>/^(Com_|Handler_|Innodb_|Performance_schema_)/i.test(key)).map(([key,value])=>[key,Number(value)-Number(before.globalStatus[key]??0)])):{};
  const rateCalls=digestDelta.filter(row=>row.category==='rate-upsert').reduce((sum,row)=>sum+row.count,0);
  const overflow=before&&after?(before.digestOverflowCount+after.digestOverflowCount+Number(statusDelta.Performance_schema_digest_lost??0)):null;
  const complete=!failure&&before&&after&&capacity?.total===1653&&capacity?.protocol?.concurrency===20&&rateCalls===1653&&overflow===0&&sourceAfter.mismatches.length===0&&inputsUnchanged;
  const report={status:complete?'PASS-SCOPED-DIAGNOSTIC':'FAILED',protocol,finishedAt:new Date().toISOString(),failure,capacityExitCode,capacityReceipt:`source24-capacity-db-profile-${owner}.json`,capacityStatus:capacity?.status??'NOT-RUN',ordinaryAcceptanceReplaced:false,rateUpsertCount:rateCalls,digestOverflowOrLoss:overflow,digestDelta,fileWaitDelta,statusDelta,sourceAfter,inputsUnchanged,limits:['Performance Schema changes diagnostic overhead; ordinary315ms failure remains retained.','Digest/commit totals can overlap and are not summed into exclusive HTTP time.','Window includes owned fixture provisioning/deletion; inspect categories rather than assigning all database totals to HTTP.','LOCK_TIME is the server-provided statement aggregate, not proof of complete InnoDB row-lock attribution.','Max fields are cumulative since this fresh server started, not subtractable interval percentiles.','PHP parsing/JSON/replay time outside SQL is not measured.','No raw queries, sessions, cookies, private credentials or statement history are published.'],serviceCleanup:'PENDING-SAME-OWNER-CLEANUP'};
  await writeFile(prefix+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:report.status,capacityStatus:report.capacityStatus,rateUpsertCount:rateCalls,output:prefix+'.json',capacityExitCode}));
  process.exitCode=complete&&capacityExitCode===0?0:1;
}
