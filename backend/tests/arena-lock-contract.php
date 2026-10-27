<?php
declare(strict_types=1);
// Pure PDO protocol double. No configuration, connection, network or SQL server.
spl_autoload_register(static function(string $class):void {
    $prefix='SparowType\\';if(str_starts_with($class,$prefix))require_once __DIR__.'/../src/'.substr($class,strlen($prefix)).'.php';
});
final class ArenaCreationConnection extends PDO
{
    public array $executed=[],$rooms=[],$members=[];
    public bool $emptyMemberRangeRequested=false;
    public function __construct(){}
    public function prepare(string $query,array $options=[]):PDOStatement|false{return new ArenaCreationStatement($this,$query);}
}
final class ArenaCreationStatement extends PDOStatement
{
    private array $params=[];
    public function __construct(private ArenaCreationConnection $db,private string $query){}
    public function execute(?array $params=null):bool
    {
        $this->params=$params??[];$this->db->executed[]=['sql'=>$this->query,'params'=>$this->params];
        if(str_starts_with($this->query,'INSERT INTO arena_rooms')){
            [$id,$code,$host,$duration,$target,$configuration,$public,$pace,$expiry,$parent]=$this->params;
            $this->db->rooms[$code]=['id'=>$id,'room_code'=>$code,'host_id'=>$host,'duration_seconds'=>$duration,'expected_text'=>$target,'configuration_json'=>$configuration,'is_public'=>$public,'bracket_wpm'=>$pace,'expires_at'=>$expiry,'rematch_of'=>$parent,'status'=>'waiting','version'=>1,'starts_at'=>null,'deadline_at'=>null];
        }elseif(str_starts_with($this->query,'INSERT INTO arena_members')){
            [$room,$owner,$slot,$seen]=$this->params;
            foreach($this->db->members[$room]??[] as $member)if($member['slot']===$slot||$member['user_id']===$owner)throw new RuntimeException('duplicate-seat-in-protocol-double');
            $this->db->members[$room][]=['arena_id'=>$room,'user_id'=>$owner,'slot'=>$slot,'last_seen_at'=>$seen,'status'=>'joined','ready'=>0,'credited_units'=>0,'wpm'=>null,'accuracy'=>null,'elapsed_ms'=>0,'rematch_vote'=>0,'quarantine_reason'=>null,'appeal_requested_at'=>null];
        }elseif(str_starts_with($this->query,'SELECT * FROM arena_members')){
            if(!($this->db->members[$this->params[0]]??[])){$this->db->emptyMemberRangeRequested=true;throw new RuntimeException('empty-member-range-lock-before-first-insert');}
        }elseif(str_starts_with($this->query,'UPDATE arena_rooms SET version'))foreach($this->db->rooms as &$room)if($room['id']===$this->params[0])$room['version']++;
        return true;
    }
    public function fetch(int $mode=PDO::FETCH_DEFAULT,int $cursorOrientation=PDO::FETCH_ORI_NEXT,int $cursorOffset=0):mixed
    {
        return str_starts_with($this->query,'SELECT * FROM arena_rooms')?($this->db->rooms[$this->params[0]]??false):false;
    }
    public function fetchAll(int $mode=PDO::FETCH_DEFAULT,mixed ...$args):array
    {
        if(str_starts_with($this->query,'SELECT * FROM arena_members'))return $this->db->members[$this->params[0]]??[];
        if(str_starts_with($this->query,'SELECT id,handle FROM users'))return array_map(static fn($id)=>['id'=>$id,'handle'=>'member_'.substr($id,0,4)],$this->params);
        return [];
    }
    public function fetchColumn(int $column=0):mixed{return str_starts_with($this->query,'SELECT COUNT(*)')?0:false;}
}
$db=new ArenaCreationConnection();$validator=new \SparowType\SessionValidator();$service=new \SparowType\ArenaService($db,$validator,new \SparowType\DataService($db,$validator,[]));
$owner='11111111-1111-4111-8111-111111111111';$peer='22222222-2222-4222-8222-222222222222';$now=1792584000000.0;
$room=(new ReflectionMethod($service,'create'))->invoke($service,$owner,30,$now);
$firstInsert=array_search(true,array_map(static fn($row)=>str_starts_with($row['sql'],'INSERT INTO arena_members'),$db->executed),true);
$parentInsert=array_search(true,array_map(static fn($row)=>str_starts_with($row['sql'],'INSERT INTO arena_rooms'),$db->executed),true);
$checks=[];
$checks[]=['name'=>'first host insert uses slot0 of exclusively new parent room','pass'=>count($db->members[$room['id']])===1&&$db->members[$room['id']][0]['user_id']===$owner&&$db->members[$room['id']][0]['slot']===0];
$checks[]=['name'=>'new room never locks an empty member index range','pass'=>!$db->emptyMemberRangeRequested&&!array_filter(array_slice($db->executed,0,$firstInsert),static fn($row)=>str_contains($row['sql'],'FROM arena_members'))];
$checks[]=['name'=>'parent insert precedes first host insert in the same transaction path','pass'=>is_int($parentInsert)&&is_int($firstInsert)&&$parentInsert<$firstInsert];
$checks[]=['name'=>'initial host still increments the returned version exactly once','pass'=>$room['version']===2];
$snapshot=(new ReflectionMethod($service,'serialize'))->invoke($service,$room,$owner,false,$now);
$checks[]=['name'=>'serialization sees the already inserted host and correct seat','pass'=>count($snapshot['members'])===1&&$snapshot['members'][0]['id']===$owner&&$snapshot['members'][0]['slot']===0&&!$db->emptyMemberRangeRequested];
$before=count($db->executed);
$locked=(new ReflectionMethod($service,'fetch'))->invoke($service,$room['room_code']);
(new ReflectionMethod($service,'join'))->invoke($service,$locked,$peer,$now);
$operations=array_slice($db->executed,$before);
$checks[]=['name'=>'existing room lookup retains explicit parent FOR UPDATE ownership','pass'=>str_contains($operations[0]['sql'],'FROM arena_rooms')&&str_contains($operations[0]['sql'],'FOR UPDATE')];
$checks[]=['name'=>'existing join retains current member FOR UPDATE read rather than stale snapshot','pass'=>str_contains($operations[1]['sql'],'FROM arena_members')&&str_contains($operations[1]['sql'],'FOR UPDATE')];
$checks[]=['name'=>'existing joins reuse shared insert while preserving unique sequential seats','pass'=>count($db->members[$room['id']])===2&&$db->members[$room['id']][1]['user_id']===$peer&&$db->members[$room['id']][1]['slot']===1];
$failed=count(array_filter($checks,static fn($check)=>!$check['pass']));
echo json_encode(['status'=>$failed?'FAILED':'PASS-SCOPED','scope'=>'Pure PDO query-order contract. No SQL server or genuine parallel transaction is simulated; real concurrent creation is a separate HTTP/capacity gate.','passed'=>count($checks)-$failed,'failed'=>$failed,'checks'=>$checks,'databaseConnected'=>false],JSON_THROW_ON_ERROR);
exit($failed?1:0);
