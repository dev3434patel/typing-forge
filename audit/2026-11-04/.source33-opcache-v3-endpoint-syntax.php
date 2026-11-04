<?php
declare(strict_types=1);
if(PHP_SAPI!=='apache2handler'||($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1'||!hash_equals('0000000000000000000000000000000000000000000000000000000000000000',$_SERVER['HTTP_X_SPAROW_PROFILE_GUARD']??'')){http_response_code(404);exit;}
header('Content-Type: application/json');header('Cache-Control: no-store');

$probeCanonical=static function(string $value): string{return strtolower(rtrim(preg_replace('~/+~','/',str_replace('\\','/',$value)),'/'));};
$probeStatus=function_exists('opcache_get_status')?opcache_get_status(true):false;
$probeConfiguration=function_exists('opcache_get_configuration')?opcache_get_configuration():false;
$probeDirectives=is_array($probeConfiguration)?($probeConfiguration['directives']??[]):[];
$probeStats=is_array($probeStatus)?($probeStatus['opcache_statistics']??[]):[];
$probeLoadedIni=php_ini_loaded_file();
$probeOwnedIniPathMatches=is_string($probeLoadedIni)&&$probeCanonical($probeLoadedIni)===$probeCanonical('D:/extra/typing_updated/typing-forge/backend/storage/pack-instance-0000000000000000/php.ini');
$probeOwnedIniMatches=$probeOwnedIniPathMatches&&hash_file('sha256','D:/extra/typing_updated/typing-forge/backend/storage/pack-instance-0000000000000000/php.ini')==='0000000000000000000000000000000000000000000000000000000000000000';
$probeJit=(string)($probeDirectives['opcache.jit']??'');
$probeControls=[
 'webSapi'=>PHP_SAPI==='apache2handler',
 'ownedIniMatches'=>$probeOwnedIniMatches,
 'cacheEnabled'=>is_array($probeStatus)&&($probeStatus['opcache_enabled']??false)===true,
 'ownerCacheIsolationMatches'=>($probeDirectives['opcache.cache_id']??null)==='sparow_audit_0000000000000000',
 'timestampValidationEnabled'=>($probeDirectives['opcache.validate_timestamps']??false)===true,
 'everyRequestRevalidation'=>($probeDirectives['opcache.revalidate_freq']??null)===0,
 'jitDisabled'=>in_array($probeJit,['disable','off','0',''],true)&&($probeDirectives['opcache.jit_buffer_size']??-1)===0&&!($probeStatus['jit']['on']??false),
];

$probeExpected=['backend/bin/cleanup.php'=>'176b43c8f229c587b56792e7d2f285f4c3df8c906434da4f5c4659d1f7226324','backend/bin/install-schema.php'=>'77b17d597952fefbb75cad7eae67f1ae552367faf38e738e875cf00b0f0eef63','backend/bin/migrate-schema.php'=>'29b57b5be80cf2d14aad1173283d1431fc16ef98208d7f5f7c2d307e434d07ae','backend/bootstrap.php'=>'1437ca997a919b7a64669dc09690f62cff9cd627626549e06a1c6d9e3482d647','backend/migrations/002-progression.sql'=>'2d49893fdc8c8f0dc626e4122b7803fee72d1327483ed55dcb2257b07d7f0427','backend/migrations/003_classroom.sql'=>'16d6330ef81c69dbc71fc6e5b8790b5ea03ab9ab9eaf6ace368b3e1dfa164aca','backend/migrations/004_social.sql'=>'f4756041284b3ab373dd0fdb7d432847d98b8e1ffd8c404344308ade8e18afaa','backend/migrations/005_arena.sql'=>'b61df52810f8e3958a81fdb5947a9b747e29041094b755c8a12161b5182f7301','backend/public/.htaccess'=>'f00f2c3074167570ec0ebd65c3cd6bf29667be5bb2e6adf554ef0665124acf01','backend/public/index.php'=>'92382a84ac652b38198711bc86973245a6a6dbc4af0aeaefb796ee0267618d76','backend/resources/progression-fingers-v1.json'=>'925af6e6bfd28d7fa544d8f3547c61994f332b7b86fc598cea742cae999bc2b9','backend/resources/typing-course-v1.json'=>'fc4dd602a730f0916b5fb214d7ffcf8efb5b6907e06894ba00e489f61ef6cb39','backend/router.php'=>'64da7e7d094b6278b4cda3e9590c3e4fb1311ab4050bd1bb0f23284ff535b199','backend/schema.sql'=>'0223553c2e8bec1504483dc59c41bfe26518891ae475262a81c59b86208b9f3a','backend/src/ApiException.php'=>'4f231b2c8e2d00716dae49763f7664a4d56430f885b1d58c40892e6a5417ccb9','backend/src/ArenaEvidence.php'=>'124e13503049a2dd53bc2d04758b66aadcb4f613da1a4894ecfcb9285c74f888','backend/src/ArenaRules.php'=>'abb6f4c82a699e353354efd3600f7c9c8330a8df72a9b290702c5e4cfcf20353','backend/src/ArenaService.php'=>'9008825c59bdcfd863b714f45412638082043eae56a1000b70a134de67919a6d','backend/src/AuthService.php'=>'c2790aa548136a0fee00dc0c32bb4ec2be6b3d0a033f2cfd5992f79442991efd','backend/src/ChallengeTimingPolicy.php'=>'75faf3a12fabb0949400bcade2ba1d36ddb2e5a22f061dd35a4d82e216f1786a','backend/src/ClassroomService.php'=>'35f957a5ed3f6eb7f11a95aaa2a36fd32c1530efa55760cf827e048f5ff11bab','backend/src/CompetitiveInputPolicy.php'=>'4f33803bab70e09ebc5b304ea41c5e2433f7ed080ef5a1a43f97deb640cd5a23','backend/src/CourseAssessment.php'=>'224f3b3ca7192089ff04027a9e8411573565a1e3bc2e3b1180b509e72bfe1795','backend/src/DataService.php'=>'46269db8b3dcb2a3e649c2744697b459ac33bdea86ba47607cd32fe278809fa9','backend/src/Database.php'=>'38e67995661448fb80af94ae81acc2fc844b5ecea15c6313d6fc87135681acb0','backend/src/ProgressionCalendar.php'=>'ce871c6f94b8cd64ae518a01704adc18e4d794a6dce1cf54afcfab30234182c3','backend/src/ProgressionEngine.php'=>'7d23f85d02dce2a02e9915e8beab417bbcba74557c22048e18d6aabe7076a361','backend/src/ProgressionFacts.php'=>'5ae32fd3943fdbd6bb31e7e8996c1118bc2f8fe3c2ca9c2d12dddfa2663a62b3','backend/src/ProgressionQuests.php'=>'897cc73353576a8ea8f0f194fe2df44c6de420638fb11c8ff77d79add5af5602','backend/src/ProgressionService.php'=>'758f20333d46c929fbf57689fc7068d659eeee6a2eebec5895ab2e87d370ff26','backend/src/RaceService.php'=>'984a5b4ceea0887739c70d743f61c321bd0a8dd86e3b63e46c7ecbd60eb10b2d','backend/src/RaceStream.php'=>'3249970663b7ebcde1f4e23c82bff1a7db0422b0b33843b6a13dfd9020d4c05d','backend/src/RequestBody.php'=>'0857c88cd3895facb3c5d5076e1dc0f7654942e5510be0a1b5739c20989d2fba','backend/src/Security.php'=>'671d4e7944cfbe7d4a6d94e44e17374caa12c8c8f8c33bd850ceedba371e0401','backend/src/SessionValidator.php'=>'966a43ced6eee00224a56a6c4e775996d83e0ac45cc8125be7398f9d6ef73bbc','backend/src/SocialDuelRules.php'=>'7b8889819e9eb10f402b0adc44f2bfbe0d2e356218eb9ec0b2de95ce5d46179f','backend/src/SocialService.php'=>'8250bafc44ce0231f9b414395ea8581199d62777366da437ba7883630d894940','backend/src/UnicodeGraphemes.php'=>'091cd87cf485b87aa0a9fd709b86a5462f35923dad4f34a9b0ddb4206b6bc145'];$probeBackendMatches=true;$probeBackendChecked=0;
foreach($probeExpected as $file=>$digest){$current=hash_file('sha256','D:/extra/typing_updated/typing-forge'.'/'.$file);$probeBackendMatches=($current===$digest)&&$probeBackendMatches;$probeBackendChecked++;}
$probeScripts=is_array($probeStatus)?($probeStatus['scripts']??[]):[];
$probeBackendReal=realpath('D:/extra/typing_updated/typing-forge/backend');
$probeBackendSpelling=$probeBackendReal===false?'D:\\extra\\typing_updated\\typing-forge\\backend':$probeBackendReal;
$probeDescribe=static function(string $relative,string $fromBackend)use($probeExpected,$probeCanonical,$probeScripts,$probeBackendSpelling,$probeDirectives):array{
 $forward='D:/extra/typing_updated/typing-forge'.'/'.$relative;$backslash=str_replace('/','\\',$forward);$real=realpath($forward);
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
   if(str_starts_with($canonical,$probeCanonical('D:/extra/typing_updated/typing-forge').'/')){
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
