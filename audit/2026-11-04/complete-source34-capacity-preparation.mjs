import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const hash=value=>createHash('sha256').update(value).digest('hex');
const initial=JSON.parse(await readFile('audit/2026-11-04/source34-capacity-preparation.json','utf8'));
const mapping=[...initial.prepared.map(row=>[row.oldFile,row.newFile]),
 ['audit/2026-11-04/source33-opcache-cache-probe-endpoint.mjs','audit/2026-11-04/source34-opcache-cache-probe-endpoint.mjs'],
 ['audit/2026-11-02/run-source33-native-rate.mjs','audit/2026-11-02/run-source34-native-rate.mjs'],
 ['audit/2026-11-02/native-rate-worker-source33.php','audit/2026-11-02/native-rate-worker-source34.php'],
];
const transforms=[['source33','source34'],['SOURCE33','SOURCE34'],['final33','final34'],['FINAL33','FINAL34'],['capacity33','capacity34'],['arena-http33','arena-http34'],['rate-native33','rate-native34']];
const prepared=[];
for(const[oldFile,newFile]of mapping){
 const original=await readFile(oldFile,'utf8');let text=original;
 for(const[from,to]of transforms)text=text.replaceAll(from,to);
 let restored=text;for(const[from,to]of[...transforms].reverse())restored=restored.replaceAll(to,from);assert.equal(restored,original);
 if(initial.prepared.some(row=>row.newFile===newFile)){
  const existing=await readFile(newFile);assert.equal(hash(existing),initial.prepared.find(row=>row.newFile===newFile).afterHash);
  await writeFile(newFile,text);
 }else await writeFile(newFile,text,{flag:'wx'});
 const syntax=newFile.endsWith('.php')?spawnSync('C:/xampp/php/php.exe',['-n','-l',newFile],{encoding:'utf8'}):spawnSync(process.execPath,['--check',newFile],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr||syntax.stdout);prepared.push({oldFile,newFile,beforeHash:hash(original),afterHash:hash(text),exactIdentifierReverse:true,syntaxPassed:true});
}
const sourceFile='audit/2026-11-02/final34-source.json',sourceBytes=await readFile(sourceFile),source=JSON.parse(sourceBytes);
const ordinary={recordedAt:new Date().toISOString(),status:'PREPARED-UNVERIFIED-RUNTIME',sourceFile,sourceManifestSha256:hash(sourceBytes),sourceFiles:505,clientBuild:source.local.version,prepared,initialPreparationFailureRetained:'The first preparation stopped on a missing shared endpoint clone before services or profile manifest. Original partial preparation is retained.',entry:'audit/2026-11-02/pack-capacity-instance-source34-wire.mjs',commands:['capacity34','capacity34-wire','rate-native34','cleanup'],requestsPerCapacityRun:1653,concurrency:20,occupiedSeats:400,p95StrictlyBelowMs:150,counterConnections:8,counterCalls:320,noRetries:true,servicesStarted:0};
await writeFile('audit/2026-11-04/source34-capacity-preparation-v2.json',JSON.stringify(ordinary,null,2)+'\n',{flag:'wx'});
const old=JSON.parse(await readFile('audit/2026-11-04/source33-opcache-profile-preparation-v3.json','utf8'));
const paths=Object.keys(old.additionalInputHashes).map(file=>file.replaceAll('source33','source34'));
const profile={...old,recordedAt:new Date().toISOString(),sourceFile,sourceManifestSha256:hash(sourceBytes),clientBuild:source.local.version,runtimeVariant:'source34-opcache-production-config-variant',additionalInputHashes:Object.fromEntries(await Promise.all(paths.map(async file=>[file,hash(await readFile(file))]))),prepared:prepared.filter(row=>row.newFile.includes('opcache')),entry:'audit/2026-11-02/pack-opcache-instance-source34-v3-wire.mjs',commandsInOrder:['capacity34-opcache-v3','capacity34-opcache-v3-wire','arena-http34-opcache-v3','cleanup'],oldSource33MeasurementsRetained:true};
const file='audit/2026-11-04/source34-opcache-profile-preparation-v3.json',bytes=JSON.stringify(profile,null,2)+'\n';await writeFile(file,bytes,{flag:'wx'});
console.log(JSON.stringify({ordinaryEntry:ordinary.entry,ordinaryPreparation:'audit/2026-11-04/source34-capacity-preparation-v2.json',profileEntry:profile.entry,profileManifest:file,profileManifestSha256:hash(bytes),clientBuild:source.local.version,syntaxChecks:prepared.length,exactIdentifierReversals:prepared.length}));
