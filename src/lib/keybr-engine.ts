import { getContentPack, graphemes, seededRandom, type ContentPack } from './content-packs';
import { sessionRepository, stableJson } from '@/services/session-repository';

import { LEARNING_VERSION, LEARNING_INACTIVITY_MS, learningEvidenceFromResult, type LearningDimensions, type LearningAttempt, type LearningSessionEvidence } from './learning-evidence';
import type { SessionResult } from './typing-core/types';
export { LEARNING_VERSION, LEARNING_INACTIVITY_MS, learningEvidenceFromResult, type LearningDimensions, type LearningAttempt, type LearningSessionEvidence } from './learning-evidence';

const RECENT_WINDOW = 50;
const MIN_SAMPLES = 20;
const LEGACY_LETTERS = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r'];


export const DEFAULT_LEARNING_DIMENSIONS: LearningDimensions = { language: 'en', layout: 'qwerty', domain: 'prose', inputMethod: 'keyboard' };

export interface CharacterConfidence {
  char: string;
  confidence: number; // Uncapped latency speed ratio, not a probability.
  wpm: number; // Latency-derived estimate, not a test score.
  accuracy: number;
  occurrences: number;
  avgTimeMs: number;
  stdDev: number;
  isUnlocked: boolean; // Legacy alias for introduced, not mastered.
  status: 'weak' | 'needs_work' | 'in_progress' | 'nearly_unlocked' | 'unlocked';
  introduced?: boolean;
  mastered?: boolean;
  assessmentState?: 'locked' | 'introduced' | 'sampled' | 'assessed' | 'mastered' | 'review';
  recentAttempts?: number;
  attributableAttempts?: number;
  qualifiedLatencySamples?: number;
  lessonCount?: number;
  masteryCheckpoints?: number;
  lastPracticedAt?: string | null;
  observations?: LearningAttempt[];
  masteryHistory?: { sessionId: string; completedAt: string; qualified: boolean }[];
}
export interface Keystroke {
  char: string;
  timestamp: number;
  isCorrect?: boolean;
  expected: string;
  key?: string;
  position?: number;
  compositionGroup?: string;
  provenance?: string;
}

export interface KeybrLesson {
  text: string;
  availableLetters: string[];
  focusLetters: string[];
  lockedLetters: string[];
  seed: string;
  generatorVersion: string;
  contentRevision: string;
  naturalWordCount: number;
  phoneticWordCount: number;
  review: boolean;
}
interface LearningEnvelope {
  learningVersion: typeof LEARNING_VERSION;
  owner: string;
  introduced: Record<string, string[]>;
  legacyStats: Record<string, Record<string, CharacterConfidence>>;
  sessions: LearningSessionEvidence[];
  serverVersion: number;
  serverSessionIds?: string[];
  removedSessionIds?: string[];
}
const memoryFallback = new Map<string, LearningEnvelope>();
export interface LearningOptions { owner?: string; dimensions?: LearningDimensions }
interface ProgressOptions extends LearningOptions { sessionId?: string; completedAt?: string; elapsedMs?: number; assessment?: boolean; sourceResultId?: string }

function dimensionsOf(dimensions?: LearningDimensions): LearningDimensions {
  const input = dimensions ?? DEFAULT_LEARNING_DIMENSIONS;
  return { ...input, language: getContentPack(input.language).id, layout: input.layout.toLowerCase() };
}
export function learningModelKey(dimensions?: LearningDimensions): string {
  const input = dimensionsOf(dimensions);
  return `${input.language}|${input.layout}|${input.domain}|${input.inputMethod}`;
}
function storageKey(owner: string): string { return `typingforge:v3:${owner}:learning`; }
function emptyEnvelope(owner: string): LearningEnvelope {
  return { learningVersion: LEARNING_VERSION, owner, introduced: {}, legacyStats: {}, sessions: [], serverVersion: 0 };
}
function loadEnvelope(owner = 'guest'): LearningEnvelope {
  const empty = emptyEnvelope(owner);
  try {
    const raw = localStorage.getItem(storageKey(owner));
    if (!raw && memoryFallback.has(owner)) return JSON.parse(JSON.stringify(memoryFallback.get(owner))) as LearningEnvelope;
    if (raw) {
      const candidate: unknown = JSON.parse(raw);
      if (candidate && typeof candidate === 'object' && 'learningVersion' in candidate && candidate.learningVersion === LEARNING_VERSION && 'owner' in candidate && candidate.owner === owner) {
        const value = candidate as LearningEnvelope;
        return { ...empty, ...value, sessions: Array.isArray(value.sessions) ? value.sessions.filter(validEvidence) : [], introduced: value.introduced ?? {}, legacyStats: value.legacyStats ?? {} };
      }
    }
    // Import old unscoped observations into guest only. Legacy values never establish mastery.
    const old = owner === 'guest' ? localStorage.getItem('keybr_character_data') : null;
    if (old !== null) {
      const data = JSON.parse(old) as Record<string, CharacterConfidence>;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const model = learningModelKey();
        empty.introduced[model] = [...new Set([...LEGACY_LETTERS, ...Object.entries(data).filter(([, stat]) => stat?.isUnlocked).map(([char]) => char)])];
        empty.legacyStats[model] = data;
        persistEnvelope(empty);
      }
    }
  } catch { if (memoryFallback.has(owner)) return JSON.parse(JSON.stringify(memoryFallback.get(owner))) as LearningEnvelope; }
  return empty;
}
function persistEnvelope(envelope: LearningEnvelope): boolean {
  try {
    localStorage.setItem(storageKey(envelope.owner), JSON.stringify(envelope));
    memoryFallback.delete(envelope.owner);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('typingforge:learning-updated', { detail: { owner: envelope.owner } }));
    return true;
  } catch { memoryFallback.set(envelope.owner, JSON.parse(JSON.stringify(envelope)) as LearningEnvelope); return false; }
}
function validEvidence(value: unknown): value is LearningSessionEvidence {
  if (!value || typeof value !== 'object') return false;
  const item = value as LearningSessionEvidence;
  return item.learningVersion === LEARNING_VERSION && typeof item.sessionId === 'string' && item.sessionId.length > 0 && Number.isFinite(Date.parse(item.completedAt)) && Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0 && item.elapsedMs <= 86_400_000 && !!item.dimensions && ['keyboard', 'composition', 'virtual'].includes(item.dimensions.inputMethod) && ['prose', 'code'].includes(item.dimensions.domain) && typeof item.dimensions.language === 'string' && typeof item.dimensions.layout === 'string' && Number.isFinite(item.targetWpm) && item.targetWpm >= 1 && item.targetWpm <= 500 && Array.isArray(item.attempts) && item.attempts.length <= 100_000 && item.attempts.every(attempt => typeof attempt.expected === 'string' && typeof attempt.typed === 'string' && typeof attempt.correct === 'boolean' && Number.isFinite(attempt.offsetMs) && attempt.offsetMs >= 0 && (attempt.latencyMs === null || Number.isFinite(attempt.latencyMs) && attempt.latencyMs > 0));
}
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
function stdDev(values: number[]): number { const average = mean(values); return Math.sqrt(mean(values.map(value => (value - average) ** 2))); }
function saneTarget(value: number): number { return Number.isFinite(value) ? Math.max(1, Math.min(500, value)) : 35; }

/** Only individual correct, non-trigger intervals <=2 seconds qualify for latency. */
export function attemptsFromKeystrokes(keystrokes: readonly Keystroke[], language = 'en'): LearningAttempt[] {
  return keystrokes.filter(stroke => stroke.key !== 'Backspace' && stroke.char !== '').map((stroke, index, strokes) => {
    const previous = strokes[index - 1];
    const interval = previous ? stroke.timestamp - previous.timestamp : 0;
    const composition = !!stroke.compositionGroup || stroke.provenance === 'composition';
    const correct = stroke.char.normalize('NFC') === stroke.expected.normalize('NFC');
    const individual = graphemes(stroke.char, language).length === 1 && !composition;
    const attributable = index > 0 && individual && !previous?.compositionGroup && previous?.provenance !== 'composition' && interval > 0 && interval <= LEARNING_INACTIVITY_MS;
    const classification: LearningAttempt['classification'] = !previous ? 'trigger' : composition ? 'composition' : interval > LEARNING_INACTIVITY_MS ? 'inactivity' : !individual || interval <= 0 ? 'unattributable' : !correct ? 'incorrect' : 'individual';
    return { expected: stroke.expected.normalize('NFC'), typed: stroke.char.normalize('NFC'), correct, offsetMs: Math.max(0, stroke.timestamp), latencyMs: attributable && correct ? interval : null, attributable, classification };
  });
}
function summarize(char: string, observations: LearningAttempt[], targetWpm: number, introduced: boolean): CharacterConfidence {
  const recent = observations.slice(-RECENT_WINDOW);
  const timings = recent.flatMap(attempt => attempt.latencyMs === null ? [] : [attempt.latencyMs]);
  // Smoothing is rebuilt from the recent evidence window, so an old mistake or pause can recover.
  let smoothed = 0;
  for (const latency of timings) smoothed = smoothed > 0 ? smoothed * 0.9 + latency * 0.1 : latency;
  const accuracy = recent.length ? recent.filter(attempt => attempt.correct).length / recent.length * 100 : 0;
  const confidence = smoothed > 0 ? (60000 / (saneTarget(targetWpm) * 5)) / smoothed : 0;
  return {
    char, confidence, wpm: smoothed > 0 ? 12000 / smoothed : 0, accuracy, occurrences: observations.length,
    avgTimeMs: smoothed, stdDev: stdDev(timings), isUnlocked: introduced, introduced, mastered: false,
    status: getConfidenceStatus(confidence, introduced, false).status,
    recentAttempts: recent.length, attributableAttempts: recent.filter(attempt => attempt.attributable).length,
    qualifiedLatencySamples: timings.length, observations: recent,
  };
}
/** Pure session summary. Expected/typed characters, not client correctness booleans, determine accuracy. */
export function calculatePerCharMetrics(keystrokes: Keystroke[], targetWPM = 35, dimensions?: LearningDimensions): Map<string, CharacterConfidence> {
  return summarizeLearningAttempts(attemptsFromKeystrokes(keystrokes, dimensions?.language ?? 'en'), targetWPM, dimensions);
}
export function summarizeLearningAttempts(attempts: LearningAttempt[], targetWPM = 35, dimensions?: LearningDimensions): Map<string, CharacterConfidence> {
  const pack = getContentPack(dimensions?.language ?? 'en');
  const alphabet = new Set(pack.alphabet);
  const groups = new Map<string, LearningAttempt[]>();
  for (const attempt of attempts) {
    const char = attempt.expected.toLocaleLowerCase(pack.id === 'gu-Latn' ? 'gu' : pack.id);
    if (!alphabet.has(char)) continue;
    groups.set(char, [...(groups.get(char) ?? []), attempt]);
  }
  return new Map([...groups].map(([char, observations]) => [char, summarize(char, observations, targetWPM, true)]));
}
function initialLetters(pack: ContentPack, envelope: LearningEnvelope, model: string): string[] {
  return [...new Set(envelope.introduced[model] ?? pack.introductionOrder.slice(0, 6))].filter(char => pack.alphabet.includes(char));
}
/** Matched sessions rebuild deterministically even when received out of order. */
function derive(envelope: LearningEnvelope, dimensions: LearningDimensions, targetWpm: number): { stats: Record<string, CharacterConfidence>; introduced: string[] } {
  const pack = getContentPack(dimensions.language);
  const model = learningModelKey(dimensions);
  const introduced = new Set(initialLetters(pack, envelope, model));
  const groups = new Map<string, LearningAttempt[]>();
  const assessmentGroups = new Map<string, LearningAttempt[]>();
  const lessons = new Map<string, Set<string>>();
  const checkpoints = new Map<string, { sessionId: string; completedAt: string; qualified: boolean }[]>();
  const mastered = new Set<string>();
  const lastPracticed = new Map<string, string>();
  const relevant = envelope.sessions.filter(session => learningModelKey(session.dimensions) === model).sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.sessionId.localeCompare(b.sessionId));
  for (const session of relevant) {
    const observed = new Set<string>();
    for (const attempt of session.attempts) {
      const char = attempt.expected.toLocaleLowerCase(pack.id === 'gu-Latn' ? 'gu' : pack.id);
      if (!pack.alphabet.includes(char)) continue;
      groups.set(char, [...(groups.get(char) ?? []), attempt]);
      observed.add(char);
      lastPracticed.set(char, session.completedAt);
      if (session.assessment) {
        assessmentGroups.set(char, [...(assessmentGroups.get(char) ?? []), attempt]);
        const keyLessons = lessons.get(char) ?? new Set<string>();
        keyLessons.add(session.sessionId);
        lessons.set(char, keyLessons);
      }
    }
    if (session.assessment) {
      for (const char of observed) {
        if (!introduced.has(char)) continue;
        const stat = summarize(char, assessmentGroups.get(char) ?? [], session.targetWpm, true);
        const qualified = (stat.attributableAttempts ?? 0) >= MIN_SAMPLES && (lessons.get(char)?.size ?? 0) >= 2 && stat.accuracy + 1e-9 >= 97 && stat.avgTimeMs > 0 && stat.avgTimeMs <= 60000 / (saneTarget(session.targetWpm) * 5) + 1e-6;
        const history = checkpoints.get(char) ?? [];
        history.push({ sessionId: session.sessionId, completedAt: session.completedAt, qualified });
        checkpoints.set(char, history);
        if (qualified && history.length > 1 && history[history.length - 2].qualified) mastered.add(char);
      }
      if ([...introduced].every(char => mastered.has(char))) {
        const next = pack.introductionOrder.find(char => !introduced.has(char));
        if (next) introduced.add(next);
      }
    }
  }
  const stats: Record<string, CharacterConfidence> = {};
  for (const char of pack.alphabet) {
    const observations = groups.get(char) ?? [];
    const stat = summarize(char, observations, targetWpm, introduced.has(char));
    const history = checkpoints.get(char) ?? [];
    const wasMastered = mastered.has(char);
    const reviewing = wasMastered && (stat.accuracy < 97 || stat.confidence + 1e-9 < 1);
    const legacy = envelope.legacyStats[model]?.[char];
    stats[char] = {
      ...stat,
      ...(observations.length === 0 && legacy ? { wpm: legacy.wpm || 0, accuracy: legacy.accuracy || 0, occurrences: legacy.occurrences || 0, confidence: 0 } : {}),
      mastered: wasMastered, lessonCount: lessons.get(char)?.size ?? 0, masteryCheckpoints: history.slice(-2).filter(checkpoint => checkpoint.qualified).length,
      lastPracticedAt: lastPracticed.get(char) ?? null, masteryHistory: history,
      assessmentState: !introduced.has(char) ? 'locked' : wasMastered ? reviewing ? 'review' : 'mastered' : stat.attributableAttempts! >= MIN_SAMPLES && (lessons.get(char)?.size ?? 0) >= 2 ? 'assessed' : observations.length ? 'sampled' : 'introduced',
      status: wasMastered && !reviewing ? 'unlocked' : getConfidenceStatus(stat.confidence, introduced.has(char), false).status,
    };
  }
  return { stats, introduced: [...introduced] };
}
export function getConfidenceStatus(confidence: number, isUnlocked = true, mastered = confidence >= 1): { status: CharacterConfidence['status']; color: string; emoji: string; text: string } {
  if (!isUnlocked) return { status: 'weak', color: 'gray', emoji: '🔒', text: 'Locked' };
  if (mastered) return { status: 'unlocked', color: 'success', emoji: '✓', text: 'Mastered' };
  if (confidence >= 0.8) return { status: 'nearly_unlocked', color: 'primary', emoji: '◕', text: 'Building evidence' };
  if (confidence >= 0.6) return { status: 'in_progress', color: 'warning', emoji: '◑', text: 'In progress' };
  if (confidence >= 0.3) return { status: 'needs_work', color: 'warning', emoji: '◔', text: 'Needs practice' };
  return { status: 'weak', color: 'destructive', emoji: '○', text: 'Needs evidence' };
}
export function getCharacterData(options: LearningOptions = {}): Record<string, CharacterConfidence> {
  const result = derive(loadEnvelope(options.owner), dimensionsOf(options.dimensions), 35).stats;
  return Object.fromEntries(Object.entries(result).filter(([, stat]) => stat.occurrences > 0));
}
/** Legacy display import. Values are unassessed and cannot create mastery. */
export function saveCharacterData(data: Record<string, CharacterConfidence>, options: LearningOptions = {}): void {
  const envelope = loadEnvelope(options.owner);
  const model = learningModelKey(options.dimensions);
  envelope.legacyStats[model] = data;
  envelope.introduced[model] = [...new Set([...initialLetters(getContentPack(options.dimensions?.language ?? 'en'), envelope, model), ...Object.entries(data).filter(([, item]) => item.isUnlocked).map(([char]) => char)])];
  persistEnvelope(envelope);
}
export function getAllCharacterStats(options: LearningOptions & { targetWpm?: number } = {}): CharacterConfidence[] {
  const dimensions = dimensionsOf(options.dimensions);
  const data = derive(loadEnvelope(options.owner), dimensions, options.targetWpm ?? 35).stats;
  return getContentPack(dimensions.language).introductionOrder.map(char => data[char]);
}
export function getUnlockedLetters(options: LearningOptions = {}): string[] { return derive(loadEnvelope(options.owner), dimensionsOf(options.dimensions), 35).introduced; }
export function getLockedLetters(options: LearningOptions = {}): string[] { const available = new Set(getUnlockedLetters(options)); return getContentPack(options.dimensions?.language ?? 'en').introductionOrder.filter(char => !available.has(char)); }
export function getWeakLetters(count = 5, options: LearningOptions & { targetWpm?: number } = {}): string[] {
  return getAllCharacterStats(options).filter(stat => stat.isUnlocked).sort((a, b) => Number(a.mastered) - Number(b.mastered) || (a.attributableAttempts ?? 0) - (b.attributableAttempts ?? 0) || a.confidence - b.confidence).slice(0, Math.max(0, count)).map(stat => stat.char);
}
export function recordLearningSession(evidence: LearningSessionEvidence, owner = 'guest'): { updatedChars: CharacterConfidence[]; newlyUnlocked: string[]; nextToUnlock: string | null; persisted: boolean } {
  if (!validEvidence(evidence)) throw new Error('Invalid learning evidence');
  const envelope = loadEnvelope(owner);
  const dimensions = dimensionsOf(evidence.dimensions);
  const normalized = { ...evidence, dimensions };
  const before = derive(envelope, dimensions, evidence.targetWpm).introduced;
  if (envelope.removedSessionIds?.includes(evidence.sessionId)) {
    const current = derive(envelope, dimensions, evidence.targetWpm);
    return { updatedChars: Object.values(current.stats).filter(stat => stat.isUnlocked), newlyUnlocked: [], nextToUnlock: getContentPack(dimensions.language).introductionOrder.find(char => !current.introduced.includes(char)) ?? null, persisted: true };
  }
  const duplicate = envelope.sessions.find(session => session.sessionId === evidence.sessionId);
  if (duplicate && stableJson(duplicate) !== stableJson(normalized)) throw new Error('Learning session identity conflict');
  if (!duplicate) envelope.sessions.push(normalized);
  const { stats, introduced } = derive(envelope, dimensions, evidence.targetWpm);
  envelope.introduced[learningModelKey(dimensions)] = introduced;
  const persisted = persistEnvelope(envelope);
  const available = new Set(introduced);
  return { updatedChars: Object.values(stats).filter(stat => stat.isUnlocked), newlyUnlocked: introduced.filter(char => !before.includes(char)), nextToUnlock: getContentPack(dimensions.language).introductionOrder.find(char => !available.has(char)) ?? null, persisted };
}
export function updateCharacterProgress(newMetrics: Map<string, CharacterConfidence>, targetWPM = 35, options: ProgressOptions = {}) {
  return recordLearningSession({ learningVersion: LEARNING_VERSION, sessionId: options.sessionId ?? crypto.randomUUID(), completedAt: options.completedAt ?? new Date().toISOString(), elapsedMs: options.elapsedMs ?? 0, dimensions: dimensionsOf(options.dimensions), attempts: [...newMetrics.values()].flatMap(metric => metric.observations ?? []).sort((a, b) => a.offsetMs - b.offsetMs), assessment: options.assessment ?? true, targetWpm: saneTarget(targetWPM), ...(options.sourceResultId ? { sourceResultId: options.sourceResultId } : {}) }, options.owner);
}
export function getLearningSessions(options: LearningOptions = {}): LearningSessionEvidence[] {
  const sessions = loadEnvelope(options.owner).sessions;
  return options.dimensions ? sessions.filter(session => learningModelKey(session.dimensions) === learningModelKey(options.dimensions)) : sessions;
}
export function getCharacterHistory(char: string, options: LearningOptions = {}): { sessionId: string; completedAt: string; wpm: number | null; accuracy: number; attempts: number; attributable: number }[] {
  return getLearningSessions({ ...options, dimensions: dimensionsOf(options.dimensions) }).filter(session => session.attempts.some(attempt => attempt.expected.toLocaleLowerCase() === char)).sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.sessionId.localeCompare(b.sessionId)).map(session => {
    const observations = session.attempts.filter(attempt => attempt.expected.toLocaleLowerCase() === char);
    const stat = summarize(char, observations, session.targetWpm, true);
    return { sessionId: session.sessionId, completedAt: session.completedAt, wpm: stat.avgTimeMs > 0 ? stat.wpm : null, accuracy: stat.accuracy, attempts: observations.length, attributable: stat.attributableAttempts ?? 0 };
  });
}
export function mergeLearningSessions(incoming: LearningSessionEvidence[], owner = 'guest', serverVersion = 0): void {
  const envelope = loadEnvelope(owner);
  for (const session of incoming) {
    if (!validEvidence(session)) continue;
    if (envelope.removedSessionIds?.includes(session.sessionId)) continue;
    const normalized = { ...session, dimensions: dimensionsOf(session.dimensions) };
    const existing = envelope.sessions.find(item => item.sessionId === session.sessionId);
    if (existing && stableJson(existing) !== stableJson(normalized)) throw new Error('Conflicting learning evidence');
    if (!existing) envelope.sessions.push(normalized);
  }
  envelope.serverVersion = Math.max(envelope.serverVersion, serverVersion);
  persistEnvelope(envelope);
}
/** A complete owner-authorized cloud snapshot removes previously accepted sessions absent after deletion.
 * Pending/local-only evidence remains untouched. Stale cloud versions cannot resurrect deleted evidence.
 */
export function reconcileLearningSessions(incoming: LearningSessionEvidence[], owner: string, serverVersion: number): void {
  const envelope = loadEnvelope(owner);
  if (serverVersion < envelope.serverVersion) return;
  const present = new Set(incoming.filter(validEvidence).map(session => session.sessionId));
  const removed = (envelope.serverSessionIds ?? []).filter(id => !present.has(id));
  const removedSet = new Set([...(envelope.removedSessionIds ?? []), ...removed]);
  envelope.sessions = envelope.sessions.filter(session => !removedSet.has(session.sessionId));
  envelope.removedSessionIds = [...removedSet];
  envelope.serverSessionIds = [...present];
  envelope.serverVersion = serverVersion;
  persistEnvelope(envelope);
  mergeLearningSessions(incoming, owner, serverVersion);
}
export function removeLearningSession(sessionId: string, owner = 'guest'): void {
  const envelope = loadEnvelope(owner);
  envelope.sessions = envelope.sessions.filter(session => session.sessionId !== sessionId);
  envelope.removedSessionIds = [...new Set([...(envelope.removedSessionIds ?? []), sessionId])];
  persistEnvelope(envelope);
}
export function resetKeybrProgress(owner = 'guest'): void {
  memoryFallback.delete(owner);
  try { localStorage.removeItem(storageKey(owner)); if (owner === 'guest') localStorage.removeItem('keybr_character_data'); } catch { /* Practice can still continue. */ }
}
function isCanonicalResult(value: unknown, owner: string): value is SessionResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<SessionResult>;
  return result.schemaVersion === 3 && result.metricsVersion === 'forge-v3' && result.ownerScope === owner && typeof result.clientSessionId === 'string' && !!result.configuration && Array.isArray(result.events) && Array.isArray(result.pauseIntervals) && Array.isArray(result.assistance) && Number.isFinite(result.finishedAtWall);
}
/** Context-qualified ordinary tests/races update review; only dedicated assessments grant initial mastery. */
export async function hydrateLearningFromSessions(owner: string): Promise<void> {
  const known = new Set(getLearningSessions({ owner }).map(session => session.sessionId));
  for (const record of await sessionRepository.list(owner)) {
    if (known.has(record.clientSessionId) || record.provenance !== 'observed' || !isCanonicalResult(record.candidate, owner)) continue;
    try { recordLearningSession(learningEvidenceFromResult(record.candidate), owner); }
    catch { /* An invalid or conflicting history row is retained without replacing valid key evidence. */ }
  }
}
sessionRepository.subscribe(event => {
  if (event.type === 'remove' && event.sessionId) removeLearningSession(event.sessionId, event.ownerId);
  if (event.type === 'clear') resetKeybrProgress(event.ownerId);
  if (event.type === 'save' && event.sessionId) {
    void sessionRepository.get(event.ownerId, event.sessionId).then(record => {
      if (record?.provenance === 'observed' && isCanonicalResult(record.candidate, event.ownerId)) recordLearningSession(learningEvidenceFromResult(record.candidate), event.ownerId);
    }).catch(() => { /* Save failures remain visible through the repository's own save state. */ });
  }
});
export interface LessonGenerationOptions extends LearningOptions { seed?: string; focusLetters?: string[]; review?: boolean; targetWpm?: number; targeted?: boolean }
/** Natural words first; sparse sets use bounded Forge vowel/consonant patterns. */
export function generateKeybrLesson(wordCount = 40, options: LessonGenerationOptions = {}): KeybrLesson {
  const dimensions = dimensionsOf(options.dimensions);
  const pack = getContentPack(dimensions.language);
  const availableLetters = [...new Set([...getUnlockedLetters(options), ...(options.targeted ? options.focusLetters?.filter(char => pack.alphabet.includes(char)) ?? [] : [])])];
  const seed = options.seed ?? crypto.randomUUID();
  const random = seededRandom(seed);
  const available = new Set(availableLetters);
  const requestedFocus = options.focusLetters?.filter(char => available.has(char));
  const focus = requestedFocus?.[0] ?? getWeakLetters(1, options)[0] ?? availableLetters[0];
  const review = options.review ?? false;
  const natural = pack.words.filter(word => {
    const chars = graphemes(word, pack.id === 'gu-Latn' ? 'gu' : pack.id);
    return chars.length <= 12 && chars.every(char => available.has(char)) && (review || chars.includes(focus));
  });
  const vowels = availableLetters.filter(char => /[aeiouyàáâäãåèéêëìíîïòóôöõùúûüаеёиоуыэюяअआइईउऊएऐओऔاوي]/u.test(char));
  const consonants = availableLetters.filter(char => !vowels.includes(char));
  const choose = (items: readonly string[]) => items[Math.floor(random() * items.length)];
  const fallback = () => {
    const length = 3 + Math.floor(random() * 4);
    const chars = Array.from({ length }, (_, index) => {
      const group = index % 2 === 0 ? consonants : vowels;
      return choose(group.length ? group : availableLetters);
    });
    chars[Math.floor(random() * length)] = focus;
    return chars.join('');
  };
  let naturalWordCount = 0;
  const words = Array.from({ length: Math.max(1, Math.min(2000, Math.floor(wordCount) || 1)) }, (_, index) => {
    if (natural.length > 0 && (natural.length >= 6 || index % 3 !== 2)) { naturalWordCount++; return choose(natural); }
    return fallback();
  });
  return { text: words.join(' '), availableLetters, focusLetters: review ? [] : [focus], lockedLetters: getLockedLetters(options), seed, generatorVersion: 'forge-pattern-v3', contentRevision: pack.revision, naturalWordCount, phoneticWordCount: words.length - naturalWordCount, review };
}
