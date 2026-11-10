<?php
declare(strict_types=1);
$root = dirname(__DIR__, 2);
spl_autoload_register(static function(string $class) use ($root): void {
    $prefix='SparowType\\'; $name=substr($class,strlen($prefix));
    if(str_starts_with($class,$prefix)&&preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name)) require_once $root.'/backend/src/'.$name.'.php';
});
final class PayloadSemanticPdo extends PDO {
    public function __construct() {}
    public function prepare(string $query,array $options=[]): PDOStatement|false { throw new RuntimeException('Unexpected database call.'); }
    public function query(string $query,?int $fetchMode=null,mixed ...$fetchModeArgs): PDOStatement|false { throw new RuntimeException('Unexpected database call.'); }
}
$candidateIndex=file_get_contents(__DIR__.'/full-payload-index-candidate.php');
$originalIndex=file_get_contents($root.'/backend/public/index.php');
$start=strpos($candidateIndex,"    if (\$arenaAction === 'submit') {\n        unset(\$raw);");
$end=strpos($candidateIndex,'    $validator = null; $data = null;', $start===false?0:$start);
if($start===false||$end===false)throw new RuntimeException('Exact projection block is missing.');
$block=substr($candidateIndex,$start,$end-$start);
if(substr_replace($candidateIndex,'',$start,$end-$start)!==$originalIndex)throw new RuntimeException('Candidate must contain exactly the one new block.');
if(substr_count($block,"['characters', 'timeSeries', 'cursor']")!==1||str_contains($block,"['metrics']"))throw new RuntimeException('Unexpected projection fields.');
$seedRaw=stream_get_contents(STDIN);$seeds=json_decode($seedRaw,true,512,JSON_THROW_ON_ERROR);unset($seedRaw);
$owner='11111111-1111-4111-8111-111111111111';
$outcome=static function(string $raw,string $variant)use($block,$owner):array {
    try {
        if(strlen($raw)>2097152)throw new SparowType\ApiException(413,'payload-too-large','Request body exceeds the 2 MB limit.');
        try{$body=SparowType\RequestBody::decode($raw);}catch(JsonException){throw new SparowType\ApiException(400,'json','Send a valid JSON object.');}
        $arenaAction='submit';
        if($variant==='B')eval($block); // Exact hash-bound audit candidate block, never user-provided code.
        SparowType\Security::owner($body,$owner,false);
        SparowType\ArenaRules::code($body['code']??null);
        $db=new PayloadSemanticPdo();$validator=new SparowType\SessionValidator();$data=new SparowType\DataService($db,$validator,[]);
        $prepared=(new SparowType\ArenaEvidence($db,$validator,$data))->prepare($body,['id'=>$owner]);
        $validated=$prepared['validated'];$candidate=$validated['candidate'];
        $replay=$validator->replay($candidate['configuration'],$candidate['events'],$prepared['finish']?$candidate['elapsedMs']:2300,['targetText'=>$candidate['targetText'],'finiteFinal'=>$prepared['finish'],'includeTimeSeries'=>$prepared['finish']]);
        return ['ok'=>true,'finish'=>$prepared['finish'],'checkpointOnly'=>$validated['checkpointOnly']??false,'candidateRawJsonHash'=>hash('sha256',SparowType\Database::json($candidate)),'candidatePropertyOrder'=>array_keys($candidate),'fullPreparedRawJsonHash'=>hash('sha256',SparowType\Database::json($prepared)),'validatedRawJsonHash'=>hash('sha256',SparowType\Database::json($validated)),'canonicalStableHash'=>hash('sha256',SparowType\SessionValidator::stablePayload($candidate)),'payloadHash'=>$validated['payloadHash']??null,'authoritativeReplayRawJsonHash'=>hash('sha256',SparowType\Database::json($replay)),'defaultEvidenceJsonBytes'=>strlen(SparowType\Database::json($candidate)),'fullPersistenceBundlePresent'=>$prepared['finish']?isset($validated['payloadHash'],$validated['timeSeries'],$validated['keySummaries']):null];
    }catch(Throwable $error){return ['ok'=>false,'class'=>get_class($error),'message'=>$error->getMessage(),'code'=>$error->getCode(),'status'=>$error instanceof SparowType\ApiException?$error->status:null,'apiCode'=>$error instanceof SparowType\ApiException?$error->errorCode:null];}
};
$encode=static fn(array $body):string=>json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
$corpus=static function()use($seeds,$encode):Generator {
    foreach($seeds as$name=>$seed)yield[$name,$encode($seed),true];
    foreach(['checkpoint','finish']as$seedName){
        foreach(['characters','timeSeries','cursor']as$field){
            foreach(['missing','null','false','number','string','empty-array','large']as$type){
                $body=$seeds[$seedName];
                if($type==='missing')unset($body['candidate'][$field]);
                else $body['candidate'][$field]=match($type){'null'=>null,'false'=>false,'number'=>123,'string'=>'untrusted','empty-array'=>[],default=>array_fill(0,4096,['discarded'=>'client'])};
                yield[$seedName.'-'.$field.'-'.$type,$encode($body),true];
            }
        }
        foreach(['missing','null','large']as$type){$body=$seeds[$seedName];foreach(['characters','timeSeries','cursor']as$field){if($type==='missing')unset($body['candidate'][$field]);else$body['candidate'][$field]=$type==='null'?null:array_fill(0,2048,'discarded');}yield[$seedName.'-all3-'.$type,$encode($body),true];}
    }
    $mutations=[
        'finish-string'=>static function(&$b){$b['finish']='false';},'finish-number'=>static function(&$b){$b['finish']=1;},'finish-array'=>static function(&$b){$b['finish']=[];},
        'candidate-missing'=>static function(&$b){unset($b['candidate']);},'candidate-null'=>static function(&$b){$b['candidate']=null;},'candidate-string'=>static function(&$b){$b['candidate']='bad';},'candidate-empty'=>static function(&$b){$b['candidate']=[];},
        'schema'=>static function(&$b){$b['candidate']['schemaVersion']=2;},'version'=>static function(&$b){$b['candidate']['metricsVersion']='wrong';},'client-id'=>static function(&$b){$b['candidate']['clientSessionId']='!';},
        'candidate-owner'=>static function(&$b){$b['candidate']['ownerScope']='other';},'config-owner'=>static function(&$b){$b['candidate']['configuration']['ownerScope']='other';},'config-identity'=>static function(&$b){$b['candidate']['configuration']['clientSessionId']='other';},
        'metrics-null'=>static function(&$b){$b['candidate']['metrics']=null;},'metrics-missing'=>static function(&$b){unset($b['candidate']['metrics']);},'metrics-count'=>static function(&$b){$b['candidate']['metrics']['insertionAttempts']++;},'metrics-extra'=>static function(&$b){$b['candidate']['metrics']['extraClaim']=0;},
        'event-list'=>static function(&$b){$b['candidate']['events']='bad';},'bulk-event'=>static function(&$b){$b['candidate']['events'][0]['text']='bulk';},'event-method'=>static function(&$b){$b['candidate']['events'][0]['provenance']='paste';},
        'finish-running'=>static function(&$b){$b['finish']=true;},'room-code'=>static function(&$b){$b['code']='bad';},'envelope-owner'=>static function(&$b){$b['expectedOwner']='other';},'target'=>static function(&$b){$b['candidate']['targetText']='changed';},'transcript'=>static function(&$b){$b['candidate']['finalTranscript']='changed';},
        'precedence-owner-schema'=>static function(&$b){$b['expectedOwner']='other';$b['candidate']['schemaVersion']=0;},'precedence-shape-event'=>static function(&$b){$b['finish']='bad';$b['candidate']['events'][0]['text']='bulk';},'precedence-event-schema'=>static function(&$b){$b['candidate']['events'][0]['text']='bulk';$b['candidate']['schemaVersion']=0;},
    ];
    foreach($mutations as$name=>$mutate){$body=$seeds['checkpoint'];$mutate($body);yield[$name,$encode($body),false];}
    foreach(['checkpoint','finish']as$seedName){
        foreach(['retainedTopPositive','retainedTopNegative','retainedEvent','retainedSettings','overwrittenCharacters','overwrittenChart','overwrittenCursor','metricsExtraRejected']as$name){
            $body=$seeds[$seedName];$c=&$body['candidate'];
            if($name==='retainedTopPositive'||$name==='retainedTopNegative')$c['__overflow']='__literal__';
            elseif($name==='retainedEvent')$c['events'][0]['__overflow']='__literal__';
            elseif($name==='retainedSettings')$c['configuration']['settings']['__overflow']='__literal__';
            elseif($name==='overwrittenCharacters')$c['characters']=['__literal__'];
            elseif($name==='overwrittenChart')$c['timeSeries']=['__literal__'];
            elseif($name==='overwrittenCursor')$c['cursor']='__literal__';
            else$c['metrics']['__overflow']='__literal__';
            unset($c);$raw=str_replace('"__literal__"',$name==='retainedTopNegative'?'-1e999':'1e999',$encode($body));
            yield[$seedName.'-'.$name,$raw,str_starts_with($name,'overwritten')];
        }
    }
    $rawEdges=[
        'nul-overwritten-child'=>'{"candidate":{"characters":{"\u0000bad":1}},"candidate":[]}',
        'nul-key'=>'{"candidate":{"characters":{"\u0000bad":1}}}',
        'interior-nul-key'=>'{"candidate":{"characters":{"a\u0000b":1}}}',
        'invalid-utf8-value'=>"{\"candidate\":\"\xB1\"}",'invalid-utf8-key'=>"{\"\xB1\":1}",
        'depth-513'=>'{"candidate":'.str_repeat('[',513).'0'.str_repeat(']',513).'}',
        'depth-600'=>'{"candidate":'.str_repeat('[',600).'0'.str_repeat(']',600).'}',
        'root-array'=>'[]','root-null'=>'null','trailing-comma'=>'{"candidate":[],}',
        'leading-bom'=>"\xEF\xBB\xBF{}",'lone-surrogate'=>'{"candidate":"\ud800"}',
        'oversize-invalid-json'=>str_repeat(' ',2097153),
    ];
    foreach($rawEdges as$name=>$raw)yield[$name,$raw,false];
};
$rows=[];$failed=0;$accepted=0;$finished=0;
foreach($corpus()as[$name,$raw,$expected]){
    $a=$outcome($raw,'A');$b=$outcome($raw,'B');$pass=$a===$b&&$a['ok']===$expected;
    if(!$pass)$failed++;if($a['ok'])$accepted++;if($a['ok']&&$a['finish'])$finished++;
    $rows[]=['name'=>$name,'rawBytes'=>strlen($raw),'rawSha256'=>hash('sha256',$raw),'expectedAccepted'=>$expected,'equal'=>$a===$b,'pass'=>$pass,'baseline'=>$a,'candidate'=>$b];
}
echo json_encode(['status'=>$failed?'FAILED':'PASS-SCOPED-SEMANTIC-PROJECTION','cases'=>count($rows),'accepted'=>$accepted,'finishPersistenceProjections'=>$finished,'failed'=>$failed,'rows'=>$rows,'candidateIndexSha256'=>hash('sha256',$candidateIndex),'originalIndexSha256'=>hash('sha256',$originalIndex),'exactBlockSha256'=>hash('sha256',$block),'exactBlockBytes'=>strlen($block),'exactSingleInsertionReverse'=>true,'managedMemoryLimit'=>ini_get('memory_limit'),'peakManagedAllocatedBytes'=>memory_get_peak_usage(true),'realRequestBodyDecoder'=>true,'realArenaEvidencePrepare'=>true,'realSessionValidator'=>true,'realDataServiceConstructor'=>true,'realDatabaseJsonForEvidenceColumn'=>true,'noDatabaseConnection'=>true,'actualSqlPersistencePerformed'=>false,'scope'=>'Class-level body decode, owner/code envelope and real ArenaEvidence preparation comparison. Full evidence_json bytes use actual Database::json; finish full validated bundle is compared byte-for-byte. Auth/CSRF/API-rate/HTTP and real SQL persistence are not certified here. Exact original dispatcher2MB check remains before complete decode and the new projection block. Native/index acceptance must run after any adoption.'],JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
exit($failed?1:0);
