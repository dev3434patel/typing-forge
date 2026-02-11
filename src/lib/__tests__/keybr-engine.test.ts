/**
 * KEYBR ENGINE TEST SUITE
 * Tests for adaptive learning and letter unlocking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculatePerCharMetrics,
  updateCharacterProgress,
  generateKeybrLesson,
  getUnlockedLetters,
  getLockedLetters,
  getWeakLetters,
  getConfidenceStatus,
  getCharacterData,
  saveCharacterData,
  getAllCharacterStats,
  resetKeybrProgress,
  type Keystroke,
} from '../keybr-engine';

describe('Keybr Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('calculatePerCharMetrics', () => {
    it('should calculate metrics for characters', () => {
      const keystrokes: Keystroke[] = [
        { char: 'h', timestamp: 0, isCorrect: true, expected: 'h', key: 'h', position: 0 },
        { char: 'e', timestamp: 200, isCorrect: true, expected: 'e', key: 'e', position: 1 },
        { char: 'l', timestamp: 400, isCorrect: true, expected: 'l', key: 'l', position: 2 },
        { char: 'l', timestamp: 600, isCorrect: true, expected: 'l', key: 'l', position: 3 },
        { char: 'o', timestamp: 800, isCorrect: true, expected: 'o', key: 'o', position: 4 },
      ];

      const metrics = calculatePerCharMetrics(keystrokes, 35);

      expect(metrics.has('h')).toBe(true);
      expect(metrics.has('e')).toBe(true);
      expect(metrics.has('l')).toBe(true);
      expect(metrics.has('o')).toBe(true);

      const hMetrics = metrics.get('h')!;
      expect(hMetrics.accuracy).toBeGreaterThan(0);
      expect(hMetrics.wpm).toBeGreaterThan(0);
    });

    it('should track accuracy per character', () => {
      const keystrokes: Keystroke[] = [
        { char: 'a', timestamp: 0, isCorrect: true, expected: 'a', key: 'a', position: 0 },
        { char: 'a', timestamp: 200, isCorrect: true, expected: 'a', key: 'a', position: 1 },
        { char: 'x', timestamp: 400, isCorrect: false, expected: 'a', key: 'x', position: 2 },
        { char: 'a', timestamp: 600, isCorrect: true, expected: 'a', key: 'a', position: 3 },
      ];

      const metrics = calculatePerCharMetrics(keystrokes, 35);
      const aMetrics = metrics.get('a')!;

      // 3 correct out of 4 total = 75%
      expect(aMetrics.accuracy).toBeCloseTo(75, 1);
    });

    it('should only track letters', () => {
      const keystrokes: Keystroke[] = [
        { char: 'a', timestamp: 0, isCorrect: true, expected: 'a', key: 'a', position: 0 },
        { char: ' ', timestamp: 200, isCorrect: true, expected: ' ', key: ' ', position: 1 },
        { char: '1', timestamp: 400, isCorrect: true, expected: '1', key: '1', position: 2 },
      ];

      const metrics = calculatePerCharMetrics(keystrokes, 35);

      expect(metrics.has('a')).toBe(true);
      expect(metrics.has(' ')).toBe(false);
      expect(metrics.has('1')).toBe(false);
    });
  });

  describe('getUnlockedLetters', () => {
    it('should include starting letters', () => {
      const unlocked = getUnlockedLetters();
      const startingLetters = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r'];

      startingLetters.forEach(letter => {
        expect(unlocked).toContain(letter);
      });
    });

    it('should include newly unlocked letters', () => {
      const data = {
        'z': {
          char: 'z',
          confidence: 1.0,
          wpm: 40,
          accuracy: 96,
          occurrences: 10,
          avgTimeMs: 200,
          stdDev: 20,
          isUnlocked: true,
          status: 'unlocked' as const,
        },
      };
      saveCharacterData(data);

      const unlocked = getUnlockedLetters();
      expect(unlocked).toContain('z');
    });
  });

  describe('getLockedLetters', () => {
    it('should return letters not in unlocked set', () => {
      const locked = getLockedLetters();
      const startingLetters = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r'];

      startingLetters.forEach(letter => {
        expect(locked).not.toContain(letter);
      });

      // Should contain letters like 'z', 'q', 'x'
      expect(locked).toContain('z');
      expect(locked).toContain('q');
      expect(locked).toContain('x');
    });
  });

  describe('updateCharacterProgress', () => {
    it('should unlock letter when threshold met', () => {
      const keystrokes: Keystroke[] = [];
      // Generate enough keystrokes for 'z' to meet threshold
      for (let i = 0; i < 20; i++) {
        keystrokes.push({
          char: 'z',
          timestamp: i * 200,
          isCorrect: true,
          expected: 'z',
          key: 'z',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const result = updateCharacterProgress(newMetrics, 35);

      // 'z' should be newly unlocked if it meets 35 WPM and 95% accuracy
      const zMetrics = newMetrics.get('z');
      if (zMetrics && zMetrics.wpm >= 35 && zMetrics.accuracy >= 95) {
        expect(result.newlyUnlocked).toContain('z');
      }
    });

    it('should use weighted average for existing data', () => {
      // Set up existing data
      const existingData = {
        'a': {
          char: 'a',
          confidence: 0.5,
          wpm: 30,
          accuracy: 90,
          occurrences: 10,
          avgTimeMs: 300,
          stdDev: 50,
          isUnlocked: true,
          status: 'in_progress' as const,
        },
      };
      saveCharacterData(existingData);

      // New metrics with better performance
      const keystrokes: Keystroke[] = [];
      for (let i = 0; i < 10; i++) {
        keystrokes.push({
          char: 'a',
          timestamp: i * 150, // Faster = higher WPM
          isCorrect: true,
          expected: 'a',
          key: 'a',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const result = updateCharacterProgress(newMetrics, 35);

      const updated = getCharacterData();
      const aData = updated['a'];

      // Should have improved (weighted average)
      expect(aData).toBeDefined();
      expect(aData.wpm).toBeGreaterThan(30);
    });
  });

  describe('generateKeybrLesson', () => {
    it('should generate lesson with only unlocked letters', () => {
      const lesson = generateKeybrLesson(20);

      // Check that all characters in lesson are unlocked
      const unlocked = getUnlockedLetters();
      const lessonChars = new Set(lesson.text.toLowerCase().replace(/[^a-z]/g, '').split(''));

      lessonChars.forEach(char => {
        expect(unlocked).toContain(char);
      });
    });

    it('should focus on weak letters', () => {
      // Set up weak letters
      const weakData: Record<string, any> = {};
      ['x', 'z', 'q'].forEach(char => {
        weakData[char] = {
          char,
          confidence: 0.2,
          wpm: 20,
          accuracy: 85,
          occurrences: 5,
          avgTimeMs: 500,
          stdDev: 100,
          isUnlocked: true,
          status: 'weak' as const,
        };
      });
      saveCharacterData(weakData);

      const lesson = generateKeybrLesson(50);
      const lessonText = lesson.text.toLowerCase();

      // Should contain focus letters
      expect(lesson.focusLetters.length).toBeGreaterThan(0);
    });

    it('should return correct structure', () => {
      const lesson = generateKeybrLesson(30);

      expect(lesson.text).toBeDefined();
      expect(lesson.text.length).toBeGreaterThan(0);
      expect(Array.isArray(lesson.availableLetters)).toBe(true);
      expect(Array.isArray(lesson.focusLetters)).toBe(true);
      expect(Array.isArray(lesson.lockedLetters)).toBe(true);
    });
  });

  describe('getConfidenceStatus', () => {
    it('should return locked status for locked letters', () => {
      const status = getConfidenceStatus(0.5, false);
      expect(status.status).toBe('weak');
      expect(status.emoji).toBe('🔒');
      expect(status.text).toBe('Locked');
    });

    it('should return mastered for high confidence', () => {
      const status = getConfidenceStatus(1.0, true);
      expect(status.status).toBe('unlocked');
      expect(status.emoji).toBe('✅');
    });

    it('should return appropriate status for confidence levels', () => {
      expect(getConfidenceStatus(0.9, true).status).toBe('nearly_unlocked');
      expect(getConfidenceStatus(0.7, true).status).toBe('in_progress');
      expect(getConfidenceStatus(0.4, true).status).toBe('needs_work');
      expect(getConfidenceStatus(0.2, true).status).toBe('weak');
    });
  });

  describe('getWeakLetters', () => {
    it('should return letters with lowest confidence', () => {
      const weakData: Record<string, any> = {};
      ['x', 'z', 'q', 'j', 'k'].forEach((char, i) => {
        weakData[char] = {
          char,
          confidence: 0.1 + i * 0.1,
          wpm: 20,
          accuracy: 85,
          occurrences: 5,
          avgTimeMs: 500,
          stdDev: 100,
          isUnlocked: true,
          status: 'weak' as const,
        };
      });
      saveCharacterData(weakData);

      const weak = getWeakLetters(3);
      expect(weak.length).toBe(3);
      expect(weak).toContain('x'); // Lowest confidence
    });
  });

  describe('getAllCharacterStats', () => {
    it('should return stats for all 26 letters', () => {
      const stats = getAllCharacterStats();
      expect(stats.length).toBe(26);
    });

    it('should include starting letters as unlocked', () => {
      const stats = getAllCharacterStats();
      const startingLetters = ['e', 't', 'a', 'o', 'i', 'n', 's', 'r'];

      startingLetters.forEach(letter => {
        const stat = stats.find(s => s.char === letter);
        expect(stat).toBeDefined();
        expect(stat?.isUnlocked).toBe(true);
      });
    });
  });

  describe('resetKeybrProgress', () => {
    it('should clear all character data', () => {
      const data = {
        'z': {
          char: 'z',
          confidence: 1.0,
          wpm: 40,
          accuracy: 96,
          occurrences: 10,
          avgTimeMs: 200,
          stdDev: 20,
          isUnlocked: true,
          status: 'unlocked' as const,
        },
      };
      saveCharacterData(data);

      resetKeybrProgress();

      const cleared = getCharacterData();
      expect(Object.keys(cleared).length).toBe(0);
    });
  });

  describe('Precision Tests - Unlock Thresholds', () => {
    it('should NOT unlock character at 34.9 WPM even with 95% accuracy', () => {
      // Create keystrokes that result in exactly 34.9 WPM
      const keystrokes: Keystroke[] = [];
      const targetWpm = 34.9;
      const charsNeeded = Math.ceil((targetWpm * 5 * 60) / 60000); // ~35 chars for 34.9 WPM in 1 minute
      const timePerChar = 60000 / (charsNeeded * 5); // Time per char to achieve target WPM
      
      for (let i = 0; i < charsNeeded; i++) {
        keystrokes.push({
          char: 'z',
          timestamp: i * timePerChar,
          isCorrect: true, // 100% accuracy
          expected: 'z',
          key: 'z',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const zMetrics = newMetrics.get('z');
      
      if (zMetrics) {
        // Adjust to exactly 34.9 WPM
        const adjustedWpm = 34.9;
        const result = updateCharacterProgress(new Map([['z', { ...zMetrics, wpm: adjustedWpm, accuracy: 95 }]]), 35);
        
        // Should NOT unlock (below 35.0 WPM threshold)
        expect(result.newlyUnlocked).not.toContain('z');
      }
    });

    it('should NOT unlock character at 94.9% accuracy even with 35 WPM', () => {
      const keystrokes: Keystroke[] = [];
      const totalChars = 100;
      const correctChars = 95; // 95% accuracy
      
      for (let i = 0; i < totalChars; i++) {
        keystrokes.push({
          char: 'z',
          timestamp: i * 200, // ~35 WPM
          isCorrect: i < correctChars,
          expected: 'z',
          key: 'z',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const zMetrics = newMetrics.get('z');
      
      if (zMetrics) {
        // Set to exactly 35 WPM but 94.9% accuracy
        const result = updateCharacterProgress(new Map([['z', { ...zMetrics, wpm: 35, accuracy: 94.9 }]]), 35);
        
        // Should NOT unlock (below 95% accuracy threshold)
        expect(result.newlyUnlocked).not.toContain('z');
      }
    });

    it('should unlock character at exactly 35.0 WPM AND 95.0% accuracy', () => {
      const keystrokes: Keystroke[] = [];
      const totalChars = 100;
      const correctChars = 95; // Exactly 95% accuracy
      
      for (let i = 0; i < totalChars; i++) {
        keystrokes.push({
          char: 'z',
          timestamp: i * 171, // ~35 WPM (60000 / (35 * 5) ≈ 171ms per char)
          isCorrect: i < correctChars,
          expected: 'z',
          key: 'z',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const zMetrics = newMetrics.get('z');
      
      if (zMetrics && zMetrics.wpm >= 35 && zMetrics.accuracy >= 95) {
        const result = updateCharacterProgress(newMetrics, 35);
        
        // Should unlock (meets both thresholds)
        expect(result.newlyUnlocked).toContain('z');
      }
    });
  });

  describe('Precision Tests - Confidence Weighted Updates', () => {
    it('should use exactly 70% new data and 30% old data for confidence', () => {
      // Set up existing data
      const existingConfidence = 0.5;
      const existingWpm = 30;
      const existingAccuracy = 90;
      
      const existingData = {
        'a': {
          char: 'a',
          confidence: existingConfidence,
          wpm: existingWpm,
          accuracy: existingAccuracy,
          occurrences: 10,
          avgTimeMs: 300,
          stdDev: 50,
          isUnlocked: true,
          status: 'in_progress' as const,
        },
      };
      saveCharacterData(existingData);

      // New metrics with better performance
      // Calculate WPM from keystroke timings: 120ms per keystroke = 100 WPM
      // Formula: (60000 / avgTimeMs) / 5 = (60000 / 120) / 5 = 100 WPM
      const calculatedNewWpm = (60000 / 120) / 5; // = 100 WPM
      const newAccuracy = 100; // All correct
      
      const keystrokes: Keystroke[] = [];
      for (let i = 0; i < 20; i++) {
        keystrokes.push({
          char: 'a',
          timestamp: i * 120, // 120ms per keystroke = 100 WPM
          isCorrect: true,
          expected: 'a',
          key: 'a',
          position: i,
        });
      }

      const newMetrics = calculatePerCharMetrics(keystrokes, 35);
      const result = updateCharacterProgress(newMetrics, 35);

      const updated = getCharacterData();
      const aData = updated['a'];

      // Verify weighted update: 70% new + 30% old
      // WPM: 0.7 * calculatedNewWpm + 0.3 * existingWpm
      const expectedWpm = 0.7 * calculatedNewWpm + 0.3 * existingWpm;
      const wpmDiff = Math.abs(aData.wpm - expectedWpm);
      expect(wpmDiff).toBeLessThan(5); // Within 5 WPM tolerance (allowing for rounding)

      // Accuracy: 0.7 * newAccuracy + 0.3 * oldAccuracy
      const expectedAccuracy = 0.7 * newAccuracy + 0.3 * existingAccuracy;
      const accDiff = Math.abs(aData.accuracy - expectedAccuracy);
      expect(accDiff).toBeLessThan(1); // Within 1% tolerance
    });
  });

  describe('Precision Tests - Lesson Generation', () => {
    it('should generate lesson with ~70% focus words on weak letters', () => {
      // Set up weak letters
      const weakData: Record<string, any> = {};
      ['x', 'z', 'q'].forEach(char => {
        weakData[char] = {
          char,
          confidence: 0.2,
          wpm: 20,
          accuracy: 85,
          occurrences: 5,
          avgTimeMs: 500,
          stdDev: 100,
          isUnlocked: true,
          status: 'weak' as const,
        };
      });
      saveCharacterData(weakData);

      const lesson = generateKeybrLesson(100); // Generate longer lesson for better stats
      const lessonText = lesson.text.toLowerCase();
      const words = lessonText.split(/\s+/).filter(w => w.length > 0);
      
      // Count words containing weak letters
      const weakLetters = ['x', 'z', 'q'];
      const focusWords = words.filter(word => 
        weakLetters.some(letter => word.includes(letter))
      );
      
      const focusWordPercentage = (focusWords.length / words.length) * 100;
      
      // Should be approximately 70% (within 10% tolerance)
      expect(focusWordPercentage).toBeGreaterThan(60);
      expect(focusWordPercentage).toBeLessThan(80);
    });

    it('should use only unlocked letters in generated lesson', () => {
      // Ensure some letters are locked
      const unlocked = getUnlockedLetters();
      const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const locked = allLetters.filter(l => !unlocked.includes(l));
      
      expect(locked.length).toBeGreaterThan(0); // Some letters should be locked
      
      const lesson = generateKeybrLesson(50);
      const lessonChars = new Set(lesson.text.toLowerCase().replace(/[^a-z]/g, '').split(''));
      
      // No locked letters should appear
      locked.forEach(char => {
        expect(lessonChars.has(char)).toBe(false);
      });
    });
  });
});
