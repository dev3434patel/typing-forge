import { describe, expect, it } from "vitest";
import { opponentPacePosition, raceTargetSlotCount, sameRaceProgressDisplay } from "../race-pace";
import { graphemes } from "../typing-core";

describe("opponent pace position", () => {
  it("prefers the exact bot cursor over correct-character coverage", () => {
    expect(opponentPacePosition(20, { cursor: 8, progress: 25 })).toBe(8);
    expect(opponentPacePosition(20, { cursor: 0, progress: 100 })).toBe(0);
  });

  it("floors exact cursors and bounds them to the target including its end", () => {
    expect(opponentPacePosition(20, { cursor: 8.9 })).toBe(8);
    expect(opponentPacePosition(20, { cursor: -2 })).toBe(0);
    expect(opponentPacePosition(20, { cursor: 20 })).toBe(20);
    expect(opponentPacePosition(20, { cursor: 100 })).toBe(20);
  });

  it("allows the bot cursor to move backward during a correction", () => {
    expect([7, 8, 7, 8].map((cursor) => opponentPacePosition(20, { cursor })))
      .toEqual([7, 8, 7, 8]);
  });

  it("rounds server-confirmed coverage to the nearest canonical target unit", () => {
    expect(opponentPacePosition(7, { progress: 0 })).toBe(0);
    expect(opponentPacePosition(7, { progress: 49 })).toBe(3);
    expect(opponentPacePosition(7, { progress: 50 })).toBe(4);
    expect(opponentPacePosition(7, { progress: 100 })).toBe(7);
  });

  it("bounds remote coverage without imposing monotonic progress", () => {
    expect(opponentPacePosition(10, { progress: -20 })).toBe(0);
    expect(opponentPacePosition(10, { progress: 120 })).toBe(10);
    expect([70, 60].map((progress) => opponentPacePosition(10, { progress })))
      .toEqual([7, 6]);
  });

  it.each([NaN, Infinity, -Infinity])(
    "falls back from a nonfinite exact cursor (%s) to valid confirmed progress",
    (cursor) => {
      expect(opponentPacePosition(20, { cursor, progress: 25 })).toBe(5);
    },
  );

  it.each([undefined, NaN, Infinity, -Infinity])(
    "uses the start for missing or nonfinite coverage (%s)",
    (progress) => {
      expect(opponentPacePosition(20, { progress })).toBe(0);
    },
  );

  it.each([0, -10, NaN, Infinity, -Infinity])(
    "has no passage position for invalid or empty target length (%s)",
    (length) => {
      expect(opponentPacePosition(length, { cursor: 10, progress: 100 })).toBe(0);
    },
  );

  it("normalizes a fractional target count before calculating a position", () => {
    expect(opponentPacePosition(7.9, { cursor: 9 })).toBe(7);
    expect(opponentPacePosition(7.9, { progress: 50 })).toBe(4);
  });

  it("accepts grapheme counts for composed characters and emoji", () => {
    const target = "e\u0301👩🏽‍💻a";
    const units = graphemes(target).length;
    expect(units).toBe(3);
    expect(target.length).toBeGreaterThan(units);
    expect(opponentPacePosition(units, { progress: 100 })).toBe(3);
    expect(opponentPacePosition(units, { cursor: 2 })).toBe(2);
  });
});

describe("race progress display updates", () => {
  it("recognizes unchanged rendered WPM without rounding or mutating source metrics", () => {
    const previous = Object.freeze({ progress: 25, cursor: 10, wpm: 91.12 });
    const next = Object.freeze({ progress: 25, cursor: 10, wpm: 91.4 });
    expect(sameRaceProgressDisplay(previous, next)).toBe(true);
    expect(previous.wpm).toBe(91.12);
    expect(next.wpm).toBe(91.4);
  });

  it("publishes an actual displayed rounding-boundary change", () => {
    expect(sameRaceProgressDisplay({ progress: 25, wpm: 91.49 }, { progress: 25, wpm: 91.5 })).toBe(false);
    expect(sameRaceProgressDisplay({ progress: 25, wpm: 91.5 }, { progress: 25, wpm: 92.49 })).toBe(true);
  });

  it("retains a progress change and a backward bot correction despite unchanged WPM text", () => {
    expect(sameRaceProgressDisplay({ progress: 25, cursor: 10, wpm: 91.12 }, { progress: 25.01, cursor: 10, wpm: 91.4 })).toBe(false);
    expect(sameRaceProgressDisplay({ progress: 25, cursor: 10, wpm: 91.12 }, { progress: 25, cursor: 9, wpm: 91.4 })).toBe(false);
  });

  it("distinguishes a missing pace from a measured zero and finite from nonfinite displays", () => {
    expect(sameRaceProgressDisplay({ progress: 0, wpm: null }, { progress: 0, wpm: 0 })).toBe(false);
    expect(sameRaceProgressDisplay({ progress: 0, wpm: null }, { progress: 0, wpm: null })).toBe(true);
    expect(sameRaceProgressDisplay({ progress: 0, wpm: Infinity }, { progress: 0, wpm: NaN })).toBe(false);
  });

  it("checks both existing WPM labels when their negative-half rounding differs", () => {
    expect((-1.5).toFixed(0)).toBe((-1.6).toFixed(0));
    expect(Math.round(-1.5)).not.toBe(Math.round(-1.6));
    expect(sameRaceProgressDisplay({ progress: 0, wpm: -1.5 }, { progress: 0, wpm: -1.6 })).toBe(false);
  });

  it("does not confuse a cursor-bearing bot projection with a cursor-free track", () => {
    expect(sameRaceProgressDisplay({ progress: 0, wpm: 0 }, { progress: 0, cursor: 0, wpm: 0 })).toBe(false);
  });
});

describe("canonical race target slot count", () => {
  it("counts expected grapheme slots rather than UTF16 units or extra characters", () => {
    const slots = Object.freeze([{ expected: "e\u0301" }, { expected: "👩🏽‍💻" }, { expected: null }, { expected: " " }]);
    expect(raceTargetSlotCount(slots)).toBe(3);
    expect(raceTargetSlotCount(slots)).toBe(slots.filter(slot => slot.expected !== null).length);
  });

  it("matches filter for holes and inherited indexed slots without modifying their shape", () => {
    const slots: Array<{ expected: string | null }> = new Array(4);
    Object.setPrototypeOf(slots, Object.assign(Object.create(Array.prototype), { 1: { expected: "é" } }));
    slots[0] = { expected: null };
    slots[3] = { expected: "b" };
    Object.freeze(slots);
    const keys = Object.keys(slots);
    expect(raceTargetSlotCount(slots)).toBe(slots.filter(slot => slot.expected !== null).length);
    expect(raceTargetSlotCount(slots)).toBe(2);
    expect(Object.keys(slots)).toEqual(keys);
  });

  it("reads each present expected value once, like the original filter predicate", () => {
    let reads = 0;
    const slots = [{ get expected() { reads++; return "a"; } }, { get expected(): string | null { reads++; return null; } }];
    expect(raceTargetSlotCount(slots)).toBe(1);
    expect(reads).toBe(2);
  });

  it("matches filter length normalization on a proxy-backed array", () => {
    const slots = new Proxy([{ expected: "a" }, { expected: null }, { expected: "b" }], {
      get(target, property, receiver) {
        return property === "length" ? 2.8 : Reflect.get(target, property, receiver);
      },
    });
    expect(raceTargetSlotCount(slots)).toBe(slots.filter(slot => slot.expected !== null).length);
    expect(raceTargetSlotCount(slots)).toBe(1);
  });

  it("uses actual current slots rather than a target-text or previous-result assumption", () => {
    const slots: Array<{ expected: string | null }> = [];
    expect(raceTargetSlotCount(slots)).toBe(0);
    slots.push({ expected: "a" }, { expected: null });
    expect(raceTargetSlotCount(slots)).toBe(1);
    slots[0].expected = null;
    expect(raceTargetSlotCount(slots)).toBe(0);
  });
});
