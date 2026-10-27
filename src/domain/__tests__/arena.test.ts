import { describe, expect, it } from 'vitest';
import { arenaBracket, arenaCodeValid, arenaCountdown, arenaPlacements, normalizeArenaCode, type ArenaRoom } from '../arena';
describe('arena shared presentation and placement rules', () => {
  it.each(['ABCDEFGH', '01234567', 'A1B2C3D4'])('accepts exact code%s without conflating six-person legacy codes', code => { expect(arenaCodeValid(code)).toBe(true); expect(normalizeArenaCode(` ${code.toLowerCase()} `)).toBe(code); });
  it.each(['', 'ABC123', 'ABCDEFGHI', '<script>', 'abcdefgh', 'A B C D E', '१२३४५६७८'])('rejects invalid code%s', code => expect(arenaCodeValid(code)).toBe(false));
  it.each([0, 1, 9999, 10000, 19999, 20000, 100000, 180000, 999999])('widens bounded measured pace bracket at%s ms', wait => { expect(arenaBracket(wait)).toBe(Math.min(1, .1 + Math.floor(wait / 10000) * .05)); expect(arenaBracket(wait)).toBeLessThanOrEqual(1); });
  it('does not widen a negative wait', () => expect(arenaBracket(-1000)).toBe(.1));
  it.each([0, 999, 1000, 2999, 3000, 6000])('uses server-to-local elapsed time for countdown at%s ms', elapsed => { const room = { startsAt: 10000, serverNow: 7000 } as ArenaRoom; expect(arenaCountdown(room, 2000 + elapsed, 2000)).toBe(Math.max(0, Math.ceil((3000 - elapsed) / 1000))); });
  it('does not infer a pending countdown when no start was issued', () => expect(arenaCountdown({ startsAt: null } as ArenaRoom, 0, 0)).toBe(0));
  it('ranks actual credited progress before accuracy and completion duration', () => {
    const base = { status: 'finished' as const, credited: 100, accuracy: 98, elapsedMs: 15000 };
    expect(arenaPlacements([{ ...base, id: 'a' }, { ...base, id: 'b', credited: 101 }, { ...base, id: 'c', accuracy: 99 }, { ...base, id: 'd', elapsedMs: 14000 }])).toEqual({ b: 1, c: 2, d: 3, a: 4 });
  });
  it('preserves tied ranks and excludes forfeit and quarantined evidence', () => {
    const base = { credited: 100, accuracy: 99, elapsedMs: 15000 };
    expect(arenaPlacements([{ ...base, id: 'b', status: 'finished' }, { ...base, id: 'a', status: 'finished' }, { ...base, id: 'c', status: 'quarantined' }, { ...base, id: 'd', status: 'forfeit' }, { ...base, id: 'e', status: 'racing' }])).toEqual({ a: 1, b: 1 });
  });
  it('does not mutate snapshots or manufacture a placement for an empty room', () => { const members = Object.freeze([]); expect(arenaPlacements(members)).toEqual({}); });
});
