/**
 * LIVE ACCURACY UPDATE TEST
 * 
 * Tests that accuracy updates correctly as user types errors.
 * This simulates the live HUD behavior.
 */

import { describe, it, expect } from 'vitest';
import { calculateAccuracy } from '../metrics-engine';

describe('Live Accuracy Update Test', () => {
  /**
   * Simulate typing progression:
   * Start: empty (100% accuracy)
   * After 1 correct char: 100% (1/1)
   * After 1 error: 50% (1/2)
   * After more errors: drops further
   */
  
  it('should start at 100% when no typing', () => {
    const accuracy = calculateAccuracy(0, 0, 0, 0, false);
    expect(accuracy).toBe(100); // Empty test = 100%
  });
  
  it('should show 100% after typing one correct character', () => {
    const accuracy = calculateAccuracy(1, 0, 0, 0, false);
    expect(accuracy).toBe(100);
  });
  
  it('should drop to 50% after typing one error', () => {
    const accuracy = calculateAccuracy(1, 1, 0, 0, false);
    expect(accuracy).toBe(50);
  });
  
  it('should drop to 33.33% after typing two errors', () => {
    const accuracy = calculateAccuracy(1, 2, 0, 0, false);
    expect(accuracy).toBeCloseTo(33.33, 1);
  });
  
  it('should drop to ~10% when typing many errors (7.2% scenario)', () => {
    // Scenario: 4 correct, 51 incorrect/extra
    // But let's use a simpler case: 4 correct, 50 incorrect = 4/54 = 7.41%
    const accuracy = calculateAccuracy(4, 50, 0, 0, false);
    expect(accuracy).toBeCloseTo(7.41, 1);
    expect(accuracy).toBeLessThan(10);
  });
  
  it('should include extraChars in denominator (time mode)', () => {
    // User types beyond target: 10 correct, 5 incorrect, 0 missed, 10 extra
    // totalDenominator = 10 + 5 + 0 + 10 = 25
    // accuracy = 10/25 = 40%
    const accuracy = calculateAccuracy(10, 5, 0, 10, false);
    expect(accuracy).toBe(40);
  });
  
  it('should show progression as user types', () => {
    // Simulate typing progression
    const progressions = [
      { correct: 0, incorrect: 0, missed: 0, extra: 0, expected: 100 }, // Start
      { correct: 1, incorrect: 0, missed: 0, extra: 0, expected: 100 }, // First char correct
      { correct: 1, incorrect: 1, missed: 0, extra: 0, expected: 50 }, // First error
      { correct: 2, incorrect: 1, missed: 0, extra: 0, expected: 66.67 }, // Correct again
      { correct: 2, incorrect: 2, missed: 0, extra: 0, expected: 50 }, // Another error
      { correct: 2, incorrect: 10, missed: 0, extra: 0, expected: 16.67 }, // Many errors
    ];
    
    progressions.forEach(({ correct, incorrect, missed, extra, expected }) => {
      const accuracy = calculateAccuracy(correct, incorrect, missed, extra, false);
      expect(accuracy).toBeCloseTo(expected, 1);
    });
  });
  
  it('should match live calculation logic exactly', () => {
    // This is what TypingArea.tsx does in the stats useMemo
    const targetText = 'hello world';
    const typedText = 'hxllo world'; // One error
    
    // Manual calculation (same as TypingArea)
    const comparisonLength = Math.min(typedText.length, targetText.length);
    let correctChars = 0;
    let incorrectChars = 0;
    
    for (let i = 0; i < comparisonLength; i++) {
      if (typedText[i] === targetText[i]) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }
    
    const extraChars = typedText.length > targetText.length ? typedText.length - targetText.length : 0;
    const missedChars = 0; // time mode
    const totalDenominator = correctChars + incorrectChars + missedChars + extraChars;
    
    // Use canonical formula
    const liveAccuracy = calculateAccuracy(correctChars, incorrectChars, missedChars, extraChars, false);
    
    // Expected: 10 correct, 1 incorrect = 10/11 = 90.91%
    const expectedAccuracy = Math.round((10 / 11) * 10000) / 100;
    
    expect(liveAccuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(correctChars).toBe(10);
    expect(incorrectChars).toBe(1);
    expect(extraChars).toBe(0);
  });
  
  it('should handle edge case: empty typedText (start of test)', () => {
    // When user hasn't typed anything yet
    const accuracy = calculateAccuracy(0, 0, 0, 0, false);
    expect(accuracy).toBe(100); // Empty = 100% (correct behavior)
  });
  
  it('should drop immediately after first error', () => {
    // User types first character wrong
    const accuracy = calculateAccuracy(0, 1, 0, 0, false);
    expect(accuracy).toBe(0); // 0/1 = 0%
  });
  
  it('should show low accuracy when typing many errors early', () => {
    // User types: wrong, wrong, wrong, correct, wrong
    // 1 correct, 4 incorrect = 1/5 = 20%
    const accuracy = calculateAccuracy(1, 4, 0, 0, false);
    expect(accuracy).toBe(20);
  });
});
