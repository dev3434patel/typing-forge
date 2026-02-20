/**
 * KEYBR-STYLE ADAPTIVE LEARNING ENGINE v2.0
 * Per-character metrics, confidence levels, and intelligent letter unlocking
 * 
 * SPEC REFERENCE:
 * - charWpm derived from inter-keystroke latency: (60000 / latencyMs) / 5
 * - Weighted update: 0.7 * new + 0.3 * old
 * - speedComponent: 0 below 12 WPM, linear 12→35 = 0→1, capped at 1
 * - accuracyComponent: ≤90% → 0, linear 90→100% = 0→1
 * - confidence = speed * accuracy * consistencyMult
 * - Unlock: wpm>=35, accuracy>=95, confidence>=0.9, samples>=20
 */

import { sanitizeMetric } from './metrics-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CharacterConfidence {
  char: string;
  confidence: number;  // 0.0 to 1.0
  wpm: number;
  accuracy: number;
  occurrences: number; // total samples
  avgTimeMs: number;
  stdDev: number;
  isUnlocked: boolean;
  status: 'weak' | 'needs_work' | 'in_progress' | 'nearly_unlocked' | 'unlocked';
}

/** Per-char sample from a single lesson snippet */
export interface CharSample {
  char: string;
  latencyMs: number;      // time since previous correct char
  isCorrect: boolean;
  totalPresses: number;   // total presses for this char in snippet
  correctPresses: number; // correct presses for this char in snippet
}

export interface Keystroke {
  char: string;
  timestamp: number;
  isCorrect: boolean;
  expected: string;
}

export interface KeybrLesson {
  text: string;
  availableLetters: string[];
  focusLetters: string[];
  lockedLetters: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STARTING_LETTERS = new Set(['e', 't', 'a', 'o', 'i', 'n', 's', 'r']);
const ALL_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const TARGET_WPM = 35;
const MIN_SAMPLES_FOR_UNLOCK = 20;

const LETTER_FREQUENCY_ORDER = [
  'e', 't', 'a', 'o', 'i', 'n', 's', 'h', 'r', 'd', 'l', 'c', 'u', 'm', 'w',
  'f', 'g', 'y', 'p', 'b', 'v', 'k', 'j', 'x', 'q', 'z'
];

// ─── Pure Metric Functions ───────────────────────────────────────────────────

/**
 * Compute speedComponent per spec:
 * - ≤12 WPM → 0
 * - 12→35 WPM → linear 0→1
 * - ≥35 WPM → 1
 */
export function computeSpeedComponent(wpm: number, targetWpm: number = TARGET_WPM): number {
  if (wpm <= 12) return 0;
  if (wpm >= targetWpm) return 1;
  return (wpm - 12) / (targetWpm - 12);
}

/**
 * Compute accuracyComponent per spec:
 * - ≤90% → 0
 * - 90→100% → linear 0→1
 */
export function computeAccuracyComponent(accuracy: number): number {
  if (accuracy <= 90) return 0;
  return Math.min((accuracy - 90) / 10, 1.0);
}

/**
 * Compute consistency multiplier from per-char timing stdDev
 * More stable → closer to 1
 */
export function computeConsistencyMult(stdDev: number): number {
  return Math.max(0, 1 - (stdDev / 200));
}

/**
 * Compute confidence from components
 * confidence = speedComponent * accuracyComponent * consistencyMult
 */
export function computeConfidence(wpm: number, accuracy: number, stdDev: number, targetWpm: number = TARGET_WPM): number {
  const speed = computeSpeedComponent(wpm, targetWpm);
  const acc = computeAccuracyComponent(accuracy);
  const cons = computeConsistencyMult(stdDev);
  return sanitizeMetric(Math.round(speed * acc * cons * 100) / 100);
}

/**
 * Check if a character should be unlocked per spec:
 * wpm >= 35, accuracy >= 95, confidence >= 0.9, samples >= 20
 */
export function shouldUnlockChar(stats: CharacterConfidence, targetWpm: number = TARGET_WPM): boolean {
  return stats.wpm >= targetWpm 
    && stats.accuracy >= 95 
    && stats.confidence >= 0.9 
    && stats.occurrences >= MIN_SAMPLES_FOR_UNLOCK;
}

/**
 * Update per-char stats with new sample data using weighted moving average
 * Formula: new = 0.7 * sample + 0.3 * old
 */
export function updateCharStats(
  prev: CharacterConfidence | undefined,
  sampleWpm: number,
  sampleAccuracy: number,
  sampleOccurrences: number,
  sampleAvgTimeMs: number,
  sampleStdDev: number,
  targetWpm: number = TARGET_WPM
): CharacterConfidence {
  const WEIGHT_NEW = 0.7;
  const WEIGHT_OLD = 0.3;

  let wpm: number;
  let accuracy: number;
  let totalOccurrences: number;
  let avgTimeMs: number;
  let stdDev: number;

  if (prev) {
    wpm = WEIGHT_NEW * sampleWpm + WEIGHT_OLD * prev.wpm;
    accuracy = WEIGHT_NEW * sampleAccuracy + WEIGHT_OLD * prev.accuracy;
    totalOccurrences = prev.occurrences + sampleOccurrences;
    avgTimeMs = WEIGHT_NEW * sampleAvgTimeMs + WEIGHT_OLD * prev.avgTimeMs;
    stdDev = WEIGHT_NEW * sampleStdDev + WEIGHT_OLD * prev.stdDev;
  } else {
    wpm = sampleWpm;
    accuracy = sampleAccuracy;
    totalOccurrences = sampleOccurrences;
    avgTimeMs = sampleAvgTimeMs;
    stdDev = sampleStdDev;
  }

  const confidence = computeConfidence(wpm, accuracy, stdDev, targetWpm);
  const char = prev?.char || '';
  const wasUnlocked = prev?.isUnlocked || STARTING_LETTERS.has(char);

  const result: CharacterConfidence = {
    char,
    confidence: Math.round(confidence * 100) / 100,
    wpm: Math.round(wpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    occurrences: totalOccurrences,
    avgTimeMs: Math.round(avgTimeMs),
    stdDev: Math.round(stdDev),
    isUnlocked: wasUnlocked,
    status: 'weak',
  };

  // Check unlock
  if (!wasUnlocked && shouldUnlockChar(result, targetWpm)) {
    result.isUnlocked = true;
  }

  result.status = getConfidenceStatus(result.confidence, result.isUnlocked).status;
  return result;
}

// ─── Keystroke Analysis ──────────────────────────────────────────────────────

/**
 * Calculate per-character metrics from keystrokes
 * Uses inter-keystroke latency from PREVIOUS CORRECT char per spec
 */
export function calculatePerCharMetrics(
  keystrokes: Keystroke[],
  targetWPM: number = TARGET_WPM
): Map<string, CharacterConfidence> {
  // Group data by character
  const charMap = new Map<string, {
    correct: number;
    total: number;
    latencies: number[];  // latency from previous correct char
  }>();

  // Track previous correct keystroke for latency calculation
  let prevCorrectTimestamp: number | null = null;

  for (let i = 0; i < keystrokes.length; i++) {
    const ks = keystrokes[i];
    const char = ks.expected.toLowerCase();

    if (!char.match(/[a-z]/)) {
      // Still track for latency chain but don't record metrics
      if (ks.isCorrect) prevCorrectTimestamp = ks.timestamp;
      continue;
    }

    if (!charMap.has(char)) {
      charMap.set(char, { correct: 0, total: 0, latencies: [] });
    }

    const data = charMap.get(char)!;
    data.total++;
    if (ks.isCorrect) data.correct++;

    // Latency from previous correct char (spec: inter-keystroke latency)
    if (ks.isCorrect && prevCorrectTimestamp !== null) {
      const latency = ks.timestamp - prevCorrectTimestamp;
      if (latency > 0 && latency < 5000) {
        data.latencies.push(latency);
      }
    }

    if (ks.isCorrect) prevCorrectTimestamp = ks.timestamp;
  }

  // Build CharacterConfidence for each char
  const result = new Map<string, CharacterConfidence>();
  const savedData = getCharacterData();

  for (const [char, data] of charMap) {
    const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    const avgTimeMs = data.latencies.length > 0
      ? data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length
      : 500;
    const stdDev = calcStdDev(data.latencies);

    // charWpm derived from avgLatencyMs per spec: (60000 / avgLatencyMs) / 5
    const charWPM = avgTimeMs > 0 ? (60000 / avgTimeMs) / 5 : 0;

    const confidence = computeConfidence(charWPM, accuracy, stdDev, targetWPM);
    const isUnlocked = savedData[char]?.isUnlocked || STARTING_LETTERS.has(char);

    result.set(char, {
      char,
      confidence: Math.round(confidence * 100) / 100,
      wpm: Math.round(charWPM * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      occurrences: data.total,
      avgTimeMs: Math.round(avgTimeMs),
      stdDev: Math.round(stdDev),
      isUnlocked,
      status: getConfidenceStatus(confidence, isUnlocked).status,
    });
  }

  return result;
}

function calcStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ─── Confidence Status ───────────────────────────────────────────────────────

export function getConfidenceStatus(confidence: number, isUnlocked: boolean = true): {
  status: 'weak' | 'needs_work' | 'in_progress' | 'nearly_unlocked' | 'unlocked';
  color: string;
  emoji: string;
  text: string;
} {
  if (!isUnlocked) return { status: 'weak', color: 'gray', emoji: '🔒', text: 'Locked' };
  if (confidence >= 1.0) return { status: 'unlocked', color: 'success', emoji: '✅', text: 'Mastered' };
  if (confidence >= 0.8) return { status: 'nearly_unlocked', color: 'primary', emoji: '🟢', text: 'Nearly there' };
  if (confidence >= 0.6) return { status: 'in_progress', color: 'warning', emoji: '🟡', text: 'In progress' };
  if (confidence >= 0.3) return { status: 'needs_work', color: 'warning', emoji: '🟠', text: 'Needs work' };
  return { status: 'weak', color: 'destructive', emoji: '🔴', text: 'Weak' };
}

// ─── Persistence (localStorage) ──────────────────────────────────────────────

export function getCharacterData(): Record<string, CharacterConfidence> {
  const stored = localStorage.getItem('keybr_character_data');
  return stored ? JSON.parse(stored) : {};
}

export function saveCharacterData(data: Record<string, CharacterConfidence>): void {
  localStorage.setItem('keybr_character_data', JSON.stringify(data));
}

// ─── Progress Update ─────────────────────────────────────────────────────────

/**
 * Update character data with new test results
 * Uses weighted moving average: 0.7 * new + 0.3 * old
 */
export function updateCharacterProgress(
  newMetrics: Map<string, CharacterConfidence>,
  targetWPM: number = TARGET_WPM
): {
  updatedChars: CharacterConfidence[];
  newlyUnlocked: string[];
  nextToUnlock: string | null;
} {
  const savedData = getCharacterData();
  const updatedChars: CharacterConfidence[] = [];
  const newlyUnlocked: string[] = [];

  for (const [char, metrics] of newMetrics) {
    const existing = savedData[char];
    const updated = updateCharStats(
      existing,
      metrics.wpm,
      metrics.accuracy,
      metrics.occurrences,
      metrics.avgTimeMs,
      metrics.stdDev,
      targetWPM
    );
    updated.char = char;

    // Check for newly unlocked
    const wasUnlocked = existing?.isUnlocked || STARTING_LETTERS.has(char);
    if (!wasUnlocked && updated.isUnlocked) {
      newlyUnlocked.push(char);
    }

    savedData[char] = updated;
    updatedChars.push(updated);
  }

  saveCharacterData(savedData);

  return {
    updatedChars,
    newlyUnlocked,
    nextToUnlock: getNextLetterToUnlock(savedData),
  };
}

function getNextLetterToUnlock(data: Record<string, CharacterConfidence>): string | null {
  for (const letter of LETTER_FREQUENCY_ORDER) {
    if (!data[letter]?.isUnlocked && !STARTING_LETTERS.has(letter)) {
      return letter;
    }
  }
  return null;
}

// ─── Letter Queries ──────────────────────────────────────────────────────────

export function getUnlockedLetters(): string[] {
  const data = getCharacterData();
  const unlocked = new Set<string>(STARTING_LETTERS);
  for (const [char, charData] of Object.entries(data)) {
    if (charData.isUnlocked) unlocked.add(char);
  }
  return Array.from(unlocked).sort();
}

export function getLockedLetters(): string[] {
  const unlocked = new Set(getUnlockedLetters());
  return ALL_LETTERS.filter(l => !unlocked.has(l));
}

export function getWeakLetters(count: number = 5): string[] {
  const data = getCharacterData();
  const unlocked = getUnlockedLetters();

  return unlocked
    .map(char => ({
      char,
      confidence: data[char]?.confidence ?? 0,
      hasData: data[char] !== undefined,
    }))
    .sort((a, b) => {
      if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
      return a.confidence - b.confidence;
    })
    .slice(0, count)
    .map(x => x.char);
}

export function getAllCharacterStats(): CharacterConfidence[] {
  const data = getCharacterData();
  return ALL_LETTERS.map(char => {
    const existing = data[char];
    const isUnlocked = existing?.isUnlocked || STARTING_LETTERS.has(char);
    return existing || {
      char, confidence: 0, wpm: 0, accuracy: 0, occurrences: 0,
      avgTimeMs: 0, stdDev: 0, isUnlocked,
      status: isUnlocked ? 'weak' as const : 'weak' as const,
    };
  });
}

export function resetKeybrProgress(): void {
  localStorage.removeItem('keybr_character_data');
}

// ─── Lesson Generation ───────────────────────────────────────────────────────

export function generateKeybrLesson(wordCount: number = 50): KeybrLesson {
  const unlockedLetters = getUnlockedLetters();
  const lockedLetters = getLockedLetters();
  const focusLetters = getWeakLetters(3);

  const effectiveFocusLetters = focusLetters.length > 0
    ? focusLetters
    : unlockedLetters.slice(0, Math.min(3, unlockedLetters.length));

  // Filter word bank to only unlocked letters
  let wordBank = getWordBank().filter(word => {
    const wordLetters = new Set(word.toLowerCase().replace(/[^a-z]/g, '').split(''));
    for (const c of wordLetters) {
      if (!unlockedLetters.includes(c)) return false;
    }
    return true;
  });

  if (wordBank.length < 10) {
    wordBank = generateWordsFromLetters(unlockedLetters, 50);
  }

  const focusWords = wordBank.filter(w => effectiveFocusLetters.some(c => w.includes(c)));
  const otherWords = wordBank.filter(w => !effectiveFocusLetters.some(c => w.includes(c)));

  let finalFocusWords = focusWords;
  const focusCount = Math.ceil(wordCount * 0.7);

  if (finalFocusWords.length < focusCount && effectiveFocusLetters.length > 0) {
    const generated = generateWordsFromLetters(unlockedLetters, (focusCount - finalFocusWords.length) * 2, effectiveFocusLetters);
    finalFocusWords = [...finalFocusWords, ...generated];
  }

  const selectedWords: string[] = [];
  const source = finalFocusWords.length > 0 ? finalFocusWords : wordBank;
  for (let i = 0; i < focusCount && source.length > 0; i++) {
    selectedWords.push(source[Math.floor(Math.random() * source.length)]);
  }

  const otherCount = wordCount - focusCount;
  const otherSource = otherWords.length > 0 ? otherWords : wordBank;
  for (let i = 0; i < otherCount && otherSource.length > 0; i++) {
    selectedWords.push(otherSource[Math.floor(Math.random() * otherSource.length)]);
  }

  // Fill if needed
  while (selectedWords.length < wordCount && wordBank.length > 0) {
    selectedWords.push(wordBank[Math.floor(Math.random() * wordBank.length)]);
  }

  // Shuffle
  for (let i = selectedWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedWords[i], selectedWords[j]] = [selectedWords[j], selectedWords[i]];
  }

  return {
    text: selectedWords.slice(0, wordCount).join(' '),
    availableLetters: unlockedLetters,
    focusLetters: effectiveFocusLetters,
    lockedLetters,
  };
}

function generateWordsFromLetters(letters: string[], count: number, focusLetters?: string[]): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const wordLength = 2 + Math.floor(Math.random() * 3);
    let word = '';
    if (focusLetters && focusLetters.length > 0) {
      const focusPos = Math.floor(Math.random() * wordLength);
      const focusLetter = focusLetters[Math.floor(Math.random() * focusLetters.length)];
      for (let j = 0; j < wordLength; j++) {
        word += j === focusPos ? focusLetter : letters[Math.floor(Math.random() * letters.length)];
      }
    } else {
      for (let j = 0; j < wordLength; j++) {
        word += letters[Math.floor(Math.random() * letters.length)];
      }
    }
    words.push(word);
  }
  return words;
}

function getWordBank(): string[] {
  return [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so',
    'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
    'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'into',
    'year', 'your', 'good', 'some', 'them', 'see', 'other', 'than', 'then', 'now',
    'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use',
    'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
    'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had',
    'state', 'never', 'before', 'high', 'every', 'same', 'under', 'last', 'great', 'own',
    'little', 'still', 'world', 'life', 'home', 'read', 'hand', 'between', 'each', 'made',
    'next', 'sound', 'below', 'saw', 'house', 'again', 'side', 'large', 'three', 'small',
    'part', 'live', 'found', 'upon', 'right', 'left', 'line', 'turn', 'move', 'must',
    'name', 'kind', 'need', 'place', 'long', 'old', 'help', 'mean', 'might', 'end',
    'different', 'around', 'animal', 'point', 'mother', 'answer', 'learn', 'study', 'father', 'head',
    'stand', 'page', 'earth', 'letter', 'thought', 'together', 'until', 'children', 'begin', 'idea',
    'enough', 'almost', 'above', 'sometimes', 'mountain', 'paper', 'example', 'hundred', 'thousand', 'second',
  ];
}
