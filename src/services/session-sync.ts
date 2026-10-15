import { sessionRepository, type SessionRecord, type SessionRepository } from './session-repository';

export interface UploadResponse { accepted?: unknown; error?: { code: string; message: string; status?: number }; }
export type SessionUploader = (record: SessionRecord) => Promise<UploadResponse>;
export interface SyncOptions {
  repository?: SessionRepository;
  currentOwner: () => string | null;
  upload: SessionUploader;
  now?: () => number;
  random?: () => number;
}
export function retryDelay(attempt: number, random = Math.random): number {
  return Math.round(Math.min(300_000, 1000 * 2 ** Math.min(8, Math.max(0, attempt - 1))) * (0.75 + random() * 0.5));
}

/** A dispatcher is bound to one immutable owner. Account changes pause it before another upload. */
export class SessionSync {
  private running = new Set<string>();
  constructor(private options: SyncOptions) {}

  async flush(ownerId: string, force = false): Promise<void> {
    if (ownerId === 'guest' || this.running.has(ownerId)) return;
    this.running.add(ownerId);
    const repo = this.options.repository ?? sessionRepository;
    const now = this.options.now ?? Date.now;
    try {
      await repo.expireEvidence(now());
      const rows = await repo.list(ownerId);
      for (const row of rows.reverse()) {
        if (!['queued', 'retryable-error', 'auth-required', 'syncing'].includes(row.state)) continue;
        if (this.options.currentOwner() !== ownerId) {
          await repo.save({ ...row, state: 'auth-required', errorCode: 'owner-auth', message: 'Sign in again to sync this account.' });
          break;
        }
        if (row.privateContent && !row.cloudConsent) {
          await repo.save({ ...row, state: 'local-only', errorCode: 'consent-required', message: 'Private content stays on this device until cloud storage is enabled.' });
          continue;
        }
        if (!row.candidate || row.evidenceExpiresAt <= now()) continue;
        if (!force && (row.nextAttemptAt > now() || row.attempts >= 8)) continue;
        const sending = await repo.save({ ...row, state: 'syncing', attempts: row.attempts + 1, message: 'Syncing…', errorCode: undefined });
        let response: UploadResponse;
        try { response = await this.options.upload(sending); }
        catch (error) { response = { error: { code: 'network', message: error instanceof Error ? error.message : 'Connection interrupted.' } }; }
        const failure = response.error;
        // A deletion can occur while the network request is in flight. Its tombstone wins.
        if(!await repo.get(ownerId,row.clientSessionId))continue;
        // The old owner's response can update only their record; it never becomes the next owner's data.
        if (!failure && response.accepted !== undefined) {
          await repo.save({ ...sending, accepted: response.accepted, state: 'synced', nextAttemptAt: 0, message: 'Saved to your account.', errorCode: undefined });
        } else {
          const auth = failure?.status === 401 || failure?.code === 'auth-required';
          const rejected = [400, 403, 409, 413, 422].includes(failure?.status ?? 0);
          await repo.save({ ...sending, state: auth ? 'auth-required' : rejected ? 'rejected' : 'retryable-error', nextAttemptAt: now() + retryDelay(sending.attempts, this.options.random), errorCode: failure?.code ?? 'invalid-response', message: auth ? 'Sign in again to sync this account.' : failure?.message ?? 'The server did not acknowledge this save. Your local result is retained.' });
          if (auth) break;
        }
      }
    } finally { this.running.delete(ownerId); }
  }
}
