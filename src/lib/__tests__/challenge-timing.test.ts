import { describe, expect, it } from 'vitest';
import { challengeResponseClock, challengeUsesFirstInput, createIssuedChallengeController, issuedChallengeWindow } from '../challenge-timing';
import type { SessionConfig } from '../typing-core';

const opens = Date.parse('2026-10-21T00:00:03.000Z');
const configuration: SessionConfig = { clientSessionId: 'first-input-contract', ownerScope: 'alice', mode: 'time', durationMs: 30000, initialTarget: 'cat dog calm clear', language: 'en', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', correctionPolicy: 'current-word', contentRevision: 'forge-social-duel-en-v2', settings: { timingPolicy: 'first-input-v1' }, challengeId: 'issued', privacy: 'public-corpus' };
const issued = { configuration, starts_at: new Date(opens).toISOString(), deadline_at: new Date(opens + 30000).toISOString(), expires_at: new Date(opens + 597000).toISOString() };

function setup(start = opens, config = configuration) {
  let mono = 500, deviceWall = start;
  const source = { now: () => mono, wallNow: () => deviceWall };
  const bundle = createIssuedChallengeController(config, { ...issued, configuration: config }, 0, source);
  return { ...bundle, advance: (ms: number) => { mono += ms; }, changeDeviceWall: (ms: number) => { deviceWall += ms; } };
}

describe('versioned independent challenge timing', () => {
  it('keeps a full clock while ready, then starts on the first wrong character', () => {
    const test = setup(); test.advance(10000);
    expect(test.controller.tick()).toMatchObject({ status: 'ready', elapsedMs: 0, remainingMs: 30000, events: [] });
    test.controller.input({ type: 'insert', text: 'x' });
    expect(test.controller.timingOrigin).toEqual({ monotonic: 10500, wall: opens + 10000 });
    expect(test.controller.snapshot()).toMatchObject({ status: 'running', elapsedMs: 0, metrics: { incorrectAttempts: 1 }, events: [{ offsetMs: 0, text: 'x' }] });
    test.advance(29999); expect(test.controller.tick().status).toBe('running');
    test.advance(1); expect(test.controller.tick()).toMatchObject({ status: 'finished', elapsedMs: 30000 });
    expect(test.controller.result?.finishedAtWall).toBe(opens + 40000);
  });
  it.each(['delete', 'submit'] as const)('does not record empty pre-start %s evidence', type => {
    const test = setup(); test.controller.input({ type }); test.advance(100);
    test.controller.input({ type: 'insert', text: 'c' });
    expect(test.controller.snapshot().events).toEqual([expect.objectContaining({ sequence: 0, offsetMs: 0, text: 'c' })]);
  });
  it('does not shift the first character or finish after device wall-clock jumps', () => {
    const test = setup(); test.advance(20000); test.changeDeviceWall(3600000);
    test.controller.input({ type: 'insert', text: 'c' }); test.advance(30000); test.changeDeviceWall(-7200000); test.controller.tick();
    expect(test.controller.result).toMatchObject({ startedAtWall: opens + 20000, finishedAtWall: opens + 50000, wallDurationMs: 30000, elapsedMs: 30000 });
  });
  it('calibrates once at the response midpoint and ignores device time thereafter', () => {
    let mono = 300;
    const clock = challengeResponseClock(new Date(opens).toISOString(), 100, 300, () => mono);
    expect(clock.wallNow()).toBe(opens + 100); mono += 25000;
    expect(clock.wallNow()).toBe(opens + 25100);
    expect(() => challengeResponseClock('bad', 1, 2)).toThrow();
    expect(() => challengeResponseClock(issued.starts_at, 3, 2)).toThrow();
  });
  it('permits the exact last start but blocks a later first character without throwing', () => {
    const latest = issuedChallengeWindow(issued).latestStart;
    const exact = setup(latest); expect(() => exact.controller.input({ type: 'insert', text: 'c' })).not.toThrow(); expect(exact.controller.status).toBe('running');
    const expired = setup(latest); expired.advance(1);
    expect(() => expired.controller.input({ type: 'insert', text: 'c' })).not.toThrow();
    expect(expired.controller.snapshot()).toMatchObject({ status: 'ready', finalText: '', events: [], elapsedMs: 0 });
    expect(() => setup(latest + 1)).toThrow(/expired/);
  });
  it('cannot discard an active attempt when its preparation window later expires', () => {
    const test = setup(issuedChallengeWindow(issued).latestStart); test.controller.input({ type: 'insert', text: 'c' }); test.advance(1000);
    test.controller.input({ type: 'insert', text: 'a' }); expect(test.controller.snapshot().finalText).toBe('ca');
  });
  it('preserves the exact fixed start and missed idle time of legacy issued attempts', () => {
    const legacy = { ...configuration, contentRevision: 'forge-social-duel-en-v1', settings: undefined };
    const test = setup(opens + 4000, legacy);
    expect(test.preparationRemainingMs).toBeNull(); expect(test.controller.snapshot()).toMatchObject({ status: 'running', elapsedMs: 4000 });
    test.controller.input({ type: 'insert', text: 'c' }); expect(test.controller.snapshot().events[0].offsetMs).toBe(4000);
    expect(test.controller.timingOrigin?.wall).toBe(opens);
  });
  it.each([
    { contentRevision: 'forge-social-duel-en-v1', settings: { timingPolicy: 'first-input-v1' } },
    { contentRevision: 'forge-social-duel-en-v2', settings: undefined },
    { settings: { timingPolicy: 'future-v9' } },
    { settings: { timingPolicy: null } },
  ])('rejects unknown or mismatched issued policy %j', change => expect(() => challengeUsesFirstInput({ ...configuration, ...change })).toThrow());
  it.each([{ deadline_at: issued.starts_at }, { expires_at: issued.starts_at }, { starts_at: 'invalid' }])('rejects malformed windows %j', change => expect(() => issuedChallengeWindow({ ...issued, ...change })).toThrow());
  it('rejects a pre-countdown mount instead of counting the preparation time', () => expect(() => setup(opens - 1)).toThrow(/countdown/));
});
