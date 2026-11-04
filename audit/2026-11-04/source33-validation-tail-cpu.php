<?php
declare(strict_types=1);
spl_autoload_register(static function(string $class):void{
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../../backend/src/'.$name.'.php';
});
if(getenv('SPAROWTYPE_SOURCE33_VALIDATION_TAIL_CPU')!=='1')throw new RuntimeException('Coordinated pure diagnostic required.');
$raw=stream_get_contents(STDIN);$candidate=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
if(strlen($raw)!==302392||count($candidate['events'])!==10||count($candidate['characters'])!==4599)throw new RuntimeException('Exact original fixture required.');
$keys=new ReflectionMethod(SparowType\SessionValidator::class,'deriveKeys');
$learning=new ReflectionMethod(SparowType\SessionValidator::class,'learningEvidence');
$rows=[];$same=true;
for($iteration=1;$iteration<=12;$iteration++){
    $validator=new SparowType\SessionValidator();$began=hrtime(true);
    $validated=$validator->validate($candidate,$candidate['ownerScope'],false,true);
    $fullMs=(hrtime(true)-$began)/1000000;$canonical=$validated['candidate'];$attempts=$validated['replay']['attempts'];
    $operations=[
        'keySummaries'=>static fn()=>$keys->invoke($validator,$candidate,$attempts),
        'learningEvidence'=>static fn()=>$learning->invoke($validator,$canonical,$attempts),
        'stablePayloadHash'=>static fn()=>'sha256:'.hash('sha256',SparowType\SessionValidator::stablePayload($canonical)),
        'unsortedEncodingGuard'=>static fn()=>json_encode($canonical,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR,2147483647),
    ];
    $order=array_keys($operations);if($iteration%2===0)$order=array_reverse($order);
    $row=['iteration'=>$iteration,'fullValidateMs'=>$fullMs,'order'=>$order];
    foreach($order as $name){$began=hrtime(true);$result=$operations[$name]();$row[$name.'Ms']=(hrtime(true)-$began)/1000000;
        if($name==='keySummaries')$same=$same&&$result===$validated['keySummaries'];
        elseif($name==='learningEvidence')$same=$same&&$result===$validated['learningEvidence'];
        elseif($name==='stablePayloadHash')$same=$same&&$result===$validated['payloadHash'];
        else $same=$same&&is_string($result);
        unset($result);
    }
    $row['avoidableTailNetMs']=$row['keySummariesMs']+$row['learningEvidenceMs']+$row['stablePayloadHashMs']-$row['unsortedEncodingGuardMs'];
    $row['avoidableTailFraction']=$row['avoidableTailNetMs']/$fullMs;$rows[]=$row;
    unset($validator,$validated,$canonical,$attempts,$operations);
}
$summary=static function(array $values):array{sort($values);$n=count($values);return ['count'=>$n,'min'=>$values[0],'median'=>($values[intdiv($n-1,2)]+$values[intdiv($n,2)])/2,'p95'=>$values[(int)ceil($n*.95)-1],'max'=>$values[$n-1]];};
$summaries=[];foreach(['fullValidateMs','keySummariesMs','learningEvidenceMs','stablePayloadHashMs','unsortedEncodingGuardMs','avoidableTailNetMs','avoidableTailFraction'] as $field)$summaries[$field]=$summary(array_column($rows,$field));
echo json_encode(['status'=>$same?'PASS-SCOPED-TAIL-DIAGNOSTIC':'FAILED','scope'=>'Frozen-source tail-only measurement; no actual reduced whole-path timing or HTTP claim.','iterations'=>12,'warmups'=>0,'retries'=>0,'outlierFiltering'=>false,'freshValidatorPerIteration'=>true,'derivedOutputsMatchOriginal'=> $same,'rows'=>$rows,'summaries'=>$summaries,'servicesStarted'=>0,'privateConfigRead'=>false],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT)."\n";
exit($same?0:1);
