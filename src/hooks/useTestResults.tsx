import { useCallback, useEffect, useRef, useState } from 'react';
import { accountApi, ApiError, authService, isBackendConfigured } from '@/services/php-api';
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
    if (!isBackendConfigured) return { error: { code: 'backend-unavailable', message: 'Account saving is unavailable in this installation. Your local result is retained.' } };
    try {
      const session = await authService.getSession();
      if (session.user?.id !== record.ownerId) return { error: { code: 'auth-required', status: 401, message: 'Sign in again to sync this account.' } };
      const response = await accountApi.submit(record.candidate, record.cloudConsent, record.ownerId);
      if (!response.accepted) return { error: { code: 'invalid-response', message: 'Account saving was not acknowledged. The local result is retained.' } };
      return { accepted: response.accepted };
    } catch (error) {
      return { error: { code: error instanceof ApiError ? error.code : 'submission-failed', message: error instanceof Error ? error.message : 'Account save failed.', status: error instanceof ApiError ? error.status : undefined } };
    }
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
  const currentOwner = useRef(ownerId);
  currentOwner.current = ownerId;
  const saveVersion = useRef(0);
  const [syncState, setSyncState] = useState<SaveStatus>({ state: 'local-only', message: 'Results are saved on this device.', storageMode: 'memory' });
  const beginSave = useCallback((scope: string, sessionId: string) => {
    const version = currentOwner.current === scope ? ++saveVersion.current : -1;
    if (version >= 0) {
      latestId.current = sessionId;
      setSyncState({ state: 'local-only', message: 'Saving this attempt on this device…', storageMode: sessionRepository.storageMode, sessionId });
    }
    return (record: SessionRecord) => {
      if (version < 0 || saveVersion.current !== version || currentOwner.current !== scope || latestId.current !== sessionId) return;
      setSyncState({ state: record.state, message: sessionRepository.storageError ?? record.message ?? record.state, storageMode: sessionRepository.storageMode, sessionId });
    };
  }, []);
  useEffect(() => {
    let alive = true;
    activeOwner = user?.id ?? null;
    void initializeHistory().then(() => sync.flush(ownerId));
    const unsubscribe = sessionRepository.subscribe(event => {
      if (event.ownerId !== ownerId || event.sessionId !== latestId.current) return;
      void sessionRepository.get(ownerId, event.sessionId).then(row => {
        if (alive && row && currentOwner.current === ownerId && event.sessionId === latestId.current) setSyncState({ state: row.state, message: sessionRepository.storageError ?? row.message ?? row.state, storageMode: sessionRepository.storageMode, sessionId: row.clientSessionId });
      });
    });
    const resume = () => { void sessionRepository.expireEvidence().then(()=>sync.flush(ownerId)); };
    const timer = setInterval(resume, 15_000);
    globalThis.addEventListener?.('online', resume);
    return () => { alive = false; unsubscribe(); clearInterval(timer); globalThis.removeEventListener?.('online', resume); };
  }, [ownerId, user?.id]);

  const saveSession = useCallback(async (result: SessionResult, options: { cloudConsent?: boolean;localOnly?:boolean } = {}): Promise<TestResult> => {
    const scope = result.ownerScope || ownerId;
    const publish = beginSave(scope, result.clientSessionId);
    await initializeHistory();
    const existing = await sessionRepository.get(scope, result.clientSessionId);
    const candidateHash = await payloadIdentity(result);
    if (existing) {
      if (existing.payloadHash !== candidateHash) throw new Error('A completed session cannot be changed. Start a new test.');
      // Hashing can finish after a sync, expiry or deletion has changed this row.
      const current = await sessionRepository.get(scope, result.clientSessionId);
      if (!current) throw new Error('This session was deleted and cannot be recreated.');
      publish(current);
      return current.summary;
    }
    const courseEvidence = result.configuration.settings?.course !== undefined
      ? (await import('@/lib/typing-course')).assessCourseResult(result) ?? undefined : undefined;
    const metrics = result.metrics;
    const summary: TestResult = { id: result.clientSessionId, wpm: finite(metrics.wpm), rawWpm: finite(metrics.rawWpm), accuracy: finite(metrics.inputAccuracy), consistency: finite(metrics.consistency), mode: result.configuration.mode, duration: result.elapsedMs / 1000, correctChars: metrics.correct, incorrectChars: metrics.incorrect, totalChars: metrics.retainedUnits, errors: metrics.incorrectAttempts, date: new Date(result.finishedAtWall).toISOString(), wpmHistory: result.timeSeries.map(point => finite(point.wpm)) };
    const privateContent = result.configuration.privacy === 'private-custom' || result.configuration.mode === 'custom' || result.configuration.scoringPolicy === 'free';
    const consent = options.cloudConsent === true;
    const queued = scope !== 'guest' && (!privateContent || consent) && isBackendConfigured&&!options.localOnly;
    const record: SessionRecord = { schemaVersion: 3, ownerId: scope, clientSessionId: result.clientSessionId, payloadVersion: result.metricsVersion, payloadHash: candidateHash, summary, metricSummary: result.metrics, courseEvidence, comparisonKey: result.comparisonKey, personalBestEligible: result.eligibility.eligible, candidate: result, privateContent, cloudConsent: consent, provenance: 'observed', state: queued ? 'queued' : 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: result.finishedAtWall, evidenceExpiresAt: result.finishedAtWall + EVIDENCE_TTL_MS, message: options.localOnly?'Saved personal result on this device. This session is not eligible for cloud ranking.':privateContent && !consent ? 'Private content saved on this device. Cloud storage requires your consent.' : scope === 'guest' ? 'Saved on this device. Sign in to enable account sync.' : queued ? 'Saved on this device; waiting to sync.' : 'Cloud saving is unavailable; saved on this device.' };
    await sessionRepository.save(record);
    publish(record);
    if (queued) void sync.flush(scope);
    return summary;
  }, [ownerId, beginSave]);

  /** Compatibility preserves observed legacy numbers; they never masquerade as v3 replay. */
  const saveResult = useCallback(async (stats: ExtendedTypingStats, mode: string, _configuredDuration: number): Promise<TestResult> => {
    const id = stats.clientSessionId ?? legacyIds.get(stats) ?? crypto.randomUUID(); legacyIds.set(stats, id);
    const publish = beginSave(ownerId, id);
    await initializeHistory();
    const previous = await sessionRepository.get(ownerId, id); if (previous) { publish(previous); return previous.summary; }
    const summary: TestResult = { id, wpm: finite(stats.wpm), rawWpm: finite(stats.rawWpm), accuracy: finite(stats.accuracy), consistency: finite(stats.consistency), mode, duration: finite(stats.elapsedTime), correctChars: stats.correctChars, incorrectChars: stats.incorrectChars, totalChars: stats.totalChars, errors: stats.errors, date: new Date().toISOString(), wpmHistory: stats.wpmHistory };
    const record: SessionRecord = { schemaVersion: 3, ownerId, clientSessionId: id, summary, payloadVersion: 'legacy-unverified', payloadHash: await payloadIdentity(summary), privateContent: mode === 'custom' || mode === 'zen', cloudConsent: false, provenance: 'legacy', state: 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: Date.now(), evidenceExpiresAt: 0, message: 'Saved locally with legacy metrics. Excluded from verified rankings.' };
    await sessionRepository.save(record);
    publish(record);
    return summary;
  }, [ownerId, beginSave]);
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
