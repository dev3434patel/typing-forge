import { describe, expect, expectTypeOf, it } from 'vitest';
import { arenaBracket, arenaCodeValid, arenaCountdown, arenaEvidencePayload, arenaPlacements, normalizeArenaCode, type ArenaEvidencePayload, type ArenaRoom } from '../arena';
import { SessionController, graphemes, type SessionConfig, type SessionResult } from '@/lib/typing-core';
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

describe('Arena HTTP evidence without redundant presentation projections', () => {
  function controller(target: string, overrides: Partial<SessionConfig> = {}) {
    let now = 0;
    const session = new SessionController({
      clientSessionId: 'arena-wire-evidence', ownerScope: '11111111-1111-4111-8111-111111111111',
      mode: 'race', durationMs: 30000, initialTarget: target,
      correctionPolicy: 'current-word', inputMethod: 'keyboard', privacy: 'public-corpus',
      ...overrides,
    }, { now: () => now, wallNow: () => 1793102400000 + now });
    return { session, at(value: number) { now = value; return session; } };
  }
  function expectRetainedFields(full: SessionResult, payload: ArenaEvidencePayload) {
    expect(Object.keys(payload)).toEqual(Object.keys(full).filter(key => !['characters', 'timeSeries', 'cursor'].includes(key)));
    for (const key of Object.keys(payload)) expect(Reflect.get(payload, key)).toBe(Reflect.get(full, key));
    expect(Object.hasOwn(payload, 'characters')).toBe(false);
    expect(Object.hasOwn(payload, 'timeSeries')).toBe(false);
    expect(Object.hasOwn(payload, 'cursor')).toBe(false);
    expectTypeOf(payload).toEqualTypeOf<Omit<SessionResult, 'characters' | 'timeSeries' | 'cursor'>>();
    expectTypeOf(payload.schemaVersion).toEqualTypeOf<3>();
    expect(payload.schemaVersion).toBe(3);
    expect(payload.metricsVersion).toBe('forge-v3');
  }
  it('copies only the envelope while preserving every other frozen evidence field and nested identity', () => {
    const test = controller('cat dog');
    test.session.startAt(0, 1793102400000);
    test.at(100).input({ type: 'insert', text: 'c' });
    const full = Object.freeze({ ...test.at(1500).checkpoint(), futureEvidence: Object.freeze({ provenance: 'retained' }) });
    const original = JSON.stringify(full);
    const payload = arenaEvidencePayload(full);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full.events)).toBe(true);
    expect(payload).not.toBe(full);
    expectRetainedFields(full, payload);
    expect(Reflect.get(payload, 'futureEvidence')).toBe(full.futureEvidence);
    payload.ownerScope = 'another-envelope-owner';
    expect(JSON.stringify(full)).toBe(original);
    expect(full.ownerScope).toBe('11111111-1111-4111-8111-111111111111');
    expect(full.characters.length).toBeGreaterThan(0);
    expect(full.timeSeries.length).toBeGreaterThan(0);
    expect(typeof full.cursor).toBe('number');
  });
  it('retains Unicode edit history, private-content dimensions, pauses and issued targets exactly', () => {
    const test = controller('café 👩‍💻 العربية', {
      clientSessionId: 'arena-wire-unicode', ownerScope: 'unicode-owner', mode: 'time', durationMs: 30000,
      inputMethod: 'composition', privacy: 'private-custom',
      correctionPolicy: 'correct-words-locked', language: 'fr', settings: { note: 'é हिन्दी العربية' },
    });
    test.at(100).input({ type: 'composition', text: 'cafe\u0301', provenance: 'composition', compositionId: 'accent' });
    test.at(300).pause(); test.at(600).resume();
    test.at(700).appendTarget(' हिन्दी');
    test.at(800).input({ type: 'delete' });
    test.at(900).input({ type: 'composition', text: 'e\u0301', provenance: 'composition', compositionId: 'replacement' });
    const full = test.at(2500).finish('manual'), original = JSON.stringify(full);
    const payload = arenaEvidencePayload(full);
    expectRetainedFields(full, payload);
    expect(payload.finalText).toBe('café');
    expect(payload.events[0].text).toBe('cafe\u0301');
    expect(payload.configuration.privacy).toBe('private-custom');
    expect(payload.pauseIntervals).toHaveLength(1);
    expect(payload.issuedTargetSegments[0].text).toBe(' हिन्दी');
    expect(payload.metrics.deletionActions).toBe(1);
    expect(JSON.stringify(full)).toBe(original);
  });
  it('preserves the complete ready schema and source arrays when no keystroke has started', () => {
    const full = controller('ready words').at(1000).checkpoint();
    const payload = arenaEvidencePayload(full);
    expectRetainedFields(full, payload);
    expect(payload.status).toBe('ready');
    expect(payload.startedAtWall).toBeNull();
    expect(payload.elapsedMs).toBe(0);
    expect(payload.events).toEqual([]);
    expect(full.characters).toHaveLength(graphemes('ready words').length);
    expect(full.timeSeries).toEqual([]);
  });
  it('substantially reduces an800-word checkpoint payload while keeping all canonical source evidence', () => {
    const target = Array.from({ length: 800 }, (_, index) => ['calm', 'clear', 'river', 'focus'][index % 4]).join(' ');
    const test = controller(target);
    test.session.startAt(0, 1793102400000);
    for (const [index, text] of [...target.slice(0, 10)].entries()) test.at(100 + index * 80 + index % 3 * 3).input({ type: 'insert', text });
    const full = test.at(15000).checkpoint(), original = JSON.stringify(full);
    const payload = arenaEvidencePayload(full);
    const fullBytes = new TextEncoder().encode(original).length;
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    expectRetainedFields(full, payload);
    expect(full.characters).toHaveLength(4599);
    expect(full.timeSeries).toHaveLength(15);
    expect(payload.events).toHaveLength(10);
    expect(fullBytes).toBeGreaterThan(300000);
    expect(payloadBytes).toBeLessThan(fullBytes / 10);
    expect(JSON.stringify(full)).toBe(original);
  });
});
