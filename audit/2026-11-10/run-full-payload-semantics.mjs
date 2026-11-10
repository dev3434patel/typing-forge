import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { SessionController, graphemes } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
const directory='audit/2026-11-10',output=`${directory}/full-payload-semantics-result.json`;
for(const file of [output,`${directory}/full-payload-semantic-seeds.json`,`${directory}/full-payload-semantics.stdout.json`,`${directory}/full-payload-semantics.stderr.log`])await assert.rejects(access(file),{code:'ENOENT'});
assert.equal(process.env.PHP_BINARY,'C:/xampp/php/php.exe');
const hash=b=>createHash('sha256').update(b).digest('hex');
const files=['backend/public/index.php','backend/src/RequestBody.php','backend/src/ArenaRules.php','backend/src/ArenaEvidence.php','backend/src/SessionValidator.php','backend/src/DataService.php','backend/src/Security.php','backend/src/Database.php',`${directory}/full-payload-index-candidate.php`,`${directory}/full-payload-semantics.php`];
const sourceHashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(file))])));
const base=JSON.parse(await readFile(`${directory}/full-payload-cpu-fixture.json`));
const owner=base.expectedOwner,wall=Date.UTC(2026,10,10),target=base.candidate.initialTarget;
function seed(text,{finish=false,corrected=false,unstarted=false,empty=false}={}){
  let mono=0;const config={...base.candidate.configuration,initialTarget:text,clientSessionId:`semantics-${finish?'finish':'checkpoint'}-${corrected?'corrected':'normal'}-${unstarted?'unstarted':empty?'empty':'typed'}-${text.length}`};
  const c=new SessionController(config,{now:()=>mono,wallNow:()=>wall+mono});
  if(!unstarted)c.startAt(0,wall);
  if(!unstarted&&!empty){if(corrected){mono=10;c.input({type:'insert',text:'x'});mono=20;c.input({type:'delete',start:0,end:1});}let i=0;for(const unit of graphemes(text).slice(0,10)){mono=100+i++*83;c.input({type:'insert',text:unit});}}
  mono=unstarted?0:finish?30000:2000;
  const candidate=finish?c.finish('timeout'):c.checkpoint();
  return{code:'ABCDEFGH',candidate,finish,expectedOwner:owner};
}
const seeds={checkpoint:base,finish:seed(target,{finish:true}),unicode:seed('café हिन्दी العربية 😀 '.repeat(12).trim()),unicodeFinish:seed('café हिन्दी العربية 😀 '.repeat(12).trim(),{finish:true}),corrected:seed(target,{corrected:true}),correctedFinish:seed(target,{corrected:true,finish:true}),unstarted:seed(target,{unstarted:true}),startedEmpty:seed(target,{empty:true})};
const raw=JSON.stringify(seeds);await writeFile(`${directory}/full-payload-semantic-seeds.json`,raw,{flag:'wx'});
const runtime=phpRuntime();const run=spawnSync(runtime.binary,[...runtime.args,'-d','memory_limit=48M',`${directory}/full-payload-semantics.php`],{input:raw,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:4*1024*1024});
await writeFile(`${directory}/full-payload-semantics.stdout.json`,run.stdout??'',{flag:'wx'});await writeFile(`${directory}/full-payload-semantics.stderr.log`,run.stderr??'',{flag:'wx'});
let data=null;try{data=JSON.parse(run.stdout);}catch{}
const after=Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(file))])));
const unchanged=JSON.stringify(after)===JSON.stringify(sourceHashes);
const passed=run.status===0&&!run.error&&data?.status==='PASS-SCOPED-SEMANTIC-PROJECTION'&&data.failed===0&&data.peakManagedAllocatedBytes<=48*1024*1024&&unchanged;
const result={at:new Date().toISOString(),status:passed?'PASS-SCOPED':'FAILED-PRESERVED',sourceHashes,sourceHashesAfter:after,sourceAndCandidateUnchanged:unchanged,seedSha256:hash(raw),seedBytes:Buffer.byteLength(raw),exitCode:run.status,error:run.error?{name:run.error.name,code:run.error.code}:null,phpArgs:[...runtime.args,'-d','memory_limit=48M'],automaticRetries:0,data};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output,status:result.status,cases:data?.cases,accepted:data?.accepted,finishPersistenceProjections:data?.finishPersistenceProjections,failed:data?.failed,peakManagedAllocatedBytes:data?.peakManagedAllocatedBytes,exactBlockSha256:data?.exactBlockSha256,sourceAndCandidateUnchanged:unchanged}));
if(!passed)process.exitCode=1;
