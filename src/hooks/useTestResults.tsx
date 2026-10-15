import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { TestResult, TypingStats } from '@/lib/typing-engine';
import type { Keystroke } from '@/lib/professional-accuracy';
import type { SessionResult } from '@/lib/typing-core/types';
import { EVIDENCE_TTL_MS, payloadIdentity, sessionRepository, type SaveState, type SessionRecord } from '@/services/session-repository';
import { SessionSync } from '@/services/session-sync';
import { downloadAccountHistory } from '@/services/account-data';
import { historyForOwner, type SessionHistoryState } from '@/services/history-state';

export interface ExtendedTypingStats extends TypingStats { wpmHistory: number[]; backspaceCount?: number; keystrokeLog?: Keystroke[]; targetText?: string; typedText?: string; clientSessionId?: string }
interface PerCharMetric { char: string; wpm: number; accuracy: number; confidence: number; occurrences: number }
export interface SaveStatus { state: SaveState; message: string; storageMode: 'indexeddb' | 'memory'; sessionId?: string }
let activeOwner: string | null = null;
const sync = new SessionSync({
  currentOwner: () => activeOwner,
  upload: async record => {
    if (!isSupabaseConfigured) return { error: { code: 'backend-unavailable', message: 'Cloud saving is unavailable in this installation. Your local result is retained.' } };
    const { data, error } = await supabase.auth.getSession();
    if (error || data.session?.user.id !== record.ownerId) return { error: { code: 'auth-required', status: 401, message: 'Sign in again to sync this account.' } };
    const response = await supabase.functions.invoke('submit-session', { body: { payloadVersion: record.payloadVersion, clientSessionId: record.clientSessionId, candidate: record.candidate, cloudConsent: record.cloudConsent }, headers: { Authorization: `Bearer ${data.session.access_token}` } });
    if (response.error) return { error: { code: 'submission-failed', message: response.data?.error ?? response.error.message, status: response.error.context?.status } };
    if (!response.data?.accepted) return { error: { code: 'invalid-response', message: 'Cloud saving was not acknowledged. The local result is retained.' } };
    return { accepted: response.data.accepted };
  },
});
let startup: Promise<unknown> | undefined;
function initializeHistory() { return startup ??= sessionRepository.migrateLegacy().then(() => sessionRepository.expireEvidence()); }
const legacyIds = new WeakMap<object, string>();
const finite = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function useTestResults() {
  const { user } = useAuth();
  const ownerId = user?.id ?? 'guest';
  const latestId = useRef<string>();
  const [syncState, setSyncState] = useState<SaveStatus>({ state: 'local-only', message: 'Results are saved on this device.', storageMode: 'memory' });
  useEffect(() => {
    activeOwner = user?.id ?? null;
    void initializeHistory().then(() => sync.flush(ownerId));
    const unsubscribe = sessionRepository.subscribe(event => {
      if (event.ownerId !== ownerId || event.sessionId !== latestId.current) return;
      void sessionRepository.get(ownerId, event.sessionId).then(row => {
        if (row) setSyncState({ state: row.state, message: sessionRepository.storageError ?? row.message ?? row.state, storageMode: sessionRepository.storageMode, sessionId: row.clientSessionId });
      });
    });
    const resume = () => { void sessionRepository.expireEvidence().then(()=>sync.flush(ownerId)); };
    const timer = setInterval(resume, 15_000);
    globalThis.addEventListener?.('online', resume);
    return () => { unsubscribe(); clearInterval(timer); globalThis.removeEventListener?.('online', resume); };
  }, [ownerId, user?.id]);

  const saveSession = useCallback(async (result: SessionResult, options: { cloudConsent?: boolean;localOnly?:boolean } = {}): Promise<TestResult> => {
    await initializeHistory();
    const scope = result.ownerScope || ownerId;
    const existing = await sessionRepository.get(scope, result.clientSessionId);
    const candidateHash = await payloadIdentity(result);
    if (existing) {
      if (existing.payloadHash !== candidateHash) throw new Error('A completed session cannot be changed. Start a new test.');
      latestId.current = existing.clientSessionId;
      setSyncState({ state: existing.state, message: existing.message ?? existing.state, storageMode: sessionRepository.storageMode, sessionId: existing.clientSessionId });
      return existing.summary;
    }
    const metrics = result.metrics;
    const summary: TestResult = { id: result.clientSessionId, wpm: finite(metrics.wpm), rawWpm: finite(metrics.rawWpm), accuracy: finite(metrics.inputAccuracy), consistency: finite(metrics.consistency), mode: result.configuration.mode, duration: result.elapsedMs / 1000, correctChars: metrics.correct, incorrectChars: metrics.incorrect, totalChars: metrics.retainedUnits, errors: metrics.incorrectAttempts, date: new Date(result.finishedAtWall).toISOString(), wpmHistory: result.timeSeries.map(point => finite(point.wpm)) };
    const privateContent = result.configuration.privacy === 'private-custom' || result.configuration.mode === 'custom' || result.configuration.scoringPolicy === 'free';
    const consent = options.cloudConsent === true;
    const queued = scope !== 'guest' && (!privateContent || consent) && isSupabaseConfigured&&!options.localOnly;
    const record: SessionRecord = { schemaVersion: 3, ownerId: scope, clientSessionId: result.clientSessionId, payloadVersion: result.metricsVersion, payloadHash: candidateHash, summary, metricSummary: result.metrics, comparisonKey: result.comparisonKey, personalBestEligible: result.eligibility.eligible, candidate: result, privateContent, cloudConsent: consent, provenance: 'observed', state: queued ? 'queued' : 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: result.finishedAtWall, evidenceExpiresAt: result.finishedAtWall + EVIDENCE_TTL_MS, message: options.localOnly?'Saved personal result on this device. This session is not eligible for cloud ranking.':privateContent && !consent ? 'Private content saved on this device. Cloud storage requires your consent.' : scope === 'guest' ? 'Saved on this device. Sign in to enable account sync.' : queued ? 'Saved on this device; waiting to sync.' : 'Cloud saving is unavailable; saved on this device.' };
    latestId.current = result.clientSessionId;
    await sessionRepository.save(record);
    setSyncState({ state: record.state, message: sessionRepository.storageError ?? record.message, storageMode: sessionRepository.storageMode, sessionId: record.clientSessionId });
    if (queued) void sync.flush(scope);
    return summary;
  }, [ownerId]);

  /** Compatibility preserves observed legacy numbers; they never masquerade as v3 replay. */
  const saveResult = useCallback(async (stats: ExtendedTypingStats, mode: string, _configuredDuration: number): Promise<TestResult> => {
    await initializeHistory();
    const id = stats.clientSessionId ?? legacyIds.get(stats) ?? crypto.randomUUID(); legacyIds.set(stats, id);
    const previous = await sessionRepository.get(ownerId, id); if (previous) return previous.summary;
    const summary: TestResult = { id, wpm: finite(stats.wpm), rawWpm: finite(stats.rawWpm), accuracy: finite(stats.accuracy), consistency: finite(stats.consistency), mode, duration: finite(stats.elapsedTime), correctChars: stats.correctChars, incorrectChars: stats.incorrectChars, totalChars: stats.totalChars, errors: stats.errors, date: new Date().toISOString(), wpmHistory: stats.wpmHistory };
    const record: SessionRecord = { schemaVersion: 3, ownerId, clientSessionId: id, summary, payloadVersion: 'legacy-unverified', payloadHash: await payloadIdentity(summary), privateContent: mode === 'custom' || mode === 'zen', cloudConsent: false, provenance: 'legacy', state: 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: Date.now(), evidenceExpiresAt: 0, message: 'Saved locally with legacy metrics. Excluded from verified rankings.' };
    latestId.current = id; await sessionRepository.save(record);
    setSyncState({ state: record.state, message: sessionRepository.storageError ?? record.message, storageMode: sessionRepository.storageMode, sessionId: id });
    return summary;
  }, [ownerId]);
  const retrySync = useCallback(async () => { await sync.flush(ownerId, true); }, [ownerId]);
  const enableCloudStorage = useCallback(async (sessionId: string) => {
    const row = await sessionRepository.get(ownerId, sessionId);
    if (!row || row.provenance !== 'observed' || !row.candidate || ownerId === 'guest') throw new Error('Sign in and choose a current personal session to enable cloud storage.');
    await sessionRepository.save({ ...row, cloudConsent: true, state: 'queued', nextAttemptAt: 0 }); await sync.flush(ownerId, true);
  }, [ownerId]);
  const saveCharacterConfidence = useCallback(async (_metrics: Record<string, PerCharMetric>) => ({ state: 'local-only' as const, message: 'Learning progress syncs through accepted session evidence.' }), []);
  return { saveResult, saveSession, saveCharacterConfidence, syncState, retrySync, enableCloudStorage };
}

export function useSessionHistory(explicitOwner?: string) {
  const { user } = useAuth(); const ownerId = explicitOwner ?? user?.id ?? 'guest';
  const [state, setState] = useState<SessionHistoryState>({ownerId,records:[],loading:true,error:null});
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try { await initializeHistory(); const rows = await sessionRepository.list(ownerId); if (!cancelled) setState({ownerId,records:rows,error:sessionRepository.storageError,loading:false}); }
      catch (cause) { if (!cancelled) setState(previous=>({...historyForOwner(previous,ownerId),error:cause instanceof Error ? cause.message : 'History could not be loaded.',loading:false})); }
    };
    setState(previous=>({...historyForOwner(previous,ownerId),loading:true})); void refresh();
    if(ownerId!=='guest') void downloadAccountHistory(ownerId).then(refresh).catch(cause=>{if(!cancelled)setState(previous=>({...historyForOwner(previous,ownerId),error:cause instanceof Error?cause.message:'Account history is unavailable.'}));});
    const unsubscribe = sessionRepository.subscribe(event => { if (event.ownerId === ownerId) void refresh(); });
    return () => { cancelled = true; unsubscribe(); };
  }, [ownerId]);
  return { ...historyForOwner(state,ownerId), storageMode: sessionRepository.storageMode };
}
