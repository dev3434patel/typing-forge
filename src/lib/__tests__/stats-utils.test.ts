/**
 * STATS UTILS TEST SUITE
 * Tests for statistics calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAggregateStats,
  filterByTimePeriod,
  calculateAccuracyStreaks,
  generateSpeedDistribution,
  calculatePercentile,
  prepareLessonData,
  generateCalendarActivities,
  type TestSession,
} from '../stats-utils';

describe('Stats Utils', () => {
  const createTestSession = (
    wpm: number,
    accuracy: number,
    consistency: number,
    date: Date,
    mode: string = 'time'
  ): TestSession => ({
    id: crypto.randomUUID(),
    created_at: date.toISOString(),
    net_wpm: wpm,
    gross_wpm: wpm + 5,
    accuracy_percent: accuracy,
    consistency_percent: consistency,
    duration_seconds: 30,
    test_mode: mode,
    total_characters: wpm * 5,
    correct_characters: Math.round((wpm * 5 * accuracy) / 100),
    error_count: Math.round((wpm * 5 * (100 - accuracy)) / 100),
    per_char_metrics: null,
    wpm_history: [wpm - 5, wpm, wpm + 5],
  });

  describe('calculateAggregateStats', () => {
    it('should return zeros for empty sessions', () => {
      const stats = calculateAggregateStats([]);

      expect(stats.totalTime).toBe(0);
      expect(stats.lessonsCount).toBe(0);
      expect(stats.topSpeed).toBe(0);
      expect(stats.avgSpeed).toBe(0);
    });

    it('should calculate aggregate stats correctly', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 95, 85, new Date('2024-01-01')),
        createTestSession(60, 98, 90, new Date('2024-01-02')),
        createTestSession(70, 99, 95, new Date('2024-01-03')),
      ];

      const stats = calculateAggregateStats(sessions);

      expect(stats.lessonsCount).toBe(3);
      expect(stats.topSpeed).toBe(70);
      expect(stats.avgSpeed).toBe(60);
      expect(stats.topAccuracy).toBe(99);
      expect(stats.avgAccuracy).toBeCloseTo(97.33, 1);
      expect(stats.totalTime).toBe(90); // 3 * 30 seconds
    });

    it('should sanitize NaN/Infinity values', () => {
      const sessions: TestSession[] = [
        {
          ...createTestSession(50, 95, 85, new Date()),
          net_wpm: null,
          accuracy_percent: null,
        },
      ];

      const stats = calculateAggregateStats(sessions);

      expect(isFinite(stats.avgSpeed)).toBe(true);
      expect(isFinite(stats.avgAccuracy)).toBe(true);
    });
  });

  describe('filterByTimePeriod', () => {
    // Use current date to ensure tests work regardless of when they run
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const sessions: TestSession[] = [
      createTestSession(50, 95, 85, fourteenDaysAgo), // 14 days ago
      createTestSession(60, 98, 90, sevenDaysAgo), // 7 days ago
      createTestSession(70, 99, 95, oneDayAgo), // 1 day ago
      createTestSession(80, 100, 100, now), // today
    ];

    it('should return all sessions for "all" period', () => {
      const filtered = filterByTimePeriod(sessions, 'all');
      expect(filtered.length).toBe(4);
    });

    it('should filter by week', () => {
      const filtered = filterByTimePeriod(sessions, 'week');
      // Should include sessions from last 7 days (today + 1 day ago + 7 days ago)
      expect(filtered.length).toBeGreaterThanOrEqual(2);
      expect(filtered.length).toBeLessThanOrEqual(3);
    });

    it('should filter by month', () => {
      const filtered = filterByTimePeriod(sessions, 'month');
      // Should include all sessions from last 30 days
      expect(filtered.length).toBe(4);
    });

    it('should filter by today', () => {
      const filtered = filterByTimePeriod(sessions, 'today');
      // Should only include today's session
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateAccuracyStreaks', () => {
    it('should find accuracy streaks', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 100, 85, new Date('2024-01-01')),
        createTestSession(55, 100, 90, new Date('2024-01-02')),
        createTestSession(60, 100, 95, new Date('2024-01-03')),
        createTestSession(65, 98, 90, new Date('2024-01-04')),
        createTestSession(70, 95, 85, new Date('2024-01-05')),
      ];

      const streaks = calculateAccuracyStreaks(sessions);

      // Should find streak of 3 tests at 100%
      const streak100 = streaks.find(s => s.threshold === 100);
      expect(streak100).toBeDefined();
      expect(streak100?.count).toBeGreaterThanOrEqual(3);
    });

    it('should return empty for no streaks', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 85, 80, new Date()),
        createTestSession(55, 88, 82, new Date()),
      ];

      const streaks = calculateAccuracyStreaks(sessions);

      // No streaks at 90%+ threshold
      const streak90 = streaks.find(s => s.threshold === 90);
      expect(streak90).toBeUndefined();
    });

    it('should calculate avg WPM and accuracy for streaks', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 100, 85, new Date('2024-01-01')),
        createTestSession(60, 100, 90, new Date('2024-01-02')),
        createTestSession(70, 100, 95, new Date('2024-01-03')),
      ];

      const streaks = calculateAccuracyStreaks(sessions);
      const streak100 = streaks.find(s => s.threshold === 100);

      expect(streak100?.avgWpm).toBe(60);
      expect(streak100?.avgAccuracy).toBe(100);
    });
  });

  describe('generateSpeedDistribution', () => {
    it('should create speed buckets', () => {
      const sessions: TestSession[] = [
        createTestSession(15, 95, 85, new Date()), // 0-20
        createTestSession(35, 95, 85, new Date()), // 20-40
        createTestSession(55, 95, 85, new Date()), // 40-60
        createTestSession(75, 95, 85, new Date()), // 60-80
        createTestSession(95, 95, 85, new Date()), // 80-100
        createTestSession(110, 95, 85, new Date()), // 100-120
        createTestSession(130, 95, 85, new Date()), // 120+
      ];

      const distribution = generateSpeedDistribution(sessions);

      expect(distribution.length).toBe(7);
      expect(distribution[0].range).toBe('0-20');
      expect(distribution[0].count).toBe(1);
      expect(distribution[6].range).toBe('120+');
      expect(distribution[6].count).toBe(1);
    });

    it('should handle empty sessions', () => {
      const distribution = generateSpeedDistribution([]);

      expect(distribution.length).toBe(7);
      distribution.forEach(bucket => {
        expect(bucket.count).toBe(0);
      });
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const sessions: TestSession[] = [
        createTestSession(30, 95, 85, new Date()),
        createTestSession(40, 95, 85, new Date()),
        createTestSession(50, 95, 85, new Date()),
        createTestSession(60, 95, 85, new Date()),
        createTestSession(70, 95, 85, new Date()),
      ];

      // 50 WPM is median (50th percentile)
      const percentile = calculatePercentile(sessions, 50);
      expect(percentile).toBeGreaterThanOrEqual(40);
      expect(percentile).toBeLessThanOrEqual(60);
    });

    it('should return 0 for empty sessions', () => {
      const percentile = calculatePercentile([], 50);
      expect(percentile).toBe(0);
    });
  });

  describe('prepareLessonData', () => {
    it('should format data for charts', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 95, 85, new Date()),
        createTestSession(60, 98, 90, new Date()),
        createTestSession(70, 99, 95, new Date()),
      ];

      const lessonData = prepareLessonData(sessions);

      expect(lessonData.length).toBe(3);
      expect(lessonData[0].lesson).toBe(1);
      expect(lessonData[0].wpm).toBe(50);
      expect(lessonData[0].accuracy).toBe(95);
      expect(lessonData[2].lesson).toBe(3);
      expect(lessonData[2].wpm).toBe(70);
    });

    it('should sanitize values', () => {
      const sessions: TestSession[] = [
        {
          ...createTestSession(50, 95, 85, new Date()),
          net_wpm: null,
        },
      ];

      const lessonData = prepareLessonData(sessions);

      expect(isFinite(lessonData[0].wpm)).toBe(true);
    });
  });

  describe('generateCalendarActivities', () => {
    it('should generate calendar data', () => {
      const sessions: TestSession[] = [
        createTestSession(50, 95, 85, new Date('2024-01-01')),
        createTestSession(60, 98, 90, new Date('2024-01-01')), // Same day
        createTestSession(70, 99, 95, new Date('2024-01-02')),
      ];

      const activities = generateCalendarActivities(sessions, 10);

      expect(activities.length).toBe(2); // 2 unique dates
      const day1 = activities.find(a => a.date === '2024-01-01');
      expect(day1?.lessonsCompleted).toBe(2);
      expect(day1?.dailyGoalPercent).toBe(20); // 2/10 * 100
    });

    it('should cap daily goal at 100%', () => {
      const sessions: TestSession[] = [];
      for (let i = 0; i < 15; i++) {
        sessions.push(createTestSession(50, 95, 85, new Date('2024-01-01')));
      }

      const activities = generateCalendarActivities(sessions, 10);
      const day1 = activities.find(a => a.date === '2024-01-01');

      expect(day1?.dailyGoalPercent).toBe(100); // Capped at 100%
    });

    it('should handle empty sessions', () => {
      const activities = generateCalendarActivities([], 10);
      expect(activities.length).toBe(0);
    });
  });
});
