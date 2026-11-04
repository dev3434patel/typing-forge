import type { SessionConfig, SessionResult } from '@/lib/typing-core';
export type ArenaEvidencePayload = Omit<SessionResult, 'characters' | 'timeSeries' | 'cursor'>;
/** The server reconstructs these presentation fields before canonical hashing.
 * Keep all source evidence and leave the full local/export result untouched.
 */
export function arenaEvidencePayload(candidate: SessionResult): ArenaEvidencePayload {
  const { characters: _characters, timeSeries: _timeSeries, cursor: _cursor, ...evidence } = candidate;
  return evidence;
}
export type ArenaStatus = 'waiting' | 'countdown' | 'active' | 'completed' | 'cancelled';
export type ArenaMemberStatus = 'joined' | 'racing' | 'finished' | 'forfeit' | 'quarantined';
export interface ArenaMember { id: string; handle: string; slot: number; ready: boolean; status: ArenaMemberStatus; progress: number; wpm: number | null; accuracy: number | null; placement: number | null; rematchVote: boolean; quarantineReason?: string | null; appealRequested?: boolean }
export interface ArenaRoom { id: string; code: string; status: ArenaStatus; version: number; hostId: string; serverNow: number; startsAt: number | null; deadlineAt: number | null; durationSeconds: number; targetText: string; configuration: Omit<SessionConfig, 'clientSessionId' | 'ownerScope' | 'initialTarget'>; members: ArenaMember[]; viewerId: string; spectator: boolean; rematchCode: string | null; reconnectWindowMs: number }
export const normalizeArenaCode = (value: string): string => value.trim().toUpperCase();
export function arenaCodeValid(value: string): boolean { return /^[A-Z0-9]{8}$/.test(value); }
export function arenaCountdown(room: ArenaRoom, localNow: number, receivedLocal: number): number {
  return room.startsAt === null ? 0 : Math.max(0, Math.ceil((room.startsAt - room.serverNow - Math.max(0, localNow - receivedLocal)) / 1000));
}
export function arenaBracket(waitMs: number): number { return Math.min(1, 0.1 + Math.floor(Math.max(0, waitMs) / 10000) * 0.05); }
export function arenaPlacements(members: readonly { id: string; status: ArenaMemberStatus; credited: number; accuracy: number | null; elapsedMs: number }[]): Record<string, number> {
  const eligible = members.filter(member => member.status === 'finished').slice().sort((a, b) => b.credited - a.credited || (b.accuracy ?? 0) - (a.accuracy ?? 0) || a.elapsedMs - b.elapsedMs || a.id.localeCompare(b.id));
  const result: Record<string, number> = {}; let rank = 0, previous = '';
  eligible.forEach((member, index) => { const score = JSON.stringify([member.credited, member.accuracy, member.elapsedMs]); if (score !== previous) rank = index + 1; result[member.id] = rank; previous = score; }); return result;
}
