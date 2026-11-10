import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import{phpRuntime}from'../../scripts/php-runtime.mjs';
import{verifyFrozenSource}from'../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-05-followup',sha=bytes=>createHash('sha256').update(bytes).digest('hex'),runtime=phpRuntime();
const prepFile=`${directory}/lazy-arena-services-candidate-preparation.json`,prep=JSON.parse(await readFile(prepFile)),harness=`${directory}/lazy-services/index-contract.php`,stub=`${directory}/lazy-services/stub-bootstrap.php`;
assert.equal(sha(await readFile(harness)),'cbe8071f372dd56f1b2ef963c06ed9e018fec4cabda9564a21fc0d6088f54f5a');assert.equal(sha(await readFile(stub)),'1a79b11e7c9f081274d14e7b20e3063a20d6ceb0ba0df54a158f8aeb082766af');
const files=[prepFile,harness,stub,...prep.records.flatMap(row=>['baseline','candidate'].map(variant=>`${directory}/lazy-services/${variant}/${row.file}`))],hashes=Object.fromEntries(await Promise.all(files.map(async file=>[file,sha(await readFile(file))])));
const source=await verifyFrozenSource(`${directory}/final35-source.json`);assert.deepEqual(source.receipt.mismatches,[]);
await writeFile(`${directory}/lazy-arena-index-protocol.json`,JSON.stringify({declaredAt:new Date().toISOString(),source:source.receipt,hashes,expectedCases:58,expectedFreshChildren:116,retries:0,realRequestBodyParser:true,ioTransformOnly:'php://input to php://stdin in exact reversible audit copies',noOriginalBootstrapOrConfiguration:true,servicesStarted:0},null,2)+'\n',{flag:'wx'});
const syntax=[];
for(const file of[harness,stub,...prep.records.map(row=>`${directory}/lazy-services/candidate/${row.file}`)]){const result=spawnSync(runtime.binary,[...runtime.args,'-l',file],{encoding:'utf8',windowsHide:true,timeout:10000});syntax.push({file,exit:result.status,stdout:result.stdout,stderr:result.stderr});}
await writeFile(`${directory}/lazy-arena-index-syntax.json`,JSON.stringify(syntax,null,2)+'\n',{flag:'wx'});assert.ok(syntax.every(row=>row.exit===0));
const run=spawnSync(runtime.binary,[...runtime.args,harness],{input:JSON.stringify({phpArgs:runtime.args}),encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8*1024*1024});
await writeFile(`${directory}/lazy-arena-index-raw.json`,run.stdout,{flag:'wx'});await writeFile(`${directory}/lazy-arena-index-stderr.log`,run.stderr,{flag:'wx'});
let raw=null;try{raw=JSON.parse(run.stdout);}catch{}
const after=await verifyFrozenSource(`${directory}/final35-source.json`),stable=(await Promise.all(files.map(async file=>sha(await readFile(file))===hashes[file]))).every(Boolean);
const receipt={closedAt:new Date().toISOString(),status:run.status===0&&raw?.failed===0&&stable&&after.receipt.mismatches.length===0?'PASS-SCOPED-PURE':'FAILED',childExit:run.status,raw,sourceAfter:after.receipt,inputsStable:stable,syntaxChecksPassed:syntax.every(row=>row.exit===0),rawFile:`${directory}/lazy-arena-index-raw.json`,stderrBytes:Buffer.byteLength(run.stderr),noServicesOrPrivateConfiguration:true,productionEdited:false};
await writeFile(`${directory}/lazy-arena-index-result.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:receipt.status,childExit:run.status,passed:raw?.passed,failed:raw?.failed,sourceUnchanged:after.receipt.mismatches.length===0,inputsStable:stable,stderrBytes:receipt.stderrBytes,syntax:syntax.length}));if(receipt.status!=='PASS-SCOPED-PURE')process.exitCode=1;
