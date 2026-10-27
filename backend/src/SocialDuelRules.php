<?php
declare(strict_types=1);
namespace SparowType;

final class SocialDuelRules
{
    public static function configuration(bool $firstInput = true): array { return ['mode'=>'time','durationMs'=>30000,'language'=>'en','keyboardLayout'=>'qwerty','inputMethod'=>'keyboard','scoringPolicy'=>'prose','contentRevision'=>$firstInput?'forge-social-duel-en-v2':'forge-social-duel-en-v1','correctionPolicy'=>'current-word',...($firstInput?['settings'=>['timingPolicy'=>ChallengeTimingPolicy::FIRST_INPUT]]:[])]; }
    /** The duel row is locked by the caller. Both participants use one cohort. */
    public static function configurationForPeer(?array $peer): array
    {
        $configuration = self::configuration($peer === null || ChallengeTimingPolicy::firstInput($peer));
        if ($peer !== null) {
            if (count($peer) !== count($configuration)) throw new ApiException(422, 'duel-contract', 'The existing duel timing cohort is unsupported.');
            foreach ($configuration as $key => $value) if (!array_key_exists($key, $peer) || $peer[$key] !== $value)
                throw new ApiException(422, 'duel-contract', 'The existing duel timing cohort is unsupported.');
        }
        return $configuration;
    }
    public static function winner(array $scores): ?string
    {
        if(count($scores)!==2||$scores[0]['userId']===$scores[1]['userId'])throw new \InvalidArgumentException('A duel requires two distinct accepted scores.');
        foreach($scores as $score)if((!is_int($score['wpm']??null)&&!is_float($score['wpm']??null))||!is_finite((float)$score['wpm'])||$score['wpm']<0||(!is_int($score['accuracy']??null)&&!is_float($score['accuracy']??null))||!is_finite((float)$score['accuracy'])||$score['accuracy']<0||$score['accuracy']>100||!($score['sourceSessionId']??null))throw new \InvalidArgumentException('Invalid accepted duel score.');
        $difference=($scores[0]['wpm']-$scores[1]['wpm'])?:($scores[0]['accuracy']-$scores[1]['accuracy']);return $difference==0?null:($difference>0?$scores[0]['userId']:$scores[1]['userId']);
    }
    public static function verifyCandidate(array $candidate,array $duel,array $run,array $issued): void
    {
        $config=$candidate['configuration']??[];
        if(!is_array($config))throw new ApiException(422,'duel-contract','A canonical configuration object is required.');
        if(($config['challengeId']??null)!==$run['challenge_id']||($candidate['targetText']??null)!==$duel['expected_text']||($candidate['initialTarget']??null)!==$duel['expected_text'])throw new ApiException(422,'duel-source','Use this duel’s server-issued passage and challenge.');
        foreach(self::configurationForPeer($issued) as $key=>$value)if(($config[$key]??null)!==$value)throw new ApiException(422,'duel-contract','Use the unchanged strict 30-second duel configuration.');
    }
}
