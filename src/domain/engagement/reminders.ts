export interface ReminderPreferences { version: 1; enabled: boolean; hour: number; timeZone: string; lastAt: number | null; lastDate: string | null }
export interface ReminderMessage { id: string; title: string; body: string }
export interface ReminderProvider { send(message: ReminderMessage): Promise<void> }
function localDate(at: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function reminderDue(preferences: ReminderPreferences, at: number, typing: boolean): ReminderMessage | null {
  if (!preferences.enabled || typing || !Number.isFinite(at) || !Number.isInteger(preferences.hour) || preferences.hour < 0 || preferences.hour > 23) return null;
  const date = localDate(at, preferences.timeZone);
  if (preferences.lastDate && date <= preferences.lastDate || preferences.lastAt !== null && at - preferences.lastAt < 86_400_000) return null;
  const hour = Number(new Intl.DateTimeFormat('en-GB-u-nu-latn', { timeZone: preferences.timeZone, hour: '2-digit', hourCycle: 'h23' }).format(at));
  return hour < preferences.hour ? null : { id: `reminder:${date}`, title: 'A little space to practise', body: 'Two quiet minutes are available whenever it suits you.' };
}
export function markReminder(preferences: ReminderPreferences, at: number): ReminderPreferences { return { ...preferences, lastAt: at, lastDate: localDate(at, preferences.timeZone) }; }
export function suggestedReminderHour(instants: readonly number[], timeZone: string): number {
  const counts = Array.from({ length: 24 }, () => 0);
  for (const instant of instants) if (Number.isFinite(instant)) counts[Number(new Intl.DateTimeFormat('en-GB-u-nu-latn', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(instant))]++;
  return instants.length < 3 ? 18 : counts.indexOf(Math.max(...counts));
}
