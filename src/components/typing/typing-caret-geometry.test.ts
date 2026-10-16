import { describe, expect, it } from "vitest";
import { typingCaretAnchor, typingCaretGeometry } from "./typing-caret-geometry";

const fragment = { left: 184.5, right: 201.25, top: 270.75, width: 16.75, height: 28 };
const viewport = { left: 20, top: 200 };
const options = { fontSize: 26, scrollLeft: 0, scrollTop: 49.4, rtl: false };
const styles = ["line", "block", "outline", "underline"] as const;

describe("typing caret geometry from native character fragments", () => {
  it("keeps fractional coordinates and viewport scroll in the actual font box", () => {
    expect(typingCaretAnchor(fragment, viewport, options)).toEqual({
      leading: 164.5, top: 120.15, width: 16.75, height: 28, rtl: false,
    });
  });

  it("shares one font box across styles and places the underline at its bottom once", () => {
    const anchor = typingCaretAnchor(fragment, viewport, options)!;
    for (const style of styles) {
      const box = typingCaretGeometry(anchor, style);
      expect(box.left).toBe(anchor.leading);
      expect(box.width).toBe(style === "line" ? 2 : fragment.width);
      if (style === "underline") {
        expect(box.height).toBe(2);
        expect(box.top + box.height).toBeCloseTo(anchor.top + anchor.height);
      } else {
        expect(box.top).toBe(anchor.top);
        expect(box.height).toBe(anchor.height);
      }
    }
  });

  it("aligns the logical leading edge for RTL line, block, outline and underline", () => {
    const anchor = typingCaretAnchor(fragment, viewport, { ...options, rtl: true, scrollLeft: -48 })!;
    for (const style of styles) {
      const box = typingCaretGeometry(anchor, style);
      expect(box.left + box.width).toBeCloseTo(fragment.right - viewport.left - 48);
      expect(box.top + box.height).toBeCloseTo(anchor.top + anchor.height);
    }
  });

  it("uses a zero-width newline's first fragment without unioning the following line", () => {
    const newline = { left: 350, right: 350, top: 319.4, width: 0, height: 28 };
    const anchor = typingCaretAnchor(newline, viewport, options)!;
    expect(anchor.leading).toBe(330);
    expect(anchor.top).toBeCloseTo(168.8);
    expect(anchor.width).toBeCloseTo(15.6);
    expect(typingCaretGeometry(anchor, "block")).toMatchObject({ left: 330, height: 28 });
  });

  it("measures the same static empty/free/end anchor with a useful nominal font height", () => {
    const end = { left: 20, right: 20, top: 247, width: 0, height: 26 };
    const anchor = typingCaretAnchor(end, viewport, { ...options, scrollTop: 0 })!;
    expect(anchor).toEqual({ leading: 0, top: 47, width: 15.6, height: 26, rtl: false });
    expect(typingCaretGeometry(anchor, "underline")).toEqual({ left: 0, top: 71, width: 15.6, height: 2 });
  });

  it("supports wide composed glyphs without shrinking their block or outline caret", () => {
    const wide = { ...fragment, right: fragment.left + 52, width: 52, height: 21 };
    const anchor = typingCaretAnchor(wide, viewport, options)!;
    expect(anchor.height).toBe(26);
    expect(typingCaretGeometry(anchor, "block").width).toBe(52);
    expect(typingCaretGeometry(anchor, "outline").width).toBe(52);
    expect(typingCaretGeometry(anchor, "line").width).toBe(2);
  });

  it("rejects hidden, unavailable or non-finite geometry until a real measurement is available", () => {
    expect(typingCaretAnchor({ ...fragment, height: 0 }, viewport, options)).toBeNull();
    expect(typingCaretAnchor({ ...fragment, top: NaN }, viewport, options)).toBeNull();
    expect(typingCaretAnchor({ ...fragment, width: -1 }, viewport, options)).toBeNull();
    expect(typingCaretAnchor(fragment, viewport, { ...options, fontSize: 0 })).toBeNull();
    expect(typingCaretAnchor(fragment, { ...viewport, left: Infinity }, options)).toBeNull();
  });
});
