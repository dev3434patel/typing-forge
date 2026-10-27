<?php
declare(strict_types=1);
spl_autoload_register(static function(string $class):void{$prefix='SparowType'.chr(92);if(!str_starts_with($class,$prefix))return;$name=substr($class,strlen($prefix));if(preg_match('/^[A-Za-z][A-Za-z0-9]*$/D',$name))require_once dirname(__DIR__).'/src/'.$name.'.php';});
$input=json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR);$output=[];
foreach($input as $case){try{
    if(isset($case['scores']))$value=SparowType\SocialDuelRules::winner($case['scores']);
    elseif(isset($case['receipt'])){require_once __DIR__.'/challenge-receipt-double.php';$value=verifyChallengeReceiptCase($case);}
    elseif(array_key_exists('peer',$case))$value=SparowType\SocialDuelRules::configurationForPeer($case['peer']);
    elseif(isset($case['resume'])){$t=$case['resume'];$value=SparowType\ChallengeTimingPolicy::canResume($t['issued'],$t['start'],$t['deadline'],$t['expires'],$t['now']);}
    elseif(isset($case['timing'])){$t=$case['timing'];if($case['replay']??false){SparowType\CompetitiveInputPolicy::preflight($case['candidate']);$validated=(new SparowType\SessionValidator())->validate($case['candidate'],$case['candidate']['ownerScope']);SparowType\CompetitiveInputPolicy::enforceRates($validated['metrics']);}SparowType\ChallengeTimingPolicy::validate($t['issued'],$case['candidate'],$t['start'],$t['deadline'],$t['expires'],$t['now']);$value=true;}
    else{SparowType\SocialDuelRules::verifyCandidate($case['candidate'],$case['duel'],$case['run'],$case['issued']??SparowType\SocialDuelRules::configuration(false));$value=true;}
    $output[]=['value'=>$value];
}catch(Throwable $error){$output[]=['error'=>$error->getMessage(),...($error instanceof SparowType\ApiException?['errorCode'=>$error->errorCode]:[])];}}
echo json_encode($output,JSON_THROW_ON_ERROR);
