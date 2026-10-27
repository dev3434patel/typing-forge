import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionRepository, type SessionRecord } from '../session-repository';

vi.mock('../workspace-extras', () => ({ clearWorkspaceExtras: vi.fn().mockResolvedValue(undefined) }));

const record = (ownerId = 'alice'): SessionRecord => ({
  schemaVersion: 3, ownerId, clientSessionId: 'one', payloadVersion: 'forge-v3', payloadHash: 'immutable',
  summary: { id: 'one', wpm: 12, rawWpm: 14, accuracy: 90, consistency: 60, mode: 'time', duration: 30, correctChars: 30, incorrectChars: 2, totalChars: 32, errors: 4, date: '2026-10-15T00:00:00Z', wpmHistory: [12] },
  candidate: { events: [] }, privateContent: false, cloudConsent: false, provenance: 'observed', state: 'queued', attempts: 0, nextAttemptAt: 0, createdAt: 100, evidenceExpiresAt: 10000,
});

// An asynchronous durable-store fixture, independent of the repository's visible cache.
// Native IndexedDB deletion is additionally covered by the browser reset suite.
function durableDatabase(rows: Record<string, unknown>[], abortWrites = false) {
  const data = new Map(rows.map(row => [row.key, structuredClone(row)]));
  const database = {
    transaction(_name: string, mode: string) {
      const transaction: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; objectStore?: () => unknown } = {};
      const store = {
        getAll() {
          const request: { result?: unknown[]; onsuccess?: () => void } = {};
          queueMicrotask(() => {
            if (mode === 'readwrite' && abortWrites) { transaction.onabort?.(); return; }
            request.result = structuredClone([...data.values()]); request.onsuccess?.();
            queueMicrotask(() => transaction.oncomplete?.());
          });
          return request;
        },
        put(value: Record<string, unknown>) { data.set(value.key, structuredClone(value)); },
      };
      transaction.objectStore = () => store;
      return transaction;
    },
  };
  const factory = { open() {
    const request: { result: typeof database; onsuccess?: () => void } = { result: database };
    queueMicrotask(() => request.onsuccess?.()); return request;
  } };
  return { data, factory };
}
afterEach(() => vi.unstubAllGlobals());
describe('durable owner deletion before history hydration', () => {
  it('erases cold raw rows atomically while preserving another owner and a permanent deletion fence', async () => {
    const alice = { ...record('alice'), key: 'v3:alice:one', candidate: { privatePassage: 'never retain this raw text' }, accepted: { privatePassage: 'accepted private evidence' } };
    const bob = { ...record('bob'), key: 'v3:bob:one' };
    const { data, factory } = durableDatabase([alice, bob]); vi.stubGlobal('indexedDB', factory);
    const repository = new SessionRepository();
    // Deliberately do not hydrate/list/get first: that was the privacy regression.
    await repository.clear('alice');
    expect(data.get('v3:alice:one')).toEqual({ key: 'v3:alice:one', ownerId: 'alice', clientSessionId: 'one', deleted: true });
    expect(data.get('v3:bob:one')).toEqual(bob);
    const reopened = new SessionRepository();
    expect(await reopened.list('alice')).toEqual([]);
    expect((await reopened.list('bob')).map(row => row.clientSessionId)).toEqual(['one']);
    await expect(reopened.save(record('alice'))).rejects.toThrow('deleted');
    repository.dispose(); reopened.dispose();
  });
  it('reports a durable deletion failure and still clears this visit instead of announcing success', async () => {
    const { data, factory } = durableDatabase([{ ...record(), key: 'v3:alice:one' }], true); vi.stubGlobal('indexedDB', factory);
    const repository = new SessionRepository();
    await expect(repository.clear('alice')).rejects.toThrow('Persistent history deletion could not be confirmed');
    expect(data.get('v3:alice:one')).toHaveProperty('candidate');
    expect(await repository.list('alice')).toEqual([]);
    repository.dispose();
  });
});
