import type { SessionResult } from '@/lib/typing-core';

export const ARCADE_VERSION = 'sparow-arcade-v1' as const;
export type GameId = 'word-invaders' | 'ghost-gp' | 'daily-gauntlet' | 'rhythm-typing' | 'key-tower' | 'snake-words' | 'lava-rise' | 'boss-duel';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Variant = 'mission' | 'endless';
export type EntityKind = 'word' | 'runner' | 'tank' | 'splitter' | 'phantom' | 'boss';
export interface GameDefinition { id: GameId; name: string; subtitle: string; accent: string; instructions: readonly [string, string, string]; motif: readonly [number, number, number] }
export interface GameOptions {
  gameId: GameId; difficulty: Difficulty; variant: Variant; seed: string; owner: string;
  sessionId: string; medianWpm?: number; focusMode?: boolean; mobile?: boolean;
  averageAccuracy?: number;
  ghost?: SessionResult; dailyText?: string; now: () => number; wallNow: () => number;
  keyboardLayout?: string;
}
export interface Entity { id: number; active: boolean; word: string; x: number; y: number; speed: number; lane: number; kind: EntityKind; phase: number; spawnedAt: number; beatAt: number }
export interface GameEvent { sequence: number; offsetMs: number; type: 'lock' | 'complete-word' | 'unlock' | 'damage' | 'powerup' | 'upgrade' | 'pause' | 'resume' | 'finish'; entityId?: number; value?: string | number }
export interface GameEvidence {
  version: typeof ARCADE_VERSION; gameId: GameId; difficulty: Difficulty; variant: Variant; seed: string;
  session: SessionResult; gameEvents: readonly GameEvent[]; score: number; completedWords: number;
  outcome: string; verification: 'local-unverified';
}
export type Powerup = 'slow' | 'bomb' | 'shield';
export interface ArcadeView {
  phase: 'ready' | 'playing' | 'paused' | 'finished'; clockStarted: boolean; elapsedMs: number; words: number; score: number;
  hull: number; wave: number; combo: number; currentWord: string; draft: string; actualKey: string;
  incorrectKey: boolean; accuracy: number | null; wpm: number | null; notice: string; outcome: string;
  entities: readonly Entity[]; lockedId: number | null; beatPhase: number; rhythmCombo: number;
  scrap: number; towers: readonly number[]; lava: number; platforms: number;
  snake: readonly { x: number; y: number }[]; direction: string; bossProgress: number;
  playerProgress: number; ghostProgress: number | null; bots: readonly { name: string; progress: number }[];
  powerups: Readonly<Record<Powerup, number>>; focusSuggested: boolean; evidence: GameEvidence | null;
}
