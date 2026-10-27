import type { SessionResult } from '@/lib/typing-core';
import { replaySession } from '@/lib/typing-core/metrics';
import { graphemes } from '@/lib/typing-core/transcript';
import { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';

export interface GhostTrack { sessionId: string; text: string; durationMs: number; points: readonly { at: number; units: number }[]; targetUnits: number }
export function isCanonicalReplay(value: unknown): value is SessionResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SessionResult>;
  return candidate.schemaVersion === 3 && candidate.metricsVersion === 'forge-v3' && typeof candidate.ownerScope === 'string' &&
    typeof candidate.clientSessionId === 'string' && typeof candidate.targetText === 'string' && typeof candidate.elapsedMs === 'number' && Number.isFinite(candidate.elapsedMs) &&
    typeof candidate.finishedAtWall === 'number' && Number.isFinite(candidate.finishedAtWall) && !!candidate.configuration && typeof candidate.configuration === 'object' &&
    !!candidate.metrics && typeof candidate.metrics === 'object' && Array.isArray(candidate.events) && candidate.events.length <= 20_000 &&
    Array.isArray(candidate.pauseIntervals) && Array.isArray(candidate.issuedTargetSegments);
}
/** Rebuild from the selected owner's canonical evidence rather than trusting UI scores. */
export function buildGhostTrack(session: SessionResult, owner: string, now = Date.now()): GhostTrack | null {
  if (!Number.isFinite(now) || session.finishedAtWall + EVIDENCE_TTL_MS <= now || session.ownerScope !== owner || session.events.length > 20_000 || session.elapsedMs <= 0 || session.elapsedMs > 600_000 || !session.targetText.trim()) return null;
  try {
    const replay = replaySession(session.configuration, session.events, session.elapsedMs, { targetText: session.targetText,
      pauseIntervals: session.pauseIntervals, issuedTargetSegments: session.issuedTargetSegments, finiteFinal: !['time', 'zen'].includes(session.configuration.mode) });
    const points = replay.timeSeries.map(point => ({ at: point.offsetMs, units: Math.max(0, (point.wpm ?? 0) * point.offsetMs / 12000) }));
    points.unshift({ at: 0, units: 0 }); points.push({ at: session.elapsedMs, units: replay.metrics.creditedUnits });
    return { sessionId: session.clientSessionId, text: session.targetText, durationMs: session.elapsedMs, points, targetUnits: graphemes(session.targetText).length };
  } catch { return null; }
}
export function ghostUnits(track: GhostTrack, elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const end = track.points.at(-1)!; if (elapsedMs >= end.at) return end.units;
  for (let i = 1; i < track.points.length; i++) if (track.points[i].at >= elapsedMs) {
    const a = track.points[i - 1], b = track.points[i], ratio = (elapsedMs - a.at) / Math.max(1, b.at - a.at);
    return Math.max(0, a.units + (b.units - a.units) * ratio);
  }
  return 0;
}
export const BOT_NAMES = ['Steady', 'Sprinter', 'Comeback', 'Perfect', 'Wild'] as const;
/** Modelled bots; these positions are never labelled as people or recorded as user metrics. */
export function botUnits(index: number, elapsedMs: number, wpm: number): number {
  const seconds = Math.max(0, elapsedMs) / 1000, rate = Math.max(5, wpm) * 5 / 60;
  const factor = [1, 0.93, 1.04, 1.1, 1][index] ?? 1;
  const variation = index === 1 ? Math.min(seconds, 12) * 0.35 : index === 2 ? -Math.min(seconds, 12) * 0.25 : index === 4 ? Math.sin(seconds / 4) * 1.8 : 0;
  return Math.max(0, rate * (seconds * factor + variation));
}
