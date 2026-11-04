<?php
declare(strict_types=1);
$backend='D:\\extra\\typing_updated\\typing-forge\\backend';
$forward=str_replace('\\','/',$backend).'/src/SessionValidator.php';
$backslash=str_replace('/','\\',$forward);
$mixed=$backend.'/src/SessionValidator.php';
$resolved=realpath($forward);
require_once $mixed;
$status=opcache_get_status(true);$stats=is_array($status)?($status['opcache_statistics']??[]):[];
$normalize=static function(string $value):string{return strtolower(str_replace('\\','/',realpath($value)?:$value));};
$matched=0;$metadataHits=0;$currentSource=false;$metadataTimestampMatches=false;
foreach(($status['scripts']??[]) as $key=>$entry){
 if($normalize((string)$key)!==$normalize($forward)){continue;}
 $matched++;$metadataHits+=(int)($entry['hits']??0);
 $currentSource=hash_file('sha256',(string)$key)==='966a43ced6eee00224a56a6c4e775996d83e0ac45cc8125be7398f9d6ef73bbc';
 $metadataTimestampMatches=(int)($entry['timestamp']??0)===(int)filemtime($forward);
}
echo json_encode([
 'diagnosticCliOnly'=>true,'webRuntimeProven'=>false,'classLoaded'=>class_exists('SparowType\\SessionValidator',false),
 'cacheEnabled'=>is_array($status)&&($status['opcache_enabled']??false)===true,
 'queries'=>['forward'=>opcache_is_script_cached($forward),'backslash'=>opcache_is_script_cached($backslash),'mixedAutoloader'=>opcache_is_script_cached($mixed),'realpath'=>is_string($resolved)&&opcache_is_script_cached($resolved)],
 'metadata'=>['canonicalFullPathMatches'=>$matched,'currentFrozenSourceMatches'=>$currentSource,'timestampMatches'=>$metadataTimestampMatches,'hits'=>$metadataHits],
 'cachedScripts'=>(int)($stats['num_cached_scripts']??0),'hits'=>(int)($stats['hits']??0),'misses'=>(int)($stats['misses']??0)
],JSON_THROW_ON_ERROR);
