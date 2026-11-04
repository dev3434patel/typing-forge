import { describe, expect, it } from "vitest";
import { opponentPacePosition } from "../race-pace";
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
