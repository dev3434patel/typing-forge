import { describe, expect, it } from 'vitest';
import { SessionController, comparisonKey, graphemes, replaySession, type SessionConfig, type SessionEvent } from '..';

function fixture(target: string, overrides: Partial<SessionConfig> = {}) {
  let now = 0;
  const session = new SessionController({ clientSessionId: 'fixture', mode: 'time', durationMs: 30000, initialTarget: target, ...overrides }, { now: () => now, wallNow: () => 1700000000000 + now });
  return { session, at(value: number) { now = value; }, insert(text: string, at: number) { now = at; return session.input({ type: 'insert', text }); } };
}
describe('forge-v3 golden metrics', () => {
  it('keeps the entire deadline, idle buckets and excludes late input', () => {
    const test = fixture('abcdefghij other words');
    test.insert('abcdefghij ', 0);
    test.at(31000);
    const result = test.session.input({ type: 'insert', text: 'other' });
    expect(result.elapsedMs).toBe(30000);
    expect(result.metrics.wpm).toBe(4.4);
    expect(result.finalText).toBe('abcdefghij ');
    expect(test.session.result!.timeSeries).toHaveLength(30);
    expect(test.session.result!.timeSeries[29].localWpm).toBe(0);
  });
  it('counts ten eligible units in thirty seconds as four WPM', () => {
    const test = fixture('abcdefghij');
    test.insert('abcdefghij', 0);
    test.at(30000);
    expect(test.session.tick().metrics.wpm).toBe(4);
  });
  it('retains mistakes in input accuracy after correcting final text', () => {
    const test = fixture('abc');
    test.insert('a', 0);
    test.insert('x', 100);
    test.at(200); test.session.input({ type: 'delete' });
    test.insert('b', 300); test.insert('c', 400);
    test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.metrics).toMatchObject({ wpm: 1.2, rawWpm: 1.2, attemptRate: 1.6, inputAccuracy: 75, finalTextAccuracy: 100, deletionActions: 1, deletedUnits: 1 });
  });
  it('credits complete correct prose words and a timed leading prefix', () => {
    const wrong = fixture('cat dog'); wrong.insert('cxt dog', 0); wrong.at(30000);
    expect(wrong.session.finish('timeout').metrics).toMatchObject({ correct: 6, incorrect: 1, rawWpm: 2.8, wpm: 1.2 });
    const partial = fixture('cat dog'); partial.insert('cat d', 0); partial.at(30000);
    expect(partial.session.finish('timeout').metrics).toMatchObject({ creditedUnits: 5, wpm: 2, missed: 0, untyped: 2 });
  });
  it('keeps next word aligned after a short or skipped word', () => {
    const test = fixture('cat dog'); test.insert('c dog', 0); test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.metrics).toMatchObject({ correct: 5, missed: 2, incorrect: 0, creditedUnits: 3 });
    expect(result.characters[4]).toMatchObject({ expected: 'd', typed: 'd', status: 'correct' });
  });
  it('represents absent evidence and never invents rhythm', () => {
    const empty = fixture('abc', { startImmediately: true }); empty.at(30000);
    expect(empty.session.tick().metrics).toMatchObject({ wpm: 0, inputAccuracy: null, consistency: null });
    const short = fixture('abc'); short.insert('a', 0); short.at(4000);
    expect(short.session.finish('manual').metrics).toMatchObject({ consistency: null, peakFiveSecondWpm: null });
  });
  it('starts rejected learning attempts and automatically finishes code', () => {
    const learn = fixture('ab', { mode: 'learn', durationMs: undefined, rejectIncorrect: true });
    expect(learn.insert('x', 100).status).toBe('running');
    expect(learn.session.snapshot().finalText).toBe('');
    learn.insert('a', 200); const result = learn.insert('b', 1100);
    expect(result.status).toBe('finished');
    expect(result.metrics.inputAccuracy).toBeCloseTo(200 / 3);
    const code = fixture('a\t=\n b', { mode: 'code', durationMs: undefined });
    code.insert('a\t=', 0); code.insert('\n b', 1000);
    expect(code.session.result!.finishReason).toBe('completed');
    expect(code.session.result!.metrics.creditedUnits).toBe(6);
  });
  it('finalizes once, freezes nested state, and preserves append-only targets', () => {
    const test = fixture('abc'); test.insert('a', 0); test.session.appendTarget(' def', 100);
    const result = test.session.finish('manual', 1000);
    expect(test.session.finish('timeout', 50000)).toBe(result);
    expect(Object.isFrozen(result.configuration)).toBe(true);
    expect(Object.isFrozen(result.events[0])).toBe(true);
    expect(result.initialTarget).toBe('abc'); expect(result.targetText).toBe('abc def');
    expect(() => test.session.appendTarget(' xyz')).toThrow();
    const finite = fixture('abc', { mode: 'quote', durationMs: undefined });
    expect(() => finite.session.appendTarget(' xyz')).toThrow('immutable');
  });
  it('excludes the exact deadline event and accepts the preceding event', () => {
    const test = fixture('abcdef'); test.insert('a', 0); test.insert('b', 29999);
    test.insert('c', 30000);
    expect(test.session.result!.finalText).toBe('ab');
    expect(test.session.result!.events).toHaveLength(2);
  });
  it('records pauses in wall time while active time continues to include ordinary inactivity', () => {
    const test = fixture('abcdef'); test.insert('abc', 0);
    test.at(1000); test.session.pause(); test.at(60000);
    expect(test.session.input({ type: 'insert', text: 'x' }).finalText).toBe('abc');
    test.session.resume(); test.at(89000);
    const result = test.session.tick();
    expect(result.elapsedMs).toBe(30000); expect(result.wallDurationMs).toBe(89000);
    expect(test.session.result!.eligibility.reasons).toContain('Explicitly paused practice');
    expect(result.metrics.inputAccuracy).toBe(100);
  });
  it('commits composition once and counts graphemes across scripts', () => {
    const target = 'é कि 👩‍💻 عربي';
    const test = fixture(target);
    test.at(0); test.session.input({ type: 'composition', text: 'e\u0301', compositionId: 'ime-1' });
    test.at(1); test.session.input({ type: 'composition', text: 'e\u0301', compositionId: 'ime-1' });
    test.insert(' कि 👩‍💻 عربي', 1000); test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.finalText).toBe(target);
    expect(result.metrics.retainedUnits).toBe(graphemes(target).length);
    expect(result.metrics.insertionAttempts).toBe(graphemes(target).length);
    expect(result.metrics.inputAccuracy).toBe(100);
  });
  it('replays range replacement and deletion into a previous word', () => {
    const test = fixture('cat dog'); test.insert('cxt dog', 0);
    test.at(1000); test.session.input({ type: 'replace', start: 1, end: 2, text: 'a' });
    test.at(2000); test.session.input({ type: 'delete', start: 3, end: 7 });
    test.insert(' dog', 3000); test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.finalText).toBe('cat dog');
    expect(replaySession(result.configuration, result.events, result.elapsedMs).metrics).toEqual(result.metrics);
    expect(result.metrics.inputAccuracy).toBeLessThan(100);
  });
  it('returns target-based metrics as unavailable for free writing', () => {
    const test = fixture('', { mode: 'custom', scoringPolicy: 'free', durationMs: undefined });
    test.insert('hello 🌎', 0); test.at(10000);
    expect(test.session.finish('manual').metrics).toMatchObject({ wpm: null, inputAccuracy: null, finalTextAccuracy: null, missed: 0, rawWpm: 8.4 });
  });
  it('uses a shared earlier start when joining a race late', () => {
    const test = fixture('abc', { mode: 'race', durationMs: 30000 }); test.at(5000);
    expect(test.session.startAt(0, 1700000000000).elapsedMs).toBe(5000);
    const snapshot = test.insert('a', 10000);
    expect(snapshot.elapsedMs).toBe(10000);
    expect(test.session.checkpoint().startedAtWall).toBe(1700000000000);
    expect(() => test.session.startAt(0)).toThrow('already started');
  });
  it('creates immutable interim race evidence while the same live session continues', () => {
    const test = fixture('cat dog', { mode: 'race', durationMs: undefined }); test.insert('cat ', 0); test.at(5000);
    const checkpoint = test.session.checkpoint();
    expect(checkpoint.status).toBe('running'); expect(checkpoint.metrics.missed).toBe(0);
    expect(test.session.result).toBeNull();
    test.insert('dog', 6000);
    expect(test.session.result!.finalText).toBe('cat dog');
    expect(checkpoint.finalText).toBe('cat '); expect(Object.isFrozen(checkpoint.events)).toBe(true);
  });
  it('skips a word without inventing an insertion, retained separator or attempt', () => {
    const test = fixture('cat dog'); test.insert('c', 0); test.at(1000); test.session.input({ type: 'submit' });
    test.insert('dog', 2000); test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.finalText).toBe('cdog');
    expect(result.metrics).toMatchObject({ correct: 4, missed: 3, insertionAttempts: 4, creditedUnits: 3, retainedUnits: 4 });
    expect(result.characters[4]).toMatchObject({ typed: 'd', status: 'correct' });
    expect(() => fixture('cat dog').session.input({ type: 'submit', text: 'cat dog' })).toThrow('cannot insert');
  });
  it('preserves exact partial-second duration and a normalized final bucket', () => {
    const test = fixture('abc'); test.insert('a', 0); test.insert('b', 5000); test.at(5500);
    const result = test.session.finish('manual');
    expect(result.elapsedMs).toBe(5500); expect(result.timeSeries[5].bucketDurationMs).toBe(500);
    expect(result.timeSeries[5].localWpm).toBe(24);
    expect(result.metrics.rawWpm).toBeCloseTo(2 * 12000 / 5500, 12);
  });
  it('separates corpus revisions, input policies and paused comparison cohorts', () => {
    const config: SessionConfig = { clientSessionId: 'one', mode: 'time', initialTarget: 'abc', durationMs: 30000, comparisonKey: 'forged' };
    expect(comparisonKey(config)).not.toBe('forged');
    for (const change of [{ paused: true }, { contentRevision: 'next' }, { generatorVersion: 'next' }, { rejectIncorrect: true }, { inputMethod: 'composition' }]) expect(comparisonKey({ ...config, ...change })).not.toBe(comparisonKey(config));
  });
  it('preserves decomposed code content while prose normalizes canonical equivalents', () => {
    const code = fixture('e\u0301\t=\n x', { mode: 'code', durationMs: undefined });
    code.insert('e\u0301\t=', 0); code.insert('\n x', 1000);
    expect(code.session.result!.finalText).toBe('e\u0301\t=\n x');
    expect(code.session.result!.targetText).toBe('e\u0301\t=\n x');
    expect(code.session.result!.metrics.finalTextAccuracy).toBe(100);
  });
  it('measures uniform rhythm from complete one-second buckets and a complete five-second burst', () => {
    const test = fixture('abcdefghij');
    for (let index = 0; index < 5; index++) test.insert('abcde'[index], index * 1000);
    test.at(5000); const result = test.session.finish('manual');
    expect(result.metrics.consistency).toBe(100); expect(result.metrics.peakFiveSecondWpm).toBe(12);
    expect(result.timeSeries.every(sample => sample.localWpm === 12)).toBe(true);
  });
  it('retains a long idle timeline without removing elapsed time or inventing observations', () => {
    const test = fixture('abc', { durationMs: 600000 }); test.insert('a', 0); test.at(600000);
    const result = test.session.finish('timeout');
    expect(result.timeSeries).toHaveLength(600); expect(result.timeSeries.filter(sample => sample.localWpm > 0)).toHaveLength(1);
    expect(result.metrics.wpm).toBe(.02); expect(result.metrics.consistency).toBeNull();
    expect(result.timeSeries[599].wpm).toBe(.02);
  });
  it('keeps an early manual timed result out of the full-duration personal best cohort', () => {
    const test = fixture('cat dog'); test.insert('cat ', 0); test.at(2000);
    const result = test.session.finish('manual');
    expect(result.elapsedMs).toBe(2000); expect(result.configuration.durationMs).toBe(30000);
    expect(result.eligibility.eligible).toBe(false); expect(result.eligibility.reasons).toContain('Incomplete timed session');
    expect(result.metrics.wpm).toBe(24);
  });
});

describe('replay trust boundary and seeded invariants', () => {
  it('rejects malformed ranges, times, duplicate order and nonfinite duration', () => {
    const config: SessionConfig = { clientSessionId: 'bad', mode: 'time', durationMs: 30000, initialTarget: 'abc' };
    const event: SessionEvent = { type: 'insert', text: 'a', start: 0, end: 0, offsetMs: 0, sequence: 0, provenance: 'keyboard' };
    expect(() => replaySession(config, [{ ...event, end: 5 }], 1000)).toThrow('range');
    expect(() => replaySession(config, [event, event], 1000)).toThrow('sequence');
    expect(() => replaySession(config, [{ ...event, offsetMs: NaN }], 1000)).toThrow('time');
    expect(() => replaySession(config, [], Infinity)).toThrow('duration');
  });
  it('replays deterministic edit histories with finite counts and conserved retained units', () => {
    let seed = 98123;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let run = 0; run < 25; run++) {
      const test = fixture('cat dog fox ant bee '.repeat(30), { startImmediately: true });
      for (let i = 0; i < 100; i++) {
        test.at(i * 200);
        if (random() < 0.2) test.session.input({ type: 'delete' });
        else test.session.input({ type: 'insert', text: 'cat dogxyz '[Math.floor(random() * 11)] });
      }
      test.at(30000);
      const result = test.session.finish('timeout');
      expect(result.metrics.correct + result.metrics.incorrect + result.metrics.extra).toBe(result.metrics.retainedUnits);
      for (const value of Object.values(result.metrics)) expect(value === null || Number.isFinite(value)).toBe(true);
      expect(replaySession(result.configuration, result.events, result.elapsedMs).finalText).toBe(result.finalText);
    }
  });
});
