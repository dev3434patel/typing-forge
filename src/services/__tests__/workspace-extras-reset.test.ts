import { describe, expect, it, vi } from 'vitest';
import { clearWorkspaceExtras } from '../workspace-extras';
import { getLearningSessions, LEARNING_VERSION, recordLearningSession, resetKeybrProgress } from '@/lib/keybr-engine';

const clears = vi.hoisted(() => ({ arcade: vi.fn(), progression: vi.fn(), studio: vi.fn(), classroom: vi.fn(), reminders: vi.fn(), season: vi.fn() }));
vi.mock('@/games/engine/records', () => ({ arcadeData: { clear: clears.arcade } }));
vi.mock('../progression-storage', () => ({ clearProgression: clears.progression }));
vi.mock('../practice-style', () => ({ clearPracticeStyle: clears.studio }));
vi.mock('@/domain/classroom/local-adapter', () => ({ clearLocalClassrooms: clears.classroom }));
vi.mock('../reminders', () => ({ clearReminders: clears.reminders }));
vi.mock('../season-customization', () => ({ clearSeasonBanners: clears.season }));

describe('workspace learning reset acknowledgement', () => {
  it('reports failed learning deletion while still attempting every independent data store', async () => {
    const owner = 'extras-reset-owner';
    recordLearningSession({
      learningVersion: LEARNING_VERSION, sessionId: 'existing-learning', completedAt: '2026-10-21T00:00:00.000Z',
      elapsedMs: 1000, dimensions: { language: 'en', layout: 'qwerty', domain: 'prose', inputMethod: 'keyboard' },
      attempts: [], assessment: false, targetWpm: 35,
    }, owner);
    const key = `typingforge:v3:${owner}:learning`;
    const previous = localStorage.getItem(key);
    const remove = localStorage.removeItem.bind(localStorage);
    const blocked = vi.spyOn(localStorage, 'removeItem').mockImplementation(item => {
      if (item === key) throw new Error('Storage refused deletion');
      remove(item);
    });
    try {
      await expect(clearWorkspaceExtras(owner)).rejects.toThrow(/1 device data stores.*Learning progress.*persistent deletion/);
      expect(getLearningSessions({ owner })).toEqual([]);
      expect(localStorage.getItem(key)).toBe(previous);
      for (const clear of Object.values(clears)) expect(clear).toHaveBeenCalledOnce();
      for (const clear of Object.values(clears)) expect(clear).toHaveBeenCalledWith(owner);
    } finally { blocked.mockRestore(); resetKeybrProgress(owner); }
  });
});
