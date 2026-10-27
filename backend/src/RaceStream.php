<?php
declare(strict_types=1);
namespace SparowType;

use PDO;

/** Bounded authenticated SSE snapshots; canonical progress still uses existing POST operations. */
final class RaceStream
{
    public function __construct(private PDO $db,private RaceService $races,private array $config) {}
    public static function capabilities(array $config): array
    {
        $safeRuntime=!in_array(PHP_SAPI,['cli','cli-server'],true);
        return ['sse'=>$safeRuntime&&($config['race_stream_enabled']??true)===true,'maxStreamSeconds'=>15,'players'=>2];
    }
    private static function emit(string $event,array $data,?int $id=null): void
    {
        if($id!==null)echo 'id: '.$id."\n";
        echo 'event: '.$event."\n".'data: '.Database::json($data)."\n\n";
        flush();
    }
    public function run(array $user,array $query): void
    {
        Security::owner($query,$user['id']);
        if(!self::capabilities($this->config)['sse'])throw new ApiException(503,'stream-unavailable','Streaming is unavailable on this PHP runtime. Snapshot polling remains available.');
        $code=$query['code']??null;if(!is_string($code)||!preg_match('/^[A-Z0-9]{6}$/D',$code))throw new ApiException(422,'invalid-room-code','Enter the six character room code.');
        // One bounded stream per owner. Extra tabs safely fall back to independent authenticated polling.
        $namespace=$this->db->query('SELECT DATABASE()')->fetchColumn();$lock=substr(hash('sha256',$namespace.':race-stream:'.$user['id']),0,60);
        $acquire=$this->db->prepare('SELECT GET_LOCK(?,0)');$acquire->execute([$lock]);if((int)$acquire->fetchColumn()!==1)throw new ApiException(409,'stream-open','This account already has an open room stream.');
        $started=false;
        try{
            // Authorize room membership before any event-stream headers or content escape.
            $snapshot=$this->races->handle('get',['code'=>$code],$user);$authVersion=(int)($_SESSION['auth_version']??0);
            if(session_status()===PHP_SESSION_ACTIVE)session_write_close();
            header('Content-Type: text/event-stream; charset=utf-8');header('Cache-Control: no-cache, no-store, private');header('X-Accel-Buffering: no');
            ini_set('zlib.output_compression','0');ini_set('implicit_flush','1');
            while(ob_get_level()>0){if(!ob_end_flush())break;}
            if(function_exists('set_time_limit'))set_time_limit(20);
            $started=true;$begin=hrtime(true);$lastVersion=-1;$lastHeartbeat=0;
            do{
                if(connection_aborted())break;
                $valid=$this->db->prepare('SELECT auth_version FROM users WHERE id=?');$valid->execute([$user['id']]);$current=$valid->fetchColumn();
                if($current===false||(int)$current!==$authVersion){self::emit('auth-error',['code'=>'authentication-changed']);break;}
                $room=$snapshot['room'];
                if((int)$room['version']>$lastVersion){self::emit('room',$snapshot,(int)$room['version']);$lastVersion=(int)$room['version'];}
                $elapsed=(hrtime(true)-$begin)/1e9;
                if(in_array($room['status'],['completed','cancelled','abandoned'],true))break;
                if($elapsed>=15){self::emit('reconnect',['afterMs'=>500]);break;}
                if($elapsed-$lastHeartbeat>=5){self::emit('heartbeat',['serverNow'=>$room['server_now']??null]);$lastHeartbeat=$elapsed;}
                // No account/room/database transaction or PHP session lock spans this bounded wait.
                usleep(500000);$snapshot=$this->races->handle('get',['code'=>$code],$user);
            }while(true);
        }catch(\Throwable $error){
            if(!$started)throw $error;
            // Do not append a JSON/HTML exception body to an already-open event stream.
            self::emit('auth-error',['code'=>$error instanceof ApiException?$error->errorCode:'stream-interrupted']);
        }finally{$release=$this->db->prepare('SELECT RELEASE_LOCK(?)');$release->execute([$lock]);}
    }
}
