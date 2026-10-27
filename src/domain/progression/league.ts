import type { League, LeaguePeer, LeagueTier } from './types';
export const LEAGUE_TIERS: LeagueTier[] = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Diamond', 'Champion', 'Master'];
export function leagueTable(week: string, tier: LeagueTier, peers: LeaguePeer[], ownerId: string, verified: boolean): League {
  if (peers.length > 30 || new Set(peers.map(peer => peer.ownerId)).size !== peers.length) throw new Error('A league group needs at most 30 unique participants');
  if (peers.some(peer => !Number.isSafeInteger(peer.xp) || peer.xp < 0 || !Number.isFinite(peer.lastActivity))) throw new Error('Invalid league evidence');
  const ordered = [...peers].sort((a, b) => b.xp - a.xp || a.lastActivity - b.lastActivity || a.ownerId.localeCompare(b.ownerId));
  const index = ordered.findIndex(peer => peer.ownerId === ownerId);
  const places = ordered.length < 5 ? 0 : Math.floor(ordered.length * .2);
  return { week, tier, peers: ordered, rank: index < 0 ? null : index + 1, promotionPlaces: tier === 'Master' ? 0 : places, relegationPlaces: tier === 'Bronze' ? 0 : places, verified };
}
export function nextLeagueTier(league: League): LeagueTier {
  const index = LEAGUE_TIERS.indexOf(league.tier);
  if (league.rank === null) return league.tier;
  const offset = league.promotionPlaces && league.rank <= league.promotionPlaces ? 1 : league.relegationPlaces && league.rank > league.peers.length - league.relegationPlaces ? -1 : 0;
  return LEAGUE_TIERS[Math.min(6, Math.max(0, index + offset))];
}
