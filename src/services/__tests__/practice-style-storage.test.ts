import { describe, expect, it, vi } from 'vitest';
import { clearPracticeStyle, invalidatePracticeStyle, readPracticeStyle, savePracticeStyle } from '../practice-style';
describe('owner-scoped Studio storage resets', () => {
  it('reads a later durable choice from another tab instead of an old successful-write cache', () => {
    savePracticeStyle('style-normal', { keycaps: 'outline' });
    localStorage.setItem('sparowtype.practice-style.v1:style-normal', JSON.stringify({ schemaVersion: 1, keycaps: 'flat' }));
    expect(readPracticeStyle('style-normal').keycaps).toBe('flat');
  });
  it('does not revive an undeleted font or theme when persistent removal fails', () => {
    savePracticeStyle('style-blocked', { keycaps: 'outline', ripple: true, font: 'AAAA' });
    const remove = vi.spyOn(localStorage, 'removeItem').mockImplementation(() => { throw new Error('Blocked storage'); });
    try {
      expect(() => clearPracticeStyle('style-blocked')).toThrow('Persistent removal');
      expect(readPracticeStyle('style-blocked')).toEqual({ schemaVersion: 1 });
      expect(localStorage.getItem('sparowtype.practice-style.v1:style-blocked')).toContain('AAAA');
    } finally { remove.mockRestore(); clearPracticeStyle('style-blocked'); }
  });
  it('retains a failed write for this visit and yields to an explicit external invalidation', () => {
    savePracticeStyle('style-temporary', { keycaps: 'flat' });
    const set = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Full storage'); });
    try { expect(savePracticeStyle('style-temporary', { keycaps: 'outline' })).toBe(false); expect(readPracticeStyle('style-temporary').keycaps).toBe('outline'); }
    finally { set.mockRestore(); }
    invalidatePracticeStyle('style-temporary');
    expect(readPracticeStyle('style-temporary').keycaps).toBe('flat');
    expect(readPracticeStyle('different-style-owner')).toEqual({ schemaVersion: 1 });
  });
});
