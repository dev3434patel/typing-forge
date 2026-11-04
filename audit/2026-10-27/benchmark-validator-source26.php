<?php
declare(strict_types=1);
// Pure timing diagnostic: application classes only, no bootstrap/config/DB.
spl_autoload_register(static function (string $class): void {
    $prefix='SparowType\\';$name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once __DIR__.'/../../backend/src/'.$name.'.php';
});
if(getenv('SPAROWTYPE_SOURCE26_SERIALIZER_PROFILE')!=='1')throw new RuntimeException('Explicit coordinated diagnostic opt-in required.');
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
$candidate=$input['candidate'];$owner=$candidate['ownerScope'];$iterations=12;
if(count($candidate['events'])!==10||count($candidate['characters'])<4000||$candidate['elapsedMs']!==15000)throw new RuntimeException('Exact800-word/10-event/15s fixture required.');
$rows=[];$fingerprints=[];$shape=null;
for($index=0;$index<$iterations;$index++){
    $validator=new SparowType\SessionValidator();
    $at=hrtime(true);$validated=$validator->validate($candidate,$owner,false,true);$validateMs=(hrtime(true)-$at)/1000000;
    $canonical=$validated['candidate'];
    $at=hrtime(true);$payload=SparowType\SessionValidator::stablePayload($canonical);$serializeMs=(hrtime(true)-$at)/1000000;
    $at=hrtime(true);$fingerprint=hash('sha256',$payload);$hashMs=(hrtime(true)-$at)/1000000;
    $at=hrtime(true);$plain=json_encode($canonical,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);$plainMs=(hrtime(true)-$at)/1000000;
    if($validated['payloadHash']!=='sha256:'.$fingerprint)throw new RuntimeException('Measured canonical serialization differs from validation hash.');
    $rows[]=['iteration'=>$index+1,'validateTotalMs'=>$validateMs,'stablePayloadOnValidatedCandidateMs'=>$serializeMs,'sha256OnlyMs'=>$hashMs,'unsortedSingleJsonEncodeMs'=>$plainMs];
    $fingerprints[]=$fingerprint;
    $shape=['events'=>count($canonical['events']),'characters'=>count($canonical['characters']),'timeSeries'=>count($canonical['timeSeries']),'elapsedMs'=>$canonical['elapsedMs'],'stablePayloadBytes'=>strlen($payload),'plainJsonBytes'=>strlen($plain)];
}
$summaries=[];
foreach(['validateTotalMs','stablePayloadOnValidatedCandidateMs','sha256OnlyMs','unsortedSingleJsonEncodeMs'] as $key){$samples=array_column($rows,$key);sort($samples);$summaries[$key]=['count'=>count($samples),'min'=>$samples[0],'median'=>($samples[5]+$samples[6])/2,'p95'=>$samples[11],'max'=>$samples[11]];}
echo json_encode(['status'=>'PASS-SCOPED-PURE-DIAGNOSTIC','phpVersion'=>PHP_VERSION,'iterations'=>$iterations,'fixture'=>$shape,'summaries'=>$summaries,'rows'=>$rows,'canonicalFingerprint'=>count(array_unique($fingerprints))===1?$fingerprints[0]:null,'allValidationHashesMatch'=>true,'measurementLimit'=>'Serialization is timed separately on the already validated candidate, not instrumented inside the validate call. Its ratio is diagnostic context, not exact exclusive attribution or HTTP latency. Plain json_encode is an unsorted lower-bound comparison, not a canonical replacement.','privateConfigurationRead'=>false,'databaseConnected'=>false],JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT)."\n";
