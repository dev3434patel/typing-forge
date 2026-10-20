import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Verifies a coordinator-restored main runner. It does not start/stop services
// or access account, result, preference, ranking or race endpoints.
const root=path.resolve(import.meta.dirname,'../..');
const runtime=phpRuntime();
const inspected=spawnSync(runtime.binary,[...runtime.args,'-r',
  '$m=require $argv[1];$a=require $argv[2];$g=is_file($argv[1])&&!is_link($argv[1])&&($m["database"]["name"]??null)==="sparowtype"&&($m["database"]["host"]??null)==="127.0.0.1"&&(int)($m["database"]["port"]??0)===3308&&($m["session_name"]??null)!==($a["session_name"]??null);if(!$g)throw new RuntimeException("Main configuration guard failed.");echo json_encode(["mainCookie"=>$m["session_name"],"auditCookie"=>$a["session_name"],"mainTargetGuard"=>$g]);',
  path.join(root,'backend/config.php'),path.join(root,'backend/audit-config.local.php')],{encoding:'utf8',windowsHide:true});
assert.equal(inspected.status,0,'Main private configuration guard failed; private diagnostics suppressed.');
const names=JSON.parse(inspected.stdout);
const processes=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  '$rows=@(Get-NetTCPConnection -LocalPort 8081,3308,4173 -State Listen | Select-Object LocalPort,OwningProcess);$ids=@($rows|Where-Object LocalPort -eq 8081|Select-Object -ExpandProperty OwningProcess -Unique);if($ids.Count -ne 1){throw "Unexpected API listener."};$api=Get-CimInstance Win32_Process -Filter "ProcessId = $($ids[0])";[pscustomobject]@{rows=$rows;api=$api|Select-Object ProcessId,ExecutablePath,CommandLine}|ConvertTo-Json -Compress -Depth 5'],{encoding:'utf8',windowsHide:true});
assert.equal(processes.status,0,'Runtime listener guard failed.');
const observed=JSON.parse(processes.stdout);
assert.notEqual(observed.api.ProcessId,51416);assert.equal(observed.api.ExecutablePath.replaceAll('\\','/').toLowerCase(),'c:/xampp/php/php.exe');
assert.ok(observed.api.CommandLine.endsWith('-S 127.0.0.1:8081 -t backend/public backend/router.php'));
for(const [port,id]of[[3308,18028],[4173,54056]])assert.deepEqual([...new Set(observed.rows.filter(row=>row.LocalPort===port).map(row=>row.OwningProcess))],[id]);
const healthResponse=await fetch('http://127.0.0.1:8081/api/health',{signal:AbortSignal.timeout(10_000)});
assert.equal(healthResponse.status,200);const health=await healthResponse.json();
assert.deepEqual(health,{ok:true,backend:'php-mysql',schemaVersion:1});
assert.match(healthResponse.headers.get('cache-control'),/no-store/);
const cookies=healthResponse.headers.getSetCookie();
assert.ok(cookies.some(value=>value.startsWith(`${names.mainCookie}=`)));
assert.ok(cookies.every(value=>!value.startsWith(`${names.auditCookie}=`)));
assert.ok(cookies.some(value=>/HttpOnly/i.test(value)&&/SameSite=Lax/i.test(value)));
const local=JSON.parse(await readFile(path.join(root,'dist/offline-build.json'),'utf8'));
const servedResponse=await fetch('http://127.0.0.1:4173/offline-build.json',{signal:AbortSignal.timeout(10_000)});
assert.equal(servedResponse.status,200);const served=await servedResponse.json();assert.deepEqual(served,local);
assert.equal(served.version,'5d2ecc48d9040a77492b');
const report={date:new Date().toISOString(),previousAuditApiPid:51416,previousAuditRunnerExec:60796,
  previousOwnedRunnerStoppedByConsoleInterrupt:true,forcedTermination:false,newMainApiPid:observed.api.ProcessId,ownedMainRunnerExec:81729,
  api:'http://127.0.0.1:8081/api',explicitPrivateMainConfig:'backend/config.php',mainConfigTargetGuard:names.mainTargetGuard,
  auditConfigEnvironmentReplacedByExplicitMainConfig:true,auditAcceptanceEnvironmentFlagsRemoved:true,
  mainCookieNamespaceMatched:true,auditCookieNamespaceNotEmitted:true,httpOnlySameSiteLax:true,healthNoStore:true,health,
  servedBuild:served,localAndServedBuildMatch:true,databasePidRetained:18028,databasePort:3308,previewPidRetained:54056,previewPort:4173,
  accountResultOrPreferenceEndpointsRequested:false,mainAccountOrResultDataReadOrWritten:false,
  verificationScope:'Private config/process guards, one guest GET /health and public static build metadata. The health request can create normal session/rate-limit operational evidence; no account/history data was queried.',
  credentialsCookieValuesOrAccountIdentifiersEmitted:false,apiLeftRunningOnMain:true,frontendBuiltOrBrowserJobsRun:false};
await writeFile(path.join(import.meta.dirname,'api-main-restored.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
