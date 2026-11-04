import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {configureOwnedOpcache as configureV2} from './source33-opcache-runtime-v2.mjs';
import {source,APIwrapperSource} from './source33-opcache-cache-probe-endpoint.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function verifyProbePlan(root){
 assert.equal(process.env.SPAROWTYPE_SOURCE33_CACHE_WEB_PROBE,'1');
 const bytes=await readFile(path.join(root,'audit/2026-11-04/source33-cache-web-path-probe-preparation.json'));
 assert.equal(hash(bytes),process.env.SPAROWTYPE_SOURCE33_CACHE_PROBE_PLAN_SHA256);
 const plan=JSON.parse(bytes);
 for(const[file,expected]of Object.entries(plan.inputHashes))assert.equal(hash(await readFile(path.join(root,file))),expected,`Frozen diagnostic input changed: ${file}`);
 return plan;
}
export async function configureOwnedOpcache(options){await verifyProbePlan(options.root);return configureV2(options);}
export async function installOwnedOpcacheEndpoint({apache,owned,configuration,guard}){
 assert.equal(path.resolve(apache.webRoot),path.resolve(owned,'apache-public'));
 const endpoint=source(configuration,guard),wrapper=APIwrapperSource(configuration,configuration.publicProfile.generatedOwnedIniSha256);
 const original=await readFile(path.join(apache.webRoot,'index.php'),'utf8');
 assert.ok(original.includes('backend/public/index.php'));
 await writeFile(path.join(apache.webRoot,'__audit-opcache-path-probe.php'),endpoint,{flag:'wx'});
 await writeFile(path.join(apache.webRoot,'index.php'),wrapper);
 return {endpointIsOwnedAndNotDeployed:true,originalForwardRequirePreserved:true,generatedEndpointSha256:hash(endpoint),generatedApiWrapperSha256:hash(wrapper),generatedOriginalWrapperSha256:hash(original)};
}
export async function readOwnedOpcacheSnapshot({port,configuration,guard,stage}){
 const response=await fetch(`http://127.0.0.1:${port}/__audit-opcache-path-probe.php`,{headers:{'X-Sparow-Profile-Guard':guard},signal:AbortSignal.timeout(5000)});
 const value=await response.json();
 const safe=(item,depth=0)=>depth<10&&(item===null||typeof item==='boolean'||(typeof item==='number'&&Number.isFinite(item))||(item&&typeof item==='object'&&!Array.isArray(item)&&Object.values(item).every(child=>safe(child,depth+1))));
 assert.ok(safe(value));
 // Facts survive all subsequent proof assertions, including failed cached queries.
 await writeFile(path.join(configuration.root,`audit/2026-11-02/pack-backend-${configuration.id}-cache-path-${stage}-unconditional.json`),JSON.stringify({owner:configuration.id,stage,status:response.status,facts:value},null,2)+'\n',{flag:'wx'});
 assert.equal(response.status,200);
 assert.equal(value.backendFilesChecked,38);assert.equal(value.backendSourceMatches,true);
 assert.ok(Object.values(value.controls).every(item=>item===true));assert.equal(value.cliDisabled,true);
 if(stage==='after-bounded-web-probe'){
  assert.ok(value.hits>0);
  for(const script of Object.values(value.scripts)){
   assert.equal(script.lookupRealpath,true);assert.equal(script.metadataFullPathMatches,true);
   assert.equal(script.sourceHashMatches,true);assert.equal(script.metadataMtimeMatchesCurrent,true);
  }
 }
 return {kind:'bounded-web-opcache-path-identity-diagnostic',...value};
}
