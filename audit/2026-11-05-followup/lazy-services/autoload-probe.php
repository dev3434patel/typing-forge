<?php
declare(strict_types=1);
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);
$variant=$input['variant']??null;$mode=$input['mode']??null;
if(!in_array($variant,['baseline','candidate'],true))throw new RuntimeException('Unknown pure variant.');
$projectRoot=dirname(__DIR__,3);$loaded=[];
spl_autoload_register(static function(string $class)use($variant,$projectRoot,&$loaded):void{
    $prefix='SparowType\\';if(!str_starts_with($class,$prefix))throw new RuntimeException('Unexpected autoload namespace.');
    $relative=substr($class,strlen($prefix));if(!preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$relative))throw new RuntimeException('Unexpected class name.');
    $loaded[]=$relative;
    $file=in_array($relative,['ArenaService','ArenaEvidence'],true)?__DIR__.'/'.$variant.'/backend/src/'.$relative.'.php':$projectRoot.'/backend/src/'.$relative.'.php';
    require_once $file;
});
set_error_handler(static function(int $severity,string $message,string $file,int $line):never{throw new ErrorException($message,0,$severity,$file,$line);});
final class LazyProbeConnection extends PDO{
    public array $writes=[];
    public function __construct(){}
    public function prepare(string $query,array $options=[]):PDOStatement|false{return new LazyProbeStatement($this,$query);}
}
final class LazyProbeStatement extends PDOStatement{
    public function __construct(private LazyProbeConnection $db,private string $query){}
    public function execute(?array $params=null):bool{$this->db->writes[]=['sql'=>$this->query,'params'=>$params];return true;}
    public function fetchColumn(int $column=0):mixed{return false;}
}
$db=new LazyProbeConnection();$validator=null;$data=null;$service=null;$evidence=null;$prepared=null;$error=null;$identity=true;
$owner='11111111-1111-4111-8111-111111111111';$id='33333333-3333-4333-8333-333333333333';$start=1793793600000;$target='calm clear river';
try{
    if($mode==='non-submit'){
        if($variant==='baseline'){$validator=new SparowType\SessionValidator();$data=new SparowType\DataService($db,$validator,[]);}
        $service=new SparowType\ArenaService($db,$validator,$data);
    }elseif(in_array($mode,['checkpoint','finish','finish-missing-data'],true)){
        $validator=new SparowType\SessionValidator();
        if($variant==='baseline'||$mode==='finish')$data=new SparowType\DataService($db,$validator,[]);
        $service=new SparowType\ArenaService($db,$validator,$data);$evidence=new SparowType\ArenaEvidence($db,$validator,$data);
        $identity=(new ReflectionProperty($service,'validator'))->getValue($service)===$validator&&(new ReflectionProperty($evidence,'validator'))->getValue($evidence)===$validator;
        $finish=$mode!=='checkpoint';$configuration=[...SparowType\ArenaRules::configuration($id,30),'clientSessionId'=>'lazy-proof','ownerScope'=>$owner,'initialTarget'=>$target,'paused'=>false];
        $events=[];foreach(['c','a','l']as$sequence=>$text)$events[]=['sequence'=>$sequence,'offsetMs'=>($sequence+1)*100,'start'=>$sequence,'end'=>$sequence,'type'=>'insert','text'=>$text,'provenance'=>'keyboard'];
        $replay=$validator->replay($configuration,$events,1000,['targetText'=>$target,'finiteFinal'=>$finish]);
        $candidate=['schemaVersion'=>3,'metricsVersion'=>'forge-v3','clientSessionId'=>'lazy-proof','ownerScope'=>$owner,'configuration'=>$configuration,'initialTarget'=>$target,'targetText'=>$target,'finalText'=>'cal','finalTranscript'=>'cal','elapsedMs'=>1000,'wallDurationMs'=>1000,'startedAtWall'=>$start,'finishedAtWall'=>$start+1000,'finishReason'=>'manual','status'=>$finish?'finished':'running','events'=>$events,'pauseIntervals'=>[],'issuedTargetSegments'=>[],'metrics'=>$replay['metrics'],'comparisonKey'=>SparowType\SessionValidator::comparisonKey($configuration)];
        $prepared=$evidence->prepare(['candidate'=>$candidate,'finish'=>$finish],['id'=>$owner]);
        if(!$finish){
            $room=['id'=>$id,'expected_text'=>$target,'configuration_json'=>SparowType\Database::json(SparowType\ArenaRules::configuration($id,30)),'starts_at'=>SparowType\Database::timestamp($start),'deadline_at'=>SparowType\Database::timestamp($start+30000),'duration_seconds'=>30,'status'=>'active'];
            $member=['client_session_id'=>null,'events_json'=>null,'status'=>'racing','elapsed_ms'=>0,'user_id'=>$owner];
            $evidence->submit($room,$member,$prepared,['id'=>$owner],$start+2000);
            $identity=$identity&&(new ReflectionProperty($evidence,'validator'))->getValue($evidence)===$validator;
        }
    }elseif($mode==='malformed-finish'||$mode==='malformed-candidate'||$mode==='missing-validator-prepare'){
        $evidence=new SparowType\ArenaEvidence($db,null,null);
        $body=['candidate'=>['events'=>[]],'finish'=>false];
        if($mode==='malformed-finish')$body['finish']='false';
        if($mode==='malformed-candidate')$body['candidate']='invalid';
        $evidence->prepare($body,['id'=>$owner]);
    }elseif($mode==='missing-validator-submit'||$mode==='missing-data-submit'){
        if($mode==='missing-data-submit')$validator=new SparowType\SessionValidator();
        $evidence=new SparowType\ArenaEvidence($db,$validator,null);
        $evidence->submit([],[],['finish'=>$mode==='missing-data-submit','validated'=>['candidate'=>[]]],['id'=>$owner],$start+1000);
    }else throw new RuntimeException('Unknown pure mode.');
}catch(Throwable $caught){$error=['class'=>$caught::class,'status'=>$caught instanceof SparowType\ApiException?$caught->status:null,'code'=>$caught instanceof SparowType\ApiException?$caught->errorCode:null,'message'=>$caught->getMessage()];}
$summary=['variant'=>$variant,'mode'=>$mode,'loaded'=>$loaded,'validatorLoaded'=>class_exists('SparowType\\SessionValidator',false),'dataLoaded'=>class_exists('SparowType\\DataService',false),'sameValidatorIdentity'=>$identity,'writes'=>$db->writes,'canonicalCandidateSha256'=>$prepared===null?null:hash('sha256',SparowType\Database::json($prepared['validated']['candidate'])),'completeFinishBundle'=>$prepared===null?null:array_key_exists('payloadHash',$prepared['validated']),'checkpointMarker'=>$prepared['validated']['checkpointOnly']??null,'error'=>$error,'databaseConnected'=>false,'privateConfigurationRead'=>false];
echo json_encode($summary,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);
