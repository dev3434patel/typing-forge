// Explicit syntax-only gate. Never starts HTTP/SQL or reads an existing config.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APACHE_BINARY, prepareApache } from './pack-apache-runtime.mjs';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
assert.equal(process.env.SPAROWTYPE_PACK_APACHE_SYNTAX_ACCEPTANCE,'1','Wait for the coordinated pure-gate STOP, then allow syntax only explicitly.');
const root=path.resolve(fileURLToPath(new URL('../..',import.meta.url))),id=randomBytes(8).toString('hex');
const storage=path.join(root,'backend/storage'),owned=path.join(storage,`pack-instance-${id}`),logs=path.join(owned,'logs');
const phpDirectory=path.dirname(phpRuntime().binary),checks=[];let failure=null,retained=false;
await mkdir(storage,{recursive:true});await mkdir(owned,{recursive:false});await mkdir(logs);
await writeFile(path.join(owned,'ownership.json'),JSON.stringify({id,runnerPid:process.pid,root,syntaxOnly:true}));
try{
 const listener=net.createServer();await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',resolve);});const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 const appConfig=path.join(owned,'syntax-only-config.php');await writeFile(appConfig,'<?php return [];\n');
 await mkdir(path.join(owned,'php-empty-scan'));
 await writeFile(path.join(owned,'php.ini'),`extension_dir="${phpDirectory.replaceAll('\\','/')}/ext"\nextension=intl\nextension=mbstring\nextension=pdo_mysql\ndate.timezone=UTC\ndisplay_errors=Off\nlog_errors=On\nerror_log="${path.join(logs,'php.log').replaceAll('\\','/')}"\n`);
 const state=await prepareApache({owned,root,privateLogs:logs,appConfig,phpDirectory,port});
 const pathKey=Object.keys(process.env).find(key=>key.toLowerCase()==='path')??'Path';
 const env={...process.env,[pathKey]:`${phpDirectory};${process.env[pathKey]??''}`,PHPRC:path.join(owned,'php.ini'),PHP_INI_SCAN_DIR:path.join(owned,'php-empty-scan')};
 const apache=spawnSync(APACHE_BINARY,['-t','-f',state.configFile],{env,cwd:owned,encoding:'utf8',windowsHide:true,timeout:20000});
 await writeFile(path.join(logs,'syntax.log'),`${apache.stdout??''}\n${apache.stderr??''}`);
 assert.equal(apache.status,0,'Private Apache syntax failed; diagnostics retained only in the owned directory.');checks.push('private Apache configuration parses with the installed thread-safe PHP module');
 const parser=path.join(owned,'parse-only.ps1');await writeFile(parser,`param([string]$Source)\n$tokens=$null;$parseErrors=$null;[void][System.Management.Automation.Language.Parser]::ParseFile($Source,[ref]$tokens,[ref]$parseErrors);if($parseErrors.Count){$parseErrors|ForEach-Object {Write-Error $_.Message};exit 1}\n`);
 const parsed=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',parser,'-Source',state.controlFile],{encoding:'utf8',windowsHide:true,timeout:20000});
 await writeFile(path.join(logs,'control-parse.log'),`${parsed.stdout??''}\n${parsed.stderr??''}`);
 assert.equal(parsed.status,0,'Owned PID/control guard syntax failed; diagnostics retained privately.');checks.push('PowerShell control helper parses without executing any process inspection or shutdown operation');
}catch(error){failure=error.message;process.exitCode=1;retained=true;}
finally{
 const actual=await realpath(owned),base=await realpath(storage);assert.equal(path.dirname(actual).toLowerCase(),base.toLowerCase());assert.equal(path.basename(actual),`pack-instance-${id}`);const marker=JSON.parse(await readFile(path.join(actual,'ownership.json'),'utf8'));assert.equal(marker.id,id);assert.equal(marker.runnerPid,process.pid);
 if(!retained)await rm(actual,{recursive:true,force:false});
 const report={status:failure?'FAIL':'PASS',at:new Date().toISOString(),checks,passed:checks.length,failed:failure?1:0,failure,serverStarted:false,databaseConnected:false,existingConfigRead:false,serviceInstalled:false,ownTemporaryDirectoryRemoved:!retained,privateDiagnosticsDirectory:retained?actual:undefined};
 const target=path.join(root,`audit/2026-10-21/pack-apache-syntax-${id}.json`);await writeFile(target,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,reportPath:target}));
}
