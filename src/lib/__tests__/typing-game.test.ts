import { describe, expect, it } from "vitest";
import {
  SIGNAL_RUN_DURATION,
  SIGNAL_RUN_GATES_PER_STAGE,
  SIGNAL_RUN_STAGES,
  canOpenTypingGate,
  createTypingGame,
  editTypingGame,
  endTypingGame,
  openTypingGate,
  pauseTypingGame,
  resumeTypingGame,
  signalRunDeck,
  startTypingGame,
  tickTypingGame,
  typingGameAccuracy,
  type TypingGameMode,
  type TypingGameState,
} from "../typing-game";
import { graphemes } from "../typing-core";

const started = (mode: TypingGameMode = "calm") =>
  startTypingGame(createTypingGame(mode, 42), 1000);
function solve(state: TypingGameState, now: number) {
  return openTypingGate(
    editTypingGame(state, state.deck[state.gate], now),
    now + 1,
  );
}

describe("Signal Run deck and progression", () => {
  it("builds repeatable 18-gate journeys with six unique words per stage", () => {
    expect(signalRunDeck(42)).toEqual(signalRunDeck(42));
    expect(signalRunDeck(42)).not.toEqual(signalRunDeck(43));
    const deck = signalRunDeck(42);
    expect(deck).toHaveLength(18);
    for (let stage = 0; stage < 3; stage++) {
      const words = deck.slice(stage * 6, (stage + 1) * 6);
      expect(new Set(words).size).toBe(SIGNAL_RUN_GATES_PER_STAGE);
      expect(
        words.every((word) =>
          (SIGNAL_RUN_STAGES[stage].words as readonly string[]).includes(word),
        ),
      ).toBe(true);
    }
  });

  it("has no clock or measurable accuracy before deliberate launch", () => {
    const ready = createTypingGame();
    expect(tickTypingGame(ready, 30_000)).toBe(ready);
    expect(editTypingGame(ready, ready.deck[0], 30_000)).toBe(ready);
    expect(canOpenTypingGate(ready)).toBe(false);
    expect(typingGameAccuracy(ready)).toBeNull();
  });

  it("requires the full exact word and an explicit gate action", () => {
    const initial = started(),
      word = initial.deck[0];
    const prefix = editTypingGame(initial, word.slice(0, -1), 1100);
    expect(openTypingGate(prefix, 1200).gate).toBe(0);
    const complete = editTypingGame(prefix, word, 1300);
    expect(complete.gate).toBe(0);
    expect(canOpenTypingGate(complete)).toBe(true);
    const next = openTypingGate(complete, 1400);
    expect(next).toMatchObject({
      gate: 1,
      draft: "",
      cleanGates: 1,
      cleanChain: 1,
      bestCleanChain: 1,
    });
    expect(next.attempts).toBe(word.length);
  });

  it("crosses all three stages and stops cleanly after the final gate", () => {
    let state = started();
    for (let gate = 0; gate < 18; gate++)
      state = solve(state, 1100 + gate * 100);
    expect(state).toMatchObject({
      gate: 18,
      phase: "complete",
      outcome: "cleared",
      draft: "",
      lastAt: null,
      cleanGates: 18,
      bestCleanChain: 18,
    });
    expect(state.correctAttempts).toBe(state.deck.join("").length);
    expect(editTypingGame(state, "extra", 5000)).toBe(state);
    expect(openTypingGate(state, 5000)).toBe(state);
  });

  it("restarting creates fresh attempt, timer, completion and chain state", () => {
    const previous = endTypingGame(solve(started("paced"), 1200), 1300);
    const next = createTypingGame(previous.mode, 43);
    expect(next).toMatchObject({
      mode: "paced",
      phase: "ready",
      gate: 0,
      attempts: 0,
      cleanGates: 0,
      elapsedMs: 0,
      outcome: null,
      paused: false,
    });
    expect(next.deck).not.toEqual(previous.deck);
  });
});

describe("Signal Run attempt evidence", () => {
  it("retains an original wrong attempt after deletion and successful correction", () => {
    let state = started();
    const word = state.deck[0];
    state = editTypingGame(state, "x", 1100);
    state = editTypingGame(state, "", 1200);
    state = editTypingGame(state, word, 1300);
    expect(state).toMatchObject({
      attempts: word.length + 1,
      correctAttempts: word.length,
      deletedCharacters: 1,
      gateMistakes: 1,
    });
    expect(typingGameAccuracy(state)).toBeCloseTo(
      (word.length / (word.length + 1)) * 100,
    );
    state = openTypingGate(state, 1400);
    expect(state).toMatchObject({ gate: 1, cleanGates: 0, cleanChain: 0 });
  });

  it("counts replacements without refunding the removed character attempt", () => {
    const initial = { ...started(), deck: ["echo"] };
    const wrong = editTypingGame(initial, "exho", 1100);
    const fixed = editTypingGame(wrong, "echo", 1200);
    expect(fixed).toMatchObject({
      draft: "echo",
      attempts: 5,
      correctAttempts: 4,
      deletedCharacters: 1,
      gateMistakes: 1,
    });
    expect(typingGameAccuracy(fixed)).toBe(80);
  });

  it("counts a native same-value selected replacement, including repeated wrong attempts", () => {
    const initial = { ...started(), deck: ["echo"] };
    const wrong = editTypingGame(initial, "x", 1100);
    const repeated = editTypingGame(wrong, "x", 1200, false, {
      start: 0,
      end: 1,
      text: "x",
    });
    expect(repeated).toMatchObject({
      attempts: 2,
      correctAttempts: 0,
      gateMistakes: 2,
      deletedCharacters: 1,
    });
    const repeatedCorrect = editTypingGame(
      editTypingGame(initial, "e", 1100),
      "e",
      1200,
      false,
      { start: 0, end: 1, text: "e" },
    );
    expect(repeatedCorrect).toMatchObject({ attempts: 2, correctAttempts: 2 });
  });

  it("does not trust a native range that does not reconstruct the actual value", () => {
    const initial = { ...started(), deck: ["echo"] };
    const next = editTypingGame(initial, "x", 1100, false, {
      start: 0,
      end: 0,
      text: "echo",
    });
    expect(next).toMatchObject({ draft: "x", attempts: 1, correctAttempts: 0 });
  });

  it("counts normalized Unicode composition as characters, not UTF-16 or physical keys", () => {
    const target = "é👩🏽‍💻中";
    const initial = { ...started(), deck: [target] };
    const composed = editTypingGame(initial, "e\u0301👩🏽‍💻中", 1100);
    expect(composed).toMatchObject({
      draft: target,
      attempts: 3,
      correctAttempts: 3,
    });
    expect(graphemes(target)).toHaveLength(3);
    expect(target.length).toBeGreaterThan(3);
    expect(typingGameAccuracy(composed)).toBe(100);
  });

  it("does not recount an unchanged composition echo or ordinary timer update", () => {
    const initial = { ...started(), deck: ["echo"] };
    const composed = editTypingGame(initial, "echo", 1100);
    const echo = editTypingGame(composed, "echo", 1200);
    expect(echo).toMatchObject({ attempts: 4, correctAttempts: 4 });
    expect(tickTypingGame(echo, 1500).attempts).toBe(4);
  });

  it("counts extra inserted characters as wrong and never opens an overtyped word", () => {
    const initial = { ...started(), deck: ["echo"] };
    const extra = editTypingGame(initial, "echox", 1100);
    expect(extra).toMatchObject({
      attempts: 5,
      correctAttempts: 4,
      gateMistakes: 1,
    });
    expect(canOpenTypingGate(extra)).toBe(false);
    const corrected = editTypingGame(extra, "echo", 1200);
    expect(corrected).toMatchObject({
      attempts: 5,
      correctAttempts: 4,
      deletedCharacters: 1,
    });
  });

  it("records a clean-gate chain only from gates with no wrong insertion attempts", () => {
    let state = solve(solve(started(), 1100), 1200);
    expect(state.bestCleanChain).toBe(2);
    state = editTypingGame(state, "x", 1300);
    state = editTypingGame(state, state.deck[state.gate], 1400);
    state = openTypingGate(state, 1500);
    expect(state).toMatchObject({
      gate: 3,
      cleanGates: 2,
      cleanChain: 0,
      bestCleanChain: 2,
    });
  });

  it("marks assisted replacement input for local-record exclusion", () => {
    const state = editTypingGame(started(), "test", 1100, true);
    expect(editTypingGame(state, "", 1200).assisted).toBe(true);
  });

  it("keeps assistance from an unchanged native replacement without inventing character attempts", () => {
    const initial = { ...started("paced"), deck: ["echo"] };
    const typed = editTypingGame(initial, "echo", 1100);
    const replaced = editTypingGame(typed, "echo", 1500, true);
    expect(replaced).toMatchObject({
      assisted: true,
      elapsedMs: 400,
      attempts: 4,
      correctAttempts: 4,
      deletedCharacters: 0,
    });
    expect(typed.assisted).toBe(false);
    expect(editTypingGame(replaced, "echo", 1500, true)).toBe(replaced);
  });

  it("does not retroactively mark a replacement observed at the elapsed deadline", () => {
    const initial = { ...started("paced"), deck: ["echo"] };
    const typed = editTypingGame(initial, "echo", 1100);
    expect(editTypingGame(typed, "echo", 61_100, true)).toMatchObject({
      phase: "complete",
      outcome: "timeout",
      elapsedMs: 60_000,
      assisted: false,
      attempts: 4,
      correctAttempts: 4,
    });
  });

  it("ignores unchanged replacement events while the game is paused", () => {
    const typed = editTypingGame(started(), "echo", 1100);
    const paused = pauseTypingGame(typed, 1200);
    expect(editTypingGame(paused, "echo", 5000, true)).toBe(paused);
    expect(paused.assisted).toBe(false);
  });

  it("bounds oversized input without mutating an earlier snapshot", () => {
    const initial = Object.freeze(started());
    expect(editTypingGame(initial, "x".repeat(65), 1000)).toBe(initial);
    const next = editTypingGame(initial, initial.deck[0], 1100);
    expect(initial.draft).toBe("");
    expect(initial.attempts).toBe(0);
    expect(next.draft).not.toBe("");
  });
});

describe("Signal Run clock and recovery", () => {
  it("keeps a launched run untimed until the first character, then expires despite later idle time", () => {
    const prepared = started("paced");
    expect(tickTypingGame(prepared, 600_000)).toBe(prepared);
    expect(editTypingGame(prepared, "", 600_000)).toBe(prepared);
    const typed = editTypingGame(prepared, "x", 600_100);
    expect(typed).toMatchObject({ elapsedMs: 0, lastAt: 600_100, attempts: 1 });
    const state = tickTypingGame(
      typed,
      600_100 + SIGNAL_RUN_DURATION + 20_000,
    );
    expect(state).toMatchObject({
      phase: "complete",
      outcome: "timeout",
      elapsedMs: SIGNAL_RUN_DURATION,
      attempts: 1,
    });
  });

  it("rejects input and gate submissions at the exact deadline", () => {
    const initial = started("paced");
    const typed = editTypingGame(initial, initial.deck[0], 1100);
    expect(openTypingGate(typed, 61_100)).toMatchObject({
      gate: 0,
      phase: "complete",
      outcome: "timeout",
    });
    expect(editTypingGame(typed, "x", 61_100)).toMatchObject({
      attempts: initial.deck[0].length,
      phase: "complete",
      outcome: "timeout",
    });
  });

  it("preserves the word and evidence while paused, excluding the whole paused interval", () => {
    let state = editTypingGame(started("paced"), "x", 2000);
    state = pauseTypingGame(state, 3000);
    const paused = state;
    expect(state).toMatchObject({
      phase: "paused",
      elapsedMs: 1000,
      draft: "x",
      paused: true,
    });
    expect(editTypingGame(state, "changed", 40_000)).toBe(paused);
    expect(tickTypingGame(state, 40_000)).toBe(paused);
    state = resumeTypingGame(state, 40_000);
    state = tickTypingGame(state, 41_000);
    expect(state).toMatchObject({
      phase: "playing",
      elapsedMs: 2000,
      attempts: 1,
      draft: "x",
    });
  });

  it("does not allow pause to rescue an already expired run", () => {
    expect(pauseTypingGame(editTypingGame(started("paced"), "x", 2000), 62_000)).toMatchObject({
      phase: "complete",
      outcome: "timeout",
      paused: false,
    });
  });

  it("keeps calm practice untimed and handles repeated/backwards clock samples safely", () => {
    const initial = editTypingGame(started(), "x", 1000);
    expect(tickTypingGame(initial, 1000)).toBe(initial);
    expect(tickTypingGame(initial, 900)).toBe(initial);
    expect(tickTypingGame(initial, NaN)).toBe(initial);
    expect(tickTypingGame(initial, 600_000)).toMatchObject({
      phase: "playing",
      elapsedMs: 599_000,
    });
  });

  it("lets a player end a partial paused run without pretending it was completed", () => {
    const paused = pauseTypingGame(solve(started(), 1100), 2000);
    expect(endTypingGame(paused, 50_000)).toMatchObject({
      phase: "complete",
      outcome: "ended",
      gate: 1,
      elapsedMs: 900,
    });
  });
  it("does not start the clock when pausing or resuming a prepared run before typing", () => {
    const resumed = resumeTypingGame(pauseTypingGame(started("paced"), 50_000), 600_000);
    expect(tickTypingGame(resumed, 900_000)).toBe(resumed);
    expect(resumed).toMatchObject({ phase: "playing", elapsedMs: 0, lastAt: null, attempts: 0, paused: false });
    expect(editTypingGame(resumed, "x", 900_100)).toMatchObject({ elapsedMs: 0, lastAt: 900_100 });
  });
  it("cannot start a prepared clock from invalid timestamps or rejected oversized text", () => {
    const prepared = started("paced");
    expect(editTypingGame(prepared, "x", NaN)).toBe(prepared);
    expect(editTypingGame(prepared, "x".repeat(65), 500_000)).toBe(prepared);
    expect(prepared.lastAt).toBeNull();
  });
});
