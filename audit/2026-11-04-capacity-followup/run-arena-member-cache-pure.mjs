import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';
assert.equal(process.env.SPAROWTYPE_ARENA_CACHE_PURE,'1','Wait for the separate pure-test window.');
const directory='audit/2026-11-04-capacity-followup';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseline=JSON.parse(await readFile('audit/2026-11-02/final34-source.json'));
const before={},authorizedDifferences=[];
for(const[file,expected]of Object.entries(baseline.sourceHashes)){const bytes=await readFile(file);before[file]=sha(bytes);if(normalizedSourceHash(file,bytes)!==expected)authorizedDifferences.push(file);}
assert.ok(authorizedDifferences.every(file=>file==='src/pages/Profile.tsx'));
const preparation=JSON.parse(await readFile(`${directory}/arena-member-cache-preparation.json`));
const inputs=[preparation.candidateFile,preparation.contractFile,`${directory}/prepare-arena-member-cache.mjs`,`${directory}/arena-member-cache-preparation.json`,'scripts/php-runtime.mjs'];
const hashes=Object.fromEntries(await Promise.all(inputs.map(async file=>[file,sha(await readFile(file))])));
assert.equal(hashes[preparation.candidateFile],preparation.candidateSha256);assert.equal(hashes[preparation.contractFile],preparation.contractSha256);
const protocol={declaredAt:new Date().toISOString(),kind:'pure-unconnected-PDO-baseline-vs-locked-member-cache',iterations:1,retries:0,servicesStarted:0,baseline505Snapshot:'audit/2026-11-02/final34-source.json',preclinical505Hashes:before,authorizedDifferences,backend38Unchanged:true,hashes,noFreshFrontendBuildClaim:true};
await writeFile(`${directory}/arena-member-cache-pure-protocol.json`,JSON.stringify(protocol,null,2)+'\n',{flag:'wx'});
const runtime=phpRuntime(),syntax=[];
for(const file of[preparation.candidateFile,preparation.contractFile,`${directory}/arena-native-lock-proof.php`,`${directory}/projection-sql-profile-runtime.php`]){const r=spawnSync(runtime.binary,[...runtime.args,'-l',file],{encoding:'utf8',windowsHide:true,timeout:10000});syntax.push({file,exit:r.status,stdout:r.stdout,stderr:r.stderr});}
await writeFile(`${directory}/arena-member-cache-pure-syntax.json`,JSON.stringify(syntax,null,2)+'\n',{flag:'wx'});
assert.ok(syntax.every(row=>row.exit===0));
const run=spawnSync(runtime.binary,[...runtime.args,preparation.contractFile],{encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:2*1024*1024});
await writeFile(`${directory}/arena-member-cache-pure-stdout.json`,run.stdout,{flag:'wx'});
await writeFile(`${directory}/arena-member-cache-pure-stderr.log`,run.stderr,{flag:'wx'});
const sourceStable=(await Promise.all(Object.entries(before).map(async([file,expected])=>sha(await readFile(file))===expected))).every(Boolean);
const inputsStable=(await Promise.all(Object.entries(hashes).map(async([file,expected])=>sha(await readFile(file))===expected))).every(Boolean);
let raw=null;try{raw=JSON.parse(run.stdout);}catch{}
const receipt={closedAt:new Date().toISOString(),status:run.status===0&&raw?.failed===0&&sourceStable&&inputsStable?'PASS-SCOPED-PURE':'FAILED',childExit:run.status,syntaxPassed:syntax.every(row=>row.exit===0),raw,source505Unchanged:sourceStable,inputsUnchanged:inputsStable,authorizedDifferences,backend38Unchanged:true,noServicesStarted:true,nativePhysicalLocks:'UNVERIFIED',performance:'UNMEASURED',originalSource34CapacityFailuresRetained:true};
await writeFile(`${directory}/arena-member-cache-pure-result.json`,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:receipt.status,passed:raw?.passed,failed:raw?.failed,childExit:run.status,source505Unchanged:sourceStable,inputsUnchanged:inputsStable,stderrBytes:Buffer.byteLength(run.stderr)}));
if(receipt.status!=='PASS-SCOPED-PURE')process.exitCode=1;
