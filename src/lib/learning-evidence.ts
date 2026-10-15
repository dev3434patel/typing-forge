import type { SessionResult } from './typing-core/types.ts';
import { replayTranscript } from './typing-core/transcript.ts';

export const LEARNING_VERSION = 'forge-learn-v3' as const;
export const LEARNING_INACTIVITY_MS = 2000;
export interface LearningDimensions {
  language: string;
  layout: string;
  domain: 'prose' | 'code';
  inputMethod: 'keyboard' | 'composition' | 'virtual';
}
export interface LearningAttempt {
  expected: string;
  typed: string;
  correct: boolean;
  offsetMs: number;
  latencyMs: number | null;
  attributable: boolean;
  classification: 'trigger' | 'individual' | 'incorrect' | 'composition' | 'inactivity' | 'unattributable';
}
export interface LearningSessionEvidence {
  learningVersion: typeof LEARNING_VERSION;
  sessionId: string;
  completedAt: string;
  elapsedMs: number;
  dimensions: LearningDimensions;
  attempts: LearningAttempt[];
  assessment: boolean;
  targetWpm: number;
  sourceResultId?: string;
}

/** Portable accepted-session projection: no browser storage, DOM, clock, RNG, or content dependency. */
export function learningEvidenceFromResult(result: SessionResult): LearningSessionEvidence {
  const replayed = replayTranscript(result.configuration, result.events, Infinity, result.targetText, result.issuedTargetSegments);
  const settings = result.configuration.settings ?? {};
  const configuredTarget = settings.targetWpm;
  const targetWpm = typeof configuredTarget === 'number' && Number.isFinite(configuredTarget) ? Math.min(500, Math.max(1, configuredTarget)) : 35;
  const composition = result.events.some(event => event.provenance === 'composition');
  const dimensions: LearningDimensions = {
    language: result.configuration.language ?? 'en',
    layout: result.configuration.keyboardLayout ?? 'qwerty',
    domain: result.configuration.scoringPolicy === 'code' ? 'code' : 'prose',
    inputMethod: composition || result.configuration.inputMethod === 'composition' ? 'composition' : result.configuration.inputMethod === 'virtual' ? 'virtual' : 'keyboard',
  };
  const attempts: LearningAttempt[] = replayed.attempts.map((attempt, index, all) => {
    const previous = all[index - 1];
    const interval = previous ? attempt.offsetMs - previous.offsetMs : 0;
    const simultaneous = attempt.provenance === 'composition' || !!attempt.compositionId;
    const crossesPause = !!previous && result.pauseIntervals.some(pause => pause.startMs < attempt.offsetMs && pause.endMs >= previous.offsetMs);
    const individualKeyboard = attempt.provenance === 'keyboard' && attempt.eventUnits === 1 && !simultaneous;
    const previousIndividualKeyboard = previous?.provenance === 'keyboard' && previous.eventUnits === 1 && !previous.compositionId;
    const attributable = index > 0 && individualKeyboard && previousIndividualKeyboard && interval > 0 && interval <= LEARNING_INACTIVITY_MS && !crossesPause;
    const classification: LearningAttempt['classification'] = !previous ? 'trigger' : simultaneous ? 'composition' : interval > LEARNING_INACTIVITY_MS || crossesPause ? 'inactivity' : !attributable ? 'unattributable' : !attempt.correct ? 'incorrect' : 'individual';
    return { expected: attempt.expected ?? '', typed: attempt.typed ?? '', correct: attempt.correct, offsetMs: attempt.offsetMs, latencyMs: attributable && attempt.correct ? interval : null, attributable, classification };
  });
  return {
    learningVersion: LEARNING_VERSION, sessionId: result.clientSessionId, completedAt: new Date(result.finishedAtWall).toISOString(), elapsedMs: result.elapsedMs, dimensions, attempts,
    assessment: ['learn', 'learning'].includes(result.configuration.mode) && result.finishReason === 'completed' && settings.review !== true && !result.assistance.some(source => ['paste', 'drop', 'autocorrect', 'generated'].includes(source)),
    targetWpm, ...(typeof settings.sourceResultId === 'string' ? { sourceResultId: settings.sourceResultId } : {}),
  };
}
