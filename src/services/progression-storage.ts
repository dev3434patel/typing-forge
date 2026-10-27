import { emptyProfile, rebuildProfile } from '@/domain/progression/engine';
import type { ActivityFact, Profile, ProgressionCommand } from '@/domain/progression/types';
export interface ProgressionEnvelope { version: 1; ownerId: string; receipts: ActivityFact[]; commands: ProgressionCommand[]; pending: string[]; failures?: Record<string, string>; resetAt?: number }
export interface StoredProgression { envelope: ProgressionEnvelope; profile: Profile; mode: 'indexeddb' | 'localstorage' | 'memory'; warning: string | null }
const DATABASE = 'sparowtype-progression', STORE = 'owners', PREFIX = 'sparowtype:progression:v1:';
const RESET_PREFIX = 'sparowtype:progression-reset:v1:';
const memory = new Map<string, ProgressionEnvelope>();
const memoryDirty = new Set<string>();
const queues = new Map<string, Promise<unknown>>();
const generations = new Map<string, number>();
const invalidations = new Set<(ownerId: string) => void>();
export const progressionGeneration = (ownerId: string): number => generations.get(ownerId) ?? 0;
export function onProgressionInvalidated(listener: (ownerId: string) => void): () => void { invalidations.add(listener); return () => invalidations.delete(listener); }
export function invalidateProgressionWork(ownerId: string): void { generations.set(ownerId, progressionGeneration(ownerId) + 1); invalidations.forEach(listener => listener(ownerId)); }
function assertGeneration(ownerId: string, generation: number) { if (progressionGeneration(ownerId) !== generation) throw new Error('Progression changed while this operation was pending.'); }
let database: Promise<IDBDatabase> | null = null;
function empty(ownerId: string): ProgressionEnvelope { return { version: 1, ownerId, receipts: [], commands: [], pending: [] }; }
function resetMarker(ownerId: string): number { const inMemory = memory.get(ownerId)?.resetAt ?? 0; try { const raw = localStorage.getItem(RESET_PREFIX + ownerId); const value = raw === null ? 0 : Number(raw); if (!Number.isFinite(value) || value < 0) throw new Error('Stored progression reset metadata is unreadable; its original copy has been retained.'); return Math.max(value, inMemory); } catch (error) { if (error instanceof Error && /Stored progression/.test(error.message)) throw error; return inMemory; } }
function decode(raw: unknown, ownerId: string): ProgressionEnvelope {
  if (!raw || typeof raw !== 'object') throw new Error('Stored progression is unreadable; its original copy has been retained.');
  const source = raw as ProgressionEnvelope & { version: number };
  // Only the documented v0 receipt-envelope shape is migratable. Unknown data is retained untouched.
  const value = source.version === (0 as number) && source.ownerId === ownerId && Array.isArray(source.receipts) && Array.isArray(source.commands)
    ? { ...source, version: 1 as const, pending: source.pending ?? [] } : source;
  if (value.version !== 1 || value.ownerId !== ownerId || !Array.isArray(value.receipts) || !Array.isArray(value.commands) || !Array.isArray(value.pending) || value.pending.some(id => typeof id !== 'string')) throw new Error('Stored progression has an unsupported schema; its original copy has been retained.');
  if (value.resetAt !== undefined && (typeof value.resetAt !== 'number' || !Number.isFinite(value.resetAt) || value.resetAt < 0)) throw new Error('Stored progression reset metadata is unreadable; its original copy has been retained.');
  const resetAt = Math.max(value.resetAt ?? 0, resetMarker(ownerId));
  if (resetAt) { value.resetAt = resetAt; value.receipts = value.receipts.filter(receipt => (receipt.startedAt ?? receipt.at) > resetAt); value.commands = value.commands.filter(command => command.at > resetAt); const identities = new Set(value.receipts.map(receipt => receipt.id)); value.pending = value.pending.filter(id => identities.has(id)); }
  rebuildProfile(ownerId, 'local', value.receipts, value.commands); return value;
}
function db(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  database ??= new Promise((resolve, reject) => { const request = indexedDB.open(DATABASE, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'ownerId' }); request.onsuccess = () => { const result = request.result; result.onversionchange = () => { result.close(); database = null; }; resolve(result); }; request.onerror = () => { database = null; reject(request.error); }; request.onblocked = () => { database = null; reject(new Error('Progression storage upgrade is blocked by another tab.')); }; });
  return database;
}
function result(envelope: ProgressionEnvelope, mode: StoredProgression['mode'], warning: string | null = null): StoredProgression { return { envelope, profile: rebuildProfile(envelope.ownerId, 'local', envelope.receipts, envelope.commands), mode, warning }; }
export async function readProgression(ownerId: string): Promise<StoredProgression> {
  let connection: IDBDatabase;
  try { connection = await db(); } catch { return fallbackRead(ownerId); }
  return new Promise((resolve, reject) => { const request = connection.transaction(STORE).objectStore(STORE).get(ownerId); request.onsuccess = () => { try { const envelope = decode(request.result === undefined ? empty(ownerId) : request.result, ownerId); memory.set(ownerId, envelope); resolve(result(envelope, 'indexeddb')); } catch (error) { reject(error); } }; request.onerror = () => reject(request.error); });
}
function fallbackRead(ownerId: string): StoredProgression {
  if (memoryDirty.has(ownerId) && memory.has(ownerId)) return result(decode(memory.get(ownerId)!, ownerId), 'memory', 'Some progression changes could not be persisted. Export receipts before closing this visit.');
  try { const raw = localStorage.getItem(PREFIX + ownerId); const envelope = decode(raw === null ? memory.get(ownerId) ?? empty(ownerId) : JSON.parse(raw), ownerId); memory.set(ownerId, envelope); return result(envelope, 'localstorage', 'IndexedDB is unavailable. Progression is stored in this browser’s local storage.'); }
  catch (error) { if (error instanceof SyntaxError || (error instanceof Error && /Stored progression/.test(error.message))) throw new Error('Progression storage is damaged. It was preserved; export the original copy before resetting.'); return result(memory.get(ownerId) ?? empty(ownerId), 'memory', 'Persistent storage is unavailable. Progression lasts for this visit only.'); }
}
export function updateProgression(ownerId: string, change: (current: ProgressionEnvelope) => ProgressionEnvelope, generation = progressionGeneration(ownerId)): Promise<StoredProgression> {
  const previous = queues.get(ownerId) ?? Promise.resolve();
  const work = previous.catch(() => {}).then(async () => {
    assertGeneration(ownerId, generation);
    let connection: IDBDatabase;
    try { connection = await db(); } catch {
      const fallback = () => { assertGeneration(ownerId, generation); const old = fallbackRead(ownerId); const envelope = decode(change(structuredClone(old.envelope)), ownerId); const serialized = JSON.stringify(envelope); if (serialized.length > 8_000_000) throw new Error('Progression storage is full. Export your receipts before continuing.'); assertGeneration(ownerId, generation); memory.set(ownerId, envelope); try { localStorage.setItem(PREFIX + ownerId, serialized); memoryDirty.delete(ownerId); return result(envelope, 'localstorage', old.warning); } catch { memoryDirty.add(ownerId); return result(envelope, 'memory', 'Storage is full or blocked. This change is retained in memory; export it before closing.'); } };
      return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request(`progression:${ownerId}`, fallback) : fallback();
    }
    assertGeneration(ownerId, generation);
    return new Promise<StoredProgression>((resolve, reject) => {
      const transaction = connection.transaction(STORE, 'readwrite'), store = transaction.objectStore(STORE), request = store.get(ownerId); let envelope: ProgressionEnvelope;
      request.onsuccess = () => { try { assertGeneration(ownerId, generation); envelope = decode(change(request.result === undefined ? empty(ownerId) : decode(request.result, ownerId)), ownerId); if (JSON.stringify(envelope).length > 8_000_000) throw new Error('Progression storage is full. Export receipts before continuing.'); assertGeneration(ownerId, generation); store.put(envelope); } catch (error) { transaction.abort(); reject(error); } };
      transaction.oncomplete = () => { memory.set(ownerId, envelope); resolve(result(envelope, 'indexeddb')); };
      transaction.onerror = () => reject(transaction.error ?? new Error('Progression could not be saved. Previous receipts remain intact.'));
    });
  });
  queues.set(ownerId, work); void work.finally(() => { if (queues.get(ownerId) === work) queues.delete(ownerId); }).catch(() => {}); return work;
}
export async function clearProgression(ownerId: string): Promise<void> {
  invalidateProgressionWork(ownerId);
  const resetAt = Date.now();
  try { localStorage.setItem(RESET_PREFIX + ownerId, String(resetAt)); } catch { /* The primary transaction retains its own reset tombstone. */ }
  await (queues.get(ownerId) ?? Promise.resolve()).catch(() => {}); memory.delete(ownerId); memoryDirty.delete(ownerId);
  const tombstone = { ...empty(ownerId), resetAt }; memory.set(ownerId, tombstone); memoryDirty.add(ownerId);
  let fallbackSaved = false;
  try { localStorage.setItem(PREFIX + ownerId, JSON.stringify(tombstone)); fallbackSaved = true; memoryDirty.delete(ownerId); } catch { /* The in-memory tombstone remains authoritative for this visit. */ }
  try { const connection = await db(); await new Promise<void>((resolve, reject) => { const transaction = connection.transaction(STORE, 'readwrite'); transaction.objectStore(STORE).put(tombstone); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); }); } catch (error) { if (typeof indexedDB !== 'undefined') throw error; if (!fallbackSaved) throw new Error('Persistent storage refused the progression reset. This visit is cleared, but the stored copy could not be cleared; retry when storage is available.'); }
}
export function emptyLocalProfile(ownerId: string): Profile { return emptyProfile(ownerId); }
export async function exportProgression(ownerId: string) { const stored = await readProgression(ownerId); return { ...stored.envelope, verification: 'local', retention: 'Derived receipts contain aggregate skill statistics and source hashes; original replay follows session retention.' }; }
/** Recovery export intentionally avoids decoding/overwriting the original damaged envelope. */
export async function exportRawProgression(ownerId: string): Promise<{ ownerId: string; indexeddb: unknown; localstorage: string | null; memory: ProgressionEnvelope | null; resetMetadata: string | null }> {
  let indexeddb: unknown = null, local: string | null = null, resetMetadata: string | null = null;
  try { const connection = await db(); indexeddb = await new Promise((resolve, reject) => { const request = connection.transaction(STORE).objectStore(STORE).get(ownerId); request.onsuccess = () => resolve(request.result ?? null); request.onerror = () => reject(request.error); }); } catch { /* Export any independently accessible fallback copy. */ }
  try { local = localStorage.getItem(PREFIX + ownerId); resetMetadata = localStorage.getItem(RESET_PREFIX + ownerId); } catch { /* Blocked storage cannot be read through another mechanism. */ }
  return { ownerId, indexeddb, localstorage: local, memory: memory.get(ownerId) ?? null, resetMetadata };
}
