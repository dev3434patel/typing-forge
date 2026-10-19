import { apiRequest, authService, isBackendConfigured } from '@/services/php-api';
import type { SessionConfig } from '@/lib/typing-core/types';

export interface RankedChallenge {
  id: string; user_id: string; nonce: string; target_text: string;
  configuration: Pick<SessionConfig, 'mode' | 'durationMs' | 'language' | 'keyboardLayout' | 'inputMethod' | 'scoringPolicy' | 'contentRevision' | 'correctionPolicy'>;
  issued_at: string; starts_at: string; deadline_at: string; expires_at: string; server_now: string;
}

export async function issueRankedChallenge(duration: number): Promise<RankedChallenge> {
  if (!isBackendConfigured) throw new Error('Ranked challenges require the PHP backend.');
  const expectedOwner = authService.currentSession()?.user?.id;
  if (!expectedOwner) throw new Error('Sign in to request a ranked challenge.');
  const { challenge } = await apiRequest<{ challenge: RankedChallenge }>('/challenges/issue', {
    method: 'POST', body: { duration }, expectedOwner,
  });
  if (!challenge || challenge.user_id !== expectedOwner || !Number.isFinite(Date.parse(challenge.starts_at)))
    throw new Error('The server did not issue a valid challenge for this account.');
  return challenge;
}
