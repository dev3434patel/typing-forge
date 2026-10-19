import { accountApi, authService, isBackendConfigured } from './php-api';
import { payloadIdentity, sessionRepository, type SessionRecord } from './session-repository';
import { reconcileLearningSessions } from '@/lib/keybr-engine';
import type { LearningSessionEvidence } from '@/lib/learning-evidence';

async function authenticatedOwner(ownerId: string) {
  if (!isBackendConfigured) throw new Error('Account operations are unavailable in this installation.');
  const session = await authService.getSession();
  if (session.user?.id !== ownerId) throw new Error('The signed-in account changed. Reopen this workspace before changing account data.');
  return session;
}

export async function downloadAccountHistory(ownerId: string, attempt = 0): Promise<void> {
  if (!isBackendConfigured || ownerId === 'guest') return;
  await authenticatedOwner(ownerId);
  // Only rows accepted before this snapshot are eligible for deletion. A new
  // upload can legitimately be absent from the pages already being downloaded.
  const previouslySynced = (await sessionRepository.list(ownerId)).filter(row => row.state === 'synced');
  const { version: initialVersion } = await accountApi.dataVersion(ownerId);
  const cloudIds = new Set<string>();
  const pending: SessionRecord[] = [];
  const learning = new Map<string, LearningSessionEvidence>();
  const pageSize = 500;
  let changed = false;
  for (let offset = 0; ; offset += pageSize) {
    const page = await accountApi.history(offset, pageSize, ownerId);
    if (page.version !== initialVersion) { changed = true; break; }
    for (const item of page.sessions) {
      cloudIds.add(item.clientSessionId);
      pending.push({
        schemaVersion: 3, ownerId, clientSessionId: item.clientSessionId,
        payloadVersion: item.metricsVersion, payloadHash: item.payloadHash || await payloadIdentity(item.summary),
        summary: item.summary, metricSummary: item.metrics, comparisonKey: item.comparisonKey,
        personalBestEligible: item.personalBestEligible === true, accepted: item.accepted,
        privateContent: false, cloudConsent: false,
        provenance: item.metricsVersion === 'forge-v3' ? 'observed' : 'legacy',
        state: 'synced', attempts: 0, nextAttemptAt: 0, createdAt: item.createdAt,
        evidenceExpiresAt: 0, message: 'Account summary downloaded. Raw replay remains on its originating device.',
      });
    }
    for (const evidence of page.learningEvidence) learning.set(evidence.sessionId, evidence);
    if (!page.hasMore) break;
  }
  const { version: finalVersion } = await accountApi.dataVersion(ownerId);
  await authenticatedOwner(ownerId);
  if (changed || finalVersion !== initialVersion) {
    if (attempt < 2) return downloadAccountHistory(ownerId, attempt + 1);
    throw new Error('Account history changed during download. Reopen this page to reconcile the latest version.');
  }
  for (const row of pending) {
    if (await sessionRepository.get(ownerId, row.clientSessionId) || await sessionRepository.isDeleted(ownerId, row.clientSessionId)) continue;
    await sessionRepository.save(row);
  }
  for (const row of previouslySynced) if (!cloudIds.has(row.clientSessionId)) await sessionRepository.remove(ownerId, row.clientSessionId);
  reconcileLearningSessions([...learning.values()], ownerId, finalVersion);
}

export async function deleteSession(ownerId: string, sessionId: string): Promise<void> {
  if (ownerId !== 'guest') await authenticatedOwner(ownerId);
  const row = await sessionRepository.get(ownerId, sessionId);
  if (!row) return;
  if (ownerId !== 'guest' && row.state !== 'local-only') {
    const response = await accountApi.deleteSession(ownerId, sessionId);
    if (!response.deleted) throw new Error('Account deletion was not acknowledged; local history is retained.');
    await authenticatedOwner(ownerId);
  }
  await sessionRepository.remove(ownerId, sessionId);
}

export async function deleteAccount(ownerId: string): Promise<void> {
  if (ownerId === 'guest') { await sessionRepository.clear('guest'); return; }
  await authenticatedOwner(ownerId);
  const response = await accountApi.deleteAccount(ownerId);
  if (!response.deleted) throw new Error('Account deletion was not acknowledged.');
  const current = await authService.getSession();
  if (current.user && current.user.id !== ownerId) throw new Error('Account changed after deletion was acknowledged. The new workspace was not cleared or signed out.');
  await sessionRepository.clear(ownerId);
  if (current.user?.id === ownerId) await authService.signOut(ownerId);
  else await authService.refresh();
}

export function exportHistory(records: SessionRecord[]) {
  const blob = new Blob([JSON.stringify({ format: 'typing-forge-export', schemaVersion: 3, exportedAt: new Date().toISOString(), sessions: records }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sparowtype-history-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
