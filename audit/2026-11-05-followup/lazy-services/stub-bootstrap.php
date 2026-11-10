<?php
declare(strict_types=1);
namespace SparowTypeAuditIndex;

final class IndexProbe
{
    public static array $trace=[],$arenaArgs=[],$errors=[];
    public static ?object $validator=null,$data=null;
    public static function event(string $name):void{self::$trace[]=$name;}
    public static function fail(\Throwable $error):never{self::$errors[]=['class'=>$error::class,'code'=>$error instanceof \SparowType\ApiException?$error->errorCode:null];throw $error;}
    public static function response(string $name):array{self::event('route.'.$name);$fault=$GLOBALS['lazyIndexCase']['fault']??null;if($fault==='domain')self::fail(new \DomainException('audit-domain-fault'));if($fault==='conflict')self::fail(new \PDOException('audit-conflict-fault',40001));return ['route'=>$name];}
}
final class IndexPDO extends \PDO
{
    public function __construct(){}
    public function inTransaction():bool{return false;}
    public function query(string $query,?int $fetchMode=null,mixed ...$fetchModeArgs):\PDOStatement|false{if($query!=='SELECT MAX(version) FROM schema_metadata')throw new \LogicException('Unexpected fake query.');IndexProbe::event('db.health-query');return new IndexStatement();}
}
final class IndexStatement extends \PDOStatement
{
    public function __construct(){}
    public function fetchColumn(int $column=0):mixed{return 5;}
}
class RouteSpy
{
    public function __construct(\PDO $db,\SparowType\SessionValidator $validator,?\SparowType\DataService $data=null){$name=(new \ReflectionClass($this))->getShortName();IndexProbe::event('ctor.'.$name);if($validator!==IndexProbe::$validator||(func_num_args()>=3&&$data!==IndexProbe::$data))throw new \LogicException('Wrong non-Arena dependency identity.');}
    public function __call(string $method,array $args):array{$name=(new \ReflectionClass($this))->getShortName().'.'.$method;if($method==='handle'&&isset($args[0])&&is_string($args[0]))$name.='.'. $args[0];return IndexProbe::response($name);}
}

spl_autoload_register(static function(string $class):void{
    if(!str_starts_with($class,'SparowType\\'))return;
    IndexProbe::event('load.'.substr($class,11));
    switch($class){
        case 'SparowType\\Security':
            class_alias(SecuritySpy::class,$class);break;
        case 'SparowType\\Database':
            class_alias(DatabaseSpy::class,$class);break;
        case 'SparowType\\AuthService':
            class_alias(AuthSpy::class,$class);break;
        case 'SparowType\\SessionValidator':
            class_alias(ValidatorSpy::class,$class);break;
        case 'SparowType\\DataService':
            class_alias(DataSpy::class,$class);break;
        case 'SparowType\\ArenaService':
            class_alias(ArenaSpy::class,$class);break;
        case 'SparowType\\RaceService':case 'SparowType\\ProgressionService':case 'SparowType\\ClassroomService':case 'SparowType\\SocialService':
            class_alias(RouteSpy::class,$class);break;
        case 'SparowType\\RaceStream':
            class_alias(StreamSpy::class,$class);break;
        default:throw new \LogicException('Unexpected fake autoload.');
    }
});
final class SecuritySpy
{
    public static function beginSession(array $config):void{IndexProbe::event('security.session');}
    public static function apiRate(\PDO $db,array $config,object $auth,bool $arena):?array{IndexProbe::event('security.api-rate.'.($arena?'arena':'other'));if(($GLOBALS['lazyIndexCase']['fault']??null)==='api-rate')IndexProbe::fail(new \SparowType\ApiException(429,'audit-api-rate','audit-api-rate'));return $arena?['id'=>'audit-user']:null;}
    public static function verifyCsrf():void{IndexProbe::event('security.csrf');if(($GLOBALS['lazyIndexCase']['fault']??null)==='csrf')IndexProbe::fail(new \SparowType\ApiException(403,'csrf','audit-csrf'));}
    public static function owner(array $body,string $owner,bool $required=true):void{IndexProbe::event('security.owner');if(($required||array_key_exists('expectedOwner',$body))&&($body['expectedOwner']??null)!==$owner)IndexProbe::fail(new \SparowType\ApiException(409,'owner-changed','The signed-in account changed. Reopen this workspace before retrying.'));}
    public static function rate(\PDO $db,array $config,string $bucket,mixed ...$args):void{IndexProbe::event('security.rate.'.$bucket);}
    public static function csrf():string{return 'audit-csrf';}
}
final class DatabaseSpy
{
    public static function connect(array $config):\PDO{IndexProbe::event('db.connect');return new IndexPDO();}
    public static function json(mixed $value):string{return json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);}
}
final class AuthSpy
{
    public function __construct(\PDO $db,array $config){IndexProbe::event('ctor.auth');}
    public function requireUser():array{IndexProbe::event('auth.require-user');if(($GLOBALS['lazyIndexCase']['fault']??null)==='auth')IndexProbe::fail(new \SparowType\ApiException(401,'auth-required','audit-auth'));return ['id'=>'audit-user'];}
    public function user():array{IndexProbe::event('auth.user');return ['id'=>'audit-user'];}
    public function state():array{return IndexProbe::response('auth.session');}
    public function signup(array $body):array{return IndexProbe::response('auth.signup');}
    public function signin(array $body):array{return IndexProbe::response('auth.signin');}
    public function signout(array $body):array{return IndexProbe::response('auth.signout');}
    public function reset():void{IndexProbe::event('auth.reset');}
}
final class ValidatorSpy
{
    public function __construct(){IndexProbe::event('ctor.validator');IndexProbe::$validator=$this;}
}
final class DataSpy extends RouteSpy
{
    public function __construct(\PDO $db,\SparowType\SessionValidator $validator,array $config){IndexProbe::event('ctor.data');if($validator!==IndexProbe::$validator)throw new \LogicException('Wrong Data validator identity.');IndexProbe::$data=$this;}
    public function captureRequestReceipt():void{IndexProbe::event('data.capture-receipt');}
}
final class ArenaSpy
{
    public function __construct(\PDO $db,?\SparowType\SessionValidator $validator,?\SparowType\DataService $data){IndexProbe::event('ctor.arena');IndexProbe::$arenaArgs=['validator'=>$validator!==null,'data'=>$data!==null,'validatorIdentity'=>$validator===IndexProbe::$validator,'dataIdentity'=>$data===IndexProbe::$data];}
    public function handle(string $action,array $body,array $user):array{IndexProbe::event('route.arena.'.$action);if($action==='submit'){if(!IndexProbe::$arenaArgs['validator'])throw new \LogicException('Submit requires validator.');$finish=$body['finish']??false;if(!is_array($body['candidate']??null)||!is_bool($finish))IndexProbe::fail(new \SparowType\ApiException(422,'arena-candidate','Send canonical evidence and a boolean finish flag.'));if($finish&&!IndexProbe::$arenaArgs['data'])throw new \LogicException('Finish requires Data.');}return ['arena'=>['action'=>$action]];}
}
final class StreamSpy
{
    public static function capabilities(array $config):array{return IndexProbe::response('stream.capabilities');}
}

IndexProbe::event('bootstrap');
return ['allowed_origins'=>['http://audit.invalid'],'api_prefix'=>'/api','max_body_bytes'=>($GLOBALS['lazyIndexCase']['largeLimit']??false)?2048:128];
