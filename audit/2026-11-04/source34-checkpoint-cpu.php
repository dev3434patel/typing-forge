<?php
declare(strict_types=1);
spl_autoload_register(static function(string $class):void{$prefix='SparowType\\';$name=substr($class,strlen($prefix));if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../../backend/src/'.$name.'.php';});
if(getenv('SPAROWTYPE_SOURCE34_CHECKPOINT_CPU')!=='1')throw new RuntimeException('Coordinated pure diagnostic required.');
require_once __DIR__.'/CheckpointProjectionValidatorSource34.php';
$raw=stream_get_contents(STDIN);$candidate=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
if(strlen($raw)!==302392||count($candidate['events'])!==10||count($candidate['characters'])!==4599)throw new RuntimeException('Exact original fixture required.');
$rows=[];$same=true;
for($iteration=1;$iteration<=12;$iteration++){
 $order=$iteration%2?['source33Full','source34Checkpoint']:['source34Checkpoint','source33Full'];$row=['iteration'=>$iteration,'order'=>$order];
 foreach($order as $version){
  $validator=$version==='source33Full'?new SparowType\SessionValidator():new SparowType\CheckpointProjectionValidatorSource34();
  $began=hrtime(true);$validated=$version==='source33Full'?$validator->validate($candidate,$candidate['ownerScope'],false,true):$validator->validate($candidate,$candidate['ownerScope'],false,true,true);$validateMs=(hrtime(true)-$began)/1000000;
  $began=hrtime(true);$authoritative=$validator->replay($validated['candidate']['configuration'],$validated['candidate']['events'],20000.0,['targetText'=>$candidate['targetText'],'finiteFinal'=>false,'includeTimeSeries'=>false]);$replayMs=(hrtime(true)-$began)/1000000;
  $row[$version]=['validateMs'=>$validateMs,'authoritativeReplayMs'=>$replayMs,'combinedMs'=>$validateMs+$replayMs,'canonicalCandidateHash'=>hash('sha256',serialize($validated['candidate'])),'canonicalPayloadHash'=>'sha256:'.hash('sha256',SparowType\SessionValidator::stablePayload($validated['candidate'])),'authoritativeHash'=>hash('sha256',serialize($authoritative)),'canonicalChartRetained'=>isset($validated['candidate']['timeSeries'])&&count($validated['candidate']['timeSeries'])===15,'projectionMarkerCorrect'=>$version==='source33Full'?!array_key_exists('checkpointOnly',$validated):array_keys($validated)===['candidate','checkpointOnly']&&$validated['checkpointOnly']===true];
  if($version==='source33Full')$same=$same&&$validated['payloadHash']===$row[$version]['canonicalPayloadHash'];
  unset($validator,$validated,$authoritative);
 }
 foreach(['canonicalCandidateHash','canonicalPayloadHash','authoritativeHash']as$field)$same=$same&&$row['source33Full'][$field]===$row['source34Checkpoint'][$field];
 foreach($order as$version)$same=$same&&$row[$version]['canonicalChartRetained']&&$row[$version]['projectionMarkerCorrect'];
 $rows[]=$row;
}
$summary=static function(array$values):array{sort($values);$n=count($values);return ['count'=>$n,'min'=>$values[0],'median'=>($values[intdiv($n-1,2)]+$values[intdiv($n,2)])/2,'p95'=>$values[(int)ceil($n*.95)-1],'max'=>$values[$n-1]];};
$summaries=[];foreach(['source33Full','source34Checkpoint']as$version)foreach(['validateMs','authoritativeReplayMs','combinedMs']as$field)$summaries[$version][$field]=$summary(array_map(static fn(array$row):float=>$row[$version][$field],$rows));
$errorCases=[];
foreach(['retainedTopPositive','retainedTopNegative','retainedEvent','retainedSettings','overwrittenCharacters','overwrittenChart','overwrittenCursor','metricsExtraRejected']as$name){
 $variant=$candidate;
 if($name==='retainedTopPositive'||$name==='retainedTopNegative')$variant['__overflow']='__literal__';
 elseif($name==='retainedEvent')$variant['events'][0]['__overflow']='__literal__';
 elseif($name==='retainedSettings')$variant['configuration']['settings']['__overflow']='__literal__';
 elseif($name==='overwrittenCharacters')$variant['characters']=['__literal__'];
 elseif($name==='overwrittenChart')$variant['timeSeries']=['__literal__'];
 elseif($name==='overwrittenCursor')$variant['cursor']='__literal__';
 else$variant['metrics']['__overflow']='__literal__';
 $rawVariant=str_replace('"__literal__"',$name==='retainedTopNegative'?'-1e999':'1e999',json_encode($variant,JSON_THROW_ON_ERROR));
 $parsed=SparowType\RequestBody::decode($rawVariant);$outcomes=[];
 foreach(['source33Full','source34Checkpoint']as$version){
  try{$validator=$version==='source33Full'?new SparowType\SessionValidator():new SparowType\CheckpointProjectionValidatorSource34();$accepted=$version==='source33Full'?$validator->validate($parsed,$candidate['ownerScope'],false,true):$validator->validate($parsed,$candidate['ownerScope'],false,true,true);$outcomes[$version]=['ok'=>true,'canonicalCandidateHash'=>hash('sha256',serialize($accepted['candidate']))];}
  catch(Throwable$error){$outcomes[$version]=['ok'=>false,'class'=>get_class($error),'message'=>$error->getMessage(),'code'=>$error->getCode()];}
  unset($validator,$accepted);
 }
 $equal=$outcomes['source33Full']===$outcomes['source34Checkpoint'];$same=$same&&$equal;$errorCases[]=['name'=>$name,'rawJsonOverflowReachedActualDecoder'=>true,'equal'=>$equal,'outcomes'=>$outcomes];
}
echo json_encode(['status'=>$same?'PASS-SCOPED-PURE-DIAGNOSTIC':'FAILED','scope'=>'Audit-only reduced projection; exact canonical candidate/chart and independent no-chart authoritative replay retained. No HTTP capacity prediction.','iterations'=>12,'warmups'=>0,'retries'=>0,'outlierFiltering'=>false,'freshInstances'=>true,'rows'=>$rows,'summaries'=>$summaries,'overflowErrorParity'=>$errorCases,'outputsEqual'=>$same,'productionEdited'=>false,'servicesStarted'=>0],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT)."\n";exit($same?0:1);
