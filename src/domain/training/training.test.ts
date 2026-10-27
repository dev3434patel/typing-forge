import { describe, expect, it } from 'vitest';
import { generateTrainingDrill, keyPracticeWeight, nextTrainingKey, trainingConfidence } from './generator';
import { calendarDayNumber, interleaveReview, reviewSchedule } from './review';
import { fingerForCharacter } from './finger-map';
import { placementConfiguration, practiceConfiguration } from './placement';
import { learningEvidenceFromResult } from '@/lib/learning-evidence';
import { SessionController } from '@/lib/typing-core';
import { trainingProblemFocus } from './skill-focus';

describe('seeded original drills and bounded review', () => {
  it.each(Array.from({ length: 50 }, (_, index) => `seed-${index}`))('reproduces each drill from its seed %s', seed => {
    const options = { seed, keys: [...'asdfjkl'], count: 20 };
    expect(generateTrainingDrill(options)).toBe(generateTrainingDrill(options));
    expect(generateTrainingDrill(options).split(' ')).toHaveLength(20);
  });
  it.each(Array.from({ length: 50 }, (_, index) => index))('never emits a locked key in restricted alphabet case%i', index => {
    const keys = [...'abcdefghijklmnopqrstuvwxyz'].slice(0, 1 + index % 26);
    const result = generateTrainingDrill({ seed: `locked-${index}`, keys, count: 15 });
    expect([...result].every(key => key === ' ' || keys.includes(key))).toBe(true);
    expect(result.trim().length).toBeGreaterThan(0);
  });
  it.each(Array.from({ length: 25 }, (_, index) => index + 1))('caps interleaved review at30percent for%i items', count => {
    const result = interleaveReview(['new'], Array.from({ length: 50 }, () => 'old'), count);
    expect(result).toHaveLength(count);
    expect(result.filter(item => item.review).length).toBeLessThanOrEqual(Math.floor(count * .3));
    expect(result.filter(item => !item.review).every(item => item.item === 'new')).toBe(true);
  });
  it.each([-1, 0, .1, .5, .92, 1, 2, NaN])('caps weak-key weighting for accuracy%s', value => expect(keyPracticeWeight(value)).toBeGreaterThanOrEqual(1));
  it.each([-1, 0, .1, .5, .92, 1, 2, NaN])('never exceeds4times weight for accuracy%s', value => expect(keyPracticeWeight(value)).toBeLessThanOrEqual(4));
  it('requires every active key, enough evidence and adequate speed before another unlock', () => {
    const observed = [{ key: 'a', accuracy: 1, n: 20, smoothedMs: 300 }, { key: 's', accuracy: 1, n: 20, smoothedMs: 300 }];
    expect(nextTrainingKey(['a', 's', 'd'], ['a', 's'], observed)).toBe('d');
    expect(nextTrainingKey(['a', 's', 'd'], ['a', 's'], observed.slice(0, 1))).toBeNull();
    expect(nextTrainingKey(['a', 's', 'd'], ['a', 's'], observed.map(item => ({ ...item, smoothedMs: 900 })))).toBeNull();
    expect(nextTrainingKey(['a', 's', 'd'], ['a', 's'], observed.map(item => ({ ...item, n: 19 })))).toBeNull();
  });
  it('does not invent confidence for absent or zero latency', () => {
    expect(trainingConfidence({ key: 'a', accuracy: 1, n: 30, smoothedMs: null }, 350)).toBe(0);
    expect(trainingConfidence({ key: 'a', accuracy: 1, n: 30, smoothedMs: 0 }, 350)).toBe(0);
  });
  it('schedules successful revisits at1,3,7 days and resets a weak item', () => {
    const observations = [
      { sessionId: '1', key: 'a', day: '2026-03-07', successful: true },
      { sessionId: '2', key: 'a', day: '2026-03-08', successful: true },
      { sessionId: '3', key: 'a', day: '2026-03-11', successful: true },
    ];
    expect(reviewSchedule(observations).at(0)?.dueDay).toBe('2026-03-18');
    expect(reviewSchedule([...observations, observations[2]])).toEqual(reviewSchedule(observations));
    expect(reviewSchedule([...observations, { sessionId: '4', key: 'a', day: '2026-03-12', successful: false }])[0].dueDay).toBe('2026-03-13');
  });
  it('uses calendar dates across DST and rejects impossible dates', () => {
    expect(calendarDayNumber('2026-03-09') - calendarDayNumber('2026-03-08')).toBe(1);
    expect(calendarDayNumber('2026-11-02') - calendarDayNumber('2026-11-01')).toBe(1);
    expect(() => calendarDayNumber('2026-02-31')).toThrow();
  });
  it.each(['qwerty', 'dvorak', 'colemak', 'workman', 'azerty', 'qwertz'])('uses the existing physical finger table for%s', layout => {
    expect(fingerForCharacter(' ', layout)).toBe('thumb');
    expect(fingerForCharacter('a', layout)).not.toBeNull();
    expect(fingerForCharacter('🙂', layout)).toBeNull();
  });
  it('does not fabricate a physical map for unmapped native scripts', () => expect(fingerForCharacter('ह', 'native', 'hi')).toBeNull());
  it('creates exactly3 reproducible45-second placement stages', () => {
    for (let stage = 0; stage < 3; stage++) {
      const config = placementConfiguration('guest', `part-${stage}`, stage);
      expect(config.durationMs).toBe(45000);
      expect(config.initialTarget.length).toBeGreaterThanOrEqual(4000);
      expect(config.settings?.course).toBeUndefined();
      expect(config.privacy).toBe('private-custom');
    }
    expect(() => placementConfiguration('guest', 'invalid', 3)).toThrow();
  });
  it('free assist never becomes an adaptive assessment or course completion', () => {
    const config = practiceConfiguration({ owner: 'guest', sessionId: 'assist', seed: 'a', kind: 'keys', keys: ['a'], practiceAssist: true, lessonId: 'home-anchors' });
    let now = 0;
    const controller = new SessionController(config, { now: () => now, wallNow: () => 1700000000000 + now });
    for (const key of config.initialTarget) { controller.input({ type: 'insert', text: key }); now += 100; }
    const result = controller.result ?? controller.finish('completed');
    expect(learningEvidenceFromResult(result).assessment).toBe(false);
    expect(result.configuration.settings?.course).toBeUndefined();
  });
  it('rejects an empty alphabet instead of inventing unlocked keys', () => expect(() => generateTrainingDrill({ seed: 'none', keys: [] })).toThrow());
  it('interleaves due review in real generated words without admitting locked keys', () => {
    const result = generateTrainingDrill({ seed: 'review', kind: 'words', keys: [...'abcdefghijklmnopqrstuvwxyz'], reviewKeys: ['z', '🙂'], count: 20 });
    expect(result.split(' ')).toHaveLength(20);
    expect(result.split(' ').filter(word => word === 'zzz')).toHaveLength(1);
    expect(result).not.toContain('🙂');
  });
  it('chooses at most five genuinely measured skill-map keys and bigrams', () => {
    const statistic = (n: number, accuracy: number) => ({ n, accuracy, correct: Math.floor(n * accuracy), speedMs: null, latencyMs: null });
    expect(trainingProblemFocus({ keys: { a: statistic(30, .8), z: statistic(19, .1), s: statistic(50, .99) }, bigrams: { th: statistic(40, .7), 'a ': statistic(50, .1) }, fingers: {}, trigrams: {} })).toEqual(['th', 'a']);
  });
  it('keeps an observed weak bigram together without introducing an unavailable character', () => {
    const text = generateTrainingDrill({ seed: 'pairs', kind: 'problem-keys', keys: [...'asdf'], focusSequences: ['as', 'zz'], count: 20 });
    expect(text.split(' ').every(word => word.includes('as'))).toBe(true);
    expect([...text].every(key => key === ' ' || 'asdf'.includes(key))).toBe(true);
  });
});
