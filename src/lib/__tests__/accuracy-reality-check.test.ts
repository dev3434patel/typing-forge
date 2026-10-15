/**
 * ACCURACY REALITY CHECK TEST
 * 
 * This test recreates the actual user scenario from screenshots:
 * - 30-second time test
 * - Low accuracy (7.2%) shown on results screen
 * - User likely typed with some errors but not catastrophic
 * 
 * We trace accuracy through ALL paths:
 * 1. metrics-engine.computeSessionMetrics
 * 2. professional-accuracy.generateProfessionalAccuracyReport
 * 3. Simulated TypingArea → Index → ResultsScreen flow
 * 
 * If any path shows different accuracy, we have a bug.
 */

import { describe, it, expect } from 'vitest';
import { computeSessionMetrics, type KeystrokeRecord } from '../metrics-engine';
import { generateProfessionalAccuracyReport, type Keystroke } from '../professional-accuracy';

// Helper to create keystroke records matching real user behavior
function createRealisticKeystrokeLog(
  targetText: string,
  typedText: string,
  startTime: number = 0,
  durationMs: number = 30000
): { keystrokes: KeystrokeRecord[]; keystrokeLog: Keystroke[] } {
  const keystrokes: KeystrokeRecord[] = [];
  const keystrokeLog: Keystroke[] = [];
  
  // Simulate typing with realistic timing
  const charsPerSecond = typedText.length / (durationMs / 1000);
  const avgInterval = 1000 / charsPerSecond;
  
  let timestamp = startTime;
  for (let i = 0; i < typedText.length; i++) {
    const typedChar = typedText[i];
    const targetChar = targetText[i] || '';
    const isCorrect = typedChar === targetChar;
    
    // Add some realistic variation in timing
    const interval = avgInterval + (Math.random() - 0.5) * avgInterval * 0.3;
    timestamp += interval;
    
    keystrokes.push({
      session_id: 'test-session',
      char_expected: targetChar,
      char_typed: typedChar,
      event_type: 'keydown',
      timestamp_ms: Math.round(timestamp),
      cursor_index: i,
      is_backspace: false,
      is_correct: isCorrect,
    });
    
    keystrokeLog.push({
      key: typedChar,
      char: typedChar,
      timestamp: Math.round(timestamp),
      position: i,
      expected: targetChar,
      isCorrect,
    });
  }
  
  return { keystrokes, keystrokeLog };
}

describe('Accuracy Reality Check - 7.2% Scenario', () => {
  /**
   * Scenario: User types in 30-second time test
   * Target: "the quick brown fox jumps over the lazy dog"
   * Typed: Mix of correct and incorrect characters
   * Expected: Low accuracy (~7-10%) if many errors
   */
  
  it('should show consistent accuracy across all calculation paths', () => {
    // Simulate the actual scenario: user typed ~55 characters in 30 seconds
    // with many errors (matching screenshot showing 7.2% accuracy)
    // Screenshot shows: 7.2% accuracy, 4 WPM, 55 characters typed
    // To get 7.2%: correctChars / totalDenominator = 0.072
    // If totalDenominator = 55, then correctChars = ~4
    // So: 4 correct, 51 incorrect/extra = 7.27% accuracy
    const targetText = 'the quick brown fox jumps over the lazy dog';
    
    // Create typed text with ~4 correct characters out of 55 total
    // Pattern: Only first few characters correct, rest wrong
    // Target starts with "the quick brown fox jumps over the lazy dog"
    // Typed: "txx qxxxx bxxxx fxx jxxxx oxxx xxx lxxx dxx xxxxxx xxxxxx"
    // This gives: t✓, h✗, e✗, space✗, q✗, u✗, i✗, c✗, k✗, space✗, ...
    // Actually, let's be more precise: we need exactly 4 correct out of 55
    // Let's make positions 0, 1, 2, 3 correct, rest wrong
    const typedText = 'the xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx';
    
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
    
    const durationMs = 30000; // 30 seconds
    const durationSeconds = durationMs / 1000;
    const startTime = 1000;
    
    const { keystrokes, keystrokeLog } = createRealisticKeystrokeLog(
      targetText,
      typedText,
      startTime,
      durationMs
    );
    
    // PATH 1: Canonical metrics-engine calculation
    const canonicalMetrics = computeSessionMetrics(
      keystrokes,
      targetText,
      typedText,
      true // isTimeBasedTest
    );
    
    // PATH 2: Professional accuracy report
    const report = generateProfessionalAccuracyReport(
      targetText,
      typedText,
      keystrokeLog,
      durationSeconds,
      0, // no backspace
      [], // no wpm history for now
      true // isTimeBasedTest
    );
    
    // Calculate expected accuracy using canonical formula
    // CRITICAL: Must include extraChars in denominator
    const extraChars = typedText.length > targetText.length ? typedText.length - targetText.length : 0;
    const totalDenominator = correctCount + incorrectCount + 0 + extraChars; // missed=0 for time mode, include extra
    const expectedAccuracy = totalDenominator > 0
      ? Math.round((correctCount / totalDenominator) * 10000) / 100
      : 100;
    
    console.log('[REALITY CHECK] Character counts:', {
      correctCount,
      incorrectCount,
      totalDenominator,
      expectedAccuracy,
    });
    
    console.log('[REALITY CHECK] Canonical metrics:', {
      accuracy: canonicalMetrics.accuracy,
      correctChars: canonicalMetrics.correctChars,
      incorrectChars: canonicalMetrics.incorrectChars,
      missedChars: canonicalMetrics.missedChars,
      extraChars: canonicalMetrics.extraChars,
    });
    
    console.log('[REALITY CHECK] Report metrics:', {
      overviewAccuracy: report.overview.accuracy,
      finalAccuracy: report.accuracy.final,
      correctChars: report.accuracy.correctChars,
      incorrectChars: report.accuracy.incorrectChars,
      missedChars: report.accuracy.missedChars,
      extraChars: report.accuracy.extraChars,
    });
    
    // CRITICAL: All three should match within 0.5%
    expect(canonicalMetrics.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(report.overview.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(report.accuracy.final).toBeCloseTo(expectedAccuracy, 1);
    
    // CRITICAL: Canonical and report should match exactly
    const canonicalVsReport = Math.abs(canonicalMetrics.accuracy - report.overview.accuracy);
    expect(canonicalVsReport).toBeLessThan(0.5);
    
    // CRITICAL: Character counts should match
    expect(canonicalMetrics.correctChars).toBe(correctCount);
    expect(canonicalMetrics.incorrectChars).toBe(incorrectCount);
    expect(report.accuracy.correctChars).toBe(correctCount);
    expect(report.accuracy.incorrectChars).toBe(incorrectCount);
    
    // CRITICAL: For time-based test, missedChars should be 0
    expect(canonicalMetrics.missedChars).toBe(0);
    expect(report.accuracy.missedChars).toBe(0);
  });
  
  it('should match accuracy when user types more than target (time mode)', () => {
    // Scenario: User types beyond target text in time mode
    const targetText = 'the quick brown fox';
    const typedText = 'the quick brown fox jumps over'; // Typed more than target
    
    const { keystrokes, keystrokeLog } = createRealisticKeystrokeLog(
      targetText,
      typedText,
      0,
      30000
    );
    
    const canonicalMetrics = computeSessionMetrics(
      keystrokes,
      targetText,
      typedText,
      true // isTimeBasedTest
    );
    
    const report = generateProfessionalAccuracyReport(
      targetText,
      typedText,
      keystrokeLog,
      30,
      0,
      [],
      true // isTimeBasedTest
    );
    
    // Count matches
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
    const extraChars = typedText.length - targetText.length;
    
    const totalDenominator = correctCount + incorrectCount + 0 + extraChars;
    const expectedAccuracy = totalDenominator > 0
      ? Math.round((correctCount / totalDenominator) * 10000) / 100
      : 100;
    
    expect(canonicalMetrics.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(report.overview.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(canonicalMetrics.extraChars).toBe(extraChars);
    expect(report.accuracy.extraChars).toBe(extraChars);
  });
});
