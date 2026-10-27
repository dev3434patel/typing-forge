import type { Entity, EntityKind } from './types';
export class EntityPool {
  readonly slots: Entity[];
  private nextId = 1;
  constructor(readonly capacity = 24) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 64) throw new Error('Entity capacity must be 1–64');
    this.slots = Array.from({ length: capacity }, () => ({ id: 0, active: false, word: '', x: 0, y: 0, speed: 0, lane: 0, kind: 'word' as const, phase: 0, spawnedAt: 0, beatAt: 0 }));
  }
  get count(): number { let count = 0; for (const entity of this.slots) if (entity.active) count++; return count; }
  spawn(word: string, x: number, lane: number, speed: number, at: number, kind: EntityKind = 'word'): Entity | null {
    if (!word || !Number.isFinite(x + lane + speed + at)) throw new Error('Invalid entity');
    const entity = this.slots.find(slot => !slot.active);
    if (!entity) return null;
    Object.assign(entity, { id: this.nextId++, active: true, word, x: Math.max(0.1, Math.min(0.9, x)), y: 0.08,
      speed: Math.max(0, speed), lane, kind, phase: 0, spawnedAt: at, beatAt: at + 3500 });
    return entity;
  }
  get(id: number | null): Entity | undefined { return this.slots.find(entity => entity.active && entity.id === id); }
  release(id: number): void { const entity = this.get(id); if (entity) entity.active = false; }
  target(first: string): Entity | undefined {
    let selected: Entity | undefined;
    for (const entity of this.slots) {
      if (!entity.active || !entity.word.startsWith(first)) continue;
      if (!selected || entity.y > selected.y || entity.y === selected.y && entity.id < selected.id) selected = entity;
    }
    return selected;
  }
  nearest(): Entity | undefined {
    let selected: Entity | undefined;
    for (const entity of this.slots) if (entity.active && (!selected || entity.y > selected.y || entity.y === selected.y && entity.id < selected.id)) selected = entity;
    return selected;
  }
  clear(): void { for (const entity of this.slots) entity.active = false; }
}
