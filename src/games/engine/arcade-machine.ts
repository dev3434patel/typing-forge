import type { InputProvenance, SessionSnapshot } from '@/lib/typing-core';
import { graphemes } from '@/lib/typing-core/transcript';
import { CanonicalGameBridge } from './canonical-bridge';
import { EntityPool } from './entities';
import { SeededRandom } from './random';
import { ARCADE_VERSION, type ArcadeView, type Entity, type GameEvent, type GameEvidence, type GameOptions, type Powerup } from './types';
import { difficultyIndex, gameDefinition, ORIGINAL_WORDS } from '../modes/catalog';
import { BOT_NAMES, botUnits, buildGhostTrack, ghostUnits, type GhostTrack } from '../modes/ghost';

/** Original local arcade simulation. Display scores never enter typing metrics. */
export class ArcadeMachine {
  static readonly maxAttempts = 20_000;
  readonly pool: EntityPool;
  readonly bridge: CanonicalGameBridge;
  readonly random: SeededRandom;
  readonly events: GameEvent[] = [];
  phase: ArcadeView['phase'] = 'ready';
  score = 0; words = 0; hull = 3; combo = 0; wave = 1; scrap = 0;
  towers = [0, 0, 0]; powerups = { slow: 0, bomb: 0, shield: 0 };
  lockedId: number | null = null;
  notice = 'Type a matching first letter to select a word.';
  outcome = ''; actualKey = ''; incorrectKey = false;
  rhythmCombo = 0; lava = 0; platforms = 0;
  snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  direction = 'right'; ghost: GhostTrack | null = null;
  readonly snakeFood = { x: 7, y: 5, word: 'right' };
  private nextSpawn = 0; private slowUntil = 0; private nextSnake = 0;
  private nextBeat = 0; private sequenceWord = 0; private streak = 0;
  private comboUntil = 0; private evidence: GameEvidence | null = null;
  private shieldCharges = 0;
  private readonly level: number; private readonly deck: string[];
  private recentAttempts: { at: number; correct: boolean }[] = [];
  private elapsed = 0;
  private startedMono: number | null = null;
  private pausedTotal = 0;
  hitCount = 0; lastHitX = 0.5; lastHitY = 0.5;
  visualTracks: { name: string; progress: number; ghost?: boolean }[] = [];
  visualNitro = false; visualDraft = false;
  private nitroUntil = 0;
  private upgradeUntil = 0;
  constructor(readonly options: GameOptions) {
    if (!options.seed || !options.owner || !options.sessionId) throw new Error('Game identity and seed are required');
    if (!gameDefinition(options.gameId) || !['mission', 'endless'].includes(options.variant)) throw new Error('Unknown game or run variant');
    if (options.medianWpm !== undefined && (!Number.isFinite(options.medianWpm) || options.medianWpm < 5 || options.medianWpm > 500)) throw new Error('The practice baseline must be a finite 5–500 WPM');
    if (options.averageAccuracy !== undefined && (!Number.isFinite(options.averageAccuracy) || options.averageAccuracy < 0 || options.averageAccuracy > 100)) throw new Error('Measured accuracy must be between0 and100');
    this.level = difficultyIndex(options.difficulty);
    if (this.level < 0) throw new Error('Unknown difficulty');
    this.random = new SeededRandom(options.seed);
    this.pool = new EntityPool(options.mobile ? 18 : 30);
    this.bridge = new CanonicalGameBridge(options);
    if (options.ghost) this.ghost = buildGhostTrack(options.ghost, options.owner, options.wallNow());
    this.deck = (options.dailyText ?? this.ghost?.text ?? '').split(/\s+/u).filter(Boolean);
    if (options.gameId === 'daily-gauntlet' && !this.deck.length) throw new Error('Prepare the UTC challenge before starting');
  }
  get bpm(): number { return [90, 110, 130][this.level]; }
  get canUpgrade(): boolean { return this.options.gameId === 'key-tower' && this.phase === 'playing' && this.elapsed < this.upgradeUntil; }
  get elapsedMs(): number { return this.elapsed; }
  get hasStarted(): boolean { return this.bridge.controller.timingOrigin !== null; }
  get durationMs(): number {
    if (this.options.gameId === 'boss-duel') return 90_000;
    if (this.options.gameId === 'daily-gauntlet' && this.options.variant === 'mission') return [120_000, 90_000, 60_000][this.level];
    return this.options.variant === 'endless' ? 300_000 : 120_000;
  }
  start(): void { if (this.phase !== 'ready') return; this.phase = 'playing'; this.spawn(); this.nextSpawn = this.spawnInterval(); }
  private synchronizeClock(snapshot: SessionSnapshot): void {
    const origin = this.bridge.controller.timingOrigin;
    if (!origin) { this.elapsed = 0; return; }
    this.startedMono = origin.monotonic;
    this.elapsed = snapshot.elapsedMs;
    // Derive actual canonical pauses; a pause before first input has no origin
    // and therefore cannot subtract from a later run's active duration.
    this.pausedTotal = Math.max(0, snapshot.wallDurationMs - snapshot.elapsedMs);
  }
  private record(type: GameEvent['type'], entityId?: number, value?: string | number): void {
    if (this.events.length < 6000) this.events.push({ sequence: this.events.length, offsetMs: this.elapsed, type, ...(entityId === undefined ? {} : { entityId }), ...(value === undefined ? {} : { value }) });
  }
  private sequential(): boolean { return !['word-invaders', 'key-tower'].includes(this.options.gameId); }
  private spawnInterval(): number { return Math.max(1200, 4900 - this.level * 700 - Math.min(this.wave, 12) * 100); }
  private word(): string {
    if (this.deck.length) return this.deck[this.sequenceWord++ % this.deck.length];
    if (this.options.gameId === 'snake-words') {
      const words = this.options.difficulty === 'hard' ? ['up', 'down', 'left', 'right', 'rise', 'drop', 'west', 'east'] : ['up', 'down', 'left', 'right'];
      const reverse: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' };
      return this.random.pick(words.filter(word => this.snakeDirection(word) !== reverse[this.direction]));
    }
    const adjustment = this.options.averageAccuracy === undefined ? 0 : this.options.averageAccuracy < 90 ? -1 : this.options.averageAccuracy >= 98 ? 1 : 0;
    const min = Math.max(3, 3 + this.level + adjustment);
    return this.random.pick(ORIGINAL_WORDS.filter(word => word.length >= min && word.length <= min + 3));
  }
  private spawn(word = this.word(), kind: Entity['kind'] = 'word', lane = this.random.integer(0, 2)): Entity | null {
    if (this.sequential() && this.pool.count) return null;
    if (this.options.gameId === 'word-invaders' && this.wave % 5 === 0 && !this.pool.slots.some(entity => entity.active && entity.kind === 'boss')) { kind = 'boss'; word = 'steady'; }
    if (this.options.gameId === 'key-tower' && kind === 'word') kind = this.random.pick(this.level === 0 ? ['runner', 'tank', 'splitter'] as const : ['runner', 'tank', 'splitter', 'phantom'] as const);
    if (kind === 'tank') word = this.random.pick(['horizon', 'starlight', 'reflection', 'resonance']);
    if (kind === 'runner' && word.length > 4) word = this.random.pick(['arc', 'bay', 'air', 'sun']);
    const baseline = Math.max(10, Math.min(180, this.options.medianWpm ?? 35));
    const speed = (0.0225 * [0.8, 1, 1.2][this.level] + this.wave * 0.0005) * (baseline / 35) * (kind === 'runner' ? 1.6 : 1);
    const entity = this.pool.spawn(word, this.options.gameId === 'key-tower' ? (lane + 0.5) / 3 : 0.14 + this.random.next() * 0.72, lane, speed, this.elapsed, kind);
    if (entity && this.options.gameId === 'rhythm-typing') { entity.beatAt = Math.max(this.nextBeat, this.elapsed + 60000 / this.bpm * 4); this.nextBeat = entity.beatAt + 60000 / this.bpm * 4; }
    if (entity && this.options.gameId === 'snake-words') {
      const direction = this.snakeDirection(word), vector = ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as Record<string, number[]>)[direction];
      this.snakeFood.x = (this.snake[0].x + vector[0] * 2 + 12) % 12; this.snakeFood.y = (this.snake[0].y + vector[1] * 2 + 12) % 12; this.snakeFood.word = word;
    }
    return entity;
  }
  step(dt: number): void {
    if (this.phase !== 'playing' || !Number.isFinite(dt) || dt < 0) return;
    if (this.startedMono === null) {
      if (!this.hasStarted) return;
      this.synchronizeClock(this.bridge.snapshot());
    }
    if (this.startedMono === null) return;
    this.elapsed = Math.max(this.elapsed, this.options.now() - this.startedMono - this.pausedTotal);
    if (this.elapsed >= this.durationMs) { this.finish(); return; }
    const slow = this.elapsed < this.slowUntil ? 0.45 : 1;
    for (const entity of this.pool.slots) {
      if (!entity.active) continue;
      if (this.options.gameId === 'rhythm-typing') entity.y = Math.min(0.85, 0.12 + (this.elapsed - entity.spawnedAt) / Math.max(1, entity.beatAt - entity.spawnedAt) * 0.55);
      else if (!this.sequential()) {
        entity.y += entity.speed * Math.min(dt, 100) / 1000 * slow;
        if (this.options.gameId === 'key-tower') entity.y -= Math.min(entity.y - 0.08, this.towers[entity.lane] * 0.002 * dt / 1000);
        if (entity.y >= 0.95) { this.damage(entity.id); this.pool.release(entity.id); }
      }
    }
    if (!this.sequential() && this.elapsed >= this.nextSpawn && !this.canUpgrade) { this.spawn(); this.nextSpawn = this.elapsed + this.spawnInterval(); }
    if (this.options.gameId === 'snake-words' && this.elapsed >= this.nextSnake) { this.moveSnake(); this.nextSnake = this.elapsed + Math.max(220, 1000 - this.level * 180 - Math.floor(this.words / 5) * 45); }
    if (this.options.gameId === 'lava-rise') {
      this.recentAttempts = this.recentAttempts.filter(attempt => this.elapsed - attempt.at <= 60_000);
      const accuracy = this.recentAttempts.length ? this.recentAttempts.filter(attempt => attempt.correct).length / this.recentAttempts.length : 1;
      this.lava = Math.max(0, this.lava + (0.018 + (1 - accuracy) * 0.08 + this.level * 0.004) * dt / 1000);
      if (this.lava >= 1) this.finish('The lava reached your route. Your measured practice is saved.');
    }
  }
  private damage(id: number): void {
    if (this.lockedId === id) { this.bridge.submit(); this.lockedId = null; }
    if (this.shieldCharges > 0) { this.shieldCharges--; this.notice = 'Shield absorbed the impact.'; }
    else { this.hull = Math.max(0, this.hull - 1); this.notice = 'One hull point lost. Take your time on the next word.'; this.record('damage', id); }
    if (this.hull === 0) this.finish('Three hull points spent. Every attempt remains in your report.');
  }
  /** Null means no insertion was recorded; edits and ignored input stay silent. */
  edit(start: number, end: number, text: string, provenance: InputProvenance = 'keyboard', compositionId?: string): boolean | null {
    if (this.phase !== 'playing') return null;
    const snapshot = this.bridge.snapshot();
    this.synchronizeClock(snapshot);
    if (this.elapsed >= this.durationMs) { this.finish(); return null; }
    if (snapshot.metrics.insertionAttempts + graphemes(text).length > ArcadeMachine.maxAttempts) { this.finish('The bounded practice log cannot accept this input. Start another run when ready.'); return null; }
    if (!this.pool.count) { if (this.canUpgrade) { this.notice = 'Between waves: spend scrap on a lane tower, then the next wave begins.'; return null; } this.spawn(); }
    if (!this.lockedId && text) {
      const selected = this.pool.target(graphemes(text)[0]);
      if (!selected) { const target = this.pool.nearest(); if (target && !this.bridge.target) this.bridge.assign(target.word); this.synchronizeClock(this.bridge.reject(text, provenance, compositionId)); for (const attempt of this.bridge.controller.lastInputAttempts) this.recentAttempts.push({ at: this.elapsed, correct: attempt.correct }); this.actualKey = text; this.incorrectKey = true; this.combo = 0; this.streak = 0; this.notice = `No matching target for ${text}. Attempt recorded.`; if (this.bridge.snapshot().metrics.insertionAttempts >= ArcadeMachine.maxAttempts) this.finish('The bounded practice log is full. Start another run when ready.'); return false; }
      if (this.bridge.target) this.bridge.submit();
      this.bridge.assign(selected.word); this.lockedId = selected.id; this.record('lock', selected.id);
    }
    if (!this.lockedId) return null;
    const before = this.bridge.snapshot().metrics.insertionAttempts;
    this.synchronizeClock(this.bridge.edit(start, end, text, provenance, compositionId));
    const attempts = this.bridge.controller.lastInputAttempts;
    const insertionFeedback = text && attempts.length ? attempts.every(attempt => attempt.correct) : null;
    for (const attempt of attempts) if (attempt.correct) { this.hitCount++; const hit = this.pool.get(this.lockedId); if (hit) { this.lastHitX = hit.x; this.lastHitY = hit.y; } }
    this.actualKey = text; this.incorrectKey = !!text && attempts.some(attempt => !attempt.correct);
    if (text) for (const attempt of attempts) { this.recentAttempts.push({ at: this.elapsed, correct: attempt.correct }); this.streak = attempt.correct ? this.streak + 1 : 0; }
    if (this.incorrectKey) { this.combo = 0; this.notice = `Pressed ${text}. Expected ${graphemes(this.bridge.target)[graphemes(this.bridge.draft).length] ?? 'word completion'}.`; }
    if (this.streak >= 30 && this.elapsed >= this.comboUntil) this.comboUntil = this.elapsed + 20_000;
    if (this.options.gameId === 'ghost-gp' && this.streak > 0 && this.streak % 40 === 0) this.nitroUntil = this.elapsed + 2000;
    if (this.bridge.snapshot().metrics.insertionAttempts < before) throw new Error('Canonical attempts cannot decrease');
    if (this.bridge.snapshot().metrics.insertionAttempts >= ArcadeMachine.maxAttempts) { this.finish('The bounded practice log is full. Start another run when ready.'); return insertionFeedback; }
    if (this.bridge.complete) this.completeWord();
    return insertionFeedback;
  }
  unlock(): void {
    if (this.bridge.draft) return;
    if (this.bridge.target) this.bridge.submit();
    if (this.lockedId) this.record('unlock', this.lockedId);
    this.lockedId = null; this.notice = 'Target unlocked. Type a matching first letter.';
  }
  private completeWord(): void {
    const entity = this.pool.get(this.lockedId); if (!entity) return;
    const accuracy = this.bridge.currentWordAccuracy;
    this.bridge.submit(); this.words++; this.combo++; this.score += (entity.word.length * 10 + this.combo * 2) * (this.elapsed < this.comboUntil ? 2 : 1);
    this.record('complete-word', entity.id, entity.word);
    if (this.options.gameId === 'rhythm-typing') { const windowMs = [180, 120, 90][this.level]; this.rhythmCombo = Math.abs(this.elapsed - entity.beatAt) <= windowMs ? this.rhythmCombo + 1 : 0; this.notice = this.rhythmCombo ? 'On the beat. Exact text complete.' : 'Exact text complete. Timing only affects the rhythm combo.'; }
    else this.notice = accuracy >= 98 ? 'Clean word. Keep the same rhythm.' : 'Word completed. The original attempts remain counted.';
    if (this.options.gameId === 'ghost-gp' && accuracy < 90) this.notice = 'Sector accuracy below90%: visible tire wear. Real typed progress and result time are unchanged.';
    if (this.options.gameId === 'key-tower') this.scrap += 5;
    if (this.options.gameId === 'lava-rise') { this.platforms++; this.lava = Math.max(0, this.lava - 0.08); }
    if (this.options.gameId === 'snake-words') { this.direction = this.snakeDirection(entity.word); if (this.snake.length < 120) this.snake.push({ ...this.snake.at(-1)! }); else { this.finish('A full route. Your snake reached its safe length limit.'); return; } }
    if (entity.kind === 'boss') {
      if (accuracy >= 90) entity.phase++;
      if (entity.phase < 3) { entity.word = ['steady', 'signal', 'returns'][entity.phase]; this.lockedId = null; return; }
    }
    const split = entity.kind === 'splitter'; const lane = entity.lane;
    this.pool.release(entity.id); this.lockedId = null;
    if (split) { this.spawn('arc', 'runner', lane); this.spawn('bay', 'runner', (lane + 1) % 3); }
    if (this.words % 6 === 0) { this.wave++; this.powerups.slow = Math.min(2, this.powerups.slow + 1);
      if (this.options.gameId === 'key-tower') { this.pool.clear(); this.upgradeUntil = this.elapsed + 5000; this.nextSpawn = this.upgradeUntil; this.notice = 'Five seconds between waves. Spend earned scrap on a lane tower.'; }
    }
    if (this.words % 10 === 0) this.powerups.bomb = Math.min(2, this.powerups.bomb + 1);
    if (this.words % 8 === 0) this.powerups.shield = Math.min(2, this.powerups.shield + 1);
    const missionWords = this.options.gameId === 'daily-gauntlet' ? this.deck.length : this.options.gameId === 'ghost-gp' && this.deck.length ? this.deck.length : this.options.gameId === 'word-invaders' ? 36 : 24;
    if (this.options.gameId !== 'boss-duel' && this.options.variant === 'mission' && this.words >= missionWords) this.finish('Mission complete. LOCAL practice result.');
    else if (this.sequential()) this.spawn();
  }
  usePowerup(type: Powerup): void {
    if (this.phase !== 'playing' || this.powerups[type] <= 0) return;
    this.powerups[type]--; this.record('powerup', undefined, type);
    if (type === 'slow') this.slowUntil = this.elapsed + 6000;
    if (type === 'bomb') for (const entity of this.pool.slots) if (entity.active && entity.word.length <= 4 && entity.kind !== 'boss') {
      if (entity.id === this.lockedId) { this.bridge.submit(); this.lockedId = null; }
      this.pool.release(entity.id); this.score += 10;
    }
    if (type === 'shield') this.shieldCharges = 1;
    this.notice = type === 'bomb' ? 'Short targets cleared. No typing credit was created.' : type === 'slow' ? 'Six seconds of slower visual threats.' : 'Shield ready for the next impact.';
  }
  upgrade(lane: number): void {
    if (!this.canUpgrade || !Number.isInteger(lane) || lane < 0 || lane > 2 || this.scrap < 15 || this.towers[lane] >= 3) return;
    this.scrap -= 15; this.towers[lane]++; this.record('upgrade', undefined, lane); this.notice = `Lane ${lane + 1} tower upgraded using in-run scrap.`;
  }
  private snakeDirection(word: string): string { return ({ rise: 'up', drop: 'down', west: 'left', east: 'right' } as Record<string, string>)[word] ?? word; }
  private moveSnake(): void {
    const previous = this.snake[0], vector = ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as Record<string, number[]>)[this.direction];
    let x = previous.x + vector[0], y = previous.y + vector[1];
    if (this.level === 0) { x = (x + 12) % 12; y = (y + 12) % 12; }
    else if (x < 0 || y < 0 || x >= 12 || y >= 12) { this.hull = Math.max(0, this.hull - 1); this.direction = x < 0 ? 'right' : x >= 12 ? 'left' : y < 0 ? 'down' : 'up'; this.notice = 'Wall contact. A hull point was spent; choose the next turn.'; if (!this.hull) this.finish('The route reached its final turn.'); return; }
    if (this.snake.some((part, index) => index > 0 && part.x === x && part.y === y)) { this.finish('Your route crossed itself. Try a wider turn.'); return; }
    for (let i = this.snake.length - 1; i > 0; i--) { this.snake[i].x = this.snake[i - 1].x; this.snake[i].y = this.snake[i - 1].y; }
    this.snake[0].x = x; this.snake[0].y = y;
  }
  pause(): void { if (this.phase !== 'playing') return; this.synchronizeClock(this.bridge.pause()); this.phase = 'paused'; this.record('pause'); this.notice = 'Paused. Resume when you are ready.'; }
  resume(): void { if (this.phase !== 'paused') return; this.synchronizeClock(this.bridge.resume()); this.phase = 'playing'; this.record('resume'); }
  discard(): void { this.evidence = null; this.phase = 'finished'; this.notice = 'This workspace’s arcade data was cleared. The in-progress run was discarded.'; this.outcome = this.notice; }
  finish(outcome?: string): GameEvidence {
    if (this.evidence) return this.evidence;
    const session = this.bridge.finish(); this.elapsed = session.elapsedMs;
    const bossUnits = (this.options.medianWpm ?? 35) * 1.05 * 5 * 90 / 60;
    this.outcome = outcome ?? (this.options.gameId === 'boss-duel' ? this.elapsed >= 90_000 && session.metrics.creditedUnits > bossUnits && (session.metrics.inputAccuracy ?? 0) >= 95 ? 'Duel won: more measured progress and at least 95% accuracy.' : this.elapsed < 90_000 ? 'Duel ended early. A full90-second attempt is needed for a practice victory.' : 'Duel complete. Build accuracy and try the same pace again.' : 'Practice complete. Your canonical report is ready.');
    this.phase = 'finished'; this.record('finish', undefined, this.outcome);
    return this.evidence = { version: ARCADE_VERSION, gameId: this.options.gameId, difficulty: this.options.difficulty, variant: this.options.variant, seed: this.options.seed, session,
      gameEvents: this.events.slice(), score: this.score, completedWords: this.words, outcome: this.outcome, verification: 'local-unverified' };
  }
  view(): ArcadeView {
    const snapshot = this.bridge.snapshot(), totalUnits = this.ghost?.targetUnits ?? Math.max(120, this.deck.join(' ').length || 500);
    this.synchronizeClock(snapshot);
    const bossUnits = (this.options.medianWpm ?? 35) * 1.05 * this.elapsed / 12000;
    const bots = BOT_NAMES.map((name, index) => ({ name, progress: Math.min(1, botUnits(index, this.elapsed, (this.options.medianWpm ?? 35) * [0.8, 1, 1.2][this.level]) / totalUnits) }));
    const progress = Math.min(1, snapshot.metrics.creditedUnits / totalUnits);
    const instantWpm = this.recentAttempts.filter(attempt => this.elapsed - attempt.at <= 3000 && attempt.correct).length * 4;
    this.visualDraft = this.options.gameId === 'ghost-gp' && bots.some(bot => bot.progress > progress && Math.abs(instantWpm - (this.options.medianWpm ?? 35)) <= 5);
    this.visualNitro = this.elapsed < this.nitroUntil;
    this.visualTracks = [{ name: 'YOU', progress }, ...(this.ghost ? [{ name: 'OWN GHOST', progress: Math.min(1, ghostUnits(this.ghost, this.elapsed) / totalUnits), ghost: true }] : []), ...bots.map(bot => ({ name: `${bot.name} BOT`, progress: bot.progress }))];
    return { phase: this.phase, clockStarted: this.hasStarted, elapsedMs: snapshot.elapsedMs, words: this.words, score: this.score, hull: this.hull, wave: this.wave, combo: this.combo,
      currentWord: this.pool.get(this.lockedId)?.kind === 'phantom' && this.elapsed - this.pool.get(this.lockedId)!.spawnedAt >= 1500 ? this.bridge.target.slice(0, 2) + '·'.repeat(Math.max(0, this.bridge.target.length - 2)) : this.bridge.target, draft: this.bridge.draft, actualKey: this.actualKey, incorrectKey: this.incorrectKey, accuracy: snapshot.metrics.inputAccuracy,
      wpm: snapshot.metrics.wpm, notice: this.notice, outcome: this.outcome, entities: this.pool.slots.filter(entity => entity.active).map(entity => ({ ...entity })), lockedId: this.lockedId,
      beatPhase: this.elapsed % (60000 / this.bpm) / (60000 / this.bpm), rhythmCombo: this.rhythmCombo, scrap: this.scrap, towers: this.towers.slice(), lava: this.lava,
      platforms: this.platforms, snake: this.snake.map(part => ({ ...part })), direction: this.direction, bossProgress: Math.min(1, bossUnits / totalUnits),
      playerProgress: Math.min(1, snapshot.metrics.creditedUnits / totalUnits), ghostProgress: this.ghost ? Math.min(1, ghostUnits(this.ghost, this.elapsed) / totalUnits) : null,
      bots,
      powerups: { ...this.powerups }, focusSuggested: (snapshot.metrics.insertionAttempts >= 10 && (snapshot.metrics.inputAccuracy ?? 100) < 85), evidence: this.evidence };
  }
}
