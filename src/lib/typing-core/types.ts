/** Forge v3's portable session contract. Offsets and edit ranges are grapheme based. */
export type SessionMode = 'time' | 'words' | 'quote' | 'code' | 'zen' | 'custom' | 'learn' | 'learning' | 'race';
export type ScoringPolicy = 'prose' | 'code' | 'free';
export type InputProvenance = 'keyboard' | 'composition' | 'paste' | 'drop' | 'autocorrect' | 'generated';
export type FinishReason = 'completed' | 'timeout' | 'manual' | 'abandoned';
export interface SessionConfig {
  clientSessionId: string;
  mode: SessionMode;
  initialTarget: string;
  scoringPolicy?: ScoringPolicy;
  durationMs?: number;
  ownerScope?: string;
  language?: string;
  script?: string;
  keyboardLayout?: string;
  inputMethod?: string;
  contentRevision?: string;
  generatorVersion?: string;
  seed?: string | number;
  challengeId?: string;
  repeatedContent?: boolean;
  paused?: boolean;
  rejectIncorrect?: boolean;
  /** Legacy current-word seals every submission. Correct-word locking permits
   * one previous incorrect prose word to be reopened from an empty current word. */
  correctionPolicy?: 'current-word' | 'correct-words-locked';
  punctuation?: boolean;
  numbers?: boolean;
  wordCount?: number;
  codeLanguage?: string;
  comparisonKey?: string;
  settings?: Record<string, unknown>;
  privacy?: 'public-corpus' | 'private-custom';
  /** Server-owned race start is separate from personal first-input timing. */
  startImmediately?: boolean;
}
export interface NormalizedEdit {
  type: 'insert' | 'replace' | 'delete' | 'reject' | 'submit' | 'composition';
  start?: number;
  end?: number;
  text?: string;
  provenance?: InputProvenance;
  compositionId?: string;
}
export interface SessionEvent extends NormalizedEdit {
  sequence: number;
  offsetMs: number;
  start: number;
  end: number;
  text: string;
  provenance: InputProvenance;
}
export interface PauseInterval { startMs: number; endMs: number }
export interface TargetSegment {
  offsetMs: number;
  text: string;
  /** Last event already observed when issued; resolves equal-clock ordering. */
  afterSequence?: number;
}
export interface CharacterSlot {
  index: number;
  expected: string | null;
  typed: string | null;
  status: 'correct' | 'incorrect' | 'extra' | 'missed' | 'untyped';
}
export interface SessionMetricValues {
  wpm: number | null;
  rawWpm: number | null;
  attemptRate: number | null;
  correctCharacterWpm: number | null;
  inputAccuracy: number | null;
  finalTextAccuracy: number | null;
  consistency: number | null;
  peakFiveSecondWpm: number | null;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  untyped: number;
  creditedUnits: number;
  retainedUnits: number;
  correctAttempts: number;
  incorrectAttempts: number;
  insertionAttempts: number;
  deletionActions: number;
  deletedUnits: number;
  progress: number;
  elapsedMs: number;
}
export interface TimeSample {
  offsetMs: number;
  seconds: number;
  wpm: number | null;
  rawWpm: number | null;
  /** Insertions in this bucket, normalized by its actual duration. Includes idle buckets. */
  localWpm: number;
  errors: number;
  bucketDurationMs: number;
}
export interface SessionSnapshot {
  status: 'ready' | 'running' | 'paused' | 'finished';
  finalText: string;
  targetText: string;
  elapsedMs: number;
  wallDurationMs: number;
  remainingMs: number | null;
  /** Caret in displayed target graphemes; edit ranges refer to finalText graphemes. */
  cursor: number;
  characters: CharacterSlot[];
  metrics: SessionMetricValues;
  events: SessionEvent[];
}
export interface SessionResult extends SessionSnapshot {
  schemaVersion: 3;
  metricsVersion: 'forge-v3';
  learningVersion: 'forge-learn-v3';
  clientSessionId: string;
  ownerScope: string;
  configuration: SessionConfig;
  comparisonKey: string;
  initialTarget: string;
  issuedTargetSegments: TargetSegment[];
  finalTranscript: string;
  startedAtWall: number | null;
  finishedAtWall: number;
  pauseIntervals: PauseInterval[];
  finishReason: FinishReason;
  assistance: InputProvenance[];
  eligibility: { eligible: boolean; reasons: string[]; verification: 'local-unverified' };
  timeSeries: TimeSample[];
}
export interface SessionClock { now(): number; wallNow(): number }
