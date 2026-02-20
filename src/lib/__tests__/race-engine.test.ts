/**
 * RACE ENGINE TEST SUITE
 * Tests for winner determination, metrics integration, and edge cases
 */
import { describe, it, expect } from 'vitest';
import { sanitizeMetric, calculateWpm, calculateRawWpm, calculateConsistency } from '../metrics-engine';

describe('Race Winner Determination', () => {
  // Helper to determine winner using same logic as useRaceEngine
  function determineWinner(
    my: { netWpm: number; accuracy: number; progress: number },
    opp: { netWpm: number; accuracy: number; progress: number },
  ) {
    const myCompleted = my.progress >= 95;
    const oppCompleted = opp.progress >= 95;
    if (myCompleted && !oppCompleted) return { isWinner: true, isTie: false };
    if (!myCompleted && oppCompleted) return { isWinner: false, isTie: false };
    const wpmDiff = Math.abs(my.netWpm - opp.netWpm);
    if (wpmDiff > 0.1) return { isWinner: my.netWpm > opp.netWpm, isTie: false };
    const accDiff = Math.abs(my.accuracy - opp.accuracy);
    if (accDiff > 0.01) return { isWinner: my.accuracy > opp.accuracy, isTie: false };
    return { isWinner: false, isTie: true };
  }

  it('player with higher progress wins', () => {
    const result = determineWinner(
      { netWpm: 50, accuracy: 95, progress: 100 },
      { netWpm: 80, accuracy: 99, progress: 70 },
    );
    expect(result.isWinner).toBe(true);
  });

  it('higher netWpm wins when both completed', () => {
    const result = determineWinner(
      { netWpm: 60, accuracy: 95, progress: 100 },
      { netWpm: 70, accuracy: 95, progress: 100 },
    );
    expect(result.isWinner).toBe(false);
  });

  it('higher accuracy wins when WPM tied', () => {
    const result = determineWinner(
      { netWpm: 60, accuracy: 97, progress: 100 },
      { netWpm: 60, accuracy: 95, progress: 100 },
    );
    expect(result.isWinner).toBe(true);
  });

  it('tie when everything matches', () => {
    const result = determineWinner(
      { netWpm: 60, accuracy: 95, progress: 100 },
      { netWpm: 60, accuracy: 95, progress: 100 },
    );
    expect(result.isTie).toBe(true);
  });

  it('DNF player (< 95%) loses to completer', () => {
    const result = determineWinner(
      { netWpm: 30, accuracy: 90, progress: 50 },
      { netWpm: 25, accuracy: 85, progress: 98 },
    );
    expect(result.isWinner).toBe(false);
  });

  it('neither completed: higher WPM wins', () => {
    const result = determineWinner(
      { netWpm: 40, accuracy: 90, progress: 60 },
      { netWpm: 50, accuracy: 88, progress: 55 },
    );
    // Neither >= 95%, so netWpm decides
    expect(result.isWinner).toBe(false);
  });
});

describe('Race Metrics Integration', () => {
  it('calculateWpm matches Monkeytype formula', () => {
    // 300 correct chars in 60s → (300/5)/1 = 60 WPM
    expect(calculateWpm(300, 60000)).toBe(60);
  });

  it('calculateRawWpm counts all chars', () => {
    // 350 total chars (including wrong) in 60s → (350/5)/1 = 70
    expect(calculateRawWpm(350, 60000)).toBe(70);
  });

  it('consistency is 0 with < 2 windows', () => {
    expect(calculateConsistency([])).toBe(0);
    expect(calculateConsistency([50])).toBe(0);
  });

  it('consistency is ~100 with perfectly stable WPM', () => {
    const consistency = calculateConsistency([60, 60, 60, 60, 60]);
    expect(consistency).toBeGreaterThan(95);
  });

  it('consistency drops with high variance', () => {
    const consistency = calculateConsistency([20, 80, 20, 80, 20]);
    expect(consistency).toBeLessThan(50);
  });

  it('sanitizeMetric handles edge cases', () => {
    expect(sanitizeMetric(NaN)).toBe(0);
    expect(sanitizeMetric(Infinity)).toBe(0);
    expect(sanitizeMetric(-5)).toBe(0);
    expect(sanitizeMetric(200000)).toBe(0);
    expect(sanitizeMetric(50)).toBe(50);
  });
});
