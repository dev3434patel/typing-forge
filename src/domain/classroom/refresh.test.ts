import { describe, expect, it, vi } from 'vitest';
import { refreshTeacherProgress } from './refresh';
import type { Classroom } from './model';
const rooms: Classroom[] = [{ id: 'room', title: 'Evening practice', createdAt: '2026-10-21T00:00:00Z', members: [] }];
describe('explicit teacher progress refresh', () => {
  it('publishes the current server aggregate instead of incrementing a local approximation', async () => {
    const publish = vi.fn();
    await expect(refreshTeacherProgress({ ownerId: 'teacher', isCurrent: () => true, load: async () => ({ ownerId: 'teacher', classes: rooms }), publish })).resolves.toBe(true);
    expect(publish).toHaveBeenCalledExactlyOnceWith(rooms);
  });
  it('does not publish another owner’s response', async () => {
    const publish = vi.fn();
    await expect(refreshTeacherProgress({ ownerId: 'teacher', isCurrent: () => true, load: async () => ({ ownerId: 'other', classes: rooms }), publish })).rejects.toThrow('owner changed');
    expect(publish).not.toHaveBeenCalled();
  });
  it('discards a slow response after scope or request generation changes', async () => {
    let current = true, resolve!: (value: { ownerId: string; classes: Classroom[] }) => void;
    const publish = vi.fn(), response = new Promise<{ ownerId: string; classes: Classroom[] }>(done => { resolve = done; });
    const pending = refreshTeacherProgress({ ownerId: 'teacher', isCurrent: () => current, load: () => response, publish });
    current = false; resolve({ ownerId: 'teacher', classes: rooms });
    await expect(pending).resolves.toBe(false); expect(publish).not.toHaveBeenCalled();
  });
  it('reports a failed request without publishing an empty or fabricated aggregate', async () => {
    const publish = vi.fn();
    await expect(refreshTeacherProgress({ ownerId: 'teacher', isCurrent: () => true, load: async () => { throw new Error('offline'); }, publish })).rejects.toThrow('offline');
    expect(publish).not.toHaveBeenCalled();
  });
});
