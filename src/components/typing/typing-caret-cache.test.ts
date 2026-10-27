import { describe, expect, it, vi } from "vitest";
import {
  TypingCaretWordCache,
  MAX_CACHED_FORWARD_GLYPHS,
  caretCacheWordRange,
  type CaretLayoutState,
  type MeasuredCaretWordSlot,
} from "./typing-caret-cache";
import { typingCaretAnchor, typingCaretGeometry } from "./typing-caret-geometry";

const state = (finalText = "", patch: Partial<CaretLayoutState> = {}): CaretLayoutState => ({
  targetText: "Wi.m fox", finalText, cursor: finalText.length, fontSize: 26,
  fontKey: "en", scoringPolicy: "prose", rtl: false, composing: false, ...patch,
});

const forwardSlots = (targetText: string, start = 0, count = targetText.length - start): MeasuredCaretWordSlot[] =>
  Array.from({ length: count }, (_, offset) => ({
    index: start + offset,
    expected: targetText[start + offset],
    anchor: {
      // Supplied native boxes deliberately have unequal advances and wrapping.
      leading: (start + offset) % 5 * 7.25 + 3.125,
      top: Math.floor((start + offset) / 5) * 49.4 + 2.25,
      width: targetText[start + offset] === " " ? 3.75 : offset % 2 ? 4.125 : 17.625,
      height: 28.25,
      rtl: false,
    },
  }));
function forwardPopulated(targetText = "Wi.m fox") {
  const cache = new TypingCaretWordCache();
  const slots = forwardSlots(targetText);
  expect(cache.storeForward(state("", { targetText }), slots, 49.4)).toBe(true);
  return { cache, slots };
}

describe("bounded forward native caret windows", () => {
  it("reuses actual proportional, space and wrapped-word boxes from one native window", () => {
    const { cache, slots } = forwardPopulated();
    const native = vi.fn(() => slots);
    for (let cursor = 0; cursor < slots.length; cursor++) {
      const current = state("Wi.m fox".slice(0, cursor));
      if (!cache.read(current)) cache.storeForward(current, native(), 49.4);
      expect(cache.read(current)).toEqual({ anchor: slots[cursor].anchor, lineHeight: 49.4 });
    }
    expect(native).not.toHaveBeenCalled();
    expect(cache.read(state("Wi.m fox"))).toBeNull();
  });

  it("allows a measured space without changing the legacy word-only capture contract", () => {
    const current = state("Wi.m"), cache = new TypingCaretWordCache();
    expect(cache.canCache(current)).toBe(false);
    expect(cache.store(current, forwardSlots(current.targetText, 4, 1), 49.4)).toBe(false);
    const slots = forwardSlots(current.targetText, 4, 3);
    expect(cache.storeForward(current, slots, 49.4)).toBe(true);
    expect(cache.read(current)?.anchor).toEqual(slots[0].anchor);
    expect(cache.read(state("Wi.m "))?.anchor).toEqual(slots[1].anchor);
    expect(cache.read(state("Wi.m f"))?.anchor).toEqual(slots[2].anchor);
    expect(cache.read(state("Wi.m fo"))).toBeNull();
  });

  it("accepts a partial valid window and falls back at its first uncaptured position", () => {
    const cache = new TypingCaretWordCache(), slots = forwardSlots("Wi.m fox", 0, 2);
    expect(cache.storeForward(state(), slots, 49.4)).toBe(true);
    expect(cache.read(state("W"))?.anchor).toEqual(slots[1].anchor);
    expect(cache.read(state("Wi"))).toBeNull();
  });

  it("bounds the complete retained map to128 forward slots and refuses129 or zero", () => {
    expect(MAX_CACHED_FORWARD_GLYPHS).toBe(128);
    const targetText = "a ".repeat(70), cache = new TypingCaretWordCache();
    expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 128), 49.4)).toBe(true);
    for (let cursor = 1; cursor < 128; cursor++)
      expect(cache.read(state(targetText.slice(0, cursor), { targetText }))).not.toBeNull();
    expect(cache.read(state(targetText.slice(0, 128), { targetText }))).toBeNull();
    expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 129), 49.4)).toBe(false);
    expect(cache.storeForward(state("", { targetText }), [], 49.4)).toBe(false);
  });

  it("does not cache even a prefix of an oversized word, while preserving64-character words", () => {
    const cache = new TypingCaretWordCache();
    for (const size of [64, 65]) {
      const targetText = "w".repeat(size);
      expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 1), 49.4)).toBe(size === 64);
    }
    const targetText = "go " + "w".repeat(65);
    expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 4), 49.4)).toBe(false);
    expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 3), 49.4)).toBe(true);
    for (let cursor = 1; cursor <= 2; cursor++)
      expect(cache.read(state(targetText.slice(0, cursor), { targetText }))).not.toBeNull();
    expect(cache.read(state("go ", { targetText }))).toBeNull();
  });

  it.each([
    ["mistake", "X"], ["extra insertion", "Wi.mm"],
    ["multi-character replacement", "Wi."], ["inconsistent cursor", "W"],
  ])("drops a forward map after %s instead of reusing a formerly correct prefix", (_name, value) => {
    const { cache } = forwardPopulated();
    expect(cache.read(state("W"))).not.toBeNull();
    expect(cache.read(state(value, _name === "inconsistent cursor" ? { cursor: 0 } : {}))).toBeNull();
    expect(cache.read(state("Wi"))).toBeNull();
  });

  it("invalidates deletion and explicit font/resize/style changes even at a previously cached space", () => {
    const { cache } = forwardPopulated();
    for (let cursor = 1; cursor <= 5; cursor++) expect(cache.read(state("Wi.m fox".slice(0, cursor)))).not.toBeNull();
    expect(cache.read(state("Wi.m"))).toBeNull();
    expect(cache.storeForward(state("Wi.m"), forwardSlots("Wi.m fox", 4), 49.4)).toBe(true);
    expect(cache.read(state("Wi.m"))).not.toBeNull();
    cache.invalidate();
    expect(cache.read(state("Wi.m"))).toBeNull();
  });

  it.each([
    ["font size", { fontSize: 30 }], ["font family", { fontKey: "custom" }],
    ["RTL", { rtl: true }], ["composition", { composing: true }],
    ["code", { scoringPolicy: "code" }], ["free", { scoringPolicy: "free" }],
    ["target append", { targetText: "Wi.m fox jumps" }],
    ["target replacement", { targetText: "Wi.m cat" }],
  ] as const)("does not reuse a forward window across %s", (_name, patch) => {
    const { cache } = forwardPopulated();
    expect(cache.read(state("W", patch))).toBeNull();
    expect(cache.read(state("Wi"))).toBeNull();
  });

  it.each(["Wí.m fox", "Wi.m\nfox", "Wi.m\tfox", "Wi.m\u00a0fox", "Wi\u0301.m fox", "Wi.m 🦊"])("does not admit complex target %s through the forward API", targetText => {
    const cache = new TypingCaretWordCache();
    expect(cache.storeForward(state("", { targetText }), forwardSlots(targetText, 0, 1), 49.4)).toBe(false);
  });

  it.each([
    { cursor: -1 }, { cursor: 1.5 }, { cursor: NaN }, { cursor: 8 },
    { fontSize: 0 }, { fontSize: Infinity }, { finalText: "x", cursor: 1 },
    { scoringPolicy: "code" }, { rtl: true }, { composing: true },
  ])("rejects invalid forward eligibility %j independently of the caller", patch => {
    const { cache, slots } = forwardPopulated();
    expect(cache.storeForward(state("", patch), slots, 49.4)).toBe(false);
    expect(cache.read(state("W"))).toBeNull();
  });

  it.each([
    { index: 1 }, { expected: "x" },
    { anchor: { leading: Infinity, top: 0, width: 4, height: 28, rtl: false } },
    { anchor: { leading: 0, top: 0, width: 0, height: 28, rtl: false } },
    { anchor: { leading: 0, top: 0, width: 4, height: 0, rtl: false } },
    { anchor: { leading: 0, top: 0, width: 4, height: 28, rtl: true } },
  ])("atomically rejects an invalid supplied forward slot %j", patch => {
    const { cache, slots } = forwardPopulated();
    slots[3] = { ...slots[3], ...patch };
    expect(cache.storeForward(state(), slots, 49.4)).toBe(false);
    expect(cache.read(state("W"))).toBeNull();
  });

  it.each([0, -1, NaN, Infinity])("rejects invalid forward line height %s", lineHeight => {
    const { cache, slots } = forwardPopulated();
    expect(cache.storeForward(state(), slots, lineHeight)).toBe(false);
    expect(cache.read(state("W"))).toBeNull();
  });

  it("refuses gaps, duplicates, reordering and end-of-target slots without retaining a partial invalid map", () => {
    const { cache, slots } = forwardPopulated();
    for (const batch of [slots.slice(1), [slots[0], slots[2]], [slots[0], slots[0]], [...slots].reverse(), [...slots, { ...slots[0], index: 8, expected: "x" }]]) {
      expect(cache.storeForward(state(), batch, 49.4)).toBe(false);
      expect(cache.read(state("W"))).toBeNull();
    }
  });

  it("copies supplied anchors and state so later caller mutations cannot alias the forward window", () => {
    const cache = new TypingCaretWordCache(), current = state(), slots = forwardSlots(current.targetText);
    expect(cache.storeForward(current, slots, 49.4)).toBe(true);
    const expected = { ...slots[1].anchor };
    Object.assign(slots[1].anchor, { leading: 999, top: 999 });
    Object.assign(current, { fontKey: "mutated", finalText: "wrong" });
    slots.splice(0);
    expect(cache.read(state("W"))).toEqual({ anchor: expected, lineHeight: 49.4 });
  });
});
const measured = (): MeasuredCaretWordSlot[] => [
  { index: 0, expected: "W", anchor: { leading: 10.25, top: 51.6, width: 19.75, height: 28, rtl: false } },
  { index: 1, expected: "i", anchor: { leading: 30, top: 51.6, width: 4.25, height: 28, rtl: false } },
  { index: 2, expected: ".", anchor: { leading: 34.25, top: 51.6, width: 5.5, height: 28, rtl: false } },
  { index: 3, expected: "m", anchor: { leading: 10.25, top: 101, width: 15.5, height: 28, rtl: false } },
];
function populated() {
  const cache = new TypingCaretWordCache();
  expect(cache.read(state())).toBeNull();
  expect(cache.store(state(), measured(), 49.4)).toBe(true);
  return cache;
}

describe("bounded native word caret cache", () => {
  it("reuses actual proportional and wrapped character boxes without guessing glyph advances", () => {
    const cache = populated();
    for (const prefix of ["W", "Wi", "Wi."]) {
      const hit = cache.read(state(prefix));
      expect(hit).toEqual({ anchor: measured()[prefix.length].anchor, lineHeight: 49.4 });
    }
    expect(cache.read(state("Wi."))!.anchor).toMatchObject({ leading: 10.25, top: 101, width: 15.5 });
  });

  it("does not call a native measurement reader again on stable correct-prefix characters", () => {
    const cache = new TypingCaretWordCache();
    const native = vi.fn(() => measured());
    for (const prefix of ["", "W", "Wi", "Wi."]) {
      if (!cache.read(state(prefix))) cache.store(state(prefix), native(), 49.4);
    }
    expect(native).toHaveBeenCalledTimes(1);
    cache.invalidate();
    if (!cache.read(state("Wi."))) cache.store(state("Wi."), native(), 49.4);
    expect(native).toHaveBeenCalledTimes(2);
  });

  it("stores neutral anchors so switching all caret styles never compounds underline offsets", () => {
    const cache = populated();
    const anchor = cache.read(state("W"))!.anchor;
    for (const style of ["line", "block", "outline", "underline"] as const) {
      const box = typingCaretGeometry(anchor, style);
      expect(box.left).toBe(30);
      expect(box.width).toBe(style === "line" ? 2 : 4.25);
      expect(box.top + box.height).toBeCloseTo(anchor.top + anchor.height);
    }
    expect(cache.read(state("W"))!.anchor.top).toBe(51.6);
  });

  it("retains content coordinates when viewport/page scrolling changes native screen rectangles", () => {
    const before = typingCaretAnchor(
      { left: 70, right: 74.25, top: 202.2, width: 4.25, height: 28 },
      { left: 40, top: 200 },
      { fontSize: 26, scrollLeft: 0, scrollTop: 49.4, rtl: false },
    )!;
    const after = typingCaretAnchor(
      { left: 70, right: 74.25, top: 132.8, width: 4.25, height: 28 },
      { left: 40, top: 180 },
      { fontSize: 26, scrollLeft: 0, scrollTop: 98.8, rtl: false },
    )!;
    const cache = new TypingCaretWordCache(), slots = measured();
    slots[1] = { ...slots[1], anchor: before };
    cache.store(state(), slots, 49.4);
    const hit = cache.read(state("W"))!;
    expect(hit.anchor.leading).toBe(after.leading);
    expect(hit.anchor.top).toBeCloseTo(after.top);
    expect(hit.anchor.height).toBe(after.height);
  });

  it("drops the old word at a separator and never extrapolates a whitespace or end box", () => {
    const cache = populated();
    expect(cache.read(state("Wi.m"))).toBeNull();
    expect(cache.read(state("Wi.m "))).toBeNull();
    expect(caretCacheWordRange("Wi.m fox", 4)).toBeNull();
    expect(caretCacheWordRange("Wi.m fox", 8)).toBeNull();
    expect(caretCacheWordRange("Wi.m fox", 5)).toEqual({ start: 5, end: 8 });
  });

  it("forces a fresh native word measurement after Backspace even when the remaining prefix is correct", () => {
    const cache = populated();
    expect(cache.read(state("Wi"))).toBeNull(); // A multi-character replacement is also a miss.
    cache.store(state("Wi"), measured(), 49.4);
    expect(cache.read(state("W"))).toBeNull();
    expect(cache.store(state("W"), measured(), 49.4)).toBe(true);
    expect(cache.read(state("Wi"))).not.toBeNull();
  });

  it("invalidates previous incorrect-word/replacement/extra input before recovering a real corrected layout", () => {
    const cache = populated();
    for (const value of ["x", "WiXm", "Wi.mx ", "Wi.m fxo "]) {
      expect(cache.read(state(value))).toBeNull();
      expect(cache.store(state(value), measured(), 49.4)).toBe(false);
    }
    expect(cache.read(state("Wi"))).toBeNull();
    expect(cache.store(state("Wi"), measured(), 49.4)).toBe(true);
    expect(cache.read(state("Wi."))).not.toBeNull();
  });

  it.each([
    ["target append", { targetText: "Wi.m fox jumps" }],
    ["target replacement", { targetText: "Wi.m cat" }],
    ["font size", { fontSize: 30 }],
    ["font family/language", { fontKey: "custom" }],
    ["composition", { composing: true }],
    ["RTL", { rtl: true }],
    ["code", { scoringPolicy: "code" }],
    ["free writing", { scoringPolicy: "free" }],
  ] as const)("never reuses cached geometry after %s", (_name, patch) => {
    const cache = populated();
    expect(cache.read(state("W", patch))).toBeNull();
  });

  it.each([
    ["Unicode letters", "Wí.m fox"],
    ["RTL text", "كلمة كلمة"],
    ["a newline", "Wi.m\nfox"],
    ["a tab", "Wi.m\tfox"],
    ["a nonbreaking space", "Wi.m\u00a0fox"],
    ["a combining sequence", "Wi\u0301.m fox"],
    ["an emoji", "Wi.m 🦊"],
  ])("keeps native fallback for %s", (_name, targetText) => {
    const cache = new TypingCaretWordCache();
    expect(cache.canCache(state("", { targetText }))).toBe(false);
    expect(cache.store(state("", { targetText }), measured(), 49.4)).toBe(false);
  });

  it("rejects mismatched cursor/grapheme positions and invalid nominal font sizes", () => {
    const cache = populated();
    expect(cache.read(state("W", { cursor: 2 }))).toBeNull();
    for (const fontSize of [0, -1, NaN, Infinity])
      expect(cache.store(state("", { fontSize }), measured(), 49.4)).toBe(false);
    for (const cursor of [-1, 1.5, NaN, 100])
      expect(caretCacheWordRange("word", cursor)).toBeNull();
  });

  it("bounds each cache to one real word of at most 64 characters", () => {
    expect(caretCacheWordRange("a".repeat(64), 10)).toEqual({ start: 0, end: 64 });
    expect(caretCacheWordRange("a".repeat(65), 10)).toBeNull();
    const cache = populated();
    expect(cache.store(state(), [...measured(), measured()[0]], 49.4)).toBe(false);
    expect(cache.read(state("W"))).toBeNull();
  });

  it("rejects missing/extra/reordered/incorrect DOM slot identities rather than confusing ordinal and target indexes", () => {
    const cache = populated();
    const fixtures = [measured().slice(1), [...measured()].reverse(), measured().map(slot => ({ ...slot, index: slot.index + 10 })), measured().map(slot => ({ ...slot, expected: "x" }))];
    for (const slots of fixtures) {
      expect(cache.store(state(), slots, 49.4)).toBe(false);
      expect(cache.read(state("W"))).toBeNull();
    }
  });

  it.each([0, -1, NaN, Infinity])("does not cache an unusable computed line height %s", lineHeight => {
    expect(populated().store(state(), measured(), lineHeight)).toBe(false);
  });

  it.each([
    { top: NaN }, { leading: Infinity }, { width: 0 }, { height: 0 }, { rtl: true },
  ])("does not retain hidden, non-finite or wrong-direction glyph geometry %j", patch => {
    const cache = populated(), slots = measured();
    slots[2] = { ...slots[2], anchor: { ...slots[2].anchor, ...patch } };
    expect(cache.store(state(), slots, 49.4)).toBe(false);
    expect(cache.read(state("W"))).toBeNull();
  });

  it("copies measured values and clears all old anchors on external geometry invalidation", () => {
    const cache = new TypingCaretWordCache(), slots = measured();
    cache.store(state(), slots, 49.4);
    Object.assign(slots[1].anchor, { leading: 999 });
    expect(cache.read(state("W"))!.anchor.leading).toBe(30);
    cache.invalidate();
    expect(cache.read(state("W"))).toBeNull();
  });
});
