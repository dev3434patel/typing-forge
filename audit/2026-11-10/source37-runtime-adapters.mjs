import assert from 'node:assert/strict';
import { access, lstat, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { freemem } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const oldDirectory='audit/2026-11-05-followup',newDirectory='audit/2026-11-10';
export const source37PreparationFile=`${newDirectory}/source37-runtime-preparation-v2.json`;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const dependencyDigest='525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37';
const expectedBuild='d89f84d74519bf2bbae0';
const rows=[
  ['nativeOwner','pack-source36-native-arena-http32.mjs','.final37-v2-native-arena-owner.generated.mjs'],
  ['nativeWrapper','run-source36-native-arena-http32.mjs','.final37-v2-native-arena-wrapper.generated.mjs'],
  ['capacityOwner','pack-capacity-instance-source36-wire.mjs','.final37-v2-capacity-owner.generated.mjs'],
  ['capacityFull','run-source36-capacity-burst.mjs','.final37-v2-capacity-full.generated.mjs'],
  ['capacityWire','run-source36-capacity-wire-burst.mjs','.final37-v2-capacity-wire.generated.mjs'],
  ['nativeRate','run-source36-native-rate.mjs','.final37-v2-native-rate.generated.mjs'],
  ['nativeRateWorker','native-rate-worker-source36.php','.final37-v2-native-rate-worker.generated.php'],
];
const identityPairs=[['source36','source37'],['Source36','Source37'],['SOURCE36','SOURCE37'],['final36','final37'],['FINAL36','FINAL37'],['capacity36','capacity37'],['rate-native36','rate-native37'],['ordinary36','ordinary37'],['arena-http36','arena-http37']];
export const source37GeneratedFiles=Object.fromEntries(rows.map(([key,,file])=>[key,`${oldDirectory}/${file}`]));

async function originalBindings(){
  const ordinaryFile=`${oldDirectory}/source36-ordinary-capacity-preparation-v3.json`,nativeFile=`${oldDirectory}/source36-native-arena32-preparation-v2.json`;
  const ordinaryBytes=await readFile(ordinaryFile),nativeBytes=await readFile(nativeFile);
  assert.equal(sha(ordinaryBytes),'20d39a2f43241388d33260b9082554207d9fce8ba7b31b88a28e424a7dced7af');
  assert.equal(sha(nativeBytes),'be7deb83cbe5c8ccdc14730d022e2ef23ee069f8488a320e7d48f3b97c22d60e');
  const ordinary=JSON.parse(ordinaryBytes),native=JSON.parse(nativeBytes);
  const hashes={...ordinary.preflight.runtimeInputs,...native.preflight.runtimeInputs};
  for(const[file,expected]of Object.entries(hashes))assert.equal(sha(await readFile(file)),expected,`Frozen36 helper changed: ${file}`);
  return {ordinaryFile,ordinarySha256:sha(ordinaryBytes),nativeFile,nativeSha256:sha(nativeBytes),hashes,ordinary,native};
}

export async function deriveSource37Adapters(){
  const bound=await originalBindings(),derived=[];
  for(const[key,name,generated]of rows){
    const from=`${oldDirectory}/${name}`,to=`${oldDirectory}/${generated}`;
    const original=await readFile(from,'utf8');let text=original;const edits=[];
    const replace=(before,after,required=false)=>{const count=text.split(before).length-1;if(required)assert.ok(count>0,`Expected source37 adapter span: ${before}`);if(count){text=text.replaceAll(before,after);edits.push({before,after,count});}};
    for(const[before,after]of identityPairs)replace(before,after);
    for(const[,oldName,newName]of rows){const mapped=identityPairs.reduce((value,[before,after])=>value.replaceAll(before,after),oldName);replace(mapped,newName);}
    // The preserved full-only owner is a provenance/hash reference, never executed.
    replace('pack-capacity-instance-source37.mjs','pack-capacity-instance-source36.mjs');
    replace("'./source37-native-arena32-preflight.mjs'","'../2026-11-10/source37-runtime-adapters.mjs'");
    replace("'./source37-ordinary-preflight.mjs'","'../2026-11-10/source37-runtime-adapters.mjs'");
    if(key==='capacityOwner'){
      replace("import { verifyPreparedOrdinarySource37 } from '../2026-11-10/source37-runtime-adapters.mjs';","import { verifyPreparedOrdinarySource37, assertSource37CapacityMemory } from '../2026-11-10/source37-runtime-adapters.mjs';",true);
      replace('await verifyPreparedOrdinarySource37(); // Before initialization, process spawn or private configuration creation.','await verifyPreparedOrdinarySource37(); // Before initialization, process spawn or private configuration creation.\nassertSource37CapacityMemory(\'before-service-start\');',true);
    }
    if(key==='capacityFull'||key==='capacityWire'){
      const prefix="import { verifyPreparedOrdinarySource37, assertSource37CapacityMemory } from '../2026-11-10/source37-runtime-adapters.mjs';\nawait verifyPreparedOrdinarySource37();\nassertSource37CapacityMemory('before-workload');\n";
      edits.push({before:'',after:prefix,count:1,prefix:true});text=prefix+text;
    }
    let reversed=text;
    for(const edit of [...edits].reverse()){
      if(edit.prefix){assert.ok(reversed.startsWith(edit.after));reversed=reversed.slice(edit.after.length);}
      else{assert.equal(reversed.split(edit.after).length-1,edit.count);reversed=reversed.replaceAll(edit.after,edit.before);}
    }
    assert.equal(reversed,original,'Every source37 adapter must reverse exactly to its frozen36 source.');
    derived.push({key,from,to,originalSha256:sha(original),derivedSha256:sha(text),edits,exactReverse:true,text});
  }
  return {bound,derived};
}

export async function materializeSource37Adapters(){
  const root=await realpath(fileURLToPath(new URL('../..',import.meta.url)));
  assert.equal(await realpath(process.cwd()),root);
  const {derived}=await deriveSource37Adapters();
  for(const row of derived){
    const absolute=path.resolve(row.to);assert.equal(path.dirname(absolute),path.join(root,'audit/2026-11-05-followup'));assert.ok(path.basename(absolute).startsWith('.final37-'));
    try{await writeFile(absolute,row.text,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const info=await lstat(absolute);assert.equal(info.isSymbolicLink(),false);assert.equal(info.isFile(),true);assert.equal(await realpath(absolute),absolute);assert.equal(sha(await readFile(absolute)),row.derivedSha256,'An existing generated adapter must retain its prepared bytes.');}
  }
  return derived.map(({text,...row})=>row);
}

export function assertSource37CapacityMemory(context){
  const available=freemem(),minimum=2*1024*1024*1024;
  console.log(JSON.stringify({stage:'source37-capacity-resource-gate',context,freeMemoryBytes:available,minimumBytes:minimum,passed:available>=minimum}));
  assert.ok(available>=minimum,'Source37 load acceptance requires at least2GiB available RAM before services and before each workload.');
  return available;
}

export async function source37FilePreflight(){
  assert.equal(process.env.PHP_BINARY,'C:/xampp/php/php.exe');
  assert.equal(process.env.SPAROWTYPE_FINAL37_BUILD_ID,expectedBuild);
  const {bound,derived}=await deriveSource37Adapters();
  const source=await verifyFrozenSource(`${oldDirectory}/final37-source.json`);
  assert.equal(source.receipt.compared,506);assert.deepEqual(source.receipt.mismatches,[]);assert.equal(source.frozen.baseline,'9b21e255ea1840508cbc35b625d0ccde8f3af7cc');assert.equal(source.frozen.local.version,expectedBuild);assert.equal(source.frozen.fullIntroSourceUnchanged,true);
  const old=JSON.parse(await readFile(`${oldDirectory}/final36-source.json`));
  const changed=Object.keys(source.frozen.sourceHashes).filter(file=>source.frozen.sourceHashes[file]!==old.sourceHashes[file]);assert.deepEqual(changed,['backend/public/index.php']);
  assert.equal(source.frozen.sourceHashes['backend/public/index.php'],'ace06732ab6996e13525e08dbb41dff441109c94c18650db937985d5ae2f5c78');
  assert.equal(source.frozen.sourceHashes['backend/src/Database.php'],'38e67995661448fb80af94ae81acc2fc844b5ecea15c6313d6fc87135681acb0');
  assert.deepEqual(JSON.parse(await readFile('dist/offline-build.json')),source.frozen.local);
  const requiredPaths=[...bound.ordinary.preflight.requiredPaths,`${oldDirectory}/final37-source.json`,...derived.map(row=>row.to)];
  for(const file of requiredPaths)assert.equal((await stat(file)).isFile(),true,`Required source37 input: ${file}`);
  const dependencyFiles=[...(await readdir('e2e')).filter(file=>file.endsWith('.ts')).map(file=>`e2e/${file}`),'playwright.config.ts'].sort();assert.equal(dependencyFiles.length,73);
  const dependencies=Object.fromEntries(await Promise.all(dependencyFiles.map(async file=>[file,sha(await readFile(file))])));assert.equal(sha(JSON.stringify(dependencies)),dependencyDigest);
  const actualPhp=phpRuntime();assert.equal(await realpath(actualPhp.binary),path.resolve('C:/xampp/php/php.exe'));assert.deepEqual(actualPhp.args,bound.native.preflight.selectedPhp.args);
  const phpHashes={};for(const[key,expected]of Object.entries(bound.native.preflight.selectedPhp.fileHashes)){const file=path.resolve('C:/xampp/php',key);assert.equal(await realpath(file),file);phpHashes[key]=sha(await readFile(file));assert.equal(phpHashes[key],expected);}
  for(const row of derived){assert.equal((await lstat(row.to)).isSymbolicLink(),false);assert.equal(sha(await readFile(row.to)),row.derivedSha256);}
  const original32='audit/2026-11-02/run-source34-arena-chart-http.mjs';assert.equal(sha(await readFile(original32)),'5bd4b0c068681ccad6dddecef61923650c2cbac8790dbdb6d69cb15a4bd69007');
  const helperInputs=[`${newDirectory}/source37-runtime-adapters.mjs`,`${newDirectory}/run-source37-native-arena32.mjs`,`${newDirectory}/run-source37-ordinary-capacity.mjs`];
  return {source:source.receipt,sourceManifestSha256:sha(await readFile(`${oldDirectory}/final37-source.json`)),build:source.frozen.local,onlyProductionDelta:changed,source36RuntimeInputs:bound.hashes,generated:derived.map(({text,...row})=>row),dependencyFiles,dependencySha256:dependencyDigest,selectedPhp:{binary:await realpath(actualPhp.binary),args:actualPhp.args,fileHashes:phpHashes,externalIniRead:false},requiredPaths:[...new Set(requiredPaths)].sort(),original32Sha256:sha(await readFile(original32)),helperInputs:Object.fromEntries(await Promise.all(helperInputs.map(async file=>[file,sha(await readFile(file))]))),servicesStarted:0,PHPExecuted:0,testsExecuted:0,productionOrPriorHelpersEdited:false};
}

async function verifyPrepared(flag){
  const bytes=await readFile(source37PreparationFile),expected=process.env[flag];assert.match(expected??'',/^[a-f0-9]{64}$/);assert.equal(sha(bytes),expected,'Bind the exact independently reviewed source37 preparation before execution.');
  const plan=JSON.parse(bytes),actual=await source37FilePreflight();assert.deepEqual(actual,plan.preflight);return actual;
}
export const verifyPreparedSource37NativeArena32=()=>verifyPrepared('SPAROWTYPE_SOURCE37_ARENA_HTTP_PREPARATION_SHA256');
export const verifyPreparedOrdinarySource37=()=>verifyPrepared('SPAROWTYPE_SOURCE37_CAPACITY_PREPARATION_SHA256');
