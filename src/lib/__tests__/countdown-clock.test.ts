import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchCountdown } from "../countdown-clock";

describe("countdown-only presentation clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
  });
  afterEach(() => vi.useRealTimers());

  it.each([null, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not poll an absent or invalid deadline %s",
    (deadline) => {
      const tick = vi.fn();
      const stop = watchCountdown(deadline, tick);
      vi.advanceTimersByTime(10_000);
      expect(tick).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      stop();
    },
  );

  it("refreshes immediately and at the exact boundary, then stops all timer work", () => {
    const ticks: number[] = [];
    watchCountdown(1_250, (now) => ticks.push(now));
    expect(ticks).toEqual([1_000]);
    vi.advanceTimersByTime(249);
    expect(ticks).toEqual([1_000, 1_100, 1_200]);
    vi.advanceTimersByTime(1);
    expect(ticks).toEqual([1_000, 1_100, 1_200, 1_250]);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(ticks).toHaveLength(4);
  });

  it("publishes an already reached start without scheduling an active-session timer", () => {
    const tick = vi.fn();
    watchCountdown(900, tick);
    expect(tick).toHaveBeenCalledExactlyOnceWith(1_000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rounds a fractional server-offset boundary up to one millisecond without a zero-delay loop", () => {
    const tick = vi.fn();
    watchCountdown(1_000.5, tick);
    vi.advanceTimersByTime(1);
    expect(tick.mock.calls.map(([now]) => now)).toEqual([1_000, 1_001]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans a replaced or unmounted countdown before it can publish again", () => {
    const oldTick = vi.fn();
    const stop = watchCountdown(4_000, oldTick);
    stop();
    const nextTick = vi.fn();
    const stopNext = watchCountdown(1_150, nextTick);
    vi.advanceTimersByTime(1_000);
    expect(oldTick).toHaveBeenCalledTimes(1);
    expect(nextTick.mock.calls.map(([now]) => now)).toEqual([
      1_000, 1_100, 1_150,
    ]);
    expect(vi.getTimerCount()).toBe(0);
    stopNext();
  });

  it("catches up after a delayed/background callback without replaying missed frames", () => {
    const tick = vi.fn();
    watchCountdown(4_000, tick);
    vi.setSystemTime(10_000);
    vi.advanceTimersByTime(100);
    expect(tick.mock.calls.map(([now]) => now)).toEqual([1_000, 10_100]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
