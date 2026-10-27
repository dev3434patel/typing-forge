import type { TestResult } from '@/lib/typing-engine';
import type { SessionMetricValues } from '@/lib/typing-core/types';
import type { CourseAssessment } from '@/lib/typing-course';
import type { PlacementPartEvidence } from '@/domain/training/placement';
import { typingGameStorageKey } from '@/lib/typing-game-records';
import { publishWorkspaceReset, publishWorkspaceResetResult, readWorkspaceReset, publishWorkspaceSessionRemoval, readWorkspaceSessionRemoval, subscribeWorkspaceSessionRemoval } from './workspace-reset';
import { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';
export { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';

export const STORAGE_VERSION = 3;
export type SaveState = 'local-only' | 'queued' | 'syncing' | 'synced' | 'retryable-error' | 'auth-required' | 'rejected';
export type StorageMode = 'indexeddb' | 'memory';
export interface SessionRecord {
  schemaVersion: 3;
  ownerId: string;
  clientSessionId: string;
  payloadVersion: string;
  payloadHash: string;
  summary: TestResult;
  metricSummary?: SessionMetricValues;
  /** Personal course assessment retained after raw replay expiry; not a ranked certificate. */
  courseEvidence?: CourseAssessment;
  /** Small local placement summary; never a ranked or server-issued certificate. */
  placementEvidence?: PlacementPartEvidence;
  comparisonKey?: string;
  personalBestEligible?: boolean;
  /** Original candidate is never replaced by the server's accepted result. */
  candidate?: unknown;
  accepted?: unknown;
  privateContent: boolean;
  cloudConsent: boolean;
  provenance: 'observed' | 'legacy' | 'guest-import';
  state: SaveState;
  attempts: number;
  nextAttemptAt: number;
  createdAt: number;
  evidenceExpiresAt: number;
  errorCode?: string;
  message?: string;
}
export type RepositoryEvent = { type: 'save' | 'remove' | 'clear'; ownerId: string; sessionId?: string };
type Stored = SessionRecord & { key: string; workspaceResetId?: string };
type Listener = (event: RepositoryEvent) => void;

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
}

export async function payloadIdentity(payload: unknown): Promise<string> {
  const text = stableJson(payload);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return `sha256:${Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')}`;
  }
  // Only an immutable local change detector; the trusted server always computes SHA-256.
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `local-fnv1a:${(hash >>> 0).toString(16)}:${text.length}`;
}

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const keyFor = (owner: string, id: string) => `v${STORAGE_VERSION}:${owner}:${id}`;

/** Memory-first writes guarantee a result survives a blocked/full browser database this visit. */
export class SessionRepository {
  private memory = new Map<string, Stored>();
  private tombstones = new Set<string>();
  private listeners = new Set<Listener>();
  private database?: Promise<IDBDatabase | null>;
  private loaded = false;
  private ownerRevisions = new Map<string, number>();
  private clearing = new Set<string>();
  private resetIds = new Map<string, string>();
  storageMode: StorageMode = 'memory';
  storageError: string | null = null;
  private stopRemovals: () => void;
  constructor() {
    this.stopRemovals = subscribeWorkspaceSessionRemoval(removal => {
      const key = keyFor(removal.ownerId, removal.sessionId);
      if (this.tombstones.has(key)) return;
      this.tombstones.add(key); this.memory.delete(key);
      this.emit({ type: 'remove', ownerId: removal.ownerId, sessionId: removal.sessionId });
    });
  }
  dispose(): void { this.stopRemovals(); this.listeners.clear(); }

  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(event: RepositoryEvent) { this.listeners.forEach(listener => listener(event)); }

  ownerRevision(ownerId: string): number {
    const removed = readWorkspaceSessionRemoval(ownerId);
    if (removed) { const key = keyFor(ownerId, removed.sessionId); this.tombstones.add(key); this.memory.delete(key); }
    const reset = readWorkspaceReset(ownerId);
    if (reset && this.resetIds.get(ownerId) !== reset.id) {
      this.resetIds.set(ownerId, reset.id);
      this.ownerRevisions.set(ownerId, (this.ownerRevisions.get(ownerId) ?? 0) + 1);
      // A tab can retain an old cache while another tab clears IndexedDB.
      for (const [key, row] of this.memory) if (row.ownerId === ownerId && row.createdAt <= reset.at) this.memory.delete(key);
    }
    return this.ownerRevisions.get(ownerId) ?? 0;
  }

  private open(): Promise<IDBDatabase | null> {
    if (this.database) return this.database;
    this.database = new Promise(resolve => {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      try {
        const request = indexedDB.open('typingforge-sessions', STORAGE_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('sessions')) request.result.createObjectStore('sessions', { keyPath: 'key' });
        };
        request.onsuccess = () => { this.storageMode = 'indexeddb'; resolve(request.result); };
        request.onerror = () => { this.storageError = 'Browser storage is unavailable. Results are kept in memory for this visit.'; resolve(null); };
        request.onblocked = () => { this.storageError = 'Close older SparowType tabs to enable durable storage.'; resolve(null); };
      } catch { this.storageError = 'Browser storage is blocked. Results are kept in memory for this visit.'; resolve(null); }
    });
    return this.database;
  }

  private async hydrate() {
    if (this.loaded) return;
    const db = await this.open();
    if (db) await new Promise<void>(resolve => {
      try {
        const transaction = db.transaction('sessions', 'readonly');
        const request = transaction.objectStore('sessions').getAll();
        request.onsuccess = () => {
          for (const row of request.result as Array<Stored & {deleted?:boolean}>) {
            const reset = readWorkspaceReset(row.ownerId);
            if (row.deleted) { this.tombstones.add(row.key); this.memory.delete(row.key); }
            else if ((!reset || row.createdAt > reset.at || row.workspaceResetId === reset.id) && !this.memory.has(row.key) && !this.tombstones.has(row.key)) this.memory.set(row.key, row);
          }
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = transaction.onabort = () => { this.storageError = 'History could not be read from browser storage.'; resolve(); };
      } catch { resolve(); }
    });
    this.loaded = true;
  }

  private async persist(action: (store: IDBObjectStore) => void) {
    const db = await this.open();
    if (!db) return;
    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction('sessions', 'readwrite');
        action(tx.objectStore('sessions'));
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => { this.storageMode = 'memory'; this.storageError = 'History storage is full or unavailable. This result is kept in memory; export it before closing.'; resolve(); };
      } catch { this.storageMode = 'memory'; this.storageError = 'History could not be persisted. Export results before closing this visit.'; resolve(); }
    });
  }

  async get(ownerId: string, sessionId: string): Promise<SessionRecord | null> {
    this.ownerRevision(ownerId);
    await this.hydrate();
    const row = this.memory.get(keyFor(ownerId, sessionId));
    return row ? copy(row) : null;
  }
  async isDeleted(ownerId:string,sessionId:string){await this.hydrate();return this.tombstones.has(keyFor(ownerId,sessionId));}

  async list(ownerId: string): Promise<SessionRecord[]> {
    this.ownerRevision(ownerId);
    await this.hydrate();
    return Array.from(this.memory.values()).filter(row => row.ownerId === ownerId).sort((a, b) => b.createdAt - a.createdAt).map(copy);
  }

  async save(record: SessionRecord, expectedRevision = this.ownerRevision(record.ownerId)): Promise<SessionRecord> {
    await this.hydrate();
    const candidate = record.candidate as { startedAtWall?: number } | undefined;
    const reset = readWorkspaceReset(record.ownerId);
    if (expectedRevision !== this.ownerRevision(record.ownerId) || this.clearing.has(record.ownerId) ||
        (record.provenance === 'observed' && typeof candidate?.startedAtWall === 'number' && reset && candidate.startedAtWall <= reset.at)) {
      throw new Error('This workspace was reset. Start a new attempt before saving.');
    }
    const key = keyFor(record.ownerId, record.clientSessionId);
    if (readWorkspaceSessionRemoval(record.ownerId)?.sessionId === record.clientSessionId) this.tombstones.add(key);
    if(this.tombstones.has(key))throw new Error('This session was deleted and cannot be recreated.');
    const previous = this.memory.get(key);
    if (previous && previous.payloadHash !== record.payloadHash) throw new Error('This session ID already belongs to different immutable evidence.');
    if (record.privateContent && !record.cloudConsent && record.state !== 'local-only') throw new Error('Private content requires explicit cloud-storage consent.');
    const row = copy({ ...record, key, workspaceResetId: reset?.id });
    this.memory.set(key, row);
    await this.persist(store => store.put(row));
    if (expectedRevision !== this.ownerRevision(record.ownerId) || this.clearing.has(record.ownerId)) throw new Error('This workspace was reset. Start a new attempt before saving.');
    this.emit({ type: 'save', ownerId: row.ownerId, sessionId: row.clientSessionId });
    return copy(row);
  }

  async remove(ownerId: string, sessionId: string) {
    await this.hydrate();
    const key = keyFor(ownerId, sessionId);
    this.memory.delete(key);
    this.tombstones.add(key);
    if (!this.clearing.has(ownerId)) publishWorkspaceSessionRemoval(ownerId, sessionId);
    await this.persist(store => store.put({key,ownerId,clientSessionId:sessionId,deleted:true}));
    const failures: string[] = [];
    if (this.storageMode === 'memory' && this.storageError) failures.push('Session deletion is retained for this visit; persistent history deletion could not be confirmed.');
    try { (await import('@/games/engine/records')).arcadeData.removeSession(ownerId, sessionId); }
    catch (error) { failures.push(error instanceof Error ? error.message : 'Arcade evidence deletion could not be confirmed.'); }
    finally { this.emit({ type: 'remove', ownerId, sessionId }); }
    if (failures.length) throw new Error(failures.join(' '));
  }

  /** Read the durable store directly: the reset fence intentionally hides old rows from hydrate(). */
  private async clearStoredOwner(ownerId: string): Promise<void> {
    const db = await this.open();
    if (!db) {
      if (this.storageError) throw new Error('Persistent history deletion could not be confirmed. ' + this.storageError);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const failed = () => {
        this.storageMode = 'memory';
        this.storageError = 'Persistent history deletion could not be confirmed. This visit remains reset.';
        reject(new Error(this.storageError));
      };
      try {
        const transaction = db.transaction('sessions', 'readwrite');
        const store = transaction.objectStore('sessions');
        const request = store.getAll();
        request.onsuccess = () => {
          for (const row of request.result as Array<Stored & { deleted?: boolean }>) {
            if (row.ownerId !== ownerId) continue;
            this.tombstones.add(row.key); this.memory.delete(row.key);
            // Keep only the same minimal deletion fence used by remove().
            // Raw input, summaries, accepted evidence and private text are erased atomically.
            store.put({ key: row.key, ownerId, clientSessionId: row.clientSessionId, deleted: true });
          }
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = transaction.onabort = failed;
      } catch { failed(); }
    });
  }

  async clear(ownerId: string) {
    if (this.clearing.has(ownerId)) throw new Error('This workspace is already being cleared.');
    this.clearing.add(ownerId);
    this.ownerRevisions.set(ownerId, this.ownerRevision(ownerId) + 1);
    const reset = publishWorkspaceReset(ownerId);
    this.resetIds.set(ownerId, reset.id);
    for (const [key, row] of this.memory) if (row.ownerId === ownerId) { this.tombstones.add(key); this.memory.delete(key); }
    const failures: string[] = [];
    try {
      try { await this.clearStoredOwner(ownerId); }
      catch (error) { failures.push(error instanceof Error ? error.message : 'Persistent history deletion could not be confirmed.'); }
      const keys = [`typingforge:v3:${ownerId}:preferences`, typingGameStorageKey(ownerId), ...(ownerId === 'guest' ? ['typingmaster_history', 'typingforge:v3:legacy-history-backup', 'typingforge:v3:history-migrated'] : [])];
      for (const key of keys) { try { globalThis.localStorage?.removeItem(key); } catch { failures.push('A persistent workspace preference could not be removed.'); } }
      try { await (await import('./workspace-extras')).clearWorkspaceExtras(ownerId); } catch (error) { failures.push(error instanceof Error ? error.message : 'Additional workspace data could not be fully removed.'); }
      if (failures.length) throw new Error([...new Set(failures)].join(' '));
    } catch (error) {
      failures.push(error instanceof Error ? error.message : 'Persistent workspace removal could not be confirmed.');
      throw error;
    } finally {
      this.clearing.delete(ownerId);
      this.emit({ type: 'clear', ownerId });
      publishWorkspaceResetResult({ ownerId, succeeded: failures.length === 0, message: failures.length ? `This visit was reset, but some stored data could not be removed. ${[...new Set(failures)].join(' ')}` : 'This device workspace has been reset.' });
    }
  }

  async expireEvidence(now = Date.now(), ownerId?: string) {
    await this.hydrate();
    for (const row of this.memory.values()) {
      if (row.evidenceExpiresAt > now || row.candidate === undefined) continue;
      const next = { ...row, candidate: undefined };
      // Retention removes raw input without reversing a terminal validation decision.
      if (next.state !== 'synced' && next.state !== 'rejected') Object.assign(next, { state: 'local-only', errorCode: 'evidence-expired', message: 'Replay evidence expired. The personal summary is retained; cloud validation is unavailable.' });
      await this.save(next);
    }
    const owners = new Set([...this.memory.values()].map(row => row.ownerId));
    if (ownerId) owners.add(ownerId);
    for (const owner of owners) {
      try {
        if (globalThis.localStorage?.getItem(`sparowtype.arcade.v1:${encodeURIComponent(owner)}`)) (await import('@/games/engine/records')).arcadeData.expire(owner, now);
      } catch { this.storageError = 'Some arcade replay evidence could not be expired in persistent storage. Open Arcade to recover or remove its records.'; }
    }
  }

  /** Import retains the original key as a recoverable backup; retry is deduplicated by ID. */
  async migrateLegacy(storage?: Pick<Storage, 'getItem' | 'setItem'>): Promise<{ imported: number; invalid: number }> {
    let imported = 0; let invalid = 0;
    const revision = this.ownerRevision('guest');
    try {
      const source = storage ?? globalThis.localStorage;
      const raw = source?.getItem('typingmaster_history');
      if (!raw) return { imported, invalid };
      const legacy = JSON.parse(raw);
      if (!Array.isArray(legacy)) return { imported, invalid: 1 };
      try{source.setItem('typingforge:v3:legacy-history-backup', raw);}catch{this.storageError='Legacy history was imported from its untouched original; an additional backup could not be written.';}
      for (const [index, value] of legacy.entries()) {
        if (!validLegacyResult(value)) { invalid++; continue; }
        const id = value.id || `legacy-${index}-${value.date}`;
        if (await this.get('guest', id)||this.tombstones.has(keyFor('guest',id))) continue;
        const summary = { ...value, id };
        await this.save({ schemaVersion: 3, ownerId: 'guest', clientSessionId: id, summary, payloadVersion: 'legacy-unverified', payloadHash: await payloadIdentity(summary), privateContent: false, cloudConsent: false, provenance: 'legacy', state: 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: Date.parse(value.date), evidenceExpiresAt: 0, message: 'Imported history uses legacy metrics and is excluded from ranked comparisons.' }, revision);
        imported++;
      }
      if (!invalid && this.storageMode === 'indexeddb') source.setItem('typingforge:v3:history-migrated', 'complete');
    } catch { invalid++; }
    return { imported, invalid };
  }

  async importGuest(ownerId: string): Promise<number> {
    if (ownerId === 'guest') return 0;
    const revision = this.ownerRevision(ownerId);
    let imported = 0;
    for (const guest of await this.list('guest')) {
      const id = `guest-import:${guest.clientSessionId}`;
      if (await this.get(ownerId, id)||this.tombstones.has(keyFor(ownerId,id))) continue;
      const record: SessionRecord = { ...guest, ownerId, clientSessionId: id, summary: { ...guest.summary, id }, provenance: 'guest-import', state: 'local-only', cloudConsent: false, accepted: undefined, message: 'Imported guest history. Personal only; use a new session for verified comparisons.' };
      await this.save(record, revision); imported++;
    }
    return imported;
  }
}

function validLegacyResult(value: unknown): value is TestResult {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<TestResult>;
  const numericFields = ['wpm', 'rawWpm', 'accuracy', 'duration', 'correctChars', 'incorrectChars', 'totalChars', 'errors', 'consistency'] as const;
  return typeof row.mode === 'string' && typeof row.date === 'string' && Number.isFinite(Date.parse(row.date)) && numericFields.every(key => typeof row[key] === 'number' && Number.isFinite(row[key]) && row[key] >= 0) && row.accuracy! <= 100 && Array.isArray(row.wpmHistory) && row.wpmHistory.every(n => typeof n === 'number' && Number.isFinite(n));
}

export const sessionRepository = new SessionRepository();
