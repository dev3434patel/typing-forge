/** Original seeded PRNG. State is explicit so simulations have reproducible spawns. */
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  return hash >>> 0;
}
export class SeededRandom {
  private value: number;
  constructor(seed: string | number) { this.value = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed); }
  next(): number {
    this.value = (this.value + 0x6d2b79f5) >>> 0;
    let value = this.value;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }
  integer(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new Error('Invalid random range');
    return min + Math.floor(this.next() * (max - min + 1));
  }
  pick<T>(items: readonly T[]): T { if (!items.length) throw new Error('Cannot choose from an empty pool'); return items[this.integer(0, items.length - 1)]; }
}
