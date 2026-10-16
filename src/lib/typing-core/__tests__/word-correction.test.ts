import { describe, expect, it } from 'vitest';
import { SessionController, comparisonKey, graphemes, replaySession, replayTranscript, SEGMENTATION_POLICY, type SessionConfig, type SessionEvent } from '..';

function fixture(overrides: Partial<SessionConfig> = {}) {
  let now = 0;
  const session = new SessionController({
    clientSessionId: 'word-correction', mode: 'time', durationMs: 30000,
    initialTarget: 'cat dog another word', correctionPolicy: 'current-word', ...overrides,
  }, { now: () => now, wallNow: () => 1700000000000 + now });
  return {
    session,
    insert(text: string) { now += 100; return session.input({ type: 'insert', text }); },
    delete() { now += 100; return session.input({ type: 'delete' }); },
    finish() { now = 10000; return session.finish('manual'); },
  };
}

describe('current-word correction policy', () => {
  it.each(['cat ', 'cxt ', 'c ', ' '])('commits correct, incorrect, short and skipped words after %j', (text) => {
    const test = fixture();
    test.insert(text);
    const before = test.session.snapshot();
    expect(test.session.editableStart).toBe(graphemes(text).length);
    for (let index = 0; index < 5; index++) test.delete();
    const after = test.session.snapshot();
    expect(after.finalText).toBe(text);
    expect(after.events).toEqual(before.events);
    expect(after.metrics.deletionActions).toBe(0);
    expect(after.metrics.deletedUnits).toBe(0);
    expect(after.metrics.insertionAttempts).toBe(before.metrics.insertionAttempts);
  });

  it('allows correction of a complete word until its separator is entered', () => {
    const test = fixture();
    test.insert('cat');
    expect(test.session.editableStart).toBe(0);
    expect(test.delete().finalText).toBe('ca');
    test.insert('t ');
    expect(test.delete().finalText).toBe('cat ');
  });

  it('deletes only current-word characters and never the separator before them', () => {
    const test = fixture();
    test.insert('cat dx');
    expect(test.delete().finalText).toBe('cat d');
    test.insert('og');
    expect(test.delete().finalText).toBe('cat do');
    expect(test.delete().finalText).toBe('cat d');
    expect(test.delete().finalText).toBe('cat ');
    const count = test.session.snapshot().events.length;
    expect(test.delete().finalText).toBe('cat ');
    expect(test.session.snapshot().events).toHaveLength(count);
    expect(test.session.editableStart).toBe(4);
  });

  it('clamps word deletion and selected deletion to the editable suffix before recording evidence', () => {
    const test = fixture();
    test.insert('cat dog');
    const after = test.session.input({ type: 'delete', start: 0, end: 7 });
    expect(after.finalText).toBe('cat ');
    expect(after.events.at(-1)).toMatchObject({ type: 'delete', start: 4, end: 7 });
    expect(after.metrics).toMatchObject({ deletionActions: 1, deletedUnits: 3 });
    const result = test.finish();
    expect(replaySession(result.configuration, result.events, result.elapsedMs).finalText).toBe('cat ');
  });

  it('rejects insertion, replacement, composition and rejection attempts touching the committed prefix', () => {
    const test = fixture();
    test.insert('cat dog');
    const before = test.session.snapshot();
    for (const type of ['insert', 'replace', 'composition', 'reject'] as const) {
      const after = test.session.input({ type, start: 0, end: type === 'insert' ? 0 : 7, text: 'x' });
      expect(after.finalText).toBe('cat dog');
      expect(after.events).toEqual(before.events);
      expect(after.metrics).toEqual(before.metrics);
    }
  });

  it('allows replacements and caret movement inside the current word', () => {
    const test = fixture();
    test.insert('cat dxg');
    expect(test.session.input({ type: 'replace', start: 5, end: 6, text: 'o' }).finalText).toBe('cat dog');
    expect(test.session.input({ type: 'insert', start: 4, end: 4, text: 'a' }).finalText).toBe('cat adog');
    expect(test.session.editableStart).toBe(4);
  });

  it('commits a separator inserted before the retained current-word suffix', () => {
    const test = fixture();
    test.insert('cat dog');
    test.session.input({ type: 'insert', start: 5, end: 5, text: ' ' });
    expect(test.session.currentText).toBe('cat d og');
    expect(test.session.editableStart).toBe(6);
    expect(test.session.input({ type: 'delete', start: 0, end: 8 }).finalText).toBe('cat d ');
    expect(test.delete().finalText).toBe('cat d ');
  });

  it('locks only accepted separators, including in stop-on-error practice', () => {
    const test = fixture({ rejectIncorrect: true });
    test.insert('c');
    test.insert(' ');
    expect(test.session.currentText).toBe('c');
    expect(test.session.editableStart).toBe(0);
    test.session.input({ type: 'reject', text: ' ' });
    expect(test.session.editableStart).toBe(0);
    test.insert('at ');
    expect(test.session.currentText).toBe('cat ');
    expect(test.session.editableStart).toBe(4);
    expect(test.delete().finalText).toBe('cat ');
  });

  it('commits an explicit non-inserting word submission', () => {
    const test = fixture();
    test.insert('c');
    test.session.input({ type: 'submit' });
    expect(test.session.editableStart).toBe(1);
    expect(test.delete().finalText).toBe('c');
    test.insert('dog');
    expect(test.session.input({ type: 'delete', start: 0, end: 4 }).finalText).toBe('c');
    const result = test.finish();
    expect(replaySession(result.configuration, result.events, result.elapsedMs).finalText).toBe('c');
  });

  it('uses grapheme boundaries for normalized composition and joined Unicode input', () => {
    const test = fixture({ initialTarget: 'é 👩‍💻 élan more' });
    test.session.input({ type: 'composition', text: 'e\u0301 👩‍💻 ', compositionId: 'composed-words', provenance: 'composition' });
    expect(test.session.currentText).toBe('é 👩‍💻 ');
    expect(test.session.editableStart).toBe(4);
    test.insert('e');
    test.insert('\u0301');
    expect(test.session.currentText).toBe('é 👩‍💻 é');
    expect(test.session.editableStart).toBe(4);
    expect(test.delete().finalText).toBe('é 👩‍💻 ');
    expect(test.delete().finalText).toBe('é 👩‍💻 ');
    const result = test.finish();
    const replay = replayTranscript(result.configuration, result.events);
    expect(replay.units.join('')).toBe(result.finalText);
    expect(replay.editableStart).toBe(4);
  });

  it('keeps prose line breaks inside a word, matching prose alignment', () => {
    const test = fixture({ initialTarget: 'cat\ndog another' });
    test.insert('cat\ndog');
    expect(test.session.editableStart).toBe(0);
    expect(test.delete().finalText).toBe('cat\ndo');
  });

  it.each(['code', 'free'] as const)('commits tabs and newlines with %s scoring', (scoringPolicy) => {
    const test = fixture({ mode: 'zen', scoringPolicy, initialTarget: 'let\tx\nnext token' });
    test.insert('let\tx\nnext');
    expect(test.session.editableStart).toBe(6);
    expect(test.session.input({ type: 'delete', start: 0, end: 10 }).finalText).toBe('let\tx\n');
    expect(test.delete().finalText).toBe('let\tx\n');
    const result = test.finish();
    expect(replayTranscript(result.configuration, result.events).editableStart).toBe(6);
  });

  it('retains original mistake attempts after correction and ignores boundary Backspace in metrics', () => {
    const test = fixture();
    test.insert('c');
    test.insert('x');
    test.delete();
    test.insert('at ');
    test.delete();
    test.delete();
    test.insert('d');
    const result = test.finish();
    expect(result.finalText).toBe('cat d');
    expect(result.metrics).toMatchObject({ insertionAttempts: 6, correctAttempts: 5, deletionActions: 1, deletedUnits: 1, finalTextAccuracy: 100 });
    expect(result.metrics.inputAccuracy).toBeCloseTo(100 * 5 / 6);
    expect(replaySession(result.configuration, result.events, result.elapsedMs).metrics).toEqual(result.metrics);
  });

  it('rejects tampered replay that crosses the committed boundary', () => {
    const test = fixture();
    test.insert('cat dog');
    const result = test.finish();
    const forged: SessionEvent = {
      type: 'delete', start: 0, end: 7, text: '', sequence: result.events.length,
      offsetMs: 1000, provenance: 'keyboard',
    };
    expect(() => replaySession(result.configuration, [...result.events, forged], result.elapsedMs)).toThrow('Submitted words cannot be edited');
    expect(() => replaySession(result.configuration, [...result.events, { ...forged, type: 'replace', text: 'x' }], result.elapsedMs)).toThrow('Submitted words cannot be edited');
  });

  it('preserves legacy unrestricted live editing and replay when the flag is absent', () => {
    const test = fixture({ correctionPolicy: undefined });
    test.insert('cat dog');
    expect(test.session.editableStart).toBe(0);
    test.session.input({ type: 'replace', start: 0, end: 3, text: 'pet' });
    test.session.input({ type: 'delete', start: 0, end: 7 });
    const result = test.finish();
    expect(result.finalText).toBe('');
    expect(replaySession(result.configuration, result.events, result.elapsedMs).finalText).toBe('');
  });

  it('preserves the exact legacy comparison key and separates current-word sessions', () => {
    const config: SessionConfig = { clientSessionId: 'legacy', mode: 'time', initialTarget: 'cat dog', durationMs: 30000 };
    const legacy = JSON.stringify({
      version: 'forge-v3', comparisonPolicy: 'forge-cohorts-v2', contentId: null, sessionId: null,
      policy: 'prose', mode: 'time', durationMs: 30000, words: null, language: 'en', script: 'Latin',
      layout: 'qwerty', method: 'keyboard', punctuation: false, numbers: false, codeLanguage: null,
      corpus: 'unspecified', generator: 'unspecified', segmentation: SEGMENTATION_POLICY,
      repeated: false, paused: false, rejectionPolicy: false,
    });
    expect(comparisonKey(config)).toBe(legacy);
    expect(comparisonKey({ ...config, correctionPolicy: undefined })).toBe(legacy);
    expect(JSON.parse(comparisonKey({ ...config, correctionPolicy: 'current-word' }))).toEqual({ ...JSON.parse(legacy), correctionPolicy: 'current-word' });
  });

  it('rejects unknown policy values at the controller boundary', () => {
    expect(() => fixture({ correctionPolicy: 'unrecognized' as SessionConfig['correctionPolicy'] })).toThrow('Unknown correction policy');
  });

  it('does not turn malformed deletion ranges into accepted edits while clamping', () => {
    const test = fixture();
    test.insert('cat dog');
    const before = test.session.snapshot();
    expect(() => test.session.input({ type: 'delete', start: -1, end: 7 })).toThrow('Edit range is outside the transcript');
    expect(() => test.session.input({ type: 'delete', start: 0, end: 100 })).toThrow('Edit range is outside the transcript');
    expect(test.session.snapshot()).toEqual(before);
  });
});
