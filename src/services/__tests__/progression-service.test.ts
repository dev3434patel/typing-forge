import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ActivityFact } from '@/domain/progression/types';
const state = vi.hoisted(() => ({ owner: 'guest', hash: vi.fn(), claim: vi.fn(), getSource: vi.fn(), isDeleted: vi.fn(), subscriptions: [] as ((session: { user: { id: string } | null }) => void)[] }));
vi.mock('../php-api', () => ({ isBackendConfigured: true, ApiError: class extends Error { constructor(public code: string, message: string, public status: number) { super(message); } }, authService: { currentSession: () => ({ user: state.owner === 'guest' ? null : { id: state.owner } }), subscribe: (listener: (session: { user: { id: string } | null }) => void) => { state.subscriptions.push(listener); return () => {}; } } }));
vi.mock('../session-repository', () => ({ payloadIdentity: (...args: unknown[]) => state.hash(...args), sessionRepository: { list: async () => [], get: (...args: unknown[]) => state.getSource(...args), isDeleted: (...args: unknown[]) => state.isDeleted(...args), subscribe: () => () => {} } }));
vi.mock('../progression-api', () => ({ ProgressionAccountAdapter: class { constructor(readonly owner: string, readonly signal?: AbortSignal) {} claim(id: string) { return state.claim(id, this.owner, this.signal); } } }));
vi.mock('@/domain/progression/facts', () => ({ comparableThirtySecondBest: () => false, factFromSession: (result: { ownerScope: string; clientSessionId: string; finishedAtWall: number }, hash: string) => ({ version: 1, id: result.clientSessionId, ownerId: result.ownerScope, verification: 'local', payloadHash: hash, at: result.finishedAtWall, timeZone: 'UTC', kind: 'practice', completedChars: 10, attempts: 10, correctAttempts: 10, lessonQualified: false, raceWin: false, personalBest30: false, skills: [] } satisfies ActivityFact) }));
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
function result(owner: string, id: string) { return { ownerScope: owner, clientSessionId: id, finishedAtWall: Date.now() + 20, startedAtWall: Date.now() + 10, configuration: { mode: 'zen' } } as never; }
beforeEach(() => { vi.resetModules(); vi.stubGlobal('indexedDB', undefined); state.owner = 'guest'; state.hash.mockReset().mockResolvedValue('hash'); state.isDeleted.mockReset().mockResolvedValue(false); state.claim.mockReset().mockResolvedValue({}); state.getSource.mockReset().mockImplementation(async (owner: string, id: string) => ({ provenance: 'observed', payloadVersion: 'forge-v3', payloadHash: 'hash', evidenceExpiresAt: Date.now() + 86400000, candidate: { schemaVersion: 3, ownerScope: owner, clientSessionId: id } })); state.subscriptions.length = 0; });
afterEach(() => vi.unstubAllGlobals());
it('does not resurrect a completed result when reset happens during asynchronous hashing', async () => {
  const hashing = deferred<string>(); state.hash.mockReturnValueOnce(hashing.promise);
  const service = await import('../progression-service'), storage = await import('../progression-storage');
  const saving = service.claimProgression(result('guest', 'stale'));
  await storage.clearProgression('guest'); hashing.resolve('hash'); await saving;
  expect((await storage.readProgression('guest')).profile.receipts).toHaveLength(0);
});
it('does not mint an old award when a lazy import starts only after its source was cleared', async () => { const storage = await import('../progression-storage'); await storage.clearProgression('guest'); state.getSource.mockResolvedValue(null); const service = await import('../progression-service'); await service.claimProgression(result('guest', 'deleted-before-import')); expect((await storage.readProgression('guest')).profile.receipts).toHaveLength(0); });
it('does not mint a new local award from an expired summary without retained evidence', async () => { state.getSource.mockResolvedValue({ provenance: 'observed', payloadVersion: 'forge-v3', payloadHash: 'hash', evidenceExpiresAt: Date.now() - 1, candidate: undefined }); const service = await import('../progression-service'), storage = await import('../progression-storage'); await service.claimProgression(result('guest', 'expired')); expect((await storage.readProgression('guest')).profile.xp).toBe(0); });
it('does not write the previous account after authentication changes during hashing', async () => {
  state.owner = 'alice'; const hashing = deferred<string>(); state.hash.mockReturnValueOnce(hashing.promise);
  const service = await import('../progression-service'), storage = await import('../progression-storage');
  const saving = service.claimProgression(result('alice', 'stale')); state.owner = 'bob'; hashing.resolve('hash'); await saving;
  expect((await storage.readProgression('alice')).profile.receipts).toHaveLength(0); expect(state.claim).not.toHaveBeenCalled();
});
it('aborts pending sync on owner change and does not acknowledge into a new workspace', async () => {
  state.owner = 'alice'; const response = deferred<unknown>(); state.claim.mockReturnValue(response.promise);
  const service = await import('../progression-service'), storage = await import('../progression-storage');
  const saving = service.claimProgression(result('alice', 'pending'));
  await vi.waitFor(() => expect(state.claim).toHaveBeenCalledTimes(1));
  const signal = state.claim.mock.calls[0][2] as AbortSignal;
  state.owner = 'bob'; state.subscriptions.forEach(listener => listener({ user: { id: 'bob' } })); expect(signal.aborted).toBe(true);
  response.resolve({}); await saving;
  expect((await storage.readProgression('alice')).envelope.pending).toEqual(['pending']); expect((await storage.readProgression('bob')).profile.receipts).toHaveLength(0);
});
it('aborts a pending sync when the owner clears device data', async () => {
  state.owner = 'alice'; const response = deferred<unknown>(); state.claim.mockReturnValue(response.promise);
  const service = await import('../progression-service'), storage = await import('../progression-storage');
  const saving = service.claimProgression(result('alice', 'pending-clear')); await vi.waitFor(() => expect(state.claim).toHaveBeenCalledTimes(1));
  const signal = state.claim.mock.calls[0][2] as AbortSignal;
  await storage.clearProgression('alice'); expect(signal.aborted).toBe(true); response.resolve({}); await saving;
  expect((await storage.readProgression('alice')).profile.receipts).toHaveLength(0);
});
it('keeps repeated local-only game claims local and idempotent', async () => {
  state.owner = 'alice'; const service = await import('../progression-service'), storage = await import('../progression-storage');
  await service.claimProgression(result('alice', 'game'), { localOnly: true }); await service.claimProgression(result('alice', 'game'), { localOnly: true });
  expect((await storage.readProgression('alice')).profile.xp).toBe(10); expect((await storage.readProgression('alice')).envelope.pending).toHaveLength(0); expect(state.claim).not.toHaveBeenCalled();
});

it('drops a deleted source reference before any RPC while preserving its earned receipt', async () => { state.owner = 'alice'; const service = await import('../progression-service'), storage = await import('../progression-storage'); await service.claimProgression(result('alice', 'deleted-pending'), { localOnly: true }); const earned = (await storage.readProgression('alice')).profile; await storage.updateProgression('alice', envelope => ({ ...envelope, pending: ['deleted-pending'] })); state.isDeleted.mockResolvedValue(true); const changed = vi.fn(), stop = service.subscribeProgression(changed); await service.syncProgression('alice'); stop(); const after = await storage.readProgression('alice'); expect(state.isDeleted).toHaveBeenCalledWith('alice', 'deleted-pending'); expect(state.claim).not.toHaveBeenCalled(); expect(after.envelope.pending).toEqual([]); expect(after.profile.receipts).toEqual(earned.receipts); expect(after.profile.xp).toBe(earned.xp); expect(after.profile.ledger).toEqual(earned.ledger); expect(changed).toHaveBeenCalledWith('alice'); });
