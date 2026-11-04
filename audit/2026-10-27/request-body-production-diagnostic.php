<?php
declare(strict_types=1);
// Pure parser/validator diagnostic. No bootstrap, configuration, SQL or HTTP.
spl_autoload_register(static function(string $class): void {
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../../backend/src/'.$name.'.php';
});
if(getenv('SPAROWTYPE_REQUEST_BODY_PRODUCTION_DIAGNOSTIC')!=='1')throw new RuntimeException('Explicit coordinated diagnostic opt-in required.');
function oldDecode(string $raw): array {
    $decoded=json_decode($raw,false,512,JSON_THROW_ON_ERROR);
    if(!$decoded instanceof stdClass)throw new JsonException('The body is not an object.');
    $body=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
    return ['decoded'=>$decoded,'body'=>$body,'branch'=>'old-two-decode'];
}
function hybridDecode(string $raw): array {
    return ['decoded'=>null,'body'=>SparowType\RequestBody::decode($raw),'branch'=>str_contains($raw,'\u0000')?'old-two-decode':'single-associative'];
}
function normalizedOutcome(string $decoder,string $raw): array {
    try {
        $holder=$decoder($raw);$body=$holder['body'];
        try{$json=json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_THROW_ON_ERROR);$jsonError=null;}
        catch(JsonException $error){$json=null;$jsonError=$error->getCode();}
        return ['httpStatus'=>200,'body'=>$body,'valueHash'=>hash('sha256',serialize($body)),'jsonHash'=>$json===null?null:hash('sha256',$json),'jsonBytes'=>$json===null?null:strlen($json),'jsonEncodingError'=>$jsonError,'branch'=>$holder['branch']];
    }catch(JsonException $error){
        return ['httpStatus'=>400,'errorCode'=>'json','message'=>'Send a valid JSON object.','internalJsonCode'=>$error->getCode()];
    }
}
function summary(array $samples): array {
    $sorted=$samples;sort($sorted);$count=count($sorted);
    return ['count'=>$count,'min'=>$sorted[0],'median'=>($sorted[intdiv($count-1,2)]+$sorted[intdiv($count,2)])/2,'p95'=>$sorted[(int)ceil($count*.95)-1],'max'=>$sorted[$count-1]];
}
$mode=$argv[1]??'main';$raw=stream_get_contents(STDIN);
if(in_array($mode,['memory-old','memory-hybrid'],true)){
    gc_collect_cycles();$reset=function_exists('memory_reset_peak_usage');
    if($reset)memory_reset_peak_usage();
    $baselineUsed=memory_get_usage(false);$baselineReal=memory_get_usage(true);
    $holder=($mode==='memory-old'?'oldDecode':'hybridDecode')($raw);
    // Both old trees remain live through the whole measured operation.
    $currentUsed=memory_get_usage(false);$currentReal=memory_get_usage(true);
    $peakUsed=memory_get_peak_usage(false);$peakReal=memory_get_peak_usage(true);
    $decodedHash=hash('sha256',json_encode($holder['body'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_THROW_ON_ERROR));
    echo json_encode(['status'=>'PASS-SCOPED-MEMORY','mode'=>$mode,'phpVersion'=>PHP_VERSION,'inputBytes'=>strlen($raw),'inputHash'=>hash('sha256',$raw),'decodedHash'=>$decodedHash,'branch'=>$holder['branch'],'peakResetAvailable'=>$reset,'baselineUsedBytes'=>$baselineUsed,'baselineRealBytes'=>$baselineReal,'currentUsedBytes'=>$currentUsed,'currentRealBytes'=>$currentReal,'peakUsedBytes'=>$peakUsed,'peakRealBytes'=>$peakReal,'retainedUsedDeltaBytes'=>$currentUsed-$baselineUsed,'peakUsedDeltaBytes'=>$peakUsed-$baselineUsed,'oldBothTreesRetained'=>$mode==='memory-old'&&$holder['decoded'] instanceof stdClass,'privateConfigurationRead'=>false,'databaseConnected'=>false],JSON_THROW_ON_ERROR)."\n";
    exit;
}
if($mode!=='main')throw new RuntimeException('Unknown diagnostic mode.');
$fixture=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
$candidate=$fixture['candidate'];$postRaw=base64_decode($fixture['postBodyBase64'],true);
if($postRaw===false||count($candidate['events'])!==10||count($candidate['characters'])!==4599||$candidate['elapsedMs']!==15000)throw new RuntimeException('Exact reference fixture required.');
$corpus=[
    'empty-object'=>'{}','json-whitespace'=>" \t\r\n{\"a\":1}\r\n ",
    'numeric-object'=>'{"0":"zero","1":"one"}','numeric-map-reordered'=>'{"1":"one","0":"zero"}',
    'numeric-key-forms'=>'{"01":"leading","-0":"negative-zero","1e0":"exponent","9223372036854775808":"large"}',
    'empty-nested-containers'=>'{"a":{},"b":[],"c":[{},[]]}',
    'duplicate-key'=>'{"a":1,"a":2}','escaped-duplicate-key'=>'{"a":1,"\u0061":2}',
    'duplicate-overwritten-nul-object'=>'{"a":{"\u0000bad":1},"a":2}',
    'duplicate-overwritten-nul-array'=>'{"a":[{"\u0000bad":1}],"a":[]}',
    'numeric-duplicate-overwritten-nul'=>'{"0":{"\u0000bad":1},"0":0}',
    'nul-key'=>'{"\u0000bad":1}','nested-nul-key'=>'{"a":{"\u0000bad":1}}',
    'interior-nul-key'=>'{"a\u0000b":1}','nul-value'=>'{"a":"\u0000value"}',
    'escaped-backslash-false-positive'=>'{"a":"\\\\u0000"}',
    'escaped-backslash-key-false-positive'=>'{"\\\\u0000":1}',
    'escaped-slash'=>'{"a":"\/u0000"}',
    'unicode'=>'{"é":"e\u0301","हिन्दी":"क्ष","العربية":"دقيقة","emoji":"\ud83d\ude00"}',
    'integer-float-boundaries'=>'{"a":9223372036854775807,"b":9223372036854775808,"c":-0.0,"d":1e-300,"e":1.7976931348623157e308}',
    'overflow-float'=>'{"a":1e400}',
    'root-array'=>'[1,2]','root-empty-array'=>'[]','root-array-nul'=>'[{"\u0000bad":1}]',
    'root-null'=>'null','root-true'=>'true','root-false'=>'false','root-number'=>'123','root-string'=>'"{}"',
    'empty-body'=>'','whitespace-only'=>" \t\r\n",'leading-bom'=>"\xEF\xBB\xBF{}",
    'leading-nul'=>"\0{}",'leading-vertical-tab'=>"\v{}",'non-json-whitespace'=>"\xC2\xA0{}",
    'trailing-junk'=>'{}x','trailing-comma'=>'{"a":1,}','comment'=>'/*comment*/{}',
    'invalid-utf8-value'=>"{\"a\":\"\xB1\"}",'invalid-utf8-key'=>"{\"\xB1\":1}",
    'lone-high-surrogate'=>'{"a":"\ud800"}','lone-low-surrogate'=>'{"a":"\udc00"}',
    'invalid-surrogate-key'=>'{"\ud800":1}','literal-control'=>"{\"a\":\"\x01\"}",
    'invalid-escape'=>'{"a":"\q"}','representative-post'=>$postRaw,
];
foreach([509,510,511,512,513] as $depth)$corpus['depth-'.$depth]='{"a":'.str_repeat('[',$depth).'0'.str_repeat(']',$depth).'}';
$checks=[];$mismatches=[];
foreach($corpus as $name=>$value){
    $old=normalizedOutcome('oldDecode',$value);$new=normalizedOutcome('hybridDecode',$value);
    $same=$old['httpStatus']===$new['httpStatus'];
    if($same&&$old['httpStatus']===200)$same=$old['body']===$new['body']&&$old['valueHash']===$new['valueHash']&&$old['jsonHash']===$new['jsonHash']&&$old['jsonBytes']===$new['jsonBytes']&&$old['jsonEncodingError']===$new['jsonEncodingError'];
    if($same&&$old['httpStatus']===400)$same=$old['errorCode']===$new['errorCode']&&$old['message']===$new['message']&&$old['internalJsonCode']===$new['internalJsonCode'];
    $checks[]=['name'=>$name,'pass'=>$same,'rawBytes'=>strlen($value),'rawHash'=>hash('sha256',$value),'oldHttp'=>$old['httpStatus'],'hybridHttp'=>$new['httpStatus'],'oldInternalJsonCode'=>$old['internalJsonCode']??null,'hybridInternalJsonCode'=>$new['internalJsonCode']??null,'hybridBranch'=>$new['branch']??null,'decodedJsonHash'=>$new['jsonHash']??null];
    if(!$same)$mismatches[]=$name;
}
$trap=$corpus['duplicate-overwritten-nul-object'];
$unsafe=json_decode($trap,true,512,JSON_THROW_ON_ERROR);
$trapOld=normalizedOutcome('oldDecode',$trap);
$duplicateTrap=['oldHttp'=>$trapOld['httpStatus'],'oldInternalJsonCode'=>$trapOld['internalJsonCode']??null,'assocOnlyAccepted'=>$unsafe===['a'=>2],'discardedNulKeyAbsent'=>array_keys($unsafe)===['a'],'hybridHttp'=>normalizedOutcome('hybridDecode',$trap)['httpStatus']];
$rows=[];$parseHashes=[];$order=[];$iterations=12;
for($iteration=1;$iteration<=$iterations;$iteration++){
    $sequence=$iteration%2?['old','hybrid']:['hybrid','old'];$row=['iteration'=>$iteration,'order'=>$sequence];
    foreach($sequence as $decoder){
        $at=hrtime(true);$holder=($decoder==='old'?'oldDecode':'hybridDecode')($postRaw);$row[$decoder.'ParseMs']=(hrtime(true)-$at)/1000000;
        $plain=json_encode($holder['body'],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_THROW_ON_ERROR);
        $parseHashes[]=hash('sha256',$plain);unset($holder,$plain);
    }
    $rows[]=$row;$order[]=$sequence;
}
$componentRows=[];$canonicalHashes=[];$authoritativeHashes=[];
for($iteration=1;$iteration<=$iterations;$iteration++){
    $validator=new SparowType\SessionValidator();
    $at=hrtime(true);$validated=$validator->validate($candidate,$candidate['ownerScope'],false,true);$validateMs=(hrtime(true)-$at)/1000000;
    // A different fixed synthetic receipt exercises the independent server-time path.
    $authoritativeElapsed=20000.0;
    $at=hrtime(true);$authoritative=$validator->replay($validated['candidate']['configuration'],$validated['candidate']['events'],$authoritativeElapsed,['targetText'=>$candidate['targetText'],'finiteFinal'=>false]);$replayMs=(hrtime(true)-$at)/1000000;
    $componentRows[]=['iteration'=>$iteration,'validateClientElapsedMs'=>$validateMs,'independentAuthoritativeReplayMs'=>$replayMs,'combinedMs'=>$validateMs+$replayMs];
    $canonicalHashes[]=$validated['payloadHash'];$authoritativeHashes[]=hash('sha256',serialize($authoritative));
    unset($validator,$validated,$authoritative);
}
$summaries=['oldParseMs'=>summary(array_column($rows,'oldParseMs')),'hybridParseMs'=>summary(array_column($rows,'hybridParseMs'))];
foreach(['validateClientElapsedMs','independentAuthoritativeReplayMs','combinedMs'] as $key)$summaries[$key]=summary(array_column($componentRows,$key));
$pass=$mismatches===[]&&count(array_unique($parseHashes))===1&&count(array_unique($canonicalHashes))===1&&count(array_unique($authoritativeHashes))===1&&$duplicateTrap['oldHttp']===400&&$duplicateTrap['assocOnlyAccepted']&&$duplicateTrap['hybridHttp']===400;
echo json_encode(['status'=>$pass?'PASS-SCOPED-PURE-DIAGNOSTIC':'FAILED','phpVersion'=>PHP_VERSION,'corpusCases'=>count($checks),'corpusChecks'=>$checks,'mismatches'=>$mismatches,'duplicateKeyTrap'=>$duplicateTrap,'iterations'=>$iterations,'warmups'=>0,'outlierFiltering'=>false,'retryCount'=>0,'rows'=>$rows,'componentRows'=>$componentRows,'summaries'=>$summaries,'decodedOutputHash'=>$parseHashes[0],'canonicalPayloadHash'=>$canonicalHashes[0],'authoritativeProjectionHash'=>$authoritativeHashes[0],'clientElapsedMs'=>$candidate['elapsedMs'],'authoritativeElapsedMs'=>20000.0,'allIterationOutputsIdentical'=>$pass,'privateConfigurationRead'=>false,'databaseConnected'=>false,'httpCapacityMeasured'=>false],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT)."\n";
exit($pass?0:1);
