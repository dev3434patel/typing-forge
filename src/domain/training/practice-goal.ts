import { replaySnapshot } from '@/lib/typing-core/metrics';
import type { SessionResult } from '@/lib/typing-core/types';
function scope(result: SessionResult): string {
  const config = result.configuration, training = config.settings?.training as { kind?: string; lessonId?: string; alphabet?: string } | undefined;
  return JSON.stringify(['training-goal-v1', config.contentRevision, config.generatorVersion, training?.kind, training?.lessonId, training?.alphabet, config.language, config.keyboardLayout, config.inputMethod, config.scoringPolicy, config.correctionPolicy]);
}
const observed = (result: SessionResult) => replaySnapshot(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, pauseIntervals: result.pauseIntervals, issuedTargetSegments: result.issuedTargetSegments, finiteFinal: true }).metrics;
/** Named private practice goal; never changes canonical course/PB qualification. */
export function assessPracticeGoal(result: SessionResult, previous: readonly SessionResult[] = [], coldTarget = 15) {
  if (result.configuration.contentRevision !== 'training-practice-v1') return null;
  try {
    const prior: number[] = [];
    const seen = new Set<string>();
    for (const candidate of [...previous].sort((a, b) => b.finishedAtWall - a.finishedAtWall)) {
      if (prior.length >= 5) break;
      if (candidate.ownerScope !== result.ownerScope || candidate.clientSessionId === result.clientSessionId || seen.has(candidate.clientSessionId) || candidate.finishedAtWall > result.finishedAtWall || candidate.status !== 'finished' || candidate.finishReason !== 'completed' || scope(candidate) !== scope(result)) continue;
      seen.add(candidate.clientSessionId);
      try { const metrics = observed(candidate), value = metrics.wpm; if (metrics.progress === 100 && value !== null && Number.isFinite(value) && value > 0) prior.push(value); } catch { /* Malformed history does not set a goal. */ }
    }
    prior.sort((a, b) => a - b);
    const median = !prior.length ? null : prior.length % 2 ? prior[Math.floor(prior.length / 2)] : (prior[prior.length / 2 - 1] + prior[prior.length / 2]) / 2;
    const targetWpm = median === null ? Math.max(1, Number.isFinite(coldTarget) ? coldTarget : 15) : median * 1.05;
    const metrics = observed(result), accuracyPassed = metrics.inputAccuracy !== null && metrics.inputAccuracy >= 90;
    const speedPassed = metrics.wpm !== null && metrics.wpm >= targetWpm;
    const completed = result.status === 'finished' && result.finishReason === 'completed' && metrics.progress === 100;
    const passed = completed && accuracyPassed && speedPassed;
    return { version: 'training-goal-v1', targetWpm, medianWpm: median, comparableAttempts: prior.length, source: median === null ? 'cold-start' : 'rolling-median-105pct', inputAccuracy: metrics.inputAccuracy, wpm: metrics.wpm, accuracyPassed, speedPassed, completed, passed, practiceStars: !passed ? 0 : metrics.inputAccuracy! >= 98 ? 3 : metrics.inputAccuracy! >= 95 ? 2 : 1, courseQualification: false as const };
  } catch { return null; }
}
