import type { Badge } from './types';
export const COSMETICS = [
  { id: 'theme-aurora', label: 'Aurora palette', price: 100, category: 'theme', color: '#8bdfc6' },
  { id: 'theme-rose', label: 'Rose palette', price: 100, category: 'theme', color: '#f4a3b9' },
  { id: 'keycap-outline', label: 'Outline keycaps', price: 75, category: 'keycap', color: '#b8c8ff' },
  { id: 'caret-beam', label: 'Beam caret', price: 60, category: 'caret', color: '#f5c56b' },
  { id: 'frame-orbit', label: 'Orbit profile frame', price: 125, category: 'frame', color: '#bdabff' },
  { id: 'banner-dawn', label: 'Dawn profile banner', price: 150, category: 'banner', color: '#ffb98c' },
] as const;
export const FREEZE_PRICE = 75;
export const TITLE_THRESHOLDS: Array<[number, string]> = [[1, 'Hunter'], [5, 'Pecker'], [10, 'Apprentice'], [20, 'Typist'], [30, 'Touch Typist'], [40, 'Fluent'], [55, 'Sonic'], [70, 'Thunder'], [85, 'Comet'], [100, 'Star'], [125, 'Galactic'], [150, 'Legendary'], [200, 'Mythic']];
export function xpForLevel(level: number): number { if (!Number.isInteger(level) || level < 1 || level > 100000) throw new Error('Invalid progression level'); return Math.floor(100 * level ** 1.35); }
export function levelThreshold(level: number): number { if (!Number.isInteger(level) || level < 1 || level > 100000) throw new Error('Invalid progression level'); return level === 1 ? 0 : xpForLevel(level - 1); }
export function levelForXp(xp: number): number { if (!Number.isSafeInteger(xp) || xp < 0) throw new Error('Invalid XP'); let level = Math.min(100000, Math.floor((xp / 100) ** (1 / 1.35)) + 1); while (level < 100000 && levelThreshold(level + 1) <= xp) level++; while (level > 1 && levelThreshold(level) > xp) level--; return level; }
export function titleForLevel(level: number): string { return [...TITLE_THRESHOLDS].reverse().find(([threshold]) => level >= threshold)?.[1] ?? 'Hunter'; }
export function badgeCatalog(): Badge[] { return [
  { id: 'characters-bronze', title: 'First thousand', tier: 'bronze', instruction: 'Complete 1,000 correctly committed characters.', earnedBy: null },
  { id: 'characters-silver', title: 'Steady hands', tier: 'silver', instruction: 'Complete 10,000 correctly committed characters.', earnedBy: null },
  { id: 'characters-gold', title: 'Built by practice', tier: 'gold', instruction: 'Complete 100,000 correctly committed characters.', earnedBy: null },
  { id: 'accuracy-bronze', title: 'Careful start', tier: 'bronze', instruction: 'Complete 100 characters with at least 98% input accuracy in one session.', earnedBy: null },
  { id: 'streak-silver', title: 'A week of practice', tier: 'silver', instruction: 'Practice on seven consecutive calendar days.', earnedBy: null },
  { id: 'streak-gold', title: 'A month of practice', tier: 'gold', instruction: 'Reach a 30-day practice streak.', earnedBy: null },
]; }
