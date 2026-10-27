import { expect, it } from 'vitest';
import { ArcadeMachine } from '../arcade-machine';
import { GAMES } from '../../modes/catalog';
import type { Difficulty } from '../types';

it('replays10,000 seeds through12 fixed frames and exact input without non-finite state or entity growth', () => {
  for (let seed = 0; seed < 10000; seed++) {
    let now = 0;
    const gameId = GAMES[seed % GAMES.length].id, difficulty = (['easy', 'normal', 'hard'] as Difficulty[])[seed % 3];
    const options = { gameId, difficulty, variant: seed % 2 ? 'mission' as const : 'endless' as const, seed: `fuzz-${seed}`, owner: 'fuzz', sessionId: `fuzz-${seed}`, dailyText: gameId === 'daily-gauntlet' ? 'calm glow signal river' : undefined, now: () => now, wallNow: () => 1700000000000 + now };
    const first = new ArcadeMachine(options), second = new ArcadeMachine(options); first.start(); second.start();
    for (let frame = 0; frame < 12; frame++) {
      now += 1000 / 60;
      first.step(1000 / 60); second.step(1000 / 60);
      if (frame === 2) { const char = seed % 3 ? first.pool.nearest()!.word[0] : '#'; first.edit(0, 0, char); second.edit(0, 0, char); }
      if (frame === 5 && first.bridge.draft) { first.edit(0, first.bridge.draft.length, ''); second.edit(0, second.bridge.draft.length, ''); first.unlock(); second.unlock(); }
    }
    const a = first.view(), b = second.view();
    expect(a).toEqual(b); expect(first.events).toEqual(second.events);
    expect(a.hull).toBeGreaterThanOrEqual(0); expect(a.score).toBeGreaterThanOrEqual(0); expect(first.pool.count).toBeLessThanOrEqual(first.pool.capacity); expect(a.snake.length).toBeLessThanOrEqual(120);
    for (const entity of a.entities) expect(Number.isFinite(entity.x + entity.y + entity.speed + entity.spawnedAt)).toBe(true);
    expect(Number.isFinite(a.elapsedMs + a.lava + a.score + a.bossProgress + a.playerProgress)).toBe(true);
  }
}, 30000);
