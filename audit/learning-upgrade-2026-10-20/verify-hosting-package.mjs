import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Read-only package identity/hygiene after the temporary Apache config is gone.
const root=path.resolve(import.meta.dirname,'../..');
const final=process.argv[2]==='--final';
assert.ok(process.argv.length===2||process.argv.length===3&&final,'Only optional --final is supported.');
async function files(directory,prefix=''){
  const result=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    assert.equal(entry.isSymbolicLink(),false,'Unexpected link in a source or delivery tree.');
    const relative=prefix+entry.name;
    if(entry.isDirectory())result.push(...await files(path.join(directory,entry.name),relative+'/'));
    else if(entry.isFile())result.push(relative);
  }
  return result.sort();
}
const sha=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const dist=path.join(root,'dist'),publicRoot=path.join(root,'hosting-build/public_html'),privateRoot=path.join(root,'hosting-build/sparowtype-private');
const build=JSON.parse(await readFile(path.join(dist,'offline-build.json'),'utf8'));
assert.equal(build.version,final?'5c8082579f9884ef34fc':'06321d4a7fe5350a2f16');assert.equal(build.publicFiles,94);assert.equal(build.bytes,final?2568212:2564259);
const packageBuild=JSON.parse(await readFile(path.join(publicRoot,'offline-build.json'),'utf8'));
assert.deepEqual(packageBuild,build);
const distFiles=await files(dist),publicFiles=await files(publicRoot),privateFiles=await files(privateRoot);
const distBytes=(await Promise.all(distFiles.map(file=>stat(path.join(dist,file))))).reduce((sum,item)=>sum+item.size,0);
const publicBytes=(await Promise.all(publicFiles.map(file=>stat(path.join(publicRoot,file))))).reduce((sum,item)=>sum+item.size,0);
assert.deepEqual(publicFiles,[...new Set([...distFiles,'.htaccess','api/.htaccess','api/index.php'])].sort(),'Public delivery contains a missing or stale file.');
for(const relative of distFiles)assert.equal(await sha(path.join(dist,relative)),await sha(path.join(publicRoot,relative)),`Public build source mismatch: ${relative}`);
const included=['src','bin','public','resources','bootstrap.php','config.example.php','schema.sql','UNICODE-LICENSE.txt','.htaccess'];
const expected=[];
for(const relative of included){
  if(['src','bin','public','resources'].includes(relative))expected.push(...(await files(path.join(root,'backend',relative))).map(file=>relative+'/'+file));
  else expected.push(relative);
}
assert.deepEqual(privateFiles,expected.sort(),'Private delivery contains missing, local or obsolete files.');
const identities=[];
for(const relative of privateFiles){
  const source=await sha(path.join(root,'backend',relative)),packaged=await sha(path.join(privateRoot,relative));
  assert.equal(packaged,source,`Private source mismatch: ${relative}`);identities.push({path:relative,sha256:source});
}
assert.equal(privateFiles.includes('config.php'),false);assert.equal(privateFiles.some(file=>file.startsWith('storage/')||file.startsWith('tests/')),false);
const sourceCatalog=await sha(path.join(root,'backend/resources/typing-course-v1.json'));
assert.equal(sourceCatalog,await sha(path.join(privateRoot,'resources/typing-course-v1.json')));
const apacheReceipt=final?'php-apache-hosting-final.json':'php-apache-hosting.json';
const apache=JSON.parse(await readFile(path.join(import.meta.dirname,apacheReceipt),'utf8'));
const course=JSON.parse(await readFile(path.join(import.meta.dirname,'php-course-apache.json'),'utf8'));
assert.equal(apache.build.version,build.version);assert.equal(apache.passed,20);assert.equal(apache.failed,0);
assert.equal(course.passed,10);assert.equal(course.failed,0);assert.equal(course.guardedTarget.database,'sparowtype_audit');assert.equal(course.guardedTarget.port,3308);
let backendHttpEvidenceStillApplicable=false,apachePid=26212;
if(final){
  const prior=JSON.parse(await readFile(path.join(import.meta.dirname,'php-hosting-hygiene.json'),'utf8'));
  assert.deepEqual(identities,prior.backendSourceIdentity,'Prior native course HTTP evidence requires unchanged backend/resource identities.');
  assert.equal(sourceCatalog,prior.catalogSha256);backendHttpEvidenceStillApplicable=true;
  const stopped=JSON.parse((await readFile(path.join(import.meta.dirname,'php-apache-runtime-final.json'),'utf8')).replace(/^\uFEFF/,''));
  assert.ok(stopped.gracefulShutdownSignalled&&stopped.listenerReleased&&stopped.ownedWorkersExited&&stopped.temporaryPrivateConfigRemoved&&!stopped.forcedTermination);
  apachePid=stopped.ownedApachePid;
}
const runtime=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  `$a=@(Get-NetTCPConnection -LocalPort 8091 -State Listen -ErrorAction SilentlyContinue);$b=@(Get-NetTCPConnection -LocalPort 8081 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique);$c=@(Get-NetTCPConnection -LocalPort 3308 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique);[pscustomobject]@{apacheStopped=($a.Count -eq 0);apiUnchanged=($b.Count -eq 1 -and $b[0] -eq ${final?19308:51416});databaseUnchanged=($c.Count -eq 1 -and $c[0] -eq 18028)}|ConvertTo-Json -Compress`],{encoding:'utf8',windowsHide:true});
assert.equal(runtime.status,0);const state=JSON.parse(runtime.stdout);assert.ok(state.apacheStopped&&state.apiUnchanged&&state.databaseUnchanged);
const report={date:new Date().toISOString(),build,freshPackage:true,publicFilesExactlyMatchDistPlusApiEntry:true,
  buildCountScope:'offline-build.json publicFiles/bytes describe the offline public-cache allowlist, not every distribution file',
  actualDistFiles:distFiles.length,actualDistBytes:distBytes,actualPublicPackageFiles:publicFiles.length,actualPublicPackageBytes:publicBytes,privateConfigPresent:false,privateStoragePresent:false,privateTestsPresent:false,staleAssetsPresent:false,
  backendFiles:identities.length,backendSourceIdentity:identities,catalogSha256:sourceCatalog,
  actualApacheSmoke:{receipt:apacheReceipt,passed:20,failed:0},actualCourseHttp:{receipt:'php-course-apache.json',passed:10,failed:0,database:'sparowtype_audit',port:3308,backendIdentityUnchangedConfirmation:backendHttpEvidenceStillApplicable},
  temporaryAuditConfigOutsideDocumentRoot:true,temporaryAuditConfigRemoved:true,ownedApachePid:apachePid,gracefulNamedEventShutdown:true,forcedTermination:false,
  runtime:{...state,apiRole:final?'restored main':'audit',apiPid:final?19308:51416},frontendRebuiltDuringPackaging:false,externalDeployment:false};
await writeFile(path.join(import.meta.dirname,final?'php-hosting-hygiene-final.json':'php-hosting-hygiene.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
