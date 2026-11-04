import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const hash=value=>createHash('sha256').update(value).digest('hex');
const folder='audit/2026-11-04',directory='audit/2026-11-02';
const support=`${folder}/source33-opcache-runtime-v3.mjs`,manifestFile=`${folder}/source33-opcache-profile-preparation-v3.json`;
const oldSupport=await readFile(`${folder}/source33-opcache-runtime-v2.mjs`,'utf8');
let module=oldSupport.replaceAll('-v2','-v3').replaceAll('preparationRevision: 2','preparationRevision: 3').replaceAll('receipt.preparationRevision, 2','receipt.preparationRevision, 3');
module=module.replace("const hash = bytes", "import { source as diagnosticSource } from './source33-opcache-cache-probe-endpoint.mjs';\nconst hash = bytes");
const endpointStart=module.indexOf('export function ownedOpcacheEndpointSource('),endpointEnd=module.indexOf('export async function installOwnedOpcacheEndpoint',endpointStart);
assert.ok(endpointStart>0&&endpointEnd>endpointStart);
module=module.slice(0,endpointStart)+`export function ownedOpcacheEndpointSource({configuration,guard}) { return diagnosticSource(configuration,guard); }\n\n`+module.slice(endpointEnd);
const readerStart=module.indexOf('export async function readOwnedOpcacheSnapshot('),readerEnd=module.indexOf('export async function verifyOpcodeProfileReceipt(',readerStart);
assert.ok(readerStart>0&&readerEnd>readerStart);
const reader=`export async function readOwnedOpcacheSnapshot({port,configuration,guard,stage,requirePositiveHits=true}) {
  assert.ok(Number.isInteger(port)&&port>1024&&![3306,3307,3308,8081,4173].includes(port));
  const response=await fetch(\`http://127.0.0.1:\${port}/__audit-opcache.php\`,{headers:{'X-Sparow-Profile-Guard':guard},signal:AbortSignal.timeout(5000)});
  const snapshot=await response.json();
  const safe=(value,depth=0)=>depth<10&&(value===null||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value))||(value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(child=>safe(child,depth+1))));
  assert.ok(safe(snapshot),'Only bounded booleans/counts may leave the owned status endpoint');
  // Always persist failed proof facts before any cache/control assertion.
  await writeFile(path.join(configuration.root,\`audit/2026-11-02/pack-backend-\${configuration.id}-opcache-raw-\${stage}.json\`),JSON.stringify({recordedAt:new Date().toISOString(),stage,ownerId:configuration.id,httpStatus:response.status,...configuration.publicProfile,facts:snapshot},null,2)+'\\n',{flag:'wx'});
  assert.equal(response.status,200);
  assert.equal(snapshot.backendFilesChecked,38);assert.equal(snapshot.backendSourceMatches,true);
  assert.ok(Object.values(snapshot.controls).every(value=>value===true));assert.equal(snapshot.cliDisabled,true);
  assert.equal(snapshot.cacheFull,false);assert.equal(snapshot.restartPending,false);assert.equal(snapshot.restartInProgress,false);
  const assertScript=script=>{assert.equal(script.lookupRealpath,true);assert.equal(script.metadataFullPathMatches,true);assert.equal(script.sourceHashMatches,true);assert.equal(script.metadataMtimeMatchesCurrent,true);};
  assertScript(snapshot.scripts.applicationIndex);
  if(stage.startsWith('after-capacity')||stage.startsWith('before-arena')||stage.startsWith('after-arena')) {assertScript(snapshot.scripts.validator);assertScript(snapshot.scripts.arena);}
  assert.ok(snapshot.cachedScripts>0&&Number.isInteger(snapshot.hits)&&snapshot.hits>=0);
  if(requirePositiveHits)assert.ok(snapshot.hits>0);
  return {recordedAt:new Date().toISOString(),stage,ownerId:configuration.id,...configuration.publicProfile,
   enabled:snapshot.controls.cacheEnabled,timestampValidationEnabled:snapshot.controls.timestampValidationEnabled,everyRequestRevalidation:snapshot.controls.everyRequestRevalidation,
   cliDisabled:snapshot.cliDisabled,jitDisabled:snapshot.controls.jitDisabled,ownerCacheIsolationMatches:snapshot.controls.ownerCacheIsolationMatches,backendSourceMatches:snapshot.backendSourceMatches,
   applicationIndexCached:snapshot.scripts.applicationIndex.lookupRealpath,validatorScriptCached:snapshot.scripts.validator.lookupRealpath,arenaScriptCached:snapshot.scripts.arena.lookupRealpath,
   cachedScripts:snapshot.cachedScripts,hits:snapshot.hits,misses:snapshot.misses,cacheFull:snapshot.cacheFull,restartPending:snapshot.restartPending,
   cachePathProof:snapshot.scripts,ownedIniHashMatched:snapshot.controls.ownedIniMatches,requirePositiveHits,
   proofMethod:'Canonical realpath cache query AND full-root/file metadata AND frozen source SHA/mtime; original forward-query facts retained. No filename-only matching.'};
}

`;
module=module.slice(0,readerStart)+reader+module.slice(readerEnd);
await writeFile(support,module,{flag:'wx'});
const prepared=[];
for(const oldName of ['pack-opcache-instance-source33-v2.mjs','pack-opcache-instance-source33-v2-wire.mjs','run-source33-opcache-v2-capacity-burst.mjs','run-source33-opcache-v2-capacity-wire-burst.mjs']){
 const originalFile=`${directory}/${oldName}`,targetFile=originalFile.replaceAll('-v2','-v3');
 const original=await readFile(originalFile,'utf8'),text=original.replaceAll('-v2','-v3');
 assert.equal(text.replaceAll('-v3','-v2'),original,'Identifier-only workload/runtime owner reversal');
 await writeFile(targetFile,text,{flag:'wx'});
 prepared.push({originalFile,targetFile,originalSha256:hash(original),targetSha256:hash(text),exactIdentifierReverse:true});
}
const inputs=['backend/opcache.ini.example','docs/PHP_OPCACHE_PROFILE.md',support,`${folder}/source33-opcache-cache-probe-endpoint.mjs`,`${directory}/run-source33-arena-chart-http.mjs`,...prepared.map(row=>row.targetFile)];
for(const file of inputs.filter(file=>file.endsWith('.mjs'))){const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(check.status,0,check.stderr);}
const {ownedOpcacheEndpointSource}=await import('./source33-opcache-runtime-v3.mjs');
const sourceFile=`${directory}/final33-source.json`,sourceBytes=await readFile(sourceFile),frozen=JSON.parse(sourceBytes);
const backend=Object.keys(frozen.sourceHashes).filter(file=>file.startsWith('backend/'));
assert.equal(backend.length,38);
const rawHashes=Object.fromEntries(await Promise.all(backend.map(async file=>[file,hash(await readFile(file))])));
const endpoint=ownedOpcacheEndpointSource({configuration:{root:process.cwd(),id:'0000000000000000',cacheId:'sparow_audit_0000000000000000',rawHashes,publicProfile:{generatedOwnedIniSha256:'0'.repeat(64)}},guard:'0'.repeat(64)});
const phpFile=`${folder}/.source33-opcache-v3-endpoint-syntax.php`;await writeFile(phpFile,endpoint,{flag:'wx'});
const phpCheck=spawnSync('C:/xampp/php/php.exe',['-n','-l',phpFile],{encoding:'utf8'});assert.equal(phpCheck.status,0,phpCheck.stderr||phpCheck.stdout);
const additionalInputHashes=Object.fromEntries(await Promise.all(inputs.map(async file=>[file,hash(await readFile(file))])));
const report={recordedAt:new Date().toISOString(),status:'PREPARED-UNVERIFIED-RUNTIME',sourceFile,sourceManifestSha256:hash(sourceBytes),sourceFiles:505,clientBuild:frozen.local.version,runtimeVariant:'source33-opcache-production-config-variant',preparationRevision:3,
 fragmentOutsideFrozen505:true,additionalInputHashes,fragmentSha256:additionalInputHashes['backend/opcache.ini.example'],extensionSha256:'4530ffcf2c16c9fb3b97b45360302c787d5fbcb248492f80d35407f63ccff76e',prepared,syntaxChecks:inputs.filter(file=>file.endsWith('.mjs')).length+1,
 entry:`${directory}/pack-opcache-instance-source33-v3-wire.mjs`,commandsInOrder:['capacity33-opcache-v3','capacity33-opcache-v3-wire','arena-http33-opcache-v3','cleanup'],
 exactOperationsPerRun:1653,concurrency:20,rooms:50,accountsPerRoom:8,p95StrictlyBelowMs:150,
 cacheProofCorrection:'v2 forward-path lookup failed on Windows; bounded CLI and nine-request web probes prove canonical realpath and normalized full-path metadata with exact source hash/mtime. All lookup variants retained; no cache authority change.',
 diagnosticApiWrapperDeployedInThisVariant:false,addedApplicationWarmupRequests:0,noCacheReset:true,noRetries:true,noFiltering:true,ordinaryUncachedFailuresRetained:true,oldV2FailedRunRetained:true,primarySourceOrFrozenTestsChanged:false,servicesStarted:0};
const bytes=JSON.stringify(report,null,2)+'\n';await writeFile(manifestFile,bytes,{flag:'wx'});console.log(JSON.stringify({entry:report.entry,manifestFile,manifestSha256:hash(bytes),syntaxChecks:report.syntaxChecks,prepared:prepared.length}));
