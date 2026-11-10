<?php
declare(strict_types=1);
namespace SparowType;
use PDO;

/** Replay and immutable-prefix acceptance; never trusts client metrics. */
final class ArenaEvidence
{
    public function __construct(private PDO $db,private ?SessionValidator $validator,private ?DataService $data){}
    /** Validate client evidence before taking account/room locks. None of these
     * checks reads mutable room state. Issuance, prefix, membership and the
     * authoritative shared-clock replay are still checked under the room lock.
     */
    public function prepare(array $body,array $user): array
    {
        $candidate=$body['candidate']??null;$finish=$body['finish']??false;
        if(!is_array($candidate)||!is_bool($finish))throw new ApiException(422,'arena-candidate','Send canonical evidence and a boolean finish flag.');
        ArenaRules::preflight($candidate);
        $validator=$this->validator;
        if($validator===null)throw new \LogicException('Arena submission requires a validator.');
        $validated=$finish?$validator->validate($candidate,$user['id'],false,false):$validator->validateCheckpoint($candidate,$user['id']);
        if($finish&&$this->data===null)throw new \LogicException('Arena finish requires persistence.');
        return ['finish'=>$finish,'validated'=>$validated];
    }
    public function submit(array $room,array $member,array $prepared,array $user,float $now): void
    {
        $finish=$prepared['finish'];$validator=$this->validator;$data=$this->data;
        if($validator===null)throw new \LogicException('Arena submission requires a validator.');
        if($finish&&$data===null)throw new \LogicException('Arena finish requires persistence.');
        $validated=$prepared['validated'];$candidate=$validated['candidate'];
        ArenaRules::validateIssued($room,$candidate);$grew=ArenaRules::prefix($member,$candidate);
        $start=ArenaRules::milliseconds($room['starts_at']);$deadline=ArenaRules::milliseconds($room['deadline_at']);
        if($start===null||$deadline===null||$now<$start||$candidate['startedAtWall']!==(int)$start)throw new ApiException(422,'arena-start','Use the authoritative arena start.');
        $duration=(int)$room['duration_seconds']*1000;$elapsed=min($duration,max(0,$now-$start));
        if($candidate['elapsedMs']>$elapsed+250)throw new ApiException(422,'arena-time','Evidence exceeds the server clock.');
        foreach($candidate['events'] as $event)if($event['offsetMs']>$elapsed+250||$event['offsetMs']>$duration)throw new ApiException(422,'arena-event-time','An event is later than the shared deadline.');
        if(in_array($member['status'],['forfeit','quarantined'],true))throw new ApiException(409,'arena-closed','This participant is no longer eligible to submit.');
        if($member['status']==='finished'){
            if($grew||!$finish)throw new ApiException(409,'arena-finished','Finished evidence is immutable.');
            if($member['evidence_json']===null||SessionValidator::stablePayload(Database::decode($member['evidence_json']))!==SessionValidator::stablePayload($candidate))throw new ApiException(409,'arena-final-conflict','The immutable finish evidence changed.');
            return;
        }
        if($room['status']!=='active'||$now>$deadline+ArenaRules::FINISH_GRACE_MS)throw new ApiException(409,'arena-inactive','The arena no longer accepts new evidence.');
        if($elapsed<(float)$member['elapsed_ms'])throw new ApiException(409,'arena-stale-evidence','A newer arena checkpoint was already accepted. Refresh before submitting again.');
        $replay=$validator->replay($candidate['configuration'],$candidate['events'],$elapsed,['targetText'=>$room['expected_text'],'finiteFinal'=>$finish,'includeTimeSeries'=>$finish]);$metrics=$replay['metrics'];
        $exact=$replay['finalText']===$room['expected_text'];
        if($finish&&$now<$deadline&&!$exact)throw new ApiException(409,'arena-finish-early','Use Leave to forfeit early, or type until the shared deadline.');
        $flag=ArenaRules::quarantine($candidate,$metrics);
        $fingerprint=hash('sha256',Database::json([$room['expected_text'],$candidate['events']]));
        if(count($candidate['events'])>=10){$query=$this->db->prepare('SELECT arena_id FROM arena_members WHERE user_id=? AND event_hash=? AND arena_id<>? LIMIT 1');$query->execute([$user['id'],$fingerprint,$room['id']]);if($query->fetchColumn())$flag='reused-event-stream';}
        $status=$flag!==null?'quarantined':($finish?'finished':'racing');
        $statement=$this->db->prepare('UPDATE arena_members SET status=?,client_session_id=?,events_json=?,evidence_json=?,metrics_json=?,event_hash=?,sequence_count=?,credited_units=?,accuracy=?,wpm=?,elapsed_ms=?,last_seen_at=GREATEST(last_seen_at,?),finished_at=?,quarantine_reason=? WHERE arena_id=? AND user_id=?');
        $statement->execute([$status,$candidate['clientSessionId'],Database::json($candidate['events']),$finish||$flag!==null?Database::json($candidate):null,Database::json($metrics),$fingerprint,count($candidate['events']),$metrics['creditedUnits'],$metrics['inputAccuracy'],$metrics['wpm'],$elapsed,Database::timestamp($now),$finish||$flag!==null?Database::timestamp($now):null,$flag,$room['id'],$user['id']]);
        if($finish&&$flag===null)$data->commitValidated($user,$candidate,$validated,['raceId'=>$room['id'],'elapsedMs'=>$elapsed,'metrics'=>$metrics,'timeSeries'=>$replay['timeSeries'],'finishedAtWall'=>$now,'personalBestEligible'=>false,'eligibility'=>['eligible'=>false,'reasons'=>['arena-has-separate-placements'],'verification'=>'php-arena-replayed','automationRisk'=>'Plausibility checks do not prove human input.']]);
    }
}
