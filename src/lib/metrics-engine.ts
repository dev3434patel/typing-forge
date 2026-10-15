/**
 * METRICS ENGINE v3.0
 * Canonical, mathematically correct metric calculations
 * All metrics are computed from keystroke logs for reproducibility
 * 
 * SPEC REFERENCE:
 * - rawWpm = (totalTypedChars / 5) / minutes
 * - netWpm = (correctChars / 5) / minutes
 * - accuracy = (correctKeystrokes / totalKeystrokes) * 100
 * - finalTextAccuracy = correct chars in the final text / chars attempted
 * - no caps and no 99.99 override
 * - consistency = 100 * (1 - tanh(cov + cov^3/3 + cov^5/5))
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KeystrokeEvent {
  sessionId: string;
  userId?: string;
  mode: 'time' | 'words' | 'quote' | 'code' | 'zen' | 'learn';
  char: string;
  expectedChar: string;
  timestamp: number;  // ms since epoch or session start
  isCorrect: boolean;
  isBackspace: boolean;
}

/** Legacy record shape for backward compatibility */
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

export interface WpmWindow {
  startMs: number;
  endMs: number;
  wpm: number;
  correctChars: number;
}

export interface GlobalMetrics {
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  totalTypedChars: number;
  correctChars: number;
  incorrectChars: number;
  elapsedMs: number;
  backspaceCount: number;
}

export interface SessionMetrics extends GlobalMetrics {
  /** SECONDARY accuracy: final text vs target. Corrections are ignored. */
  finalTextAccuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  missedChars: number;
  extraChars: number;
  durationMs: number;
  durationSeconds: number;
  durationMinutes: number;
  charsPerSecond: number;
  peakWpm: number;
  lowestWpm: number;
  totalTypedChars: number;
  isValid: boolean;
  validationErrors: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WPM_WINDOW_SIZE_MS = 5000;
const WPM_WINDOW_STEP_MS = 1000;

// ─── Core Pure Functions ─────────────────────────────────────────────────────

/**
 * Calculate WPM from correct characters and elapsed time
 * Formula: (correctChars / 5) / (elapsedMs / 60000)
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

/**
 * Calculate Raw WPM from total typed characters
 * Formula: (totalTypedChars / 5) / (elapsedMs / 60000)
 */
export function calculateRawWpm(totalTypedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = totalTypedChars / 5;
  return Math.round(words / minutes);
}

/**
 * SECONDARY accuracy — final text vs target.
 * Formula: (correctChars / totalDenominator) * 100
 * An empty comparison returns 100. `backspaceUsed` is ignored. There is no cap.
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
 * Validate a metric value is safe for display
 * Returns 0 if invalid (NaN, Infinity, negative, > 100000)
 */
export function sanitizeMetric(value: number, allowNegative: boolean = false): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  if (!allowNegative && value < 0) return 0;
  if (value > 100000) return 0;
  return value;
}

// ─── Windowed WPM ────────────────────────────────────────────────────────────

/**
 * Calculate rolling WPM windows from keystroke events
 */
export function computeWpmWindows(
  events: KeystrokeEvent[],
  windowMs: number = WPM_WINDOW_SIZE_MS,
  stepMs: number = WPM_WINDOW_STEP_MS
): WpmWindow[] {
  const nonBackspace = events.filter(e => !e.isBackspace);
  if (nonBackspace.length === 0) return [];

  const windows: WpmWindow[] = [];
  const startTime = nonBackspace[0].timestamp;
  const endTime = nonBackspace[nonBackspace.length - 1].timestamp;

  for (let windowStart = startTime; windowStart <= endTime - windowMs; windowStart += stepMs) {
    const windowEnd = windowStart + windowMs;
    const correctInWindow = nonBackspace.filter(
      e => e.timestamp >= windowStart && e.timestamp < windowEnd && e.isCorrect
    ).length;

    windows.push({
      startMs: windowStart,
      endMs: windowEnd,
      wpm: calculateWpm(correctInWindow, windowMs),
      correctChars: correctInWindow,
    });
  }

  return windows;
}

/**
 * Legacy version using KeystrokeRecord
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
    const windowKeystrokes = keystrokes.filter(
      ks => ks.timestamp_ms >= windowStart && ks.timestamp_ms < windowEnd && ks.is_correct && !ks.is_backspace
    );

    windows.push({
      startMs: windowStart,
      endMs: windowEnd,
      wpm: calculateWpm(windowKeystrokes.length, windowSizeMs),
      correctChars: windowKeystrokes.length,
    });
  }

  return windows;
}

// ─── Global Metrics (canonical) ──────────────────────────────────────────────

/**
 * Compute all global metrics from a keystroke event stream.
 * Headline accuracy is keystroke-based. There is no 99.99 cap.
 */
export function computeGlobalMetrics(events: KeystrokeEvent[]): GlobalMetrics {
  if (events.length === 0) {
    return {
      rawWpm: 0, netWpm: 0, accuracy: 0, consistency: 0,
      totalTypedChars: 0, correctChars: 0, incorrectChars: 0,
      elapsedMs: 0, backspaceCount: 0,
    };
  }

  // Filter out backspaces for timing
  const nonBackspace = events.filter(e => !e.isBackspace);
  const backspaceCount = events.filter(e => e.isBackspace).length;

  if (nonBackspace.length === 0) {
    return {
      rawWpm: 0, netWpm: 0, accuracy: 0, consistency: 0,
      totalTypedChars: 0, correctChars: 0, incorrectChars: 0,
      elapsedMs: 0, backspaceCount,
    };
  }

  // Timing: first non-backspace to last non-backspace
  const firstTs = nonBackspace[0].timestamp;
  const lastTs = nonBackspace[nonBackspace.length - 1].timestamp;
  const elapsedMs = lastTs - firstTs;

  // Count chars (only non-backspace events count as typed chars)
  const totalTypedChars = nonBackspace.length;
  const correctChars = nonBackspace.filter(e => e.isCorrect).length;
  const incorrectChars = totalTypedChars - correctChars;

  // WPM
  const rawWpm = sanitizeMetric(calculateRawWpm(totalTypedChars, elapsedMs));
  const netWpm = sanitizeMetric(calculateWpm(correctChars, elapsedMs));

  const accuracy = sanitizeMetric(calculateKeystrokeAccuracy(correctChars, totalTypedChars));

  // Consistency from WPM windows
  const windows = computeWpmWindows(events);
  const consistency = sanitizeMetric(calculateConsistency(windows.map(w => w.wpm)));

  return {
    rawWpm, netWpm, accuracy, consistency,
    totalTypedChars, correctChars, incorrectChars,
    elapsedMs, backspaceCount,
  };
}

// ─── Session Metrics (extended, for detailed reports) ────────────────────────

/**
 * Compute all session metrics from keystroke log (legacy KeystrokeRecord format)
 * Used by useTestResults for backward compatibility.
 * Time-based tests do not count the untyped remainder as missed characters.
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
  const totalTypedChars = finalTypedText.length;

  // Backspace
  const backspaceCount = keystrokes.filter(ks => ks.is_backspace).length;
  const printableKeystrokes = keystrokes.filter(ks => !ks.is_backspace);
  const totalKeystrokes = printableKeystrokes.length;
  const correctKeystrokes = printableKeystrokes.filter(ks => ks.is_correct).length;

  const wpmWindows = calculateWpmWindows(keystrokes);
  const wpmValues = wpmWindows.map(w => w.wpm);

  // Metrics
  const rawWpm = calculateRawWpm(totalTypedChars, durationMs);
  const netWpm = calculateWpm(correctChars, durationMs);
  // PRIMARY accuracy = keystroke-based. SECONDARY = final-text based.
  const accuracy = calculateKeystrokeAccuracy(correctKeystrokes, totalKeystrokes);
  const finalTextAccuracy = calculateAccuracy(correctChars, incorrectChars, missedChars, extraChars);
  const consistency = calculateConsistency(wpmValues);
  const charsPerSecond = durationSeconds > 0 ? Math.round((totalTypedChars / durationSeconds) * 100) / 100 : 0;

  const validWpms = wpmValues.filter(w => w > 0);
  const peakWpm = validWpms.length > 0 ? Math.max(...validWpms) : netWpm;
  const lowestWpm = validWpms.length > 0 ? Math.min(...validWpms) : netWpm;
  const metricsToValidate = { rawWpm, netWpm, accuracy, finalTextAccuracy, consistency, peakWpm, lowestWpm, charsPerSecond };
  for (const [key, value] of Object.entries(metricsToValidate)) {
    if (!isFinite(value) || isNaN(value)) validationErrors.push(`Invalid ${key}: ${value}`);
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
    charsPerSecond, peakWpm, lowestWpm, backspaceCount,
    elapsedMs: durationMs,
    isValid: validationErrors.length === 0,
    validationErrors,
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Calculate progress percentage for race mode
 */
export function calculateProgress(correctChars: number, expectedTextLength: number): number {
  if (expectedTextLength <= 0) return 0;
  const progress = (correctChars / expectedTextLength) * 100;
  return Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
}

/**
 * Reconstruct typed text from keystroke log
 */
export function reconstructTypedText(keystrokes: KeystrokeRecord[]): string {
  let text = '';
  for (const ks of keystrokes) {
    if (ks.is_backspace) {
      text = text.slice(0, -1);
    } else if (ks.char_typed && ks.char_typed.length === 1) {
      text += ks.char_typed;
    }
  }
  return text;
}

/**
 * Verify client-submitted metrics against keystroke log
 */
export function verifyMetrics(
  clientMetrics: Partial<SessionMetrics>,
  keystrokes: KeystrokeRecord[],
  targetText: string
): { valid: boolean; errors: string[]; computedMetrics: SessionMetrics } {
  const errors: string[] = [];
  const reconstructedText = reconstructTypedText(keystrokes);
  const computedMetrics = computeSessionMetrics(keystrokes, targetText, reconstructedText);

  const TOLERANCE = 0.5;

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

  return { valid: errors.length === 0, errors, computedMetrics };
}
