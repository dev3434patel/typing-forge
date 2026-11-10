import assert from 'node:assert/strict';
import { access, readFile, realpath, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { verifyPreparedSource36NativeArena32 } from './source36-native-arena32-preflight.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE36_ARENA_HTTP_WINDOW,'1','A separately coordinated native functional window is required.');
const before=await verifyPreparedSource36NativeArena32();
const ownerId=process.env.SPAROWTYPE_ARENA_HTTP_OWNER_ID;
assert.match(ownerId??'',/^[a-f0-9]{16}$/);
const root=await realpath(process.cwd()),dir=path.join(root,'audit/2026-11-05-followup');
const owned=await realpath(path.join(root,'backend/storage',`pack-instance-${ownerId}`));
assert.equal(path.dirname(owned),await realpath(path.join(root,'backend/storage')));
assert.equal(path.basename(owned),`pack-instance-${ownerId}`);
const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));
assert.equal(marker.id,ownerId);assert.equal(marker.runnerPid,process.ppid);assert.equal(await realpath(marker.root),root);
assert.equal(await realpath(process.env.ARENA_AUDIT_CONFIG??''),path.join(owned,'app-config.php'));
assert.match(process.env.ARENA_AUDIT_GUARD??'',/^[a-f0-9]{64}$/);
const origin=new URL(process.env.ARENA_AUDIT_ORIGIN??'invalid');
assert.equal(origin.protocol,'http:');assert.equal(origin.hostname,'127.0.0.1');assert.equal(origin.pathname,'/api/');
assert.ok(origin.port&&!['3306','3307','3308','4173','8081'].includes(origin.port));
const rawFile=path.join(dir,`pack-backend-${ownerId}-arena-http-raw.json`),protocolFile=path.join(dir,`pack-backend-${ownerId}-arena-http36-protocol.json`),guardFile=path.join(dir,`pack-backend-${ownerId}-arena-http36-source-guard.json`);
assert.equal(path.resolve(process.env.ARENA_HTTP_REPORT??''),rawFile);
for(const file of [rawFile,protocolFile,guardFile])await assert.rejects(access(file),{code:'ENOENT'});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const privateFiles={appConfig:path.join(owned,'app-config.php'),appJson:path.join(owned,'app.json'),phpIni:path.join(owned,'php.ini'),apacheConfig:path.join(owned,'apache-audit.conf'),generatedShim:path.join(owned,'apache-public/index.php'),ownedDatabaseAdminConfig:path.join(owned,'admin.json')};
const privateHashes=async()=>{
  const current=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(current.id,ownerId);assert.equal(current.runnerPid,process.ppid);assert.equal(await realpath(current.root),root);
  const hashes={};for(const [name,file]of Object.entries(privateFiles)){const actual=await realpath(file);assert.equal(actual,path.resolve(file));const relative=path.relative(owned,actual);assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));hashes[name]=sha(await readFile(actual));}return hashes;
};
const privateBefore=await privateHashes();
await writeFile(protocolFile,JSON.stringify({at:new Date().toISOString(),ownerId,scope:'Native functional Arena lifecycle only; no capacity,rate,latency or Lighthouse workload.',currentSource:before,originalDriver:'audit/2026-11-02/run-source34-arena-chart-http.mjs',expectedAssertions:32,original29Preserved:true,additionalFinishHistoryRetryAssertions:3,originalThreeWayCreationRacePreserved:true,retries:'No harness retry. Existing prefix/final retry assertions test application idempotence.',ordinaryClockAndTimeoutsUnchanged:true,privateInputHashes:privateBefore,privateContentsPublished:false,rawOutput:path.relative(root,rawFile).replaceAll('\\','/'),guardOutput:path.relative(root,guardFile).replaceAll('\\','/'),serviceCleanup:'PENDING SAME OWNER CLEANUP'},null,2)+'\n',{flag:'wx'});
let importFailed=false,raw=null,rawBytes=null,after=null,privateAfter=null,integrityFailed=false;
try{await import('../2026-11-02/run-source34-arena-chart-http.mjs');}catch{importFailed=true;}
try{rawBytes=await readFile(rawFile);raw=JSON.parse(rawBytes);}catch{/* A missing original report remains a failure, never a pass. */}
try{after=await verifyPreparedSource36NativeArena32();assert.deepEqual(after,before);privateAfter=await privateHashes();assert.deepEqual(privateAfter,privateBefore);}catch{integrityFailed=true;}
const originalChecksComplete=raw?.checks?.length===32&&raw?.passed===32&&raw?.failed===0&&raw.checks.every(row=>row.pass===true);
const passed=!importFailed&&!integrityFailed&&(process.exitCode??0)===0&&raw?.status==='PASS-SCOPED'&&raw?.failure===null&&originalChecksComplete&&raw?.cleanup?.deletedOwnAccounts===3&&raw?.cleanup?.removedOwnSessions===3;
const result={at:new Date().toISOString(),status:passed?'PASS-SCOPED-NATIVE-ARENA32':'FAILED',ownerId,passed:raw?.passed??0,failed:raw?.failed??null,expectedAssertions:32,allOriginalChecksComplete:Boolean(originalChecksComplete),originalDriverImportFailed:importFailed,integrityFailed,rawFile:path.relative(root,rawFile).replaceAll('\\','/'),rawSha256:rawBytes?sha(rawBytes):null,sourceBefore:before,sourceAfter:after,privateInputHashesBefore:privateBefore,privateInputHashesAfter:privateAfter,privateContentsPublished:false,fixtureCleanup:raw?.cleanup??null,ordinaryNativeClockUnchanged:true,capacityOrRateBenchmark:false,latencyTargetMeasured:false,browserHumanInputClaim:false,serviceCleanup:'PENDING SAME OWNER CLEANUP'};
await writeFile(guardFile,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,ownerId,passed:result.passed,failed:result.failed,guardFile:result.rawFile.replace('arena-http-raw.json','arena-http36-source-guard.json')}));
if(!passed)process.exitCode=1;
