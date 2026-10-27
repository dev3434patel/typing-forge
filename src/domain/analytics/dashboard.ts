import type { SessionRecord } from '@/services/session-repository';
import type { SessionResult } from '@/lib/typing-core/types';
import { courseAssessmentForRecord } from '@/lib/typing-course';
import { sessionView, localDateKey } from '@/services/history-model';
import { sessionInsights } from './session-insights';
import { replaySnapshot } from '@/lib/typing-core/metrics';
import { reviewSchedule, type ReviewObservation } from '../training/review';
import { getContentPack } from '@/lib/content-packs';

export function analyticsDashboard(records: readonly SessionRecord[], owner: string, now = Date.now(), dimensions = { language: 'en', layout: 'qwerty', inputMethod: 'keyboard' }) {
  const unique = new Map<string, SessionRecord>();
  for (const record of records) if (record.ownerId === owner && record.state !== 'rejected') unique.set(record.clientSessionId, record);
  const owned = [...unique.values()].sort((a, b) => a.createdAt - b.createdAt || a.clientSessionId.localeCompare(b.clientSessionId));
  const today = localDateKey(now);
  const periods = ['today', '7', '30', 'all'].map(period => {
    const matches = owned.filter(record => period === 'all' || (period === 'today' ? localDateKey(record.createdAt) === today : record.createdAt >= now - Number(period) * 86400000));
    return { period, sessions: matches.length, minutes: matches.reduce((sum, record) => sum + (Number.isFinite(record.summary.duration) ? Math.max(0, record.summary.duration) : 0), 0) / 60 };
  });
  const best = new Map<string, { comparisonKey: string; wpm: number; sessionId: string; completedAt: number }>();
  const stars = new Map<string, number>();
  const review: ReviewObservation[] = [];
  const reviewAlphabet = new Set(getContentPack(dimensions.language).alphabet);
  for (const record of owned) {
    const view = sessionView(record);
    if (view.isV3 && view.personalBestEligible && view.wpm !== null && view.wpm > (best.get(view.comparisonKey)?.wpm ?? -1)) best.set(view.comparisonKey, { comparisonKey: view.comparisonKey, wpm: view.wpm, sessionId: record.clientSessionId, completedAt: record.createdAt });
    const course = courseAssessmentForRecord(record, owner);
    if (course?.qualifies) stars.set(course.lessonId, Math.max(stars.get(course.lessonId) ?? 0, (course.metrics.inputAccuracy ?? 0) >= 98 && course.checks.speed ? 3 : (course.metrics.inputAccuracy ?? 0) >= 95 ? 2 : 1));
    if (record.candidate) {
      const insight = sessionInsights(record.candidate as SessionResult);
      const config = (record.candidate as SessionResult).configuration;
      if (insight && config.language === dimensions.language && config.keyboardLayout === dimensions.layout && config.inputMethod === dimensions.inputMethod && config.scoringPolicy !== 'code') for (const key of insight.keys.filter(item => item.n >= 20 && reviewAlphabet.has(item.key))) review.push({ sessionId: record.clientSessionId, key: key.key, day: localDateKey(record.createdAt), successful: key.smoothedAccuracy >= .92 });
    }
  }
  return { version: 'personal-dashboard-v1', ownerId: owner, reviewScope: dimensions, periods, personalBests: [...best.values()], stars: [...stars].map(([lessonId, count]) => ({ lessonId, stars: count })), reviews: reviewSchedule(review).filter(item => item.dueDay <= today), replaySessions: owned.filter(record => record.candidate).length, totalSessions: owned.length };
}

/** Deliberately excludes identifiers, text, event logs, errors, dates and usernames. */
export function privateShareProjection(result: SessionResult) {
  const metrics = replaySnapshot(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals, finiteFinal: !['time', 'race', 'zen'].includes(result.configuration.mode) }).metrics;
  return { version: 'private-share-v1', label: 'Personal practice · local evidence', metrics: { wpm: metrics.wpm, inputAccuracy: metrics.inputAccuracy, durationSeconds: result.elapsedMs / 1000 }, mode: result.configuration.mode };
}
