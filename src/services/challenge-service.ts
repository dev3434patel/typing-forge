import { apiRequest, authService, isBackendConfigured } from '@/services/php-api';
import type { SessionConfig } from '@/lib/typing-core/types';
import { issuedChallengeWindow } from '@/lib/challenge-timing';

export interface RankedChallenge {
  id: string; user_id: string; nonce: string; target_text: string;
  configuration: Pick<SessionConfig, 'mode' | 'durationMs' | 'language' | 'keyboardLayout' | 'inputMethod' | 'scoringPolicy' | 'contentRevision' | 'correctionPolicy' | 'settings'>;
  issued_at: string; starts_at: string; deadline_at: string; expires_at: string; server_now: string;
}

export async function issueRankedChallenge(duration: number): Promise<RankedChallenge> {
  if (!isBackendConfigured) throw new Error('Ranked challenges require the PHP backend.');
  const expectedOwner = authService.currentSession()?.user?.id;
  if (!expectedOwner) throw new Error('Sign in to request a ranked challenge.');
  const { challenge } = await apiRequest<{ challenge: RankedChallenge }>('/challenges/issue', {
    method: 'POST', body: { duration }, expectedOwner,
  });
  if (!challenge || challenge.user_id !== expectedOwner || challenge.configuration.mode !== 'time' || challenge.configuration.durationMs !== duration * 1000 || challenge.configuration.language !== 'en' || challenge.configuration.keyboardLayout !== 'qwerty' || challenge.configuration.inputMethod !== 'keyboard' || challenge.configuration.scoringPolicy !== 'prose' || challenge.configuration.correctionPolicy !== 'current-word' || !['forge-ranked-en-v1','forge-ranked-en-v2'].includes(challenge.configuration.contentRevision ?? '') || !challenge.target_text)
    throw new Error('The server did not issue a valid challenge for this account.');
  issuedChallengeWindow(challenge);
  return challenge;
}
