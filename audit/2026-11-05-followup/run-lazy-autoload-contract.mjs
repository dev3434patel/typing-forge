import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{phpRuntime}from'../../scripts/php-runtime.mjs';
import{verifyFrozenSource}from'../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-05-followup',probe=`${directory}/lazy-services/autoload-probe.php`,sha=bytes=>createHash('sha256').update(bytes).digest('hex'),runtime=phpRuntime();assert.ok(runtime.args.includes('-n'));
const preparationFile=`${directory}/lazy-arena-services-candidate-preparation.json`,preparation=JSON.parse(await readFile(preparationFile));
const files=[probe,preparationFile,...preparation.records.flatMap(row=>[`${directory}/lazy-services/baseline/${row.file}`,`${directory}/lazy-services/candidate/${row.file}`])];
const hashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,sha(await readFile(file))])));
const before=await verifyFrozenSource(`${directory}/final35-source.json`);assert.deepEqual(before.receipt.mismatches,[]);
const protocol={declaredAt:new Date().toISOString(),kind:'fresh-PHP-controlled-autoload-and-genuine-validator-contract',source:before.receipt,hashes,processes:12,retries:0,phpIniDisabled:true,noBootstrapOrConfiguration:true,servicesStarted:0};
await writeFile(`${directory}/lazy-arena-autoload-protocol.json`,JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const cases=[...['baseline','candidate'].flatMap(variant=>['non-submit','checkpoint','finish'].map(mode=>({variant,mode}))),...['malformed-finish','malformed-candidate','missing-validator-prepare','finish-missing-data','missing-validator-submit','missing-data-submit'].map(mode=>({variant:'candidate',mode}))];
const runs=[];
for(const input of cases){const result=spawnSync(runtime.binary,[...runtime.args,probe],{input:JSON.stringify(input),encoding:'utf8',windowsHide:true,timeout:15000,maxBuffer:1024*1024});let data=null;try{data=JSON.parse(result.stdout);}catch{}runs.push({input,exit:result.status,stdout:result.stdout,stderr:result.stderr,data});}
await writeFile(`${directory}/lazy-arena-autoload-raw.json`,JSON.stringify({runs},null,2)+'\n',{flag:'wx'});
const checks=[];const check=(name,pass)=>checks.push({name,pass:Boolean(pass)});
check('all twelve fresh PHP children return bounded JSON without stderr',runs.length===12&&runs.every(row=>row.exit===0&&row.data&&row.stderr===''));
const get=(variant,mode)=>runs.find(row=>row.input.variant===variant&&row.input.mode===mode)?.data;
for(const mode of['non-submit','checkpoint','finish']){
 const a=get('baseline',mode),b=get('candidate',mode);
 check(`${mode} original and lazy dependency construction succeed`,a?.error===null&&b?.error===null);
 check(`${mode} canonical candidate bytes and prepared full/marker shape stay exact`,a?.canonicalCandidateSha256===b?.canonicalCandidateSha256&&a?.completeFinishBundle===b?.completeFinishBundle&&a?.checkpointMarker===b?.checkpointMarker);
 check(`${mode} genuine independent replay/write parameters stay exact`,JSON.stringify(a?.writes)===JSON.stringify(b?.writes));
 check(`${mode} service/evidence retain the same validator object`,a?.sameValidatorIdentity===true&&b?.sameValidatorIdentity===true);
}
check('baseline non-submit eagerly loads both existing heavy classes',get('baseline','non-submit')?.validatorLoaded&&get('baseline','non-submit')?.dataLoaded);
check('nullable genuine ArenaService does not autoload either unused class',get('candidate','non-submit')?.validatorLoaded===false&&get('candidate','non-submit')?.dataLoaded===false&&JSON.stringify(get('candidate','non-submit')?.loaded)===JSON.stringify(['ArenaService']));
check('checkpoint loads actual validator but never loads DataService even after actual prepare and locked replay/write',get('candidate','checkpoint')?.validatorLoaded===true&&get('candidate','checkpoint')?.dataLoaded===false&&get('candidate','checkpoint')?.writes.length===1);
check('finish loads persistence and retains the complete default full bundle',get('candidate','finish')?.dataLoaded===true&&get('candidate','finish')?.completeFinishBundle===true);
for(const mode of['malformed-finish','malformed-candidate'])check(`${mode} remains arena-candidate422 before missing dependencies`,get('candidate',mode)?.error?.status===422&&get('candidate',mode)?.error?.code==='arena-candidate'&&get('candidate',mode)?.writes.length===0);
for(const mode of['missing-validator-prepare','finish-missing-data','missing-validator-submit','missing-data-submit'])check(`${mode} fails closed internally before any write`,get('candidate',mode)?.error?.class==='LogicException'&&get('candidate',mode)?.writes.length===0);
const after=await verifyFrozenSource(`${directory}/final35-source.json`);const stable=(await Promise.all(files.map(async file=>sha(await readFile(file))===hashes[file]))).every(Boolean);
check('source506 and all audit inputs remain unchanged',after.receipt.mismatches.length===0&&stable);
const failed=checks.filter(row=>!row.pass),receipt={closedAt:new Date().toISOString(),status:failed.length?'FAILED':'PASS-SCOPED-PURE',passed:checks.length-failed.length,failed:failed.length,checks,sourceAfter:after.receipt,inputsStable:stable,rawFile:`${directory}/lazy-arena-autoload-raw.json`,runtime:'Twelve fresh php -n processes with only controlled intl/mbstring/pdo_mysql extension arguments; no database connection/configuration or service.',productionEdited:false};
await writeFile(`${directory}/lazy-arena-autoload-result.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status,passed:receipt.passed,failed:receipt.failed,failedChecks:failed,children:12,sourceUnchanged:after.receipt.mismatches.length===0,inputsStable:stable}));if(failed.length)process.exitCode=1;
