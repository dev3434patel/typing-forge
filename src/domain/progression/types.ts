/** Derived receipts retain no passage or raw keystroke stream. Never mix trust scopes. */
export const PROGRESSION_VERSION = 1 as const;
export type Verification = 'local' | 'server-verified';
export type ActivityKind = 'practice' | 'lesson' | 'game' | 'race';
export interface SkillStatistic { n: number; correct: number; accuracy: number; speedMs: number | null; latencyMs: number | null }
export interface SkillMap { keys: Record<string, SkillStatistic>; fingers: Record<string, SkillStatistic>; bigrams: Record<string, SkillStatistic>; trigrams: Record<string, SkillStatistic> }
export interface SkillObservation { key: string; finger: string | null; correct: boolean; latencyMs: number | null; bigram?: string; trigram?: string; bigramCorrect?: boolean; trigramCorrect?: boolean }
export interface SkillContribution { group: keyof SkillMap; key: string; n: number; correct: number; timingN: number; ewma: number | null; weighted: number; lastLatency: number | null }
export interface ActivityFact {
  version: 1; id: string; ownerId: string; verification: Verification; payloadHash: string;
  at: number; startedAt?: number; timeZone: string; kind: ActivityKind; completedChars: number; attempts: number; correctAttempts: number;
  lessonQualified: boolean; raceWin: boolean; personalBest30: boolean; skills: SkillContribution[]; skillScope?: string;
}
export interface Freeze { id: string; source: 'quest' | 'purchase'; earnedDate: string; expiresDate: string }
export interface Streak { count: number; longest: number; lastDate: string | null; lastAt: number | null; zone: string | null; life: string | null; repaired: boolean; brokenAt: number | null; previousCount: number; freezes: Freeze[]; autoFreeze: boolean }
export interface KeysEntry { id: string; at: number; delta: number; reason: string; sourceId: string }
export interface Quest { id: string; template: 'accuracy' | 'lesson' | 'game' | 'pb30' | 'weak-key' | 'weekly'; date: string; goal: number; progress: number; reward: number; targetKey: string | null; targetScope: string | null; completedBy: string | null }
export interface Badge { id: string; title: string; tier: 'bronze' | 'silver' | 'gold'; instruction: string; earnedBy: string | null }
export interface Profile {
  version: 1; ownerId: string; verification: Verification; xp: number; level: number; title: string; completedChars: number;
  skills: SkillMap; skillMaps: Record<string, SkillMap>; skillScope: string | null; streak: Streak; quests: Quest[]; ledger: KeysEntry[]; keys: number; badges: Badge[];
  receipts: ActivityFact[]; commands: ProgressionCommand[]; cosmetics: string[]; equipped: string | null;
  weeklyXp: Record<string, number>; gameXp: Record<string, number>;
}
export type ProgressionCommand = { id: string; at: number; kind: 'reroll' | 'buy' | 'equip' | 'freeze-auto'; value?: string | boolean };
export interface ProgressionState { profile: Profile; storage: 'indexeddb' | 'localstorage' | 'memory' | 'account'; warning: string | null; pending: number }
export interface LeaguePeer { ownerId: string; handle: string; xp: number; lastActivity: number }
export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Diamond' | 'Champion' | 'Master';
export interface League { week: string; tier: LeagueTier; peers: LeaguePeer[]; rank: number | null; promotionPlaces: number; relegationPlaces: number; verified: boolean }
