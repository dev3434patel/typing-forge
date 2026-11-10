<?php
declare(strict_types=1);
namespace SparowType;
use PDO;
use PDOException;

/** Eight real accounts per InnoDB-serialized room. Shared-hosting polling transport. */
final class ArenaServiceProjectionCandidate
{
    private const WORDS=['clear','river','steady','light','calm','signal','practice','bright','focus','slow','learn','flow','cloud','quiet','world','voice','space','craft','field','glow','ocean','warm','north','path'];
    public function __construct(private PDO $db,private SessionValidator $validator,private DataService $data){}
    public function handle(string $action,array $body,array $user): array
    {
        Security::owner($body,$user['id'],false);
        $evidence=null;$prepared=null;$receivedAt=null;
        if($action==='submit'){
            ArenaRules::code($body['code']??null);
            // Validation and lock waits must not advance a submitted event's
            // allowance or consume its finish grace. This receipt comes only
            // from the database clock, never a candidate/body timestamp.
            $receivedAt=$this->now();
            $evidence=new ArenaEvidence($this->db,$this->validator,$this->data);
            $prepared=$evidence->prepare($body,$user);
        }
        $this->db->beginTransaction();
        try{
            $lock=$this->db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');$lock->execute([$user['id']]);if(!$lock->fetchColumn())throw new ApiException(401,'arena-auth','Sign in again.');
            $now=$receivedAt??$this->now();
            if($action==='create')$room=$this->create($user['id'],ArenaRules::duration($body['duration']??30),$now,($body['public']??false)===true);
            elseif($action==='match')$room=$this->match($user['id'],ArenaRules::duration($body['duration']??30),$now);
            else{
                $room=$this->fetch(ArenaRules::code($body['code']??null));$now=$receivedAt??$this->now();$room=$this->settle($room,$now);
                if($action==='join')$this->join($room,$user['id'],$now);
                elseif($action==='spectate'){}
                else{
                    $member=$this->member($room,$user['id']);
                    if($action==='get')$this->heartbeat($room,$member,$now);
                    elseif($action==='ready')$this->ready($room,$member,$body,$now);
                    elseif($action==='submit'){$evidence->submit($room,$member,$prepared,$user,$now);$this->bump($room['id']);}
                    elseif($action==='leave')$this->leave($room,$member,$now);
                    elseif($action==='rematch')$this->rematch($room,$member,$now);
                    elseif($action==='appeal')$this->appeal($room,$member,$now);
                    else throw new ApiException(404,'arena-operation','Unknown arena operation.');
                }
                $room=$this->settle($this->fetch($room['room_code']),$this->now());
            }
            $result=['arena'=>$this->serialize($room,$user['id'],$action==='spectate',$this->now())];$this->db->commit();return $result;
        }catch(\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}
    }
    private function now(): float{return (float)$this->db->query('SELECT UNIX_TIMESTAMP(UTC_TIMESTAMP(3))*1000')->fetchColumn();}
    private function fetch(string $code): array
    {
        $q=$this->db->prepare('SELECT * FROM arena_rooms WHERE room_code=? FOR UPDATE');$q->execute([$code]);$room=$q->fetch();if(!$room)throw new ApiException(404,'arena-not-found','That arena does not exist.');return $room;
    }
    private function members(array $room): array
    {
        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();
    }
    /** Scalar active-state projection; every call retains its fresh row locks. */
    private function activeMembers(array $room): array
    {
        $q=$this->db->prepare('SELECT user_id,status,last_seen_at,credited_units FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();
    }
    /** Public response projection; private canonical evidence stays in members(). */
    private function responseMembers(array $room): array
    {
        $q=$this->db->prepare('SELECT user_id,slot,ready,status,credited_units,wpm,accuracy,elapsed_ms,rematch_vote,quarantine_reason,appeal_requested_at FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();
    }
    private function member(array $room,string $owner): array
    {
        foreach($this->members($room) as $member)if($member['user_id']===$owner)return $member;
        throw new ApiException(403,'arena-membership','Join this arena before accessing member operations.');
    }
    private function bump(string $id): void{$q=$this->db->prepare('UPDATE arena_rooms SET version=version+1 WHERE id=?');$q->execute([$id]);}
    private function baseline(string $owner): float
    {
        $q=$this->db->prepare('SELECT wpm FROM typing_sessions WHERE user_id=? AND wpm BETWEEN 5 AND 500 AND mode<>? ORDER BY created_at DESC LIMIT 20');$q->execute([$owner,'zen']);$values=array_map('floatval',$q->fetchAll(PDO::FETCH_COLUMN));sort($values);return $values?$values[(int)floor(count($values)/2)]:35.0;
    }
    private function create(string $owner,int $duration,float $now,bool $public=false,?string $rematchOf=null): array
    {
        $q=$this->db->prepare('SELECT COUNT(*) FROM arena_rooms WHERE host_id=? AND created_at>?');$q->execute([$owner,Database::timestamp($now-60000)]);if((int)$q->fetchColumn()>=10)throw new ApiException(429,'arena-create-rate','Wait before creating more arenas.');
        $id=Database::uuid();$words=[];for($i=0;$i<800;$i++)$words[]=self::WORDS[random_int(0,count(self::WORDS)-1)];$text=implode(' ',$words);
        for($attempt=0;$attempt<8;$attempt++){
            $code=strtoupper(bin2hex(random_bytes(4)));
            try{$q=$this->db->prepare('INSERT INTO arena_rooms(id,room_code,host_id,duration_seconds,expected_text,configuration_json,is_public,bracket_wpm,expires_at,rematch_of) VALUES(?,?,?,?,?,?,?,?,?,?)');$q->execute([$id,$code,$owner,$duration,$text,Database::json(ArenaRules::configuration($id,$duration)),(int)$public,$this->baseline($owner),Database::timestamp($now+600000),$rematchOf]);
                // This transaction exclusively owns the newly inserted room and
                // the caller's account. Its first seat is necessarily slot0.
                // Locking an empty arena_members index range before this insert
                // creates cross-room gap/insert-intention deadlocks in InnoDB.
                $this->insertMember($id,$owner,0,$now);return $this->fetch($code);}
            catch(PDOException $error){if(($error->errorInfo[1]??null)!==1062)throw $error;}
        }throw new ApiException(503,'arena-code-capacity','Could not allocate an arena code.');
    }
    private function join(array $room,string $owner,float $now): void
    {
        $members=$this->members($room);foreach($members as $member)if($member['user_id']===$owner){$this->heartbeat($room,$member,$now);return;}
        if($room['status']!=='waiting')throw new ApiException(409,'arena-started','This arena already started. Spectating is still available.');
        if(count($members)>=ArenaRules::MAX_MEMBERS)throw new ApiException(409,'arena-full','All eight seats are occupied. You can spectate.');
        $slots=array_column($members,'slot');$slot=0;while(in_array($slot,$slots,false))$slot++;
        $this->insertMember($room['id'],$owner,$slot,$now);
    }
    private function insertMember(string $roomId,string $owner,int $slot,float $now): void
    {
        $q=$this->db->prepare('INSERT INTO arena_members(arena_id,user_id,slot,last_seen_at) VALUES(?,?,?,?)');$q->execute([$roomId,$owner,$slot,Database::timestamp($now)]);$this->bump($roomId);
    }
    private function ready(array $room,array $member,array $body,float $now): void
    {
        if($room['status']!=='waiting')throw new ApiException(409,'arena-not-waiting','Readiness is locked after the countdown starts.');
        if(!is_bool($body['ready']??null))throw new ApiException(422,'arena-ready','Ready must be a boolean.');
        $q=$this->db->prepare('UPDATE arena_members SET ready=?,last_seen_at=? WHERE arena_id=? AND user_id=?');$q->execute([(int)$body['ready'],Database::timestamp($now),$room['id'],$member['user_id']]);
        $this->startWhenReady($room,$now);
        $this->bump($room['id']);
    }
    private function startWhenReady(array $room,float $now): bool
    {
        $members=$this->members($room);if(count($members)<2)return false;
        foreach($members as $member)if(!(bool)$member['ready'])return false;
        $q=$this->db->prepare("UPDATE arena_rooms SET status='countdown',starts_at=?,deadline_at=? WHERE id=?");$q->execute([Database::timestamp($now+3000),Database::timestamp($now+3000+(int)$room['duration_seconds']*1000),$room['id']]);return true;
    }
    private function heartbeat(array $room,array $member,float $now): void
    {
        if(in_array($room['status'],['waiting','countdown','active'],true)&&!in_array($member['status'],['forfeit','quarantined'],true)){$q=$this->db->prepare('UPDATE arena_members SET last_seen_at=? WHERE arena_id=? AND user_id=?');$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);}
    }
    private function leave(array $room,array $member,float $now): void
    {
        if($room['status']==='waiting'){
            if($room['host_id']===$member['user_id']){$q=$this->db->prepare("UPDATE arena_rooms SET status='cancelled',ended_at=? WHERE id=?");$q->execute([Database::timestamp($now),$room['id']]);}
            else{$q=$this->db->prepare('DELETE FROM arena_members WHERE arena_id=? AND user_id=?');$q->execute([$room['id'],$member['user_id']]);}
        }elseif(in_array($room['status'],['countdown','active'],true)&&!in_array($member['status'],['finished','quarantined','forfeit'],true))$this->forfeit($room,$member,$now);
        $this->bump($room['id']);
    }
    private function forfeit(array $room,array $member,float $at): void
    {
        $elapsed=max(0,min((int)$room['duration_seconds']*1000,$at-(ArenaRules::milliseconds($room['starts_at'])??$at)));
        $q=$this->db->prepare("UPDATE arena_members SET status='forfeit',elapsed_ms=?,wpm=?,finished_at=? WHERE arena_id=? AND user_id=?");$q->execute([$elapsed,$elapsed>0?(int)$member['credited_units']*12000/$elapsed:null,Database::timestamp($at),$room['id'],$member['user_id']]);
    }
    private function settle(array $room,float $now): array
    {
        $changed=false;$start=ArenaRules::milliseconds($room['starts_at']);$deadline=ArenaRules::milliseconds($room['deadline_at']);
        if($room['status']==='waiting'){
            $liveness=ArenaRules::waitingLiveness($room,$this->members($room),$now);
            if($now>=ArenaRules::milliseconds($room['expires_at'])||$liveness['cancel']){$q=$this->db->prepare("UPDATE arena_rooms SET status='cancelled',ended_at=? WHERE id=?");$q->execute([Database::timestamp($now),$room['id']]);$room['status']='cancelled';$changed=true;}
            elseif($liveness['remove']){
                // The caller already owns its account, the room and member-row
                // locks. Never lock another account while holding this room.
                $q=$this->db->prepare("DELETE FROM arena_members WHERE arena_id=? AND user_id IN(".implode(',',array_fill(0,count($liveness['remove']),'?')).") AND status='joined' AND sequence_count=0 AND credited_units=0 AND elapsed_ms=0 AND client_session_id IS NULL AND events_json IS NULL AND evidence_json IS NULL AND metrics_json IS NULL AND event_hash IS NULL AND finished_at IS NULL");
                $q->execute([$room['id'],...$liveness['remove']]);$changed=$q->rowCount()>0;
                if($changed&&$this->startWhenReady($room,$now)){$room=$this->fetch($room['room_code']);$start=ArenaRules::milliseconds($room['starts_at']);$deadline=ArenaRules::milliseconds($room['deadline_at']);}
            }
        }
        if($room['status']==='countdown'&&$now>=$start){$q=$this->db->prepare("UPDATE arena_rooms SET status='active' WHERE id=?");$q->execute([$room['id']]);$q=$this->db->prepare("UPDATE arena_members SET status='racing' WHERE arena_id=? AND status='joined'");$q->execute([$room['id']]);$room['status']='active';$changed=true;}
        if($room['status']==='active'){
            $members=$this->activeMembers($room);$active=0;
            foreach($members as $member)if($member['status']==='racing'){
                if($now>=$deadline+ArenaRules::FINISH_GRACE_MS){$duration=(int)$room['duration_seconds']*1000;$q=$this->db->prepare("UPDATE arena_members SET status='finished',elapsed_ms=?,wpm=?,finished_at=? WHERE arena_id=? AND user_id=?");$q->execute([$duration,(int)$member['credited_units']*12000/$duration,Database::timestamp($deadline),$room['id'],$member['user_id']]);$changed=true;}
                elseif($now<$deadline&&$now-ArenaRules::milliseconds($member['last_seen_at'])>ArenaRules::RECONNECT_MS){$this->forfeit($room,$member,ArenaRules::milliseconds($member['last_seen_at'])+ArenaRules::RECONNECT_MS);$changed=true;}
                else $active++;
            }
            if($active===0){$q=$this->db->prepare("UPDATE arena_rooms SET status='completed',ended_at=? WHERE id=?");$q->execute([Database::timestamp(min($now,$deadline)),$room['id']]);$changed=true;}
        }
        if($changed)$this->bump($room['id']);return $changed?$this->fetch($room['room_code']):$room;
    }
    private function match(string $owner,int $duration,float $now): array
    {
        $q=$this->db->prepare('SELECT duration_seconds FROM arena_match_locks WHERE duration_seconds=? FOR UPDATE');$q->execute([$duration]);if(!$q->fetchColumn())throw new ApiException(503,'arena-schema','Import migration005_arena.sql.');
        $q=$this->db->prepare("SELECT * FROM arena_rooms WHERE is_public=1 AND status='waiting' AND duration_seconds=? AND expires_at>? ORDER BY created_at LIMIT 50 FOR UPDATE");$q->execute([$duration,Database::timestamp($now)]);$baseline=$this->baseline($owner);
        foreach($q->fetchAll() as $room){$room=$this->settle($room,$now);if($room['status']!=='waiting')continue;$members=$this->members($room);if(count($members)>=8)continue;foreach($members as $member)if($member['user_id']===$owner){$this->heartbeat($room,$member,$now);return $room;}$wait=$now-ArenaRules::milliseconds($room['created_at']);if(abs($baseline-(float)$room['bracket_wpm'])<=max(1,(float)$room['bracket_wpm'])*ArenaRules::bracket($wait)){$this->join($room,$owner,$now);return $this->fetch($room['room_code']);}}
        return $this->create($owner,$duration,$now,true);
    }
    private function rematch(array $room,array $member,float $now): void
    {
        if(!in_array($room['status'],['completed','cancelled'],true))throw new ApiException(409,'arena-rematch','The current arena must end before rematch voting.');
        $q=$this->db->prepare('UPDATE arena_members SET rematch_vote=1 WHERE arena_id=? AND user_id=?');$q->execute([$room['id'],$member['user_id']]);$members=$this->members($room);$all=count($members)>=2;foreach($members as $value)if(!(bool)$value['rematch_vote'])$all=false;
        $q=$this->db->prepare('SELECT id FROM arena_rooms WHERE rematch_of=?');$q->execute([$room['id']]);
        if($all&&!$q->fetchColumn()){$new=$this->create($room['host_id'],(int)$room['duration_seconds'],$now,false,$room['id']);foreach($members as $value)if($value['user_id']!==$room['host_id'])$this->join($new,$value['user_id'],$now);}
        $this->bump($room['id']);
    }
    private function appeal(array $room,array $member,float $now): void
    {
        if($member['status']!=='quarantined')throw new ApiException(409,'arena-appeal','Only a quarantined result can request review.');
        $q=$this->db->prepare('UPDATE arena_members SET appeal_requested_at=COALESCE(appeal_requested_at,?) WHERE arena_id=? AND user_id=?');$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);$this->bump($room['id']);
    }
    private function serialize(array $room,string $owner,bool $spectator,float $now): array
    {
        $members=$this->responseMembers($room);
        if($members){
            // Only the public response needs handles. Its scalar projection
            // retains fresh member rows and their original write locks.
            // Other accounts must never be write-locked while holding a room.
            $q=$this->db->prepare('SELECT id,handle FROM users WHERE id IN('.implode(',',array_fill(0,count($members),'?')).')');$q->execute(array_column($members,'user_id'));$handles=array_column($q->fetchAll(),'handle','id');
            foreach($members as &$member)$member['handle']=$handles[$member['user_id']]??'Former member';unset($member);
        }
        $placements=ArenaRules::placements($members);$q=$this->db->prepare('SELECT room_code FROM arena_rooms WHERE rematch_of=?');$q->execute([$room['id']]);$rematch=$q->fetchColumn();
        return ['id'=>$room['id'],'code'=>$room['room_code'],'status'=>$room['status'],'version'=>(int)$room['version'],'hostId'=>$room['host_id'],'serverNow'=>$now,'startsAt'=>ArenaRules::milliseconds($room['starts_at']),'deadlineAt'=>ArenaRules::milliseconds($room['deadline_at']),'durationSeconds'=>(int)$room['duration_seconds'],'targetText'=>$room['expected_text'],'configuration'=>Database::decode($room['configuration_json']),'viewerId'=>$owner,'spectator'=>$spectator,'rematchCode'=>$rematch?:null,'reconnectWindowMs'=>ArenaRules::RECONNECT_MS,
            'members'=>array_map(static fn($member)=>['id'=>$member['user_id'],'handle'=>$member['handle'],'slot'=>(int)$member['slot'],'ready'=>(bool)$member['ready'],'status'=>$member['status'],'progress'=>min(100,(int)$member['credited_units']/max(1,strlen($room['expected_text']))*100),'wpm'=>$member['wpm']===null?null:(float)$member['wpm'],'accuracy'=>$member['accuracy']===null?null:(float)$member['accuracy'],'placement'=>$room['status']==='completed'?($placements[$member['user_id']]??null):null,'rematchVote'=>(bool)$member['rematch_vote'],...($member['user_id']===$owner?['quarantineReason'=>$member['quarantine_reason'],'appealRequested'=>$member['appeal_requested_at']!==null]:[])],$members)];
    }
}
