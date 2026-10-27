import { describe, expect, it } from 'vitest';
import { reminderDue, markReminder, suggestedReminderHour, type ReminderPreferences } from './reminders';
import { seasonForDate, seasonTrack } from '../progression/season';
describe('opt-in reminder timing and daily cap', () => {
  const preference = (zone = 'Asia/Kolkata'): ReminderPreferences => ({ version: 1, enabled: true, hour: 18, timeZone: zone, lastAt: null, lastDate: null });
  it('defaults and active typing never produce a reminder', () => {
    const at = Date.parse('2026-10-21T13:00:00Z');
    expect(reminderDue({ ...preference(), enabled: false }, at, false)).toBeNull();
    expect(reminderDue(preference(), at, true)).toBeNull();
    expect(reminderDue(preference(), Date.parse('2026-10-21T10:00:00Z'), false)).toBeNull();
    expect(reminderDue(preference(), at, false)?.id).toBe('reminder:2026-10-21');
  });
  it.each(['UTC', 'Asia/Kolkata', 'America/New_York', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'])('never emits twice in a day or within24hours in %s', zone => {
    const at = Date.parse('2026-03-07T23:00:00Z'); let state = { ...preference(zone), hour: 0 };
    const shown: number[] = [];
    for (let index = 0; index < 120; index++) {
      const time = at + index * 3600000;
      if (reminderDue(state, time, false)) { shown.push(time); state = markReminder(state, time); }
    }
    expect(shown.length).toBeGreaterThan(1);
    for (let index = 1; index < shown.length; index++) expect(shown[index] - shown[index - 1]).toBeGreaterThanOrEqual(86400000);
  });
  it('clock reversal and invalid hours cannot mint a second reminder', () => {
    const at = Date.parse('2026-10-21T13:00:00Z'), state = markReminder(preference(), at);
    expect(reminderDue(state, at - 86400000, false)).toBeNull();
    for (const hour of [-1, 24, 1.5, NaN]) expect(reminderDue({ ...preference(), hour }, at, false)).toBeNull();
  });
  it('suggests an observed hour only after evidence exists', () => {
    expect(suggestedReminderHour([], 'UTC')).toBe(18);
    expect(suggestedReminderHour([0, 3600000, 3600000], 'UTC')).toBe(1);
  });
});
describe('thirty-tier season projection', () => {
  it('keeps a complete four-week calendar and30 distinct scoped rewards', () => {
    const season = seasonForDate('2026-10-21');
    expect(season.weeks).toHaveLength(4);
    const track = seasonTrack({ weeklyXp: { [season.weeks[0]]: 1000, [season.weeks[1]]: 500 }, verification: 'local' }, '2026-10-21');
    expect(track.tiers).toHaveLength(30); expect(track.tiers.filter(tier => tier.unlocked)).toHaveLength(3);
    expect(new Set(track.tiers.map(tier => tier.rewardId)).size).toBe(30);
    expect(track.verification).toBe('local');
  });
  it.each(['2026-01-05', '2026-02-01', '2026-02-02', '2026-12-31', '2027-01-01'])('does not include XP from a different season at%s', date => {
    const season = seasonForDate(date), track = seasonTrack({ weeklyXp: { '2020-01-06': 999999, [season.weeks[0]]: 500 }, verification: 'server-verified' }, date);
    expect(track.xp).toBe(500); expect(track.tiers.filter(tier => tier.unlocked)).toHaveLength(1);
  });
});
