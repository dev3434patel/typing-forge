import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkReminder, clearReminders, readReminderPreferences, reminderKey, saveReminderPreferences } from '../reminders';
const at = Date.parse('2026-10-21T18:05:00Z');
beforeEach(() => {
  let queue = Promise.resolve();
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('navigator', { locks: { request: (_name: string, action: () => Promise<void>) => { const next = queue.then(action); queue = next.catch(() => undefined); return next; } } });
  saveReminderPreferences('alice', { version: 1, enabled: true, hour: 18, timeZone: 'UTC', lastAt: null, lastDate: null });
});
afterEach(() => vi.unstubAllGlobals());
describe('opt-in reminder delivery journal', () => {
  it('disables delivery immediately even when persistent removal is blocked', async () => {
    const send = vi.fn(async () => undefined);
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new Error('Blocked storage'); });
    try { expect(() => clearReminders('alice')).toThrow('persistent'); await checkReminder('alice', false, { send }, at); expect(readReminderPreferences('alice').enabled).toBe(false); expect(send).not.toHaveBeenCalled(); }
    finally { remove.mockRestore(); clearReminders('alice'); }
  });
  it('serializes two open-tab checks into one delivery and preserves owner separation', async () => {
    const send = vi.fn(async () => undefined);
    await Promise.all([checkReminder('alice', false, { send }, at), checkReminder('alice', false, { send }, at)]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(readReminderPreferences('alice').lastAt).toBe(at);
    expect(readReminderPreferences('bob').lastAt).toBeNull();
  });
  it('cannot overwrite a delivered journal with stale preferences from an open settings form', async () => {
    const stale = readReminderPreferences('alice');
    const send = vi.fn(async () => undefined);
    await checkReminder('alice', false, { send }, at);
    saveReminderPreferences('alice', { ...stale, hour: 19 });
    expect(readReminderPreferences('alice')).toMatchObject({ hour: 19, lastAt: at, lastDate: '2026-10-21' });
    await checkReminder('alice', false, { send }, at + 3600000);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('journals before a failed delivery and does not retry spam on the same day', async () => {
    const send = vi.fn(async () => { throw new Error('Unavailable delivery surface'); });
    await expect(checkReminder('alice', false, { send }, at)).rejects.toThrow('delivery');
    await checkReminder('alice', false, { send }, at + 1000);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('never sends while typing or without cross-tab locks', async () => {
    const send = vi.fn(async () => undefined);
    await checkReminder('alice', true, { send }, at);
    vi.stubGlobal('navigator', {});
    await checkReminder('alice', false, { send }, at);
    expect(send).not.toHaveBeenCalled();
    expect(readReminderPreferences('alice').lastAt).toBeNull();
  });
  it('refuses delivery when the persistent journal cannot be written', async () => {
    const send = vi.fn(async () => undefined);
    const original = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('Blocked storage'); };
    try { await expect(checkReminder('alice', false, { send }, at)).rejects.toThrow('Blocked storage'); }
    finally { localStorage.setItem = original; }
    expect(send).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(reminderKey('alice'))!).lastAt).toBeNull();
  });
});
