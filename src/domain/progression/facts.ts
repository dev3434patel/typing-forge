import { activeOffset, replaySession, traceSessionWords } from '@/lib/typing-core/metrics';
import { replayTranscript } from '@/lib/typing-core/transcript';
import type { SessionResult } from '@/lib/typing-core/types';
import { fingerForCharacter } from '@/domain/training/finger-map';
import { assessCourseResult } from '@/lib/typing-course';
import { comparisonKey } from '@/lib/typing-core/session';
import { dateInZone } from './calendar';
import { aggregateSkills } from './skills';
import type { ActivityFact, SkillObservation, Verification } from './types';

export const ARCADE_GAMES = ['word-invaders', 'ghost-gp', 'daily-gauntlet', 'rhythm-typing', 'key-tower', 'snake-words', 'lava-rise', 'boss-duel'] as const;
export function comparableThirtySecondBest(result: SessionResult, previous: SessionResult[]): boolean {
  if (result.configuration.mode !== 'time' || result.configuration.durationMs !== 30000 || result.elapsedMs !== 30000 || result.finishReason !== 'timeout' || result.pauseIntervals.length || result.configuration.repeatedContent || result.configuration.rejectIncorrect || result.events.some(event => !['keyboard', 'composition'].includes(event.provenance))) return false;
  const cohort = comparisonKey(result.configuration);
  const speed = (candidate: SessionResult) => replaySession(candidate.configuration, candidate.events, candidate.elapsedMs, { targetText: candidate.targetText, issuedTargetSegments: candidate.issuedTargetSegments, pauseIntervals: candidate.pauseIntervals, finiteFinal: candidate.finishReason === 'completed' }).metrics.wpm;
  const earlier = previous.filter(candidate => candidate.clientSessionId !== result.clientSessionId && candidate.finishedAtWall <= result.finishedAtWall && candidate.configuration?.mode === 'time' && candidate.configuration.durationMs === 30000 && candidate.elapsedMs === 30000 && candidate.finishReason === 'timeout' && !candidate.pauseIntervals.length && !candidate.configuration.repeatedContent && !candidate.configuration.rejectIncorrect && candidate.events.every(event => ['keyboard', 'composition'].includes(event.provenance)) && comparisonKey(candidate.configuration) === cohort);
  if (!earlier.length) return false;
  const current = speed(result); return current !== null && earlier.every(candidate => { const measured = speed(candidate); return measured !== null && current > measured; });
}
/** Recompute evidence; caller-supplied metric fields never award progression. */
export function factFromSession(result: SessionResult, payloadHash: string, timeZone: string, verification: Verification = 'local', receivedAt = result.finishedAtWall): ActivityFact {
  if (result.schemaVersion !== 3 || result.metricsVersion !== 'forge-v3' || result.clientSessionId !== result.configuration.clientSessionId || result.ownerScope !== (result.configuration.ownerScope ?? 'guest')) throw new Error('Unsupported or owner-mismatched progression evidence');
  if (!result.clientSessionId || result.clientSessionId.length > 128 || !payloadHash || payloadHash.length > 100) throw new Error('A canonical identity is required');
  dateInZone(receivedAt, timeZone);
  const options = { targetText: result.targetText, pauseIntervals: result.pauseIntervals, finiteFinal: result.finishReason === 'completed', issuedTargetSegments: result.issuedTargetSegments };
  const replay = replaySession(result.configuration, result.events, result.elapsedMs, options);
  if (replay.finalText !== result.finalTranscript) throw new Error('Canonical transcript does not match progression evidence');
  const policy = result.configuration.scoringPolicy ?? (result.configuration.mode === 'code' ? 'code' : 'prose');
  const settings = result.configuration.settings ?? {};
  const game = typeof settings.arcadeGame === 'string' && (ARCADE_GAMES as readonly string[]).includes(settings.arcadeGame);
  const assisted = result.events.some(event => !['keyboard', 'composition'].includes(event.provenance)) || (settings.training as { practiceAssist?: boolean } | undefined)?.practiceAssist === true;
  const eligible = !assisted && policy !== 'free' && result.finishReason !== 'abandoned';
  const completedChars = !eligible ? 0 : policy === 'code' ? replay.metrics.correct : traceSessionWords(result.configuration, result.events, result.elapsedMs, options).filter(word => word.reason === 'complete-correct').reduce((sum, word) => sum + word.creditedUnits, 0);
  const scored = result.events.filter(event => activeOffset(event.offsetMs, result.pauseIntervals) <= result.elapsedMs && (result.configuration.durationMs === undefined || activeOffset(event.offsetMs, result.pauseIntervals) < result.configuration.durationMs));
  const attempts = replayTranscript(result.configuration, scored, Infinity, result.targetText, result.issuedTargetSegments).attempts;
  const skills: SkillObservation[] = [];
  const crossesPause = (from: number, to: number) => result.pauseIntervals.some(pause => pause.startMs < to && pause.endMs >= from);
  if (eligible) for (let index = 0; index < attempts.length; index++) {
    const attempt = attempts[index], previous = attempts[index - 1], before = attempts[index - 2];
    if (!attempt.expected) continue;
    const interval = previous ? attempt.offsetMs - previous.offsetMs : 0;
    const individual = attempt.provenance === 'keyboard' && attempt.eventUnits === 1 && !attempt.compositionId;
    const previousIndividual = previous?.provenance === 'keyboard' && previous.eventUnits === 1 && !previous.compositionId;
    const paused = !!previous && crossesPause(previous.offsetMs, attempt.offsetMs);
    const linked = individual && previousIndividual && interval > 0 && interval <= 2000 && !paused && attempt.position === previous.position + 1;
    skills.push({ key: attempt.expected, finger: fingerForCharacter(attempt.expected, result.configuration.keyboardLayout, result.configuration.language), correct: attempt.correct,
      latencyMs: linked && attempt.correct ? interval : null,
      ...(linked && previous.expected ? { bigram: previous.expected + attempt.expected, bigramCorrect: previous.correct && attempt.correct } : {}),
      ...(linked && before?.expected && before.provenance === 'keyboard' && before.eventUnits === 1 && !before.compositionId && previous.position === before.position + 1 && previous.offsetMs > before.offsetMs && previous.offsetMs - before.offsetMs <= 2000 && !crossesPause(before.offsetMs, previous.offsetMs) ? { trigram: before.expected + previous.expected + attempt.expected, trigramCorrect: before.correct && previous.correct && attempt.correct } : {}) });
  }
  const lessonQualified = eligible && assessCourseResult(result)?.qualifies === true;
  const method = result.events.some(event => event.provenance === 'composition') || result.configuration.inputMethod === 'composition' ? 'composition' : result.configuration.inputMethod === 'virtual' ? 'virtual' : 'keyboard';
  return { version: 1, id: result.clientSessionId, ownerId: result.ownerScope, verification, payloadHash, at: receivedAt, startedAt: result.startedAtWall ?? result.finishedAtWall, timeZone,
    kind: game ? 'game' : lessonQualified ? 'lesson' : result.configuration.mode === 'race' ? 'race' : 'practice', completedChars,
    attempts: eligible ? replay.metrics.insertionAttempts : 0, correctAttempts: eligible ? replay.metrics.correctAttempts : 0,
    lessonQualified, raceWin: false, personalBest30: false, skills: aggregateSkills(skills), skillScope: [result.configuration.language ?? 'en', result.configuration.keyboardLayout ?? 'qwerty', method, policy].join('|') };
}
