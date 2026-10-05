/**
 * METRICS ENGINE v2.0
 * Canonical, mathematically correct metric calculations
 * All metrics are computed from keystroke logs for reproducibility
 */

export interface KeystrokeRecord {
  user_id?: string;
  session_id: string;
  char_expected: string;
  char_typed: string;
  event_type: 'keydown' | 'keyup';
  timestamp_ms: number;
  cursor_index: number;
  is_backspace: boolean;
  is_correct: boolean;
}

export interface SessionMetrics {
  // Core metrics
  rawWpm: number;
  netWpm: number;
  /** PRIMARY accuracy: keystroke-based (correctKeystrokes / totalKeystrokes * 100). */
  accuracy: number;
  /** SECONDARY accuracy: based on the final text vs target (ignores corrected keystrokes). */
  finalTextAccuracy: number;
  consistency: number;
  
  // Character counts
  totalTypedChars: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;

  // Keystroke counts (basis for primary accuracy)
  totalKeystrokes: number;
  correctKeystrokes: number;
  
  // Timing
  durationMs: number;
  durationSeconds: number;
  durationMinutes: number;
  charsPerSecond: number;
  
  // Advanced metrics
  peakWpm: number;
  lowestWpm: number;
  backspaceCount: number;
  
  // Validation
  isValid: boolean;
  validationErrors: string[];
}

export interface WpmWindow {
  startMs: number;
  endMs: number;
  wpm: number;
  correctChars: number;
}

// Rolling window size in milliseconds (5 seconds default)
const WPM_WINDOW_SIZE_MS = 5000;
const WPM_WINDOW_STEP_MS = 1000;

/**
 * Calculate WPM from correct characters and elapsed time
 * Formula: (correctChars / 5) / (elapsedMs / 60000)
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const durationMinutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round(words / durationMinutes);
}

/**
 * Calculate Raw WPM from total typed characters
 * Formula: (totalTypedChars / 5) / (elapsedMs / 60000)
 */
export function calculateRawWpm(totalTypedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const durationMinutes = elapsedMs / 60000;
  const words = totalTypedChars / 5;
  return Math.round(words / durationMinutes);
}

/**
 * SECONDARY accuracy — "final text" accuracy.
 * Formula: (correctChars / totalDenominator) * 100
 * Where totalDenominator = correctChars + incorrectChars + missedChars + extraChars.
 *
 * This measures how closely the FINAL typed text matches the target and intentionally
 * ignores keystrokes that were typed and later corrected. It is NOT the headline number;
 * the headline accuracy is keystroke-based (see calculateKeystrokeAccuracy).
 *
 * An empty comparison (nothing typed, nothing wrong) returns 100.
 * NOTE: `backspaceUsed` is retained for API compatibility and does not affect the result
 * (there is no cap/penalty on final-text accuracy).
 */
export function calculateAccuracy(
  correctChars: number,
  incorrectChars: number,
  missedChars: number,
  extraChars: number,
  backspaceUsed: boolean = false
): number {
  void backspaceUsed;
  const totalDenominator = correctChars + incorrectChars + missedChars + extraChars;

  if (totalDenominator === 0) return 100;

  const accuracy = (correctChars / totalDenominator) * 100;

  // Round to 2 decimal places for precision. No cap.
  return Math.round(accuracy * 100) / 100;
}

/**
 * PRIMARY accuracy — keystroke-based (MonkeyType/Keybr model).
 * Formula: (correctKeystrokes / totalKeystrokes) * 100, rounded to 2 decimals.
 *
 * Every printable keypress counts; backspaces are excluded from both counts.
 * Corrected typos still cost accuracy (the wrong keypress was still a wrong keypress).
 *
 * Zero keystrokes returns 0 (never NaN) — nothing typed means no demonstrated accuracy.
 * No caps, no overrides.
 */
export function calculateKeystrokeAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  if (totalKeystrokes <= 0) return 0;
  const accuracy = (correctKeystrokes / totalKeystrokes) * 100;
  return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate consistency from WPM windows (MonkeyType formula).
 * consistency = 100 * (1 - tanh(cov + cov^3/3 + cov^5/5))
 * where cov = stdDev / mean (coefficient of variation).
 * Clamped to [0, 100]. Fewer than 2 valid samples returns 100.
 */
export function calculateConsistency(wpmWindows: number[]): number {
  // Filter out zero/invalid values
  const validWpms = wpmWindows.filter(w => w > 0 && isFinite(w));
  if (validWpms.length < 2) return 100;

  const mean = validWpms.reduce((a, b) => a + b, 0) / validWpms.length;
  if (mean <= 0) return 100;

  const variance = validWpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / validWpms.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation
  const cov = stdDev / mean;

  // MonkeyType consistency transform
  const consistency = 100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5));

  return Math.round(Math.max(0, Math.min(100, consistency)) * 100) / 100;
}

/**
 * Calculate rolling WPM windows from keystroke log
 */
export function calculateWpmWindows(
  keystrokes: KeystrokeRecord[],
  windowSizeMs: number = WPM_WINDOW_SIZE_MS,
  stepMs: number = WPM_WINDOW_STEP_MS
): WpmWindow[] {
  if (keystrokes.length === 0) return [];
  
  const windows: WpmWindow[] = [];
  const startTime = keystrokes[0].timestamp_ms;
  const endTime = keystrokes[keystrokes.length - 1].timestamp_ms;
  
  for (let windowStart = startTime; windowStart <= endTime - windowSizeMs; windowStart += stepMs) {
    const windowEnd = windowStart + windowSizeMs;
    
    // Count correct characters in this window
    const windowKeystrokes = keystrokes.filter(
      ks => ks.timestamp_ms >= windowStart && 
            ks.timestamp_ms < windowEnd && 
            ks.is_correct &&
            !ks.is_backspace
    );
    
    const correctChars = windowKeystrokes.length;
    const wpm = calculateWpm(correctChars, windowSizeMs);
    
    windows.push({
      startMs: windowStart,
      endMs: windowEnd,
      wpm,
      correctChars
    });
  }
  
  return windows;
}

/**
 * Compute all session metrics from keystroke log
 * This is the CANONICAL source of truth for metrics
 * 
 * @param keystrokes - Array of keystroke records
 * @param targetText - The target text to type
 * @param finalTypedText - The final typed text
 * @param isTimeBasedTest - If true, untyped remainder is NOT counted as missed chars (for time-based tests)
 */
export function computeSessionMetrics(
  keystrokes: KeystrokeRecord[],
  targetText: string,
  finalTypedText: string,
  isTimeBasedTest: boolean = false
): SessionMetrics {
  const validationErrors: string[] = [];

  const hasKeystrokes = keystrokes.length > 0;
  if (!hasKeystrokes) {
    validationErrors.push('No keystrokes recorded');
  }

  // Calculate timing (fall back to 0 when no keystrokes are available)
  const startTime = hasKeystrokes ? keystrokes[0].timestamp_ms : 0;
  const endTime = hasKeystrokes ? keystrokes[keystrokes.length - 1].timestamp_ms : 0;
  const durationMs = hasKeystrokes ? Math.max(0, endTime - startTime) : 0;
  const durationSeconds = durationMs / 1000;
  const durationMinutes = durationMs / 60000;

  // Validate duration
  if (hasKeystrokes && durationMs <= 0) {
    validationErrors.push('Invalid duration');
  }
  
  // Count character types from final comparison
  const comparisonLength = Math.min(finalTypedText.length, targetText.length);
  let correctChars = 0;
  let incorrectChars = 0;
  let missedChars = 0;
  let extraChars = 0;
  
  // Compare typed vs target
  // PERFECT ACCURACY: Character-by-character exact comparison
  for (let i = 0; i < comparisonLength; i++) {
    // PERFECT COMPARISON: Exact character match (case-sensitive, whitespace-sensitive)
    // This ensures 100% accuracy when all characters match exactly
    if (finalTypedText[i] === targetText[i]) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }
  
  // Handle extra chars (typed beyond target)
  if (finalTypedText.length > targetText.length) {
    extraChars = finalTypedText.length - targetText.length;
  }
  
  // Handle missed chars (target beyond typed)
  // CRITICAL: For time-based tests, untyped remainder is NOT counted as missed
  // Only count missed chars if it's NOT a time-based test
  if (!isTimeBasedTest && targetText.length > finalTypedText.length) {
    missedChars = targetText.length - finalTypedText.length;
  }
  // For time-based tests, missedChars remains 0 (untyped remainder is expected behavior)
  
  const totalTypedChars = finalTypedText.length;
  
  // Count backspaces
  const backspaceCount = keystrokes.filter(ks => ks.is_backspace).length;
  
  // Keystroke-based counts (basis for PRIMARY accuracy).
  // Every printable keypress counts; backspaces are excluded.
  const printableKeystrokes = keystrokes.filter(ks => !ks.is_backspace);
  const totalKeystrokes = printableKeystrokes.length;
  const correctKeystrokes = printableKeystrokes.filter(ks => ks.is_correct).length;
  
  // Calculate WPM windows for consistency
  const wpmWindows = calculateWpmWindows(keystrokes);
  const wpmValues = wpmWindows.map(w => w.wpm);
  
  // Calculate metrics
  const rawWpm = calculateRawWpm(totalTypedChars, durationMs);
  const netWpm = calculateWpm(correctChars, durationMs);
  // PRIMARY accuracy = keystroke-based. SECONDARY = final-text based.
  const accuracy = calculateKeystrokeAccuracy(correctKeystrokes, totalKeystrokes);
  const finalTextAccuracy = calculateAccuracy(correctChars, incorrectChars, missedChars, extraChars);
  const consistency = calculateConsistency(wpmValues);
  const charsPerSecond = durationSeconds > 0 ? Math.round((totalTypedChars / durationSeconds) * 100) / 100 : 0;
  
  // Peak and lowest WPM
  const validWpms = wpmValues.filter(w => w > 0);
  const peakWpm = validWpms.length > 0 ? Math.max(...validWpms) : netWpm;
  const lowestWpm = validWpms.length > 0 ? Math.min(...validWpms) : netWpm;
  
  // Validate metrics for NaN/Infinity
  const metricsToValidate = { rawWpm, netWpm, accuracy, finalTextAccuracy, consistency, peakWpm, lowestWpm, charsPerSecond };
  for (const [key, value] of Object.entries(metricsToValidate)) {
    if (!isFinite(value) || isNaN(value)) {
      validationErrors.push(`Invalid ${key}: ${value}`);
    }
  }
  
  return {
    rawWpm,
    netWpm,
    accuracy,
    finalTextAccuracy,
    consistency,
    totalTypedChars,
    correctChars,
    incorrectChars,
    missedChars,
    extraChars,
    totalKeystrokes,
    correctKeystrokes,
    durationMs,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    durationMinutes: Math.round(durationMinutes * 1000) / 1000,
    charsPerSecond,
    peakWpm,
    lowestWpm,
    backspaceCount,
    isValid: validationErrors.length === 0,
    validationErrors
  };
}

/**
 * Calculate progress percentage for race mode
 * Formula: (correctCharsTyped / expectedTextLength) * 100
 */
export function calculateProgress(correctChars: number, expectedTextLength: number): number {
  if (expectedTextLength <= 0) return 0;
  const progress = (correctChars / expectedTextLength) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}

/**
 * Validate a metric value is safe for display
 * Returns 0 if invalid (NaN, Infinity, negative for non-negative metrics)
 */
export function sanitizeMetric(value: number, allowNegative: boolean = false): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  if (!allowNegative && value < 0) return 0;
  return value;
}

/**
 * Reconstruct typed text from keystroke log
 * Used for server-side validation
 */
export function reconstructTypedText(keystrokes: KeystrokeRecord[]): string {
  let text = '';
  
  for (const ks of keystrokes) {
    if (ks.is_backspace) {
      // Remove last character
      text = text.slice(0, -1);
    } else if (ks.char_typed && ks.char_typed.length === 1) {
      text += ks.char_typed;
    }
  }
  
  return text;
}

/**
 * Verify client-submitted metrics against keystroke log
 * Returns validation result with details
 */
export function verifyMetrics(
  clientMetrics: Partial<SessionMetrics>,
  keystrokes: KeystrokeRecord[],
  targetText: string
): { valid: boolean; errors: string[]; computedMetrics: SessionMetrics } {
  const errors: string[] = [];
  
  // Reconstruct typed text from keystrokes
  const reconstructedText = reconstructTypedText(keystrokes);
  
  // Compute canonical metrics
  const computedMetrics = computeSessionMetrics(keystrokes, targetText, reconstructedText);
  
  // Tolerance for floating point comparison (0.5%)
  const TOLERANCE = 0.5;
  
  // Verify each metric
  if (clientMetrics.rawWpm !== undefined) {
    const diff = Math.abs(clientMetrics.rawWpm - computedMetrics.rawWpm);
    if (diff > computedMetrics.rawWpm * (TOLERANCE / 100) && diff > 2) {
      errors.push(`rawWpm mismatch: client=${clientMetrics.rawWpm}, server=${computedMetrics.rawWpm}`);
    }
  }
  
  if (clientMetrics.accuracy !== undefined) {
    const diff = Math.abs(clientMetrics.accuracy - computedMetrics.accuracy);
    if (diff > TOLERANCE) {
      errors.push(`accuracy mismatch: client=${clientMetrics.accuracy}, server=${computedMetrics.accuracy}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    computedMetrics
  };
}
