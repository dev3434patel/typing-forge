import { describe, expect, it, vi, afterEach } from 'vitest';
import { SeededRandom, hashSeed } from '../random';
import { EntityPool } from '../entities';
import { FixedLoop, type LoopDriver } from '../loop';
import { ParticlePool } from '../particles';
import { ArcadeAudio, readAudioSettings } from '../audio';

afterEach(() => vi.unstubAllGlobals());
describe('seeded spawner randomness', () => {
  it.each(Array.from({ length: 30 }, (_, seed) => seed))('replays seed%s with bounded values and reproducible choices', seed => {
    const a = new SeededRandom(`run-${seed}`), b = new SeededRandom(`run-${seed}`);
    const first = Array.from({ length: 100 }, () => a.next());
    expect(first).toEqual(Array.from({ length: 100 }, () => b.next()));
    expect(first.every(value => value >= 0 && value < 1 && Number.isFinite(value))).toBe(true);
    for (let i = 0; i < 20; i++) expect(a.integer(-2, 2)).toBeGreaterThanOrEqual(-2);
    expect(a.pick(['a', 'b', 'c'])).toMatch(/^[abc]$/);
  });
  it('distinguishes seeds, permits a singleton and rejects invalid pools/ranges', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
    expect(new SeededRandom(0).integer(4, 4)).toBe(4);
    expect(() => new SeededRandom(0).pick([])).toThrow();
    expect(() => new SeededRandom(0).integer(2, 1)).toThrow();
    expect(() => new SeededRandom(0).integer(NaN, 2)).toThrow();
  });
});
describe('bounded entity pool and target locking', () => {
  it.each([1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 48, 52, 56, 58, 60, 62, 64])('reuses preallocated capacity%s without growth or stale target reuse', capacity => {
    const pool = new EntityPool(capacity), allocated = pool.slots.slice();
    for (let i = 0; i < capacity; i++) expect(pool.spawn('glow', i / capacity, 0, 0.1, i)).not.toBeNull();
    expect(pool.count).toBe(capacity); expect(pool.spawn('overflow', 0.5, 0, 1, 0)).toBeNull();
    const oldId = pool.slots[0].id; pool.release(oldId); const next = pool.spawn('calm', 0.5, 0, 0.1, 5)!;
    expect(next.id).not.toBe(oldId); expect(pool.get(oldId)).toBeUndefined(); expect(pool.slots).toEqual(allocated);
    pool.clear(); expect(pool.count).toBe(0); expect(pool.slots.length).toBe(capacity);
  });
  it('locks the nearest matching first letter with stable id tie breaking', () => {
    const pool = new EntityPool(4), a = pool.spawn('calm', 0.2, 0, 1, 0)!, b = pool.spawn('clear', 0.8, 0, 1, 0)!, c = pool.spawn('river', 0.5, 1, 1, 0)!;
    a.y = 0.4; b.y = 0.7; c.y = 0.9;
    expect(pool.target('c')?.id).toBe(b.id); b.y = a.y; expect(pool.target('c')?.id).toBe(a.id);
    expect(pool.target('C')).toBeUndefined(); expect(pool.nearest()?.id).toBe(c.id);
    pool.release(c.id); expect(pool.nearest()?.id).toBe(a.id);
  });
  it('rejects non-finite entities and impossible capacities', () => {
    for (const capacity of [0, -1, 65, 1.5, NaN]) expect(() => new EntityPool(capacity)).toThrow();
    expect(() => new EntityPool().spawn('word', NaN, 0, 1, 0)).toThrow();
  });
});
function loopFixture() {
  const pending = new Map<number, FrameRequestCallback>(); let id = 0;
  const driver: LoopDriver = { request: callback => { pending.set(++id, callback); return id; }, cancel: value => { pending.delete(value); } };
  const update = vi.fn(), render = vi.fn(), loop = new FixedLoop(update, render, driver);
  const frame = (at: number) => { const first = pending.entries().next().value as [number, FrameRequestCallback]; pending.delete(first[0]); first[1](at); };
  return { loop, update, render, frame, pending };
}
describe('fixed simulation clock', () => {
  it.each(Array.from({ length: 30 }, (_, i) => 10 + i * 7))('bounds catch-up for%s ms frame gaps without changing fixed step', gap => {
    const { loop, update, frame, pending } = loopFixture(); loop.start(); frame(0); frame(gap);
    expect(update.mock.calls.length).toBeLessThanOrEqual(5); expect(update.mock.calls.length).toBe(Math.min(5, Math.floor((gap + 1e-7) / (1000 / 60))));
    for (const call of update.mock.calls) expect(call[0]).toBeCloseTo(1000 / 60);
    expect(pending.size).toBe(1); loop.stop(); expect(pending.size).toBe(0);
  });
  it('does not duplicate a start and resets time when restarted', () => {
    const f = loopFixture(); f.loop.start(); f.loop.start(); expect(f.pending.size).toBe(1); f.frame(0); f.frame(10); f.loop.stop(); f.loop.start(); f.frame(10000); expect(f.update).not.toHaveBeenCalled(); f.loop.stop();
  });
  it('does not resurrect after disposal inside an update', () => {
    const f = loopFixture(); f.update.mockImplementation(() => f.loop.stop()); f.loop.start(); f.frame(0); f.frame(100); expect(f.pending.size).toBe(0); expect(f.update).toHaveBeenCalledTimes(1);
  });
  it('does not resurrect after disposal inside rendering', () => {
    const f = loopFixture(); f.render.mockImplementation(() => f.loop.stop()); f.loop.start(); f.frame(0); expect(f.pending.size).toBe(0);
  });
});
describe('visual particle limits', () => {
  it.each(Array.from({ length: 30 }, (_, seed) => seed))('keeps particle seed%s reproducible and hard-capped', seed => {
    const a = new ParticlePool(seed % 2 === 0, new SeededRandom(seed)), b = new ParticlePool(seed % 2 === 0, new SeededRandom(seed));
    a.emit(0.5, 0.5, 1000); b.emit(0.5, 0.5, 1000);
    expect(a.slots).toEqual(b.slots); expect(a.slots.filter(value => value.active)).toHaveLength(seed % 2 === 0 ? 120 : 300);
    const allocated = a.slots[0]; a.update(1000); expect(a.slots.every(value => !value.active)).toBe(true); a.emit(0.5, 0.5); expect(a.slots[0]).toBe(allocated);
  });
  it('degrades only visual capacity after three sustained slow seconds and respects the floor', () => {
    const pool = new ParticlePool(false); for (let i = 0; i < 29; i++) pool.observeFrame(100); expect(pool.limit).toBe(300); pool.observeFrame(100); expect(pool.limit).toBe(150);
    for (let i = 0; i < 300; i++) pool.observeFrame(100); expect(pool.limit).toBe(30);
  });
  it('does not accumulate isolated slow frames or accept negative simulation time', () => {
    const pool = new ParticlePool(true); for (let i = 0; i < 50; i++) { pool.observeFrame(30); pool.observeFrame(16); } expect(pool.limit).toBe(120);
    pool.emit(0.5, 0.5, 1); pool.update(-100); pool.update(NaN); expect(pool.slots[0].age).toBe(0);
  });
});
describe('gesture-only original synth and safe audio preferences', () => {
  it.each(Array.from({ length: 30 }, (_, index) => (index - 10) / 10))('clamps persisted volume%s and never assumes unmuted consent', volume => {
    const settings = readAudioSettings({ getItem: () => JSON.stringify({ volume }) }); expect(settings.muted).toBe(true); expect(settings.volume).toBe(Math.max(0, Math.min(1, volume)));
  });
  it('keeps corruption and storage errors silent by default', () => {
    expect(readAudioSettings({ getItem: () => '{' })).toEqual({ muted: true, volume: 0.25 });
    expect(readAudioSettings({ getItem: () => { throw new Error('blocked'); } })).toEqual({ muted: true, volume: 0.25 });
  });
  it('does not create an audio context on construction or while muted', async () => {
    const create = vi.fn(); vi.stubGlobal('AudioContext', create); const audio = new ArcadeAudio({ muted: true, volume: 0.25 }); audio.tone(440); expect(create).not.toHaveBeenCalled(); await audio.unlock(); expect(create).not.toHaveBeenCalled(); audio.dispose();
  });
  it('handles a platform rejecting audio initialization without throwing', async () => {
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('gesture rejected'); } }); const audio = new ArcadeAudio({ muted: false, volume: 0.25 }); await expect(audio.unlock()).resolves.toBeUndefined(); audio.tone(440); audio.dispose();
  });
});
