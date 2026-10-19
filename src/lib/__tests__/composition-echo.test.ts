import { describe, expect, it, vi } from "vitest";
import { CompositionEchoGuard } from "../composition-echo";
import { SessionController } from "../typing-core";

describe("lesson composition echo ownership", () => {
  it.each(["insertText", "insertReplacementText", ""])("keeps identical independent %j input when a keyboard emits no fresh keydown", (inputType) => {
    const guard = new CompositionEchoGuard();
    guard.remember("a");
    expect(guard.consume("a", inputType)).toBe(false);
    expect(guard.consume("a", "insertCompositionText")).toBe(false);
  });

  it("consumes one canonical-equivalent echo and preserves the next identical input", () => {
    const guard = new CompositionEchoGuard();
    guard.remember("e\u0301");
    expect(guard.consume("é", "insertCompositionText")).toBe(true);
    expect(guard.consume("é", "insertText")).toBe(false);
  });

  it("does not expire a pending echo while the main thread is delayed", () => {
    vi.useFakeTimers();
    try {
      const guard = new CompositionEchoGuard();
      guard.remember("क");
      vi.advanceTimersByTime(2000);
      expect(guard.consume("क", "insertFromComposition")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears ownership on an unrelated input instead of swallowing a later same letter", () => {
    const guard = new CompositionEchoGuard();
    guard.remember("a");
    expect(guard.consume("b", "insertText")).toBe(false);
    expect(guard.consume("a", "insertText")).toBe(false);
  });

  it("allows an immediately repeated physical key after a new-key reset", () => {
    const guard = new CompositionEchoGuard();
    guard.remember("a");
    guard.reset();
    expect(guard.consume("a", "insertText")).toBe(false);
  });

  it("allows a new composition and clears canceled or restarted compositions", () => {
    const guard = new CompositionEchoGuard();
    guard.remember("a");
    guard.reset();
    guard.remember("b");
    expect(guard.consume("b", "insertCompositionText")).toBe(true);
    guard.remember("");
    expect(guard.consume("", "insertCompositionText")).toBe(false);
    guard.remember("b");
    guard.reset();
    expect(guard.consume("b", "insertCompositionText")).toBe(false);
  });

  it("keeps one IME attempt and a genuine repeated key as two retained graphemes", () => {
    let now = 0;
    const controller = new SessionController(
      { clientSessionId: "composition-echo", mode: "learn", initialTarget: "éé next", correctionPolicy: "current-word" },
      { now: () => now, wallNow: () => 1700000000000 + now },
    );
    const guard = new CompositionEchoGuard();
    controller.input({ type: "composition", text: "e\u0301", provenance: "composition", compositionId: "first" });
    guard.remember("e\u0301");
    now = 1000;
    if (!guard.consume("é", "insertCompositionText")) controller.input({ type: "insert", text: "é" });
    guard.reset();
    if (!guard.consume("é", "insertText")) controller.input({ type: "insert", text: "é" });
    expect(controller.snapshot().finalText).toBe("éé");
    expect(controller.snapshot().metrics).toMatchObject({ insertionAttempts: 2, inputAccuracy: 100, retainedUnits: 2 });
    expect(controller.snapshot().events).toHaveLength(2);
  });
});
