import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { arcadeData, arcadeStorageKey } from '../records';
import { ArcadeMachine } from '../arcade-machine';
import { dailyChallenge, featuredGameIndex, utcDate } from '../../modes/daily';
import type { GameEvidence } from '../types';
import { EVIDENCE_TTL_MS } from '@/lib/evidence-policy';

let nextOwner = 0;
class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function evidence(owner: string, id = 'stored-run', wall = Date.now()): GameEvidence {
  let now = 0; const game = new ArcadeMachine({ gameId: 'word-invaders', difficulty: 'normal', variant: 'mission', seed: id, owner, sessionId: id, now: () => now, wallNow: () => wall + now });
  game.start(); now = 100; game.edit(0, 0, game.pool.nearest()!.word); return game.finish();
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('owner-scoped arcade persistence and recovery', () => {
  it('requires an explicit owner rather than defaulting an empty account to guest', () => {
    expect(() => arcadeStorageKey('')).toThrow(); expect(() => arcadeData.export('')).toThrow(); expect(() => arcadeData.clear('')).toThrow(); expect(arcadeStorageKey('a/b')).not.toBe(arcadeStorageKey('a%2Fb'));
  });
  it.each(Array.from({ length: 12 }, (_, i) => i))('clears only owner%s and not another owner or unrelated preference key', index => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}-${index}`, another = owner + '-other'; vi.stubGlobal('localStorage', storage);
    arcadeData.save(owner, evidence(owner)); arcadeData.save(another, evidence(another)); storage.setItem('unrelated-preferences', 'keep');
    arcadeData.clear(owner); expect(arcadeData.read(owner).data.bests).toHaveLength(0); expect(arcadeData.read(another).data.bests).toHaveLength(1); expect(storage.getItem('unrelated-preferences')).toBe('keep');
  });
  it('deduplicates the same canonical result and exports only the selected owner', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage); const result = evidence(owner); arcadeData.save(owner, result); arcadeData.save(owner, result);
    expect(arcadeData.export(owner).arcade.replays).toHaveLength(1); expect(arcadeData.export(owner).arcade.bests).toHaveLength(1); expect(() => arcadeData.save('different', result)).toThrow();
  });
  it('notifies subscribers only after the newest durable result is readable', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage);
    arcadeData.save(owner, evidence(owner, 'first'));
    const observed: string[] = [], stop = arcadeData.subscribe(changed => { if (changed === owner) observed.push(arcadeData.read(owner).data.replays[0].session.clientSessionId); });
    arcadeData.save(owner, evidence(owner, 'second')); stop(); expect(observed).toEqual(['second']);
  });
  it('notifies subscribers after a failed write has selected the new temporary fallback', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage);
    arcadeData.save(owner, evidence(owner, 'first'));
    const observed: string[] = [], stop = arcadeData.subscribe(changed => { if (changed === owner) observed.push(arcadeData.read(owner).data.replays[0].session.clientSessionId); });
    arcadeData.save(owner, evidence(owner, 'second'), { getItem: key => storage.getItem(key), setItem: () => { throw new Error('quota'); } }); stop(); expect(observed).toEqual(['second']);
  });
  it('caps stored canonical replays while retaining the best actual result', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage); for (let i = 0; i < 10; i++) arcadeData.save(owner, evidence(owner, `run-${i}`));
    expect(arcadeData.read(owner).data.replays).toHaveLength(6); expect(arcadeData.read(owner).data.bests).toHaveLength(1);
  });
  it('never returns a durable cached ghost after its persistent key was removed elsewhere', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner)); storage.removeItem(arcadeStorageKey(owner));
    expect(arcadeData.read(owner).data.replays).toEqual([]); expect(arcadeData.export(owner).arcade.bests).toEqual([]);
  });
  it('invalidates only the cleared owner and prevents its already-started result from resurrecting', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`, other = owner + '-other', surface = new EventTarget();
    vi.stubGlobal('localStorage', storage); vi.stubGlobal('window', surface); arcadeData.save(owner, evidence(owner)); arcadeData.save(other, evidence(other)); const before = arcadeData.revision(owner);
    const listener = vi.fn(), stop = arcadeData.subscribe(listener, owner); storage.removeItem(arcadeStorageKey(owner)); const event = new Event('storage'); Object.defineProperties(event, { key: { value: arcadeStorageKey(owner) }, newValue: { value: null } }); surface.dispatchEvent(event);
    expect(listener).toHaveBeenCalledWith(owner, 'clear'); expect(arcadeData.revision(owner)).toBe(before + 1); expect(arcadeData.read(owner).data.replays).toEqual([]);
    expect(arcadeData.save(owner, evidence(owner, 'stale-active'), storage, before).error).toContain('will not restore'); expect(storage.getItem(arcadeStorageKey(owner))).toBeNull(); expect(arcadeData.read(other).data.bests).toHaveLength(1); stop();
  });
  it('notifies an active owner even when it has not saved a best before a cross-tab clear-all', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`, surface = new EventTarget(); vi.stubGlobal('localStorage', storage); vi.stubGlobal('window', surface);
    const listener = vi.fn(), stop = arcadeData.subscribe(listener, owner), event = new Event('storage'); Object.defineProperties(event, { key: { value: null }, newValue: { value: null } }); surface.dispatchEvent(event); expect(listener).toHaveBeenCalledWith(owner, 'clear'); stop(); listener.mockClear(); surface.dispatchEvent(event); expect(listener).not.toHaveBeenCalled();
  });
  it('does not discard a run for another owner’s deletion and refreshes external saved records', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`, surface = new EventTarget(); vi.stubGlobal('localStorage', storage); vi.stubGlobal('window', surface);
    const listener = vi.fn(), stop = arcadeData.subscribe(listener, owner); const foreign = new Event('storage'); Object.defineProperties(foreign, { key: { value: arcadeStorageKey(owner + '-other') }, newValue: { value: null } }); surface.dispatchEvent(foreign); expect(listener).not.toHaveBeenCalled();
    const saved = new Event('storage'); Object.defineProperties(saved, { key: { value: arcadeStorageKey(owner) }, newValue: { value: '{}' } }); surface.dispatchEvent(saved); expect(listener).toHaveBeenCalledWith(owner, 'save'); stop();
  });
  it('keeps an old durable replay quarantined from the UI when deletion is blocked', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner));
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.getItem(key), removeItem: () => { throw new Error('blocked'); } }); expect(() => arcadeData.clear(owner)).toThrow('could not be confirmed'); expect(arcadeData.read(owner).data.replays).toEqual([]); expect(storage.getItem(arcadeStorageKey(owner))).not.toBeNull();
  });
  it('prunes raw replays at90 days while preserving aggregate bests and recent replay evidence', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(), base = 1700000000000, clock = vi.spyOn(Date, 'now').mockReturnValue(base); vi.stubGlobal('localStorage', storage);
    arcadeData.save(owner, evidence(owner, 'old')); clock.mockReturnValue(base + EVIDENCE_TTL_MS - 1000); arcadeData.save(owner, evidence(owner, 'recent'));
    clock.mockReturnValue(base + EVIDENCE_TTL_MS + 100); const result = arcadeData.read(owner);
    expect(result.data.replays.map(value => value.session.clientSessionId)).toEqual(['recent']); expect(result.data.bests[0].sessionId).toBe('old');
    expect(JSON.parse(storage.getItem(arcadeStorageKey(owner))!).replays).toHaveLength(1); expect(arcadeData.export(owner).arcade.replays[0].session.clientSessionId).toBe('recent');
  });
  it('uses the explicit maintenance clock and rejects a non-finite expiry time', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(), base = 1700000000000; vi.spyOn(Date, 'now').mockReturnValue(base); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner));
    arcadeData.expire(owner, base + EVIDENCE_TTL_MS + 101); expect(JSON.parse(storage.getItem(arcadeStorageKey(owner))!).replays).toEqual([]); expect(arcadeData.read(owner).data.bests).toHaveLength(1); expect(() => arcadeData.expire(owner, NaN)).toThrow('finite');
  });
  it('announces expiry to an active selected ghost even if a preceding export already pruned raw storage', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(), base = 1700000000000, clock = vi.spyOn(Date, 'now').mockReturnValue(base); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner, 'expiring-ghost'));
    const listener = vi.fn(), stop = arcadeData.subscribe(listener, owner); clock.mockReturnValue(base + EVIDENCE_TTL_MS + 101); expect(arcadeData.export(owner).arcade.replays).toEqual([]); expect(listener).not.toHaveBeenCalled();
    arcadeData.expire(owner); expect(listener).toHaveBeenCalledWith(owner, 'remove', 'expiring-ghost'); expect(listener).toHaveBeenCalledWith(owner, 'save'); stop();
  });
  it('omits expired evidence from memory/export when persistent expiry is blocked and can retry later', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(), base = 1700000000000, clock = vi.spyOn(Date, 'now').mockReturnValue(base); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner));
    const blocked = { getItem: (key: string) => storage.getItem(key), setItem: () => { throw new Error('blocked'); } }; vi.stubGlobal('localStorage', blocked); clock.mockReturnValue(base + EVIDENCE_TTL_MS + 101);
    expect(() => arcadeData.expire(owner)).toThrow('Persistent expiry could not be confirmed'); expect(arcadeData.export(owner).arcade.replays).toEqual([]); expect(arcadeData.read(owner).data.bests).toHaveLength(1); expect(JSON.parse(storage.getItem(arcadeStorageKey(owner))!).replays).toHaveLength(1);
    vi.stubGlobal('localStorage', storage); expect(() => arcadeData.expire(owner)).not.toThrow(); expect(JSON.parse(storage.getItem(arcadeStorageKey(owner))!).replays).toEqual([]);
  });
  it('never exports expired cached raw evidence when storage becomes unavailable or corrupt', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(), base = 1700000000000, clock = vi.spyOn(Date, 'now').mockReturnValue(base); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner)); clock.mockReturnValue(base + EVIDENCE_TTL_MS + 101);
    vi.stubGlobal('localStorage', undefined); const blocked = arcadeData.export(owner); expect(blocked.arcade.replays).toEqual([]); expect(blocked.warning).toContain('unavailable');
    storage.setItem(arcadeStorageKey(owner), '{'); vi.stubGlobal('localStorage', storage); const corrupt = arcadeData.export(owner); expect(corrupt.arcade.replays).toEqual([]); expect(corrupt.recoveryText).toBe('{');
  });
  it('removes one session’s duplicate replay and derived best without inventing an older best', () => {
    const owner = `owner-${nextOwner++}`, other = owner + '-other', storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); const removed = evidence(owner, 'delete-me'); arcadeData.save(owner, removed); arcadeData.save(owner, evidence(owner, 'keep-me')); arcadeData.save(other, evidence(other));
    const listener = vi.fn(), stop = arcadeData.subscribe(listener); arcadeData.removeSession(owner, 'delete-me'); expect(listener).toHaveBeenCalledWith(owner, 'remove', 'delete-me');
    expect(arcadeData.read(owner).data.bests).toEqual([]); expect(arcadeData.read(owner).data.replays.map(value => value.session.clientSessionId)).toEqual(['keep-me']); expect(arcadeData.read(other).data.replays).toHaveLength(1); expect(arcadeData.save(owner, removed).error).toContain('was deleted'); stop();
  });
  it('reports blocked persistent per-session cleanup while keeping that source hidden in this tab', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); arcadeData.save(owner, evidence(owner, 'delete-me')); vi.stubGlobal('localStorage', { getItem: (key: string) => storage.getItem(key), setItem: () => { throw new Error('blocked'); } });
    expect(() => arcadeData.removeSession(owner, 'delete-me')).toThrow('Persistent arcade replay removal could not be confirmed'); expect(arcadeData.export(owner).arcade.replays).toEqual([]); expect(arcadeData.read(owner).data.bests).toEqual([]); expect(JSON.parse(storage.getItem(arcadeStorageKey(owner))!).replays).toHaveLength(1);
  });
  it('notifies a selected history ghost removal even when no duplicated arcade record exists', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); const listener = vi.fn(), stop = arcadeData.subscribe(listener); arcadeData.removeSession(owner, 'history-ghost'); expect(listener).toHaveBeenCalledWith(owner, 'remove', 'history-ghost'); expect(storage.getItem(arcadeStorageKey(owner))).toBeNull(); stop();
  });
  it('supports bounded legacy session IDs with dots without allowing controls or oversized identifiers', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); expect(() => arcadeData.removeSession(owner, 'local.imported.session')).not.toThrow();
    for (const id of ['', 'bad\nidentifier', 'x'.repeat(201)]) expect(() => arcadeData.removeSession(owner, id)).toThrow('identifier');
  });
  it.each(['{', 'null', '{}', '{"version":2,"bests":[],"replays":[]}', '{"version":1,"bests":[{}],"replays":[]}'])('preserves corrupt/unsupported source%s without silent overwrite', raw => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage); storage.setItem(arcadeStorageKey(owner), raw);
    expect(arcadeData.read(owner).recoveryText).toBe(raw); expect(arcadeData.save(owner, evidence(owner)).error).toContain('recovery'); expect(storage.getItem(arcadeStorageKey(owner))).toBe(raw); arcadeData.clear(owner); expect(arcadeData.read(owner).recoveryText).toBeNull();
  });
  it('retains the new result in this tab when a persistent write is denied', () => {
    const storage = new MemoryStorage(), owner = `owner-${nextOwner++}`; vi.stubGlobal('localStorage', storage);
    const blocked = { getItem: (key: string) => storage.getItem(key), setItem: () => { throw new Error('quota'); } };
    const result = arcadeData.save(owner, evidence(owner), blocked); expect(result.error).toContain('this tab'); expect(arcadeData.read(owner).data.bests).toHaveLength(1);
  });
  it('clears memory and notifies the active run even when durable deletion is blocked', () => {
    const owner = `owner-${nextOwner++}`, other = owner + '-other', storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); arcadeData.save(other, evidence(other));
    arcadeData.save(owner, evidence(owner), { getItem: () => null, setItem: () => { throw new Error('quota'); } });
    const listener = vi.fn(), stop = arcadeData.subscribe(listener); vi.stubGlobal('localStorage', { ...storage, getItem: (key: string) => storage.getItem(key), removeItem: () => { throw new Error('blocked'); } });
    expect(() => arcadeData.clear(owner)).toThrow('Persistent arcade deletion could not be confirmed'); expect(listener).toHaveBeenCalledWith(owner, 'clear'); expect(arcadeData.read(owner).data.bests).toHaveLength(0); expect(arcadeData.read(other).data.bests).toHaveLength(1); stop();
  });
  it('rejects differently owned raw replay evidence and retains recovery text', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); const foreign = evidence('another-owner'); const raw = JSON.stringify({ version: 1, bests: [], replays: [foreign] }); storage.setItem(arcadeStorageKey(owner), raw); expect(arcadeData.read(owner).recoveryText).toBe(raw);
  });
  it('rejects non-finite and wrong-shaped local metric summaries before UI formatting', () => {
    const owner = `owner-${nextOwner++}`, storage = new MemoryStorage(); vi.stubGlobal('localStorage', storage); const saved = arcadeData.save(owner, evidence(owner)); const invalid = { ...saved.data, bests: [{ ...saved.data.bests[0], accuracy: '100' }] }; storage.setItem(arcadeStorageKey(owner), JSON.stringify(invalid)); expect(arcadeData.read(owner).error).toContain('Invalid local best');
  });
});
describe('UTC SHA-256 daily practice contracts', () => {
  it.each(Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`))('reproducibly issues the same original40word passage on%s', async day => {
    const subtle = webcrypto.subtle as unknown as SubtleCrypto; const a = await dailyChallenge(day, subtle), b = await dailyChallenge(day, subtle);
    expect(a).toEqual(b); expect(a.seed).toMatch(/^[a-f0-9]{64}$/); expect(a.text.split(' ')).toHaveLength(40); expect(a.text).not.toMatch(/\s$/);
  });
  it('changes on UTC midnight and does not depend on local timezone formatting', async () => {
    const subtle = webcrypto.subtle as unknown as SubtleCrypto;
    expect(utcDate(Date.parse('2026-10-21T23:59:59.999Z'))).toBe('2026-10-21'); expect(utcDate(Date.parse('2026-10-22T00:00:00Z'))).toBe('2026-10-22');
    expect((await dailyChallenge('2026-10-21', subtle)).seed).not.toBe((await dailyChallenge('2026-10-22', subtle)).seed);
  });
  it('does not silently substitute a non-SHA daily challenge when crypto is unavailable', async () => {
    await expect(dailyChallenge('2026-10-21', { digest: () => Promise.reject(new Error('crypto unavailable')) })).rejects.toThrow('crypto unavailable');
  });
  it('validates actual calendar dates and featured-game bounds', async () => {
    await expect(dailyChallenge('2026-02-31', webcrypto.subtle as unknown as SubtleCrypto)).rejects.toThrow(); expect(() => utcDate(NaN)).toThrow(); expect(() => featuredGameIndex('2026-10-21', 0)).toThrow(); expect(featuredGameIndex('2026-10-21', 8)).toBe(featuredGameIndex('2026-10-21', 8));
  });
});
