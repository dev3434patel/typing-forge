import { describe, expect, it } from "vitest";
import {
  KEYBOARD_KEYS,
  KEYBOARD_PITCH,
} from "../../components/brand/keyboard-layout";

describe("ANSI opening keyboard geometry", () => {
  it("contains 61 distinct physical keys in five complete fifteen-unit rows", () => {
    expect(KEYBOARD_KEYS).toHaveLength(61);
    expect(new Set(KEYBOARD_KEYS.map((key) => key.id)).size).toBe(61);
    for (const row of [-2, -1, 0, 1, 2]) {
      const keys = KEYBOARD_KEYS.filter((key) => key.z === row);
      expect(keys.reduce((sum, key) => sum + key.width, 0)).toBe(15);
      expect(keys[0].x - keys[0].width / 2).toBe(-7.5);
      expect(keys.at(-1)!.x + keys.at(-1)!.width / 2).toBe(7.5);
      for (let index = 1; index < keys.length; index++) {
        expect(keys[index - 1].x + keys[index - 1].width / 2).toBe(
          keys[index].x - keys[index].width / 2,
        );
      }
    }
  });

  it("preserves standard modifier widths, 18.5mm pitch and every wordmark key", () => {
    expect(KEYBOARD_PITCH * 50).toBe(18.5);
    expect(KEYBOARD_KEYS.find((key) => key.id === "Space")?.width).toBe(6.25);
    expect(KEYBOARD_KEYS.find((key) => key.id === "Enter")?.width).toBe(2.25);
    expect(KEYBOARD_KEYS.find((key) => key.id === "Backspace")?.width).toBe(2);
    for (const letter of "SPAROWTYPE") {
      expect(
        KEYBOARD_KEYS.filter((key) => key.id === `Key${letter}`),
      ).toHaveLength(1);
    }
  });
});
