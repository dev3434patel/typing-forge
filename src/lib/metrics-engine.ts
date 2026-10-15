/**
 * Legacy v2 adapters retained for historical records and old consumers.
 * New sessions and validation use ./typing-core (forge-v3). These records do not
 * contain normalized edit evidence or a reliable full session duration.
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
  metricsVersion: 'legacy-v2';
  // Core metrics
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;

  // Character counts
  totalTypedChars: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;

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
  if (!Number.isFinite(correctChars) || !Number.isFinite(elapsedMs) || correctChars < 0 || elapsedMs <= 0) return 0;
  const durationMinutes = elapsedMs / 60000;
  const words = correctChars / 5;
  const value = words / durationMinutes;
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Calculate Raw WPM from total typed characters
 * Formula: (totalTypedChars / 5) / (elapsedMs / 60000)
 */
export function calculateRawWpm(totalTypedChars: number, elapsedMs: number): number {
  return calculateWpm(totalTypedChars, elapsedMs);
}

/**
 * Calculate accuracy percentage
 * Formula: (correctChars / totalDenominator) * 100
 * Where totalDenominator = correctChars + incorrectChars + missedChars + extraChars
 *
 * PERFECT ACCURACY: When all characters are correct (correctChars = totalDenominator),
 * accuracy = 100% always!
 *
 * If the final typed text matches the target perfectly, user deserves 100% accuracy
 * regardless of backspace usage. Backspace is a correction tool - perfect final result = 100%!
 */
export function calculateAccuracy(
  correctChars: number,
  incorrectChars: number,
  missedChars: number,
  extraChars: number,
  _backspaceUsed: boolean
): number {
  if (![correctChars, incorrectChars, missedChars, extraChars].every(value => Number.isFinite(value) && value >= 0)) return 0;
  const totalDenominator = correctChars + incorrectChars + missedChars + extraChars;

  if (totalDenominator === 0) return 100;

  // PERFECT ACCURACY: Calculate accuracy with precision
  const accuracy = (correctChars / totalDenominator) * 100;

  // PERFECT ACCURACY: If final typed text matches target perfectly (all correct, no errors),
  // user deserves 100% accuracy regardless of backspace usage
  // Backspace is a tool for correction - if corrections result in perfect final text, reward it!
  // Only penalize if there are actual errors in the final result
  // NO CAP - Perfect final result = 100% accuracy always!

  // Round to 2 decimal places for precision
  return Math.round(accuracy * 100) / 100;
}

/**
 * Calculate consistency from WPM windows
 * Formula: 100 - (CV * 100) where CV = std(wpmWindows) / mean(wpmWindows)
 * Clamped to [0, 100]
 */
export function calculateConsistency(wpmWindows: number[]): number {
  if (wpmWindows.length < 2) return 100;

  // Zero activity is observed time, and must remain in the rhythm calculation.
  const validWpms = wpmWindows.filter(w => w >= 0 && Number.isFinite(w));
  if (validWpms.length < 2) return 100;

  const mean = validWpms.reduce((a, b) => a + b, 0) / validWpms.length;
  if (mean <= 0) return 0;

  const variance = validWpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / validWpms.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation
  const cv = stdDev / mean;

  // Convert to 0-100 scale (100 = perfectly consistent)
  const consistency = Math.max(0, Math.min(100, 100 - (cv * 100)));

  return Number.isFinite(consistency) ? Math.round(consistency * 10) / 10 : 0;
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
 * This preserves legacy final-text accuracy; it is not forge-v3 input accuracy.
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
  isTimeBasedTest: boolean = false,
  explicitDurationMs?: number
): SessionMetrics {
  const validationErrors: string[] = [];

  // Edge case: no keystrokes
  if (keystrokes.length === 0) {
    return {
      metricsVersion: 'legacy-v2',
      rawWpm: 0,
      netWpm: 0,
      accuracy: 100,
      consistency: 100,
      totalTypedChars: 0,
      correctChars: 0,
      incorrectChars: 0,
      missedChars: targetText.length,
      extraChars: 0,
      durationMs: 0,
      durationSeconds: 0,
      durationMinutes: 0,
      charsPerSecond: 0,
      peakWpm: 0,
      lowestWpm: 0,
      backspaceCount: 0,
      isValid: false,
      validationErrors: ['No keystrokes recorded']
    };
  }

  // Calculate timing
  const startTime = keystrokes[0].timestamp_ms;
  const endTime = keystrokes[keystrokes.length - 1].timestamp_ms;
  const durationMs = explicitDurationMs ?? endTime - startTime;
  const durationSeconds = durationMs / 1000;
  const durationMinutes = durationMs / 60000;

  // Validate duration
  if (durationMs <= 0) {
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
  const backspaceUsed = backspaceCount > 0;

  // Calculate WPM windows for consistency
  const wpmWindows = calculateWpmWindows(keystrokes);
  const wpmValues = wpmWindows.map(w => w.wpm);

  // Calculate metrics
  const rawWpm = calculateRawWpm(totalTypedChars, durationMs);
  const netWpm = calculateWpm(correctChars, durationMs);
  const accuracy = calculateAccuracy(correctChars, incorrectChars, missedChars, extraChars, backspaceUsed);
  const consistency = calculateConsistency(wpmValues);
  const charsPerSecond = durationSeconds > 0 ? Math.round((totalTypedChars / durationSeconds) * 100) / 100 : 0;

  // Peak and lowest WPM
  const validWpms = wpmValues.filter(w => w > 0);
  const peakWpm = validWpms.length > 0 ? Math.max(...validWpms) : netWpm;
  const lowestWpm = validWpms.length > 0 ? Math.min(...validWpms) : netWpm;

  // Validate metrics for NaN/Infinity
  const metricsToValidate = { rawWpm, netWpm, accuracy, consistency, peakWpm, lowestWpm, charsPerSecond };
  for (const [key, value] of Object.entries(metricsToValidate)) {
    if (!isFinite(value) || isNaN(value)) {
      validationErrors.push(`Invalid ${key}: ${value}`);
    }
  }

  return {
    metricsVersion: 'legacy-v2',
    rawWpm,
    netWpm,
    accuracy,
    consistency,
    totalTypedChars,
    correctChars,
    incorrectChars,
    missedChars,
    extraChars,
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
    if (ks.event_type !== 'keydown') continue;
    if (ks.is_backspace) {
      // Remove last character
      text = text.slice(0, -1);
    } else if (ks.char_typed) {
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
  if (!computedMetrics.isValid) errors.push(...computedMetrics.validationErrors);

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
