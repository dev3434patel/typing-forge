import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const hash=value=>createHash('sha256').update(value).digest('hex');
const mappings=[
 ['audit/2026-11-02/pack-capacity-instance-source33.mjs','audit/2026-11-02/pack-capacity-instance-source34.mjs'],
 ['audit/2026-11-02/pack-capacity-instance-source33-wire.mjs','audit/2026-11-02/pack-capacity-instance-source34-wire.mjs'],
 ['audit/2026-11-02/run-source33-capacity-burst.mjs','audit/2026-11-02/run-source34-capacity-burst.mjs'],
 ['audit/2026-11-02/run-source33-capacity-wire-burst.mjs','audit/2026-11-02/run-source34-capacity-wire-burst.mjs'],
 ['audit/2026-11-02/run-source33-arena-chart-http.mjs','audit/2026-11-02/run-source34-arena-chart-http.mjs'],
 ['audit/2026-11-02/pack-opcache-instance-source33-v3.mjs','audit/2026-11-02/pack-opcache-instance-source34-v3.mjs'],
 ['audit/2026-11-02/pack-opcache-instance-source33-v3-wire.mjs','audit/2026-11-02/pack-opcache-instance-source34-v3-wire.mjs'],
 ['audit/2026-11-02/run-source33-opcache-v3-capacity-burst.mjs','audit/2026-11-02/run-source34-opcache-v3-capacity-burst.mjs'],
 ['audit/2026-11-02/run-source33-opcache-v3-capacity-wire-burst.mjs','audit/2026-11-02/run-source34-opcache-v3-capacity-wire-burst.mjs'],
 ['audit/2026-11-04/source33-opcache-runtime-v3.mjs','audit/2026-11-04/source34-opcache-runtime-v3.mjs'],
];
const prepared=[];
for(const[oldFile,newFile]of mappings){
 const original=await readFile(oldFile,'utf8');
 let text=original;
 for(const[from,to]of[['source33','source34'],['SOURCE33','SOURCE34'],['final33','final34'],['FINAL33','FINAL34'],['capacity33','capacity34'],['arena-http33','arena-http34']])text=text.replaceAll(from,to);
 let reverse=text;for(const[from,to]of[['source34','source33'],['SOURCE34','SOURCE33'],['final34','final33'],['FINAL34','FINAL33'],['capacity34','capacity33'],['arena-http34','arena-http33']])reverse=reverse.replaceAll(from,to);
 assert.equal(reverse,original,'Exact identifier-only reverse');
 await writeFile(newFile,text,{flag:'wx'});const syntax=spawnSync(process.execPath,['--check',newFile],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
 prepared.push({oldFile,newFile,beforeHash:hash(original),afterHash:hash(text),exactIdentifierReverse:true,syntaxPassed:true});
}
const sourceFile='audit/2026-11-02/final34-source.json',sourceBytes=await readFile(sourceFile),source=JSON.parse(sourceBytes);
assert.equal(Object.keys(source.sourceHashes).length,505);
const basic={recordedAt:new Date().toISOString(),sourceFile,sourceManifestSha256:hash(sourceBytes),sourceFiles:505,clientBuild:source.local.version,prepared,ordinaryEntry:'audit/2026-11-02/pack-capacity-instance-source34-wire.mjs',ordinaryCommands:['capacity34','capacity34-wire','cleanup'],exactOperationsPerRun:1653,concurrency:20,rooms:50,accountsPerRoom:8,p95StrictlyBelowMs:150,noWarmupResetRetry:true,servicesStarted:0};
await writeFile('audit/2026-11-04/source34-capacity-preparation.json',JSON.stringify(basic,null,2)+'\n',{flag:'wx'});
const oldProfile=JSON.parse(await readFile('audit/2026-11-04/source33-opcache-profile-preparation-v3.json','utf8'));
const additionalPaths=Object.keys(oldProfile.additionalInputHashes).map(file=>file.replaceAll('source33','source34'));
const profile={...oldProfile,recordedAt:new Date().toISOString(),sourceFile,sourceManifestSha256:hash(sourceBytes),clientBuild:source.local.version,runtimeVariant:'source34-opcache-production-config-variant',additionalInputHashes:Object.fromEntries(await Promise.all(additionalPaths.map(async file=>[file,hash(await readFile(file))]))),prepared:prepared.filter(row=>row.newFile.includes('opcache')),entry:'audit/2026-11-02/pack-opcache-instance-source34-v3-wire.mjs',commandsInOrder:['capacity34-opcache-v3','capacity34-opcache-v3-wire','arena-http34-opcache-v3','cleanup'],cacheProofCorrection:oldProfile.cacheProofCorrection,oldSource33MeasurementsRetained:true};
const manifest='audit/2026-11-04/source34-opcache-profile-preparation-v3.json',profileBytes=JSON.stringify(profile,null,2)+'\n';await writeFile(manifest,profileBytes,{flag:'wx'});
console.log(JSON.stringify({ordinaryEntry:basic.ordinaryEntry,profileEntry:profile.entry,profileManifest:manifest,profileManifestSha256:hash(profileBytes),clientBuild:source.local.version,syntaxChecks:prepared.length,exactIdentifierReversals:prepared.length}));
