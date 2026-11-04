// One explicit final-build acceptance run. No backend/preview is started here.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
assert.equal(process.env.SPAROWTYPE_FINAL31_NATIVE_BROWSER_WINDOW,'1','Wait for the separately coordinated source31 native acceptance window.');
const engine=process.env.SPAROWTYPE_FINAL31_NATIVE_ENGINE;
assert.ok(['chromium','edge','firefox','webkit'].includes(engine),'Select exactly one native engine; the outer owner runner sequences all four.');
assert.match(process.env.SPAROWTYPE_FINAL31_NATIVE_OWNER??'',/^[a-f0-9]{16}$/,'Bind the newly created public owner ID.');
assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_ACCEPTANCE,'1','Wait for the separately coordinated native browser stage.');
assert.ok(process.env.SPAROWTYPE_PACK_BROWSER_READY&&process.env.SPAROWTYPE_PACK_EXPECT_BUILD,'An explicit current ready receipt and build identity are required.');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const readyPath=await realpath(process.env.SPAROWTYPE_PACK_BROWSER_READY);
assert.equal(path.dirname(readyPath).toLowerCase(),here.toLowerCase(),'Use this pack’s public ready receipt only.');
const ready=JSON.parse(await readFile(readyPath,'utf8')),privateFile=await realpath(ready.privateBrowserEnvFile),owned=path.dirname(privateFile);
assert.equal(path.dirname(owned).toLowerCase(),(await realpath(path.join(root,'backend/storage'))).toLowerCase());
assert.match(path.basename(owned),/^pack-instance-[a-f0-9]{16}$/);assert.equal(path.basename(privateFile),'browser-env.json');
const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(path.basename(owned),`pack-instance-${marker.id}`);assert.equal(path.resolve(marker.root).toLowerCase(),root.toLowerCase());
assert.equal(marker.id,process.env.SPAROWTYPE_FINAL31_NATIVE_OWNER,'The adapter must consume exactly the fresh owner bound by the orchestrator.');
assert.equal(path.basename(readyPath),`pack-backend-${marker.id}-browser-ready.json`);
const browserEnv=JSON.parse(await readFile(privateFile,'utf8')),base=new URL(browserEnv.PLAYWRIGHT_BASE_URL),api=new URL(ready.api);
for(const url of [base,api,new URL(browserEnv.SPAROWTYPE_PHP_URL)]){assert.equal(url.hostname,'127.0.0.1');assert.ok(url.port&&!['3306','3307','3308','8081','4173'].includes(url.port),'Refusing a user application endpoint.');}
assert.equal(browserEnv.PHP_E2E_ACCEPTANCE,'1');assert.equal(browserEnv.VITE_API_BASE_URL,'/api');assert.equal(base.href,new URL(ready.baseUrl).href);
assert.equal(api.origin,new URL(browserEnv.SPAROWTYPE_PHP_URL).origin);
assert.equal(path.resolve(browserEnv.SPAROWTYPE_CONFIG_FILE).toLowerCase(),path.join(owned,'app-config.php').toLowerCase());
for(const role of ['HOST','OPPONENT']){
 assert.ok(new RegExp(`^native-browser-${marker.id}-(?:host|opponent)@example\\.test$`).test(browserEnv[`PHP_E2E_RACE_${role}_EMAIL`]),'Only this isolated instance’s dedicated synthetic accounts are allowed.');
 assert.ok(/^NativeAudit![a-f0-9]{48}$/.test(browserEnv[`PHP_E2E_RACE_${role}_PASSWORD`]),'Private credential format does not match; value suppressed.');
}
browserEnv.SPAROWTYPE_NATIVE_FAULT_ROUTE_AUDIT='1';
browserEnv.FORGE_E2E_AUTH_EMAIL=browserEnv.PHP_E2E_RACE_HOST_EMAIL;browserEnv.FORGE_E2E_AUTH_PASSWORD=browserEnv.PHP_E2E_RACE_HOST_PASSWORD;browserEnv.PHP_E2E_API_URL=api.href.replace(/\/$/,'');
assert.ok(!['3d44c37ac589c270','7bbf2372eea5cde5','a4cda523ada86772','6a2da7a72dc80e8e'].includes(marker.id),'Original failed owners must never be reused or reset.');
const prior=(await readdir(here)).filter(name=>name.startsWith('pack-native-')&&name.includes(`-${marker.id}-`)&&name.endsWith('-protocol.json'));
assert.deepEqual(prior,[],'Use a fresh distinct owner with no previous native-browser run.');
const attempt=`${marker.id}-${Date.now()}`,prefix=path.join(here,`pack-native-final31-${engine}-${attempt}`);
assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'This acceptance runs all five original native titles for exactly one engine; no diagnostic subset.');
const protocol={declaredAt:new Date().toISOString(),diagnostic:null,scope:'All five original native titles in one engine against its own fresh owned Apache/PHP/MariaDB instance and dedicated accounts. No counter resets, reseeding or rate-limit policy changes. Route-controlled fault case alone blocks service workers; normal human-race and PWA behavior remain unchanged. Original source27 failures retained.',expectedBuild:process.env.SPAROWTYPE_PACK_EXPECT_BUILD,readyReceipt:path.basename(readyPath),databaseNamespace:`sparow_pack_${marker.id}_audit`,engines:[engine],expectedCases:5,workers:1,retries:0,traces:false,countersReset:false,accountsReseeded:false,originalServicesTouched:false,freshOwner:true,originalFailedOwner:'3d44c37ac589c270',previousConfirmationOwner:'7bbf2372eea5cde5',existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true,serviceWorkersBlockedOnlyForFaultCase:true,controllerNullAndRouteHitControlsAdded:true,faultRouteAuditEnabled:true,originalHumanRaceAndPwaWorkerBehaviorChanged:false};
await writeFile(`${prefix}-protocol.json`,JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
let child=null;
try{
 const local=await readFile(path.join(root,'dist/offline-build.json')),remote=await fetch(new URL('/offline-build.json',base),{signal:AbortSignal.timeout(3000)});assert.equal(remote.ok,true,'Owned preview is unavailable before browser launch.');const bytes=Buffer.from(await remote.arrayBuffer());
 assert.equal(createHash('sha256').update(local).digest('hex'),createHash('sha256').update(bytes).digest('hex'),'Preview and final local build bytes differ.');assert.equal(JSON.parse(bytes).version,protocol.expectedBuild,'Explicit final build identity differs.');
 const response=await fetch(new URL('/api/auth/session',base),{signal:AbortSignal.timeout(3000)});assert.equal(response.ok,true,'Owned API proxy is unavailable before browser launch.');assert.ok(response.headers.getSetCookie().some(value=>value.startsWith(`sparow_ephemeral_${marker.id}=`)),'Private session namespace differs.');
 await writeFile(`${prefix}-provenance.json`,JSON.stringify({status:'PASS',version:protocol.expectedBuild,localRemoteBuildBytesMatch:true,exactCookieNamespaceMatched:true,credentialsEmitted:false},null,2)+'\n',{flag:'wx'});
 const selected=['real PHP account signup, replay upload, independent-device history/preferences and account deletion','real two-browser PHP human race shares opponent pace and settles server results','real account sign in with dedicated deployment credentials','PHP two-account race authorization and server-owned countdown','real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish'];
 const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const args=[path.join(root,'node_modules/@playwright/test/cli.js'),'test','e2e/php-account-flow.spec.ts','e2e/php-human-race.spec.ts','e2e/auth-flow.spec.ts','e2e/race-mode.spec.ts','--grep',selected.map(escape).join('|'),`--project=${engine}`,'--workers=1','--retries=0','--trace=off','--reporter=json','--output',path.join(here,`.playwright-artifacts-pack-native-final31-${engine}-${attempt}`)];
 console.log(JSON.stringify({stage:'pack-native-browser-start',...protocol,reportPrefix:prefix,realBackend:true,introDisabledBySelectedSpecs:true}));
 child=spawn(process.execPath,args,{cwd:root,env:{...process.env,...browserEnv,PLAYWRIGHT_BROWSERS:protocol.engines.join(',')},windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',value=>{stdout+=value;});child.stderr.on('data',value=>{stderr+=value;});const exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
 const redact=value=>{for(const [key,secret]of Object.entries(browserEnv))if(key.endsWith('_PASSWORD')&&typeof secret==='string')value=value.replaceAll(secret,'[REDACTED]');return value.replace(/Acceptance![a-f0-9-]{36}/g,'[REDACTED]').replace(/((?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=)[^;\s"',\\]+/g,'$1[REDACTED]');};
 stdout=redact(stdout);stderr=redact(stderr);await writeFile(`${prefix}-browser.json`,stdout,{flag:'wx'});await writeFile(`${prefix}-stderr.txt`,stderr,{flag:'wx'});let report=null;try{report=JSON.parse(stdout);}catch{/* Retain a malformed original report without claiming an application result. */}
 const cases=[];const collect=suite=>{for(const spec of suite.specs??[])for(const item of spec.tests??[])cases.push({title:spec.title,engine:item.projectName,status:item.status,results:(item.results??[]).map(result=>({status:result.status,retry:result.retry,durationMs:result.duration}))});for(const childSuite of suite.suites??[])collect(childSuite);};for(const suite of report?.suites??[])collect(suite);const expectedCases=selected.map(title=>`${engine}:${title}`).sort();const exactCasesVerified=cases.length===5&&JSON.stringify(cases.map(item=>`${item.engine}:${item.title}`).sort())===JSON.stringify(expectedCases);
 const exactResultsVerified=cases.every(item=>item.status==='expected'&&item.results.length===1&&item.results[0].status==='passed'&&item.results[0].retry===0)&&Array.isArray(report?.errors)&&report.errors.length===0&&report?.config?.workers===1&&report?.config?.projects?.length===1&&report.config.projects[0].name===engine&&report.config.projects[0].retries===0;
 const stats=report?.stats??null,summary={exactCasesVerified,exactResultsVerified,actualCases:cases,status:exitCode===0&&exactCasesVerified&&exactResultsVerified&&stats?.expected===protocol.expectedCases&&stats?.unexpected===0&&stats?.skipped===0&&stats?.flaky===0?'PASS':'FAILED',exitCode,stats,expectedCases:protocol.expectedCases,sourceBuild:protocol.expectedBuild,traces:false,credentialRedactionApplied:true,rawReport:`${prefix}-browser.json`,at:new Date().toISOString()};await writeFile(`${prefix}-summary.json`,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({stage:'pack-native-browser-complete',...summary}));process.exitCode=summary.status==='PASS'?0:1;
}catch(error){const failure={status:'INFRASTRUCTURE-FAILED',appExecutionStarted:child!==null,message:error.message,at:new Date().toISOString(),sourceBuild:protocol.expectedBuild};await writeFile(`${prefix}-failure.json`,JSON.stringify(failure,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(failure));process.exitCode=1;}
