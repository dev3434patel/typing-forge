import type { SkillMap } from '@/domain/progression/types';

/** Uses only a caller-selected owner/layout/language/method/domain skill map. */
export function trainingProblemFocus(skills: SkillMap, limit = 5): string[] {
  return [...Object.entries(skills.keys), ...Object.entries(skills.bigrams)]
    .filter(([key, value]) => /^[a-z0-9.,;:!?()[\]{}+=_'-]{1,2}$/i.test(key) && value.n >= 20 && value.accuracy < .92)
    .sort(([a, x], [b, y]) => x.accuracy - y.accuracy || y.n - x.n || a.localeCompare(b))
    .slice(0, Math.max(0, Math.min(5, Math.floor(limit))))
    .map(([key]) => key);
}
