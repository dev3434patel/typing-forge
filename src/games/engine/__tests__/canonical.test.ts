import { describe, expect, it } from 'vitest';
import { CanonicalGameBridge } from '../canonical-bridge';
import { replaySession } from '@/lib/typing-core';
import type { GameId } from '../types';

function fixture(gameId: GameId = 'word-invaders') {
  let now = 0; const bridge = new CanonicalGameBridge({ gameId, difficulty: 'normal', variant: 'mission', seed: 'canonical', owner: 'guest', sessionId: 'canonical-test', now: () => now, wallNow: () => 1_700_000_000_000 + now });
  return { bridge, advance: (ms: number) => { now += ms; } };
}
describe('unchanged canonical arcade scoring bridge', () => {
  it.each(['air', 'arc', 'ash', 'bay', 'beam', 'blue', 'bold', 'calm', 'cape', 'chime', 'clear', 'cloud', 'coast', 'coral', 'craft', 'crest', 'dawn', 'deep', 'drift', 'dune', 'echo', 'ember', 'fern', 'field', 'flare', 'flow', 'focus', 'forge', 'frame', 'frost'])('records exact%s with no invented Space attempts', word => {
    const f = fixture(); f.bridge.assign(word);
    for (const text of word) { f.advance(100); const end = f.bridge.draft.length; f.bridge.edit(end, end, text); }
    expect(f.bridge.complete).toBe(true); f.bridge.submit(); const result = f.bridge.finish();
    expect(result.metrics.insertionAttempts).toBe(word.length); expect(result.metrics.correctAttempts).toBe(word.length); expect(result.metrics.inputAccuracy).toBe(100); expect(result.metrics.creditedUnits).toBe(word.length);
    expect(result.events.filter(event => event.text === ' ')).toHaveLength(0); expect(result.events.at(-1)?.type).toBe('submit');
    const replay = replaySession(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals });
    expect(replay.metrics).toEqual(result.metrics);
  });
  it('keeps rejected wrong letters in accuracy after a corrected word', () => {
    const { bridge, advance } = fixture(); bridge.assign('cat'); advance(100); bridge.edit(0, 0, 'cx'); expect(bridge.draft).toBe('c'); advance(100); bridge.edit(1, 1, 'at'); bridge.submit(); const result = bridge.finish();
    expect(result.metrics.incorrectAttempts).toBe(1); expect(result.metrics.correctAttempts).toBe(3); expect(result.metrics.inputAccuracy).toBe(75); expect(result.finalTranscript).toBe('cat');
  });
  it('records real deletion and does not allow a submitted target to be rewritten', () => {
    const { bridge, advance } = fixture(); bridge.assign('cat'); advance(100); bridge.edit(0, 0, 'ca'); bridge.edit(1, 2, ''); advance(100); bridge.edit(1, 1, 'at'); bridge.submit(); bridge.assign('dog');
    expect(() => bridge.edit(-1, 0, 'x')).toThrow(); expect(bridge.finish().metrics.deletedUnits).toBe(1);
  });
  it('can abandon an empty lock without converting a miss to a typed character', () => {
    const { bridge, advance } = fixture(); bridge.assign('cloud'); bridge.reject('x'); bridge.submit(); bridge.assign('calm'); advance(100); bridge.edit(0, 0, 'calm'); bridge.submit(); const result = bridge.finish();
    expect(result.metrics.insertionAttempts).toBe(5); expect(result.metrics.correctAttempts).toBe(4); expect(result.metrics.missed).toBeGreaterThanOrEqual(5); expect(result.finalTranscript).toBe('calm'); expect(result.metrics.inputAccuracy).toBe(80);
  });
  it('retains composition provenance and no fabricated inter-key timestamps', () => {
    const { bridge, advance } = fixture(); bridge.assign('calm'); advance(100); bridge.edit(0, 0, 'calm', 'composition', 'one-ime-commit'); bridge.submit(); const result = bridge.finish(); expect(result.events[0].type).toBe('composition'); expect(result.assistance).toContain('composition'); expect(result.metrics.correctAttempts).toBe(4); expect(result.events[0].offsetMs).toBe(0);
  });
  it('marks same-value autocorrect assistance without inventing an insertion or deletion', () => {
    const { bridge, advance } = fixture(); bridge.assign('cat'); advance(100); bridge.edit(0, 0, 'c'); bridge.markAssistance('autocorrect'); const result = bridge.finish(); expect(result.assistance).toContain('autocorrect'); expect(result.metrics.insertionAttempts).toBe(1); expect(result.metrics.deletionActions).toBe(0);
  });
  it('excludes deliberate paused time and remains idempotent on finish', () => {
    const { bridge, advance } = fixture(); bridge.assign('cat'); advance(100); bridge.edit(0, 0, 'c'); bridge.pause(); advance(5000); bridge.resume(); advance(100); bridge.edit(1, 1, 'at'); bridge.submit(); const result = bridge.finish(); expect(result.elapsedMs).toBe(100); expect(result.pauseIntervals).toHaveLength(1); expect(bridge.finish()).toBe(result); expect(result.pauseIntervals[0].afterSequence).toBe(0);
  });
});
