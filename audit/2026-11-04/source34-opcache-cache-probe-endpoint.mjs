import assert from 'node:assert/strict';
import path from 'node:path';

const literal = value => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
const forward = value => String(value).replaceAll('\\', '/');

function checked(configuration) {
  assert.ok(configuration && typeof configuration.root === 'string' && !/[\0\r\n]/.test(configuration.root));
  assert.match(configuration.id, /^[a-f0-9]{16}$/);
  assert.equal(configuration.cacheId, `sparow_audit_${configuration.id}`);
  assert.equal(Object.keys(configuration.rawHashes).length, 38);
  for (const [file, digest] of Object.entries(configuration.rawHashes)) {
    assert.match(file, /^backend\/[A-Za-z0-9_./-]+$/);
    assert.ok(!file.split('/').includes('..'));
    assert.match(digest, /^[a-f0-9]{64}$/);
  }
  return configuration;
}

function state(configuration, ownedIniSha, includeScripts) {
  const root = forward(configuration.root);
  const ownedIni = `${root}/backend/storage/pack-instance-${configuration.id}/php.ini`;
  return `
$probeCanonical=static function(string $value): string{return strtolower(rtrim(preg_replace('~/+~','/',str_replace('\\\\','/',$value)),'/'));};
$probeStatus=function_exists('opcache_get_status')?opcache_get_status(${includeScripts ? 'true' : 'false'}):false;
$probeConfiguration=function_exists('opcache_get_configuration')?opcache_get_configuration():false;
$probeDirectives=is_array($probeConfiguration)?($probeConfiguration['directives']??[]):[];
$probeStats=is_array($probeStatus)?($probeStatus['opcache_statistics']??[]):[];
$probeLoadedIni=php_ini_loaded_file();
$probeOwnedIniPathMatches=is_string($probeLoadedIni)&&$probeCanonical($probeLoadedIni)===$probeCanonical(${literal(ownedIni)});
$probeOwnedIniMatches=$probeOwnedIniPathMatches&&${ownedIniSha ? `hash_file('sha256',${literal(ownedIni)})===${literal(ownedIniSha)}` : 'false'};
$probeJit=(string)($probeDirectives['opcache.jit']??'');
$probeControls=[
 'webSapi'=>PHP_SAPI==='apache2handler',
 'ownedIniMatches'=>$probeOwnedIniMatches,
 'cacheEnabled'=>is_array($probeStatus)&&($probeStatus['opcache_enabled']??false)===true,
 'ownerCacheIsolationMatches'=>($probeDirectives['opcache.cache_id']??null)===${literal(configuration.cacheId)},
 'timestampValidationEnabled'=>($probeDirectives['opcache.validate_timestamps']??false)===true,
 'everyRequestRevalidation'=>($probeDirectives['opcache.revalidate_freq']??null)===0,
 'jitDisabled'=>in_array($probeJit,['disable','off','0',''],true)&&($probeDirectives['opcache.jit_buffer_size']??-1)===0&&!($probeStatus['jit']['on']??false),
];
`;
}

export function source(configuration, guard) {
  checked(configuration);
  assert.match(guard, /^[a-f0-9]{64}$/);
  const root = forward(configuration.root);
  const iniSha = configuration.publicProfile?.generatedOwnedIniSha256 ?? null;
  if (iniSha !== null) assert.match(iniSha, /^[a-f0-9]{64}$/);
  const expected = Object.entries(configuration.rawHashes).map(([file, digest]) => `${literal(file)}=>${literal(digest)}`).join(',');
  return `<?php
declare(strict_types=1);
if(PHP_SAPI!=='apache2handler'||($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1'||!hash_equals(${literal(guard)},$_SERVER['HTTP_X_SPAROW_PROFILE_GUARD']??'')){http_response_code(404);exit;}
header('Content-Type: application/json');header('Cache-Control: no-store');
${state(configuration, iniSha, true)}
$probeExpected=[${expected}];$probeBackendMatches=true;$probeBackendChecked=0;
foreach($probeExpected as $file=>$digest){$current=hash_file('sha256',${literal(root)}.'/'.$file);$probeBackendMatches=($current===$digest)&&$probeBackendMatches;$probeBackendChecked++;}
$probeScripts=is_array($probeStatus)?($probeStatus['scripts']??[]):[];
$probeBackendReal=realpath(${literal(`${root}/backend`)});
$probeBackendSpelling=$probeBackendReal===false?${literal(path.win32.join(configuration.root, 'backend'))}:$probeBackendReal;
$probeDescribe=static function(string $relative,string $fromBackend)use($probeExpected,$probeCanonical,$probeScripts,$probeBackendSpelling,$probeDirectives):array{
 $forward=${literal(root)}.'/'.$relative;$backslash=str_replace('/','\\\\',$forward);$real=realpath($forward);
 $mixed=$probeBackendSpelling.'/'.$fromBackend;
 $expectedCanonical=$probeCanonical($real===false?$forward:$real);
 $sourceExists=is_file($forward);$sourceReadable=is_readable($forward);
 $sourceHashMatches=$sourceExists&&$sourceReadable&&hash_file('sha256',$forward)===($probeExpected[$relative]??null);
 $mtime=$sourceExists?filemtime($forward):false;$size=$sourceExists?filesize($forward):false;
 $metadataMatch=false;$metadataAllMtimesMatch=true;$metadataMtimeObserved=false;$hitObserved=false;$hitCount=0;
 foreach($probeScripts as $key=>$entry){
  if(!is_array($entry))continue;$matches=false;
  foreach([$key,$entry['full_path']??null] as $cachedPath){
   if(!is_string($cachedPath))continue;
   $canonical=$probeCanonical($cachedPath);
   if($canonical===$expectedCanonical){$matches=true;break;}
   // Resolve only metadata spellings within the declared application root.
   if(str_starts_with($canonical,$probeCanonical(${literal(root)}).'/')){
    $resolved=realpath($cachedPath);
    if($resolved!==false&&$probeCanonical($resolved)===$expectedCanonical){$matches=true;break;}
   }
  }
  if(!$matches)continue;$metadataMatch=true;
  $timestamp=$entry['timestamp']??null;
  $observed=is_int($timestamp)&&$timestamp>0;$metadataMtimeObserved=$metadataMtimeObserved||$observed;
  $metadataAllMtimesMatch=$metadataAllMtimesMatch&&$observed&&$mtime!==false&&$timestamp===$mtime;
  if(is_int($entry['hits']??null)){$hitObserved=true;$hitCount=max($hitCount,$entry['hits']);}
 }
 $canLookup=function_exists('opcache_is_script_cached');
 $protection=$probeDirectives['opcache.file_update_protection']??null;$limit=$probeDirectives['opcache.max_file_size']??null;
 return [
  'lookupAvailable'=>$canLookup,
  'lookupForward'=>$canLookup?opcache_is_script_cached($forward):false,
  'lookupBackslash'=>$canLookup?opcache_is_script_cached($backslash):false,
  'lookupRealpath'=>$canLookup&&$real!==false?opcache_is_script_cached($real):false,
  'lookupExactBackendDirSpelling'=>$canLookup?opcache_is_script_cached($mixed):false,
  'metadataFullPathMatches'=>$metadataMatch,
  'metadataMtimeObserved'=>$metadataMtimeObserved,
  'metadataMtimeMatchesCurrent'=>$metadataMatch&&$metadataAllMtimesMatch,
  'metadataHitCountObserved'=>$hitObserved,'metadataHitCountMax'=>$hitCount,
  'sourceExists'=>$sourceExists,'sourceReadable'=>$sourceReadable,'sourceMtimeObserved'=>$mtime!==false,
  'sourceHashMatches'=>$sourceHashMatches,
  'realpathObserved'=>$real!==false,
  'fileAgeMeetsUpdateProtection'=>is_int($protection)&&$protection>=0&&$mtime!==false&&time()-$mtime>=$protection,
  'fileSizeWithinCacheLimit'=>is_int($limit)&&$limit>=0&&$size!==false&&($limit===0||$size<=$limit),
  'noBlacklistConfigured'=>($probeDirectives['opcache.blacklist_filename']??'')==='',
 ];
};
echo json_encode([
 'probeVersion'=>1,'controls'=>$probeControls,
 'ownedIniPathMatches'=>$probeOwnedIniPathMatches,
 'configurationAvailable'=>is_array($probeConfiguration),'statusAvailable'=>is_array($probeStatus),
 'cliDisabled'=>($probeDirectives['opcache.enable_cli']??true)===false,
 'backendFilesChecked'=>$probeBackendChecked,'backendSourceMatches'=>$probeBackendMatches,
 'cachedScripts'=>(int)($probeStats['num_cached_scripts']??0),'hits'=>(int)($probeStats['hits']??0),'misses'=>(int)($probeStats['misses']??0),
 'cacheFull'=>is_array($probeStatus)&&($probeStatus['cache_full']??false)===true,
 'restartPending'=>is_array($probeStatus)&&($probeStatus['restart_pending']??false)===true,
 'restartInProgress'=>is_array($probeStatus)&&($probeStatus['restart_in_progress']??false)===true,
 'scripts'=>[
  'applicationIndex'=>$probeDescribe('backend/public/index.php','public/index.php'),
  'validator'=>$probeDescribe('backend/src/SessionValidator.php','src/SessionValidator.php'),
  'arena'=>$probeDescribe('backend/src/ArenaEvidence.php','src/ArenaEvidence.php'),
 ],
],JSON_THROW_ON_ERROR);
`;
}

export function APIwrapperSource(configuration, ownedIniSha) {
  checked(configuration);
  assert.match(ownedIniSha, /^[a-f0-9]{64}$/);
  const root = forward(configuration.root);
  const expectedConfig = `${root}/backend/storage/pack-instance-${configuration.id}/app-config.php`;
  const originalRequire = forward(path.join(configuration.root, 'backend/public/index.php'));
  return `<?php
declare(strict_types=1);
${state(configuration, ownedIniSha, false)}
header('X-Sparow-Opcache-Probe: '.base64_encode(json_encode($probeControls,JSON_THROW_ON_ERROR)));
if(PHP_SAPI!=='apache2handler'||($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1'||$probeCanonical((string)getenv('SPAROWTYPE_CONFIG_FILE'))!==$probeCanonical(${literal(expectedConfig)})){http_response_code(503);echo '{"error":"owned-probe-context-required"}';exit;}
require ${literal(originalRequire)};
`;
}
