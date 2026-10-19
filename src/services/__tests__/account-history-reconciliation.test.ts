import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadAccountHistory } from '../account-data';
import { SessionRepository, sessionRepository, type SessionRecord } from '../session-repository';

const api = vi.hoisted(() => ({ getSession: vi.fn(), dataVersion: vi.fn(), history: vi.fn() }));
vi.mock('../php-api', () => ({ isBackendConfigured: true, authService: { getSession: api.getSession }, accountApi: { dataVersion: api.dataVersion, history: api.history } }));
vi.mock('@/lib/keybr-engine', () => ({ reconcileLearningSessions: vi.fn() }));
const record = (id: string, state: SessionRecord['state'] = 'synced'): SessionRecord => ({
  schemaVersion: 3, ownerId: 'alice', clientSessionId: id, payloadVersion: 'forge-v3', payloadHash: id,
  summary: { id, wpm: 40, rawWpm: 42, accuracy: 98, consistency: 70, mode: 'time', duration: 30, correctChars: 100, incorrectChars: 0, totalChars: 100, errors: 2, date: '2026-10-19T00:00:00Z', wpmHistory: [] },
  candidate: { id }, privateContent: false, cloudConsent: false, provenance: 'observed', state, attempts: 1, nextAttemptAt: 0, createdAt: 1, evidenceExpiresAt: 100000,
});
let repository: SessionRepository;
beforeEach(() => {
  repository = new SessionRepository();
  for (const method of ['get', 'list', 'save', 'remove', 'isDeleted'] as const) vi.spyOn(sessionRepository, method).mockImplementation(repository[method].bind(repository) as never);
  api.getSession.mockReset().mockResolvedValue({ user: { id: 'alice' }, csrfToken: 'fixture' });
  api.dataVersion.mockReset().mockResolvedValue({ version: 7 });
  api.history.mockReset().mockResolvedValue({ sessions: [], learningEvidence: [], version: 7, hasMore: false });
});
afterEach(() => vi.restoreAllMocks());
function snapshot(onFinalRead: () => Promise<void> = async () => {}) {
  let versions = 0;
  api.dataVersion.mockImplementation(async () => { if (++versions === 2) await onFinalRead(); return { version: 7 }; });
}
describe('PHP history deletion reconciliation', () => {
  it('removes an old accepted row missing from a stable snapshot while retaining queued evidence', async () => {
    await repository.save(record('deleted-on-another-device')); await repository.save(record('pending', 'queued'));
    snapshot(); await downloadAccountHistory('alice');
    expect(await repository.get('alice', 'deleted-on-another-device')).toBeNull();
    expect(await repository.isDeleted('alice', 'deleted-on-another-device')).toBe(true);
    expect((await repository.get('alice', 'pending'))?.state).toBe('queued');
    expect(api.history).toHaveBeenCalledWith(0, 500, 'alice');
  });
  it('does not tombstone a result saved after the snapshot was read', async () => {
    snapshot(async () => { await repository.save(record('just-uploaded')); });
    await downloadAccountHistory('alice');
    expect((await repository.get('alice', 'just-uploaded'))?.state).toBe('synced');
    expect(await repository.isDeleted('alice', 'just-uploaded')).toBe(false);
  });
  it('does not treat an in-flight queued upload as a remotely deleted old result', async () => {
    await repository.save(record('in-flight', 'syncing')); snapshot(async () => { await repository.save(record('in-flight')); });
    await downloadAccountHistory('alice');
    expect((await repository.get('alice', 'in-flight'))?.state).toBe('synced');
    expect(await repository.isDeleted('alice', 'in-flight')).toBe(false);
  });
  it('does not apply buffered remote rows after an account swap', async () => {
    const value = record('remote');
    api.history.mockResolvedValue({ sessions: [{ clientSessionId: value.clientSessionId, summary: value.summary, metricsVersion: 'forge-v3', createdAt: 1, payloadHash: value.payloadHash, accepted: {} }], learningEvidence: [], version: 7, hasMore: false });
    api.getSession.mockResolvedValueOnce({ user: { id: 'alice' } }).mockResolvedValue({ user: { id: 'bob' } });
    await expect(downloadAccountHistory('alice')).rejects.toThrow('account changed');
    expect(await repository.get('alice', 'remote')).toBeNull();
  });
});
