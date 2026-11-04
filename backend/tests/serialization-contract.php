<?php
declare(strict_types=1);
// Pure byte and segmentation compatibility. No bootstrap/config/SQL/network.
spl_autoload_register(static function (string $class): void {
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../src/'.$name.'.php';
});
require_once __DIR__.'/LegacyStablePayload.php';
final class SerializationPublicObject implements JsonSerializable
{
    public int $z=2,$a=1;
    private string $hidden='synthetic';
    public function jsonSerialize(): mixed { return 'must-not-replace-public-properties'; }
}
$values=[
    'null'=>null,'false'=>false,'true'=>true,'empty-string'=>'','empty-list'=>[], 'empty-object'=>(object)[],
    'mixed-empties'=>['array'=>[],'object'=>(object)[],'nested'=>[(object)[],[]]],
    'numeric-map-before-sort'=>[1=>'one',0=>'zero'],'numeric-object'=>(object)['1'=>'one','0'=>'zero'],
    'negative-keys'=>[-1=>'negative',0=>'zero'],'numeric-string-keys'=>['01'=>'leading',1=>'integer','1e0'=>'exponent','-0'=>'negative-zero','0'=>'zero'],
    'unicode-keys'=>['鍵'=>'日本語','a'=>'é','é'=>'العربية','क्ष'=>'👩‍💻'],
    'leading-nul-map-key'=>["\0x"=>1],
    'interior-nul-map-key'=>["a\0x"=>1],
    'nested-nul-map-keys'=>['a'=>["\0x"=>["b\0y"=>2]],'list'=>[["\0"=>3]]],
    'escaped-controls'=>"\0\x01\t\n\r\x1f\x7f\"\\/\u{2028}\u{2029}",
    'negative-float-zero'=>-0.0,'positive-float-zero'=>0.0,'float-one'=>1.0,'negative-int'=>-1,
    'integer-extremes'=>[PHP_INT_MIN,PHP_INT_MAX],
    'finite-floats'=>[1e-300,-1e-300,5e-324,1e300,-1e300,1.0000000000000002,1.7976931348623157e308],
    'public-object'=>new SerializationPublicObject(),
];
$deep='leaf';for($index=0;$index<600;$index++)$deep=['nested'=>$deep];$values['legacy-deep-container-without-aggregate-512-cap']=$deep;
$seed=0x571930ab;
$random=static function()use(&$seed):int{$seed=($seed*1664525+1013904223)&0x7fffffff;return $seed;};
$leaves=[null,false,true,0,1,-1,1.0,-0.0,1e-250,1e250,'','simple',"a\0b\n",'é','क्ष','👨‍👩‍👧‍👦','العربية','鍵'];
$nested=function(int $depth)use(&$nested,$random,$leaves):mixed{
    if($depth===0||$random()%4===0)return $leaves[$random()%count($leaves)];
    $kind=$random()%3;$count=$random()%5;$result=$kind===2?new stdClass():[];
    for($index=0;$index<$count;$index++){
        $value=$nested($depth-1);
        if($kind===0)$result[]=$value;
        else{$keys=['z','a','01','0','2','-1','鍵','é'];$key=$keys[$random()%count($keys)];if($kind===2)$result->{$key}=$value;else$result[$key]=$value;}
    }return $result;
};
for($index=0;$index<512;$index++)$values['seeded-nested-'.$index]=$nested(5);
$mismatches=[];$digest=hash_init('sha256');$byteCases=0;$errorCases=0;
$compare=static function(string $name,mixed $value)use(&$mismatches,&$byteCases,&$errorCases,$digest):void{
    $oldError=null;$newError=null;$old=null;$new=null;
    try{$old=LegacyStablePayload::stablePayload($value);}catch(JsonException $error){$oldError=$error->getCode();}
    try{$new=SparowType\SessionValidator::stablePayload($value);}catch(JsonException $error){$newError=$error->getCode();}
    if($oldError!==null||$newError!==null){$errorCases++;if($oldError!==$newError)$mismatches[]=$name.':error-code';return;}
    $byteCases++;if($old!==$new)$mismatches[]=$name.':bytes';
    hash_update($digest,$name."\0".$old."\0");
};
foreach($values as $name=>$value)$compare($name,$value);
$resource=fopen('php://memory','r+');
foreach(['nonfinite-positive'=>INF,'nonfinite-negative'=>-INF,'nonfinite-nan'=>NAN,'invalid-utf8-value'=>"\xb1",'invalid-utf8-key'=>["\xb1"=>'value'],'unsupported-resource'=>$resource] as $name=>$value)$compare($name,$value);
fclose($resource);
$validator=new SparowType\SessionValidator();$method=new ReflectionMethod($validator,'units');
$reference=static function(string $text):array{
    $iterator=IntlBreakIterator::createCharacterInstance('und');$iterator->setText($text);$units=[];$start=$iterator->first();
    foreach($iterator as $end){if($end>$start)$units[]=substr($text,$start,$end-$start);$start=$end;}
    $merged=[];foreach($units as $unit){$previous=count($merged)-1;if($previous>=0&&SparowType\UnicodeGraphemes::joinsIndicConjunct($merged[$previous],$unit))$merged[$previous].=$unit;else$merged[]=$unit;}return $merged;
};
$ascii='';for($index=0;$index<128;$index++)if($index!==13)$ascii.=chr($index);
$segmentationChecks=[];
foreach(['empty'=>'','ascii-controls-without-cr'=>$ascii,'crlf'=>"a\r\nb\rc\n",'emoji-boundary'=>'a👩‍💻z','combining'=>'é','indic'=>'क्ष क्‍ष જ્ઞ শ্র','latin-arabic'=>'café العربية'] as $name=>$text)$segmentationChecks[]=['name'=>$name,'pass'=>$method->invoke($validator,$text)===$reference($text)];
for($index=0;$index<33;$index++)$method->invoke($validator,'ascii-cache-'.$index);
$cache=(new ReflectionProperty($validator,'graphemeCache'))->getValue($validator);
$expectedKeys=array_map(static fn($index)=>"\0ascii-cache-".$index,range(1,32));
$segmentationChecks[]=['name'=>'ASCII path shares exact32-entry FIFO eviction','pass'=>array_keys($cache)===$expectedKeys];
$method->invoke($validator,'ascii-cache-32');$method->invoke($validator,'क्ष');
$cache=(new ReflectionProperty($validator,'graphemeCache'))->getValue($validator);
$segmentationChecks[]=['name'=>'Unicode and ASCII use the same cache and hits do not reorder it','pass'=>count($cache)===32&&!isset($cache["\0ascii-cache-1"])&&isset($cache["\0क्ष"])];
$failed=count($mismatches)+count(array_filter($segmentationChecks,static fn($check)=>!$check['pass']));
echo json_encode(['status'=>$failed?'FAILED':'PASS-SCOPED','scope'=>'Retained old serializer versus production exact bytes and encoding error codes, plus original ICU/GB9c versus optimized segmentation. Pure classes only.','seed'=>'0x571930ab','byteCases'=>$byteCases,'encodingErrorCases'=>$errorCases,'mismatches'=>$mismatches,'legacyBytesDigest'=>hash_final($digest),'segmentationChecks'=>$segmentationChecks,'privateConfigurationRead'=>false,'databaseConnected'=>false],JSON_THROW_ON_ERROR);
exit($failed?1:0);
