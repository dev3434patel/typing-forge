import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { LiveKeyboard } from "./LiveKeyboard";
import { EMPTY_KEYBOARD_INPUT, liveKeyboardLayout } from "@/lib/live-keyboard";
import { PressedKeyStore } from "@/lib/pressed-key-store";
import keyboardMarkup from "./__fixtures__/live-keyboard-render-v1.json";

const render = (
  props: Partial<React.ComponentProps<typeof LiveKeyboard>> = {},
) =>
  renderToStaticMarkup(
    <LiveKeyboard
      layout="qwerty"
      language="en"
      input={EMPTY_KEYBOARD_INPUT}
      visible
      fingerGuide
      onVisibilityChange={() => undefined}
      {...props}
    />,
  );
describe("shared live keyboard rendering", () => {
  it.each(["qwerty", "dvorak", "colemak", "workman", "azerty", "qwertz"])("preserves first/last legacy held keys in every %s row", (layout) => {
    const mapping = liveKeyboardLayout(layout, "en");
    expect(mapping.rows.every((row) => row.length <= 14)).toBe(true);
    const codes = mapping.rows.flatMap((row) => [row[0].code, row.at(-1)!.code]);
    const html = render({ layout, input: { ...EMPTY_KEYBOARD_INPUT, pressedCodes: codes } });
    const held = [...html.matchAll(/data-key-code="([^"]+)"[^>]*data-pressed-key="true"/g)].map((match) => match[1]);
    expect(held).toEqual(codes);
  });
  it.each(keyboardMarkup.cases)("preserves exact pre-optimization markup for $id", ({ props, sha256 }) => {
    // The fixture was captured from the component whose bytes match the
    // frozen final9 source. These include complete attributes and captions,
    // not just selected label substrings or a changed implementation snapshot.
    const html = render(props as Partial<React.ComponentProps<typeof LiveKeyboard>>);
    expect(createHash("sha256").update(html).digest("hex")).toBe(sha256);
  });
  it.each(keyboardMarkup.cases)("preserves identical store-backed SSR markup for $id", ({ props, sha256 }) => {
    const input = props.input ?? EMPTY_KEYBOARD_INPUT;
    const html = render({
      ...props as Partial<React.ComponentProps<typeof LiveKeyboard>>,
      pressedStore: new PressedKeyStore(input.pressedCodes),
    });
    expect(createHash("sha256").update(html).digest("hex")).toBe(sha256);
  });
  it("shows the needed opposite Shift for Caps Lock lowercase and symbols, but not already-capitalized letters", () => {
    const caps = { ...EMPTY_KEYBOARD_INPUT, capsLock: true };
    for (const expectedCharacter of ["a", "!"]) {
      expect(render({ input: caps, expectedCharacter })).toMatch(
        /data-key-code="ShiftRight"[^>]*data-shift-guide="true"/,
      );
    }
    expect(render({ input: caps, expectedCharacter: "A" })).not.toContain(
      'data-shift-guide="true"',
    );
  });
  it("keeps both symbol legends inside the actual held key for inherited high-contrast text", () => {
    const html = render({
      expectedCharacter: "1",
      input: {
        ...EMPTY_KEYBOARD_INPUT,
        focused: true,
        pressedCodes: ["Digit1"],
      },
    });
    expect(html).toMatch(
      /data-key-code="Digit1"[^>]*data-pressed-key="true"[^>]*>[\s\S]*?class="live-key-alternate">!<\/span>[\s\S]*?data-selected="true">1<\/span>/,
    );
  });
  it("keeps next, held and actual incorrect keys as three different signals with no focusable keycaps", () => {
    const html = render({
      expectedCharacter: "a",
      input: {
        ...EMPTY_KEYBOARD_INPUT,
        focused: true,
        pressedCodes: ["ShiftLeft", "KeyX"],
      },
      lastAttempt: {
        typed: "X",
        expected: "a",
        correct: false,
        provenance: "keyboard",
        eventSequence: 1,
      },
    });
    expect(html.match(/data-pressed-key="true"/g)).toHaveLength(2);
    expect(html.match(/data-expected-key="true"/g)).toHaveLength(1);
    expect(html).toMatch(/data-key-code="KeyX"[^>]*data-incorrect-key="true"/);
    expect(html).toContain("Left little finger");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toContain('tabindex="0"');
    expect(html).toContain('aria-hidden="true" dir="ltr"');
  });
  it("does not colour a physical key from an IME commit and describes native references honestly", () => {
    const composed = render({
      lastAttempt: {
        typed: "é",
        expected: "a",
        correct: false,
        provenance: "composition",
        eventSequence: 1,
      },
    });
    expect(composed).not.toContain('data-last-input="true"');
    expect(composed).toContain("composed text");
    const native = render({ language: "ar", expectedCharacter: "ا" });
    expect(native).toContain('data-mapped="false"');
    expect(native).not.toContain("data-key-code=");
    expect(native).toContain("physical keys are not inferred");
  });
  it("retains adaptive mastery and visibility controls without labelling last input as held", () => {
    const html = render({
      adaptive: true,
      lessonKeys: ["a"],
      masteredKeys: ["a"],
      lastAttempt: {
        typed: "x",
        expected: "a",
        correct: false,
        provenance: "keyboard",
        eventSequence: 2,
      },
    });
    expect(html).toContain('class="live-keyboard-board learn-keyboard"');
    expect(html).toContain('data-mastered="true"');
    expect(html).toContain('data-locked="true"');
    expect(html).toContain("learn-key-incorrect");
    expect(html).not.toContain('data-pressed-key="true"');
    const hidden = render({ visible: false });
    expect(hidden).toContain("Show keyboard");
    expect(hidden).not.toContain('role="img"');
  });
});
