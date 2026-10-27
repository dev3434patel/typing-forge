import { addDays, dateInZone, dayNumber, dayStart } from './calendar';
import type { ActivityFact, Streak } from './types';
export function emptyStreak(): Streak { return { count: 0, longest: 0, lastDate: null, lastAt: null, zone: null, life: null, repaired: false, brokenAt: null, previousCount: 0, freezes: [], autoFreeze: false }; }
export function earnFreeze(streak: Streak, id: string, source: 'quest' | 'purchase', date: string): boolean {
  streak.freezes = streak.freezes.filter(freeze => freeze.expiresDate > date);
  if (streak.freezes.length >= 2 || streak.freezes.some(freeze => freeze.source === source)) return false;
  streak.freezes.push({ id, source, earnedDate: date, expiresDate: addDays(date, 7) }); return true;
}
export function advanceStreak(streak: Streak, fact: ActivityFact): void {
  if (fact.completedChars <= 0) return;
  streak.zone ??= fact.timeZone;
  const date = dateInZone(fact.at, streak.zone);
  streak.freezes = streak.freezes.filter(freeze => freeze.expiresDate > date);
  if (streak.lastAt !== null && fact.at < streak.lastAt) return;
  const difference = streak.lastDate ? dayNumber(date) - dayNumber(streak.lastDate) : 0;
  if (streak.lastDate && difference <= 0) { streak.lastAt = fact.at; return; }
  if (!streak.lastDate) { streak.count = 1; streak.life = fact.id; }
  else if (difference === 1) streak.count++;
  else {
    const missingDates = Array.from({ length: Math.min(difference - 1, 3) }, (_, index) => addDays(streak.lastDate!, index + 1));
    const usable = [...streak.freezes].sort((a, b) => a.expiresDate.localeCompare(b.expiresDate));
    const used: string[] = [];
    for (const missed of missingDates) { const match = usable.find(freeze => !used.includes(freeze.id) && freeze.earnedDate <= missed && freeze.expiresDate > missed); if (match) used.push(match.id); }
    if (streak.autoFreeze && difference - 1 <= 2 && used.length === difference - 1) { streak.freezes = streak.freezes.filter(freeze => !used.includes(freeze.id)); streak.count++; }
    else {
      const brokenAt = dayStart(addDays(streak.lastDate!, 2), streak.zone);
      const accuracy = fact.attempts ? fact.correctAttempts / fact.attempts * 100 : 0;
      if (!streak.repaired && fact.lessonQualified && accuracy >= 97 && fact.at - brokenAt <= 48 * 3_600_000) { streak.repaired = true; streak.count++; streak.brokenAt = null; }
      else { streak.previousCount = streak.count; streak.brokenAt = brokenAt; streak.count = 1; streak.life = fact.id; streak.repaired = false; }
    }
  }
  streak.lastDate = date; streak.lastAt = fact.at; streak.longest = Math.max(streak.longest, streak.count);
}
