import { describe, expect, it } from "vitest";
import {
  EMPTY_KEYBOARD_INPUT,
  FINGER_NAMES,
  keyboardAttempt,
  keyboardNeedsShift,
  liveKeyboardLayout,
  locateKeyboardCharacter,
  observeKeyboardInput,
  oppositeShift,
  pressKeyboardKey,
  releaseKeyboardKey,
  type KeyboardInputState,
  type LiveKey,
  type LiveLayout,
} from "../live-keyboard";
import { REFERENCE_MAPS } from "../keyboard-lab";

describe("allocation-free logical key lookup", () => {
  const key = (code: string, base: string, shifted?: string): LiveKey => ({ code, base, shifted, label: base, width: 1 });
  const layout = (rows: LiveKey[][]): LiveLayout => ({ id: "mutable-fixture", label: "Mutable reference", reference: "Test-only reference", mapped: true, rows, characters: [] });

  it("prefers a later-row base match over an earlier-row shifted match", () => {
    const shifted = key("KeyA", "a", "x"), base = key("KeyX", "x", "X");
    const board = layout([[shifted], [base]]);
    expect(locateKeyboardCharacter(board, "x")).toEqual({ key: base, shifted: false });
    expect(locateKeyboardCharacter(board, "X")).toEqual({ key: base, shifted: true });
  });

  it("keeps first matching key order while excluding dead base and shifted characters independently", () => {
    const dead = { ...key("Dead", "x", "X"), deadBase: true, deadShift: true };
    const first = key("First", "x", "X"), second = key("Second", "x", "X");
    const board = layout([[dead, first], [second]]);
    expect(locateKeyboardCharacter(board, "x")).toEqual({ key: first, shifted: false });
    expect(locateKeyboardCharacter(board, "X")).toEqual({ key: first, shifted: true });
    first.deadBase = true;
    expect(locateKeyboardCharacter(board, "x")).toEqual({ key: second, shifted: false });
    expect(locateKeyboardCharacter(board, "X")).toEqual({ key: first, shifted: true });
    first.deadShift = true; second.deadShift = true;
    expect(locateKeyboardCharacter(board, "X")).toBeNull();
  });

  it("observes mutable keys and row replacement after an earlier lookup", () => {
    const mutable = key("Mutable", "a", "A"), rows = [[mutable]], board = layout(rows);
    expect(locateKeyboardCharacter(board, "a")?.key).toBe(mutable);
    mutable.base = "z"; mutable.shifted = "Z";
    expect(locateKeyboardCharacter(board, "a")).toBeNull();
    expect(locateKeyboardCharacter(board, "Z")).toEqual({ key: mutable, shifted: true });
    const replacement = key("Replacement", "a", "A"); rows[0] = [replacement];
    expect(locateKeyboardCharacter(board, "z")).toBeNull();
    expect(locateKeyboardCharacter(board, "a")?.key).toBe(replacement);
  });

  it("preserves NFC and CRLF normalization without fabricating an unmapped physical position", () => {
    const accented = key("Accent", "é", "É"), enter = key("Enter", "\n");
    const board = layout([[accented, enter]]);
    expect(locateKeyboardCharacter(board, "e\u0301")).toEqual({ key: accented, shifted: false });
    expect(locateKeyboardCharacter(board, "\r\n")).toEqual({ key: enter, shifted: false });
    expect(locateKeyboardCharacter(board, "")).toBeNull();
    expect(locateKeyboardCharacter(board, undefined)).toBeNull();
    board.mapped = false;
    expect(locateKeyboardCharacter(board, "é")).toBeNull();
  });

  it("retains flat's sparse-row behavior and the original key object identity", () => {
    const sparse: LiveKey[] = []; const present = key("Present", "a", "A"); sparse[2] = present;
    const rows: LiveKey[][] = []; rows[1] = sparse;
    const board = layout(rows);
    expect(locateKeyboardCharacter(board, "a")?.key).toBe(present);
    expect(locateKeyboardCharacter(board, "A")?.key).toBe(present);
    expect(locateKeyboardCharacter(board, "z")).toBeNull();
  });

  it("matches the prior flattened lookup across every declared reference's base and shifted characters", () => {
    for (const id of Object.keys(REFERENCE_MAPS)) for (const language of ["en", "fr", "de"]) {
      const board = liveKeyboardLayout(id, language), keys = board.rows.flat();
      const characters = new Set(keys.flatMap((value) => [value.base, value.shifted]).filter((value): value is string => value !== undefined));
      for (const character of characters) {
        const normalized = character === "\r\n" ? "\n" : character.normalize("NFC");
        const base = keys.find((value) => !value.deadBase && value.base === normalized);
        const shifted = base ? undefined : keys.find((value) => !value.deadShift && value.shifted === normalized);
        const expected = !character ? null : base ? { key: base, shifted: false } : shifted ? { key: shifted, shifted: true } : null;
        expect(locateKeyboardCharacter(board, character), `${id}:${language}:${JSON.stringify(character)}`).toEqual(expected);
      }
    }
  });
});

describe("live keyboard reference geometry and logical guidance", () => {
  it("reverses letter case under Caps Lock while preserving actual shifted-symbol requirements", () => {
    const board = liveKeyboardLayout("qwerty");
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "A"), false)).toBe(
      true,
    );
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "A"), true)).toBe(
      false,
    );
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "a"), false)).toBe(
      false,
    );
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "a"), true)).toBe(
      true,
    );
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "!"), true)).toBe(
      true,
    );
    expect(keyboardNeedsShift(locateKeyboardCharacter(board, "1"), true)).toBe(
      false,
    );
    expect(
      keyboardNeedsShift(
        locateKeyboardCharacter(liveKeyboardLayout("azerty", "fr"), "2"),
        true,
      ),
    ).toBe(true);
    expect(keyboardNeedsShift(null, true)).toBe(false);
  });
  it("keeps complete staggered rows, modifiers and independent physical codes across seven references", () => {
    for (const id of Object.keys(REFERENCE_MAPS)) {
      const board = liveKeyboardLayout(id);
      expect(board.rows).toHaveLength(5);
      expect(new Set(board.rows.flat().map((key) => key.code)).size).toBe(
        board.rows.flat().length,
      );
      for (const row of board.rows)
        expect(row.reduce((total, key) => total + key.width, 0)).toBe(15);
      expect(board.rows.flat()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "ShiftLeft" }),
          expect.objectContaining({ code: "Backspace", width: 2 }),
          expect.objectContaining({ code: "Space", width: 6.25 }),
        ]),
      );
      for (const [code, character] of Object.entries(REFERENCE_MAPS[id])) {
        expect(
          board.rows.flat().find((key) => key.code === code)?.base,
          `${id}:${code}`,
        ).toBe(character);
      }
    }
    expect(liveKeyboardLayout("qwerty").rows.flat()).toHaveLength(61);
    expect(liveKeyboardLayout("qwertz").rows.flat()).toHaveLength(62);
  });
  it("maps shifted punctuation by reference character rather than its old QWERTY position", () => {
    const qwerty = liveKeyboardLayout("qwerty");
    expect(locateKeyboardCharacter(qwerty, "@")).toMatchObject({
      key: { code: "Digit2", finger: "left-ring" },
      shifted: true,
    });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("dvorak"), '"'),
    ).toMatchObject({ key: { code: "KeyQ" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("colemak"), ":"),
    ).toMatchObject({ key: { code: "KeyP" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("azerty", "fr"), "2"),
    ).toMatchObject({ key: { code: "Digit2", base: "é" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("qwertz", "de"), "Ä"),
    ).toMatchObject({ key: { code: "Quote" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("qwertz", "de"), ";"),
    ).toMatchObject({ key: { code: "Comma" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("qwertz", "de"), ":"),
    ).toMatchObject({ key: { code: "Period" }, shifted: true });
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("azerty", "fr"), "^"),
    ).toBeNull();
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("qwertz", "de"), "´"),
    ).toBeNull();
    expect(locateKeyboardCharacter(qwerty, "\r\n")?.key.code).toBe("Enter");
    expect(locateKeyboardCharacter(qwerty, "\t")?.key.code).toBe("Tab");
    expect(
      oppositeShift(locateKeyboardCharacter(qwerty, "A")?.key.finger),
    ).toBe("ShiftRight");
    expect(
      oppositeShift(locateKeyboardCharacter(qwerty, "P")?.key.finger),
    ).toBe("ShiftLeft");
    expect(FINGER_NAMES["left-index"]).toBe("Left index finger");
  });
  it("does not fabricate physical positions for composed/native/custom characters", () => {
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("qwerty"), "é"),
    ).toBeNull();
    expect(liveKeyboardLayout("qwerty", "ar")).toMatchObject({
      mapped: false,
      rows: [],
    });
    expect(liveKeyboardLayout("native").mapped).toBe(false);
    expect(liveKeyboardLayout("unsupported").mapped).toBe(false);
    expect(
      locateKeyboardCharacter(liveKeyboardLayout("native", "hi"), "क"),
    ).toBeNull();
  });
  it("retains multi-key chords until actual releases and never adds unidentified/repeated duplicates", () => {
    const shifted = pressKeyboardKey(EMPTY_KEYBOARD_INPUT, {
      code: "ShiftLeft",
      key: "Shift",
    });
    const typed = pressKeyboardKey(shifted, { code: "KeyA", key: "A" });
    expect(typed.pressedCodes).toEqual(["ShiftLeft", "KeyA"]);
    expect(pressKeyboardKey(typed, { code: "KeyA", key: "A" })).toBe(typed);
    expect(releaseKeyboardKey(typed, "KeyA").pressedCodes).toEqual([
      "ShiftLeft",
    ]);
    expect(releaseKeyboardKey(typed, "KeyB")).toBe(typed);
    expect(
      pressKeyboardKey(EMPTY_KEYBOARD_INPUT, { code: "Unidentified", key: "é" })
        .pressedCodes,
    ).toEqual([]);
    expect(
      pressKeyboardKey(EMPTY_KEYBOARD_INPUT, { code: "Quote", key: "Dead" })
        .deadKey,
    ).toBe(true);
  });
  it("chooses real committed errors separately from held state, without mutating input evidence", () => {
    const attempts = [
      {
        typed: "x",
        expected: "a",
        correct: false,
        eventSequence: 1,
        provenance: "keyboard" as const,
      },
      {
        typed: "b",
        expected: "b",
        correct: true,
        eventSequence: 1,
        provenance: "keyboard" as const,
      },
    ];
    expect(keyboardAttempt(attempts)).toEqual(attempts[0]);
    expect(attempts).toHaveLength(2);
    expect(keyboardAttempt([])).toBeNull();
  });
});

class Target extends EventTarget {
  bindings = new Map<string, Set<EventListenerOrEventListenerObject>>();
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
  ) {
    const listeners = this.bindings.get(type) ?? new Set();
    listeners.add(listener);
    this.bindings.set(type, listeners);
    super.addEventListener(type, listener, options);
  }
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: EventListenerOptions | boolean,
  ) {
    this.bindings.get(type)?.delete(listener);
    super.removeEventListener(type, listener, options);
  }
  get listeners() {
    return [...this.bindings.values()].reduce(
      (total, set) => total + set.size,
      0,
    );
  }
}
function fixture() {
  const input = new Target();
  const win = new Target();
  const doc = Object.assign(new Target(), {
    hidden: false,
    activeElement: input as unknown as Element,
  });
  const states: KeyboardInputState[] = [];
  const stop = observeKeyboardInput(
    input as unknown as HTMLTextAreaElement,
    (state) => states.push(state),
    { window: win, document: doc },
  );
  const send = (target: EventTarget, type: string, props = {}) =>
    target.dispatchEvent(Object.assign(new Event(type), props));
  return { input, win, doc, states, stop, send, latest: () => states.at(-1)! };
}
describe("live keyboard listener lifetime", () => {
  it("refreshes Caps Lock on keyup only for the active visible input", () => {
    const f = fixture();
    f.send(f.input, "keydown", {
      code: "CapsLock",
      key: "CapsLock",
      getModifierState: () => false,
    });
    f.send(f.input, "keyup", {
      code: "CapsLock",
      getModifierState: () => true,
    });
    expect(f.latest()).toMatchObject({ pressedCodes: [], capsLock: true });
    f.send(f.win, "keyup", {
      code: "ShiftLeft",
      getModifierState: () => false,
    });
    expect(f.latest().capsLock).toBe(false);
    f.send(f.input, "blur");
    f.send(f.win, "keyup", {
      code: "CapsLock",
      getModifierState: () => true,
    });
    expect(f.latest()).toBe(EMPTY_KEYBOARD_INPUT);
    f.stop();
  });
  it("observes only the chosen focused input and releases held keys even when keyup happens elsewhere", () => {
    const f = fixture();
    f.send(f.win, "keydown", { code: "KeyX", key: "x" });
    expect(f.latest().pressedCodes).toEqual([]);
    f.send(f.input, "keydown", { code: "KeyA", key: "a" });
    expect(f.latest().pressedCodes).toEqual(["KeyA"]);
    f.send(f.win, "keyup", { code: "KeyA" });
    expect(f.latest().pressedCodes).toEqual([]);
    f.doc.activeElement = null;
    f.send(f.input, "keydown", { code: "KeyX", key: "x" });
    expect(f.latest().pressedCodes).toEqual([]);
    f.stop();
  });
  it("clears chords/composition on blur or hidden documents and cleans every listener on replacement", () => {
    const f = fixture();
    const initial = f.input.listeners + f.win.listeners + f.doc.listeners;
    for (const boundary of ["input-blur", "window-blur", "hidden"] as const) {
      f.doc.hidden = false;
      f.send(f.input, "focus");
      f.send(f.input, "keydown", { code: "ShiftLeft", key: "Shift" });
      f.send(f.input, "compositionstart");
      expect(f.latest().composing).toBe(true);
      if (boundary === "hidden") {
        f.doc.hidden = true;
        f.send(f.doc, "visibilitychange");
      } else f.send(boundary === "window-blur" ? f.win : f.input, "blur");
      expect(f.latest()).toBe(EMPTY_KEYBOARD_INPUT);
    }
    expect(f.input.listeners + f.win.listeners + f.doc.listeners).toBe(initial);
    const before = f.states.length;
    f.stop();
    expect(f.input.listeners + f.win.listeners + f.doc.listeners).toBe(0);
    f.send(f.input, "focus");
    f.send(f.input, "keydown", { code: "KeyA", key: "a" });
    expect(f.states).toHaveLength(before);
  });
  it("observes IME and dead-key activity without committing text or swallowing native events", () => {
    const f = fixture();
    const event = Object.assign(new Event("keydown", { cancelable: true }), {
      code: "Quote",
      key: "Dead",
    });
    f.input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(f.latest().deadKey).toBe(true);
    f.send(f.input, "compositionstart");
    expect(f.latest()).toMatchObject({ composing: true, deadKey: false });
    f.send(f.input, "compositionend");
    expect(f.latest()).toMatchObject({ composing: false, deadKey: false });
    f.stop();
  });
});
