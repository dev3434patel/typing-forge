import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attemptsFromKeystrokes, calculatePerCharMetrics, generateKeybrLesson, getAllCharacterStats, getCharacterData,
  getCharacterHistory, getLearningSessions, getLockedLetters, getUnlockedLetters, getWeakLetters,
  LEARNING_VERSION, mergeLearningSessions, reconcileLearningSessions, recordLearningSession, removeLearningSession, resetKeybrProgress,
  saveCharacterData, type Keystroke, type LearningSessionEvidence,
} from '../keybr-engine';
import { CONTENT_PACKS, graphemes } from '../content-packs';
import { sessionRepository } from '@/services/session-repository';

const dimensions = { language: 'en', layout: 'qwerty', inputMethod: 'keyboard', domain: 'prose' } as const;
function lesson(id: number, letters = ['e', 't', 'a', 'o', 'i', 'n'], count = 25, errors = 0): LearningSessionEvidence {
  let timestamp = 0;
  const strokes: Keystroke[] = letters.flatMap(char => Array.from({ length: count }, (_, index) => ({ char: index < errors ? '#' : char, expected: char, timestamp: timestamp += 200, isCorrect: index >= errors })));
  return { learningVersion: LEARNING_VERSION, sessionId: `lesson-${id}`, completedAt: new Date(Date.UTC(2026, 9, 15, 0, id)).toISOString(), elapsedMs: timestamp, dimensions, attempts: attemptsFromKeystrokes(strokes), assessment: true, targetWpm: 35 };
}

describe('Forge learning v3', () => {
  beforeEach(() => { localStorage.clear(); resetKeybrProgress(); });
  it('begins a fresh learner with six introduced and zero mastered keys', () => {
    expect(getUnlockedLetters()).toEqual(['e', 't', 'a', 'o', 'i', 'n']);
    expect(getLockedLetters()).toHaveLength(20);
    expect(getAllCharacterStats().filter(stat => stat.mastered)).toHaveLength(0);
    expect(getCharacterData()).toEqual({});
  });
  it('preserves eight legacy introductions but does not fabricate mastery evidence', () => {
    localStorage.setItem('keybr_character_data', JSON.stringify({ e: { char: 'e', confidence: 1, wpm: 80, accuracy: 100, occurrences: 20, isUnlocked: true } }));
    expect(getUnlockedLetters()).toEqual(expect.arrayContaining(['e', 't', 'a', 'o', 'i', 'n', 's', 'r']));
    expect(getAllCharacterStats().find(stat => stat.char === 'e')).toMatchObject({ mastered: false, lessonCount: 0, assessmentState: 'introduced', occurrences: 20 });
    expect(getUnlockedLetters({ owner: 'other-account' })).toHaveLength(6);
  });
  it('handles corrupted old or new storage without throwing', () => {
    localStorage.setItem('keybr_character_data', '{bad');
    localStorage.setItem('typingforge:v3:guest:learning', '{bad');
    expect(getUnlockedLetters()).toHaveLength(6);
  });
  it('does not infer latency for the trigger attempt', () => {
    const summary = calculatePerCharMetrics([{ char: 'e', expected: 'e', timestamp: 0, isCorrect: true }]).get('e')!;
    expect(summary).toMatchObject({ accuracy: 100, occurrences: 1, qualifiedLatencySamples: 0, wpm: 0 });
  });
  it('records rejected errors and recomputes correctness from the characters', () => {
    const strokes = [{ char: 'x', expected: 'a', timestamp: 0, isCorrect: true }, { char: 'a', expected: 'a', timestamp: 200, isCorrect: false }];
    expect(calculatePerCharMetrics(strokes).get('a')).toMatchObject({ accuracy: 50, occurrences: 2, qualifiedLatencySamples: 1 });
  });
  it('does not count deletions as insertion attempts', () => {
    const evidence = attemptsFromKeystrokes([{ char: 'a', expected: 'a', timestamp: 0 }, { char: '', expected: '', timestamp: 20, key: 'Backspace' }, { char: 'a', expected: 'a', timestamp: 200 }]);
    expect(evidence).toHaveLength(2);
    expect(evidence[1].latencyMs).toBe(200);
  });
  it('excludes deliberate inactivity from key latency while retaining its classification', () => {
    const attempts = attemptsFromKeystrokes([{ char: 'e', expected: 'e', timestamp: 0 }, { char: 'e', expected: 'e', timestamp: 4000 }, { char: 'e', expected: 'e', timestamp: 4200 }]);
    expect(attempts[1]).toMatchObject({ classification: 'inactivity', latencyMs: null, attributable: false });
    expect(attempts[2].latencyMs).toBe(200);
  });
  it('never assigns individual timing to simultaneous IME graphemes', () => {
    const attempts = attemptsFromKeystrokes([{ char: 'e', expected: 'e', timestamp: 0 }, { char: 'a', expected: 'a', timestamp: 300, compositionGroup: 'ime' }, { char: 'n', expected: 'n', timestamp: 300, compositionGroup: 'ime' }, { char: 'e', expected: 'e', timestamp: 500 }]);
    expect(attempts.slice(1).every(item => item.latencyMs === null && !item.attributable)).toBe(true);
    expect(attempts[1].classification).toBe('composition');
  });
  it('uses an uncapped speed ratio and alpha .1 smoothing', () => {
    const value = calculatePerCharMetrics([{ char: 'e', expected: 'e', timestamp: 0 }, { char: 'e', expected: 'e', timestamp: 100 }, { char: 'e', expected: 'e', timestamp: 300 }], 35).get('e')!;
    expect(value.avgTimeMs).toBeCloseTo(110);
    expect(value.confidence).toBeCloseTo((60000 / (35 * 5)) / 110);
    expect(value.confidence).toBeGreaterThan(1);
  });
  it('requires twenty attributable attempts across two lessons and two qualifying checkpoints', () => {
    recordLearningSession(lesson(1));
    expect(getAllCharacterStats().some(stat => stat.mastered)).toBe(false);
    recordLearningSession(lesson(2));
    expect(getAllCharacterStats().find(stat => stat.char === 'e')).toMatchObject({ mastered: false, masteryCheckpoints: 1, lessonCount: 2 });
    const update = recordLearningSession(lesson(3));
    expect(update.newlyUnlocked).toEqual(['s']);
    expect(getAllCharacterStats().filter(stat => stat.mastered).map(stat => stat.char)).toEqual(['e', 't', 'a', 'o', 'i', 'n']);
    expect(getUnlockedLetters()).toHaveLength(7);
  });
  it('does not introduce a letter merely because an unavailable letter was typed quickly', () => {
    for (let i = 1; i <= 3; i++) recordLearningSession(lesson(i, ['z']));
    expect(getUnlockedLetters()).not.toContain('z');
    expect(getAllCharacterStats().find(stat => stat.char === 'z')?.mastered).toBe(false);
  });
  it('requires 97 percent recent accuracy without rounding a failing value upward', () => {
    for (let i = 1; i <= 4; i++) recordLearningSession(lesson(i, undefined, 25, 1));
    expect(getAllCharacterStats().filter(stat => stat.mastered)).toHaveLength(0);
    expect(getUnlockedLetters()).toHaveLength(6);
  });
  it('allows old mistakes to leave the recent window and recover mastery', () => {
    recordLearningSession(lesson(1, undefined, 25, 15));
    for (let i = 2; i <= 4; i++) recordLearningSession(lesson(i));
    expect(getAllCharacterStats().find(stat => stat.char === 'e')).toMatchObject({ accuracy: 100, mastered: true, recentAttempts: 50 });
    expect(getUnlockedLetters()).toContain('s');
  });
  it('preserves introduced keys when mastered keys later need review', () => {
    for (let i = 1; i <= 3; i++) recordLearningSession(lesson(i));
    recordLearningSession(lesson(4, ['e'], 50, 20));
    expect(getAllCharacterStats().find(stat => stat.char === 'e')).toMatchObject({ mastered: true, assessmentState: 'review' });
    expect(getUnlockedLetters()).toContain('s');
  });
  it('does not grant initial mastery from review/context evidence', () => {
    for (let i = 1; i <= 4; i++) recordLearningSession({ ...lesson(i), assessment: false });
    expect(getAllCharacterStats().filter(stat => stat.mastered)).toHaveLength(0);
    expect(getAllCharacterStats().find(stat => stat.char === 'e')?.lessonCount).toBe(0);
  });
  it('deduplicates a repeated session identity and rejects changed evidence', () => {
    const evidence = lesson(1);
    recordLearningSession(evidence); recordLearningSession(evidence);
    expect(getLearningSessions()).toHaveLength(1);
    expect(getCharacterHistory('e')).toHaveLength(1);
    expect(() => recordLearningSession({ ...evidence, elapsedMs: 2 })).toThrow('identity conflict');
  });
  it('keeps account, language, layout, domain, and input method models separate', () => {
    recordLearningSession(lesson(1), 'alice');
    expect(getCharacterData()).toEqual({});
    expect(getCharacterData({ owner: 'bob' })).toEqual({});
    expect(getCharacterData({ owner: 'alice', dimensions: { ...dimensions, language: 'es' } })).toEqual({});
    expect(getCharacterData({ owner: 'alice', dimensions: { ...dimensions, layout: 'dvorak' } })).toEqual({});
    expect(getCharacterData({ owner: 'alice', dimensions: { ...dimensions, domain: 'code' } })).toEqual({});
    expect(getCharacterData({ owner: 'alice', dimensions: { ...dimensions, inputMethod: 'composition' } })).toEqual({});
    expect(Object.keys(getCharacterData({ owner: 'alice' }))).toHaveLength(6);
  });
  it('merges out-of-order session evidence deterministically without stale overwrites', () => {
    mergeLearningSessions([lesson(3), lesson(1), lesson(2)], 'alice', 10);
    mergeLearningSessions([lesson(1)], 'alice', 2);
    mergeLearningSessions([lesson(1), lesson(2), lesson(3)], 'bob', 10);
    expect(getAllCharacterStats({ owner: 'alice' })).toEqual(getAllCharacterStats({ owner: 'bob' }));
    expect(getLearningSessions({ owner: 'alice' })).toHaveLength(3);
  });
  it('rebuilds real key history and mastery when a session is removed', () => {
    for (let i = 1; i <= 3; i++) recordLearningSession(lesson(i));
    removeLearningSession('lesson-3');
    expect(getCharacterHistory('e')).toHaveLength(2);
    expect(getAllCharacterStats().find(stat => stat.char === 'e')?.mastered).toBe(false);
    expect(getUnlockedLetters()).toContain('s');
  });
  it('reconciles remote deletion without discarding pending local sessions or resurrecting stale evidence', () => {
    reconcileLearningSessions([lesson(1), lesson(2)], 'alice', 2);
    recordLearningSession(lesson(3), 'alice');
    reconcileLearningSessions([lesson(2)], 'alice', 3);
    expect(getLearningSessions({ owner: 'alice' }).map(item => item.sessionId).sort()).toEqual(['lesson-2', 'lesson-3']);
    reconcileLearningSessions([lesson(1), lesson(2)], 'alice', 2);
    recordLearningSession(lesson(1), 'alice');
    expect(getLearningSessions({ owner: 'alice' }).map(item => item.sessionId).sort()).toEqual(['lesson-2', 'lesson-3']);
  });
  it('observes deletions made anywhere through the repository', async () => {
    recordLearningSession(lesson(1), 'alice');
    await sessionRepository.remove('alice', 'lesson-1');
    expect(getLearningSessions({ owner: 'alice' })).toHaveLength(0);
  });
  it('prioritizes under-assessed keys ahead of adequately sampled keys', () => {
    recordLearningSession(lesson(1, ['e'], 30));
    expect(getWeakLetters(1)[0]).not.toBe('e');
  });
  it('preserves imported introduced letters without inventing session history', () => {
    saveCharacterData({ z: { char: 'z', wpm: 50, accuracy: 90, occurrences: 10, confidence: 1, avgTimeMs: 200, stdDev: 0, isUnlocked: true, status: 'unlocked' } });
    expect(getUnlockedLetters()).toContain('z');
    expect(getCharacterHistory('z')).toEqual([]);
    expect(getAllCharacterStats().find(stat => stat.char === 'z')?.mastered).toBe(false);
  });
  it('keeps current-visit progress if durable learning storage is unavailable', () => {
    const setter = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    expect(recordLearningSession(lesson(1)).persisted).toBe(false);
    expect(getLearningSessions()).toHaveLength(1);
    setter.mockRestore(); resetKeybrProgress();
  });
  it('rejects malformed learning evidence', () => {
    expect(() => recordLearningSession({ ...lesson(1), targetWpm: NaN })).toThrow('Invalid learning evidence');
  });
});

describe('Seeded adaptive lesson generation', () => {
  it('is deterministic, finite, nonempty and includes focus in every new-key word', () => {
    const first = generateKeybrLesson(100, { seed: 'stable' });
    expect(generateKeybrLesson(100, { seed: 'stable' })).toEqual(first);
    const focus = first.focusLetters[0];
    expect(first.text.split(' ')).toHaveLength(100);
    expect(first.text.split(' ').every(word => graphemes(word).includes(focus))).toBe(true);
    expect(graphemes(first.text.replace(/ /g, '')).every(char => first.availableLetters.includes(char))).toBe(true);
    expect(first.naturalWordCount + first.phoneticWordCount).toBe(100);
  });
  it('clamps pathological requested lengths and labels mixed review explicitly', () => {
    expect(generateKeybrLesson(-3, { seed: 'x' }).text.split(' ')).toHaveLength(1);
    expect(generateKeybrLesson(Infinity, { seed: 'x' }).text.split(' ')).toHaveLength(2000);
    const review = generateKeybrLesson(20, { seed: 'x', review: true });
    expect(review.review).toBe(true);
    expect(review.focusLetters).toEqual([]);
  });
  it('can target a locked result key without silently introducing it into the curriculum', () => {
    const exercise = generateKeybrLesson(20, { seed: 'target', targeted: true, focusLetters: ['z'] });
    expect(exercise.focusLetters).toEqual(['z']);
    expect(exercise.text.split(' ').every(word => word.includes('z'))).toBe(true);
    expect(getUnlockedLetters()).not.toContain('z');
  });
  for (const pack of CONTENT_PACKS) it(`terminates with allowed graphemes and guaranteed focus for ${pack.id}`, () => {
    const lesson = generateKeybrLesson(40, { seed: `pack-${pack.id}`, dimensions: { ...dimensions, language: pack.id } });
    const locale = pack.id === 'gu-Latn' ? 'gu' : pack.id;
    expect(lesson.text.length).toBeGreaterThan(0);
    for (const word of lesson.text.split(' ')) {
      const units = graphemes(word, locale);
      expect(units.length).toBeLessThanOrEqual(12);
      expect(units.every(char => lesson.availableLetters.includes(char))).toBe(true);
      expect(units).toContain(lesson.focusLetters[0]);
    }
  });
});
