/**
 * TYPING ENGINE TEST SUITE
 * Tests for typing test calculations and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateConsistency,
  getCharacterStates,
  saveTestResult,
  getTestHistory,
  getPersonalBest,
  getInitialStats,
  type TypingStats,
  type TestResult,
} from '../typing-engine';

describe('Typing Engine', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('calculateWPM', () => {
    it('should return 0 for 0 elapsed time', () => {
      expect(calculateWPM(50, 0)).toBe(0);
    });

    it('should calculate correct WPM (standard formula)', () => {
      // 50 correct chars in 60 seconds (1 minute) = 10 WPM (50/5)
      expect(calculateWPM(50, 60)).toBe(10);
    });

    it('should handle 30 second test', () => {
      // 25 correct chars in 30 seconds (0.5 min) = 10 WPM
      expect(calculateWPM(25, 30)).toBe(10);
    });

    it('should calculate high WPM correctly', () => {
      // 400 correct chars in 60 seconds = 80 WPM
      expect(calculateWPM(400, 60)).toBe(80);
    });

    it('should round WPM to integer', () => {
      // 27 chars in 60 seconds = 5.4 WPM → 5
      expect(calculateWPM(27, 60)).toBe(5);
    });
  });

  describe('calculateRawWPM', () => {
    it('should calculate raw WPM including errors', () => {
      // 100 total chars in 60 seconds = 20 WPM
      expect(calculateRawWPM(100, 60)).toBe(20);
    });

    it('should return 0 for 0 elapsed time', () => {
      expect(calculateRawWPM(100, 0)).toBe(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('should return 100% for perfect typing', () => {
      expect(calculateAccuracy(100, 100)).toBe(100);
    });

    it('should calculate correct accuracy with errors', () => {
      // 90 correct out of 100 total = 90%
      expect(calculateAccuracy(90, 100)).toBe(90);
    });

    it('should return 100% for empty test', () => {
      expect(calculateAccuracy(0, 0)).toBe(100);
    });

    it('should round accuracy to 2 decimal places', () => {
      // 95.5% → 95.5 (canonical metrics-engine returns 2 decimal places)
      expect(calculateAccuracy(955, 1000)).toBe(95.5);
    });
  });

  describe('calculateConsistency', () => {
    it('should return 100 for single WPM value', () => {
      expect(calculateConsistency([50])).toBe(100);
    });

    it('should return 100 for perfectly consistent WPM', () => {
      expect(calculateConsistency([50, 50, 50, 50])).toBe(100);
    });

    it('should return lower score for variable WPM', () => {
      const consistency = calculateConsistency([20, 40, 60, 80, 100]);
      expect(consistency).toBeLessThan(100);
      expect(consistency).toBeGreaterThanOrEqual(0);
    });

    it('should clamp between 0 and 100', () => {
      const consistency = calculateConsistency([1, 100, 1, 100, 1, 100]);
      expect(consistency).toBeGreaterThanOrEqual(0);
      expect(consistency).toBeLessThanOrEqual(100);
    });
  });

  describe('getCharacterStates', () => {
    it('should mark correct characters', () => {
      const states = getCharacterStates('hello', 'hello', 5);
      expect(states[0].state).toBe('correct');
      expect(states[1].state).toBe('correct');
      expect(states[4].state).toBe('correct');
    });

    it('should mark incorrect characters', () => {
      const states = getCharacterStates('hello', 'hxllo', 5);
      expect(states[1].state).toBe('incorrect');
      expect(states[1].typed).toBe('x');
    });

    it('should mark current character', () => {
      const states = getCharacterStates('hello', 'he', 2);
      expect(states[2].state).toBe('current');
    });

    it('should mark upcoming characters', () => {
      const states = getCharacterStates('hello', 'he', 2);
      expect(states[3].state).toBe('upcoming');
      expect(states[4].state).toBe('upcoming');
    });

    it('should handle empty typed text', () => {
      const states = getCharacterStates('hello', '', 0);
      expect(states[0].state).toBe('current');
      expect(states[1].state).toBe('upcoming');
    });
  });

  describe('getInitialStats', () => {
    it('should return zero stats', () => {
      const stats = getInitialStats();
      expect(stats.wpm).toBe(0);
      expect(stats.rawWpm).toBe(0);
      expect(stats.accuracy).toBe(100);
      expect(stats.correctChars).toBe(0);
      expect(stats.consistency).toBe(100);
    });
  });

  describe('saveTestResult and getTestHistory', () => {
    it('should save and retrieve test result', () => {
      const result: TestResult = {
        id: 'test-1',
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        consistency: 85,
        mode: 'time',
        duration: 30,
        correctChars: 150,
        incorrectChars: 8,
        totalChars: 158,
        errors: 8,
        date: new Date().toISOString(),
        wpmHistory: [55, 60, 65],
      };

      saveTestResult(result);
      const history = getTestHistory();

      expect(history.length).toBe(1);
      expect(history[0].id).toBe('test-1');
      expect(history[0].wpm).toBe(60);
    });

    it('should keep only last 100 results', () => {
      // Save 101 results
      for (let i = 0; i < 101; i++) {
        const result: TestResult = {
          id: `test-${i}`,
          wpm: 50 + i,
          rawWpm: 55 + i,
          accuracy: 95,
          consistency: 85,
          mode: 'time',
          duration: 30,
          correctChars: 100,
          incorrectChars: 5,
          totalChars: 105,
          errors: 5,
          date: new Date().toISOString(),
          wpmHistory: [],
        };
        saveTestResult(result);
      }

      const history = getTestHistory();
      expect(history.length).toBe(100);
      // Most recent should be test-100
      expect(history[0].id).toBe('test-100');
      // Oldest should be test-1
      expect(history[99].id).toBe('test-1');
    });

    it('should return empty array when no history', () => {
      const history = getTestHistory();
      expect(history).toEqual([]);
    });
  });

  describe('getPersonalBest', () => {
    it('should return null for empty history', () => {
      expect(getPersonalBest()).toBeNull();
    });

    it('should find best WPM and accuracy', () => {
      const results: TestResult[] = [
        {
          id: '1',
          wpm: 50,
          rawWpm: 55,
          accuracy: 90,
          consistency: 80,
          mode: 'time',
          duration: 30,
          correctChars: 100,
          incorrectChars: 10,
          totalChars: 110,
          errors: 10,
          date: new Date().toISOString(),
          wpmHistory: [],
        },
        {
          id: '2',
          wpm: 70,
          rawWpm: 75,
          accuracy: 95,
          consistency: 85,
          mode: 'time',
          duration: 30,
          correctChars: 140,
          incorrectChars: 7,
          totalChars: 147,
          errors: 7,
          date: new Date().toISOString(),
          wpmHistory: [],
        },
        {
          id: '3',
          wpm: 60,
          rawWpm: 65,
          accuracy: 98,
          consistency: 90,
          mode: 'time',
          duration: 30,
          correctChars: 120,
          incorrectChars: 2,
          totalChars: 122,
          errors: 2,
          date: new Date().toISOString(),
          wpmHistory: [],
        },
      ];

      results.forEach(saveTestResult);
      const best = getPersonalBest();

      expect(best).not.toBeNull();
      expect(best?.wpm).toBe(70); // Highest WPM
      expect(best?.accuracy).toBe(98); // Highest accuracy
    });
  });

  describe('Edge Cases - Weird Scenarios', () => {
    it('should handle zero characters typed', () => {
      expect(calculateWPM(0, 60)).toBe(0);
      expect(calculateAccuracy(0, 0)).toBe(100);
      expect(isFinite(calculateWPM(0, 60))).toBe(true);
      expect(isFinite(calculateAccuracy(0, 0))).toBe(true);
    });

    it('should handle test shorter than 2 seconds', () => {
      const wpm = calculateWPM(10, 1); // 10 chars in 1 second
      expect(isFinite(wpm)).toBe(true);
      expect(wpm).toBeGreaterThanOrEqual(0);
      const accuracy = calculateAccuracy(10, 10);
      expect(isFinite(accuracy)).toBe(true);
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });

    it('should handle very long session (30-minute equivalent)', () => {
      // 30 minutes = 1800 seconds
      // At 60 WPM = 300 correct chars per minute = 9000 chars in 30 minutes
      const wpm = calculateWPM(9000, 1800);
      expect(isFinite(wpm)).toBe(true);
      expect(wpm).toBeGreaterThanOrEqual(0);
      expect(wpm).toBeLessThanOrEqual(500); // Reasonable cap
    });

    it('should handle session with only mistakes (accuracy near 0%)', () => {
      const accuracy = calculateAccuracy(0, 100); // 0 correct, 100 total
      expect(accuracy).toBe(0);
      expect(isFinite(accuracy)).toBe(true);
      expect(accuracy).toBeGreaterThanOrEqual(0);
    });

    it('should handle heavy backspace usage', () => {
      // Even with perfect final result, backspace affects accuracy calculation
      // (handled by metrics-engine, typing-engine is simplified)
      const accuracy = calculateAccuracy(100, 100);
      expect(isFinite(accuracy)).toBe(true);
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    });

    it('should ensure consistency stays within [0, 100]', () => {
      const consistency1 = calculateConsistency([1, 200, 1, 200]); // Extreme variance
      expect(consistency1).toBeGreaterThanOrEqual(0);
      expect(consistency1).toBeLessThanOrEqual(100);
      
      const consistency2 = calculateConsistency([50, 50, 50]); // Perfect consistency
      expect(consistency2).toBe(100);
      
      const consistency3 = calculateConsistency([0, 0, 0]); // All zeros
      expect(consistency3).toBe(100); // Filtered out
    });

    it('should ensure re-running same input yields identical results (determinism)', () => {
      const wpm1 = calculateWPM(100, 60);
      const wpm2 = calculateWPM(100, 60);
      expect(wpm1).toBe(wpm2);
      
      const accuracy1 = calculateAccuracy(90, 100);
      const accuracy2 = calculateAccuracy(90, 100);
      expect(accuracy1).toBe(accuracy2);
      
      const consistency1 = calculateConsistency([50, 60, 70]);
      const consistency2 = calculateConsistency([50, 60, 70]);
      expect(consistency1).toBe(consistency2);
    });

    it('should never produce NaN, Infinity, or negative metrics', () => {
      // Test various edge cases
      expect(isFinite(calculateWPM(0, 0))).toBe(true);
      expect(calculateWPM(0, 0)).toBe(0);
      
      expect(isFinite(calculateWPM(100, 0))).toBe(true);
      expect(calculateWPM(100, 0)).toBe(0);
      
      expect(isFinite(calculateAccuracy(0, 0))).toBe(true);
      expect(calculateAccuracy(0, 0)).toBe(100);
      
      expect(isFinite(calculateConsistency([]))).toBe(true);
      expect(calculateConsistency([])).toBe(100);
    });
  });
});
