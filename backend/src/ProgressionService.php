<?php
declare(strict_types=1);
namespace SparowType;

use PDO;

/** Owner-bound claims reference already accepted evidence, under the account row lock. */
final class ProgressionService
{
    private const TIERS=['Bronze','Silver','Gold','Sapphire','Diamond','Champion','Master'];
    public function __construct(private PDO $db, private SessionValidator $validator) {}
    private function requireSchema(): void { try{$this->db->query('SELECT 1 FROM progression_profiles,progression_receipts,progression_league_members,progression_league_groups LIMIT 0');}catch(\PDOException $error){if((int)($error->errorInfo[1]??0)===1146)throw new ApiException(503,'progression-schema','Verified progression is not installed. Apply backend/migrations/002-progression.sql after the base schema; device practice remains available.');throw $error;} }
    private function lockOwner(string $owner): void { $query=$this->db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE');$query->execute([$owner]);if(!$query->fetchColumn())throw new ApiException(401,'auth-required','This account is no longer available.'); }
    private function source(string $owner): array
    {
        $query=$this->db->prepare('SELECT fact_json,command_json FROM progression_receipts WHERE user_id=? ORDER BY created_at,claim_id');$query->execute([$owner]);$facts=[];$commands=[];
        foreach($query->fetchAll() as $row){if($row['fact_json']!==null)$facts[]=Database::decode($row['fact_json']);if($row['command_json']!==null)$commands[]=Database::decode($row['command_json']);}
        return [$facts,$commands];
    }
    private function profile(string $owner): array { [$facts,$commands]=$this->source($owner);return ProgressionEngine::rebuild($owner,'server-verified',$facts,$commands); }
    public function get(array $user): array { $this->requireSchema();return ['ownerId'=>$user['id'],'profile'=>$this->profile($user['id']),'league'=>$this->league($user['id']),'verification'=>'server-verified']; }
    private static function identity(string $actual,string $expected): void { if($actual!==$expected||strlen($actual)>180)throw new ApiException(422,'idempotency-key','Send the matching Idempotency-Key header.'); }
    private function duplicate(string $owner,string $id,string $hash): bool
    {
        $query=$this->db->prepare('SELECT request_hash FROM progression_receipts WHERE user_id=? AND claim_id=? FOR UPDATE');$query->execute([$owner,$id]);$existing=$query->fetchColumn();
        if($existing!==false&&!hash_equals($existing,$hash))throw new ApiException(409,'claim-conflict','This claim identity was already used for different content.');return $existing!==false;
    }
    private function store(string $owner,string $id,string $hash,?array $fact,?array $command,array $profile): void
    {
        $insert=$this->db->prepare('INSERT INTO progression_receipts(user_id,claim_id,request_hash,fact_json,command_json) VALUES(?,?,?,?,?)');$insert->execute([$owner,$id,$hash,$fact===null?null:Database::json($fact),$command===null?null:Database::json($command)]);
        $save=$this->db->prepare('INSERT INTO progression_profiles(user_id,profile_json,version) VALUES(?,?,1) ON DUPLICATE KEY UPDATE profile_json=VALUES(profile_json),version=version+1,updated_at=CURRENT_TIMESTAMP(3)');$save->execute([$owner,Database::json($profile)]);
    }
    public function claim(array $user,array $body,string $idempotencyKey): array
    {
        Security::owner($body,$user['id']);$sessionId=$body['sessionId']??null;$zone=$body['timeZone']??null;
        $this->requireSchema();
        if(!is_string($sessionId)||!preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/D',$sessionId)||!is_string($zone)||strlen($zone)>100)throw new ApiException(422,'claim','A session identity and IANA calendar zone are required.');
        self::identity($idempotencyKey,'session:'.$sessionId);$now=(int)floor(microtime(true)*1000);
        try { ProgressionCalendar::date($now,$zone); } catch(\Throwable){throw new ApiException(422,'time-zone','Use a valid calendar zone.');}
        $hash=hash('sha256',SessionValidator::stablePayload(['sessionId'=>$sessionId,'timeZone'=>$zone]));
        $this->db->beginTransaction();
        try {
            $this->lockOwner($user['id']);if($this->duplicate($user['id'],$idempotencyKey,$hash)){$profile=$this->profile($user['id']);$this->db->commit();$this->updateLeague($user['id'],$profile,$now);return $this->get($user);}
            $query=$this->db->prepare('SELECT payload_hash,evidence_json,evidence_expires_at,race_id FROM typing_sessions WHERE user_id=? AND client_session_id=? FOR UPDATE');$query->execute([$user['id'],$sessionId]);$row=$query->fetch();
            if(!$row)throw new ApiException(409,'session-not-accepted','The original session must be accepted by the server before rewards can be verified.');
            if($row['evidence_json']===null||strtotime($row['evidence_expires_at'].' UTC')*1000<=$now)throw new ApiException(410,'evidence-expired','The original replay has expired. A new verified reward cannot be minted from its summary.');
            $candidate=Database::decode($row['evidence_json']);$validated=$this->validator->validate($candidate,$user['id'],true);
            if(!hash_equals($row['payload_hash'],$validated['payloadHash']))throw new ApiException(409,'source-integrity','Stored session identity did not match its canonical replay.');
            $fact=ProgressionFacts::fromAccepted($validated,$this->validator,$zone,$now);
            if($row['race_id']!==null){$race=$this->db->prepare('SELECT r.status,r.winner_id,o.finalized FROM race_sessions r JOIN race_outcomes o ON o.race_id=r.id AND o.user_id=? AND o.client_session_id=? WHERE r.id=?');$race->execute([$user['id'],$sessionId,$row['race_id']]);$outcome=$race->fetch();if(!$outcome||!in_array($outcome['status'],['completed','abandoned','cancelled'],true))throw new ApiException(409,'race-not-settled','The authoritative race outcome must settle before its reward can be claimed.');$fact['raceWin']=$outcome['status']==='completed'&&$outcome['winner_id']===$user['id']&&(int)$outcome['finalized']===1;}
            // 30-second PB requires one exact server-approved comparison cohort and an earlier accepted result.
            if(($candidate['configuration']['durationMs']??null)===30000&&$validated['personalBestEligible']&&$validated['metrics']['wpm']!==null){$best=$this->db->prepare('SELECT MAX(wpm) FROM typing_sessions WHERE user_id=? AND client_session_id<>? AND comparison_hash=? AND personal_best_eligible=1 AND created_at<=(SELECT created_at FROM typing_sessions WHERE user_id=? AND client_session_id=?)');$best->execute([$user['id'],$sessionId,hash('sha256',$validated['comparisonKey']),$user['id'],$sessionId]);$previous=$best->fetchColumn();$fact['personalBest30']=$previous!==null&&$previous!==false&&$validated['metrics']['wpm']>(float)$previous;}
            [$facts,$commands]=$this->source($user['id']);$facts[]=$fact;$profile=ProgressionEngine::rebuild($user['id'],'server-verified',$facts,$commands);$this->store($user['id'],$idempotencyKey,$hash,$fact,null,$profile);$this->db->commit();
            $this->updateLeague($user['id'],$profile,$now);return $this->get($user);
        }catch(\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}
    }
    public function command(array $user,array $body,string $idempotencyKey): array
    {
        Security::owner($body,$user['id']);$command=$body['command']??null;
        $this->requireSchema();
        if(!is_array($command)||!is_string($command['id']??null)||!preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/D',$command['id'])||!in_array($command['kind']??null,['buy','equip','reroll','freeze-auto'],true))throw new ApiException(422,'command','Unknown progression command.');
        self::identity($idempotencyKey,'command:'.$command['id']);$request=['id'=>$command['id'],'kind'=>$command['kind'],...(array_key_exists('value',$command)?['value'=>$command['value']]:[])];$hash=hash('sha256',SessionValidator::stablePayload($request));
        $this->db->beginTransaction();try{$this->lockOwner($user['id']);if($this->duplicate($user['id'],$idempotencyKey,$hash)){$this->db->commit();return $this->get($user);}$trusted=$request+['at'=>(int)floor(microtime(true)*1000)];[$facts,$commands]=$this->source($user['id']);$commands[]=$trusted;
            try{$profile=ProgressionEngine::rebuild($user['id'],'server-verified',$facts,$commands);}catch(\InvalidArgumentException $error){throw new ApiException(422,'command-refused',$error->getMessage());}
            $this->store($user['id'],$idempotencyKey,$hash,null,$trusted,$profile);$this->db->commit();return $this->get($user);
        }catch(\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}
    }
    private function updateLeague(string $owner,array $profile,int $now): void
    {
        if($profile['xp']===0)return;$week=ProgressionCalendar::week(ProgressionCalendar::date($now,'UTC'));$lock=$this->db->query('SELECT DATABASE()')->fetchColumn().':progression:'.$week;$lock=substr(hash('sha256',$lock),0,60);
        $acquire=$this->db->prepare('SELECT GET_LOCK(?,2)');$acquire->execute([$lock]);if((int)$acquire->fetchColumn()!==1)return;
        try{$this->db->beginTransaction();$this->lockOwner($owner);$query=$this->db->prepare('SELECT tier,group_no FROM progression_league_members WHERE week_date=? AND user_id=? FOR UPDATE');$query->execute([$week,$owner]);$member=$query->fetch();
            if(!$member){$tier=$this->previousTier($owner,$week);$group=$this->db->prepare('SELECT g.group_no,(SELECT COUNT(*) FROM progression_league_members m WHERE m.week_date=g.week_date AND m.tier=g.tier AND m.group_no=g.group_no) member_count FROM progression_league_groups g WHERE g.week_date=? AND g.tier=? ORDER BY g.group_no DESC LIMIT 1 FOR UPDATE');$group->execute([$week,$tier]);$last=$group->fetch();$number=$last?(int)$last['group_no']:1;if($last&&(int)$last['member_count']>=30)$number++;
                $insert=$this->db->prepare('INSERT INTO progression_league_groups(week_date,tier,group_no,member_count) VALUES(?,?,?,1) ON DUPLICATE KEY UPDATE member_count=member_count+1');$insert->execute([$week,$tier,$number]);$create=$this->db->prepare('INSERT INTO progression_league_members(week_date,tier,group_no,user_id) VALUES(?,?,?,?)');$create->execute([$week,$tier,$number,$owner]);}
            $xp=0;$gameDays=[];foreach($profile['receipts'] as $fact){$amount=ProgressionEngine::xp($fact);if($fact['kind']==='game'){$date=ProgressionCalendar::date($fact['at'],$profile['streak']['zone']??$fact['timeZone']);$amount=min($amount,max(0,1500-($gameDays[$date]??0)));$gameDays[$date]=($gameDays[$date]??0)+$amount;}if(ProgressionCalendar::week(ProgressionCalendar::date($fact['at'],'UTC'))===$week)$xp+=$amount;}
            $update=$this->db->prepare('UPDATE progression_league_members SET xp=?,last_activity=? WHERE week_date=? AND user_id=?');$update->execute([$xp,Database::timestamp($now),$week,$owner]);$this->db->commit();
        }catch(\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}finally{$release=$this->db->prepare('SELECT RELEASE_LOCK(?)');$release->execute([$lock]);}
    }
    private function previousTier(string $owner,string $week): int
    {
        $query=$this->db->prepare('SELECT week_date,tier,group_no FROM progression_league_members WHERE user_id=? AND week_date<? ORDER BY week_date DESC LIMIT 1');$query->execute([$owner,$week]);$previous=$query->fetch();if(!$previous)return 0;$peers=$this->peers($previous['week_date'],(int)$previous['tier'],(int)$previous['group_no']);$position=array_search($owner,array_column($peers,'ownerId'),true);$places=count($peers)>=5?(int)floor(count($peers)*.2):0;$tier=(int)$previous['tier'];return max(0,min(6,$tier+($places&&$position!==false&&$position<$places?1:($places&&$position!==false&&$position>=count($peers)-$places?-1:0))));
    }
    private function peers(string $week,int $tier,int $group): array { $query=$this->db->prepare('SELECT m.user_id ownerId,u.handle,m.xp,m.last_activity FROM progression_league_members m JOIN users u ON u.id=m.user_id WHERE m.week_date=? AND m.tier=? AND m.group_no=? ORDER BY m.xp DESC,m.last_activity ASC,m.user_id ASC');$query->execute([$week,$tier,$group]);return array_map(fn($row)=>['ownerId'=>$row['ownerId'],'handle'=>$row['handle'],'xp'=>(int)$row['xp'],'lastActivity'=>(int)round(strtotime($row['last_activity'].' UTC')*1000)],$query->fetchAll()); }
    private function league(string $owner): ?array { $week=ProgressionCalendar::week(gmdate('Y-m-d'));$query=$this->db->prepare('SELECT tier,group_no FROM progression_league_members WHERE week_date=? AND user_id=?');$query->execute([$week,$owner]);$member=$query->fetch();if(!$member)return null;$tier=(int)$member['tier'];$peers=$this->peers($week,$tier,(int)$member['group_no']);$position=array_search($owner,array_column($peers,'ownerId'),true);$places=count($peers)>=5?(int)floor(count($peers)*.2):0;return ['week'=>$week,'tier'=>self::TIERS[$tier],'peers'=>$peers,'rank'=>$position===false?null:$position+1,'promotionPlaces'=>$tier===6?0:$places,'relegationPlaces'=>$tier===0?0:$places,'verified'=>true]; }
    /** Called by account-data reset/export integrations. Account deletion cascades in SQL. */
    public function clear(string $owner): void { foreach(['progression_league_members','progression_receipts','progression_profiles'] as $table){$query=$this->db->prepare('DELETE FROM '.$table.' WHERE '.($table==='progression_league_members'?'user_id':'user_id').'=?');$query->execute([$owner]);} }
}
