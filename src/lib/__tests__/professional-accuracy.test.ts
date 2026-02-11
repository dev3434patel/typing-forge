/**
 * PROFESSIONAL ACCURACY TEST SUITE
 * Tests for detailed accuracy analysis and reporting
 */

import { describe, it, expect } from 'vitest';
import {
  generateProfessionalAccuracyReport,
  generateTextReport,
  type Keystroke,
} from '../professional-accuracy';

describe('Professional Accuracy', () => {
  const createKeystroke = (
    char: string,
    expected: string,
    timestamp: number,
    position: number,
    isCorrect: boolean = char === expected
  ): Keystroke => ({
    key: char === '' ? 'Backspace' : char,
    char,
    timestamp,
    position,
    expected,
    isCorrect,
  });

  describe('generateProfessionalAccuracyReport', () => {
    it('should generate report for perfect typing', () => {
      const targetText = 'hello world';
      const typedText = 'hello world';
      const keystrokes: Keystroke[] = [
        createKeystroke('h', 'h', 0, 0),
        createKeystroke('e', 'e', 200, 1),
        createKeystroke('l', 'l', 400, 2),
        createKeystroke('l', 'l', 600, 3),
        createKeystroke('o', 'o', 800, 4),
        createKeystroke(' ', ' ', 1000, 5),
        createKeystroke('w', 'w', 1200, 6),
        createKeystroke('o', 'o', 1400, 7),
        createKeystroke('r', 'r', 1600, 8),
        createKeystroke('l', 'l', 1800, 9),
        createKeystroke('d', 'd', 2000, 10),
      ];
      const durationSeconds = 2;
      const backspaceCount = 0;
      const wpmHistory = [30, 35, 40];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.correctChars).toBe(11);
      expect(report.accuracy.incorrectChars).toBe(0);
      expect(report.errors.totalErrors).toBe(0);
      expect(report.assessment.skillLevel).toBeDefined();
    });

    it('should cap accuracy at 99.99% when backspace used', () => {
      const targetText = 'hello';
      const typedText = 'hello';
      const keystrokes: Keystroke[] = [
        createKeystroke('h', 'h', 0, 0),
        createKeystroke('x', 'e', 200, 1, false), // typo
        createKeystroke('', '', 400, 1, false), // backspace
        createKeystroke('e', 'e', 600, 1),
        createKeystroke('l', 'l', 800, 2),
        createKeystroke('l', 'l', 1000, 3),
        createKeystroke('o', 'o', 1200, 4),
      ];
      const durationSeconds = 1.2;
      const backspaceCount = 1;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.accuracy.final).toBe(99.99);
      expect(report.typing.backspaceCount).toBe(1);
    });

    it('should not count untyped text as missed for time-based tests', () => {
      const targetText = 'hello world this is a long text';
      const typedText = 'hello world'; // Only typed part
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 200;
      }
      const durationSeconds = 2;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      // Should not count remaining untyped text as missed
      expect(report.accuracy.missedChars).toBe(0);
      expect(report.errors.misses.length).toBe(0);
      // All metrics should be finite
      expect(isFinite(report.overview.wpm)).toBe(true);
      expect(isFinite(report.overview.accuracy)).toBe(true);
      expect(report.overview.accuracy).toBeGreaterThanOrEqual(0);
      expect(report.overview.accuracy).toBeLessThanOrEqual(100);
    });

    it('should handle zero characters typed', () => {
      const targetText = 'hello';
      const typedText = '';
      const keystrokes: Keystroke[] = [];
      const durationSeconds = 0;
      const backspaceCount = 0;
      const wpmHistory = [];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.overview.wpm).toBe(0);
      expect(report.overview.accuracy).toBe(100); // Empty test = 100%
      expect(isFinite(report.overview.wpm)).toBe(true);
      expect(isFinite(report.overview.accuracy)).toBe(true);
    });

    it('should handle test shorter than 2 seconds', () => {
      const targetText = 'hi';
      const typedText = 'hi';
      const keystrokes: Keystroke[] = [
        createKeystroke('h', 'h', 0, 0),
        createKeystroke('i', 'i', 500, 1),
      ];
      const durationSeconds = 0.5;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(isFinite(report.overview.wpm)).toBe(true);
      expect(report.overview.wpm).toBeGreaterThanOrEqual(0);
      expect(report.overview.accuracy).toBeGreaterThanOrEqual(0);
      expect(report.overview.accuracy).toBeLessThanOrEqual(100);
    });

    it('should handle session with accuracy near 0%', () => {
      const targetText = 'hello';
      const typedText = 'xxxxx'; // All wrong
      const keystrokes: Keystroke[] = [
        createKeystroke('x', 'h', 0, 0, false),
        createKeystroke('x', 'e', 200, 1, false),
        createKeystroke('x', 'l', 400, 2, false),
        createKeystroke('x', 'l', 600, 3, false),
        createKeystroke('x', 'o', 800, 4, false),
      ];
      const durationSeconds = 0.8;
      const backspaceCount = 0;
      const wpmHistory = [10];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.overview.accuracy).toBeGreaterThanOrEqual(0);
      expect(report.overview.accuracy).toBeLessThan(5); // Near 0%
      expect(report.errors.totalErrors).toBe(5);
      expect(isFinite(report.overview.wpm)).toBe(true);
      expect(report.overview.wpm).toBeGreaterThanOrEqual(0);
    });

    it('should handle heavy backspace usage with accuracy cap', () => {
      const targetText = 'test';
      const typedText = 'test';
      const keystrokes: Keystroke[] = [
        createKeystroke('t', 't', 0, 0),
        createKeystroke('x', 'e', 200, 1, false), // typo
        createKeystroke('', '', 400, 1, false), // backspace
        createKeystroke('e', 'e', 600, 1),
        createKeystroke('x', 's', 800, 2, false), // typo
        createKeystroke('', '', 1000, 2, false), // backspace
        createKeystroke('s', 's', 1200, 2),
        createKeystroke('x', 't', 1400, 3, false), // typo
        createKeystroke('', '', 1600, 3, false), // backspace
        createKeystroke('t', 't', 1800, 3),
      ];
      const durationSeconds = 1.8;
      const backspaceCount = 3;
      const wpmHistory = [20];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.typing.backspaceCount).toBe(3);
      expect(report.accuracy.final).toBe(99.99); // Capped
      expect(report.accuracy.final).toBeLessThanOrEqual(99.99);
      expect(isFinite(report.overview.wpm)).toBe(true);
    });

    it('should classify errors correctly', () => {
      const targetText = 'hello';
      const typedText = 'hxllo'; // 'x' instead of 'e'
      const keystrokes: Keystroke[] = [
        createKeystroke('h', 'h', 0, 0),
        createKeystroke('x', 'e', 200, 1, false), // typo
        createKeystroke('l', 'l', 400, 2),
        createKeystroke('l', 'l', 600, 3),
        createKeystroke('o', 'o', 800, 4),
      ];
      const durationSeconds = 0.8;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.errors.typos.length).toBe(1);
      expect(report.errors.typos[0].expected).toBe('e');
      expect(report.errors.typos[0].typed).toBe('x');
      expect(report.errors.totalErrors).toBe(1);
    });

    it('should calculate character type distribution', () => {
      const targetText = 'hello 123 world!';
      const typedText = 'hello 123 world!';
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 200;
      }
      const durationSeconds = 3;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.distribution.letters.correct).toBeGreaterThan(0);
      expect(report.distribution.numbers.correct).toBeGreaterThan(0);
      expect(report.distribution.spaces.correct).toBeGreaterThan(0);
      expect(report.distribution.punctuation.correct).toBeGreaterThan(0);
    });

    it('should calculate consistency from WPM history', () => {
      const targetText = 'hello world';
      const typedText = 'hello world';
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 200;
      }
      const durationSeconds = 2;
      const backspaceCount = 0;
      const wpmHistory = [30, 35, 40, 35, 30]; // Variable WPM

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.consistency.score).toBeGreaterThanOrEqual(0);
      expect(report.consistency.score).toBeLessThanOrEqual(100);
      expect(report.consistency.peakWpm).toBe(40);
      expect(report.consistency.lowestWpm).toBe(30);
    });

    it('should assess skill level correctly', () => {
      // Professional level: high accuracy + high WPM
      const targetText = 'hello world';
      const typedText = 'hello world';
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 100; // Fast typing
      }
      const durationSeconds = 1;
      const backspaceCount = 0;
      const wpmHistory = [80, 85, 90];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      // Should be PROFESSIONAL or ADVANCED
      expect(['PROFESSIONAL', 'ADVANCED']).toContain(report.assessment.skillLevel);
    });

    it('should identify strengths and improvements', () => {
      const targetText = 'hello world';
      const typedText = 'hello world';
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 200;
      }
      const durationSeconds = 2;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.assessment.strengths.length).toBeGreaterThan(0);
      expect(report.assessment.improvements.length).toBeGreaterThan(0);
      expect(report.assessment.overallRating).toBeGreaterThanOrEqual(0);
      expect(report.assessment.overallRating).toBeLessThanOrEqual(100);
    });

    it('should generate character comparison array', () => {
      const targetText = 'hello';
      const typedText = 'hxllo';
      const keystrokes: Keystroke[] = [
        createKeystroke('h', 'h', 0, 0),
        createKeystroke('x', 'e', 200, 1, false),
        createKeystroke('l', 'l', 400, 2),
        createKeystroke('l', 'l', 600, 3),
        createKeystroke('o', 'o', 800, 4),
      ];
      const durationSeconds = 0.8;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      expect(report.charComparison.length).toBe(5);
      expect(report.charComparison[0].status).toBe('CORRECT');
      expect(report.charComparison[1].status).toBe('INCORRECT');
      expect(report.charComparison[1].errorType).toBe('TYPO');
    });
  });

  describe('generateTextReport', () => {
    it('should generate text report', () => {
      const targetText = 'hello';
      const typedText = 'hello';
      const keystrokes: Keystroke[] = [];
      let timestamp = 0;
      for (let i = 0; i < typedText.length; i++) {
        keystrokes.push(createKeystroke(typedText[i], targetText[i], timestamp, i));
        timestamp += 200;
      }
      const durationSeconds = 1;
      const backspaceCount = 0;
      const wpmHistory = [30];

      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        backspaceCount,
        wpmHistory
      );

      const textReport = generateTextReport(report);

      expect(textReport).toContain('PROFESSIONAL TYPING TEST ACCURACY REPORT');
      expect(textReport).toContain('OVERVIEW METRICS');
      expect(textReport).toContain('ACCURACY BREAKDOWN');
      expect(textReport).toContain('TYPING METRICS');
    });
  });
});
