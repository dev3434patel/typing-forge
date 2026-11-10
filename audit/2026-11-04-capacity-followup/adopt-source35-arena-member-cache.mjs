import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {createHash}from'node:crypto';
import {spawnSync}from'node:child_process';
const directory='audit/2026-11-04-capacity-followup',archive=`${directory}/source35-before`;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const serviceFile='backend/src/ArenaService.php',original=await readFile(serviceFile),candidate=await readFile(`${directory}/ArenaServiceCachedCandidate.php`);
assert.equal(sha(original),'9008825c59bdcfd863b714f45412638082043eae56a1000b70a134de67919a6d');
assert.equal(sha(candidate),'f0181ab564c1f02d7aaa9b429b3ac66cc19dc3e0a4896ec77f88f0e25563ce6e');
const pure=JSON.parse(await readFile(`${directory}/arena-member-cache-pure-result.json`));assert.equal(pure.status,'PASS-SCOPED-PURE');assert.equal(pure.raw.passed,118);
const diagnosis=JSON.parse(await readFile(`${directory}/owned-arena-diagnostic-assessment.json`));assert.equal(diagnosis.nativeLockProof.passed,40);assert.equal(diagnosis.closure.allOwnedServicesGracefullyClosed,true);
await mkdir(archive,{recursive:true});
try{await writeFile(`${archive}/ArenaService.php`,original,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;assert.equal(sha(await readFile(`${archive}/ArenaService.php`)),sha(original));}
function unique(text,from,to){assert.equal(text.split(from).length,2);return text.replace(from,to);}
const adopted=unique(candidate.toString('utf8'),'final class ArenaServiceCachedCandidate','final class ArenaService');
assert.equal(unique(adopted,'final class ArenaService','final class ArenaServiceCachedCandidate'),candidate.toString('utf8'));
const referenceFile='backend/tests/ArenaServiceReferenceSource34.php';
const reference=unique(original.toString('utf8'),'final class ArenaService','final class ArenaServiceReferenceSource34');
assert.equal(unique(reference,'final class ArenaServiceReferenceSource34','final class ArenaService'),original.toString('utf8'));
const auditContractFile=`${directory}/arena-member-cache-contract.php`,auditContract=await readFile(auditContractFile,'utf8');assert.equal(sha(auditContract),'32b380b12e680c0cbcc5239c8d2b8b149dab4651e13f871cc4a37ab0478df2be');
let contract=auditContract;const contractChanges=[];
for(const[from,to]of[
 ["require_once __DIR__.'/ArenaServiceCachedCandidate.php';","require_once __DIR__.'/ArenaServiceReferenceSource34.php';"],
 ['use SparowType\\ArenaService;','use SparowType\\ArenaServiceReferenceSource34 as ArenaService;'],
 ['use SparowType\\ArenaServiceCachedCandidate;','use SparowType\\ArenaService as ArenaServiceCachedCandidate;'],
 ['// Pure audit-only contract. No bootstrap/configuration, native connection or server.','// Frozen Source34 reference versus production transaction-local member cache. No connection or bootstrap.'],
]){contract=unique(contract,from,to);contractChanges.push({from,to});}
let reverseContract=contract;for(const change of[...contractChanges].reverse())reverseContract=unique(reverseContract,change.to,change.from);assert.equal(reverseContract,auditContract);
const contractFile='backend/tests/arena-member-cache-contract.php';
const runnerFile='backend/tests/arena-contract.mjs',runner=await readFile(runnerFile,'utf8'),eol=runner.includes('\r\n')?'\r\n':'\n';
await writeFile(`${archive}/arena-contract.mjs`,runner,{flag:'wx'});
const hook=[
 "const memberCacheProcess = spawnSync(runtime.binary, [...runtime.args, 'backend/tests/arena-member-cache-contract.php'], { encoding: 'utf8', windowsHide: true });",
 'if (memberCacheProcess.status !== 0) throw new Error(memberCacheProcess.stderr || memberCacheProcess.stdout);',
 "for (const assertion of JSON.parse(memberCacheProcess.stdout).checks) check(`Locked member snapshot: ${assertion.name}`, assertion.pass);",
].join(eol)+eol;
const anchor="const report = { status: 'PASS-SCOPED', recordedAt: new Date().toISOString(), passed: checks.length";
const updatedRunner=unique(runner,anchor,hook+anchor);assert.equal(updatedRunner.replace(hook,''),runner);
await writeFile(serviceFile,adopted);
await writeFile(referenceFile,reference,{flag:'wx'});
await writeFile(contractFile,contract,{flag:'wx'});
await writeFile(runnerFile,updatedRunner);
const originalManifest=JSON.parse(await readFile('audit/2026-11-02/final34-source.json'));const otherBackend=[];
for(const file of Object.keys(originalManifest.sourceHashes).filter(file=>file.startsWith('backend/')&&file!==serviceFile)){const bytes=await readFile(file);otherBackend.push({file,rawSha256:sha(bytes)});}
let patch='';for(const[before,after]of[[`${archive}/ArenaService.php`,serviceFile],[`${archive}/arena-contract.mjs`,runnerFile]]){const diff=spawnSync('git',['diff','--no-index','--',before,after],{encoding:'utf8',windowsHide:true});assert.equal(diff.status,1);patch+=diff.stdout;}
await writeFile(`${directory}/source35-arena-member-cache-adoption.patch`,patch,{flag:'wx'});
const receipt={adoptedAt:new Date().toISOString(),status:'PRODUCTION-AND-TESTS-FILE-STABLE-NOT-YET-EXECUTED',authorization:'Root explicit GO after118 pure differential contracts and40 native locking checks; no ordinary latency pass is claimed.',primaryFile:{file:serviceFile,beforeSha256:sha(original),afterSha256:sha(adopted),candidateSha256:sha(candidate),candidateDelta:'Class declaration renamed back only',exactCandidateClassRename:true},frozenReference:{file:referenceFile,sha256:sha(reference),source34OriginalSha256:sha(original),exactClassRenameOnly:true},contract:{file:contractFile,sha256:sha(contract),auditOriginalSha256:sha(auditContract),changes:contractChanges,exactReverse:true,comparesOldSource34ToCurrentProduction:true},runner:{file:runnerFile,beforeSha256:sha(runner),afterSha256:sha(updatedRunner),hook,original802AssertionsPreserved:true,newPreparedAssertions:118,expectedTotalAssertions:920,actualTotal:'NOT RUN'},other37BackendFiles:otherBackend,patch:{file:`${directory}/source35-arena-member-cache-adoption.patch`,sha256:sha(patch)},archive,testsOrSyntaxRunDuringAdoption:false,source35Freeze:'Root will bind the combined Profile/core/backend source after all owners are stable',strictFreshOrdinaryFullAndWire:'STILL REQUIRED',memoryTrimIdea:'NOT IMPLEMENTED'};
const bytes=JSON.stringify(receipt,null,2)+'\n',file=`${directory}/source35-arena-member-cache-adoption.json`;await writeFile(file,bytes,{flag:'wx'});
console.log(JSON.stringify({productionStable:true,receipt:file,receiptSha256:sha(bytes),serviceSha256:sha(adopted),referenceSha256:sha(reference),contractSha256:sha(contract),runnerSha256:sha(updatedRunner),testsRun:false}));
