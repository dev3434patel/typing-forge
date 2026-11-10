import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='audit/2026-11-05-followup';
const sha=x=>createHash('sha256').update(x).digest('hex');
const edits=[];
async function transform(from,to,changes){
  const original=await readFile(from,'utf8');let text=original;const recorded=[];
  for(const [before,after] of changes){assert.equal(text.split(before).length,2,`Expected one exact span: ${before.slice(0,100)}`);text=text.replace(before,after);recorded.push({before,after});}
  let reverse=text;for(const {before,after} of [...recorded].reverse()){assert.equal(reverse.split(after).length,2,`Unique reverse ${after.slice(0,100)}`);reverse=reverse.replace(after,before);}assert.equal(reverse,original);
  await writeFile(to,text,{flag:'wx'});edits.push({from,to,originalSha256:sha(original),derivedSha256:sha(text),exactReversal:true,transformations:recorded});
}
const ownerOriginal=await readFile(`${dir}/pack-capacity-instance-source36-wire.mjs`,'utf8');
const browserStart=ownerOriginal.indexOf('// The preview and two reusable racers');
const browserEnd=ownerOriginal.indexOf("for (const signal of ['SIGINT', 'SIGTERM'])",browserStart);
const oldEnding=ownerOriginal.slice(ownerOriginal.indexOf('  const wireOwnerInputs = '),ownerOriginal.lastIndexOf('} catch (error) {'));
const newEnding=`  const privateRuntimeFiles={appConfig:configFile,appJson:path.join(owned,'app.json'),phpIni,apacheConfig:apache.configFile,generatedShim:path.join(apache.webRoot,'index.php'),ownedDatabaseAdminConfig:adminFile};
  const privateRuntimeHashes=async()=>{
    assert.equal(await realpath(owned),path.join(await realpath(storage),'pack-instance-'+id));
    const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(marker.id,id);assert.equal(marker.runnerPid,process.pid);assert.equal(await realpath(marker.root),await realpath(root));
    const hashes={};for(const [name,file] of Object.entries(privateRuntimeFiles)){assert.equal(await realpath(file),path.resolve(file));const relative=path.relative(await realpath(owned),await realpath(file));assert.ok(relative!==''&&!relative.startsWith('..')&&!path.isAbsolute(relative));hashes[name]=createHash('sha256').update(await readFile(file)).digest('hex');}return hashes;
  };
  const privateRuntimeBefore=await privateRuntimeHashes();await receipt('index-abba-private-input-hashes-before',{ownerId:id,hashes:privateRuntimeBefore,contentsPublished:false});
  await receipt('index-abba-owner-protocol', {declaredAt:new Date().toISOString(),ownerId:id,order:['1A','2B','3B','4A'],representations:'FULL1653 only',diagnosticOnly:true,separateFixtureNamespaces:true,warmDatabaseOrderDeclared:true,strictP95BelowMs:150,noAutomaticRetries:true,noProfilerOrTimingHeaders:true});
  for(const [phase,variant] of [['1A','A'],['2B','B'],['3B','B'],['4A','A']]) {
    const before=indexAbbaHostMetadata(phase+'-before');await receipt('index-abba-'+phase+'-host-before',before);
    assert.ok(before.collector.freeMemoryBytes>=2*1024*1024*1024,'Declared diagnostic resource condition requires at least2GiB availableRAM at each phase start.');
    environment={...environment,SPAROWTYPE_INDEX_ABBA_PHASE:phase,SPAROWTYPE_INDEX_ABBA_VARIANT:variant};
    publicMessage({stage:'index-abba-phase-start',ownerId:id,phase,variant,freeMemoryBytes:before.collector.freeMemoryBytes});
    const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,'audit/2026-11-05-followup/run-index-abba-capacity.mjs')],'index-abba-'+phase,undefined,240000);
    let report=null;try{report=JSON.parse(await readFile(path.join(receipts,'index-abba-'+id+'-'+phase+'.json'),'utf8'));}catch{}
    const after=indexAbbaHostMetadata(phase+'-after');await receipt('index-abba-'+phase+'-host-after',after);
    const privateRuntimeAfter=await privateRuntimeHashes();await receipt('index-abba-'+phase+'-private-input-hashes-after',{ownerId:id,hashes:privateRuntimeAfter,allInputsUnchanged:JSON.stringify(privateRuntimeAfter)===JSON.stringify(privateRuntimeBefore),contentsPublished:false});assert.deepEqual(privateRuntimeAfter,privateRuntimeBefore);
    const correctness=report && report.total===1653 && report.failure===null && report.watchdogExpired===false && report.checks.every(check=>check.name==='successful-request p95 remains strictly below150ms'||check.pass);
    const status={phase,variant,exitCode:result.code,reportStatus:report?.status??null,p95Ms:report?.p95Ms??null,total:report?.total??null,correctness:Boolean(correctness),targetMet:report?.targetMet??false};
    suiteResults.push(status);failed ||= !correctness || !report.targetMet;await receipt('index-abba-'+phase+'-summary',status);publicMessage({stage:'index-abba-phase-complete',ownerId:id,...status});
    assert.ok(correctness,'Functional/integrity failure stops the diagnostic; latency-only failure is preserved and does not stop the predeclaredABBA order.');
  }
  const privateRuntimeFinal=await privateRuntimeHashes();assert.deepEqual(privateRuntimeFinal,privateRuntimeBefore);await receipt('index-abba-private-input-hashes-final',{ownerId:id,hashes:privateRuntimeFinal,allInputsUnchanged:true,contentsPublished:false});
  const after=await verifyPreparedIndexAbba();
  await receipt('index-abba-final-inputs',{ownerId:id,allInputsUnchanged:true,verification:after});
  await receipt('index-abba-summary',{at:new Date().toISOString(),ownerId:id,phases:suiteResults,diagnosticOnly:true,ordinaryAcceptance:false,allFourCompleted:suiteResults.length===4,allInputsUnchanged:true,failed});
`;
await transform(`${dir}/pack-capacity-instance-source36-wire.mjs`,`${dir}/pack-index-abba-instance.mjs`,[
  ["import { verifyPreparedOrdinarySource36 } from './source36-ordinary-preflight.mjs';","import { verifyPreparedIndexAbba } from './index-abba-preflight.mjs';\nimport { indexAbbaHostMetadata } from './index-abba-host-metadata.mjs';\nimport { writeIndexAbbaShim } from './index-abba-shim.mjs';"],
  ['await verifyPreparedOrdinarySource36(); // Before initialization, process spawn or private configuration creation.',"await verifyPreparedIndexAbba(); // Before initialization, process spawn or private configuration creation.\nconst startupResources=indexAbbaHostMetadata('before-service-start');\nassert.ok(startupResources.collector.freeMemoryBytes>=2*1024*1024*1024,'Declared diagnostic resource condition requires at least2GiB availableRAM before service startup.');"],
  ["  await writeFile(path.join(owned, 'ownership.json'), JSON.stringify({ id, runnerPid: process.pid, root, created: new Date().toISOString() }));","  await writeFile(path.join(owned, 'ownership.json'), JSON.stringify({ id, runnerPid: process.pid, root, created: new Date().toISOString() }));\n  await receipt('index-abba-startup-resources',startupResources);"],
  [ownerOriginal.slice(browserStart,browserEnd),'// This diagnostic has no browser or interactive commands.\n\n'],
  ["    // Same owned readiness request, with bounded OPcache/PDO availability facts.","    const shim=await writeIndexAbbaShim({webRoot:apache.webRoot,owned,configFile,root,ownerId:id,nonce:secrets.arena,indexRoot:path.join(root,'audit/2026-11-05-followup/.final-index-abba')});\n    await receipt('index-abba-generated-shim',shim);\n    // Same owned readiness request, with bounded OPcache/PDO availability facts."],
  [oldEnding,newEnding],
]);
const driverOriginal=await readFile(`${dir}/run-source36-capacity-burst.mjs`,'utf8');
await transform(`${dir}/run-source36-capacity-burst.mjs`,`${dir}/run-index-abba-capacity.mjs`,[
  ["import { cpus, freemem, totalmem } from 'node:os';","import { cpus, freemem, totalmem } from 'node:os';\nimport v8 from 'node:v8';\nimport { verifyPreparedIndexAbba } from './index-abba-preflight.mjs';\nawait verifyPreparedIndexAbba();\nconst diagnosticPhase=process.env.SPAROWTYPE_INDEX_ABBA_PHASE, diagnosticVariant=process.env.SPAROWTYPE_INDEX_ABBA_VARIANT;\nassert.ok(['1A','2B','3B','4A'].includes(diagnosticPhase));\nassert.equal(diagnosticVariant,diagnosticPhase.slice(-1));\nconst diagnosticHeader=process.env.ARENA_AUDIT_GUARD+':'+diagnosticVariant;"],
  ["const prefix = `source36-capacity-${ownerId}`;","const prefix = `index-abba-${ownerId}-${diagnosticPhase}`;"],
  ["const inputs = ['audit/2026-11-05-followup/pack-capacity-instance-source36.mjs', 'audit/2026-11-05-followup/run-source36-capacity-burst.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];","const inputs = ['audit/2026-11-05-followup/pack-index-abba-instance.mjs', 'audit/2026-11-05-followup/run-index-abba-capacity.mjs', 'audit/2026-11-05-followup/index-abba-shim.mjs', 'audit/2026-11-05-followup/index-abba-preflight.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];"],
  ["  privateConfigReadByHarness: false, originalConfigRead: false, existingDatabaseConnected: false,","  diagnosticOnly:true,diagnosticPhase,diagnosticVariant,variantHeader:'Identity only; no server timing instrumentation',fullPayloadUnchanged:true,order:['1A','2B','3B','4A'],warmDatabaseOrderDeclared:true,producer:{node:process.version,v8HeapLimitBytes:v8.getHeapStatistics().heap_size_limit,runtimeFlagsSha256:createHash('sha256').update(JSON.stringify(process.execArgv)).digest('hex'),nodeOptionsSha256:createHash('sha256').update(process.env.NODE_OPTIONS??'').digest('hex')},\n  privateConfigReadByHarness: false, originalConfigRead: false, existingDatabaseConnected: false,"],
  ["'X-CSRF-Token': account.csrf, Cookie: account.cookie","'X-CSRF-Token': account.csrf, Cookie: account.cookie, 'X-SparowType-Audit-Index':diagnosticHeader"],
  ["    row.serverTiming = response.headers.get('server-timing');","    row.serverTiming = response.headers.get('server-timing');\n    row.indexVariant=response.headers.get('x-sparowtype-audit-index');"],
  ["const healthResponse = await fetch(new URL('health', origin), { signal: AbortSignal.timeout(15000) });","const healthResponse = await fetch(new URL('health', origin), { headers:{'X-SparowType-Audit-Index':diagnosticHeader},signal: AbortSignal.timeout(15000) });"],
  ["{ headers: { Cookie: accounts[0].cookie }, signal: AbortSignal.timeout(15000) }","{ headers: { Cookie: accounts[0].cookie,'X-SparowType-Audit-Index':diagnosticHeader }, signal: AbortSignal.timeout(15000) }"],
  ["const begin = performance.now();","const begin = performance.now();\nconst resourceSamples=[];const sampleResource=()=>{if(resourceSamples.length<180)resourceSamples.push({elapsedMs:performance.now()-begin,freeMemoryBytes:freemem(),rssBytes:process.memoryUsage().rss,heapUsedBytes:process.memoryUsage().heapUsed});};sampleResource();const resourceSampler=setInterval(sampleResource,2000);"],
  ["  clearTimeout(watchdog);","  clearTimeout(watchdog);clearInterval(resourceSampler);sampleResource();"],
  ["  check('exact1653 planned Arena requests completed with no omitted phase',","  check('every measured request uses declared index variant with no Server-Timing',requestRows.length===1653&&requestRows.every(row=>row.indexVariant===diagnosticVariant&&row.serverTiming===null));\n  check('exact1653 planned Arena requests completed with no omitted phase',"],
  ["    phases, unexpectedRequests: unexpected, rawRequests: requestRows, auxiliaryRequests: auxiliaryRows,","    phases, unexpectedRequests: unexpected, rawRequests: requestRows, auxiliaryRequests: auxiliaryRows,resourceSamples,"],
]);
await writeFile(`${dir}/index-abba-exact-transformations.json`,JSON.stringify({at:new Date().toISOString(),auditOnly:true,productionEdited:false,edits},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({auditOnly:true,productionEdited:false,edits:edits.map(({from,to,originalSha256,derivedSha256,exactReversal,transformations})=>({from,to,originalSha256,derivedSha256,exactReversal,spanCount:transformations.length}))}));
