import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {createHash}from'node:crypto';
import {spawnSync}from'node:child_process';
import {normalizedSourceHash}from'../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-05-followup',prior='audit/2026-11-02';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(directory,{recursive:true});
const baseline=JSON.parse(await readFile(`${prior}/final34-source.json`));
assert.equal(normalizedSourceHash('backend/src/Database.php',await readFile('backend/src/Database.php')),baseline.sourceHashes['backend/src/Database.php'],'Connection construction/persistence/prepare/timezone policy remains unchanged.');
const sourceNames=['pack-capacity-instance-source34-wire.mjs','run-source34-capacity-burst.mjs','run-source34-capacity-wire-burst.mjs','run-source34-native-rate.mjs','native-rate-worker-source34.php'];
const changes=[];
const probe="<?php\nheader('Content-Type: application/json'); echo json_encode(['sapi'=>PHP_SAPI,'threadSafe'=>PHP_ZTS===1,'pid'=>getmypid(),'ini'=>php_ini_loaded_file(),'config'=>getenv('SPAROWTYPE_CONFIG_FILE'),'opcodeCacheEnabled'=>extension_loaded('Zend OPcache') && filter_var(ini_get('opcache.enable'), FILTER_VALIDATE_BOOLEAN),'pdoMysqlLoaded'=>extension_loaded('pdo_mysql'),'nativeMysqlDriverAvailable'=>in_array('mysql',PDO::getAvailableDrivers(),true)]);\n";
for(const name of sourceNames){
  const originalFile=`${prior}/${name}`,original=await readFile(originalFile,'utf8'),file=`${directory}/${name.replaceAll('source34','source35')}`;
  let text=original;const replacements=[];
  function replace(from,to,minimum=1){const count=text.split(from).length-1;assert.ok(count>=minimum,`Required source35 adaptation: ${file} ${from}`);if(count){text=text.replaceAll(from,to);replacements.push({from,to,count});}}
  replace(prior,directory,0);
  for(const[from,to]of[['source34','source35'],['SOURCE34','SOURCE35'],['Source34','Source35'],['FINAL34','FINAL35'],['capacity34','capacity35'],['rate-native34','rate-native35']])replace(from,to,0);
  replace('receipt.compared, 505','receipt.compared, 506',0);
  if(name==='pack-capacity-instance-source34-wire.mjs'){
    const anchor='apache = await prepareApache({ owned, root, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });';
    replace(anchor,anchor+`\n    // Same owned readiness request, with bounded OPcache/PDO availability facts.\n    await writeFile(path.join(apache.webRoot,'__audit-runtime.php'),${JSON.stringify(probe)});`);
    replace("assert.equal(actual.sapi, 'apache2handler'); assert.equal(actual.threadSafe, true);", "assert.equal(actual.sapi, 'apache2handler'); assert.equal(actual.threadSafe, true);\n    assert.equal(actual.opcodeCacheEnabled,false,'Ordinary capacity requires OPcache OFF.');\n    assert.equal(actual.pdoMysqlLoaded,true);assert.equal(actual.nativeMysqlDriverAvailable,true);");
    replace("privateIniMatched: true, privateConfigMatched: true, existingApacheConfigRead: false", "privateIniMatched: true, privateConfigMatched: true, opcodeCacheEnabled:false, pdoMysqlLoaded:true, nativeMysqlDriverAvailable:true, connectionPolicy:'Frozen unchanged native PDO constructor; nonpersistent, native prepares, UTC session initialization', existingApacheConfigRead: false");
  }
  if(name==='run-source34-capacity-burst.mjs'||name==='run-source34-capacity-wire-burst.mjs')replace("assert.equal(runtimeReceipt.existingApacheConfigRead, false);", "assert.equal(runtimeReceipt.existingApacheConfigRead, false);\nassert.equal(runtimeReceipt.opcodeCacheEnabled,false);assert.equal(runtimeReceipt.pdoMysqlLoaded,true);assert.equal(runtimeReceipt.nativeMysqlDriverAvailable,true);");
  let reversed=text;for(const change of[...replacements].reverse()){assert.equal(reversed.split(change.to).length-1,change.count,`Exact reverse span: ${file}`);reversed=reversed.replaceAll(change.to,change.from);}assert.equal(reversed,original);
  await writeFile(file,text,{flag:'wx'});
  changes.push({originalFile,originalSha256:sha(original),file,sha256:sha(text),replacements,exactReversal:true,applicationActionsAndTimingUnchanged:true});
}
const syntax=[];
for(const row of changes.filter(row=>row.file.endsWith('.mjs'))){const result=spawnSync(process.execPath,['--check',row.file],{encoding:'utf8',windowsHide:true});syntax.push({file:row.file,exit:result.status,stderr:result.stderr});assert.equal(result.status,0);}
const receipt={preparedAt:new Date().toISOString(),status:'TEMPLATES-PREPARED-NO-RUNTIME-WAITING-FINAL35-FREEZE',plannedSourceManifest:`${directory}/final35-source.json`,expectedSourceFileCount:506,buildEnvironment:'SPAROWTYPE_FINAL35_BUILD_ID must be the actual newly frozen20-character build ID',entry:`${directory}/pack-capacity-instance-source35-wire.mjs`,commands:['capacity35','capacity35-wire','cleanup'],changes,syntax,readinessProbe:{existingRequestReused:true,applicationEndpointsChanged:false,addedResponseHeaders:false,profileInstrumentation:false,opcodeCacheOffRequired:true,actualNativePdoDriverAvailabilityRequired:true,source34DatabaseHashUnchanged:baseline.sourceHashes['backend/src/Database.php']},predeclaredRepeatedAcceptance:{firstOwner:'One new owner runs full1653 then wire1653. All outcomes retained; no retries, filtering or automatic threshold adjustment.',ifFirstBothPass:'Run two additional independently new owners with the identical full→wire order; all three owners must pass both strict p95<150ms targets.',ifAnyFails:'Retain that failure and stop acceptance expansion for diagnosis; do not relabel an earlier pass or run the long matrix as if capacity passed.',perOwner:{rooms:50,seats:8,requestsPerRepresentation:1653,concurrentHttpRequests:20,strictP95BelowMs:150,fullBeforeWire:true,newIndependentFixturesPerRepresentation:true,OPcache:false,persistentPDO:false,actualPhpPoliciesUnchanged:true,wireCacheQualification:'Same owner/database after full workload, with no added warmup or code cache.'}},ordinarySource34FailuresRetained:true,existingUserServicesTouched:false,privateOriginalConfigurationRead:false,productionEdited:false,servicesStarted:0,phpRuntimeExecuted:false};
const file=`${directory}/source35-ordinary-capacity-template-preparation.json`,bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(file,bytes,{flag:'wx'});console.log(JSON.stringify({prepared:true,file,sha256:sha(bytes),files:changes.length,nodeSyntaxChecks:syntax.length,plannedSourceCount:506,runtime:false}));
