/**
 * PER-KEYSTROKE FIDELITY TEST SUITE
 * Tests that verify exact metrics from fixed synthetic keystroke logs
 * Ensures keystroke log is the single source of truth for all metrics
 */

import { describe, it, expect } from 'vitest';
import {
  computeSessionMetrics,
  type KeystrokeRecord,
} from '../metrics-engine';
import {
  generateProfessionalAccuracyReport,
  type Keystroke,
} from '../professional-accuracy';
import {
  calculatePerCharMetrics,
} from '../keybr-engine';

describe('Per-Keystroke Fidelity: Fixed Synthetic Logs', () => {
  const createKeystrokeRecord = (
    char: string,
    expected: string,
    timestamp: number,
    isBackspace: boolean = false
  ): KeystrokeRecord => ({
    session_id: 'test-session',
    char_expected: expected,
    char_typed: char,
    event_type: 'keydown',
    timestamp_ms: timestamp,
    cursor_index: 0,
    is_backspace: isBackspace,
    is_correct: char === expected && !isBackspace,
  });

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

  describe('Fixed Log 1: Perfect typing, 60 WPM', () => {
    const targetText = 'the quick brown fox jumps over the lazy dog';
    const typedText = 'the quick brown fox jumps over the lazy dog';
    
    // 43 chars, at 60 WPM = 43/5 = 8.6 words, 8.6 words / 60 WPM = 0.1433 min = 8.6 seconds
    // 8600ms / 43 chars = 200ms per char
    const keystrokeRecords: KeystrokeRecord[] = [];
    const keystrokes: Keystroke[] = [];
    let timestamp = 0;
    
    for (let i = 0; i < targetText.length; i++) {
      const char = targetText[i];
      keystrokeRecords.push(createKeystrokeRecord(char, char, timestamp));
      keystrokes.push(createKeystroke(char, char, timestamp, i, true));
      timestamp += 200; // 200ms per char = 60 WPM
    }

    it('should compute exact metrics from keystroke log', () => {
      const metrics = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      // Expected: 43 correct chars in 8600ms = (43/5) / (8600/60000) = 8.6 / 0.1433 ≈ 60 WPM
      // Allow 2 WPM tolerance due to rounding
      expect(metrics.netWpm).toBeGreaterThanOrEqual(59);
      expect(metrics.netWpm).toBeLessThanOrEqual(62);
      expect(metrics.accuracy).toBe(100);
      expect(metrics.correctChars).toBe(43);
      expect(metrics.incorrectChars).toBe(0);
      expect(metrics.backspaceCount).toBe(0);
      expect(metrics.isValid).toBe(true);
    });

    it('should generate professional report with exact metrics', () => {
      const durationSeconds = 8.6;
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        0,
        [60, 60, 60]
      );
      
      expect(report.overview.wpm).toBeCloseTo(60, 0.1);
      expect(report.overview.accuracy).toBe(100);
      expect(report.accuracy.correctChars).toBe(43);
      expect(report.errors.totalErrors).toBe(0);
    });

    it('should calculate per-char metrics correctly', () => {
      // Mock localStorage for keybr-engine
      const mockLocalStorage: Record<string, string> = {};
      global.localStorage = {
        getItem: (key: string) => mockLocalStorage[key] || null,
        setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
        removeItem: (key: string) => { delete mockLocalStorage[key]; },
        clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); },
        length: Object.keys(mockLocalStorage).length,
        key: (index: number) => Object.keys(mockLocalStorage)[index] || null,
      } as Storage;
      
      const perCharMetrics = calculatePerCharMetrics(keystrokes as any, 35);
      
      // All letters should have metrics
      const uniqueChars = new Set(targetText.toLowerCase().replace(/[^a-z]/g, '').split(''));
      expect(perCharMetrics.size).toBeGreaterThan(0);
      
      // Check a specific character (e.g., 't')
      const tMetrics = perCharMetrics.get('t');
      if (tMetrics) {
        expect(tMetrics.accuracy).toBe(100);
        expect(tMetrics.wpm).toBeGreaterThan(0);
      }
    });
  });

  describe('Fixed Log 2: 95% accuracy with 2 errors', () => {
    const targetText = 'hello world';
    const typedText = 'hxllo world'; // 'x' instead of 'e'
    
    const keystrokeRecords: KeystrokeRecord[] = [];
    const keystrokes: Keystroke[] = [];
    let timestamp = 0;
    
    for (let i = 0; i < typedText.length; i++) {
      const expected = targetText[i] || '';
      const typed = typedText[i] || '';
      const isCorrect = typed === expected;
      
      keystrokeRecords.push(createKeystrokeRecord(typed, expected, timestamp));
      keystrokes.push(createKeystroke(typed, expected, timestamp, i, isCorrect));
      timestamp += 200;
    }

    it('should compute exact accuracy from keystroke log', () => {
      const metrics = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      // 10 correct out of 11 total = 90.909...%
      expect(metrics.accuracy).toBeCloseTo(90.91, 0.1);
      expect(metrics.correctChars).toBe(10);
      expect(metrics.incorrectChars).toBe(1);
      expect(metrics.isValid).toBe(true);
    });

    it('should match professional report accuracy', () => {
      const durationSeconds = 2.2; // 11 chars * 200ms = 2200ms
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        0,
        [50]
      );
      
      expect(report.overview.accuracy).toBeCloseTo(90.91, 0.1);
      expect(report.errors.typos.length).toBe(1);
      expect(report.errors.typos[0].expected).toBe('e');
      expect(report.errors.typos[0].typed).toBe('x');
    });
  });

  describe('Fixed Log 3: Heavy backspace usage', () => {
    const targetText = 'test';
    const typedText = 'test';
    
    // Type: t, e, x (typo), backspace, s, t
    const keystrokeRecords: KeystrokeRecord[] = [
      createKeystrokeRecord('t', 't', 0),
      createKeystrokeRecord('e', 'e', 200),
      createKeystrokeRecord('x', 's', 400), // typo
      createKeystrokeRecord('', '', 600, true), // backspace
      createKeystrokeRecord('s', 's', 800),
      createKeystrokeRecord('t', 't', 1000),
    ];
    
    const keystrokes: Keystroke[] = [
      createKeystroke('t', 't', 0, 0, true),
      createKeystroke('e', 'e', 200, 1, true),
      createKeystroke('x', 's', 400, 2, false),
      createKeystroke('', '', 600, 2, false), // backspace
      createKeystroke('s', 's', 800, 2, true),
      createKeystroke('t', 't', 1000, 3, true),
    ];

    it('should cap accuracy at 99.99% with backspace', () => {
      const metrics = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      expect(metrics.backspaceCount).toBe(1);
      expect(metrics.accuracy).toBe(99.99); // Capped
      expect(metrics.correctChars).toBe(4);
      expect(metrics.isValid).toBe(true);
    });

    it('should match professional report backspace cap', () => {
      const durationSeconds = 1.0;
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        durationSeconds,
        1,
        [40]
      );
      
      expect(report.typing.backspaceCount).toBe(1);
      expect(report.accuracy.final).toBe(99.99);
    });
  });

  describe('Fixed Log 4: Determinism - same log yields identical results', () => {
    const targetText = 'deterministic test';
    const typedText = 'deterministic test';
    
    const keystrokeRecords: KeystrokeRecord[] = [];
    let timestamp = 0;
    
    for (let i = 0; i < targetText.length; i++) {
      keystrokeRecords.push(createKeystrokeRecord(targetText[i], targetText[i], timestamp));
      timestamp += 150; // ~80 WPM
    }

    it('should return identical metrics on multiple runs', () => {
      const run1 = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      const run2 = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      const run3 = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      // All runs must be identical
      expect(run1.netWpm).toBe(run2.netWpm);
      expect(run2.netWpm).toBe(run3.netWpm);
      expect(run1.accuracy).toBe(run2.accuracy);
      expect(run2.accuracy).toBe(run3.accuracy);
      expect(run1.consistency).toBe(run2.consistency);
      expect(run2.consistency).toBe(run3.consistency);
    });
  });

  describe('Fixed Log 5: Very short session (< 2 seconds)', () => {
    const targetText = 'hi';
    const typedText = 'hi';
    
    const keystrokeRecords: KeystrokeRecord[] = [
      createKeystrokeRecord('h', 'h', 0),
      createKeystrokeRecord('i', 'i', 500), // 0.5 seconds total
    ];
    
    const keystrokes: Keystroke[] = [
      createKeystroke('h', 'h', 0, 0, true),
      createKeystroke('i', 'i', 500, 1, true),
    ];

    it('should handle very short sessions correctly', () => {
      const metrics = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      expect(metrics.durationMs).toBe(500);
      expect(isFinite(metrics.netWpm)).toBe(true);
      expect(metrics.netWpm).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBe(100);
      expect(metrics.isValid).toBe(true);
    });

    it('should generate valid professional report for short session', () => {
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        0.5,
        0,
        []
      );
      
      expect(isFinite(report.overview.wpm)).toBe(true);
      expect(report.overview.wpm).toBeGreaterThanOrEqual(0);
      expect(report.overview.accuracy).toBe(100);
    });
  });

  describe('Fixed Log 6: All mistakes (accuracy near 0%)', () => {
    const targetText = 'hello';
    const typedText = 'xxxxx'; // All wrong
    
    const keystrokeRecords: KeystrokeRecord[] = [];
    const keystrokes: Keystroke[] = [];
    let timestamp = 0;
    
    for (let i = 0; i < typedText.length; i++) {
      keystrokeRecords.push(createKeystrokeRecord('x', targetText[i], timestamp));
      keystrokes.push(createKeystroke('x', targetText[i], timestamp, i, false));
      timestamp += 200;
    }

    it('should compute near-zero accuracy correctly', () => {
      const metrics = computeSessionMetrics(keystrokeRecords, targetText, typedText);
      
      expect(metrics.accuracy).toBe(0);
      expect(metrics.correctChars).toBe(0);
      expect(metrics.incorrectChars).toBe(5);
      expect(isFinite(metrics.netWpm)).toBe(true);
      expect(metrics.netWpm).toBeGreaterThanOrEqual(0);
    });

    it('should match professional report for all mistakes', () => {
      const report = generateProfessionalAccuracyReport(
        targetText,
        typedText,
        keystrokes,
        1.0,
        0,
        [10]
      );
      
      expect(report.overview.accuracy).toBe(0);
      expect(report.errors.totalErrors).toBe(5);
      expect(report.errors.typos.length).toBe(5);
    });
  });
});
