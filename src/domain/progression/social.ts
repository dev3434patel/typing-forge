import type { SessionConfig } from '@/lib/typing-core/types';
import { issuedChallengeWindow } from '@/lib/challenge-timing';
export const REPORT_REASONS = ['spam', 'harassment', 'cheating', 'other'] as const;
export type ReportReason = typeof REPORT_REASONS[number];
export interface Friend { id: string; handle: string; activeRecently: boolean }
export interface FriendRequest { id: string; handle: string; direction: 'incoming' | 'outgoing' }
export interface DuelScore { userId: string; handle: string; wpm: number; accuracy: number; sourceSessionId: string }
export interface AsyncDuel { id: string; creatorId: string; opponentId: string; otherHandle: string; state: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'expired'; expiresAt: string; ownSubmitted: boolean; scores: DuelScore[]; winnerId: string | null }
export interface DuelChallenge { id: string; user_id: string; configuration: Partial<SessionConfig>; target_text: string; starts_at: string; deadline_at: string; expires_at: string; server_now: string }
export function validHandle(handle: string): boolean { return /^[a-z][a-z0-9_]{2,23}$/.test(handle); }
export function compareDuelScores(scores: DuelScore[]): string | null {
  if (scores.length !== 2 || scores[0].userId === scores[1].userId) throw new Error('A duel requires exactly two distinct accepted scores');
  for (const score of scores) if (!Number.isFinite(score.wpm) || score.wpm < 0 || !Number.isFinite(score.accuracy) || score.accuracy < 0 || score.accuracy > 100 || !score.sourceSessionId) throw new Error('A duel requires server-replayed score evidence');
  const difference = scores[0].wpm - scores[1].wpm || scores[0].accuracy - scores[1].accuracy;
  return difference === 0 ? null : difference > 0 ? scores[0].userId : scores[1].userId;
}
export function duelSessionConfiguration(challenge: DuelChallenge, ownerId: string, sessionId: string): SessionConfig {
  const config = challenge.configuration;
  if (challenge.user_id !== ownerId || config.mode !== 'time' || config.durationMs !== 30000 || config.inputMethod !== 'keyboard' || config.correctionPolicy !== 'current-word' || config.language !== 'en' || config.keyboardLayout !== 'qwerty' || config.scoringPolicy !== 'prose' || !['forge-social-duel-en-v1','forge-social-duel-en-v2'].includes(config.contentRevision ?? '') || !challenge.target_text) throw new Error('The duel challenge did not match the strict issued contract');
  issuedChallengeWindow(challenge);
  return { ...config, clientSessionId: sessionId, ownerScope: ownerId, mode: 'time', initialTarget: challenge.target_text, challengeId: challenge.id, privacy: 'public-corpus' };
}
