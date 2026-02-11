/**
 * METRICS CONSISTENCY TEST SUITE
 * Verifies that live metrics match final canonical metrics within tight tolerance
 * This ensures UI never shows contradictory or ambiguous stats
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  computeSessionMetrics,
  type KeystrokeRecord,
} from '../metrics-engine';
import {
  calculateWPM,
  calculateAccuracy as typingEngineAccuracy,
} from '../typing-engine';

describe('Metrics Consistency: Live vs Final', () => {
  const createKeystroke = (
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

  it('should match live WPM with final WPM within 1% tolerance', () => {
    const targetText = 'hello world test typing';
    const typedText = 'hello world test typing';
    const elapsedSeconds = 5;
    const elapsedMs = elapsedSeconds * 1000;
    
    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) correctChars++;
    }
    
    // Live calculation (via typing-engine, which delegates to metrics-engine)
    const liveWpm = calculateWPM(correctChars, elapsedSeconds);
    
    // Final calculation (canonical metrics-engine)
    const finalWpm = calculateWpm(correctChars, elapsedMs);
    
    // Should match exactly (same formula)
    expect(liveWpm).toBe(finalWpm);
  });

  it('should match live accuracy with final accuracy within 0.5% tolerance', () => {
    const typedText = 'hello world';
    const targetText = 'hello world';
    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) correctChars++;
    }
    
    // Live calculation (simplified, via typing-engine)
    const liveAccuracy = typingEngineAccuracy(correctChars, typedText.length);
    
    // Final calculation (canonical metrics-engine)
    const finalAccuracy = calculateAccuracy(
      correctChars,
      typedText.length - correctChars, // incorrectChars
      0, // missedChars
      0, // extraChars
      false // backspaceUsed
    );
    
    // Should match within 0.5% tolerance
    const diff = Math.abs(liveAccuracy - finalAccuracy);
    expect(diff).toBeLessThan(0.5);
  });

  it('should match metrics for test with errors', () => {
    const targetText = 'hello world';
    const typedText = 'hxllo world'; // 'x' instead of 'e'
    const elapsedSeconds = 3;
    const elapsedMs = elapsedSeconds * 1000;
    
    let correctChars = 0;
    let incorrectChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) {
        correctChars++;
      } else {
        incorrectChars++;
      }
    }
    
    // Live WPM
    const liveWpm = calculateWPM(correctChars, elapsedSeconds);
    
    // Final WPM (canonical)
    const finalWpm = calculateWpm(correctChars, elapsedMs);
    
    expect(liveWpm).toBe(finalWpm);
    
    // Live accuracy
    const liveAccuracy = typingEngineAccuracy(correctChars, typedText.length);
    
    // Final accuracy (canonical)
    const finalAccuracy = calculateAccuracy(
      correctChars,
      incorrectChars,
      0,
      0,
      false
    );
    
    const diff = Math.abs(liveAccuracy - finalAccuracy);
    expect(diff).toBeLessThan(0.5);
  });

  it('should match metrics computed from keystroke log', () => {
    const targetText = 'test';
    const typedText = 'test';
    const keystrokes: KeystrokeRecord[] = [
      createKeystroke('t', 't', 0),
      createKeystroke('e', 'e', 200),
      createKeystroke('s', 's', 400),
      createKeystroke('t', 't', 600),
    ];
    
    // Compute canonical metrics from keystroke log
    const sessionMetrics = computeSessionMetrics(keystrokes, targetText, typedText);
    
    // Live calculation (simplified)
    const elapsedSeconds = 0.6;
    const liveWpm = calculateWPM(4, elapsedSeconds); // 4 correct chars
    const liveAccuracy = typingEngineAccuracy(4, 4);
    
    // Should match within tolerance
    const wpmDiff = Math.abs(liveWpm - sessionMetrics.netWpm);
    expect(wpmDiff).toBeLessThan(1); // < 1 WPM tolerance
    
    const accDiff = Math.abs(liveAccuracy - sessionMetrics.accuracy);
    expect(accDiff).toBeLessThan(0.5); // < 0.5% tolerance
  });

  it('should handle backspace capping consistently', () => {
    const typedText = 'hello';
    const targetText = 'hello';
    const correctChars = 5;
    
    // Live: manual cap at 99.99% if backspace used
    let liveAccuracy = typingEngineAccuracy(correctChars, typedText.length);
    if (liveAccuracy === 100) {
      liveAccuracy = 99.99; // Manual cap (as in TypingArea)
    }
    
    // Final: canonical cap
    const finalAccuracy = calculateAccuracy(
      correctChars,
      0,
      0,
      0,
      true // backspaceUsed
    );
    
    // Both should cap at 99.99%
    expect(liveAccuracy).toBe(99.99);
    expect(finalAccuracy).toBe(99.99);
  });
});
