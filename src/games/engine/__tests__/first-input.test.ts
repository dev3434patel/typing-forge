import { describe, expect, it } from 'vitest';
import { ArcadeMachine } from '../arcade-machine';
import { CanonicalGameBridge } from '../canonical-bridge';
import { GAMES } from '../../modes/catalog';
import type { GameId } from '../types';
import { replaySession } from '@/lib/typing-core';

function fixture(gameId: GameId) {
  let now = 10_000;
  const options = { gameId, difficulty: 'normal' as const, variant: 'mission' as const, seed: 'first-input', owner: 'guest', sessionId: `first-input-${gameId}`,
    dailyText: gameId === 'daily-gauntlet' ? 'calm glow signal river' : undefined,
    now: () => now, wallNow: () => 1_700_000_000_000 + now };
  const game = new ArcadeMachine(options); game.start();
  return { game, options, advance: (ms: number) => { now += ms; }, now: () => now };
}

describe('armed arcade clock starts with the first actual text attempt', () => {
  it.each(GAMES)('$name exposes its first target while world, BOT and active clocks remain frozen through long idle', definition => {
    const f = fixture(definition.id), initial = f.game.view();
    expect(initial.entities).toHaveLength(1);
    expect(initial.entities[0].word.length).toBeGreaterThan(0);
    for (let frame = 0; frame < 8; frame++) { f.advance(f.game.durationMs); f.game.step(17); }
    const idle = f.game.view();
    expect(idle.phase).toBe('playing'); expect(idle.clockStarted).toBe(false);
    expect(idle.elapsedMs).toBe(0); expect(f.game.elapsedMs).toBe(0);
    expect(idle.entities).toEqual(initial.entities); expect(idle.snake).toEqual(initial.snake);
    expect(idle.lava).toBe(0); expect(idle.bossProgress).toBe(0);
    expect(idle.bots.every(bot => bot.progress === 0)).toBe(true);
    expect(f.game.bridge.controller.timingOrigin).toBeNull();
    expect(f.game.bridge.snapshot().status).toBe('ready');
    const origin = f.now(); f.game.edit(0, 0, idle.entities[0].word[0]);
    expect(f.game.bridge.controller.timingOrigin).toEqual({ monotonic: origin, wall: 1_700_000_000_000 + origin });
    expect(f.game.view().clockStarted).toBe(true); expect(f.game.elapsedMs).toBe(0);
    f.advance(1000); f.game.step(17);
    expect(f.game.elapsedMs).toBe(1000); expect(f.game.view().elapsedMs).toBe(1000);
    expect(f.game.bridge.snapshot().elapsedMs).toBe(1000);
  });

  it.each(GAMES)('$name keeps its complete active deadline after an idle period longer than that deadline', definition => {
    const f = fixture(definition.id);
    f.advance(f.game.durationMs * 2); f.game.step(17);
    expect(f.game.phase).toBe('playing');
    f.game.edit(0, 0, '#');
    expect(f.game.hasStarted).toBe(true);
    expect(f.game.bridge.snapshot().metrics.incorrectAttempts).toBe(1);
    f.advance(f.game.durationMs - 1); f.game.step(1);
    expect(f.game.phase).toBe('playing');
    f.advance(1); f.game.step(1);
    const result = f.game.finish().session;
    expect(result.elapsedMs).toBe(f.game.durationMs);
    expect(result.metrics.insertionAttempts).toBe(1);
    expect(result.metrics.incorrectAttempts).toBe(1);
    expect(result.events.find(event => event.text)?.offsetMs).toBe(0);
    expect(replaySession(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals }).metrics).toEqual(result.metrics);
  });

  it('does not start on empty edits, unlock, submit, assistance metadata, power buttons or pre-input pause/resume', () => {
    const f = fixture('word-invaders');
    f.game.edit(0, 0, ''); f.game.unlock();
    f.game.bridge.markAssistance('autocorrect'); f.game.bridge.submit();
    f.game.powerups.shield = 1; f.game.usePowerup('shield');
    f.advance(5000); f.game.pause(); f.advance(60_000); f.game.resume();
    f.advance(5000); f.game.step(17);
    expect(f.game.hasStarted).toBe(false); expect(f.game.view().elapsedMs).toBe(0);
    expect(f.game.bridge.snapshot().metrics.insertionAttempts).toBe(0);
    const origin = f.now(); f.game.edit(0, 0, '#');
    expect(f.game.bridge.controller.timingOrigin?.monotonic).toBe(origin);
    f.advance(3000); f.game.step(17); f.game.pause();
    f.advance(20_000); f.game.step(17);
    expect(f.game.elapsedMs).toBe(3000);
    f.game.resume(); f.advance(200); f.game.step(17);
    expect(f.game.elapsedMs).toBe(3200);
    const result = f.game.finish().session;
    expect(result.elapsedMs).toBe(3200);
    expect(result.pauseIntervals).toEqual([{ startMs: 3000, endMs: 23000 }]);
    expect(result.startedAtWall).toBe(1_700_000_000_000 + origin);
  });

  it('starts once on a committed composition without inventing inter-character timing', () => {
    const f = fixture('boss-duel'); f.advance(500_000);
    const word = f.game.pool.nearest()!.word, origin = f.now();
    f.game.edit(0, 0, word, 'composition', 'native-composition');
    const snapshot = f.game.bridge.snapshot();
    expect(f.game.bridge.controller.timingOrigin?.monotonic).toBe(origin);
    expect(snapshot.metrics.insertionAttempts).toBe(word.length);
    expect(snapshot.events[0]).toMatchObject({ type: 'composition', compositionId: 'native-composition', provenance: 'composition', offsetMs: 0 });
    f.advance(500); f.game.step(17);
    expect(f.game.elapsedMs).toBe(500);
    expect(f.game.finish().session.configuration.inputMethod).toBe('composition');
  });

  it('also starts an unmatched composition attempt while retaining its actual composition identity', () => {
    const f = fixture('boss-duel'); f.advance(500_000);
    f.game.edit(0, 0, '#', 'composition', 'wrong-composition');
    expect(f.game.hasStarted).toBe(true);
    expect(f.game.bridge.snapshot().events[0]).toMatchObject({ type: 'reject', text: '#', provenance: 'composition', compositionId: 'wrong-composition', offsetMs: 0 });
    expect(f.game.bridge.snapshot().metrics.incorrectAttempts).toBe(1);
  });

  it('can end an untouched armed run without manufacturing active time or a first attempt', () => {
    const f = fixture('boss-duel'); f.advance(500_000); f.game.pause(); f.advance(5000); f.game.resume();
    const result = f.game.finish().session;
    expect(result.startedAtWall).toBeNull(); expect(result.elapsedMs).toBe(0);
    expect(result.metrics.insertionAttempts).toBe(0); expect(result.metrics.wpm).toBeNull();
    expect(result.pauseIntervals).toEqual([]); expect(f.game.outcome).toContain('ended early');
  });

  it('leaves an atomically refused oversized batch unstarted', () => {
    const f = fixture('boss-duel'); f.advance(500_000);
    f.game.edit(0, 0, '#'.repeat(ArcadeMachine.maxAttempts + 1));
    expect(f.game.finish().session.startedAtWall).toBeNull();
    expect(f.game.hasStarted).toBe(false);
    expect(f.game.finish().session.metrics.insertionAttempts).toBe(0);
  });

  it('keeps the direct canonical bridge ready through target setup and non-text interactions', () => {
    const f = fixture('word-invaders'), bridge = new CanonicalGameBridge({ ...f.options, sessionId: 'bridge-armed' });
    bridge.assign('cat'); bridge.edit(0, 0, ''); bridge.markAssistance('autocorrect'); bridge.submit();
    f.advance(5000); bridge.pause(); f.advance(60_000); bridge.resume(); bridge.assign('dog');
    expect(bridge.snapshot().status).toBe('ready'); expect(bridge.snapshot().elapsedMs).toBe(0);
    expect(bridge.controller.timingOrigin).toBeNull();
    bridge.reject('#'); f.advance(100);
    const result = bridge.finish();
    expect(result.elapsedMs).toBe(100); expect(result.pauseIntervals).toEqual([]);
    expect(result.metrics.incorrectAttempts).toBe(1);
    expect(result.events.find(event => event.text)?.offsetMs).toBe(0);
  });
});
