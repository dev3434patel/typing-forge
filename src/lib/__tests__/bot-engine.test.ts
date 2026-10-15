import { describe, expect, it } from 'vitest';
import { BOT_CONFIGS, createBot, createBotState, getNextKeystrokeDelay, simulateKeystroke, simulateFullRace, getBotName, getExpectedCompletionTime, seededRandom, type BotLevel } from '../bot-engine';

describe('deterministic bot engine', () => {
  it('provides ordered difficulty levels and empty initial state', () => {
    expect(BOT_CONFIGS.pro.targetWpmMean).toBeGreaterThan(BOT_CONFIGS.beginner.targetWpmMean);
    const state = createBotState('beginner', 'hello', seededRandom(1));
    expect(state.typedText).toBe(''); expect(state.cursorIndex).toBe(0); expect(state.isFinished).toBe(false);
  });
  it('has an injected clock and does not move before its scheduled event', () => {
    let now = 1000;
    const bot = createBot('beginner', 'hello', { now: () => now, random: seededRandom(1) });
    bot.start(); expect(bot.state.startTime).toBe(1000);
    bot.tick(); expect(bot.state.typedText).toBe('');
    now = 61000; bot.tick(); expect(bot.isFinished()).toBe(true); expect(bot.state.typedText).toBe('hello');
  });
  it('schedules correction and retyping without applying future events immediately', () => {
    const original = createBotState('beginner', 'a', seededRandom(1)); original.config.mistakeProbability = 1;
    const mistaken = simulateKeystroke(original, 400, () => .5);
    expect(mistaken.typedText).not.toBe('a'); expect(mistaken.keystrokes).toHaveLength(1); expect(mistaken.isFinished).toBe(false);
    expect(simulateKeystroke(mistaken, mistaken.pendingCorrection!.at - 1)).toBe(mistaken);
    const removed = simulateKeystroke(mistaken, mistaken.pendingCorrection!.at, () => .5);
    expect(removed.typedText).toBe(''); expect(removed.keystrokes).toHaveLength(2);
    const corrected = simulateKeystroke(removed, removed.pendingCorrection!.at, () => .5);
    expect(corrected.typedText).toBe('a'); expect(corrected.progress).toBe(100); expect(corrected.isFinished).toBe(true);
    expect(corrected.accuracy).toBe(50);
    expect(corrected.keystrokes.every((event, index, events) => !index || event.timestamp >= events[index - 1].timestamp)).toBe(true);
  });
  it('is reproducible and matches frame-by-frame playback after frame suspension', () => {
    const updates = simulateFullRace('intermediate', 'the quick brown fox', 200, { random: seededRandom(42) });
    expect(simulateFullRace('intermediate', 'the quick brown fox', 200, { random: seededRandom(42) })).toEqual(updates);
    let now = 0;
    const bot = createBot('intermediate', 'the quick brown fox', { now: () => now, random: seededRandom(42) }); bot.start();
    now = updates[updates.length - 1].timestamp; bot.tick();
    expect(bot.state.typedText).toBe(updates[updates.length - 1].typedText);
    expect(bot.state.currentWpm).toBe(updates[updates.length - 1].wpm);
  });
  for (const level of ['beginner', 'intermediate', 'pro'] as BotLevel[]) {
    it(`completes ${level} races at a bounded pace with real corrections`, () => {
      const speeds: number[] = [];
      for (let seed = 1; seed <= 30; seed++) {
        const updates = simulateFullRace(level, 'the quick brown fox jumps over the lazy dog', 200, { random: seededRandom(seed) });
        const last = updates[updates.length - 1]; speeds.push(last.wpm);
        expect(last.progress).toBe(100); expect(last.typedText).toBe('the quick brown fox jumps over the lazy dog');
        for (const update of updates) {
          expect(update.progress).toBeGreaterThanOrEqual(0); expect(update.progress).toBeLessThanOrEqual(100);
          expect(Number.isFinite(update.wpm)).toBe(true); expect(update.accuracy).toBeGreaterThanOrEqual(0); expect(update.accuracy).toBeLessThanOrEqual(100);
        }
      }
      const average = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      expect(Math.abs(average - BOT_CONFIGS[level].targetWpmMean) / BOT_CONFIGS[level].targetWpmMean).toBeLessThan(.2);
    });
  }
  it('handles empty targets and RNG boundary values with finite delays', () => {
    expect(simulateFullRace('pro', '')[0].progress).toBe(100);
    expect(createBot('pro', '').isFinished()).toBe(true);
    for (const value of [0, 1]) expect(Number.isFinite(getNextKeystrokeDelay(createBotState('pro', 'a', () => value), () => value))).toBe(true);
  });
  it('provides names and positive time estimates without wall-clock waiting', () => {
    expect(getBotName('pro', seededRandom(1)).length).toBeGreaterThan(0);
    expect(getExpectedCompletionTime('beginner', 100)).toBeGreaterThan(getExpectedCompletionTime('pro', 100));
  });
});
