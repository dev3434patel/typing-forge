import { describe, expect, it } from 'vitest';
import { SessionController, replaySession } from '..';
import { validateCandidate } from '../../../../supabase/functions/_shared/validation';
describe('coarse-clock input before pause ordering', () => {
  const create = () => { let now = 100; const session = new SessionController({ clientSessionId: 'coarse-pause', mode: 'time', durationMs: 30000, initialTarget: 'cat dog', ownerScope: '11111111-1111-4111-8111-111111111111' }, { now: () => now, wallNow: () => 1792540800000 + now }); return { session, at: (time: number) => { now = time; } }; };
  it.each([1, 2, 3])('retains %d same-clock native commits before pause without adding time', count => {
    const { session, at } = create();
    for (const char of 'cat'.slice(0, count)) session.input({ type: 'insert', text: char });
    session.pause(); at(1100); session.resume(); at(2100);
    const result = session.finish();
    expect(result.pauseIntervals).toEqual([{ startMs: 0, endMs: 1000, afterSequence: count - 1 }]);
    expect(result.elapsedMs).toBe(1000);
    expect(result.events.map(event => event.offsetMs)).toEqual(Array(count).fill(0));
    expect(replaySession(result.configuration, result.events, result.elapsedMs, { pauseIntervals: result.pauseIntervals }).finalText).toBe('cat'.slice(0, count));
    expect(() => validateCandidate(result, result.ownerScope)).not.toThrow();
  });
  it('replays a finish while still paused and a later resume input correctly', () => {
    const { session, at } = create(); session.input({ type: 'insert', text: 'c' }); session.pause(); at(600);
    const result = session.finish(); expect(result.metrics.insertionAttempts).toBe(1); expect(result.elapsedMs).toBe(0);
    const next = create(); next.session.input({ type: 'insert', text: 'c' }); next.session.pause(); next.at(600); next.session.resume(); next.session.input({ type: 'insert', text: 'a' }); next.at(1600);
    expect(next.session.finish().finalTranscript).toBe('ca');
  });
  it('keeps old unanchored pause semantics and rejects an event occurring after the pause anchor', () => {
    const { session, at } = create(); session.input({ type: 'insert', text: 'c' }); at(101); session.pause(); at(1100); session.resume(); at(2100);
    const result = session.finish(); expect(result.pauseIntervals[0].afterSequence).toBeUndefined();
    const options = { pauseIntervals: [{ startMs: 0, endMs: 1000, afterSequence: 0 }] };
    const extra = { ...result.events[0], sequence: 1, text: 'a' };
    expect(() => replaySession(result.configuration, [...result.events, extra], 1000, options)).toThrow('during a pause');
    expect(() => replaySession(result.configuration, result.events, 1000, { pauseIntervals: [{ startMs: 0, endMs: 1000 }] })).toThrow('during a pause');
  });
  it.each([-1, 99, .5])('rejects a nonexistent or invalid anchor %s', afterSequence => {
    const { session, at } = create(); session.input({ type: 'insert', text: 'c' }); at(1100); const result = session.finish();
    expect(() => replaySession(result.configuration, result.events, 1000, { pauseIntervals: [{ startMs: 0, endMs: 1000, afterSequence }] })).toThrow('anchor');
  });
});
