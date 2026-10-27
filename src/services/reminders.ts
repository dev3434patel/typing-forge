import { markReminder, reminderDue, type ReminderMessage, type ReminderPreferences, type ReminderProvider } from '@/domain/engagement/reminders';
export const reminderKey = (owner: string) => `sparowtype.reminders.v1:${encodeURIComponent(owner)}`;
const blockedResets = new Set<string>();
export function readReminderPreferences(owner: string): ReminderPreferences {
  const initial: ReminderPreferences = { version: 1, enabled: false, hour: 18, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', lastAt: null, lastDate: null };
  if (blockedResets.has(owner)) return initial;
  try {
    const stored = JSON.parse(localStorage.getItem(reminderKey(owner)) || 'null');
    if (stored?.version !== 1 || typeof stored.enabled !== 'boolean' || !Number.isInteger(stored.hour) || stored.hour < 0 || stored.hour > 23 || typeof stored.timeZone !== 'string' || stored.lastAt !== null && (!Number.isFinite(stored.lastAt) || stored.lastAt < 0) || stored.lastDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(stored.lastDate)) return initial;
    new Intl.DateTimeFormat('en', { timeZone: stored.timeZone }); return stored;
  } catch { return initial; }
}
export function saveReminderPreferences(owner: string, value: ReminderPreferences): void {
  if (!owner.trim()) throw new Error('Choose a workspace first.');
  // Roundtrip is required: memory-only reminders cannot guarantee a shared daily cap.
  const current = readReminderPreferences(owner);
  const next = current.lastAt !== null && (value.lastAt === null || current.lastAt > value.lastAt) ? { ...value, lastAt: current.lastAt, lastDate: current.lastDate } : value;
  localStorage.setItem(reminderKey(owner), JSON.stringify(next));
  if (localStorage.getItem(reminderKey(owner)) !== JSON.stringify(next)) throw new Error('Reminders need working local storage.');
  blockedResets.delete(owner);
  window.dispatchEvent(new Event('sparowtype:reminders-changed'));
}
export class LocalReminderProvider implements ReminderProvider {
  constructor(readonly ownerId: string) {}
  async send(message: ReminderMessage): Promise<void> { window.dispatchEvent(new CustomEvent('sparowtype:local-reminder', { detail: { ...message, ownerId: this.ownerId } })); }
}
export async function checkReminder(owner: string, typing: boolean, provider: ReminderProvider = new LocalReminderProvider(owner), at = Date.now()): Promise<void> {
  if (!navigator.locks) return; // No unsafe cross-tab best-effort fallback.
  await navigator.locks.request(`sparowtype-reminder:${owner}`, async () => {
    const preferences = readReminderPreferences(owner), message = reminderDue(preferences, at, typing);
    if (!message) return;
    saveReminderPreferences(owner, markReminder(preferences, at));
    await provider.send(message); // Journal first: failed delivery never triggers a same-day spam retry.
  });
}
export function clearReminders(owner: string): void {
  blockedResets.add(owner);
  let failed = false;
  try { localStorage.removeItem(reminderKey(owner)); blockedResets.delete(owner); } catch { failed = true; }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sparowtype:reminders-changed'));
  if (failed) throw new Error('Reminders are disabled for this visit. Their persistent settings could not be removed because storage is blocked.');
}
