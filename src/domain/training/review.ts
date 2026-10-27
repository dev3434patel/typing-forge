export interface ReviewObservation { sessionId: string; key: string; day: string; successful: boolean }
export interface ReviewItem { key: string; stage: number; dueDay: string; lastDay: string }
const intervals = [1, 3, 7] as const;
export function calendarDayNumber(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Use an ISO calendar date.');
  const stamp = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== day) throw new Error('Invalid calendar date.');
  return stamp / 86400000;
}
export function reviewSchedule(observations: readonly ReviewObservation[]): ReviewItem[] {
  const unique = new Set<string>(), items = new Map<string, ReviewItem>();
  for (const observation of [...observations].sort((a, b) => a.day.localeCompare(b.day) || a.sessionId.localeCompare(b.sessionId))) {
    const day = calendarDayNumber(observation.day);
    const identity = `${observation.sessionId}:${observation.key}`;
    if (unique.has(identity)) continue;
    unique.add(identity);
    const previous = items.get(observation.key);
    const stage = observation.successful ? Math.min(2, (previous?.stage ?? -1) + 1) : 0;
    items.set(observation.key, { key: observation.key, stage, lastDay: observation.day, dueDay: new Date((day + intervals[stage]) * 86400000).toISOString().slice(0, 10) });
  }
  return [...items.values()].sort((a, b) => a.dueDay.localeCompare(b.dueDay) || a.key.localeCompare(b.key));
}
/** At most30% review items, deterministic interleaving rather than a blocking queue. */
export function interleaveReview<T>(fresh: readonly T[], due: readonly T[], total = fresh.length): Array<{ item: T; review: boolean }> {
  const count = Math.max(0, Math.floor(total));
  if (!fresh.length || count === 0) return [];
  const budget = Math.min(due.length, Math.floor(count * .3));
  let review = 0, normal = 0;
  return Array.from({ length: count }, (_, index) => {
    const isReview = review < budget && Math.floor((index + 1) * budget / count) > Math.floor(index * budget / count);
    return isReview ? { item: due[review++], review: true } : { item: fresh[normal++ % fresh.length], review: false };
  });
}
