import { addDays, dayNumber } from './calendar';
import type { Profile } from './types';
const EPOCH = dayNumber('2026-01-05');
/** Four calendar weeks. Thresholds are editorial defaults, not learning-effect claims. */
export function seasonForDate(date: string) {
  const index = Math.floor((dayNumber(date) - EPOCH) / 28), start = addDays('2026-01-05', index * 28);
  return { id: `season-v1:${start}`, start, end: addDays(start, 27), weeks: [0, 7, 14, 21].map(days => addDays(start, days)) };
}
export function seasonTrack(profile: Pick<Profile, 'weeklyXp' | 'verification'>, date: string) {
  const season = seasonForDate(date);
  const xp = season.weeks.reduce((sum, week) => sum + Math.max(0, profile.weeklyXp[week] ?? 0), 0);
  const palette = ['#C6FF3D', '#77D4FF', '#D0BCFF', '#FFB5D0', '#8BF0BF', '#FFE08A'];
  return { ...season, xp, verification: profile.verification, tiers: Array.from({ length: 30 }, (_, index) => ({ tier: index + 1, threshold: (index + 1) * 500, unlocked: xp >= (index + 1) * 500, rewardId: `${season.id}:banner:${index + 1}`, label: `Season banner ${index + 1}`, color: palette[index % palette.length] })) };
}
