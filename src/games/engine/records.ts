import type { GameEvidence, GameId, Difficulty, Variant } from './types';
import { ARCADE_VERSION } from './types';
import { MODE_IDS } from '../modes/catalog';
import { isCanonicalReplay } from '../modes/ghost';
import { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';

export interface ArcadeBest { gameId: GameId; difficulty: Difficulty; variant: Variant; score: number; words: number; accuracy: number | null; wpm: number | null; elapsedMs: number; sessionId: string; finishedAt: number }
export interface ArcadeStoredData { version: 1; bests: ArcadeBest[]; replays: GameEvidence[] }
export interface ArcadeDataRead { data: ArcadeStoredData; error: string | null; recoveryText: string | null }
const memory = new Map<string, ArcadeStoredData>();
const temporaryOwners = new Set<string>();
type ChangeKind = 'save' | 'clear' | 'remove';
type ArcadeStorage = Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'setItem'>>;
const listeners = new Set<(owner: string, kind: ChangeKind, sessionId?: string) => void>();
const revisions = new Map<string, number>(), watchedOwners = new Map<string, number>();
const temporaryErrors = new Map<string, string>(), removedSessions = new Map<string, Set<string>>();
const pendingExpired = new Map<string, Set<string>>();
let observedWindow: Window | undefined;
const browserStorage = (): Storage | undefined => { try { return globalThis.localStorage; } catch { return undefined; } };
export const arcadeStorageKey = (owner: string): string => {
  if (!owner || owner.length > 128) throw new Error('An explicit owner is required for arcade data');
  return `sparowtype.arcade.v1:${encodeURIComponent(owner)}`;
};
const empty = (): ArcadeStoredData => ({ version: 1, bests: [], replays: [] });
const revision = (owner: string) => { arcadeStorageKey(owner); return revisions.get(owner) ?? 0; };
function notify(owner: string, kind: ChangeKind, sessionId?: string): void { for (const listener of listeners) if (sessionId === undefined) listener(owner, kind); else listener(owner, kind, sessionId); }
function invalidate(owner: string, cleared: boolean, blockedDeletion = false): void {
  const key = arcadeStorageKey(owner); memory.delete(key); temporaryOwners.delete(key); temporaryErrors.delete(key);
  if (blockedDeletion) { temporaryOwners.add(key); temporaryErrors.set(key, 'Persistent arcade deletion could not be confirmed. Old records are hidden in this tab.'); }
  if (cleared) revisions.set(owner, revision(owner) + 1);
  notify(owner, cleared ? 'clear' : 'save');
}
function storageChanged(event: StorageEvent): void {
  if (event.storageArea && event.storageArea !== browserStorage()) return;
  if (event.key === null) { for (const owner of watchedOwners.keys()) invalidate(owner, true); return; }
  const prefix = 'sparowtype.arcade.v1:'; if (!event.key.startsWith(prefix)) return;
  try { const owner = decodeURIComponent(event.key.slice(prefix.length)); if (arcadeStorageKey(owner) === event.key && watchedOwners.has(owner)) invalidate(owner, event.newValue === null); } catch { /* Ignore malformed foreign storage keys. */ }
}
function retained(owner: string, data: ArcadeStoredData, now: number): ArcadeStoredData {
  const removed = removedSessions.get(owner);
  for (const replay of data.replays) if (replay.session.finishedAtWall + EVIDENCE_TTL_MS <= now) { let pending = pendingExpired.get(owner); if (!pending) { pending = new Set(); pendingExpired.set(owner, pending); } pending.add(replay.session.clientSessionId); }
  return { ...data, bests: data.bests.filter(best => !removed?.has(best.sessionId)), replays: data.replays.filter(replay => !removed?.has(replay.session.clientSessionId) && replay.session.finishedAtWall + EVIDENCE_TTL_MS > now) };
}
function persist(key: string, data: ArcadeStoredData, storage: ArcadeStorage | undefined, failure: string): string | null {
  memory.set(key, data);
  try { if (!storage?.setItem) throw new Error('Storage is not writable'); storage.setItem(key, JSON.stringify(data)); temporaryOwners.delete(key); temporaryErrors.delete(key); return null; }
  catch { temporaryOwners.add(key); temporaryErrors.set(key, failure); return failure; }
}
function read(owner: string, storage: ArcadeStorage | undefined = browserStorage(), now = Date.now()): ArcadeDataRead {
  const key = arcadeStorageKey(owner);
  if (!Number.isFinite(now)) throw new Error('Evidence expiry requires a finite time');
  try {
    if (temporaryOwners.has(key)) { const data = retained(owner, memory.get(key) ?? empty(), now); const error = persist(key, data, storage, temporaryErrors.get(key) ?? 'Arcade data is kept in this tab only while persistent storage is unavailable.'); return { data, error, recoveryText: null }; }
    if (!storage) { const data = retained(owner, memory.get(key) ?? empty(), now); memory.set(key, data); return { data, error: 'Persistent arcade storage is unavailable.', recoveryText: null }; }
    const raw = storage.getItem(key); if (raw === null) { memory.delete(key); return { data: empty(), error: null, recoveryText: null }; }
    const data = JSON.parse(raw) as ArcadeStoredData;
    if (data.version !== 1 || !Array.isArray(data.bests) || data.bests.length > 48 || !Array.isArray(data.replays) || data.replays.length > 6) throw new Error('Unknown or invalid arcade record schema');
    for (const best of data.bests) if (!MODE_IDS.includes(best.gameId) || !['easy', 'normal', 'hard'].includes(best.difficulty) || !['mission', 'endless'].includes(best.variant) || !Number.isFinite(best.score + best.words + best.elapsedMs + best.finishedAt) || best.score < 0 || best.words < 0 || best.elapsedMs < 0 || typeof best.sessionId !== 'string' || best.accuracy !== null && (typeof best.accuracy !== 'number' || !Number.isFinite(best.accuracy) || best.accuracy < 0 || best.accuracy > 100) || best.wpm !== null && (typeof best.wpm !== 'number' || !Number.isFinite(best.wpm) || best.wpm < 0)) throw new Error('Invalid local best');
    for (const evidence of data.replays) if (evidence.version !== ARCADE_VERSION || !isCanonicalReplay(evidence.session) || evidence.session.ownerScope !== owner) throw new Error('Invalid or differently owned replay');
    const filtered = retained(owner, data, now);
    if (filtered.replays.length !== data.replays.length || filtered.bests.length !== data.bests.length) return { data: filtered, error: persist(key, filtered, storage, 'Expired or deleted replay evidence was removed in this tab. Persistent expiry could not be confirmed because storage is blocked.'), recoveryText: null };
    return { data, error: null, recoveryText: null };
  } catch (cause) {
    let raw: string | null = null; try { raw = storage?.getItem(key) ?? null; } catch { /* The storage failure is reported below. */ }
    const data = retained(owner, memory.get(key) ?? empty(), now); memory.set(key, data);
    return { data, error: cause instanceof Error ? cause.message : 'Arcade storage is unavailable', recoveryText: raw };
  }
}
export const arcadeData = {
  read,
  revision,
  expire(owner: string, now = Date.now()): void {
    const result = read(owner, browserStorage(), now), expired = pendingExpired.get(owner); pendingExpired.delete(owner);
    if (expired) for (const id of expired) notify(owner, 'remove', id);
    notify(owner, 'save'); if (result.error) throw new Error(result.error);
  },
  save(owner: string, evidence: GameEvidence, storage: Pick<Storage, 'getItem' | 'setItem'> | undefined = browserStorage(), expectedRevision = revision(owner)): ArcadeDataRead {
    if (evidence.session.ownerScope !== owner || evidence.verification !== 'local-unverified') throw new Error('Arcade evidence belongs to a different workspace');
    if (removedSessions.get(owner)?.has(evidence.session.clientSessionId)) return { ...read(owner, storage), error: 'This session was deleted and cannot restore arcade records.' };
    if (expectedRevision !== revision(owner)) return { ...read(owner, storage), error: 'This run started before arcade data was cleared. It will not restore deleted records.' };
    const previous = read(owner, storage);
    if (previous.recoveryText !== null) return { ...previous, error: 'Existing arcade data needs recovery. Export or clear it before storing another result.' };
    const existing = previous.data.bests.find(best => best.gameId === evidence.gameId && best.difficulty === evidence.difficulty && best.variant === evidence.variant);
    const candidate: ArcadeBest = { gameId: evidence.gameId, difficulty: evidence.difficulty, variant: evidence.variant, score: evidence.score, words: evidence.completedWords,
      accuracy: evidence.session.metrics.inputAccuracy, wpm: evidence.session.metrics.wpm, elapsedMs: evidence.session.elapsedMs, sessionId: evidence.session.clientSessionId, finishedAt: evidence.session.finishedAtWall };
    const bests = previous.data.bests.filter(best => best !== existing);
    bests.push(!existing || candidate.score > existing.score || candidate.score === existing.score && (candidate.accuracy ?? 0) > (existing.accuracy ?? 0) ? candidate : existing);
    const replays = [evidence, ...previous.data.replays.filter(replay => replay.session.clientSessionId !== evidence.session.clientSessionId)].slice(0, 6);
    let data: ArcadeStoredData = retained(owner, { version: 1, bests, replays }, Date.now());
    while (JSON.stringify(data).length > 700_000 && data.replays.length > 1) data = { ...data, replays: data.replays.slice(0, -1) };
    const error = persist(arcadeStorageKey(owner), data, storage, 'Kept in this tab only: persistent arcade storage is unavailable or full.');
    // Subscribers must observe the newly persisted value or the established
    // temporary fallback, never the previous stored record.
    notify(owner, 'save');
    return { data, error, recoveryText: null };
  },
  export(owner: string): { ownerId: string; arcade: ArcadeStoredData; recoveryText: string | null; warning: string | null } { const result = read(owner); return { ownerId: owner, arcade: result.data, recoveryText: result.recoveryText, warning: result.error }; },
  removeSession(owner: string, sessionId: string): void {
    if (typeof sessionId !== 'string' || !sessionId || sessionId.length > 200 || [...sessionId].some(char => { const code = char.codePointAt(0)!; return code < 32 || code >= 127 && code <= 159; })) throw new Error('A valid session identifier is required');
    const storage = browserStorage(), previous = read(owner, storage); let deleted = removedSessions.get(owner); if (!deleted) { deleted = new Set(); removedSessions.set(owner, deleted); } deleted.add(sessionId);
    const data = retained(owner, previous.data, Date.now()), changed = data.replays.length !== previous.data.replays.length || data.bests.length !== previous.data.bests.length;
    let failure: string | null = previous.recoveryText !== null ? 'This session was removed locally. Corrupt arcade storage prevents confirming persistent replay removal; export or clear the recovery data.' : null;
    if (!failure && (changed || previous.error)) failure = persist(arcadeStorageKey(owner), data, storage, 'This session was removed from this tab. Persistent arcade replay removal could not be confirmed because storage is blocked.');
    else memory.set(arcadeStorageKey(owner), data);
    notify(owner, 'remove', sessionId); if (failure) throw new Error(failure);
  },
  clear(owner: string): void {
    const key = arcadeStorageKey(owner); let failed = false;
    try { const storage = browserStorage(); if (!storage) throw new Error('Persistent storage is unavailable'); storage.removeItem(key); }
    catch { failed = true; }
    finally { invalidate(owner, true, failed); }
    if (failed) throw new Error('Temporary arcade data and the active run were cleared. Persistent arcade deletion could not be confirmed because browser storage is blocked. Retry after enabling storage.');
  },
  subscribe(listener: (owner: string, kind: ChangeKind, sessionId?: string) => void, owner?: string): () => void {
    if (owner !== undefined) { arcadeStorageKey(owner); watchedOwners.set(owner, (watchedOwners.get(owner) ?? 0) + 1); }
    listeners.add(listener);
    if (typeof window !== 'undefined' && !observedWindow) { observedWindow = window; observedWindow.addEventListener('storage', storageChanged); }
    return () => { listeners.delete(listener); if (owner !== undefined) { const count = (watchedOwners.get(owner) ?? 1) - 1; if (count > 0) watchedOwners.set(owner, count); else watchedOwners.delete(owner); }
      if (listeners.size === 0) { observedWindow?.removeEventListener('storage', storageChanged); observedWindow = undefined; } };
  },
};
