<?php
declare(strict_types=1);
namespace SparowType;

final class ProgressionQuests
{
    private static function hash(string $text): int { $hash=2166136261;foreach(unpack('C*',$text) as $byte) $hash=(($hash^$byte)*16777619)&0xffffffff;return $hash; }
    public static function daily(string $owner,string $date,array $skills,bool $rerolled=false,?string $scope=null): array
    {
        ProgressionCalendar::day($date);$keys=array_map('strval',array_keys(array_filter($skills['keys'],fn($key)=>$key['n']>=20 && $key['accuracy']<.92)));
        usort($keys,fn($a,$b)=>($skills['keys'][$a]['accuracy']<=>$skills['keys'][$b]['accuracy'])?:strcmp($a,$b));$weak=$keys[0]??null;
        $templates=$weak!==null?['accuracy','lesson','game','pb30','weak-key','weak-key']:['accuracy','lesson','game','pb30'];$chosen=[];$seed=self::hash($owner.':'.$date.':'.(int)$rerolled);
        while(count($chosen)<3){$index=$seed%count($templates);$template=$templates[$index];if(!in_array($template,$chosen,true))$chosen[]=$template;array_splice($templates,$index,1);$seed=(($seed^0x9e3779b9)*1664525)&0xffffffff;}
        return array_map(fn($template)=>['id'=>'daily:'.$date.':'.$template.':'.(int)$rerolled,'template'=>$template,'date'=>$date,'goal'=>$template==='accuracy'?300:($template==='weak-key'?50:1),'progress'=>0,'reward'=>25,'targetKey'=>$template==='weak-key'?$weak:null,'targetScope'=>$template==='weak-key'?$scope:null,'completedBy'=>null],$chosen);
    }
    public static function weekly(string $date): array { $week=ProgressionCalendar::week($date);return ['id'=>'weekly:'.$week,'template'=>'weekly','date'=>$week,'goal'=>5,'progress'=>0,'reward'=>75,'targetKey'=>null,'targetScope'=>null,'completedBy'=>null]; }
    public static function period(array $quest,string $date): bool { return $quest['template']==='weekly' ? $date >= $quest['date'] && $date < ProgressionCalendar::add($quest['date'],7) : $date===$quest['date']; }
    public static function advance(array &$quest,array $fact): void
    {
        if($quest['completedBy'])return;$accuracy=$fact['attempts']?$fact['correctAttempts']/$fact['attempts']*100:0;
        $addition=match($quest['template']){'accuracy'=>$accuracy>=96?$fact['completedChars']:0,'lesson'=>(int)$fact['lessonQualified'],'game'=>(int)($fact['kind']==='game'&&$fact['completedChars']>0),'pb30'=>(int)$fact['personalBest30'],'weak-key'=>($quest['targetScope']!==($fact['skillScope']??'en|qwerty|keyboard|prose'))?0:array_sum(array_column(array_filter($fact['skills'],fn($sample)=>$sample['group']==='keys'&&$sample['key']===$quest['targetKey']),'correct')),default=>(int)($fact['completedChars']>0)};
        $quest['progress']=min($quest['goal'],$quest['progress']+$addition);if($quest['progress'] >= $quest['goal'])$quest['completedBy']=$fact['id'];
    }
}
