import { describe, expect, it } from "vitest";
import { canReuseOpponentPoint, type OpponentLayoutRevision } from "./opponent-caret-layout";

const layout = (revision = "", patch: Partial<OpponentLayoutRevision> = {}): OpponentLayoutRevision => ({
  position: 3, revision, ownCursor: revision.length, targetText: "calm hands build steady rhythm",
  scoringPolicy: "prose", rtl: false, composing: false, sessionKey: "session-one", fontSize: 28, ...patch,
});

describe("already measured opponent point reuse", () => {
  it("reuses a fixed native point through correct letters, spaces and unchanged timer snapshots", () => {
    let previous = layout();
    for (let cursor = 1; cursor <= 18; cursor++) {
      const next = layout(previous.targetText.slice(0, cursor));
      expect(canReuseOpponentPoint(previous, next)).toBe(true);
      expect(canReuseOpponentPoint(next, { ...next })).toBe(true);
      previous = next;
    }
  });

  it.each([
    ["unmeasured initial mount", undefined, layout()],
    ["opponent movement", layout("c"), layout("ca", { position: 4 })],
    ["font size", layout("c"), layout("ca", { fontSize: 30 })],
    ["target extension", layout("c"), layout("ca", { targetText: "calm hands build steady rhythm again" })],
    ["same-passage new session", layout("c"), layout("ca", { sessionKey: "session-two" })],
    ["wrong character", layout("c"), layout("cx")],
    ["extra character", layout("calm"), layout("calmx")],
    ["deletion", layout("cal"), layout("ca")],
    ["replacement", layout("c"), layout("cal")],
    ["recovery after a mistake", layout("cx"), layout("c")],
    ["nonterminal canonical cursor", layout("c"), layout("ca", { ownCursor: 1 })],
    ["code", layout("c", { scoringPolicy: "code" }), layout("ca", { scoringPolicy: "code" })],
    ["free writing", layout("c", { scoringPolicy: "free" }), layout("ca", { scoringPolicy: "free" })],
    ["RTL", layout("c", { rtl: true }), layout("ca", { rtl: true })],
    ["composition", layout("c", { composing: true }), layout("ca", { composing: true })],
    ["invalid font size", layout("c"), layout("ca", { fontSize: NaN })],
  ] as const)("measures again after %s", (_name, previous, next) => {
    expect(canReuseOpponentPoint(previous, next)).toBe(false);
  });

  it.each(["café calm", "calm\nhands", "calm\thands", "calm\u00a0hands", "calm 🦊"])("keeps native measurements for complex target %s", targetText => {
    expect(canReuseOpponentPoint(layout("c", { targetText }), layout("ca", { targetText }))).toBe(false);
  });

  it("does not treat a previously mismatched cursor as a stable geometry baseline", () => {
    expect(canReuseOpponentPoint(layout("c", { ownCursor: 0 }), layout("ca"))).toBe(false);
  });
});
