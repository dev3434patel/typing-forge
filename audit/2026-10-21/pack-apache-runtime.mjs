// Audit-only Windows Apache adapter. No existing config/service is opened.
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, stat, writeFile } from 'node:fs/promises';
export const APACHE_ROOT = 'C:/xampp/apache';
export const APACHE_BINARY = `${APACHE_ROOT}/bin/httpd.exe`;
export const APACHE_THREADS = 64;
const forward = value => value.replaceAll('\\', '/');
function quoted(value) { assert.ok(!/["\r\n]/.test(value)); return `"${forward(value)}"`; }
function phpLiteral(value) { return `'${forward(value).replaceAll("'", "\\'")}'`; }

// -k shutdown is deliberately absent: Windows can resolve an installed service
// before reading -f. The exact owned parent is signalled by its private PID event.
const controlSource = String.raw`param(
 [ValidateSet('inspect','graceful','force')][string]$Operation,
 [int]$ExpectedPid,[int]$RunnerPid,[string]$Owned,[string]$ConfigFile,[string]$PidFile,[string]$Executable
)
$ErrorActionPreference='Stop'
$normalized={param($value) [IO.Path]::GetFullPath($value).Replace('\','/').TrimEnd('/').ToLowerInvariant()}
$ownedPath=&$normalized $Owned
$directoryMatch=[regex]::Match([IO.Path]::GetFileName($ownedPath),'^pack-instance-([a-f0-9]{16})$')
if( -not $directoryMatch.Success){throw 'owned-directory-identity'}
$marker=Get-Content -LiteralPath (Join-Path $Owned 'ownership.json') -Raw|ConvertFrom-Json
if($marker.runnerPid -ne $RunnerPid -or $marker.id -ne $directoryMatch.Groups[1].Value){throw 'owned-marker-identity'}
if((&$normalized ([IO.Path]::GetDirectoryName($Owned))) -ne (&$normalized (Join-Path $marker.root 'backend/storage'))){throw 'owned-workspace-storage'}
if((&$normalized ([IO.Path]::GetDirectoryName($ConfigFile))) -ne $ownedPath){throw 'owned-apache-config'}
if((&$normalized ([IO.Path]::GetDirectoryName($PidFile))) -ne $ownedPath){throw 'owned-apache-pidfile'}
$exePath=&$normalized $Executable
$confPath=&$normalized $ConfigFile
$all=@(Get-CimInstance Win32_Process -Filter "Name='httpd.exe'")
$matchesConfig={param($candidate)
 $candidate -and $candidate.ExecutablePath -and $candidate.CommandLine -and 
 ((&$normalized $candidate.ExecutablePath) -eq $exePath) -and 
 ($candidate.CommandLine.Replace('\','/').ToLowerInvariant().Contains($confPath))
}
$parent=@($all|Where-Object {$_.ProcessId -eq $ExpectedPid})
if($parent.Count -gt 0 -and ( -not (&$matchesConfig $parent[0]) -or $parent[0].ParentProcessId -ne $RunnerPid)){throw 'owned-apache-parent-mismatch'}
$directChildren=@($all|Where-Object {$_.ParentProcessId -eq $ExpectedPid})
$children=@($directChildren|Where-Object {(&$matchesConfig $_)})
$unverifiedChildren=@($directChildren|Where-Object { -not (&$matchesConfig $_)})
$processes=@($parent)+@($directChildren)
if($Operation -eq 'graceful'){
 if($parent.Count -ne 1){throw 'owned-apache-parent-unavailable'}
 if( -not (Test-Path -LiteralPath $PidFile) -or [int](Get-Content -LiteralPath $PidFile -Raw).Trim() -ne $ExpectedPid){throw 'owned-apache-pidfile-mismatch'}
 Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class SparowOwnedApacheEvent {
 [DllImport("kernel32.dll",SetLastError=true,CharSet=CharSet.Unicode)] public static extern IntPtr OpenEvent(uint access,bool inherit,string name);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool SetEvent(IntPtr handle);
 [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);
}
'@
 $handle=[SparowOwnedApacheEvent]::OpenEvent(2,$false,('ap'+$ExpectedPid+'_shutdown'))
 if($handle -eq [IntPtr]::Zero){throw 'owned-apache-shutdown-event-unavailable'}
 try{if( -not [SparowOwnedApacheEvent]::SetEvent($handle)){throw 'owned-apache-shutdown-event-failed'}}finally{[void][SparowOwnedApacheEvent]::CloseHandle($handle)}
}
if($Operation -eq 'force'){
 # Only exact config/executable/parent-chain matches collected above may stop.
 foreach($candidate in @($children)+@($parent)){
  $current=Get-CimInstance Win32_Process -Filter ('ProcessId='+$candidate.ProcessId)
  if($current -and $current.CreationDate -eq $candidate.CreationDate -and (&$matchesConfig $current)){Stop-Process -Id $candidate.ProcessId -Force -ErrorAction Stop}
 }
}
[pscustomobject]@{operation=$Operation;parentFound=($parent.Count -eq 1);pids=@($processes|ForEach-Object {[int]$_.ProcessId});unverifiedChildPids=@($unverifiedChildren|ForEach-Object {[int]$_.ProcessId});parentPid=$ExpectedPid;guarded=$true}|ConvertTo-Json -Compress
`;

export async function prepareApache({ owned, root, privateLogs, appConfig, phpDirectory, port }) {
  assert.match(path.basename(owned), /^pack-instance-[a-f0-9]{16}$/);
  assert.ok(Number.isInteger(port) && port > 1024 && ![3306,3307,3308,8081,4173].includes(port));
  for (const name of ['authz_core','mime','dir','env']) await stat(`${APACHE_ROOT}/modules/mod_${name}.so`);
  await stat(APACHE_BINARY); await stat(path.join(phpDirectory,'php8apache2_4.dll')); await stat(path.join(phpDirectory,'php8ts.dll'));
  const webRoot=path.join(owned,'apache-public'),configFile=path.join(owned,'apache-audit.conf'),pidFile=path.join(owned,'apache.pid'),controlFile=path.join(owned,'apache-control.ps1');
  await mkdir(webRoot,{recursive:false});
  await writeFile(path.join(webRoot,'index.php'),`<?php\ndeclare(strict_types=1);\nrequire ${phpLiteral(path.join(root,'backend/public/index.php'))};\n`);
  // Loopback-only readiness checks validate the SAPI/ini/config identity before
  // any synthetic fixture is provisioned through HTTP. No secret is returned.
  await writeFile(path.join(webRoot,'__audit-runtime.php'),`<?php\nheader('Content-Type: application/json'); echo json_encode(['sapi'=>PHP_SAPI,'threadSafe'=>PHP_ZTS===1,'pid'=>getmypid(),'ini'=>php_ini_loaded_file(),'config'=>getenv('SPAROWTYPE_CONFIG_FILE')]);\n`);
  await writeFile(path.join(owned,'audit.mime.types'),'application/json json\ntext/plain txt\n');
  await writeFile(controlFile,controlSource);
  const config=`ServerRoot ${quoted(owned)}
DefaultRuntimeDir ${quoted(owned)}
ServerName 127.0.0.1:${port}
Listen 127.0.0.1:${port}
PidFile ${quoted(pidFile)}
ErrorLog ${quoted(path.join(privateLogs,'apache-errors.log'))}
LogLevel warn
ServerTokens Prod
ServerSignature Off
LoadModule authz_core_module ${quoted(`${APACHE_ROOT}/modules/mod_authz_core.so`)}
LoadModule mime_module ${quoted(`${APACHE_ROOT}/modules/mod_mime.so`)}
LoadModule dir_module ${quoted(`${APACHE_ROOT}/modules/mod_dir.so`)}
LoadModule env_module ${quoted(`${APACHE_ROOT}/modules/mod_env.so`)}
LoadModule php_module ${quoted(path.join(phpDirectory,'php8apache2_4.dll'))}
PHPIniDir ${quoted(owned)}
TypesConfig ${quoted(path.join(owned,'audit.mime.types'))}
DocumentRoot ${quoted(webRoot)}
ThreadLimit ${APACHE_THREADS}
ThreadsPerChild ${APACHE_THREADS}
MaxConnectionsPerChild 0
Timeout 30
KeepAlive On
MaxKeepAliveRequests 100
KeepAliveTimeout 2
EnableSendfile Off
SetEnv SPAROWTYPE_CONFIG_FILE ${quoted(appConfig)}
<Directory />
 Require all denied
 AllowOverride None
</Directory>
<Directory ${quoted(webRoot)}>
 Require all granted
 AllowOverride None
 Options None
 DirectoryIndex index.php
 FallbackResource /index.php
</Directory>
<FilesMatch "\\.php$">
 SetHandler application/x-httpd-php
</FilesMatch>
`;
  await writeFile(configFile,config);
  return {configFile,pidFile,controlFile,webRoot,threads:APACHE_THREADS};
}

export function apacheControlArguments(operation, state, expectedPid, runnerPid, owned) {
  assert.ok(['inspect','graceful','force'].includes(operation));
  assert.ok(Number.isInteger(expectedPid)&&expectedPid>0&&Number.isInteger(runnerPid)&&runnerPid>0);
  return ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',state.controlFile,'-Operation',operation,'-ExpectedPid',String(expectedPid),'-RunnerPid',String(runnerPid),'-Owned',owned,'-ConfigFile',state.configFile,'-PidFile',state.pidFile,'-Executable',APACHE_BINARY];
}
