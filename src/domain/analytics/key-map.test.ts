import { describe, expect, it } from 'vitest';
import type { MeasuredSkill } from './session-insights';
import { referenceKeyMeasurement } from './key-map';
const measurement = (key: string, n: number, correct: number, speedMs: number | null, latencySamples: number): MeasuredSkill => ({ key, n, correct, accuracy: correct / n * 100, smoothedAccuracy: (correct + 1) / (n + 2), speedMs, latencySamples });
describe('post-test physical reference cells', () => {
  it('weights base/shift accuracy and latency by actual different sample counts', () => {
    const value = referenceKeyMeasurement([measurement('1', 100, 99, 100, 50), measurement('!', 10, 5, 300, 2)], '1', '!')!;
    expect(value.n).toBe(110); expect(value.correct).toBe(104);
    expect(value.accuracy).toBeCloseTo(104 / 110 * 100);
    expect(value.speedMs).toBeCloseTo(5600 / 52);
  });
  it('does not double-count uppercase forms already aggregated by canonical insights', () => {
    expect(referenceKeyMeasurement([measurement('a', 20, 18, 100, 10)], 'a', 'A')?.n).toBe(20);
  });
  it('keeps missing and untimed measurements unavailable', () => {
    expect(referenceKeyMeasurement([], 'a', 'A')).toBeUndefined();
    expect(referenceKeyMeasurement([measurement('a', 1, 1, null, 0)], 'a', 'A')?.speedMs).toBeNull();
  });
});
