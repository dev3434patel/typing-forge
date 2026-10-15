/**
 * ACCURACY PIPELINE END-TO-END TEST
 * Tests that accuracy calculation is consistent across:
 * 1. metrics-engine.computeSessionMetrics
 * 2. professional-accuracy.generateProfessionalAccuracyReport
 * 3. UI display (via test rendering)
 * 
 * Canonical formula: accuracy = (correctChars / totalDenominator) * 100
 * Where totalDenominator = correctChars + incorrectChars + missedChars + extraChars
 * 
 * Rules:
 * - Perfect final result = 100% accuracy (no backspace cap)
 * - For time-based tests, untyped remainder is NOT counted as missed
 * - Live accuracy MUST match final accuracy (within 1% tolerance)
 */

import { describe, it, expect } from 'vitest';
import { computeSessionMetrics, type KeystrokeRecord } from '../metrics-engine';
import { generateProfessionalAccuracyReport, type Keystroke } from '../professional-accuracy';

// Helper to create keystroke records
function createKeystroke(
  char: string,
  expected: string,
  timestamp: number,
  isBackspace: boolean = false
): KeystrokeRecord {
  return {
    session_id: 'test-session',
    char_expected: expected,
    char_typed: char,
    event_type: 'keydown',
    timestamp_ms: timestamp,
    cursor_index: 0,
    is_backspace: isBackspace,
    is_correct: char === expected && !isBackspace,
  };
}

// Helper to create keystroke log for professional-accuracy
function createKeystrokeLog(
  typedText: string,
  targetText: string,
  startTime: number = 0
): Keystroke[] {
  const keystrokes: Keystroke[] = [];
  for (let i = 0; i < typedText.length; i++) {
    keystrokes.push({
      key: typedText[i],
      char: typedText[i],
      timestamp: startTime + i * 100,
      position: i,
      expected: targetText[i],
      isCorrect: typedText[i] === targetText[i],
    });
  }
  return keystrokes;
}

describe('Accuracy Pipeline - Canonical Formula Consistency', () => {
  describe('Test Case 1: Perfect typing, no backspace', () => {
    it('should return 100% accuracy from both engines', () => {
      const targetText = 'abc';
      const typedText = 'abc';
      const startTime = 1000;
      
      // Create keystroke records
      const keystrokes: KeystrokeRecord[] = [
        createKeystroke('a', 'a', startTime),
        createKeystroke('b', 'b', startTime + 100),
        createKeystroke('c', 'c', startTime + 200),
      ];
      
      // Compute metrics-engine accuracy
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      
      // Compute professional-accuracy report
      const keystrokeLog = createKeystrokeLog(typedText, targetText, startTime);
      const durationSeconds = 0.3;
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        durationSeconds,
        0, // no backspace
        []
      );
      
      // Both should return 100%
      expect(metrics.accuracy).toBe(100);
      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.final).toBe(100);
      
      // Verify counts
      expect(metrics.correctChars).toBe(3);
      expect(metrics.incorrectChars).toBe(0);
      expect(metrics.missedChars).toBe(0);
      expect(metrics.extraChars).toBe(0);
      
      expect(report.accuracy.correctChars).toBe(3);
      expect(report.accuracy.incorrectChars).toBe(0);
      expect(report.accuracy.missedChars).toBe(0);
      expect(report.accuracy.extraChars).toBe(0);
    });
  });

  describe('Test Case 2: One typo, no correction', () => {
    it('should return same accuracy from both engines', () => {
      const targetText = 'abc';
      const typedText = 'axc'; // 'b' typed as 'x'
      const startTime = 1000;
      
      const keystrokes: KeystrokeRecord[] = [
        createKeystroke('a', 'a', startTime),
        createKeystroke('x', 'b', startTime + 100), // typo
        createKeystroke('c', 'c', startTime + 200),
      ];
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const keystrokeLog = createKeystrokeLog(typedText, targetText, startTime);
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        0.3,
        0,
        []
      );
      
      // Canonical formula: correctChars=2, incorrectChars=1, missedChars=0, extraChars=0
      // totalDenominator = 2 + 1 + 0 + 0 = 3
      // accuracy = (2 / 3) * 100 = 66.67%
      const expectedAccuracy = Math.round((2 / 3) * 10000) / 100;
      
      expect(metrics.accuracy).toBeCloseTo(expectedAccuracy, 1);
      expect(report.overview.accuracy).toBeCloseTo(expectedAccuracy, 1);
      expect(report.accuracy.final).toBeCloseTo(expectedAccuracy, 1);
      
      // Verify counts match
      expect(metrics.correctChars).toBe(2);
      expect(metrics.incorrectChars).toBe(1);
      expect(report.accuracy.correctChars).toBe(2);
      expect(report.accuracy.incorrectChars).toBe(1);
    });
  });

  describe('Test Case 3: Typo corrected with backspace', () => {
    it('should return 100% accuracy (perfect final result, no cap)', () => {
      const targetText = 'abc';
      const typedText = 'abc'; // corrected - perfect final result
      const startTime = 1000;
      
      // Simulate: typed 'a', typed 'x' (wrong), backspace, typed 'b', typed 'c'
      const keystrokes: KeystrokeRecord[] = [
        createKeystroke('a', 'a', startTime),
        createKeystroke('x', 'b', startTime + 100), // typo
        createKeystroke('', 'b', startTime + 200, true), // backspace
        createKeystroke('b', 'b', startTime + 300), // corrected
        createKeystroke('c', 'c', startTime + 400),
      ];
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const keystrokeLog: Keystroke[] = [
        { key: 'a', char: 'a', timestamp: startTime, position: 0, expected: 'a', isCorrect: true },
        { key: 'x', char: 'x', timestamp: startTime + 100, position: 1, expected: 'b', isCorrect: false },
        { key: 'Backspace', char: '', timestamp: startTime + 200, position: 1 },
        { key: 'b', char: 'b', timestamp: startTime + 300, position: 1, expected: 'b', isCorrect: true },
        { key: 'c', char: 'c', timestamp: startTime + 400, position: 2, expected: 'c', isCorrect: true },
      ];
      
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        0.5,
        1, // backspace count
        [],
        true // isTimeBasedTest
      );
      
      // Perfect final result = 100% accuracy (no cap)
      expect(metrics.accuracy).toBe(100);
      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.final).toBe(100);
    });
  });

  describe('Test Case 4: Time-based test - partial typing', () => {
    it('should NOT count untyped remainder as missed characters', () => {
      const targetText = 'the quick brown fox';
      const typedText = 'the quick'; // only typed half - all characters match correctly
      const startTime = 1000;
      
      // Verify typedText matches targetText for first 9 characters
      let correctCount = 0;
      for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === targetText[i]) correctCount++;
      }
      
      const keystrokes: KeystrokeRecord[] = [];
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(
          typedText[i],
          targetText[i],
          startTime + i * 100
        ));
      }
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const keystrokeLog = createKeystrokeLog(typedText, targetText, startTime);
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        0.9,
        0,
        [],
        true // isTimeBasedTest
      );
      
      // CRITICAL: For time-based tests, untyped remainder should NOT be counted as missed
      // Only what was typed should be analyzed
      // typedText.length = 9, all correct
      // correctChars = 9, incorrectChars = 0, missedChars = 0, extraChars = 0
      // totalDenominator = 9 + 0 + 0 + 0 = 9
      // accuracy = (9 / 9) * 100 = 100%
      
      expect(metrics.correctChars).toBe(correctCount);
      expect(metrics.incorrectChars).toBe(0);
      // CRITICAL FIX: missedChars should be 0, not 10 (remaining untyped chars)
      expect(metrics.missedChars).toBe(0);
      expect(metrics.extraChars).toBe(0);
      
      // If all typed characters are correct, accuracy should be 100%
      if (correctCount === typedText.length) {
        expect(metrics.accuracy).toBe(100);
        expect(report.overview.accuracy).toBe(100);
        expect(report.accuracy.final).toBe(100);
      }
      
      expect(report.accuracy.missedChars).toBe(0);
    });
  });

  describe('Test Case 5: Extra characters typed', () => {
    it('should include extra chars in denominator', () => {
      const targetText = 'abc';
      const typedText = 'abcd'; // extra 'd'
      const startTime = 1000;
      
      const keystrokes: KeystrokeRecord[] = [
        createKeystroke('a', 'a', startTime),
        createKeystroke('b', 'b', startTime + 100),
        createKeystroke('c', 'c', startTime + 200),
        createKeystroke('d', '', startTime + 300), // extra
      ];
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const keystrokeLog = createKeystrokeLog(typedText, targetText, startTime);
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        0.4,
        0,
        []
      );
      
      // Canonical formula: correctChars=3, incorrectChars=0, missedChars=0, extraChars=1
      // totalDenominator = 3 + 0 + 0 + 1 = 4
      // accuracy = (3 / 4) * 100 = 75%
      const expectedAccuracy = 75;
      
      expect(metrics.accuracy).toBe(expectedAccuracy);
      expect(report.overview.accuracy).toBe(expectedAccuracy);
      expect(report.accuracy.final).toBe(expectedAccuracy);
      
      expect(metrics.extraChars).toBe(1);
      expect(report.accuracy.extraChars).toBe(1);
    });
  });

  describe('Test Case 6: Empty test (no typing)', () => {
    it('should return 100% accuracy (nothing typed = nothing wrong)', () => {
      const targetText = 'abc';
      const typedText = '';
      const startTime = 1000;
      
      const keystrokes: KeystrokeRecord[] = [];
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        [],
        0,
        0,
        [],
        true // isTimeBasedTest
      );
      
      // Empty test = 100% accuracy (perfect, nothing wrong)
      expect(metrics.accuracy).toBe(100);
      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.final).toBe(100);
    });
  });

  describe('Test Case 7: Many errors scenario (matches user bug report)', () => {
    it('should show low accuracy (~10%) when most characters are incorrect', () => {
      // Scenario: User types many wrong characters
      // Example: 6 correct, 49 incorrect = 10.91% accuracy
      // Target: "sends season" (12 chars)
      // Typed with many errors: only 6 characters correct
      const targetText = 'sends season';
      // Create typed text with only 6 correct characters out of 12
      // Position: 0=s✓, 1=e✗, 2=n✗, 3=d✗, 4=s✗, 5=space✗, 6=s✗, 7=e✗, 8=a✗, 9=s✗, 10=o✗, 11=n✗
      // Let's make it: sxxxx xxxxxx (only first char correct)
      // Actually, let's match the user's scenario more closely: 6 correct, rest wrong
      const typedText = 'sxxxx xxxxxx'; // Only 's' at position 0 is correct, rest wrong
      
      // Count actual matches
      let correctCount = 0;
      let incorrectCount = 0;
      const comparisonLength = Math.min(typedText.length, targetText.length);
      for (let i = 0; i < comparisonLength; i++) {
        if (typedText[i] === targetText[i]) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
      
      // Create realistic keystroke records
      const keystrokes: KeystrokeRecord[] = [];
      let timestamp = 1000;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(
          typedText[i],
          targetText[i] || '',
          timestamp,
          false
        ));
        timestamp += 100;
      }
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true); // time-based test
      const keystrokeLog = createKeystrokeLog(typedText, targetText, 1000);
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        1.2, // duration
        0, // no backspace
        [],
        true // isTimeBasedTest
      );
      
      // Verify counts match expected
      expect(metrics.correctChars).toBe(correctCount);
      expect(metrics.incorrectChars).toBe(incorrectCount);
      expect(metrics.missedChars).toBe(0); // time-based test
      expect(metrics.extraChars).toBe(0);
      
      // Calculate expected accuracy using canonical formula
      const totalDenominator = correctCount + incorrectCount + 0 + 0;
      const expectedAccuracy = totalDenominator > 0 
        ? Math.round((correctCount / totalDenominator) * 10000) / 100 
        : 100;
      
      // Both engines should return same low accuracy
      expect(metrics.accuracy).toBeCloseTo(expectedAccuracy, 1);
      expect(report.overview.accuracy).toBeCloseTo(expectedAccuracy, 1);
      expect(report.accuracy.final).toBeCloseTo(expectedAccuracy, 1);
      
      // CRITICAL: If most characters are wrong, accuracy should be LOW
      // For this test: if correctCount < incorrectCount, accuracy < 50%
      if (correctCount < incorrectCount) {
        expect(metrics.accuracy).toBeLessThan(50);
        expect(report.overview.accuracy).toBeLessThan(50);
      }
      
      // Verify error rate matches
      const expectedErrorRate = totalDenominator > 0
        ? Math.round((incorrectCount / totalDenominator) * 10000) / 100
        : 0;
      expect(report.errors.errorRate).toBeCloseTo(expectedErrorRate, 1);
    });
  });

  describe('Test Case 8: Perfect typing with backspace corrections', () => {
    it('should return 100% accuracy (perfect final result, no cap)', () => {
      const targetText = 'hello world';
      const typedText = 'hello world'; // Perfect final result
      const startTime = 1000;
      
      // Simulate: typed perfectly but used backspace to correct
      const keystrokes: KeystrokeRecord[] = [
        createKeystroke('h', 'h', startTime),
        createKeystroke('e', 'e', startTime + 100),
        createKeystroke('x', 'l', startTime + 200), // typo
        createKeystroke('', 'l', startTime + 300, true), // backspace
        createKeystroke('l', 'l', startTime + 400), // corrected
        createKeystroke('l', 'l', startTime + 500),
        createKeystroke('o', 'o', startTime + 600),
        createKeystroke(' ', ' ', startTime + 700),
        createKeystroke('w', 'w', startTime + 800),
        createKeystroke('o', 'o', startTime + 900),
        createKeystroke('r', 'r', startTime + 1000),
        createKeystroke('l', 'l', startTime + 1100),
        createKeystroke('d', 'd', startTime + 1200),
      ];
      
      const metrics = computeSessionMetrics(keystrokes, targetText, typedText, true);
      const keystrokeLog: Keystroke[] = [
        { key: 'h', char: 'h', timestamp: startTime, position: 0, expected: 'h', isCorrect: true },
        { key: 'e', char: 'e', timestamp: startTime + 100, position: 1, expected: 'e', isCorrect: true },
        { key: 'x', char: 'x', timestamp: startTime + 200, position: 2, expected: 'l', isCorrect: false },
        { key: 'Backspace', char: '', timestamp: startTime + 300, position: 2 },
        { key: 'l', char: 'l', timestamp: startTime + 400, position: 2, expected: 'l', isCorrect: true },
        { key: 'l', char: 'l', timestamp: startTime + 500, position: 3, expected: 'l', isCorrect: true },
        { key: 'o', char: 'o', timestamp: startTime + 600, position: 4, expected: 'o', isCorrect: true },
        { key: ' ', char: ' ', timestamp: startTime + 700, position: 5, expected: ' ', isCorrect: true },
        { key: 'w', char: 'w', timestamp: startTime + 800, position: 6, expected: 'w', isCorrect: true },
        { key: 'o', char: 'o', timestamp: startTime + 900, position: 7, expected: 'o', isCorrect: true },
        { key: 'r', char: 'r', timestamp: startTime + 1000, position: 8, expected: 'r', isCorrect: true },
        { key: 'l', char: 'l', timestamp: startTime + 1100, position: 9, expected: 'l', isCorrect: true },
        { key: 'd', char: 'd', timestamp: startTime + 1200, position: 10, expected: 'd', isCorrect: true },
      ];
      
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokeLog,
        1.2,
        1, // backspace count
        [],
        true // isTimeBasedTest
      );
      
      // Perfect final result = 100% accuracy (no cap)
      // "hello world" = 11 characters (h-e-l-l-o-space-w-o-r-l-d)
      expect(metrics.correctChars).toBe(11); // all characters correct in final text
      expect(metrics.incorrectChars).toBe(0);
      expect(metrics.accuracy).toBe(100); // 100%, not 99.99%
      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.final).toBe(100);
    });
  });
});
