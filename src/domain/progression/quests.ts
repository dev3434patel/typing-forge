import { addDays, dayNumber, weekKey } from './calendar';
import { problemKeys } from './skills';
import type { ActivityFact, Quest, SkillMap } from './types';
export function seededHash(text: string): number {
  let hash = 2166136261;
  for (const character of text) { const code = character.codePointAt(0)!; const bytes = code < 128 ? [code] : code < 2048 ? [192 | code >> 6, 128 | code & 63] : code < 65536 ? [224 | code >> 12, 128 | code >> 6 & 63, 128 | code & 63] : [240 | code >> 18, 128 | code >> 12 & 63, 128 | code >> 6 & 63, 128 | code & 63]; for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0; }
  return hash;
}
export function dailyQuests(owner: string, date: string, skills: SkillMap, rerolled = false, scope: string | null = null): Quest[] {
  dayNumber(date);
  const weak = problemKeys(skills)[0] ?? null;
  const templates: Quest['template'][] = weak ? ['accuracy', 'lesson', 'game', 'pb30', 'weak-key', 'weak-key'] : ['accuracy', 'lesson', 'game', 'pb30'];
  const chosen: Quest['template'][] = [];
  let seed = seededHash(`${owner}:${date}:${Number(rerolled)}`);
  while (chosen.length < 3) { const index = seed % templates.length; const template = templates[index]; if (!chosen.includes(template)) chosen.push(template); templates.splice(index, 1); seed = Math.imul(seed ^ 0x9e3779b9, 1664525) >>> 0; }
  return chosen.map(template => ({ id: `daily:${date}:${template}:${Number(rerolled)}`, template, date, goal: template === 'accuracy' ? 300 : template === 'weak-key' ? 50 : 1, progress: 0, reward: 25, targetKey: template === 'weak-key' ? weak : null, targetScope: template === 'weak-key' ? scope : null, completedBy: null }));
}
export function weeklyQuest(date: string): Quest { const week = weekKey(date); return { id: `weekly:${week}`, template: 'weekly', date: week, goal: 5, progress: 0, reward: 75, targetKey: null, targetScope: null, completedBy: null }; }
export function advanceQuest(quest: Quest, fact: ActivityFact): void {
  if (quest.completedBy) return;
  const accuracy = fact.attempts ? fact.correctAttempts / fact.attempts * 100 : 0;
  const addition = quest.template === 'accuracy' ? accuracy >= 96 ? fact.completedChars : 0
    : quest.template === 'lesson' ? Number(fact.lessonQualified)
    : quest.template === 'game' ? Number(fact.kind === 'game' && fact.completedChars > 0)
    : quest.template === 'pb30' ? Number(fact.personalBest30)
    : quest.template === 'weak-key' ? quest.targetScope !== (fact.skillScope ?? 'en|qwerty|keyboard|prose') ? 0 : fact.skills.filter(sample => sample.group === 'keys' && sample.key === quest.targetKey).reduce((sum, sample) => sum + sample.correct, 0)
    : Number(fact.completedChars > 0);
  quest.progress = Math.min(quest.goal, quest.progress + addition);
  if (quest.progress >= quest.goal) quest.completedBy = fact.id;
}
export function questPeriod(quest: Quest, date: string): boolean { return quest.template === 'weekly' ? date >= quest.date && date < addDays(quest.date, 7) : date === quest.date; }
