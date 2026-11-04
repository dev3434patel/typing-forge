<?php
declare(strict_types=1);
// Pure old/new decoding comparison. No bootstrap, configuration, DB or network.
require_once __DIR__.'/../src/RequestBody.php';
function originalRequestBody(string $raw): array
{
    $decoded=json_decode($raw,false,512,JSON_THROW_ON_ERROR);
    if(!$decoded instanceof stdClass)throw new JsonException('The body is not an object.');
    return json_decode($raw,true,512,JSON_THROW_ON_ERROR);
}
function requestOutcome(callable $decode,string $raw): array
{
    try{
        $body=$decode($raw);$encodingError=null;$json=null;
        try{$json=json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRESERVE_ZERO_FRACTION|JSON_THROW_ON_ERROR);}catch(JsonException $error){$encodingError=$error->getCode();}
        return ['accepted'=>true,'valueHash'=>hash('sha256',serialize($body)),'jsonHash'=>$json===null?null:hash('sha256',$json),'encodingError'=>$encodingError];
    }catch(JsonException $error){return ['accepted'=>false,'errorCode'=>$error->getCode()];}
}
$postRaw=json_encode(['code'=>'ABCD1234','candidate'=>['configuration'=>['mode'=>'race','durationMs'=>30000],'events'=>[['sequence'=>0,'offsetMs'=>100,'text'=>'c']]],'finish'=>false],JSON_THROW_ON_ERROR);
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
if(count($corpus)!==51)throw new RuntimeException('The retained fixed corpus must contain51 cases.');
$seed=0x263491ab;
$random=static function()use(&$seed):int{$seed=($seed*1664525+1013904223)&0x7fffffff;return $seed;};
$leaves=['null','true','false','0','-0.0','1e-300','1e400','"simple"','"\\u0000value"','"é"','"\\ud83d\\ude00"'];
$keys=['"a"','"a"','"\\u0061"','"0"','"01"','"-0"','"鍵"','"\\u0000trap"','"k\\u0000inside"','"\\\\u0000"'];
$nested=function(int $depth)use(&$nested,$random,$leaves,$keys):string{
    if($depth===0||$random()%4===0)return $leaves[$random()%count($leaves)];
    $object=$random()%2===0;$count=$random()%5;$parts=[];
    for($index=0;$index<$count;$index++)$parts[]=($object?$keys[$random()%count($keys)].':':'').$nested($depth-1);
    return ($object?'{':'[').implode(',',$parts).($object?'}':']');
};
for($index=0;$index<512;$index++){
    $raw='{"value":'.$nested(5).',"value":'.$nested(3).',"0":'.$nested(2).'}';
    if($index%5===0)$raw='{"discarded":{"\\u0000bad":'.$nested(2).'},"discarded":'.$nested(3).'}';
    $corpus['seeded-duplicate-nested-'.$index]=$raw;
}
$checks=[];$digest=hash_init('sha256');
foreach($corpus as $name=>$raw){
    $old=requestOutcome('originalRequestBody',$raw);$new=requestOutcome([SparowType\RequestBody::class,'decode'],$raw);
    $same=$old===$new;$checks[]=['name'=>$name,'pass'=>$same,'oldAccepted'=>$old['accepted'],'newAccepted'=>$new['accepted'],'oldJsonCode'=>$old['errorCode']??null,'newJsonCode'=>$new['errorCode']??null];
    hash_update($digest,$name."\0".$raw."\0".serialize($old)."\0");
}
$failed=count(array_filter($checks,static fn($row)=>!$row['pass']));
echo json_encode(['status'=>$failed?'FAILED':'PASS-SCOPED','scope'=>'Production RequestBody versus retained original false/root-stdClass/true decoder, exact values and JSON error codes. Class-only; no private configuration/SQL/HTTP.','seed'=>'0x263491ab','fixedCases'=>51,'seededCases'=>512,'passed'=>count($checks)-$failed,'failed'=>$failed,'referenceDigest'=>hash_final($digest),'checks'=>$checks,'originalConfigRead'=>false,'databaseConnected'=>false],JSON_THROW_ON_ERROR);
exit($failed?1:0);
