import { describe, expect, it } from "vitest";
import {
  ACCURACY_CHALLENGE_GOAL,
  advanceAccuracyChallenge,
  createAccuracyChallenge,
  type AccuracyChallengeState,
} from "../accuracy-challenge";
import { SessionController, type SessionSnapshot } from "../typing-core";

function batch(
  state: AccuracyChallengeState,
  sequence: number,
  correct: boolean[],
) {
  return advanceAccuracyChallenge(
    state,
    state.sessionId,
    sequence,
    correct.map((value) => ({ correct: value, eventSequence: sequence })),
  );
}

function fixture(target = "a".repeat(100)) {
  const controller = new SessionController(
    {
      clientSessionId: "canonical-challenge",
      mode: "time",
      durationMs: 30_000,
      initialTarget: target,
    },
    { now: () => 0, wallNow: () => 1_700_000_000_000 },
  );
  let state = createAccuracyChallenge(controller.configuration.clientSessionId);
  return {
    controller,
    get state() {
      return state;
    },
    consume(snapshot: SessionSnapshot) {
      state = advanceAccuracyChallenge(
        state,
        controller.configuration.clientSessionId,
        snapshot.events.at(-1)?.sequence,
        controller.lastInputAttempts,
      );
      return state;
    },
  };
}

describe("optional local accuracy challenge", () => {
  it("starts empty and reaches its fixed goal on the 25th correct attempt", () => {
    let state = createAccuracyChallenge("one");
    expect(state).toMatchObject({
      current: 0,
      best: 0,
      completed: false,
      lastSequence: -1,
    });
    for (let sequence = 0; sequence < ACCURACY_CHALLENGE_GOAL - 1; sequence++) {
      state = batch(state, sequence, [true]);
      expect(state.completed).toBe(false);
    }
    expect(state.current).toBe(24);
    expect(batch(state, 24, [true])).toMatchObject({
      current: 25,
      best: 25,
      completed: true,
    });
  });

  it("restarts at a mistake within a batch while preserving the best earlier chain", () => {
    const state = batch(createAccuracyChallenge("one"), 0, [
      ...Array<boolean>(12).fill(true),
      false,
      true,
      true,
      true,
    ]);
    expect(state).toMatchObject({ current: 3, best: 12, completed: false });
  });

  it("keeps completion recorded after later errors and bounds all displayed counts", () => {
    let state = batch(
      createAccuracyChallenge("one"),
      0,
      Array<boolean>(40).fill(true),
    );
    expect(state).toMatchObject({ current: 25, best: 25, completed: true });
    state = batch(state, 1, [false, true]);
    expect(state).toMatchObject({ current: 1, best: 25, completed: true });
  });

  it("retains a goal reached before a later error in the same input batch", () => {
    const state = batch(createAccuracyChallenge("one"), 0, [
      ...Array<boolean>(25).fill(true),
      false,
      true,
    ]);
    expect(state).toMatchObject({ current: 1, best: 25, completed: true });
  });

  it("does not award deletion progress or refund the mistake that was deleted", () => {
    const test = fixture();
    test.consume(test.controller.input({ type: "insert", text: "aaaa" }, 0));
    expect(test.state.current).toBe(4);
    test.consume(test.controller.input({ type: "delete" }, 10));
    expect(test.state.current).toBe(4);
    test.consume(test.controller.input({ type: "insert", text: "x" }, 20));
    expect(test.state.current).toBe(0);
    test.consume(test.controller.input({ type: "delete" }, 30));
    expect(test.state).toMatchObject({ current: 0, best: 4, completed: false });
    test.consume(test.controller.input({ type: "insert", text: "a" }, 40));
    expect(test.state.current).toBe(1);
    expect(test.controller.snapshot(40).metrics).toMatchObject({
      insertionAttempts: 6,
      correctAttempts: 5,
      incorrectAttempts: 1,
    });
  });

  it("does not farm progress from repeated snapshots, clock refreshes or older sequences", () => {
    const test = fixture();
    const first = test.controller.input({ type: "insert", text: "aaa" }, 0);
    const state = test.consume(first);
    for (let time = 100; time <= 10_000; time += 100) {
      expect(test.consume(test.controller.tick(time))).toBe(state);
    }
    test.consume(test.controller.input({ type: "insert", text: "aa" }, 10_100));
    const latest = test.state;
    expect(test.consume(first)).toBe(latest);
    expect(latest).toMatchObject({ current: 5, best: 5, completed: false });
  });

  it("resets all progress for a new controller session even before its first edit", () => {
    const complete = batch(
      createAccuracyChallenge("old"),
      4,
      Array<boolean>(25).fill(true),
    );
    const ready = advanceAccuracyChallenge(complete, "new", undefined, []);
    expect(ready).toEqual(createAccuracyChallenge("new"));
    expect(
      advanceAccuracyChallenge(complete, "new", 0, [
        { correct: true, eventSequence: 0 },
      ]),
    ).toMatchObject({
      sessionId: "new",
      current: 1,
      best: 1,
      completed: false,
      lastSequence: 0,
    });
  });

  it("counts composed accents, emoji sequences and CJK as canonical grapheme attempts", () => {
    const text = `${"a".repeat(22)}e\u0301👩🏽‍💻中`;
    const test = fixture(`${text} remaining`);
    test.consume(
      test.controller.input({ type: "insert", text: "a".repeat(22) }, 0),
    );
    const snapshot = test.controller.input(
      { type: "composition", text: "e\u0301👩🏽‍💻中", compositionId: "ime-1" },
      100,
    );
    expect(
      test.controller.lastInputAttempts.map((attempt) => attempt.typed),
    ).toEqual(["é", "👩🏽‍💻", "中"]);
    expect(test.consume(snapshot)).toMatchObject({
      current: 25,
      best: 25,
      completed: true,
    });
    expect(snapshot.metrics.insertionAttempts).toBe(25);
    expect(text.length).toBeGreaterThan(25);
  });

  it("ignores a duplicate composition's new empty attempt batch", () => {
    const test = fixture("中文 remaining");
    test.consume(
      test.controller.input(
        { type: "composition", text: "中文", compositionId: "same-ime" },
        0,
      ),
    );
    const duplicate = test.controller.input(
      { type: "composition", text: "中文", compositionId: "same-ime" },
      100,
    );
    expect(test.controller.lastInputAttempts).toEqual([]);
    expect(test.consume(duplicate)).toMatchObject({
      current: 2,
      best: 2,
      completed: false,
    });
  });

  it("consumes every attempt in order when a composition contains an error", () => {
    const test = fixture("中文文字 remaining");
    const snapshot = test.controller.input(
      { type: "composition", text: "中文x字", compositionId: "mixed-ime" },
      0,
    );
    expect(
      test.controller.lastInputAttempts.map((attempt) => attempt.correct),
    ).toEqual([true, true, false, true]);
    expect(test.consume(snapshot)).toMatchObject({
      current: 1,
      best: 2,
      completed: false,
    });
  });

  it("counts a correctly inserted space, but a non-inserting submission adds nothing", () => {
    const test = fixture("cat dog remaining");
    test.consume(test.controller.input({ type: "insert", text: "cat " }, 0));
    expect(test.state.current).toBe(4);
    test.consume(test.controller.input({ type: "submit" }, 100));
    expect(test.state.current).toBe(4);
  });

  it("rejects stale attempt attribution without treating it as a new insertion", () => {
    const state = batch(createAccuracyChallenge("one"), 0, [true, true]);
    const newer = advanceAccuracyChallenge(state, "one", 1, [
      { correct: true, eventSequence: 0 },
    ]);
    expect(newer).toMatchObject({ lastSequence: 1, current: 2, best: 2 });
    expect(
      advanceAccuracyChallenge(newer, "one", 1, [
        { correct: true, eventSequence: 1 },
      ]),
    ).toBe(newer);
  });

  it.each([
    undefined,
    null,
    -1,
    0.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])("ignores an invalid or absent event sequence (%s)", (sequence) => {
    const state = createAccuracyChallenge("one");
    expect(advanceAccuracyChallenge(state, "one", sequence, [])).toBe(state);
  });

  it("does not mutate a previous state or canonical attempt batch", () => {
    const state = Object.freeze(createAccuracyChallenge("one"));
    const attempts = Object.freeze([
      Object.freeze({ correct: true, eventSequence: 0 }),
    ]);
    expect(advanceAccuracyChallenge(state, "one", 0, attempts).current).toBe(1);
    expect(state.current).toBe(0);
    expect(attempts).toEqual([{ correct: true, eventSequence: 0 }]);
  });
});
