import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionController } from '@/lib/typing-core';
import type { SessionRecord } from '@/services/session-repository';

const fixture = vi.hoisted(() => ({
  published: vi.fn(), rows: new Map<string, SessionRecord>(),
  hashingStarted: vi.fn(),
  hashing: new Map<string, { promise: Promise<string>; resolve: (value: string) => void }>(),
}));
// This test isolates asynchronous persistence/status ordering; rendered interaction
// and actual WebCrypto delays are independently exercised in the browser suite.
vi.mock('react', () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: vi.fn(),
  useRef: (current: unknown) => ({ current }),
  useState: (initial: unknown) => [initial, fixture.published],
}));
vi.mock('./useAuth', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/services/php-api', () => ({ accountApi: {}, ApiError: Error, authService: {}, isBackendConfigured: false }));
vi.mock('@/services/account-data', () => ({ downloadAccountHistory: vi.fn() }));
vi.mock('@/services/session-repository', () => ({
  EVIDENCE_TTL_MS: 90 * 86400000,
  payloadIdentity: (value: { clientSessionId?: string; id?: string }) => {
    const id = value.clientSessionId ?? value.id!;
    fixture.hashingStarted(id);
    return fixture.hashing.get(id)?.promise ?? Promise.resolve(`hash:${id}`);
  },
  sessionRepository: {
    storageMode: 'memory', storageError: null,
    migrateLegacy: async () => undefined, expireEvidence: async () => undefined,
    get: async (owner: string, id: string) => fixture.rows.get(`${owner}:${id}`) ?? null,
    save: async (row: SessionRecord) => { fixture.rows.set(`${row.ownerId}:${row.clientSessionId}`, row); return row; },
  },
}));
import { useTestResults } from './useTestResults';

function result(id: string, owner = 'guest') {
  let now = 0;
  const controller = new SessionController({ clientSessionId: id, ownerScope: owner, mode: 'custom', language: 'en',
    script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard', initialTarget: 'cat', scoringPolicy: 'prose',
    correctionPolicy: 'current-word', privacy: 'private-custom' }, { now: () => now, wallNow: () => 1_792_510_000_000 + now });
  for (const text of 'cat') { now += 100; controller.input({ type: 'insert', text }); }
  return controller.result!;
}
function hold(id: string) {
  let resolve!: (value: string) => void;
  const promise = new Promise<string>(done => { resolve = done; });
  fixture.hashing.set(id, { promise, resolve });
  return () => resolve(`hash:${id}`);
}
beforeEach(() => { fixture.published.mockClear(); fixture.hashingStarted.mockClear(); fixture.rows.clear(); fixture.hashing.clear(); });

describe('save status follows the most recently requested result', () => {
  it('persists an older late completion without replacing the newer result status', async () => {
    const finishOld = hold('old');
    const hook = useTestResults();
    const oldSave = hook.saveSession(result('old'));
    await hook.saveSession(result('new'));
    const before = fixture.published.mock.calls.length;
    finishOld(); await oldSave;
    expect(fixture.rows.size).toBe(2);
    expect(fixture.published.mock.calls).toHaveLength(before);
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'new', message: 'Private content saved on this device. Cloud storage requires your consent.' });
  });
  it('keeps the newer attempt pending when an older save settles first', async () => {
    const finishOld = hold('old'), finishNew = hold('new');
    const hook = useTestResults();
    const oldSave = hook.saveSession(result('old'));
    const newSave = hook.saveSession(result('new'));
    finishOld(); await oldSave;
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'new', message: 'Saving this attempt on this device…' });
    finishNew(); await newSave;
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'new', message: 'Private content saved on this device. Cloud storage requires your consent.' });
  });
  it('saving a former owner result cannot replace or invalidate the active guest status', async () => {
    const finishGuest = hold('current');
    const hook = useTestResults();
    const current = hook.saveSession(result('current'));
    await hook.saveSession(result('foreign', 'former-account'));
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'current' });
    finishGuest(); await current;
    expect(fixture.rows.has('former-account:foreign')).toBe(true);
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'current', message: 'Private content saved on this device. Cloud storage requires your consent.' });
  });
  it('an idempotent retry publishes the current retained row after a slow hash', async () => {
    const hook = useTestResults(), candidate = result('same');
    await hook.saveSession(candidate);
    fixture.hashingStarted.mockClear();
    const finish = hold('same');
    const retry = hook.saveSession(candidate);
    await vi.waitFor(() => expect(fixture.hashingStarted).toHaveBeenCalledWith('same'));
    const row = fixture.rows.get('guest:same')!;
    fixture.rows.set('guest:same', { ...row, candidate: undefined, errorCode: 'evidence-expired', message: 'Replay evidence expired; the summary is retained.' });
    finish(); await retry;
    expect(fixture.published.mock.lastCall?.[0]).toMatchObject({ sessionId: 'same', message: 'Replay evidence expired; the summary is retained.' });
  });
  it('an idempotent retry cannot announce a deleted row as saved after a slow hash', async () => {
    const hook = useTestResults(), candidate = result('same');
    await hook.saveSession(candidate);
    fixture.hashingStarted.mockClear();
    const finish = hold('same');
    const retry = hook.saveSession(candidate);
    await vi.waitFor(() => expect(fixture.hashingStarted).toHaveBeenCalledWith('same'));
    fixture.rows.delete('guest:same');
    const before = fixture.published.mock.calls.length;
    finish(); await expect(retry).rejects.toThrow('deleted');
    expect(fixture.rows.size).toBe(0);
    expect(fixture.published.mock.calls).toHaveLength(before);
  });
});
