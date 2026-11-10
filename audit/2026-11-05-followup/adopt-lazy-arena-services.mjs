import assert from'node:assert/strict';
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import path from'node:path';
const directory='audit/2026-11-05-followup',sha=bytes=>createHash('sha256').update(bytes).digest('hex'),archive=`${directory}/source36-before`;
const prep=JSON.parse(await readFile(`${directory}/lazy-arena-services-candidate-preparation.json`));
for(const[name,expected]of[['lazy-arena-autoload-result.json',24],['lazy-arena-index-result.json',231]]){const result=JSON.parse(await readFile(`${directory}/${name}`));assert.equal(result.status,'PASS-SCOPED-PURE');assert.equal(result.passed??result.raw.passed,expected);}
const records=[];let patch='';
for(const record of prep.records){const current=await readFile(record.file),candidate=await readFile(`${directory}/lazy-services/candidate/${record.file}`);assert.equal(sha(current),record.sourceSha256);assert.equal(sha(candidate),record.candidateSha256);
 const saved=path.join(archive,record.file),reference=path.join('backend/tests/lazy-services/reference',record.file);await mkdir(path.dirname(saved),{recursive:true});await mkdir(path.dirname(reference),{recursive:true});await writeFile(saved,current,{flag:'wx'});await writeFile(reference,current,{flag:'wx'});await writeFile(record.file,candidate);
 const diff=spawnSync('git',['diff','--no-index','--',saved,record.file],{encoding:'utf8',windowsHide:true});assert.equal(diff.status,1);patch+=diff.stdout;records.push({file:record.file,beforeSha256:sha(current),afterSha256:sha(candidate),exactProvenCandidateBytes:true,reference,referenceSha256:sha(current),archive:saved});
}
const originalProbeFile=`${directory}/lazy-services/autoload-probe.php`,originalProbe=await readFile(originalProbeFile,'utf8');
const from="$file=in_array($relative,['ArenaService','ArenaEvidence'],true)?__DIR__.'/'.$variant.'/backend/src/'.$relative.'.php':$projectRoot.'/backend/src/'.$relative.'.php';";
const to="$file=$variant==='baseline'&&in_array($relative,['ArenaService','ArenaEvidence'],true)?__DIR__.'/reference/backend/src/'.$relative.'.php':$projectRoot.'/backend/src/'.$relative.'.php';";
assert.equal(originalProbe.split(from).length,2);const probe=originalProbe.replace(from,to);assert.equal(probe.replace(to,from),originalProbe);
const probeFile='backend/tests/lazy-services/autoload-probe.php';await writeFile(probeFile,probe,{flag:'wx'});
await writeFile(`${directory}/source36-lazy-services-adoption.patch`,patch,{flag:'wx'});
const receipt={adoptedAt:new Date().toISOString(),status:'THREE-PRODUCTION-FILES-STABLE-PERMANENT-TEST-PORT-IN-PROGRESS-NO-RUNTIME',records,archive,referenceRole:'Exact frozen Source35 bytes; tests select current production as candidate on every fresh child, never audit-clone versus audit-clone.',probe:{file:probeFile,sha256:sha(probe),auditSource:originalProbeFile,auditSha256:sha(originalProbe),portOnly:{from,to},exactReverse:true},proofs:{genuineAutoload24:'lazy-arena-autoload-result.json',actualIndex231:'lazy-arena-index-result.json'},patch:{file:`${directory}/source36-lazy-services-adoption.patch`,sha256:sha(patch)},noOtherArchitectureChanges:true,testsRunDuringAdoption:0,servicesStarted:0,permanentTestIntegration:'PENDING-FILE-PORT-THEN-FREEZE'};
const file=`${directory}/source36-lazy-services-adoption.json`,bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(file,bytes,{flag:'wx'});console.log(JSON.stringify({file,sha256:sha(bytes),records,probeSha256:sha(probe),runtime:false}));
