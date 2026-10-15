/**
 * END-TO-END ACCURACY TEST
 * 
 * This test simulates the COMPLETE flow from user typing to final display:
 * 1. User types characters (with keystroke log)
 * 2. Live accuracy calculated in TypingArea
 * 3. Test finishes → computeSessionMetrics called
 * 4. Professional report generated
 * 5. Results screen displays accuracy
 * 
 * This verifies the ENTIRE pipeline matches.
 */

import { describe, it, expect } from 'vitest';
import { computeSessionMetrics, type KeystrokeRecord } from '../metrics-engine';
import { generateProfessionalAccuracyReport, type Keystroke } from '../professional-accuracy';

/**
 * Simulate a complete typing session matching user's 7.2% scenario
 */
function simulateTypingSession(
  targetText: string,
  typedText: string,
  durationSeconds: number = 30
): {
  keystrokes: KeystrokeRecord[];
  keystrokeLog: Keystroke[];
  wpmHistory: number[];
} {
  const keystrokes: KeystrokeRecord[] = [];
  const keystrokeLog: Keystroke[] = [];
  const wpmHistory: number[] = [];
  
  const startTime = 1000;
  const durationMs = durationSeconds * 1000;
  const avgInterval = durationMs / typedText.length;
  
  let timestamp = startTime;
  for (let i = 0; i < typedText.length; i++) {
    const typedChar = typedText[i];
    const targetChar = targetText[i] || '';
    const isCorrect = typedChar === targetChar;
    
    timestamp += avgInterval + (Math.random() - 0.5) * avgInterval * 0.2;
    
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
    
    // Simulate WPM history (sample every 5 seconds)
    if (i % Math.floor(typedText.length / 6) === 0) {
      const elapsed = (timestamp - startTime) / 1000;
      const correctSoFar = typedText.substring(0, i + 1).split('').filter((c, idx) => c === targetText[idx]).length;
      const wpm = elapsed > 0 ? (correctSoFar / 5) / (elapsed / 60) : 0;
      wpmHistory.push(Math.max(0, wpm));
    }
  }
  
  return { keystrokes, keystrokeLog, wpmHistory };
}

describe('End-to-End Accuracy Pipeline Test', () => {
  it('should show consistent accuracy through entire flow (7.2% scenario)', () => {
    // User's actual scenario: 30-second time test, low accuracy
    const targetText = 'the quick brown fox jumps over the lazy dog';
    
    // Create typed text that produces ~7.2% accuracy
    // 7.2% = correctChars / totalDenominator = 0.072
    // If totalDenominator = 55, correctChars = ~4
    // Let's create: 4 correct, 51 incorrect/extra
    const typedText = 'txx qxxxx bxxxx fxx jxxxx oxxx xxx lxxx dxx xxxxxx xxxxxx xxxxxx';
    
    // Simulate complete typing session
    const { keystrokes, keystrokeLog, wpmHistory } = simulateTypingSession(
      targetText,
      typedText,
      30
    );
    
    // STEP 1: Calculate character counts manually (what live accuracy should see)
    const comparisonLength = Math.min(typedText.length, targetText.length);
    let manualCorrect = 0;
    let manualIncorrect = 0;
    for (let i = 0; i < comparisonLength; i++) {
      if (typedText[i] === targetText[i]) {
        manualCorrect++;
      } else {
        manualIncorrect++;
      }
    }
    const manualExtraChars = typedText.length > targetText.length ? typedText.length - targetText.length : 0;
    const manualMissedChars = 0; // time mode
    const manualTotalDenominator = manualCorrect + manualIncorrect + manualMissedChars + manualExtraChars;
    const manualAccuracy = manualTotalDenominator > 0
      ? Math.round((manualCorrect / manualTotalDenominator) * 10000) / 100
      : 100;
    
    console.log('[E2E TEST] Manual calculation (what live HUD should show):', {
      correctChars: manualCorrect,
      incorrectChars: manualIncorrect,
      extraChars: manualExtraChars,
      missedChars: manualMissedChars,
      totalDenominator: manualTotalDenominator,
      accuracy: manualAccuracy,
    });
    
    // STEP 2: Canonical metrics (what final calculation uses)
    const canonicalMetrics = computeSessionMetrics(
      keystrokes,
      targetText,
      typedText,
      true // isTimeBasedTest
    );
    
    console.log('[E2E TEST] Canonical metrics (final calculation):', {
      correctChars: canonicalMetrics.correctChars,
      incorrectChars: canonicalMetrics.incorrectChars,
      extraChars: canonicalMetrics.extraChars,
      missedChars: canonicalMetrics.missedChars,
      accuracy: canonicalMetrics.accuracy,
    });
    
    // STEP 3: Professional report (what results screen displays)
    const report = generateProfessionalAccuracyReport(
      targetText,
      typedText,
      keystrokeLog,
      30,
      0, // no backspace
      wpmHistory,
      true // isTimeBasedTest
    );
    
    console.log('[E2E TEST] Professional report (results screen):', {
      overviewAccuracy: report.overview.accuracy,
      finalAccuracy: report.accuracy.final,
      correctChars: report.accuracy.correctChars,
      incorrectChars: report.accuracy.incorrectChars,
      extraChars: report.accuracy.extraChars,
      missedChars: report.accuracy.missedChars,
    });
    
    // VERIFICATION: All three should match
    expect(manualCorrect).toBe(canonicalMetrics.correctChars);
    expect(manualIncorrect).toBe(canonicalMetrics.incorrectChars);
    expect(manualExtraChars).toBe(canonicalMetrics.extraChars);
    expect(manualMissedChars).toBe(canonicalMetrics.missedChars);
    
    expect(canonicalMetrics.correctChars).toBe(report.accuracy.correctChars);
    expect(canonicalMetrics.incorrectChars).toBe(report.accuracy.incorrectChars);
    expect(canonicalMetrics.extraChars).toBe(report.accuracy.extraChars);
    expect(canonicalMetrics.missedChars).toBe(report.accuracy.missedChars);
    
    // Accuracy should match within 0.5%
    expect(manualAccuracy).toBeCloseTo(canonicalMetrics.accuracy, 1);
    expect(canonicalMetrics.accuracy).toBeCloseTo(report.overview.accuracy, 1);
    expect(report.overview.accuracy).toBeCloseTo(report.accuracy.final, 1);
    
    // CRITICAL: If accuracy is low, all paths should show low
    if (manualAccuracy < 20) {
      expect(canonicalMetrics.accuracy).toBeLessThan(20);
      expect(report.overview.accuracy).toBeLessThan(20);
    }
  });
  
  it('should show consistent accuracy when user types perfectly', () => {
    const targetText = 'the quick brown fox';
    const typedText = 'the quick brown fox'; // Perfect match
    
    const { keystrokes, keystrokeLog, wpmHistory } = simulateTypingSession(
      targetText,
      typedText,
      10
    );
    
    const canonicalMetrics = computeSessionMetrics(
      keystrokes,
      targetText,
      typedText,
      true
    );
    
    const report = generateProfessionalAccuracyReport(
      targetText,
      typedText,
      keystrokeLog,
      10,
      0,
      wpmHistory,
      true
    );
    
    // Perfect typing = 100% accuracy
    expect(canonicalMetrics.accuracy).toBe(100);
    expect(report.overview.accuracy).toBe(100);
    expect(report.accuracy.final).toBe(100);
  });
  
  it('should show consistent accuracy when user types with some errors', () => {
    const targetText = 'hello world';
    const typedText = 'hxllo world'; // One error
    
    const { keystrokes, keystrokeLog, wpmHistory } = simulateTypingSession(
      targetText,
      typedText,
      5
    );
    
    const canonicalMetrics = computeSessionMetrics(
      keystrokes,
      targetText,
      typedText,
      true
    );
    
    const report = generateProfessionalAccuracyReport(
      targetText,
      typedText,
      keystrokeLog,
      5,
      0,
      wpmHistory,
      true
    );
    
    // 10 correct, 1 incorrect = 10/11 = 90.91%
    const expectedAccuracy = Math.round((10 / 11) * 10000) / 100;
    
    expect(canonicalMetrics.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(report.overview.accuracy).toBeCloseTo(expectedAccuracy, 1);
    expect(report.accuracy.final).toBeCloseTo(expectedAccuracy, 1);
  });
});
