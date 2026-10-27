<?php
declare(strict_types=1);
namespace SparowType;

/** Gregorian dates in an anchored IANA zone, never elapsed-hours streak arithmetic. */
final class ProgressionCalendar
{
    private static ?array $zones = null;
    public static function date(float|int $at, string $zone): string
    {
        if (!is_finite((float)$at) || $at < 946684800000 || $at > 7289654400000) throw new \InvalidArgumentException('Invalid progression instant.');
        self::$zones ??= array_fill_keys(\DateTimeZone::listIdentifiers(\DateTimeZone::ALL_WITH_BC), true);
        if (!isset(self::$zones[$zone]) && $zone !== 'UTC') throw new \InvalidArgumentException('Use an IANA calendar zone.');
        try { $timeZone = new \DateTimeZone($zone); } catch (\Throwable) { throw new \InvalidArgumentException('Invalid calendar zone.'); }
        return (new \DateTimeImmutable('@'.(string)(int)floor($at / 1000)))->setTimezone($timeZone)->format('Y-m-d');
    }
    public static function day(string $date): int
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date, new \DateTimeZone('UTC'));
        if (!$parsed || $parsed->format('Y-m-d') !== $date) throw new \InvalidArgumentException('Invalid calendar date.');
        return (int)floor($parsed->getTimestamp() / 86400);
    }
    public static function add(string $date, int $days): string { return gmdate('Y-m-d', (self::day($date) + $days) * 86400); }
    public static function week(string $date): string { $day = self::day($date); return self::add($date, -(($day + 3) % 7 + 7) % 7); }
    public static function start(string $date, string $zone): int { self::day($date); return (new \DateTimeImmutable($date.' 00:00:00', new \DateTimeZone($zone)))->getTimestamp() * 1000; }
    public static function emptyStreak(): array { return ['count'=>0,'longest'=>0,'lastDate'=>null,'lastAt'=>null,'zone'=>null,'life'=>null,'repaired'=>false,'brokenAt'=>null,'previousCount'=>0,'freezes'=>[],'autoFreeze'=>false]; }
    public static function freeze(array &$streak, string $id, string $source, string $date): bool
    {
        $streak['freezes'] = array_values(array_filter($streak['freezes'], fn($freeze) => $freeze['expiresDate'] > $date));
        if (count($streak['freezes']) >= 2 || array_filter($streak['freezes'], fn($freeze) => $freeze['source'] === $source)) return false;
        $streak['freezes'][] = ['id'=>$id,'source'=>$source,'earnedDate'=>$date,'expiresDate'=>self::add($date,7)]; return true;
    }
    public static function advance(array &$streak, array $fact): void
    {
        if ($fact['completedChars'] <= 0) return;
        $streak['zone'] ??= $fact['timeZone']; $date = self::date($fact['at'], $streak['zone']);
        $streak['freezes'] = array_values(array_filter($streak['freezes'], fn($freeze) => $freeze['expiresDate'] > $date));
        if ($streak['lastAt'] !== null && $fact['at'] < $streak['lastAt']) return;
        $difference = $streak['lastDate'] ? self::day($date) - self::day($streak['lastDate']) : 0;
        if ($streak['lastDate'] && $difference <= 0) { $streak['lastAt'] = $fact['at']; return; }
        if (!$streak['lastDate']) { $streak['count'] = 1; $streak['life'] = $fact['id']; }
        elseif ($difference === 1) $streak['count']++;
        else {
            $usable = $streak['freezes']; usort($usable, fn($a,$b) => strcmp($a['expiresDate'],$b['expiresDate'])); $used = [];
            for ($index=1;$index<=min($difference-1,3);$index++) { $missed=self::add($streak['lastDate'],$index); foreach ($usable as $freeze) if (!in_array($freeze['id'],$used,true) && $freeze['earnedDate'] <= $missed && $freeze['expiresDate'] > $missed) { $used[]=$freeze['id']; break; } }
            if ($streak['autoFreeze'] && $difference-1<=2 && count($used)===$difference-1) { $streak['freezes']=array_values(array_filter($streak['freezes'],fn($freeze)=>!in_array($freeze['id'],$used,true)));$streak['count']++; }
            else { $broken=self::start(self::add($streak['lastDate'],2),$streak['zone']);$accuracy=$fact['attempts'] ? $fact['correctAttempts']/$fact['attempts']*100 : 0;
                if (!$streak['repaired'] && $fact['lessonQualified'] && $accuracy>=97 && $fact['at']-$broken<=48*3600000) { $streak['repaired']=true;$streak['count']++;$streak['brokenAt']=null; }
                else { $streak['previousCount']=$streak['count'];$streak['brokenAt']=$broken;$streak['count']=1;$streak['life']=$fact['id'];$streak['repaired']=false; }
            }
        }
        $streak['lastDate']=$date;$streak['lastAt']=$fact['at'];$streak['longest']=max($streak['longest'],$streak['count']);
    }
}
