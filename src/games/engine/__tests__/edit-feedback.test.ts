import { describe, expect, it } from 'vitest';
import { ArcadeMachine } from '../arcade-machine';

function fixture() {
  let now = 0;
  const machine = new ArcadeMachine({ gameId: 'word-invaders', difficulty: 'normal', variant: 'mission', seed: 'edit-feedback', owner: 'guest', sessionId: 'edit-feedback', now: () => now, wallNow: () => 1_700_000_000_000 + now });
  machine.start(); machine.pool.clear(); machine.pool.spawn('cat', 0.5, 0, 0.02, 0);
  return { machine, advance: (ms: number) => { now += ms; } };
}

describe('arcade sound feedback from recorded insertion attempts', () => {
  it('returns success for real correct letters, including an automatically submitted final letter', () => {
    const { machine, advance } = fixture();
    expect(machine.edit(0, 0, 'c')).toBe(true); advance(100);
    expect(machine.edit(1, 1, 'a')).toBe(true); advance(100);
    expect(machine.edit(2, 2, 't')).toBe(true);
    expect(machine.words).toBe(1); expect(machine.bridge.draft).toBe('');
    expect(machine.bridge.snapshot().metrics.correctAttempts).toBe(3);
  });
  it('returns error for both an unmatched first key and a rejected letter inside the target', () => {
    const { machine } = fixture();
    expect(machine.edit(0, 0, 'x')).toBe(false);
    expect(machine.edit(0, 0, 'c')).toBe(true);
    expect(machine.edit(1, 1, 'x')).toBe(false);
    expect(machine.bridge.draft).toBe('c');
    expect(machine.bridge.snapshot().metrics.incorrectAttempts).toBe(2);
  });
  it('does not play a success or error tone for Backspace, even immediately after a rejected key', () => {
    const { machine } = fixture(); machine.edit(0, 0, 'ca'); machine.edit(2, 2, 'x');
    expect(machine.edit(1, 2, '')).toBeNull();
    expect(machine.bridge.draft).toBe('c');
    expect(machine.bridge.snapshot().metrics.deletedUnits).toBe(1);
    expect(machine.bridge.snapshot().metrics.incorrectAttempts).toBe(1);
  });
  it('keeps mixed correct/wrong composition feedback honest without deleting its attempt evidence', () => {
    const { machine } = fixture();
    expect(machine.edit(0, 0, 'cx', 'composition', 'mixed-ime')).toBe(false);
    expect(machine.bridge.draft).toBe('c');
    expect(machine.bridge.snapshot().metrics.insertionAttempts).toBe(2);
    expect(machine.edit(1, 1, 'at', 'composition', 'correct-ime')).toBe(true);
    expect(machine.words).toBe(1); expect(machine.bridge.snapshot().metrics.inputAccuracy).toBe(75);
  });
  it('stays silent for input ignored while paused, finished or past the real deadline', () => {
    const f = fixture(); f.machine.edit(0, 0, 'c'); f.machine.pause();
    expect(f.machine.edit(1, 1, 'a')).toBeNull(); f.machine.resume(); f.advance(f.machine.durationMs);
    expect(f.machine.edit(1, 1, 'a')).toBeNull(); expect(f.machine.phase).toBe('finished');
    expect(f.machine.edit(1, 1, 'a')).toBeNull(); expect(f.machine.bridge.snapshot().metrics.insertionAttempts).toBe(1);
  });
});
