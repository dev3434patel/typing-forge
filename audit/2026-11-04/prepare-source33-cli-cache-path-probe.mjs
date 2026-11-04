import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=process.cwd(), folder=path.join(root,'audit/2026-11-04');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const literal=value=>`'${String(value).replaceAll('\\','\\\\').replaceAll("'","\\'")}'`;
const manifest=JSON.parse(await readFile(path.join(root,'audit/2026-11-02/final33-source.json'),'utf8'));
const validator=path.join(root,'backend/src/SessionValidator.php'), bytes=await readFile(validator);
assert.equal(sha(bytes.toString('utf8').replaceAll('\r\n','\n')),manifest.sourceHashes['backend/src/SessionValidator.php']);
const extension='C:/xampp/php/ext/php_opcache.dll';
assert.equal(sha(await readFile(extension)),'4530ffcf2c16c9fb3b97b45360302c787d5fbcb248492f80d35407f63ccff76e');
const php=`<?php
declare(strict_types=1);
$backend=${literal(path.join(root,'backend'))};
$forward=str_replace('\\\\','/',$backend).'/src/SessionValidator.php';
$backslash=str_replace('/','\\\\',$forward);
$mixed=$backend.'/src/SessionValidator.php';
$resolved=realpath($forward);
require_once $mixed;
$status=opcache_get_status(true);$stats=is_array($status)?($status['opcache_statistics']??[]):[];
$normalize=static function(string $value):string{return strtolower(str_replace('\\\\','/',realpath($value)?:$value));};
$matched=0;$metadataHits=0;$currentSource=false;$metadataTimestampMatches=false;
foreach(($status['scripts']??[]) as $key=>$entry){
 if($normalize((string)$key)!==$normalize($forward)){continue;}
 $matched++;$metadataHits+=(int)($entry['hits']??0);
 $currentSource=hash_file('sha256',(string)$key)===${literal(sha(bytes))};
 $metadataTimestampMatches=(int)($entry['timestamp']??0)===(int)filemtime($forward);
}
echo json_encode([
 'diagnosticCliOnly'=>true,'webRuntimeProven'=>false,'classLoaded'=>class_exists('SparowType\\\\SessionValidator',false),
 'cacheEnabled'=>is_array($status)&&($status['opcache_enabled']??false)===true,
 'queries'=>['forward'=>opcache_is_script_cached($forward),'backslash'=>opcache_is_script_cached($backslash),'mixedAutoloader'=>opcache_is_script_cached($mixed),'realpath'=>is_string($resolved)&&opcache_is_script_cached($resolved)],
 'metadata'=>['canonicalFullPathMatches'=>$matched,'currentFrozenSourceMatches'=>$currentSource,'timestampMatches'=>$metadataTimestampMatches,'hits'=>$metadataHits],
 'cachedScripts'=>(int)($stats['num_cached_scripts']??0),'hits'=>(int)($stats['hits']??0),'misses'=>(int)($stats['misses']??0)
],JSON_THROW_ON_ERROR);
`;
const phpRelative='audit/2026-11-04/source33-cli-cache-path-probe.php';
const iniRelative='audit/2026-11-04/source33-cli-cache-path-probe.ini';
const ini=`zend_extension="${extension}"\nopcache.enable=1\nopcache.enable_cli=1\nopcache.validate_timestamps=1\nopcache.revalidate_freq=0\nopcache.jit=disable\nopcache.jit_buffer_size=0\nopcache.cache_id=sparow_source33_cli_path_diagnostic\n`;
await writeFile(path.join(root,phpRelative),php,{flag:'wx'});
await writeFile(path.join(root,iniRelative),ini,{flag:'wx'});
const syntax=spawnSync('C:/xampp/php/php.exe',['-n','-l',path.join(root,phpRelative)],{encoding:'utf8'});
assert.equal(syntax.status,0,syntax.stderr||syntax.stdout);
const preparation={recordedAt:new Date().toISOString(),kind:'source33-cli-path-identity-diagnostic-only',runYet:false,noDatabaseOrServices:true,noBootstrapOrForcedCompilation:true,webRuntimeProof:false,syntaxPassed:true,files:{[phpRelative]:sha(php),[iniRelative]:sha(ini)},frozenValidatorRawSha256:sha(bytes),command:['C:/xampp/php/php.exe','-c',iniRelative,phpRelative],estimatedSeconds:1};
await writeFile(path.join(folder,'source33-cli-cache-path-probe-preparation.json'),JSON.stringify(preparation,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(preparation));
