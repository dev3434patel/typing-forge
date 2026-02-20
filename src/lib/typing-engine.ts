export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  elapsedTime: number;
  consistency: number;
}

export interface CharacterState {
  char: string;
  state: 'correct' | 'incorrect' | 'current' | 'upcoming';
  typed?: string;
}

// Import canonical metrics engine for consistency
import { calculateWpm as canonicalWpm, calculateRawWpm as canonicalRawWpm, calculateAccuracy as canonicalAccuracy, calculateConsistency as canonicalConsistency, sanitizeMetric } from './metrics-engine';

/**
 * Calculate WPM from correct characters and elapsed time (in seconds)
 * Delegates to canonical metrics-engine for consistency
 * Formula: (correctChars / 5) / (elapsedTimeSeconds / 60)
 */
export function calculateWPM(correctChars: number, elapsedTimeSeconds: number): number {
  if (elapsedTimeSeconds === 0) return 0;
  const elapsedMs = elapsedTimeSeconds * 1000;
  return sanitizeMetric(canonicalWpm(correctChars, elapsedMs));
}

/**
 * Calculate Raw WPM from total typed characters and elapsed time (in seconds)
 * Delegates to canonical metrics-engine for consistency
 * Formula: (totalChars / 5) / (elapsedTimeSeconds / 60)
 */
export function calculateRawWPM(totalChars: number, elapsedTimeSeconds: number): number {
  if (elapsedTimeSeconds === 0) return 0;
  const elapsedMs = elapsedTimeSeconds * 1000;
  return sanitizeMetric(canonicalRawWpm(totalChars, elapsedMs));
}

/**
 * Calculate accuracy percentage
 * NOTE: This is a simplified version for backward compatibility.
 * For full accuracy calculation with missed/extra chars and backspace handling,
 * use metrics-engine.calculateAccuracy directly.
 * 
 * This function assumes: incorrectChars = totalChars - correctChars
 * For time-based tests where not all text is typed, use metrics-engine instead.
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars === 0) return 100;
  // Use canonical engine with simplified inputs (no missed/extra, no backspace info)
  return sanitizeMetric(canonicalAccuracy(correctChars, totalChars - correctChars, 0, 0, false));
}

/**
 * Calculate consistency from WPM history
 * Delegates to canonical metrics-engine for consistency
 * Formula: 100 - (CV * 100) where CV = stdDev(wpmWindows) / mean(wpmWindows)
 */
export function calculateConsistency(wpmHistory: number[]): number {
  return sanitizeMetric(canonicalConsistency(wpmHistory));
}

export function getCharacterStates(
  targetText: string,
  typedText: string,
  currentIndex: number
): CharacterState[] {
  const states: CharacterState[] = [];
  
  for (let i = 0; i < targetText.length; i++) {
    const targetChar = targetText[i];
    const typedChar = typedText[i];
    
    let state: CharacterState['state'];
    
    if (i < typedText.length) {
      state = typedChar === targetChar ? 'correct' : 'incorrect';
    } else if (i === currentIndex) {
      state = 'current';
    } else {
      state = 'upcoming';
    }
    
    states.push({
      char: targetChar,
      state,
      typed: typedChar
    });
  }
  
  return states;
}

export function getInitialStats(): TypingStats {
  return {
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    errors: 0,
    elapsedTime: 0,
    consistency: 0
  };
}

export interface TestResult {
  id: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  mode: string;
  duration: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  date: string;
  wpmHistory: number[];
}

export function saveTestResult(result: TestResult): void {
  const history = getTestHistory();
  history.unshift(result);
  // Keep last 100 results
  if (history.length > 100) {
    history.pop();
  }
  localStorage.setItem('typingmaster_history', JSON.stringify(history));
}

export function getTestHistory(): TestResult[] {
  const stored = localStorage.getItem('typingmaster_history');
  return stored ? JSON.parse(stored) : [];
}

export function getPersonalBest(): { wpm: number; accuracy: number } | null {
  const history = getTestHistory();
  if (history.length === 0) return null;
  
  const bestWpm = Math.max(...history.map(r => r.wpm));
  const bestAccuracy = Math.max(...history.map(r => r.accuracy));
  
  return { wpm: bestWpm, accuracy: bestAccuracy };
}
