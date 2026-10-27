import { apiRequest } from './php-api';
import type { League, Profile, ProgressionCommand } from '@/domain/progression/types';
export interface AccountProgression { ownerId: string; profile: Profile; league: League | null; verification: 'server-verified' }
export class ProgressionAccountAdapter {
  constructor(readonly ownerId: string, readonly signal?: AbortSignal) {}
  load(): Promise<AccountProgression> { return apiRequest('/progression', { expectedOwner: this.ownerId, signal: this.signal }); }
  claim(sessionId: string, timeZone: string): Promise<AccountProgression> { return apiRequest('/progression/claim', { method: 'POST', expectedOwner: this.ownerId, signal: this.signal, body: { sessionId, timeZone }, headers: { 'Idempotency-Key': `session:${sessionId}` } }); }
  command(command: ProgressionCommand): Promise<AccountProgression> { return apiRequest('/progression/command', { method: 'POST', expectedOwner: this.ownerId, signal: this.signal, body: { command }, headers: { 'Idempotency-Key': `command:${command.id}` } }); }
}
