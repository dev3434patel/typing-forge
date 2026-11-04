<?php
declare(strict_types=1);
// Pure loaders only: never application bootstrap, private configuration or SQL.
spl_autoload_register(static function(string $class):void{
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../src/'.$name.'.php';
});
require_once __DIR__.'/CheckpointReferenceValidatorSource33.php';
$referenceSource=file_get_contents(__DIR__.'/CheckpointReferenceValidatorSource33.php');
$referenceSource=str_replace('final class CheckpointReferenceValidatorSource33','final class SessionValidator',$referenceSource);
$sourceMatches=hash('sha256',str_replace("\r\n","\n",$referenceSource))==='966a43ced6eee00224a56a6c4e775996d83e0ac45cc8125be7398f9d6ef73bbc';
$cases=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
$outcome=static function(array $case,string $kind):array{
    try{
        $validator=$kind==='reference'?new SparowType\CheckpointReferenceValidatorSource33():new SparowType\SessionValidator();
        $validated=$kind==='checkpoint'
            ?$validator->validate($case['candidate'],$case['owner'],$case['consent']??false,$case['interim']??false,true)
            :$validator->validate($case['candidate'],$case['owner'],$case['consent']??false,$case['interim']??false);
        return ['ok'=>true,'canonicalCandidateHash'=>hash('sha256',serialize($validated['candidate'])),'canonicalChartHash'=>hash('sha256',serialize($validated['candidate']['timeSeries'])),'fullBundleHash'=>$kind==='checkpoint'?null:hash('sha256',serialize($validated)),'fullPayloadHash'=>$kind==='checkpoint'?null:$validated['payloadHash'],'markerCorrect'=>$kind==='checkpoint'?array_keys($validated)===['candidate','checkpointOnly']&&$validated['checkpointOnly']===true:!array_key_exists('checkpointOnly',$validated)];
    }catch(Throwable $error){return ['ok'=>false,'class'=>get_class($error),'message'=>$error->getMessage(),'code'=>$error->getCode()];}
};
$rows=[];$overflowBase=null;
foreach($cases as $case){
    // Fresh instances and compact witnesses keep both large trees out of memory.
    $reference=$outcome($case,'reference');$full=$outcome($case,'full');$checkpoint=$outcome($case,'checkpoint');
    $defaultEqual=$reference===$full;
    if($reference['ok']){
        $projectionEqual=$checkpoint['ok']&&$checkpoint['markerCorrect']&&$checkpoint['canonicalCandidateHash']===$reference['canonicalCandidateHash']&&$checkpoint['canonicalChartHash']===$reference['canonicalChartHash'];
        if($overflowBase===null&&!isset($case['candidate']['configuration']['settings']['course']))$overflowBase=$case;
    }else{$projectionEqual=$reference===$checkpoint;}
    $rows[]=['ok'=>$reference['ok'],'defaultFullBundleUnchanged'=>$defaultEqual,'checkpointProjectionEqual'=>$projectionEqual,'reference'=>$reference,'full'=>$full,'checkpoint'=>$checkpoint];
}
$overflow=[];
if($overflowBase!==null){
    foreach(['retainedTopPositive','retainedTopNegative','retainedEvent','retainedSettings','overwrittenCharacters','overwrittenChart','overwrittenCursor','metricsExtraRejected'] as $name){
        $variant=$overflowBase['candidate'];
        if($name==='retainedTopPositive'||$name==='retainedTopNegative')$variant['__overflow']='__literal__';
        elseif($name==='retainedEvent')$variant['events'][0]['__overflow']='__literal__';
        elseif($name==='retainedSettings')$variant['configuration']['settings']['__overflow']='__literal__';
        elseif($name==='overwrittenCharacters')$variant['characters']=['__literal__'];
        elseif($name==='overwrittenChart')$variant['timeSeries']=['__literal__'];
        elseif($name==='overwrittenCursor')$variant['cursor']='__literal__';
        else$variant['metrics']['__overflow']='__literal__';
        $raw=str_replace('"__literal__"',$name==='retainedTopNegative'?'-1e999':'1e999',json_encode($variant,JSON_THROW_ON_ERROR));
        $case=[...$overflowBase,'candidate'=>SparowType\RequestBody::decode($raw)];
        $reference=$outcome($case,'reference');$full=$outcome($case,'full');$checkpoint=$outcome($case,'checkpoint');
        $equal=$reference===$full&&($reference['ok']?$checkpoint['ok']&&$checkpoint['canonicalCandidateHash']===$reference['canonicalCandidateHash']&&$checkpoint['markerCorrect']:$reference===$checkpoint);
        $expected=$name==='overwrittenCharacters'||$name==='overwrittenChart'||$name==='overwrittenCursor'?$reference['ok']:!$reference['ok'];
        $overflow[]=['name'=>$name,'actualRequestBodyDecoder'=>true,'equal'=>$equal,'expectedOutcome'=>$expected,'reference'=>$reference,'full'=>$full,'checkpoint'=>$checkpoint];
    }
}
echo json_encode(['referenceSourceMatches'=>$sourceMatches,'rows'=>$rows,'overflowChecks'=>$overflow,'memoryLimitRaised'=>false],JSON_THROW_ON_ERROR);
