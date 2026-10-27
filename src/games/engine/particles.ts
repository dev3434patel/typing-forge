import { SeededRandom } from './random';
export interface Particle { active: boolean; x: number; y: number; vx: number; vy: number; age: number; life: number }
/** Allocated once; slow-device adaptation affects visual emissions only. */
export class ParticlePool {
  readonly slots: Particle[];
  limit: number;
  private lowFrameMs = 0;
  constructor(mobile: boolean, private random = new SeededRandom('particles')) {
    this.limit = mobile ? 120 : 300;
    this.slots = Array.from({ length: this.limit }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0 }));
  }
  emit(x: number, y: number, count = 8): void {
    for (let index = 0; index < this.limit && count > 0; index++) {
      const particle = this.slots[index]; if (particle.active) continue;
      Object.assign(particle, { active: true, x, y, vx: (this.random.next() - 0.5) * 0.4,
        vy: (this.random.next() - 0.5) * 0.4, age: 0, life: 300 + this.random.next() * 300 }); count--;
    }
  }
  update(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) return;
    for (const particle of this.slots) if (particle.active) { particle.age += dt; if (particle.age >= particle.life) particle.active = false;
      else { particle.x += particle.vx * dt / 1000; particle.y += particle.vy * dt / 1000; } }
  }
  observeFrame(dt: number): void {
    this.lowFrameMs = dt > 1000 / 45 ? this.lowFrameMs + Math.min(dt, 250) : 0;
    if (this.lowFrameMs >= 3000) { this.limit = Math.max(30, Math.floor(this.limit / 2)); this.lowFrameMs = 0; for (let i = this.limit; i < this.slots.length; i++) this.slots[i].active = false; }
  }
  clear(): void { for (const particle of this.slots) particle.active = false; }
}
