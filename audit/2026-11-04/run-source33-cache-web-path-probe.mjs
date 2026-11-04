import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFile,realpath,writeFile} from 'node:fs/promises';
import {SessionController} from '../../src/lib/typing-core/index.ts';
import {phpRuntime} from '../../scripts/php-runtime.mjs';
import {verifyFrozenSource} from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE33_CACHE_WEB_PROBE,'1');
const owner=process.env.SPAROWTYPE_CAPACITY_OWNER_ID;
assert.match(owner??'',/^[a-f0-9]{16}$/);
const origin=new URL(process.env.ARENA_AUDIT_ORIGIN??'invalid');
assert.equal(origin.hostname,'127.0.0.1');assert.equal(origin.pathname,'/api/');
assert.ok(![3306,3307,3308,4173,8081].includes(Number(origin.port)));
const owned=await realpath(path.join('backend/storage',`pack-instance-${owner}`));
const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));
assert.equal(marker.id,owner);assert.equal(path.resolve(marker.root),process.cwd());
assert.equal(await realpath(process.env.ARENA_AUDIT_CONFIG??''),path.join(owned,'app-config.php'));
const before=await verifyFrozenSource('audit/2026-11-02/final33-source.json');
assert.equal(before.receipt.compared,505);assert.deepEqual(before.receipt.mismatches,[]);
const reportFile=`audit/2026-11-02/source33-cache-web-path-probe-${owner}.json`;
const runId=randomBytes(6).toString('hex'), runtime=phpRuntime(), requests=[], checks=[];
const headerKeys=['webSapi','ownedIniMatches','cacheEnabled','ownerCacheIsolationMatches','timestampValidationEnabled','everyRequestRevalidation','jitDisabled'];
const admin=body=>{const result=spawnSync(runtime.binary,[...runtime.args,'backend/tests/arena-audit-admin.php'],{input:JSON.stringify({...body,runId}),encoding:'utf8',env:process.env,windowsHide:true,timeout:15000});assert.equal(result.status,0,'Owned fixture operation failed; private details suppressed');return JSON.parse(result.stdout);};
const check=(name,pass)=>{checks.push({name,pass:Boolean(pass)});assert.ok(pass,name);};
const request=async(account,action,body)=>{
 const response=await fetch(new URL(action==='auth/session'?action:`arena/${action}`,origin),{method:body===undefined?'GET':'POST',headers:{Cookie:account.cookie,...(body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':account.csrf})},...(body===undefined?{}:{body:JSON.stringify({...body,expectedOwner:account.id})}),signal:AbortSignal.timeout(5000)});
 let header=null;try{header=JSON.parse(Buffer.from(response.headers.get('X-Sparow-Opcache-Probe')??'','base64').toString('utf8'));}catch{}
 const row={action,status:response.status,apiRuntimeHeader:header};requests.push(row);
 // Persist safe API facts before any proof assertion.
 await writeFile(reportFile,JSON.stringify({status:'RUNNING',owner,checks,requests},null,2)+'\n');
 assert.ok(header&&Object.keys(header).sort().join()===headerKeys.slice().sort().join(),'Exact sanitized API header shape');
 assert.ok(Object.values(header).every(value=>value===true),'Each real application request uses the owned cache profile');
 const value=await response.json();check(`Actual ${action} accepted`,response.status===200);return value;
};
const snapshot=async stage=>{
 const response=await fetch(new URL('../__audit-opcache-path-probe.php',origin),{headers:{'X-Sparow-Profile-Guard':process.env.ARENA_AUDIT_GUARD},signal:AbortSignal.timeout(5000)});
 const value=await response.json();
 const safe=(item,depth=0)=>depth<10&&(item===null||typeof item==='boolean'||(typeof item==='number'&&Number.isFinite(item))||(item&&typeof item==='object'&&!Array.isArray(item)&&Object.values(item).every(child=>safe(child,depth+1))));
 assert.ok(safe(value),'Only bounded nested boolean/count facts may leave the private endpoint');
 await writeFile(`audit/2026-11-02/pack-backend-${owner}-cache-path-${stage}.json`,JSON.stringify({stage,owner,status:response.status,facts:value},null,2)+'\n',{flag:'wx'});
 assert.equal(response.status,200);return value;
};
let accounts=[],cleanup=null,failure=null;
try{
 accounts=admin({action:'provision',count:2}).accounts;const[a,b]=accounts;
 check('Actual owned account/session identity',(await request(a,'auth/session')).user?.id===a.id);
 let room=(await request(a,'create',{duration:15})).arena;
 await request(b,'join',{code:room.code});await request(a,'ready',{code:room.code,ready:true});room=(await request(b,'ready',{code:room.code,ready:true})).arena;
 check('Real three-second authoritative countdown',room.status==='countdown'&&room.startsAt-room.serverNow>=2900);
 await snapshot('before-submit');
 const remaining=room.startsAt-Date.now()+120;if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
 const controller=new SessionController({...room.configuration,clientSessionId:`cache-probe-${runId}`,ownerScope:a.id,initialTarget:room.targetText},{now:()=>performance.now(),wallNow:()=>Date.now()});
 controller.startAt(performance.now()-(Date.now()-room.startsAt),room.startsAt);
 controller.input({type:'insert',text:[...room.targetText][0]});
 const accepted=await request(a,'submit',{code:room.code,candidate:controller.checkpoint(),finish:false});
 check('Independent one-character validator and Arena replay accepted',accepted.arena.members.find(member=>member.id===a.id).progress>0);
 await snapshot('after-submit');await request(a,'get',{code:room.code});await request(a,'leave',{code:room.code});await request(b,'leave',{code:room.code});
 await snapshot('after-read-leave');check('Exactly nine bounded application requests',requests.length===9);
}catch(error){failure=error.message;}
finally{
 try{cleanup=admin({action:'cleanup',sessions:accounts.map(account=>account.sessionId)});}catch{cleanup={failed:true};}
 const after=await verifyFrozenSource('audit/2026-11-02/final33-source.json');
 const report={status:failure===null&&cleanup?.deletedOwnAccounts===2&&after.receipt.mismatches.length===0?'PASS-SCOPED':'FAILED',owner,scope:'Bounded cache path identity and actual web profile diagnostic only; no throughput claim, no compile/reset/warmup/retry',applicationRequestBudget:9,actualApplicationRequests:requests.length,checks,requests,cleanup,failure,frozen505Unchanged:after.receipt.mismatches.length===0};
 await writeFile(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,actualApplicationRequests:requests.length,failure,cleanup}));if(report.status!=='PASS-SCOPED')process.exitCode=1;
}
