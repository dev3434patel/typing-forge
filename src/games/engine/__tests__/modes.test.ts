import { describe, expect, it } from 'vitest';
import { ArcadeMachine } from '../arcade-machine';
import type { Difficulty, GameId, Variant } from '../types';
import { GAMES } from '../../modes/catalog';
import { replaySession } from '@/lib/typing-core';
import { botUnits, buildGhostTrack, ghostUnits } from '../../modes/ghost';

const settings = (['easy', 'normal', 'hard'] as const).flatMap(difficulty => (['mission', 'endless'] as const).map(variant => ({ difficulty, variant })));
function fixture(gameId: GameId, difficulty: Difficulty = 'normal', variant: Variant = 'mission', seed = 'mode-test') {
  let now = 0;
  const game = new ArcadeMachine({ gameId, difficulty, variant, seed, owner: 'guest', sessionId: seed, dailyText: gameId === 'daily-gauntlet' ? Array(40).fill('glow').join(' ') : undefined,
    medianWpm: 35, now: () => now, wallNow: () => 1_700_000_000_000 + now });
  game.start();
  return { game, advance: (ms: number) => { now += ms; }, at: (ms: number) => { now = ms; } };
}
for (const definition of GAMES) describe(`${definition.name}: exact input across all six settings`, () => {
  it.each(settings)('completes an exact target in$difficulty/$variant without invented attempts', ({ difficulty, variant }) => {
    const { game, advance } = fixture(definition.id, difficulty, variant); const word = game.pool.nearest()!.word; advance(100); game.edit(0, 0, word);
    expect(game.words).toBe(1); expect(game.bridge.snapshot().metrics.insertionAttempts).toBe(word.length); expect(game.bridge.snapshot().metrics.inputAccuracy).toBe(100);
  });
  it.each(settings)('retains an unmatched wrong attempt in$difficulty/$variant after recovery', ({ difficulty, variant }) => {
    const { game, advance } = fixture(definition.id, difficulty, variant); const word = game.pool.nearest()!.word; advance(100); game.edit(0, 0, '#'); advance(100); game.edit(0, 0, word);
    const result = game.finish().session; expect(result.metrics.incorrectAttempts).toBe(1); expect(result.metrics.inputAccuracy).toBeCloseTo(100 * word.length / (word.length + 1)); expect(game.words).toBe(1);
  });
  it.each(settings)('records active-word deletion and permits an empty lock release in$difficulty/$variant', ({ difficulty, variant }) => {
    const { game, advance } = fixture(definition.id, difficulty, variant); const word = game.pool.nearest()!.word; advance(100); game.edit(0, 0, word[0]); game.edit(0, 1, ''); game.unlock(); expect(game.lockedId).toBeNull(); advance(100); game.edit(0, 0, word);
    expect(game.finish().session.metrics.deletedUnits).toBe(1); expect(game.words).toBe(1);
  });
  it.each(settings)('does not score while paused in$difficulty/$variant', ({ difficulty, variant }) => {
    const { game, advance } = fixture(definition.id, difficulty, variant); const word = game.pool.nearest()!.word; game.edit(0, 0, word[0]); advance(10); game.pause(); advance(1000); game.edit(1, 1, '#'); expect(game.bridge.snapshot().metrics.insertionAttempts).toBe(1); game.resume(); advance(10); game.edit(1, 1, word.slice(1)); const result = game.finish().session;
    expect(result.pauseIntervals).toHaveLength(1); expect(result.elapsedMs).toBe(20); expect(result.metrics.inputAccuracy).toBe(100);
  });
  it.each(settings)('exports reproducible unverified canonical evidence in$difficulty/$variant', ({ difficulty, variant }) => {
    const { game, advance } = fixture(definition.id, difficulty, variant); advance(100); game.edit(0, 0, game.pool.nearest()!.word); const evidence = game.finish(); const session = evidence.session;
    expect(evidence.verification).toBe('local-unverified'); expect(session.configuration.settings?.arcadeGame).toBe(definition.id); expect(game.finish()).toBe(evidence);
    expect(replaySession(session.configuration, session.events, session.elapsedMs, { targetText: session.targetText, issuedTargetSegments: session.issuedTargetSegments, pauseIntervals: session.pauseIntervals }).metrics).toEqual(session.metrics);
  });
});
describe('distinct original game rules', () => {
  it('ends the bounded log after unmatched attempts as well as matched input', () => {
    const { game, advance } = fixture('word-invaders');
    game.bridge.assign(game.pool.nearest()!.word); game.bridge.reject('#'.repeat(19_999)); advance(100); game.edit(0, 0, '#');
    expect(game.phase).toBe('finished'); expect(game.finish().session.metrics.insertionAttempts).toBe(20_000);
    expect(game.finish().session.metrics.incorrectAttempts).toBe(20_000);
  });
  it('refuses an oversized batch atomically without inventing partial attempts', () => {
    const { game } = fixture('word-invaders'); game.edit(0, 0, '#'.repeat(20_001));
    expect(game.phase).toBe('finished'); expect(game.finish().session.metrics.insertionAttempts).toBe(0);
    expect(game.view().outcome).toContain('cannot accept this input');
  });
  it.each([NaN, Infinity, -1, 0, 501])('rejects invalid baseline%s before spawning non-finite threats', medianWpm => {
    expect(() => new ArcadeMachine({ gameId: 'word-invaders', difficulty: 'normal', variant: 'mission', seed: 'invalid', owner: 'guest', sessionId: 'invalid', medianWpm, now: () => 0, wallNow: () => 0 })).toThrow('baseline');
  });
  it('does not credit bomb-cleared targets as typing', () => {
    const { game } = fixture('word-invaders'); game.pool.clear(); game.pool.spawn('arc', 0.5, 0, 0.1, 0); game.powerups.bomb = 1; game.usePowerup('bomb'); expect(game.pool.count).toBe(0); expect(game.score).toBe(10); expect(game.bridge.snapshot().metrics.insertionAttempts).toBe(0);
  });
  it('spends a shield charge once and cannot manufacture an infinite shield from a button', () => {
    const { game, advance } = fixture('word-invaders'); game.powerups.shield = 1; game.usePowerup('shield'); expect(game.powerups.shield).toBe(0); game.edit(0, 0, '#');
    game.pool.nearest()!.y = 1; advance(10); game.step(17); expect(game.hull).toBe(3); game.usePowerup('shield'); game.pool.spawn('arc', 0.5, 0, 0, 10)!.y = 1; advance(10); game.step(17); expect(game.hull).toBe(2);
  });
  it('presents a three-phase boss in the fifth wave', () => {
    const { game, advance } = fixture('word-invaders', 'easy', 'endless'); game.pool.clear(); game.wave = 5;
    for (const word of ['steady', 'signal', 'returns']) { advance(100); game.edit(0, 0, word); }
    expect(game.words).toBe(3); expect(game.pool.slots.some(entity => entity.active && entity.kind === 'boss')).toBe(false);
  });
  it('keeps a boss shield closed if its completed phase had less than90% accuracy', () => {
    const { game, advance } = fixture('word-invaders', 'easy', 'endless'); game.pool.clear(); game.wave = 5; advance(100); game.edit(0, 0, 's'); game.edit(1, 1, '#'); advance(100); game.edit(1, 1, 'teady'); expect(game.pool.nearest()!.phase).toBe(0); expect(game.pool.nearest()!.word).toBe('steady'); expect(game.bridge.snapshot().metrics.incorrectAttempts).toBe(1);
  });
  it.each([-120, 0, 120])('awards only a rhythm combo inside the normal beat window at%s ms', deviation => {
    const { game, at } = fixture('rhythm-typing'); const entity = game.pool.nearest()!; game.edit(0, 0, entity.word[0]); at(entity.beatAt + deviation); game.edit(1, 1, entity.word.slice(1)); expect(game.rhythmCombo).toBe(1); expect(game.bridge.snapshot().metrics.inputAccuracy).toBe(100);
  });
  it.each([-121, 121, 1000])('keeps late/early words exact and typeable outside the rhythm window at%s ms', deviation => {
    const { game, at } = fixture('rhythm-typing'); const entity = game.pool.nearest()!; game.edit(0, 0, entity.word[0]); at(entity.beatAt + deviation); game.step(17); game.edit(1, 1, entity.word.slice(1)); expect(game.words).toBe(1); expect(game.rhythmCombo).toBe(0); expect(game.bridge.snapshot().metrics.inputAccuracy).toBe(100);
  });
  it('spends in-run tower scrap only between waves and separately from typing evidence', () => {
    const { game, advance } = fixture('key-tower'); game.scrap = 15; game.upgrade(1); expect(game.towers[1]).toBe(0); game.scrap = 0;
    for (let index = 0; index < 6; index++) { if (!game.pool.count) { advance(5000); game.step(17); } advance(100); game.edit(0, 0, game.pool.nearest()!.word); }
    expect(game.canUpgrade).toBe(true); expect(game.pool.count).toBe(0); const attempts = game.bridge.snapshot().metrics.insertionAttempts;
    game.upgrade(1); expect(game.scrap).toBe(15); expect(game.towers).toEqual([0, 1, 0]); expect(game.bridge.snapshot().metrics.insertionAttempts).toBe(attempts);
    advance(5000); game.step(17); expect(game.canUpgrade).toBe(false); expect(game.pool.count).toBe(1); game.upgrade(1); expect(game.towers[1]).toBe(1);
  });
  it('uses measured accuracy to choose a safer original word range without changing correctness', () => {
    const create = (averageAccuracy: number) => new ArcadeMachine({ gameId: 'word-invaders', difficulty: 'normal', variant: 'mission', seed: 'accuracy-range', owner: 'guest', sessionId: 'range', averageAccuracy, now: () => 0, wallNow: () => 0 });
    const low = create(80), high = create(99); low.start(); high.start(); expect(low.pool.nearest()!.word.length).toBeLessThanOrEqual(6); expect(high.pool.nearest()!.word.length).toBeGreaterThanOrEqual(5); expect(low.bridge.snapshot().metrics.insertionAttempts).toBe(0);
  });
  it('releases two original short targets from a splitter', () => {
    const { game, advance } = fixture('key-tower'); const entity = game.pool.nearest()!; entity.kind = 'splitter'; advance(100); game.edit(0, 0, entity.word); expect(game.pool.count).toBe(2); expect(game.pool.slots.filter(value => value.active).map(value => value.word).sort()).toEqual(['arc', 'bay']);
  });
  it('never generates a phantom on Easy and masks a recalled hard target only after its preview', () => {
    const { game, at } = fixture('key-tower', 'easy'); expect(game.pool.nearest()!.kind).not.toBe('phantom'); const entity = game.pool.nearest()!; entity.kind = 'phantom'; entity.word = 'horizon'; at(100); game.edit(0, 0, 'h'); expect(game.view().currentWord).toBe('horizon'); at(2000); game.step(17); expect(game.view().currentWord).toBe('ho·····');
  });
  it('wraps Snake on Easy but records a real wall cost on Normal', () => {
    const easy = fixture('snake-words', 'easy'), normal = fixture('snake-words', 'normal'); for (const f of [easy, normal]) { f.game.edit(0, 0, f.game.pool.nearest()!.word[0]); f.game.snake[0] = { x: 11, y: 5 }; f.game.direction = 'right'; f.advance(10); f.game.step(17); } expect(easy.game.snake[0].x).toBe(0); expect(easy.game.hull).toBe(3); expect(normal.game.hull).toBe(2);
  });
  it('uses a correct hard synonym to steer without changing its literal correctness', () => {
    const { game, advance } = fixture('snake-words', 'hard'); game.pool.nearest()!.word = 'rise'; advance(100); game.edit(0, 0, 'rise'); expect(game.direction).toBe('up'); expect(game.snake.length).toBe(4); expect(game.bridge.snapshot().metrics.inputAccuracy).toBe(100);
  });
  it('raises lava faster after actual wrong attempts, including unmatched first keys', () => {
    const calm = fixture('lava-rise'), wrong = fixture('lava-rise'); calm.game.edit(0, 0, calm.game.pool.nearest()!.word[0]); wrong.game.edit(0, 0, '#'); for (const f of [calm, wrong]) { f.advance(1000); f.game.step(1000); } expect(wrong.game.lava).toBeGreaterThan(calm.game.lava);
  });
  it('uses a difficulty-specific daily mission deadline without changing its shared passage', () => {
    const easy = fixture('daily-gauntlet', 'easy'), normal = fixture('daily-gauntlet'), hard = fixture('daily-gauntlet', 'hard'); expect([easy.game.durationMs, normal.game.durationMs, hard.game.durationMs]).toEqual([120000, 90000, 60000]); expect(easy.game.pool.nearest()!.word).toBe(hard.game.pool.nearest()!.word);
  });
  it('requires the whole90seconds for a boss practice victory', () => {
    const { game, advance } = fixture('boss-duel'); for (let i = 0; i < 20; i++) { advance(100); game.edit(0, 0, game.pool.nearest()!.word); } expect(game.finish().outcome).toContain('ended early');
  });
  it('ends the real90second boss deadline without granting a win to idle practice', () => {
    const { game, at } = fixture('boss-duel'); game.edit(0, 0, '#'); at(90000); game.step(17); expect(game.phase).toBe('finished'); expect(game.view().outcome).not.toContain('Duel won');
  });
  it('constructs a ghost only from the selected owner’s real canonical replay', () => {
    const { game, advance } = fixture('ghost-gp'); advance(100); game.edit(0, 0, game.pool.nearest()!.word); advance(100); const session = game.finish().session;
    expect(buildGhostTrack(session, 'another-owner', session.finishedAtWall + 1)).toBeNull(); const track = buildGhostTrack(session, 'guest', session.finishedAtWall + 1)!; expect(ghostUnits(track, 0)).toBe(0); expect(ghostUnits(track, session.elapsedMs)).toBe(session.metrics.creditedUnits);
  });
  it('does not construct an own ghost from expired raw evidence', () => { const { game, advance } = fixture('ghost-gp'); advance(100); game.edit(0, 0, game.pool.nearest()!.word); const session = game.finish().session; expect(buildGhostTrack(session, 'guest', session.finishedAtWall + 90 * 86400000)).toBeNull(); });
  it.each([0, 1, 2, 3, 4])('keeps labelled modelled bot%s progress monotonic', index => {
    let last = 0; for (let at = 0; at < 180000; at += 100) { const units = botUnits(index, at, 35); expect(units).toBeGreaterThanOrEqual(last); last = units; }
  });
});
