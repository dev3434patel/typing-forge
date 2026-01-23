/**
 * Stats Utility Functions
 * Server-derived metric calculations for the Stats page
 */

import { sanitizeMetric } from './metrics-engine';

export interface TestSession {
  id: string;
  created_at: string | null;
  net_wpm: number | null;
  gross_wpm?: number | null;
  accuracy_percent: number | null;
  consistency_percent: number | null;
  duration_seconds: number;
  test_mode: string;
  total_characters: number | null;
  correct_characters: number | null;
  error_count: number | null;
  per_char_metrics: unknown;
  wpm_history?: number[] | null;
}

export interface StatsAggregate {
  totalTime: number;
  lessonsCount: number;
  topSpeed: number;
  avgSpeed: number;
  topAccuracy: number;
  avgAccuracy: number;
  avgConsistency: number;
  totalCharacters: number;
  totalErrors: number;
}

export interface AccuracyStreak {
  threshold: number;
  count: number;
  avgWpm: number;
  avgAccuracy: number;
  startDate: string;
  endDate: string;
}

export interface SpeedBucket {
  range: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
}

/**
 * Calculate aggregate statistics from test sessions
 * All metrics are sanitized to prevent NaN/Infinity/negative values
 */
export function calculateAggregateStats(sessions: TestSession[]): StatsAggregate {
  if (sessions.length === 0) {
    return {
      totalTime: 0,
      lessonsCount: 0,
      topSpeed: 0,
      avgSpeed: 0,
      topAccuracy: 0,
      avgAccuracy: 0,
      avgConsistency: 0,
      totalCharacters: 0,
      totalErrors: 0,
    };
  }

  const totalTime = sessions.reduce((sum, t) => sum + (t.duration_seconds || 0), 0);
  const wpmValues = sessions.map(t => sanitizeMetric(t.net_wpm || 0));
  const accuracyValues = sessions.map(t => sanitizeMetric(t.accuracy_percent || 0));
  const consistencyValues = sessions.map(t => sanitizeMetric(t.consistency_percent || 0));

  const topSpeed = Math.max(...wpmValues, 0);
  const avgSpeed = sanitizeMetric(wpmValues.reduce((a, b) => a + b, 0) / sessions.length);
  const topAccuracy = Math.max(...accuracyValues, 0);
  const avgAccuracy = sanitizeMetric(accuracyValues.reduce((a, b) => a + b, 0) / sessions.length);
  const avgConsistency = sanitizeMetric(consistencyValues.reduce((a, b) => a + b, 0) / sessions.length);
  const totalCharacters = sessions.reduce((sum, t) => sum + (t.total_characters || 0), 0);
  const totalErrors = sessions.reduce((sum, t) => sum + (t.error_count || 0), 0);

  return {
    totalTime,
    lessonsCount: sessions.length,
    topSpeed,
    avgSpeed,
    topAccuracy,
    avgAccuracy,
    avgConsistency,
    totalCharacters,
    totalErrors,
  };
}

/**
 * Filter sessions by time period
 */
export function filterByTimePeriod(
  sessions: TestSession[], 
  period: 'all' | 'today' | 'week' | 'month' | 'year'
): TestSession[] {
  if (period === 'all') return sessions;
  
  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case 'today':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return sessions;
  }

  return sessions.filter(t => t.created_at && new Date(t.created_at) >= cutoff);
}

/**
 * Calculate accuracy streaks
 */
export function calculateAccuracyStreaks(sessions: TestSession[]): AccuracyStreak[] {
  const thresholds = [100, 98, 95, 90];
  const streaks: AccuracyStreak[] = [];

  thresholds.forEach(threshold => {
    let currentStreak: TestSession[] = [];
    let longestStreak: TestSession[] = [];

    sessions.forEach(test => {
      const accuracy = sanitizeMetric(test.accuracy_percent || 0);
      if (accuracy >= threshold) {
        currentStreak.push(test);
        if (currentStreak.length > longestStreak.length) {
          longestStreak = [...currentStreak];
        }
      } else {
        currentStreak = [];
      }
    });

    if (longestStreak.length >= 3) {
      const avgWpm = sanitizeMetric(
        longestStreak.reduce((sum, t) => sum + sanitizeMetric(t.net_wpm || 0), 0) / longestStreak.length
      );
      const avgAccuracy = sanitizeMetric(
        longestStreak.reduce((sum, t) => sum + sanitizeMetric(t.accuracy_percent || 0), 0) / longestStreak.length
      );

      streaks.push({
        threshold,
        count: longestStreak.length,
        avgWpm,
        avgAccuracy,
        startDate: longestStreak[0].created_at 
          ? new Date(longestStreak[0].created_at).toLocaleDateString() 
          : 'N/A',
        endDate: longestStreak[longestStreak.length - 1].created_at 
          ? new Date(longestStreak[longestStreak.length - 1].created_at).toLocaleDateString() 
          : 'N/A',
      });
    }
  });

  return streaks;
}

/**
 * Generate speed distribution buckets from sessions
 */
export function generateSpeedDistribution(sessions: TestSession[]): SpeedBucket[] {
  const buckets: SpeedBucket[] = [
    { range: '0-20', rangeStart: 0, rangeEnd: 20, count: 0 },
    { range: '20-40', rangeStart: 20, rangeEnd: 40, count: 0 },
    { range: '40-60', rangeStart: 40, rangeEnd: 60, count: 0 },
    { range: '60-80', rangeStart: 60, rangeEnd: 80, count: 0 },
    { range: '80-100', rangeStart: 80, rangeEnd: 100, count: 0 },
    { range: '100-120', rangeStart: 100, rangeEnd: 120, count: 0 },
    { range: '120+', rangeStart: 120, rangeEnd: 999, count: 0 },
  ];

  sessions.forEach(test => {
    const wpm = sanitizeMetric(test.net_wpm || 0);
    const bucket = buckets.find(b => wpm >= b.rangeStart && wpm < b.rangeEnd);
    if (bucket) bucket.count++;
  });

  return buckets;
}

/**
 * Calculate user's percentile based on their test distribution
 */
export function calculatePercentile(sessions: TestSession[], avgSpeed: number): number {
  if (sessions.length === 0) return 0;

  const sortedTests = [...sessions].sort(
    (a, b) => sanitizeMetric(a.net_wpm || 0) - sanitizeMetric(b.net_wpm || 0)
  );
  const testsBelow = sortedTests.filter(t => sanitizeMetric(t.net_wpm || 0) < avgSpeed).length;

  return Math.round((testsBelow / sortedTests.length) * 100);
}

/**
 * Prepare lesson data for charts
 */
export function prepareLessonData(sessions: TestSession[]) {
  return sessions.map((t, i) => ({
    lesson: i + 1,
    wpm: sanitizeMetric(t.net_wpm || 0),
    accuracy: sanitizeMetric(t.accuracy_percent || 0),
    consistency: sanitizeMetric(t.consistency_percent || 0),
    keysCount: Math.floor((t.total_characters || 0) / 10),
  }));
}

/**
 * Generate calendar activity data from sessions
 */
export function generateCalendarActivities(sessions: TestSession[], dailyGoal = 10) {
  const activityMap = new Map<string, { lessonsCompleted: number; dailyGoalPercent: number }>();

  sessions.forEach(t => {
    if (!t.created_at) return;
    const date = new Date(t.created_at).toISOString().split('T')[0];
    const existing = activityMap.get(date) || { lessonsCompleted: 0, dailyGoalPercent: 0 };
    existing.lessonsCompleted++;
    existing.dailyGoalPercent = Math.min(100, (existing.lessonsCompleted / dailyGoal) * 100);
    activityMap.set(date, existing);
  });

  return Array.from(activityMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
}
