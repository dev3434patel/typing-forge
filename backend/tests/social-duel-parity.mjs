import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { appendChallengeTimingCases } from './challenge-timing-cases.mjs';
const root=path.resolve(import.meta.dirname,'../..'),temporary=await mkdtemp(path.join(tmpdir(),'sparowtype-social-'));
try{
 const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite'))('esbuild'),file=path.join(temporary,'social.mjs');await build({stdin:{contents:"export * from './src/domain/progression/social.ts';export * from './src/lib/challenge-timing.ts';",resolveDir:root},bundle:true,platform:'node',format:'esm',target:'es2022',outfile:file,logLevel:'silent'});const domain=await import(pathToFileURL(file));
 const score=(userId,wpm=50,accuracy=98)=>({userId,handle:userId,wpm,accuracy,sourceSessionId:`accepted-${userId}`}),cases=[],expected=[];
 for(let delta=-20;delta<=20;delta++){const scores=[score('alice',50+delta),score('bob')];cases.push({name:`speed-${delta}`,scores});expected.push({value:domain.compareDuelScores(scores)});}
 for(const accuracy of [0,50,90,95,97,98,99,100]){const scores=[score('alice',50,accuracy),score('bob')];cases.push({name:`accuracy-${accuracy}`,scores});expected.push({value:domain.compareDuelScores(scores)});}
 for(const scores of [[score('alice')],[score('alice'),score('alice')],[score('alice',-1),score('bob')],[score('alice',50,101),score('bob')]]){cases.push({name:'invalid-score',scores});expected.push({error:true});}
 const configuration={mode:'time',durationMs:30000,language:'en',keyboardLayout:'qwerty',inputMethod:'keyboard',scoringPolicy:'prose',contentRevision:'forge-social-duel-en-v1',correctionPolicy:'current-word',challengeId:'owned-challenge'};
 for(const change of [null,{challengeId:'stranger'},{durationMs:15000},{correctionPolicy:'correct-words-locked'},{inputMethod:'composition'},{language:'hi'},{mode:'zen'}]){const candidate={configuration:{...configuration,...change},targetText:'same passage',initialTarget:'same passage'};cases.push({name:'issued-contract',candidate,duel:{expected_text:'same passage'},run:{challenge_id:'owned-challenge'}});expected.push(change?{error:true}:{value:true});}
 appendChallengeTimingCases(domain,cases,expected);
 const runtime=phpRuntime(),native=spawnSync(runtime.binary,[...runtime.args,path.join(root,'backend/tests/social-duel-driver.php')],{input:JSON.stringify(cases),encoding:'utf8',maxBuffer:4*1024*1024,windowsHide:true});assert.equal(native.status,0,native.stderr||native.stdout);const actual=JSON.parse(native.stdout);assert.equal(actual.length,cases.length);cases.forEach((item,index)=>{if(expected[index].error){assert.ok(actual[index].error,item.name);if(expected[index].errorCode)assert.equal(actual[index].errorCode,expected[index].errorCode,item.name);}else assert.deepEqual(actual[index],expected[index],item.name);});
 const receipt={status:'PASS',cases:cases.length,accepted:expected.filter(item=>!item.error).length,rejected:expected.filter(item=>item.error).length,failures:0,checks:cases.map((item,index)=>({name:item.name,status:'PASS',accepted:!expected[index].error,...(expected[index].errorCode?{expectedErrorCode:expected[index].errorCode,actualErrorCode:actual[index].errorCode}:{})})),scope:'native PHP pure duel comparison, immutable issued source, independent first-input/legacy timing boundaries, canonical replay and server-owned arrival vs processing through a pure PDO protocol double; not HTTP/SQL lifecycle',at:new Date().toISOString()};if(process.env.SPAROWTYPE_SOCIAL_REPORT){await mkdir(path.dirname(path.resolve(process.env.SPAROWTYPE_SOCIAL_REPORT)),{recursive:true});await writeFile(process.env.SPAROWTYPE_SOCIAL_REPORT,JSON.stringify(receipt,null,2)+'\n');}console.log(JSON.stringify(receipt));
}finally{await rm(temporary,{recursive:true,force:true});}
