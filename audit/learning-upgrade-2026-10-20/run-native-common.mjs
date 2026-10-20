import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Explicit coordinator-authorized audit-only regression confirmation. Existing
// lifecycle fixtures may reset rate counters only in this guarded audit DB.
const here=import.meta.dirname,root=path.resolve(here,'../..');
const config=path.join(root,'backend/audit-config.local.php');
const env={...process.env,SPAROWTYPE_CONFIG_FILE:config,SPAROWTYPE_TEST_API_URL:'http://127.0.0.1:8081/api'};
const runtime=phpRuntime();
const observed=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  '$ids=@(Get-NetTCPConnection -LocalPort 8081 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique);if($ids.Count -ne 1 -or $ids[0] -ne 51416){throw "Unexpected audit API listener."};$p=Get-CimInstance Win32_Process -Filter "ProcessId = 51416";$p|Select-Object ProcessId,ExecutablePath,CommandLine|ConvertTo-Json -Compress'],{encoding:'utf8',windowsHide:true});
assert.equal(observed.status,0,'Audit API process identity guard failed. No acceptance suite started.');
const api=JSON.parse(observed.stdout);
assert.equal(api.ExecutablePath.replaceAll('\\','/').toLowerCase(),'c:/xampp/php/php.exe');
assert.ok(api.CommandLine.endsWith('-S 127.0.0.1:8081 -t backend/public backend/router.php'));
const target=spawnSync(runtime.binary,[...runtime.args,path.join(root,'backend/tests/course-fixture.php')],{cwd:root,env,input:JSON.stringify({run:'aaaaaaaaaa',operation:'guard'}),encoding:'utf8',windowsHide:true});
assert.equal(target.status,0,'Dedicated audit configuration guard failed. No acceptance suite started.');
const identity=JSON.parse(target.stdout);assert.equal(identity.database,'sparowtype_audit');assert.equal(identity.port,3308);
const session=await fetch('http://127.0.0.1:8081/api/auth/session',{signal:AbortSignal.timeout(10_000)});
assert.equal(session.status,200);const state=await session.json();assert.equal(state.user,null);
assert.ok(session.headers.getSetCookie().some(value=>value.startsWith(`${identity.sessionName}=`)),'API session namespace differs from the explicit dedicated audit config.');
const guard={date:new Date().toISOString(),apiPid:51416,api:'http://127.0.0.1:8081/api',database:identity.database,port:identity.port,
  explicitConfig:'backend/audit-config.local.php',sessionNamespaceMatched:true,mainDatabaseTouched:false,
  permittedRateResetScope:'Only the dedicated audit database existing lifecycle fixtures; authorized after root auth journeys ended.'};
await writeFile(path.join(here,'php-common-api-guard.json'),JSON.stringify(guard,null,2)+'\n');
console.log(JSON.stringify(guard));
const results=[];
for(const [label,file,expected] of [['data','data-lifecycle.mjs',15],['race','race-lifecycle.mjs',10]]){
  const startedAt=new Date().toISOString(),reportPath=path.join(here,`php-${label}-lifecycle-common-final.json`);
  const run=spawnSync(process.execPath,['--experimental-transform-types',path.join(root,'backend/tests',file)],{cwd:root,env:{...env,SPAROWTYPE_TEST_REPORT:reportPath},encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024,timeout:180_000});
  assert.equal(run.status,0,`Native ${label} acceptance exited unsuccessfully; private raw diagnostics were not emitted.`);
  const report=JSON.parse(run.stdout.trim());
  assert.equal(report.checks.length,expected,`Native ${label} group count differs from the intended suite.`);
  assert.ok(report.checks.every(check=>check.status==='PASS'));
  if(label==='race'){assert.equal(report.failedStage,null);assert.equal(report.error,null);}
  else assert.equal(report.failed,0);
  await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
  const record={suite:label,startedAt,finishedAt:new Date().toISOString(),exitCode:run.status,passedGroups:report.checks.length,expectedGroups:expected,report:path.basename(reportPath)};
  results.push(record);console.log(JSON.stringify(record));
}
const hashes={};for(const file of ['SessionValidator.php','CourseAssessment.php','DataService.php','RaceService.php','Security.php','AuthService.php'])hashes[`backend/src/${file}`]=createHash('sha256').update(await readFile(path.join(root,'backend/src',file))).digest('hex');
await writeFile(path.join(here,'php-common-lifecycle-process.json'),JSON.stringify({date:new Date().toISOString(),guardReceipt:'php-common-api-guard.json',suites:results,sourceHashes:hashes,apiLeftRunning:true,apiPid:51416,mainDatabaseTouched:false,credentialsOrIdentifiersEmitted:false},null,2)+'\n');
