import { apiRequest, ApiError } from './php-api';
import type { SessionResult } from '@/lib/typing-core/types';
import type { AsyncDuel, DuelChallenge, Friend, FriendRequest, ReportReason } from '@/domain/progression/social';
export interface SocialSnapshot { ownerId: string; friends: Friend[]; requests: FriendRequest[]; blocked: Array<{ id: string; handle: string }>; duels: AsyncDuel[]; notice?: string; challenge?: DuelChallenge; accepted?: unknown; duelId?: string }
export type SocialAction = 'request' | 'accept' | 'remove' | 'block' | 'unblock' | 'report' | 'duel-create' | 'duel-accept' | 'duel-cancel' | 'duel-start' | 'duel-submit';
export class SocialApi {
  constructor(readonly ownerId: string) {}
  private checked(value: SocialSnapshot): SocialSnapshot { if (value.ownerId !== this.ownerId || !Array.isArray(value.friends) || !Array.isArray(value.requests) || !Array.isArray(value.blocked) || !Array.isArray(value.duels)) throw new ApiError('social-owner', 'The private contact response did not match this workspace.', 409); return value; }
  async load(signal?: AbortSignal): Promise<SocialSnapshot> { return this.checked(await apiRequest('/social', { expectedOwner: this.ownerId, signal })); }
  async action(action: SocialAction, body: Record<string, unknown> = {}, signal?: AbortSignal): Promise<SocialSnapshot> { return this.checked(await apiRequest(`/social/${action}`, { method: 'POST', expectedOwner: this.ownerId, body, signal })); }
  request(handle: string) { return this.action('request', { handle }); }
  report(userId: string, reason: ReportReason) { return this.action('report', { userId, reason }); }
  createDuel(userId: string, requestId: string) { return this.action('duel-create', { userId, requestId }); }
  submitDuel(duelId: string, candidate: SessionResult) { return this.action('duel-submit', { duelId, candidate }); }
}
