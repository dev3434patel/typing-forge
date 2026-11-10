import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir='audit/2026-11-05-followup',from=`${dir}/pack-backend-instance-source36.mjs`,to=`${dir}/pack-source36-native-arena-http32.mjs`;
const original=await readFile(from,'utf8'),sha=value=>createHash('sha256').update(value).digest('hex');
let copy=original;const changes=[];
function replace(before,after){assert.equal(copy.split(before).length,2,`One exact owner span required: ${before.slice(0,80)}`);copy=copy.replace(before,after);changes.push({before,after});}
replace("import readline from 'node:readline';","import { verifyPreparedSource36NativeArena32 } from './source36-native-arena32-preflight.mjs';");
replace("assert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1',", "const preparedBefore=await verifyPreparedSource36NativeArena32(); // All current-source/runtime/filesystem guards precede any native spawn.\nassert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1',");
replace("assert.equal(process.env.SPAROWTYPE_FINAL36_NATIVE_BROWSER_WINDOW, '1', 'Wait for the coordinated source36 native-browser window.');","assert.equal(process.env.SPAROWTYPE_SOURCE36_ARENA_HTTP_WINDOW, '1', 'Wait for a separately coordinated source36 native Arena functional window.');");
replace("'The source36 browser owner requires its own Apache/PHP runtime.'","'The source36 native Arena functional owner requires its own Apache/PHP runtime.'");
const browserStart=copy.indexOf('// The preview and two reusable racers'),browserEnd=copy.indexOf("for (const signal of ['SIGINT', 'SIGTERM'])",browserStart);
assert.ok(browserStart>0&&browserEnd>browserStart);replace(copy.slice(browserStart,browserEnd),'// This dedicated functional owner has no browser, capacity, rate or performance commands.\n\n');
replace('SPAROWTYPE_CAPACITY_OWNER_ID: id','SPAROWTYPE_ARENA_HTTP_OWNER_ID: id');
const oldEnd=copy.slice(copy.indexOf("  const suites = { password:"),copy.lastIndexOf('} catch (error) {'));
replace(oldEnd,`  assert.equal(process.env.SPAROWTYPE_PACK_SUITES??'arena-http36','arena-http36','Only the original32 native Arena functional assertions are available.');
  await receipt('protocol',{declaredAt:new Date().toISOString(),ownerId:id,scope:'Source36 native Arena functional lifecycle only',suite:'arena-http36',expectedAssertions:32,original29AndThreeHistoryAssertionsPreserved:true,originalThreeWayRoomCreationRacePreserved:true,capacityLoad:false,rateBenchmark:false,latencyMeasurement:false,browserStarted:false,automaticRetries:0,productionRateLimitsUnchanged:true,frozenSource:frozenBefore.receipt});
  publicMessage({stage:'ephemeral-suite-start',name:'arena-http36',ownerId:id});
  const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,'audit/2026-11-05-followup/run-source36-native-arena-http32.mjs')],'arena-http36',undefined,120000);
  let report=null;try{report=JSON.parse(await readFile(path.join(receipts,'pack-backend-'+id+'-arena-http36-source-guard.json'),'utf8'));}catch{}
  const status={name:'arena-http36',exitCode:result.code,status:result.code===0&&report?.status==='PASS-SCOPED-NATIVE-ARENA32'&&report?.passed===32?'PASS':'FAIL',checks:report?.passed??null,ownerId:id};
  suiteResults.push(status);failed ||= status.status!=='PASS';await receipt('arena-http36-summary',status);publicMessage({stage:'ephemeral-suite-complete',...status});
  const preparedAfter=await verifyPreparedSource36NativeArena32();assert.deepEqual(preparedAfter,preparedBefore);await receipt('source36-arena-http-inputs-after',{ownerId:id,allInputsUnchanged:true,verification:preparedAfter});
  await receipt('summary',{date:new Date().toISOString(),suites:suiteResults,failed,scope:'Original32 native functional HTTP Arena assertions only; no browser,capacity,rate or performance workload.',sourceAndHelpersUnchanged:true,cleanup:'PENDING SAME OWNER FINALLY',originalConfigRead:false,existingDatabaseConnected:false});
`);
let reversed=copy;for(const {before,after}of [...changes].reverse()){assert.equal(reversed.split(after).length,2);reversed=reversed.replace(after,before);}assert.equal(reversed,original);
await writeFile(to,copy,{flag:'wx'});
await writeFile(`${dir}/source36-native-arena32-owner-transformations.json`,JSON.stringify({at:new Date().toISOString(),from,to,originalSha256:sha(original),derivedSha256:sha(copy),exactReverse:true,changes,productionEdited:false,existingFrozenHelperEdited:false,servicesStarted:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({to,sha256:sha(copy),exactReverse:true,spans:changes.length,servicesStarted:0}));
