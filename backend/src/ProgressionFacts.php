<?php
declare(strict_types=1);
namespace SparowType;

/** Extracted once from accepted canonical replay, before raw evidence retention expires. */
final class ProgressionFacts
{
    public static function fromAccepted(array $validated, SessionValidator $validator, string $timeZone, int $receivedAt): array
    {
        $candidate=$validated['candidate'];$config=$candidate['configuration'];$settings=is_array($config['settings']??null)?$config['settings']:[];
        ProgressionCalendar::date($receivedAt,$timeZone);
        $eligible=$candidate['finishReason']!=='abandoned'&&($config['scoringPolicy']??null)!=='free'&&($settings['training']['practiceAssist']??false)!==true;
        foreach($candidate['events'] as $event)if(!in_array($event['provenance'],['keyboard','composition'],true))$eligible=false;
        $replay=$validator->replay($config,$candidate['events'],$candidate['elapsedMs'],['targetText'=>$candidate['targetText'],'pauseIntervals'=>$candidate['pauseIntervals'],'finiteFinal'=>true,'issuedTargetSegments'=>$candidate['issuedTargetSegments']]);
        $metrics=$replay['metrics'];$attempts=$replay['attempts'];$contributions=[];
        $reference=json_decode(file_get_contents(dirname(__DIR__).'/resources/progression-fingers-v1.json'),true,512,JSON_THROW_ON_ERROR);
        $language=$config['language']??'en';$layout=$config['keyboardLayout']??'qwerty';$mapping=$reference['maps'][$language.':'.$layout]??($reference['maps']['en:'.$layout]??[]);
        $crossesPause=static function(float $from,float $to)use($candidate):bool{foreach($candidate['pauseIntervals'] as $pause)if($pause['startMs']<$to&&$pause['endMs']>=$from)return true;return false;};
        $individualKeyboard=static fn(array $attempt):bool=>$attempt['provenance']==='keyboard'&&$attempt['eventUnits']===1&&($attempt['compositionId']===null||$attempt['compositionId']==='');
        if($eligible)foreach($attempts as $index=>$attempt){$key=$attempt['expected'];if($key===null||$key==='')continue;$previous=$attempts[$index-1]??null;$before=$attempts[$index-2]??null;$interval=$previous?$attempt['offsetMs']-$previous['offsetMs']:0;
            $individual=$individualKeyboard($attempt);$previousIndividual=$previous&&$individualKeyboard($previous);$paused=$previous&&$crossesPause($previous['offsetMs'],$attempt['offsetMs']);
            $linked=$individual&&$previousIndividual&&$interval>0&&$interval<=2000&&!$paused&&$attempt['position']===$previous['position']+1;$latency=$linked&&$attempt['correct']?$interval:null;
            $samples=['keys'=>$key,'fingers'=>$mapping[$key]??null,'bigrams'=>$linked&&$previous['expected']!==null&&$previous['expected']!==''?$previous['expected'].$key:null,'trigrams'=>$linked&&$before&&$before['expected']!==null&&$before['expected']!==''&&$individualKeyboard($before)&&$previous['position']===$before['position']+1&&$previous['offsetMs']>$before['offsetMs']&&$previous['offsetMs']-$before['offsetMs']<=2000&&!$crossesPause($before['offsetMs'],$previous['offsetMs'])?$before['expected'].$previous['expected'].$key:null];
            foreach($samples as $group=>$sampleKey){if($sampleKey===null||$sampleKey==='')continue;$id=$group.':'.$sampleKey;$sample=$contributions[$id]??['group'=>$group,'key'=>$sampleKey,'n'=>0,'correct'=>0,'timingN'=>0,'ewma'=>null,'weighted'=>0,'lastLatency'=>null];$correct=$attempt['correct']&&($group!=='bigrams'||$previous['correct'])&&($group!=='trigrams'||($before['correct']&&$previous['correct']));$sample['n']++;$sample['correct']+=(int)$correct;if($latency!==null&&$correct){$sample['timingN']++;$sample['ewma']=$sample['ewma']===null?$latency:.8*$sample['ewma']+.2*$latency;$sample['weighted']=.8*$sample['weighted']+.2*$latency;$sample['lastLatency']=$latency;}$contributions[$id]=$sample;}
        }
        $skills=array_values($contributions);usort($skills,fn($a,$b)=>strcmp($a['group'],$b['group'])?:strcmp(mb_convert_encoding($a['key'],'UTF-16BE','UTF-8'),mb_convert_encoding($b['key'],'UTF-16BE','UTF-8')));
        $game=in_array($settings['arcadeGame']??null,['word-invaders','ghost-gp','daily-gauntlet','rhythm-typing','key-tower','snake-words','lava-rise','boss-duel'],true);
        $lessonQualified=$eligible&&($validated['course']['qualifies']??false)===true;
        $composition=($config['inputMethod']??null)==='composition'||count(array_filter($candidate['events'],fn($event)=>$event['provenance']==='composition'))>0;$method=$composition?'composition':(($config['inputMethod']??null)==='virtual'?'virtual':'keyboard');$policy=$config['scoringPolicy']??($config['mode']==='code'?'code':'prose');
        return ['version'=>1,'id'=>$candidate['clientSessionId'],'ownerId'=>$candidate['ownerScope'],'verification'=>'server-verified','payloadHash'=>$validated['payloadHash'],'at'=>$receivedAt,'startedAt'=>$candidate['startedAtWall']??$candidate['finishedAtWall'],'timeZone'=>$timeZone,'kind'=>$game?'game':($lessonQualified?'lesson':($config['mode']==='race'?'race':'practice')),'completedChars'=>$eligible?$metrics['creditedUnits']:0,'attempts'=>$eligible?$metrics['insertionAttempts']:0,'correctAttempts'=>$eligible?$metrics['correctAttempts']:0,'lessonQualified'=>$lessonQualified,'raceWin'=>false,'personalBest30'=>false,'skills'=>$skills,'skillScope'=>implode('|',[$config['language']??'en',$config['keyboardLayout']??'qwerty',$method,$policy])];
    }
}
