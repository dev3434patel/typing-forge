import { describe, expect, it } from 'vitest';
import { calculateMetrics, emptyTranscript, type Alignment, type CharacterSlot, type SessionConfig } from '..';

const target = 'raw text';
const statuses: CharacterSlot['status'][] = ['correct', 'incorrect', 'correct', 'extra', 'missed', 'missed', 'untyped', 'untyped', 'untyped'];
const slot = (status: unknown, index: number): CharacterSlot => ({ index, expected: 'a', typed: null, status: status as CharacterSlot['status'] });
const known = statuses.map(slot);
const alignment = (characters: CharacterSlot[]): Alignment => ({ characters, mapping: [], cursor: 4, processed: 4, creditedUnits: 2, words: [] });
const state = () => { const value = emptyTranscript(); value.units = Array.from(target); return value; };

describe('alignment status-count compatibility', () => {
  for (const policy of ['prose', 'code'] as const) it.each([0, 1.25, 5999.25, 60000])(`${policy} ignores unknown statuses and sparse holes without changing any metric at %sms`, elapsedMs => {
    const config: SessionConfig = { clientSessionId: 'status-counts', mode: policy === 'code' ? 'code' : 'time', durationMs: 60000, initialTarget: target, scoringPolicy: policy };
    const unknown = ['', 'Correct', '__proto__', 'constructor', 'toString', null, undefined, 0];
    const characters = new Array<CharacterSlot>(known.length + unknown.length + 2);
    known.forEach((value, index) => { characters[index + 1] = Object.freeze({ ...value }); });
    unknown.forEach((value, index) => { characters[known.length + index + 1] = Object.freeze(slot(value, index)); });
    Object.freeze(characters);
    const baseline = calculateMetrics(config, target, state(), elapsedMs, { alignment: alignment(known) });
    const actual = calculateMetrics(config, target, state(), elapsedMs, { alignment: alignment(characters) });
    expect(actual.metrics).toEqual(baseline.metrics);
    expect(actual.metrics).toMatchObject({ correct: 2, incorrect: 1, extra: 1, missed: 2, untyped: 3 });
    expect(actual.characters).toBe(characters);
    expect(actual.cursor).toBe(4);
    expect(0 in characters).toBe(false);
    expect(characters.length - 1 in characters).toBe(false);
  });

  it('free writing never inspects status values and counts retained graphemes as extra', () => {
    const config: SessionConfig = { clientSessionId: 'free-status-counts', mode: 'zen', initialTarget: '', scoringPolicy: 'free' };
    const characters = [Object.freeze({ index: 0, expected: null, typed: 'a', get status(): CharacterSlot['status'] { throw new Error('Free writing must not classify alignment statuses'); } })];
    const baseline = calculateMetrics(config, '', state(), 6000, { alignment: alignment([]) });
    const actual = calculateMetrics(config, '', state(), 6000, { alignment: alignment(characters) });
    expect(actual.metrics).toEqual(baseline.metrics);
    expect(actual.metrics).toMatchObject({ correct: 0, incorrect: 0, extra: 8, missed: 0, untyped: 0, wpm: null, inputAccuracy: null, finalTextAccuracy: null });
    expect(actual.characters).toBe(characters);
  });
});
