import type { SessionResult } from '@/lib/typing-core/types';
import { comparableThirtySecondBest, factFromSession } from '@/domain/progression/facts';
import { claimFact, rebuildProfile, runCommand } from '@/domain/progression/engine';
import type { ProgressionCommand } from '@/domain/progression/types';
import { payloadIdentity, sessionRepository } from './session-repository';
import { ApiError, authService, isBackendConfigured } from './php-api';
import { ProgressionAccountAdapter } from './progression-api';
import { invalidateProgressionWork, onProgressionInvalidated, progressionGeneration, readProgression, updateProgression } from './progression-storage';
const listeners = new Set<(ownerId: string) => void>();
export const currentCalendarZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
function announce(ownerId: string) { listeners.forEach(listener => listener(ownerId)); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('sparowtype:progression', { detail: ownerId })); }
export function subscribeProgression(listener: (ownerId: string) => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
sessionRepository.subscribe(event => { if (event.type === 'remove' || event.type === 'clear') invalidateProgressionWork(event.ownerId); });
/** Central post-save hook: local rewards first; a server claim references accepted evidence only. */
export async function claimProgression(result: SessionResult, options: { localOnly?: boolean } = {}): Promise<void> {
  const owner = result.ownerScope, zone = currentCalendarZone();
  const generation = progressionGeneration(owner);
  const ownsWorkspace = () => (authService.currentSession()?.user?.id ?? 'guest') === owner && progressionGeneration(owner) === generation;
  if (!ownsWorkspace()) return;
  const hash = await payloadIdentity(result);
  if (!ownsWorkspace()) return;
  const source = await sessionRepository.get(owner, result.clientSessionId);
  if (!ownsWorkspace()) return;
  // The lazy module can arrive after reset. A retained observed source must still exist now.
  if (!source || source.provenance !== 'observed' || source.payloadVersion !== 'forge-v3' || !source.candidate || source.evidenceExpiresAt <= Date.now()) return;
  const candidate = source.candidate as SessionResult;
  if (source.payloadHash !== hash || candidate.schemaVersion !== 3 || candidate.clientSessionId !== result.clientSessionId || candidate.ownerScope !== owner) throw new Error('Progression requires the matching retained canonical session.');
  const accountEligible = owner !== 'guest' && !options.localOnly && isBackendConfigured && result.configuration.privacy !== 'private-custom' && result.configuration.mode !== 'custom';
  const envelope = (await readProgression(owner)).envelope;
  if (envelope.resetAt && (result.startedAtWall ?? result.finishedAtWall) <= envelope.resetAt) return;
  const existing = envelope.receipts.find(receipt => receipt.id === result.clientSessionId);
  if (!ownsWorkspace()) return;
  if (existing) { if (existing.payloadHash !== hash) throw new Error('This session identity already has different progression evidence.'); if (accountEligible) { await updateProgression(owner, current => ({ ...current, pending: [...new Set([...current.pending, result.clientSessionId])] }), generation); await syncProgression(owner).catch(() => {}); } return; }
  const fact = factFromSession(result, hash, zone);
  if (result.configuration.mode === 'time' && result.configuration.durationMs === 30000) {
    const previous = (await sessionRepository.list(owner)).map(record => record.candidate).filter((candidate): candidate is SessionResult => !!candidate && typeof candidate === 'object' && (candidate as SessionResult).schemaVersion === 3);
    if (!ownsWorkspace()) return;
    try { fact.personalBest30 = comparableThirtySecondBest(result, previous); } catch { /* Corrupt/expired prior replay cannot establish a personal best reward. */ }
  }
  await updateProgression(owner, current => {
    if (current.resetAt && (result.startedAtWall ?? result.finishedAtWall) <= current.resetAt) return current;
    const profile = claimFact(rebuildProfile(owner, 'local', current.receipts, current.commands), fact);
    return { ...current, receipts: profile.receipts, pending: accountEligible ? [...new Set([...current.pending, result.clientSessionId])] : current.pending };
  }, generation);
  announce(owner);
  if (accountEligible) await syncProgression(owner).catch(() => { /* Durable pending reference is retried on next load/save. */ });
}
const syncing = new Map<string, Promise<void>>();
const controllers = new Map<string, AbortController>();
onProgressionInvalidated(owner => controllers.get(owner)?.abort());
authService.subscribe(session => { for (const [owner, controller] of controllers) if (session.user?.id !== owner) controller.abort(); });
export function syncProgression(ownerId: string): Promise<void> {
  if (ownerId === 'guest' || !isBackendConfigured) return Promise.resolve();
  const existing = syncing.get(ownerId); if (existing) return existing;
  const generation = progressionGeneration(ownerId), controller = new AbortController(); controllers.set(ownerId, controller);
  const ownsWorkspace = () => !controller.signal.aborted && progressionGeneration(ownerId) === generation && authService.currentSession()?.user?.id === ownerId;
  const work = (async () => {
    if (!ownsWorkspace()) return;
    const stored = await readProgression(ownerId), adapter = new ProgressionAccountAdapter(ownerId, controller.signal);
    for (const id of stored.envelope.pending.slice(-20)) {
      if (!ownsWorkspace()) return; const fact = stored.envelope.receipts.find(receipt => receipt.id === id); if (!fact) continue;
      if (await sessionRepository.isDeleted(ownerId, id)) {
        if (!ownsWorkspace()) return;
        await updateProgression(ownerId, current => ({ ...current, pending: current.pending.filter(pending => pending !== id) }), generation);
        announce(ownerId); continue;
      }
      if (!ownsWorkspace()) return;
      try { await adapter.claim(id, fact.timeZone); if (!ownsWorkspace()) return; await updateProgression(ownerId, current => ({ ...current, pending: current.pending.filter(pending => pending !== id) }), generation); }
      catch (cause) {
        if (!ownsWorkspace()) return;
        if (cause instanceof ApiError && cause.status === 410) await updateProgression(ownerId, current => ({ ...current, pending: current.pending.filter(pending => pending !== id), failures: { ...current.failures, [id]: 'Original replay expired before a verified reward was accepted. Its device receipt remains available.' } }), generation);
        else if (!(cause instanceof ApiError) || !['session-not-accepted', 'race-not-settled'].includes(cause.code)) throw cause;
      }
      announce(ownerId);
    }
  })().finally(() => { syncing.delete(ownerId); if (controllers.get(ownerId) === controller) controllers.delete(ownerId); });
  syncing.set(ownerId, work); return work;
}
export async function localProgressionCommand(ownerId: string, command: ProgressionCommand): Promise<void> { await updateProgression(ownerId, current => { const profile = runCommand(rebuildProfile(ownerId, 'local', current.receipts, current.commands), command); return { ...current, commands: profile.commands }; }); announce(ownerId); }
