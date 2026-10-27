const DAY = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();
export function validTimeZone(zone: string): boolean {
  if (typeof zone !== 'string' || zone.length > 100) return false;
  if (formatters.has(zone)) return true;
  try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(0); return true; } catch { return false; }
}
export function dateInZone(at: number, zone: string): string {
  if (!Number.isFinite(at) || at < 946684800000 || at > 7289654400000 || !validTimeZone(zone)) throw new Error('Invalid progression instant or calendar zone');
  let formatter = formatters.get(zone);
  if (!formatter) { formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }); if (formatters.size > 64) formatters.clear(); formatters.set(zone, formatter); }
  const parts = formatter.formatToParts(at);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function dayNumber(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid calendar date');
  const at = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(at) || new Date(at).toISOString().slice(0, 10) !== date) throw new Error('Invalid calendar date');
  return Math.floor(at / DAY);
}
export function addDays(date: string, days: number): string { return new Date((dayNumber(date) + days) * DAY).toISOString().slice(0, 10); }
export function weekKey(date: string): string { const day = dayNumber(date); return addDays(date, -((day + 3) % 7 + 7) % 7); }
/** Local day bounds are found in the named zone, including 23/25-hour DST days. */
export function dayStart(date: string, zone: string): number {
  const ordinal = dayNumber(date); let low = ordinal * DAY - 2 * DAY, high = ordinal * DAY + 2 * DAY;
  while (low < high) { const middle = Math.floor((low + high) / 2); if (dayNumber(dateInZone(middle, zone)) < ordinal) low = middle + 1; else high = middle; }
  return low;
}
export function plausibleDate(date: string, serverAt: number): boolean {
  const day = dayNumber(date);
  return day >= Math.floor((serverAt - 12 * 3_600_000) / DAY) && day <= Math.floor((serverAt + 14 * 3_600_000) / DAY);
}
