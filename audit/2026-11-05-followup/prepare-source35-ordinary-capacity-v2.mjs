import assert from 'node:assert/strict';
import{readFile,writeFile,stat,access}from'node:fs/promises';
import{createHash}from'node:crypto';
import{spawnSync}from'node:child_process';
import path from'node:path';
import{verifyFrozenSource}from'../2026-10-21/artifact-verification.mjs';
import{phpRuntime}from'../../scripts/php-runtime.mjs';
const directory='audit/2026-11-05-followup',sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const priorFile=`${directory}/source35-ordinary-capacity-preparation.json`,prior=JSON.parse(await readFile(priorFile));
const failureFile=`${directory}/pack-backend-8c164ff7da01c733-failure.json`,cleanupFile=`${directory}/pack-backend-8c164ff7da01c733-cleanup.json`;
const failure=JSON.parse(await readFile(failureFile)),cleanup=JSON.parse(await readFile(cleanupFile));
assert.ok(failure.reason.includes('pack-capacity-instance-source35.mjs'));assert.equal(cleanup.ownProcessesStopped,true);assert.equal(cleanup.gracefulDatabaseShutdown,true);assert.equal(cleanup.gracefulApacheShutdown,true);assert.equal(cleanup.forcedOwnApacheStop,false);assert.equal(cleanup.forcedOwnDatabaseStop,false);assert.deepEqual(cleanup.apacheResidualPids,[]);
for(const suffix of['source35-capacity-8c164ff7da01c733.json','source35-capacity-wire-8c164ff7da01c733.json'])await assert.rejects(access(`${directory}/${suffix}`),{code:'ENOENT'});
for(const[file,expected]of Object.entries(prior.runtimeInputs))assert.equal(sha(await readFile(file)),expected);
const oldBase='audit/2026-11-02/pack-capacity-instance-source34.mjs',newBase=`${directory}/pack-capacity-instance-source35.mjs`,original=await readFile(oldBase,'utf8');
const template=JSON.parse(await readFile(prior.templateFile));
const wireEdits=template.changes.find(row=>row.file.endsWith('pack-capacity-instance-source35-wire.mjs')).replacements;
let base=original;const replacements=[];
for(const edit of wireEdits){const count=base.split(edit.from).length-1;if(count){base=base.replaceAll(edit.from,edit.to);replacements.push({from:edit.from,to:edit.to,count});}}
let reversed=base;for(const edit of[...replacements].reverse()){assert.equal(reversed.split(edit.to).length-1,edit.count);reversed=reversed.replaceAll(edit.to,edit.from);}assert.equal(reversed,original);
await writeFile(newBase,base,{flag:'wx'});
const syntax=spawnSync(process.execPath,['--check',newBase],{encoding:'utf8',windowsHide:true});assert.equal(syntax.status,0);
const runtimeInputs={...prior.runtimeInputs,[newBase]:sha(base)};
const registry=new Set([...Object.keys(runtimeInputs),`${directory}/final35-source.json`,'dist/offline-build.json']);
for(const file of Object.keys(runtimeInputs).filter(name=>name.endsWith('.mjs')||name.endsWith('.php'))){
  const text=await readFile(file,'utf8');
  for(const match of text.matchAll(/['"]((?:audit|backend\/tests|scripts|src)\/[^'"\n]+\.(?:[cm]?js|tsx?|php|json))['"]/g))if(!match[1].includes('${')&&!match[1].includes('#'))registry.add(match[1]);
  for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.{1,2}\/[^'"\n]+)['"]/g))registry.add(path.relative(process.cwd(),path.resolve(path.dirname(file),match[1])).replaceAll('\\','/'));
}
const runtime=phpRuntime();
for(const file of[runtime.binary,'C:/xampp/apache/bin/httpd.exe','C:/xampp/mysql/bin/mysqld.exe','C:/xampp/mysql/bin/mysql_install_db.exe','C:/xampp/php/php8apache2_4.dll','C:/xampp/php/php8ts.dll','C:/xampp/php/ext/php_intl.dll','C:/xampp/php/ext/php_mbstring.dll','C:/xampp/php/ext/php_pdo_mysql.dll'])registry.add(file);
const files=[];
for(const file of[...registry].sort()){assert.ok(!/(?:^|\/)backend\/config\.php$|backend\/storage\//.test(file),'Private original/owned runtime contents are not filesystem-preflight inputs.');const entry=await stat(file);assert.equal(entry.isFile(),true,`Required helper/input exists: ${file}`);files.push({file,exists:true});}
const source=await verifyFrozenSource(`${directory}/final35-source.json`);assert.equal(source.receipt.compared,506);assert.deepEqual(source.receipt.mismatches,[]);assert.equal(source.frozen.local.version,'d89f84d74519bf2bbae0');assert.equal(JSON.parse(await readFile('dist/offline-build.json')).version,source.frozen.local.version);
const receipt={preparedAt:new Date().toISOString(),status:'V2-FS-PREFLIGHT-PASS-NO-CAPACITY-ATTEMPT-YET',priorPreparationFile:priorFile,priorPreparationSha256:sha(await readFile(priorFile)),retainedSetupFailure:{failureFile,failureSha256:sha(await readFile(failureFile)),cleanupFile,cleanupSha256:sha(await readFile(cleanupFile)),actualCapacityAttempts:0,allServicesGracefullyClosed:true,privateDiagnosticsRetainedIgnored:true},addedMissingIdentity:{originalFile:oldBase,originalSha256:sha(original),file:newBase,sha256:sha(base),exactReversal:true,replacements,syntaxExit:syntax.status},source:source.receipt,build:source.frozen.local.version,sourceManifestSha256:sha(await readFile(`${directory}/final35-source.json`)),runtimeInputs,filesystemPreflight:files,allRequiredStaticHelperInputAndImportPathsExist:true,all506SourceDependenciesVerified:true,predeclaredRepeatedAcceptance:prior.predeclaredRepeatedAcceptance,entry:prior.entry,flags:prior.flags,commands:prior.commands,measuredApplicationActionsOrTimingChanged:false,otherExistingRuntimeInputsChanged:false,servicesStartedByThisPreparation:0,originalPrivateConfigurationRead:false};
const out=`${directory}/source35-ordinary-capacity-preparation-v2.json`,bytes=JSON.stringify(receipt,null,2)+'\n';await writeFile(out,bytes,{flag:'wx'});console.log(JSON.stringify({file:out,sha256:sha(bytes),requiredPaths:files.length,runtimeInputs:Object.keys(runtimeInputs).length,sourceFiles:506,setupFailureRetained:true,actualCapacityAttempts:0}));
