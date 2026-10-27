import type { Profile } from '@/domain/progression/types';
import { seasonTrack } from '@/domain/progression/season';
const key = (profile: Pick<Profile, 'ownerId' | 'verification'>) => `sparowtype.season-banner.v1:${encodeURIComponent(profile.ownerId)}:${profile.verification}`;
export function readSeasonBanner(profile: Profile, date: string): number | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(profile)) || 'null'), track = seasonTrack(profile, date);
    return value?.version === 1 && value.seasonId === track.id && track.tiers.some(tier => tier.tier === value.tier && tier.unlocked) ? value.tier : null;
  } catch { return null; }
}
export function saveSeasonBanner(profile: Profile, date: string, tier: number): void {
  const track = seasonTrack(profile, date);
  if (!track.tiers.some(item => item.tier === tier && item.unlocked)) throw new Error('This banner has not been unlocked by the current reward receipts.');
  localStorage.setItem(key(profile), JSON.stringify({ version: 1, seasonId: track.id, tier }));
}
export function clearSeasonBanners(ownerId: string): void { for (const verification of ['local', 'server-verified'] as const) localStorage.removeItem(key({ ownerId, verification })); }
export function exportSeasonBanners(ownerId: string) {
  return Object.fromEntries((['local', 'server-verified'] as const).map(verification => {
    try { const raw = localStorage.getItem(key({ ownerId, verification })); return [verification, raw && raw.length < 300 ? JSON.parse(raw) : null]; } catch { return [verification, null]; }
  }));
}
