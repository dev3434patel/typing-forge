import type { CharacterSlot, InputProvenance, SessionConfig, SessionEvent, ScoringPolicy, TargetSegment } from './types.ts';

type SegmenterLike = { segment(text: string): Iterable<{ segment: string }> };
type SegmenterConstructor = new (locale: string, options: { granularity: string }) => SegmenterLike;
const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
const segmenter = Segmenter ? new Segmenter('und', { granularity: 'grapheme' }) : null;
export const SEGMENTATION_POLICY = segmenter ? 'unicode-grapheme-intl-v1' : 'unicode-codepoint-fallback-v1';
export function graphemes(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text);
}
// Bounded deterministic memoization avoids re-segmenting the immutable target on every input.
const targetCache = new Map<string, readonly string[]>();
export function targetGraphemes(text: string): readonly string[] {
  const cached = targetCache.get(text);
  if (cached) return cached;
  const result = Object.freeze(graphemes(text));
  if (targetCache.size >= 16) targetCache.delete(targetCache.keys().next().value!);
  targetCache.set(text, result);
  return result;
}
export function normalizeTarget(text: string, policy: ScoringPolicy = 'prose'): string {
  return policy === 'code' ? text.replace(/\r\n/g, '\n') : text.normalize('NFC');
}
export function utf16ToGraphemeOffset(text: string, offset: number): number {
  return graphemes(text.slice(0, Math.max(0, offset))).length;
}
export interface Alignment {
  characters: CharacterSlot[];
  mapping: Array<number | null>;
  cursor: number;
  processed: number;
  creditedUnits: number;
  words: WordCreditTrace[];
}
export type WordCreditReason = 'complete-correct' | 'partial-prefix' | 'incorrect-word' | 'untyped' | 'skipped' | 'extra-word';
export interface WordCreditTrace {
  index: number;
  targetStart: number;
  targetEnd: number;
  targetWord: string;
  typedWord: string;
  expectedSeparator: string | null;
  typedSeparator: string | null;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  untyped: number;
  wordCredit: number;
  separatorCredit: number;
  creditedUnits: number;
  reason: WordCreditReason;
}
interface Word { start: number; end: number; separator: number | null }
function targetWords(target: readonly string[]): Word[] {
  const words: Word[] = [];
  let start = 0;
  for (let i = 0; i <= target.length; i++) {
    if (i === target.length || target[i] === ' ') {
      words.push({ start, end: i, separator: i < target.length ? i : null });
      start = i + 1;
    }
  }
  return words;
}
/** A submitted short word consumes its own target slot, preserving later word alignment. */
export function alignTranscript(target: readonly string[], typed: string[], policy: ScoringPolicy, finiteFinal = false, submissions: number[] = [], options: { includeWords?: boolean } = {}): Alignment {
  const mapping: Array<number | null> = [];
  const words = targetWords(target);
  let wordIndex = 0;
  let withinWord = 0;
  let processed = 0;
  const wordHasExtra: boolean[] = [];
  const wordHasInput: boolean[] = [];
  const submittedWords = new Set<number>();
  const trace: WordCreditTrace[] = [];
  const typedWords: string[][] = [];
  const typedSeparators: Array<string | null> = [];
  const extraCounts: number[] = [];
  const recordTyped = (index: number, unit: string, separator: boolean, extra: boolean) => {
    if (!options.includeWords) return;
    if (separator) typedSeparators[index] = unit;
    else (typedWords[index] ??= []).push(unit);
    if (extra) extraCounts[index] = (extraCounts[index] ?? 0) + 1;
  };
  let submissionIndex = 0;
  const submitAt = (position: number) => {
    while (submissionIndex < submissions.length && submissions[submissionIndex] === position) {
      const word = words[wordIndex];
      if (word) processed = Math.max(processed, word.separator === null ? word.end : word.separator + 1);
      submittedWords.add(wordIndex++);
      withinWord = 0;
      submissionIndex++;
    }
  };
  for (let i = 0; i < typed.length; i++) {
    if (policy === 'prose') submitAt(i);
    if (policy !== 'prose') {
      mapping.push(policy === 'free' || i >= target.length ? null : i);
      processed = Math.min(target.length, i + 1);
      continue;
    }
    const word = words[wordIndex];
    if (!word) { mapping.push(null); recordTyped(words.length, typed[i], false, true); continue; }
    if (typed[i] === ' ') {
      recordTyped(wordIndex, typed[i], true, word.separator === null);
      mapping.push(word.separator);
      processed = Math.max(processed, word.separator === null ? word.end : word.separator + 1);
      wordIndex++;
      withinWord = 0;
    } else {
      const slot = word.start + withinWord;
      mapping.push(slot < word.end ? slot : null);
      recordTyped(wordIndex, typed[i], false, slot >= word.end);
      wordHasInput[wordIndex] = true;
      if (slot >= word.end) wordHasExtra[wordIndex] = true;
      processed = Math.max(processed, Math.min(word.end, slot + 1));
      withinWord++;
    }
  }
  if (policy === 'prose') submitAt(typed.length);
  const currentWord = words[wordIndex];
  const cursor = policy === 'prose'
    ? (currentWord ? Math.min(currentWord.end, currentWord.start + withinWord) : target.length)
    : Math.min(target.length, typed.length);
  const characters: CharacterSlot[] = target.map((expected, index) => ({
    index, expected, typed: null,
    status: index < processed || finiteFinal ? 'missed' : 'untyped',
  }));
  mapping.forEach((slot, i) => {
    if (slot === null) characters.push({ index: target.length + i, expected: null, typed: typed[i], status: 'extra' });
    else characters[slot] = { index: slot, expected: target[slot], typed: typed[i], status: typed[i] === target[slot] ? 'correct' : 'incorrect' };
  });
  let creditedUnits = 0;
  if (policy === 'code') creditedUnits = characters.filter(char => char.status === 'correct').length;
  if (policy === 'prose') {
    words.forEach((word, index) => {
      const separatorEntered = word.separator !== null && characters[word.separator].typed !== null;
      const completedLast = word.separator === null && processed >= word.end;
      const exact = wordHasInput[index] && !wordHasExtra[index] && characters.slice(word.start, word.end).every(char => char.status === 'correct');
      let wordCredit = 0;
      let separatorCredit = 0;
      let reason: WordCreditReason = !wordHasInput[index] ? index < wordIndex || finiteFinal ? 'skipped' : 'untyped' : 'incorrect-word';
      if (exact && (separatorEntered || completedLast || submittedWords.has(index))) {
        wordCredit = word.end - word.start;
        if (separatorEntered && characters[word.separator!].status === 'correct') separatorCredit = 1;
        reason = 'complete-correct';
      } else if (!finiteFinal && index === wordIndex && !separatorEntered) {
        for (let slot = word.start; slot < word.end && characters[slot].status === 'correct'; slot++) wordCredit++;
        if (wordHasInput[index]) reason = 'partial-prefix';
      }
      creditedUnits += wordCredit + separatorCredit;
      if (options.includeWords) {
        const slots = characters.slice(word.start, word.separator === null ? word.end : word.separator + 1);
        const count = (status: CharacterSlot['status']) => slots.filter(slot => slot.status === status).length;
        trace.push({ index, targetStart: word.start, targetEnd: word.end, targetWord: target.slice(word.start, word.end).join(''), typedWord: typedWords[index]?.join('') ?? '', expectedSeparator: word.separator === null ? null : target[word.separator], typedSeparator: typedSeparators[index] ?? null, correct: count('correct'), incorrect: count('incorrect'), extra: extraCounts[index] ?? 0, missed: count('missed'), untyped: count('untyped'), wordCredit, separatorCredit, creditedUnits: wordCredit + separatorCredit, reason });
      }
    });
    if (options.includeWords && typedWords[words.length]?.length) trace.push({ index: words.length, targetStart: target.length, targetEnd: target.length, targetWord: '', typedWord: typedWords[words.length].join(''), expectedSeparator: null, typedSeparator: null, correct: 0, incorrect: 0, extra: extraCounts[words.length] ?? 0, missed: 0, untyped: 0, wordCredit: 0, separatorCredit: 0, creditedUnits: 0, reason: 'extra-word' });
  }
  return { characters, mapping, cursor, processed, creditedUnits, words: trace };
}
export interface Attempt {
  offsetMs: number;
  correct: boolean;
  expected?: string;
  typed: string;
  position: number;
  compositionId?: string;
  provenance: InputProvenance;
  /** Replay-only attribution metadata; a batch is not a series of timed keypresses. */
  eventSequence: number;
  eventUnits: number;
}
export interface TranscriptState {
  units: string[];
  /** Grapheme boundary after the last committed separator or word submission. */
  editableStart: number;
  attempts: Attempt[];
  correctAttemptCount: number;
  deletionActions: number;
  deletedUnits: number;
  lastSequence: number;
  lastOffsetMs: number;
  compositionGroups: Set<string>;
  submissions: number[];
}
export function emptyTranscript(): TranscriptState {
  return { units: [], editableStart: 0, attempts: [], correctAttemptCount: 0, deletionActions: 0, deletedUnits: 0, lastSequence: -1, lastOffsetMs: 0, compositionGroups: new Set(), submissions: [] };
}
export function validateEvent(event: SessionEvent, state: TranscriptState): void {
  if (!Number.isInteger(event.sequence) || event.sequence <= state.lastSequence) throw new Error('Event sequence must increase');
  if (!Number.isFinite(event.offsetMs) || event.offsetMs < state.lastOffsetMs || event.offsetMs < 0) throw new Error('Event time must be finite and monotonic');
  if (!Number.isInteger(event.start) || !Number.isInteger(event.end) || event.start < 0 || event.end < event.start || event.end > state.units.length) throw new Error('Edit range is outside the transcript');
  if (!['insert', 'replace', 'delete', 'reject', 'submit', 'composition'].includes(event.type)) throw new Error('Unknown edit operation');
  if (typeof event.text !== 'string') throw new Error('Edit text must be a string');
  if (event.type === 'delete' && event.text !== '') throw new Error('Deletion cannot insert text');
  if (event.type === 'submit' && event.text !== '') throw new Error('Non-inserting word submission cannot insert text');
  if (event.text.length > 100_000) throw new Error('Input payload exceeds the session resource limit');
}
/** Edits can join existing clusters (combining marks, ZWJ emoji, regional indicators).
 * Keep edit ranges and retained counts grapheme based without rewriting attempt history.
 */
function reconcileGraphemeBoundaries(state: TranscriptState, cursor: number, policy: ScoringPolicy, changedStart: number): number {
  const nearby = state.units.slice(Math.max(0, changedStart - 1), Math.min(state.units.length, cursor + 1));
  const joined = nearby.join('');
  if (!Array.from(joined).some(character => character.charCodeAt(0) > 127) && !joined.includes('\r')) return cursor;
  const oldUnits = state.units;
  const positionAfterMerge = (position: number) => graphemes(normalizeTarget(oldUnits.slice(0, position).join(''), policy)).length;
  const nextCursor = positionAfterMerge(cursor);
  state.submissions = state.submissions.map(positionAfterMerge);
  state.editableStart = positionAfterMerge(state.editableStart);
  state.units = graphemes(normalizeTarget(oldUnits.join(''), policy));
  return Math.min(state.units.length, nextCursor);
}
/** Mutates only the supplied transient replay state. Submitted correctness flags are never used. */
export function applyEvent(state: TranscriptState, event: SessionEvent, targetText: string, config: SessionConfig): void {
  validateEvent(event, state);
  if (config.correctionPolicy !== undefined && config.correctionPolicy !== 'current-word') throw new Error('Unknown correction policy');
  const lockWords = config.correctionPolicy === 'current-word';
  if (lockWords && event.start < state.editableStart) throw new Error('Submitted words cannot be edited');
  state.lastSequence = event.sequence;
  state.lastOffsetMs = event.offsetMs;
  if (event.compositionId && state.compositionGroups.has(event.compositionId)) return;
  if (event.compositionId) state.compositionGroups.add(event.compositionId);
  const policy = config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose');
  const target = targetGraphemes(targetText);
  const words = policy === 'prose' ? targetWords(target) : [];
  if (event.type === 'submit') {
    if (policy !== 'prose') throw new Error('Word submission requires prose scoring');
    state.submissions.push(event.start);
    state.submissions.sort((a, b) => a - b);
    if (lockWords) state.editableStart = Math.max(state.editableStart, event.start);
    return;
  }
  const inserted = graphemes(normalizeTarget(event.text, policy));
  if (state.units.length - (event.end - event.start) + inserted.length > 1_000_000 || state.attempts.length + inserted.length > 1_000_000) throw new Error('Transcript resource limit exceeded');
  if (event.type === 'delete' && event.end === event.start) state.deletionActions++;
  if (event.type !== 'reject' && event.end > event.start) {
    state.submissions = state.submissions.filter(position => position <= event.start || position > event.end).map(position => position > event.end ? position - (event.end - event.start) : position);
    state.units.splice(event.start, event.end - event.start);
    state.deletionActions++;
    state.deletedUnits += event.end - event.start;
  }
  let cursor = event.start;
  let wordIndex = 0;
  let withinWord = 0;
  const locateCursor = () => {
    wordIndex = 0; withinWord = 0;
    if (policy !== 'prose') return;
    for (let index = 0; index < cursor; index++) {
      for (const position of state.submissions) if (position === index) { wordIndex++; withinWord = 0; }
      if (state.units[index] === ' ') { wordIndex++; withinWord = 0; }
      else withinWord++;
    }
    for (const position of state.submissions) if (position === cursor) { wordIndex++; withinWord = 0; }
  };
  locateCursor();
  for (const unit of inserted) {
    const word = words[wordIndex];
    const expectedSlot = policy === 'prose' ? (word ? Math.min(word.end, word.start + withinWord) : target.length) : cursor;
    const correct = policy === 'free' || (expectedSlot !== null && target[expectedSlot] === unit);
    state.attempts.push({ offsetMs: event.offsetMs, correct, expected: target[expectedSlot], typed: unit, position: expectedSlot, compositionId: event.compositionId, provenance: event.provenance, eventSequence: event.sequence, eventUnits: inserted.length });
    if (correct) state.correctAttemptCount++;
    if (event.type !== 'reject' && !(config.rejectIncorrect && !correct)) {
      state.submissions = state.submissions.map(position => position > cursor ? position + 1 : position);
      state.units.splice(cursor++, 0, unit);
      // Prose advances on the same literal spaces as alignment. Code and free
      // writing additionally commit tabs and line breaks as token boundaries.
      if (lockWords && (policy === 'prose' ? unit === ' ' : /^\s+$/u.test(unit))) state.editableStart = Math.max(state.editableStart, cursor);
      if (unit === ' ') { wordIndex++; withinWord = 0; } else withinWord++;
    }
  }
  // The event range is one atomic insertion. Re-segment after the complete edit so
  // a cluster joining the untouched suffix cannot move later text in the batch.
  reconcileGraphemeBoundaries(state, cursor, policy, event.start);
}
export function segmentPrecedesEvent(segment: TargetSegment, event: SessionEvent): boolean {
  return segment.offsetMs < event.offsetMs || (segment.offsetMs === event.offsetMs && (segment.afterSequence ?? -1) < event.sequence);
}
export function replayTranscript(config: SessionConfig, events: SessionEvent[], cutoffMs = Infinity, targetText = normalizeTarget(config.initialTarget, config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose')), issuedTargetSegments?: TargetSegment[]): TranscriptState {
  if (events.length > 100_000) throw new Error('Session event limit exceeded');
  const state = emptyTranscript();
  let issuedTarget = issuedTargetSegments ? normalizeTarget(config.initialTarget, config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose')) : targetText;
  let segmentIndex = 0;
  for (const event of events) {
    if (event.offsetMs >= cutoffMs) break;
    while (issuedTargetSegments && segmentIndex < issuedTargetSegments.length && segmentPrecedesEvent(issuedTargetSegments[segmentIndex], event)) issuedTarget += issuedTargetSegments[segmentIndex++].text;
    applyEvent(state, event, issuedTarget, config);
  }
  return state;
}
