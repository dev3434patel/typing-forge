import { describe, expect, it } from "vitest";
import { SessionController } from "../typing-core";
import {
  feedbackFromAttempts,
  inputUnitGlyph,
  inputUnitLabel,
} from "../typing-feedback";

function practice(
  target = "cat dog",
  rejectIncorrect = false,
  scoringPolicy: "prose" | "code" = "prose",
) {
  let now = 0;
  const controller = new SessionController(
    {
      clientSessionId: "feedback",
      mode: "zen",
      initialTarget: target,
      rejectIncorrect,
      scoringPolicy,
    },
    { now: () => now, wallNow: () => now },
  );
  return {
    controller,
    enter(text: string) {
      now += 100;
      return controller.input({ type: "insert", text });
    },
    feedback: () =>
      feedbackFromAttempts(controller.lastInputAttempts, rejectIncorrect),
  };
}

describe("committed input feedback", () => {
  it("shows the actual mismatch while normal practice advances", () => {
    const p = practice();
    p.enter("c");
    const snapshot = p.enter("x");
    expect(snapshot.cursor).toBe(2);
    expect(snapshot.finalText).toBe("cx");
    expect(p.feedback()).toEqual({
      typed: "x",
      expected: "a",
      incorrect: true,
      rejected: false,
      incorrectCount: 1,
    });
    expect(snapshot.metrics.inputAccuracy).toBe(50);
  });
  it("shows rejected input without pretending it was inserted", () => {
    const p = practice("cat dog", true);
    p.enter("c");
    const snapshot = p.enter("x");
    expect(snapshot.cursor).toBe(1);
    expect(snapshot.finalText).toBe("c");
    expect(p.feedback()).toMatchObject({
      typed: "x",
      expected: "a",
      rejected: true,
    });
    p.enter("a");
    expect(p.feedback()).toMatchObject({
      typed: "a",
      incorrect: false,
      rejected: false,
    });
  });
  it("attributes mixed batches from canonical attempts, including errors followed by correct input", () => {
    const p = practice("abc def", true);
    p.enter("xazb");
    expect(p.controller.snapshot().finalText).toBe("ab");
    expect(p.feedback()).toEqual({
      typed: "z",
      expected: "b",
      incorrect: true,
      rejected: true,
      incorrectCount: 2,
    });
  });
  it("explains premature Space even when its final separator slot is correct", () => {
    const p = practice();
    p.enter("c");
    const snapshot = p.enter(" ");
    expect(snapshot.characters[3]).toMatchObject({
      status: "correct",
      typed: " ",
    });
    expect(snapshot.cursor).toBe(4);
    expect(p.feedback()).toMatchObject({
      typed: " ",
      expected: "a",
      incorrect: true,
    });
  });
  it("clears recent input on deletion without erasing the original attempt", () => {
    const p = practice();
    p.enter("cx");
    p.controller.input({ type: "delete" });
    expect(p.controller.lastInputAttempts).toEqual([]);
    expect(p.feedback()).toBeNull();
    expect(p.controller.snapshot().metrics.incorrectAttempts).toBe(1);
  });
  it("uses the actual replacement position", () => {
    const p = practice();
    p.enter("ca");
    p.controller.input({ type: "replace", start: 0, end: 1, text: "z" });
    expect(p.feedback()).toMatchObject({
      typed: "z",
      expected: "c",
      incorrect: true,
    });
  });
  it("reports Space as expected when the current word is overtyped", () => {
    const p = practice();
    p.enter("catx");
    expect(p.feedback()).toMatchObject({
      typed: "x",
      expected: " ",
      incorrect: true,
    });
  });
  it("does not reinterpret a previous attempt after a later target extension", () => {
    const p = practice("a");
    p.enter("ab");
    const observed = p.feedback();
    p.controller.appendTarget("b");
    expect(p.feedback()).toEqual(observed);
    expect(p.feedback()).toMatchObject({
      typed: "b",
      expected: undefined,
      incorrect: true,
    });
  });
  it("uses committed NFC graphemes and ignores duplicate composition groups", () => {
    const p = practice("école");
    p.controller.input({
      type: "composition",
      text: "n\u0303",
      provenance: "composition",
      compositionId: "one",
    });
    expect(p.feedback()).toMatchObject({
      typed: "ñ",
      expected: "é",
      incorrect: true,
    });
    p.controller.input({
      type: "composition",
      text: "n\u0303",
      provenance: "composition",
      compositionId: "one",
    });
    expect(p.feedback()).toBeNull();
    expect(p.controller.snapshot().metrics.insertionAttempts).toBe(1);
  });
  it("never exposes mutable canonical attempt objects", () => {
    const p = practice();
    p.enter("x");
    const attempts = p.controller.lastInputAttempts;
    attempts[0].typed = "c";
    attempts[0].correct = true;
    expect(p.feedback()).toMatchObject({ typed: "x", incorrect: true });
    expect(p.controller.snapshot().metrics.incorrectAttempts).toBe(1);
    expect(practice().feedback()).toBeNull();
  });
  it.each([
    [" ", "Space", "␠"],
    ["\n", "Enter", "↵"],
    ["\t", "Tab", "⇥"],
    ["\u00a0", "No-break space", "␠"],
    ["ñ", "ñ", "ñ"],
    ["👩‍💻", "👩‍💻", "👩‍💻"],
  ])("labels %j without an invisible wrong glyph", (unit, label, glyph) => {
    expect(inputUnitLabel(unit)).toBe(label);
    expect(inputUnitGlyph(unit)).toBe(glyph);
  });
  it("labels out-of-target input honestly", () =>
    expect(inputUnitLabel(undefined)).toBe("End of passage"));
});
