import type { TestResult } from '@/lib/typing-engine';
import type { SessionMetricValues } from '@/lib/typing-core/types';

export const STORAGE_VERSION = 3;
export const EVIDENCE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
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
type Stored = SessionRecord & { key: string };
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
  storageMode: StorageMode = 'memory';
  storageError: string | null = null;

  subscribe = (listener: Listener) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(event: RepositoryEvent) { this.listeners.forEach(listener => listener(event)); }

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
        request.onblocked = () => { this.storageError = 'Close older Typing Forge tabs to enable durable storage.'; resolve(null); };
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
        request.onsuccess = () => { for (const row of request.result as Array<Stored & {deleted?:boolean}>) { if(row.deleted){this.tombstones.add(row.key);this.memory.delete(row.key);} else if (!this.memory.has(row.key)&&!this.tombstones.has(row.key)) this.memory.set(row.key, row); } };
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
    await this.hydrate();
    const row = this.memory.get(keyFor(ownerId, sessionId));
    return row ? copy(row) : null;
  }
  async isDeleted(ownerId:string,sessionId:string){await this.hydrate();return this.tombstones.has(keyFor(ownerId,sessionId));}

  async list(ownerId: string): Promise<SessionRecord[]> {
    await this.hydrate();
    return Array.from(this.memory.values()).filter(row => row.ownerId === ownerId).sort((a, b) => b.createdAt - a.createdAt).map(copy);
  }

  async save(record: SessionRecord): Promise<SessionRecord> {
    await this.hydrate();
    const key = keyFor(record.ownerId, record.clientSessionId);
    if(this.tombstones.has(key))throw new Error('This session was deleted and cannot be recreated.');
    const previous = this.memory.get(key);
    if (previous && previous.payloadHash !== record.payloadHash) throw new Error('This session ID already belongs to different immutable evidence.');
    if (record.privateContent && !record.cloudConsent && record.state !== 'local-only') throw new Error('Private content requires explicit cloud-storage consent.');
    const row = copy({ ...record, key });
    this.memory.set(key, row);
    await this.persist(store => store.put(row));
    this.emit({ type: 'save', ownerId: row.ownerId, sessionId: row.clientSessionId });
    return copy(row);
  }

  async remove(ownerId: string, sessionId: string) {
    await this.hydrate();
    const key = keyFor(ownerId, sessionId);
    this.memory.delete(key);
    this.tombstones.add(key);
    await this.persist(store => store.put({key,ownerId,clientSessionId:sessionId,deleted:true}));
    this.emit({ type: 'remove', ownerId, sessionId });
  }

  async clear(ownerId: string) {
    const rows = await this.list(ownerId);
    for (const row of rows) await this.remove(ownerId, row.clientSessionId);
    try {
      globalThis.localStorage?.removeItem(`typingforge:v3:${ownerId}:preferences`);
      if(ownerId==='guest')for(const key of ['typingmaster_history','typingforge:v3:legacy-history-backup','typingforge:v3:history-migrated'])globalThis.localStorage?.removeItem(key);
    }catch{/* Durable session removal still succeeds when preference storage is blocked. */}
    this.emit({ type: 'clear', ownerId });
  }

  async expireEvidence(now = Date.now()) {
    await this.hydrate();
    for (const row of this.memory.values()) {
      if (row.evidenceExpiresAt > now || row.candidate === undefined) continue;
      const next = { ...row, candidate: undefined };
      if (next.state !== 'synced') Object.assign(next, { state: 'local-only', errorCode: 'evidence-expired', message: 'Replay evidence expired. The personal summary is retained; cloud validation is unavailable.' });
      await this.save(next);
    }
  }

  /** Import retains the original key as a recoverable backup; retry is deduplicated by ID. */
  async migrateLegacy(storage?: Pick<Storage, 'getItem' | 'setItem'>): Promise<{ imported: number; invalid: number }> {
    let imported = 0; let invalid = 0;
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
        await this.save({ schemaVersion: 3, ownerId: 'guest', clientSessionId: id, summary, payloadVersion: 'legacy-unverified', payloadHash: await payloadIdentity(summary), privateContent: false, cloudConsent: false, provenance: 'legacy', state: 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: Date.parse(value.date), evidenceExpiresAt: 0, message: 'Imported history uses legacy metrics and is excluded from ranked comparisons.' });
        imported++;
      }
      if (!invalid && this.storageMode === 'indexeddb') source.setItem('typingforge:v3:history-migrated', 'complete');
    } catch { invalid++; }
    return { imported, invalid };
  }

  async importGuest(ownerId: string): Promise<number> {
    if (ownerId === 'guest') return 0;
    let imported = 0;
    for (const guest of await this.list('guest')) {
      const id = `guest-import:${guest.clientSessionId}`;
      if (await this.get(ownerId, id)||this.tombstones.has(keyFor(ownerId,id))) continue;
      const record: SessionRecord = { ...guest, ownerId, clientSessionId: id, summary: { ...guest.summary, id }, provenance: 'guest-import', state: 'local-only', cloudConsent: false, accepted: undefined, message: 'Imported guest history. Personal only; use a new session for verified comparisons.' };
      await this.save(record); imported++;
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
