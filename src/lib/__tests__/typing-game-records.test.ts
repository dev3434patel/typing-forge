import { describe, expect, it } from "vitest";
import {
  createTypingGame,
  SIGNAL_RUN_VERSION,
  type TypingGameState,
} from "../typing-game";
import {
  readTypingGameRecords,
  mergeTypingGameRecords,
  serializeTypingGameRecords,
  typingGameRecord,
  typingGameStorageKey,
  updateTypingGameRecords,
} from "../typing-game-records";

const result = (overrides: Partial<TypingGameState> = {}): TypingGameState => ({
  ...createTypingGame("paced"),
  phase: "complete",
  outcome: "timeout",
  gate: 8,
  attempts: 50,
  correctAttempts: 45,
  cleanGates: 6,
  elapsedMs: 60_000,
  ...overrides,
});

describe("separate local game bests", () => {
  it("retains a newer better persisted score when a stale tab completes a weaker run", () => {
    const staleMemory = updateTypingGameRecords(
      {},
      result({ gate: 3, cleanGates: 2 }),
    );
    const newerPersisted = updateTypingGameRecords(
      {},
      result({ gate: 14, cleanGates: 12 }),
    );
    const merged = mergeTypingGameRecords(
      staleMemory,
      readTypingGameRecords(serializeTypingGameRecords(newerPersisted)),
    );
    const afterCompletion = updateTypingGameRecords(
      merged,
      result({ gate: 8, cleanGates: 6 }),
    );
    expect(afterCompletion.paced).toEqual(newerPersisted.paced);
    expect(staleMemory.paced?.gates).toBe(3);
  });

  it("merges the best of each mode without downgrading an in-memory fallback", () => {
    const memory = updateTypingGameRecords({}, result({ gate: 14 }));
    const stored = updateTypingGameRecords(
      updateTypingGameRecords({}, result({ gate: 3 })),
      result({ mode: "calm", gate: 18, outcome: "cleared" }),
    );
    const merged = mergeTypingGameRecords(memory, stored);
    expect(merged.paced?.gates).toBe(14);
    expect(merged.calm?.gates).toBe(18);
    expect(mergeTypingGameRecords(merged, stored)).toBe(merged);
  });

  it("serializes equal merged records identically regardless of insertion order", () => {
    const paced = typingGameRecord(result())!;
    const calm = typingGameRecord(
      result({ mode: "calm", gate: 18, outcome: "cleared" }),
    )!;
    expect(serializeTypingGameRecords({ paced, calm })).toBe(
      serializeTypingGameRecords({ calm, paced }),
    );
  });
  it("stores only game summary fields, never raw input, account data or WPM", () => {
    const record = typingGameRecord(result({ draft: "private typed text" }))!;
    expect(record).toEqual({
      version: SIGNAL_RUN_VERSION,
      mode: "paced",
      gates: 8,
      cleanGates: 6,
      accuracy: 90,
      elapsedMs: 60_000,
      paused: false,
    });
    expect(JSON.stringify(record)).not.toContain("private");
    expect(record).not.toHaveProperty("wpm");
  });

  it.each([
    { phase: "playing" as const },
    { assisted: true },
    { outcome: "ended" as const },
    { attempts: 0 },
  ])(
    "excludes incomplete, assisted, manually ended or empty evidence (%j)",
    (override) => {
      expect(typingGameRecord(result(override))).toBeNull();
      const records = {};
      expect(updateTypingGameRecords(records, result(override))).toBe(records);
    },
  );

  it("keeps calm and paced records in separate slots", () => {
    let records = updateTypingGameRecords({}, result());
    records = updateTypingGameRecords(
      records,
      result({ mode: "calm", outcome: "cleared", gate: 18 }),
    );
    expect(records.calm?.gates).toBe(18);
    expect(records.paced?.gates).toBe(8);
  });

  it("uses the documented gates, clean gates, accuracy, active time priority", () => {
    const best = updateTypingGameRecords({}, result());
    expect(
      updateTypingGameRecords(
        best,
        result({ gate: 7, cleanGates: 7, correctAttempts: 50 }),
      ),
    ).toBe(best);
    const moreGates = updateTypingGameRecords(
      best,
      result({ gate: 9, cleanGates: 0, correctAttempts: 1 }),
    );
    expect(moreGates.paced?.gates).toBe(9);
    const cleaner = updateTypingGameRecords(best, result({ cleanGates: 7 }));
    expect(cleaner.paced?.cleanGates).toBe(7);
    const accurate = updateTypingGameRecords(
      best,
      result({ correctAttempts: 46 }),
    );
    expect(accurate.paced?.accuracy).toBe(92);
    expect(
      updateTypingGameRecords(best, result({ elapsedMs: 59_999 })).paced
        ?.elapsedMs,
    ).toBe(59_999);
    expect(updateTypingGameRecords(best, result())).toBe(best);
  });

  it("identifies paused local practice without changing the honest accuracy", () => {
    expect(typingGameRecord(result({ paused: true }))).toMatchObject({
      paused: true,
      accuracy: 90,
    });
  });

  it("isolates storage keys by owner and encodes separators", () => {
    expect(typingGameStorageKey("guest")).not.toBe(
      typingGameStorageKey("account"),
    );
    expect(typingGameStorageKey("a:b")).not.toBe(typingGameStorageKey("a%3Ab"));
  });

  it.each([
    null,
    "null",
    "broken",
    "[]",
    '{"paced":{"version":"old"}}',
    "x".repeat(20_000),
  ])("tolerates absent, malformed or incompatible storage", (raw) => {
    expect(readTypingGameRecords(raw)).toEqual({});
  });

  it("validates stored numbers and whitelists fields before reusing a best", () => {
    const record = typingGameRecord(result())!;
    expect(
      readTypingGameRecords(
        JSON.stringify({ paced: { ...record, gates: -1 } }),
      ),
    ).toEqual({});
    expect(
      readTypingGameRecords(
        JSON.stringify({ paced: { ...record, accuracy: 101 } }),
      ),
    ).toEqual({});
    expect(
      readTypingGameRecords(
        JSON.stringify({ paced: { ...record, cleanGates: 9 } }),
      ),
    ).toEqual({});
    expect(
      readTypingGameRecords(
        JSON.stringify({ paced: { ...record, rawText: "not kept" } }),
      ).paced,
    ).toEqual(record);
  });
});
