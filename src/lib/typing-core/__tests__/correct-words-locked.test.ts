import { describe, expect, it } from 'vitest';
import { SessionController, comparisonKey, graphemes, replaySession, replayTranscript, type NormalizedEdit, type SessionConfig, type SessionEvent } from '..';

function fixture(overrides: Partial<SessionConfig> = {}) {
  let now = 0;
  const session = new SessionController({ clientSessionId: 'recover-word', mode: 'time', durationMs: 30_000,
    initialTarget: 'cat dog another word', correctionPolicy: 'correct-words-locked', ...overrides },
  { now: () => now, wallNow: () => 1_700_000_000_000 + now });
  const edit = (input: NormalizedEdit) => { now += 100; return session.input(input); };
  return { session, edit, insert: (text: string) => edit({ type: 'insert', text }),
    back: () => edit({ type: 'delete' }),
    wordDelete: () => edit({ type: 'delete', start: 0, end: graphemes(session.currentText).length }),
    at: (time: number) => { now = time; },
    finish: () => { now += 1000; return session.finish('manual'); } };
}

describe('correct submitted words lock, previous mistakes remain recoverable', () => {
  it('allows a correct active word to be edited until Space, then locks it', () => {
    const test = fixture();
    test.insert('cat');
    expect(test.back().finalText).toBe('ca');
    test.insert('t ');
    expect(test.session.previousWordCorrection).toMatchObject({ correct: true, start: 0, end: 3 });
    const before = test.session.snapshot();
    expect(test.back().events).toEqual(before.events);
    expect(test.session.currentText).toBe('cat ');
  });

  it.each(['cxt ', 'ca ', 'catx ', 'dog '])('reopens typo, short, extra or wrong submitted word %j', (text) => {
    const test = fixture();
    test.insert(text);
    expect(test.session.canReopenPreviousWord).toBe(true);
    expect(test.back().finalText).toBe(text.slice(0, -1));
    expect(test.session.editableStart).toBe(0);
    expect(test.session.previousWordCorrection).toBeNull();
    expect(test.session.snapshot().metrics).toMatchObject({ deletionActions: 1, deletedUnits: 1 });
  });

  it('opens a submitted wrong word empty on a word-delete request', () => {
    const test = fixture();
    test.insert('cat dxg ');
    expect(test.wordDelete().finalText).toBe('cat ');
    expect(test.session.snapshot().events.at(-1)).toMatchObject({ start: 4, end: 8 });
    expect(test.back().finalText).toBe('cat ');
  });

  it('clears a nonempty current word before reopening a preceding mistake', () => {
    const test = fixture();
    test.insert('cxt do');
    expect(test.session.canReopenPreviousWord).toBe(false);
    expect(test.wordDelete().finalText).toBe('cxt ');
    expect(test.session.canReopenPreviousWord).toBe(true);
    expect(test.wordDelete().finalText).toBe('');
  });

  it('traverses wrong words one at a time but stops at a correct word', () => {
    const test = fixture();
    test.insert('cat dxg xnother ');
    expect(test.wordDelete().finalText).toBe('cat dxg ');
    expect(test.wordDelete().finalText).toBe('cat ');
    const before = test.session.snapshot();
    expect(test.wordDelete().events).toEqual(before.events);
    expect(test.session.editableStart).toBe(4);
  });

  it('a correct bridge prevents reaching an earlier mistake', () => {
    const test = fixture();
    test.insert('cxt dog ');
    expect(test.session.canReopenPreviousWord).toBe(false);
    expect(test.wordDelete().finalText).toBe('cxt dog ');
  });

  it('locks a corrected resubmitted word without erasing original incorrect attempts', () => {
    const test = fixture();
    test.insert('cxt ');
    test.back();
    test.edit({ type: 'replace', start: 1, end: 2, text: 'a' });
    test.insert(' ');
    expect(test.back().finalText).toBe('cat ');
    const result = test.finish();
    expect(result.metrics).toMatchObject({ insertionAttempts: 6, correctAttempts: 5, deletionActions: 2, deletedUnits: 2, finalTextAccuracy: 100 });
    expect(result.metrics.inputAccuracy).toBeCloseTo(100 * 5 / 6);
    const replay = replaySession(result.configuration, result.events, result.elapsedMs);
    expect(replay.finalText).toBe(result.finalText);
    expect(replay.metrics).toEqual(result.metrics);
  });

  it('blocks selection replacement/insertion/composition into a submitted mistake', () => {
    const test = fixture();
    test.insert('cxt ');
    const before = test.session.snapshot();
    for (const type of ['insert', 'replace', 'composition', 'reject'] as const) {
      expect(test.edit({ type, start: 1, end: type === 'insert' ? 1 : 2, text: 'a' }).events).toEqual(before.events);
    }
    expect(test.edit({ type: 'delete', start: 1, end: 2 }).events).toEqual(before.events);
  });

  it('rejects replay that deletes across two committed words instead of one', () => {
    const test = fixture();
    test.insert('cxt dxg ');
    const result = test.finish();
    const forged: SessionEvent = { type: 'delete', text: '', start: 0, end: 8,
      sequence: result.events.length, offsetMs: 200, provenance: 'keyboard' };
    expect(() => replaySession(result.configuration, [...result.events, forged], result.elapsedMs)).toThrow('Submitted words cannot be edited');
    expect(test.session.currentText).toBe('cxt dxg ');
  });

  it('reopens a virtual wrong submission without deleting a retained character', () => {
    const test = fixture();
    test.insert('cx');
    test.edit({ type: 'submit' });
    expect(test.session.previousWordCorrection).toMatchObject({ separator: 'submit', correct: false });
    test.edit({ type: 'delete', start: 2, end: 2 });
    expect(test.session.currentText).toBe('cx');
    expect(test.session.editableStart).toBe(0);
    expect(test.session.snapshot().metrics).toMatchObject({ deletionActions: 1, deletedUnits: 0 });
    const result = test.finish();
    expect(replayTranscript(result.configuration, result.events).submissions).toEqual([]);
  });

  it('clears a virtual wrong word on word deletion', () => {
    const test = fixture();
    test.insert('cat d');
    test.edit({ type: 'submit' });
    expect(test.wordDelete().finalText).toBe('cat ');
    expect(test.session.editableStart).toBe(4);
    expect(test.session.snapshot().metrics.deletedUnits).toBe(1);
  });

  it('removes just the latest virtual separator at an identical retained offset', () => {
    const test = fixture();
    test.insert('cat ');
    test.edit({ type: 'submit' });
    test.edit({ type: 'submit' });
    test.edit({ type: 'delete', start: 4, end: 4 });
    expect(test.session.canReopenPreviousWord).toBe(true);
    const result = test.finish();
    expect(replayTranscript(result.configuration, result.events).submissions).toEqual([4]);
  });

  it('locks a correct virtual submission', () => {
    const test = fixture();
    test.insert('cat');
    test.edit({ type: 'submit' });
    expect(test.session.canReopenPreviousWord).toBe(false);
    expect(test.wordDelete().finalText).toBe('cat');
  });

  it('uses normalized Unicode graphemes while reopening a wrong emoji word', () => {
    const test = fixture({ initialTarget: 'é 👩‍💻 élan more' });
    test.edit({ type: 'composition', text: 'e\u0301 👨‍💻 ', compositionId: 'unicode', provenance: 'composition' });
    expect(test.session.previousWordCorrection).toMatchObject({ start: 2, end: 3, correct: false });
    expect(test.back().finalText).toBe('é 👨‍💻');
    expect(test.back().finalText).toBe('é ');
    expect(test.session.editableStart).toBe(2);
    expect(test.back().finalText).toBe('é ');
    const result = test.finish();
    expect(replaySession(result.configuration, result.events, result.elapsedMs).metrics).toEqual(result.metrics);
  });

  it('does not lock an extra trailing separator beyond the final target word', () => {
    const test = fixture({ initialTarget: 'cat' });
    test.insert('cat ');
    expect(test.session.canReopenPreviousWord).toBe(true);
    expect(test.back().finalText).toBe('cat');
  });

  it('does not admit late correction after the timed deadline', () => {
    const test = fixture();
    test.insert('cxt ');
    test.at(30_100);
    const snapshot = test.back();
    expect(snapshot.status).toBe('finished');
    expect(snapshot.finalText).toBe('cxt ');
    expect(snapshot.metrics.deletionActions).toBe(0);
  });

  it('keeps rejection accuracy and accepted word boundaries independent', () => {
    const test = fixture({ rejectIncorrect: true });
    test.insert('cx');
    test.insert(' ');
    expect(test.session.currentText).toBe('c');
    expect(test.session.editableStart).toBe(0);
    test.insert('at ');
    expect(test.session.canReopenPreviousWord).toBe(false);
    expect(test.session.snapshot().metrics.incorrectAttempts).toBe(2);
  });

  it('invalidates cached boundary correctness when the timed target extends', () => {
    const test = fixture({ initialTarget: 'cat' });
    test.insert('cat ');
    expect(test.session.canReopenPreviousWord).toBe(true);
    test.session.appendTarget(' dog');
    expect(test.session.canReopenPreviousWord).toBe(false);
  });

  it('separates comparison cohorts and preserves the old literals', () => {
    const config = fixture().session.configuration;
    expect(new Set([comparisonKey(config), comparisonKey({ ...config, correctionPolicy: 'current-word' }), comparisonKey({ ...config, correctionPolicy: undefined })]).size).toBe(3);
    expect(JSON.parse(comparisonKey(config)).correctionPolicy).toBe('correct-words-locked');
  });

  it.each(['code', 'free'] as const)('requires prose scoring, leaving %s to unrestricted or legacy editing', (scoringPolicy) => {
    expect(() => fixture({ scoringPolicy })).toThrow('Correct-word locking requires prose scoring');
  });

  it('rejects a forged empty deletion that does not reopen a virtual mistake', () => {
    const test = fixture();
    test.insert('cat ');
    const result = test.finish();
    const forged: SessionEvent = { type: 'delete', text: '', start: 4, end: 4, sequence: 1, offsetMs: 200, provenance: 'keyboard' };
    expect(() => replaySession(result.configuration, [...result.events, forged], result.elapsedMs)).toThrow('Empty deletion');
  });
});
