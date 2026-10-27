import { describe, expect, it, vi } from "vitest";
import { learningCaretContentBox, learningCaretGeometry, learningCaretGeometryFromContentBox } from "../learning-caret-geometry";
import { TypingCaretWordCache, type CaretLayoutState } from "@/components/typing/typing-caret-cache";

const base = {
  boundary: { left: 100.25, top: 200.5 },
  marker: { left: 143.75, top: 304.1, width: 14.125, height: 27.75 },
  scrollLeft: 3.5,
  scrollTop: 48.1,
  fontSize: 28,
  style: "block" as const,
  direction: "ltr" as const,
};

describe("learning native caret geometry", () => {
  it("retains fractional native glyph dimensions and the existing row scroll", () => {
    const result = learningCaretGeometry(base)!;
    expect(result.x).toBe(47);
    expect(result.y).toBeCloseTo(151.7);
    expect(result.width).toBe(14.125);
    expect(result.height).toBe(27.75);
    expect(result.scrollTop).toBeCloseTo(51.8);
  });

  it("does not need a second native read after the stage scrolls", () => {
    const first = learningCaretGeometry(base)!;
    const scrollDelta = first.scrollTop - base.scrollTop;
    const after = learningCaretGeometry({
      ...base,
      scrollTop: first.scrollTop,
      marker: { ...base.marker, top: base.marker.top - scrollDelta },
    });
    expect(after!.y).toBeCloseTo(first.y, 10);
    expect({ ...after, y: 0 }).toEqual({ ...first, y: 0 });
  });

  it.each(["line", "block", "underline", "outline"] as const)(
    "applies the %s shape and RTL offset exactly once",
    (style) => {
      const left = learningCaretGeometry({ ...base, style })!;
      const right = learningCaretGeometry({ ...base, style, direction: "rtl" })!;
      expect(right.x - left.x).toBe(style === "line" ? base.marker.width : 0);
      expect(left.width).toBe(style === "line" ? 2 : base.marker.width);
      expect(left.height).toBe(style === "underline" ? 2 : base.marker.height);
      expect(left.y).toBeCloseTo(151.7 + (style === "underline" ? 25.75 : 0));
      expect(right.scrollTop).toBe(left.scrollTop);
    },
  );

  it("preserves the one-pixel row tolerance and never scrolls above the first line", () => {
    const at = (y: number) => learningCaretGeometry({
      ...base, boundary: { left: 0, top: 0 }, scrollTop: 0,
      marker: { ...base.marker, top: y }, fontSize: 20,
    })!.scrollTop;
    expect(at(0)).toBe(0);
    expect(at(72.9)).toBe(0);
    expect(at(73)).toBe(37);
    expect(at(110)).toBe(74);
  });

  it("keeps a measurable two-pixel caret for a zero-width native marker", () => {
    expect(learningCaretGeometry({ ...base, marker: { ...base.marker, width: 0 } })!.width).toBe(2);
  });

  it.each([
    { fontSize: 0 }, { fontSize: Number.NaN }, { scrollTop: Number.POSITIVE_INFINITY },
    { marker: { ...base.marker, height: 0 } }, { marker: { ...base.marker, width: -1 } },
    { boundary: { left: Number.NaN, top: 0 } },
  ])("hides unusable native geometry %#", (invalid) => {
    expect(learningCaretGeometry({ ...base, ...invalid })).toBeNull();
  });
});

describe("Learn measured content-coordinate caret windows", () => {
  it.each(["line", "block", "underline", "outline"] as const)("preserves all native %s geometry and row rounding in both directions", style => {
    const box = learningCaretContentBox(base)!;
    for (const direction of ["ltr", "rtl"] as const)
      expect(learningCaretGeometryFromContentBox(box, { fontSize: base.fontSize, style, direction }))
        .toEqual(learningCaretGeometry({ ...base, style, direction }));
  });

  it.each([0.75, 1.5, 3.125, 14.125])("keeps the raw%spx advance and exact small native height until the legacy style calculation", width => {
    const source = { ...base, marker: { ...base.marker, width, height: 18.125 } };
    const box = learningCaretContentBox(source)!;
    expect(box.width).toBe(width);
    expect(box.height).toBe(18.125);
    expect(learningCaretGeometryFromContentBox(box, { fontSize: 28, style: "outline", direction: "ltr" }))
      .toEqual(learningCaretGeometry({ ...source, style: "outline", direction: "ltr" }));
  });

  it("does not alter content boxes across viewport/page scroll or apply underline translation twice", () => {
    const first = learningCaretContentBox(base)!;
    const after = learningCaretContentBox({ ...base, boundary: { left: base.boundary.left - 9, top: base.boundary.top - 40 },
      marker: { ...base.marker, left: base.marker.left - 9, top: base.marker.top - 40 - 49.4 }, scrollTop: base.scrollTop + 49.4 })!;
    expect(after.leading).toBe(first.leading);
    expect(after.top).toBeCloseTo(first.top, 10);
    const options = { fontSize: base.fontSize, style: "underline" as const, direction: "ltr" as const };
    const one = learningCaretGeometryFromContentBox(first, options)!;
    expect(learningCaretGeometryFromContentBox(first, options)).toEqual(one);
    expect(one.y).toBeCloseTo(first.top + first.height - 2, 10);
  });

  it("reuses actual narrow, whitespace and wrapped union boxes without additional native reads", () => {
    const cache = new TypingCaretWordCache(), targetText = "i m";
    const state = (cursor: number): CaretLayoutState => ({ targetText, finalText: targetText.slice(0, cursor), cursor,
      fontKey: "en:custom", fontSize: 28, scoringPolicy: "prose", rtl: false, composing: false });
    const rectangles = [{ ...base.marker, width: 1.125 }, { ...base.marker, left: 144.875, width: 3.25 }, { ...base.marker, left: 110.25, top: 355.9, width: 17.875 }];
    const native = vi.fn(() => rectangles.map((marker, index) => ({ index, expected: targetText[index], anchor: learningCaretContentBox({ ...base, marker })! })));
    expect(cache.storeForward(state(0), native(), 28 * 1.85)).toBe(true);
    for (let cursor = 0; cursor < 3; cursor++) {
      const hit = cache.read(state(cursor))!;
      for (const style of ["line", "block", "underline", "outline"] as const)
        expect(learningCaretGeometryFromContentBox(hit.anchor, { fontSize: 28, style, direction: "ltr" }))
          .toEqual(learningCaretGeometry({ ...base, marker: rectangles[cursor], style, direction: "ltr" }));
    }
    expect(native).toHaveBeenCalledOnce();
    expect(cache.read(state(3))).toBeNull();
    cache.invalidate();
    expect(cache.read(state(2))).toBeNull();
  });

  it.each([
    { marker: { ...base.marker, width: 0 } }, { marker: { ...base.marker, width: -1 } },
    { marker: { ...base.marker, width: Infinity } }, { marker: { ...base.marker, height: 0 } },
    { marker: { ...base.marker, top: NaN } }, { scrollTop: Infinity },
    { scrollLeft: NaN }, { boundary: { left: 0, top: NaN } },
  ])("keeps unusable captured bounds on the native fallback%#", patch => {
    expect(learningCaretContentBox({ ...base, ...patch })).toBeNull();
  });

  it("does not alias mutable native measurement objects", () => {
    const source = { ...base, marker: { ...base.marker } }, box = learningCaretContentBox(source)!;
    source.marker.left = 999;
    source.marker.width = 999;
    expect(box.leading).toBe(47);
    expect(box.width).toBe(14.125);
  });
});
