<?php
declare(strict_types=1);
namespace SparowType;

/** Pure arena contracts. These plausibility checks cannot prove human input. */
final class ArenaRules
{
    public const MAX_MEMBERS = 8;
    public const RECONNECT_MS = 20000;
    public const FINISH_GRACE_MS = 3000;
    public static function configuration(string $id, int $duration): array
    {
        return ['mode'=>'race','durationMs'=>$duration*1000,'language'=>'en','script'=>'Latin','keyboardLayout'=>'qwerty',
            'inputMethod'=>'keyboard','scoringPolicy'=>'prose','contentRevision'=>'sparow-arena-v1','challengeId'=>'arena:'.$id,
            'correctionPolicy'=>'current-word','privacy'=>'public-corpus','settings'=>['arenaId'=>$id,'localBot'=>false]];
    }
    public static function milliseconds(?string $value): ?float
    {
        return $value === null ? null : round((float)(new \DateTimeImmutable($value,new \DateTimeZone('UTC')))->format('U.u')*1000);
    }
    public static function duration(mixed $duration): int
    {
        if (!is_int($duration) || !in_array($duration,[15,30,60,120],true)) throw new ApiException(422,'arena-duration','Choose 15, 30, 60 or 120 seconds.');
        return $duration;
    }
    public static function code(mixed $code): string
    {
        if (!is_string($code) || !preg_match('/^[A-Z0-9]{8}$/D',$code)) throw new ApiException(422,'arena-code','Enter the eight-character arena code.');
        return $code;
    }
    public static function validateIssued(array $room,array $candidate): void
    {
        $config=$candidate['configuration'];$issued=Database::decode($room['configuration_json']);
        $allowed=array_merge(array_keys($issued),['clientSessionId','ownerScope','initialTarget','paused']);
        foreach($config as $key=>$_value) if(!in_array($key,$allowed,true)) throw new ApiException(422,'arena-configuration','Use the exact issued arena configuration.');
        foreach($issued as $key=>$value) if(!array_key_exists($key,$config)||$config[$key]!==$value) throw new ApiException(422,'arena-configuration','The arena comparison rules changed.');
        if(($config['paused']??false)!==false||$candidate['pauseIntervals']||$candidate['issuedTargetSegments']||$candidate['initialTarget']!==$room['expected_text']||$candidate['targetText']!==$room['expected_text']) throw new ApiException(422,'arena-target','Arena text, pauses and editing rules must match the server contract.');
    }
    public static function prefix(array $previous,array $candidate): bool
    {
        if($previous['client_session_id']!==null&&$previous['client_session_id']!==$candidate['clientSessionId']) throw new ApiException(409,'arena-session','This arena already has another session for your account.');
        $stored=Database::decode($previous['events_json'],[]);$events=$candidate['events'];
        foreach($stored as $index=>$event) if(!isset($events[$index])||$events[$index]!=$event) throw new ApiException(409,'arena-prefix','Previously accepted arena events cannot be changed or removed.');
        return count($events)>count($stored);
    }
    public static function quarantine(array $candidate,array $metrics): ?string
    {
        try { CompetitiveInputPolicy::preflight($candidate); CompetitiveInputPolicy::enforceRates($metrics); }
        catch(ApiException $error) { if(in_array($error->errorCode,['competitive-burst','competitive-rate'],true)) return $error->errorCode; throw $error; }
        $times=[];foreach($candidate['events'] as $event) if($event['text']!=='') $times[]=$event['offsetMs'];
        if(count($times)>=50){$interval=$times[1]-$times[0];$uniform=true;for($i=2;$i<count($times);$i++)if(abs(($times[$i]-$times[$i-1])-$interval)>0.01){$uniform=false;break;}if($uniform)return 'uniform-input-timing';}
        return null;
    }
    public static function preflight(array $candidate): void
    {
        try { CompetitiveInputPolicy::preflight($candidate); }
        catch(ApiException $error) { if($error->errorCode!=='competitive-burst')throw $error; }
    }
    public static function bracket(float $waitMs): float { return min(1.0,0.1+floor(max(0,$waitMs)/10000)*0.05); }
    /** Public matchmaking lobbies use the same heartbeat grace as an active race.
     * Private invitations retain their existing expiry; no started/evidenced seat
     * can be silently removed by this never-started lobby housekeeping.
     */
    public static function waitingLiveness(array $room,array $members,float $now): array
    {
        $none=['cancel'=>false,'remove'=>[]];
        if(!(bool)($room['is_public']??false)||$room['status']!=='waiting'||($room['starts_at']??null)!==null)return $none;
        $host=null;foreach($members as $member)if($member['user_id']===$room['host_id']){$host=$member;break;}
        if($host===null||$now-self::milliseconds($host['last_seen_at'])>self::RECONNECT_MS)return ['cancel'=>true,'remove'=>[]];
        $remove=[];
        foreach($members as $member){
            if($member['user_id']===$room['host_id']||$member['status']!=='joined'||$now-self::milliseconds($member['last_seen_at'])<=self::RECONNECT_MS)continue;
            if((int)$member['sequence_count']!==0||(int)$member['credited_units']!==0||(float)$member['elapsed_ms']!==0.0)continue;
            foreach(['client_session_id','events_json','evidence_json','metrics_json','event_hash','finished_at'] as $field)if(($member[$field]??null)!==null)continue 2;
            $remove[]=$member['user_id'];
        }
        return ['cancel'=>false,'remove'=>$remove];
    }
    public static function placements(array $members): array
    {
        $eligible=array_values(array_filter($members,static fn($member)=>$member['status']==='finished'));
        usort($eligible,static fn($a,$b)=>($b['credited_units']<=>$a['credited_units'])?:($b['accuracy']<=>$a['accuracy'])?:($a['elapsed_ms']<=>$b['elapsed_ms'])?:strcmp($a['user_id'],$b['user_id']));
        $result=[];$rank=0;$previous=null;
        foreach($eligible as $index=>$member){$score=[$member['credited_units'],$member['accuracy'],$member['elapsed_ms']];if($score!==$previous)$rank=$index+1;$result[$member['user_id']]=$rank;$previous=$score;}
        return $result;
    }
}
