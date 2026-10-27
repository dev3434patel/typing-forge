import { describe, expect, it, vi } from "vitest";
import { EMPTY_KEYBOARD_INPUT, observeKeyboardInput, type KeyboardInputState } from "../live-keyboard";
import { keyboardSemanticInput, PressedKeyStore } from "../pressed-key-store";

describe("input-local physical key subscriptions", () => {
  it("notifies only changed codes, with stable primitive snapshots", () => {
    const store = new PressedKeyStore();
    const a = vi.fn(), b = vi.fn(), shift = vi.fn();
    store.subscribe("KeyA", a);
    store.subscribe("KeyB", b);
    store.subscribe("ShiftLeft", shift);
    expect(store.getSnapshot("KeyA")).toBe(false);
    store.replace(["KeyA"]);
    expect(store.getSnapshot("KeyA")).toBe(true);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
    store.replace(["KeyA", "ShiftLeft"]);
    expect(a).toHaveBeenCalledTimes(1);
    expect(shift).toHaveBeenCalledTimes(1);
    store.replace(["ShiftLeft"]);
    expect(a).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot("KeyA")).toBe(false);
    expect(store.getSnapshot("ShiftLeft")).toBe(true);
    expect(b).not.toHaveBeenCalled();
  });

  it("publishes an entire chord before notifying its first subscriber", () => {
    const store = new PressedKeyStore();
    const snapshots: boolean[][] = [];
    store.subscribe("KeyA", () => snapshots.push([store.getSnapshot("KeyA"), store.getSnapshot("ShiftLeft")]));
    store.subscribe("ShiftLeft", () => snapshots.push([store.getSnapshot("KeyA"), store.getSnapshot("ShiftLeft")]));
    store.replace(["KeyA", "ShiftLeft"]);
    store.clear();
    expect(snapshots).toEqual([[true, true], [true, true], [false, false], [false, false]]);
  });

  it("deduplicates repeats, duplicate codes, ordering changes and empty clears", () => {
    const store = new PressedKeyStore();
    const a = vi.fn();
    store.subscribe("KeyA", a);
    store.clear();
    store.replace(["KeyA", "KeyA", "ShiftLeft"]);
    store.replace(["ShiftLeft", "KeyA"]);
    store.replace(["ShiftLeft", "KeyA"]);
    expect(a).toHaveBeenCalledTimes(1);
    store.clear();
    store.clear();
    expect(a).toHaveBeenCalledTimes(2);
  });

  it("owns its held state and unsubscribes independently for each guide", () => {
    const first = new PressedKeyStore(), second = new PressedKeyStore();
    const a = vi.fn(), other = vi.fn();
    const unsubscribe = first.subscribe("KeyA", a);
    second.subscribe("KeyA", other);
    first.replace(["KeyA"]);
    expect(second.getSnapshot("KeyA")).toBe(false);
    expect(other).not.toHaveBeenCalled();
    unsubscribe();
    unsubscribe();
    first.clear();
    expect(a).toHaveBeenCalledTimes(1);
    second.replace(["KeyA"]);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("copies initial and replacement arrays instead of retaining mutable input", () => {
    const initial = ["KeyA"], next = ["KeyB"];
    const store = new PressedKeyStore(initial);
    initial.length = 0;
    expect(store.getSnapshot("KeyA")).toBe(true);
    store.replace(next);
    next.push("KeyX");
    expect(store.getSnapshot("KeyB")).toBe(true);
    expect(store.getSnapshot("KeyX")).toBe(false);
  });

  it("allows one subscriber to leave without removing another for the same key", () => {
    const store = new PressedKeyStore();
    const first = vi.fn(), second = vi.fn();
    const remove = store.subscribe("KeyA", first);
    store.subscribe("KeyA", second);
    remove();
    store.replace(["KeyA"]);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("semantic guide state", () => {
  const focused: KeyboardInputState = { ...EMPTY_KEYBOARD_INPUT, focused: true, capsLock: false };
  it("keeps the same parent state through ordinary presses and multi-key releases", () => {
    for (const pressedCodes of [["KeyA"], ["KeyA", "KeyB"], ["KeyB"], [], ["ControlLeft"], ["AltRight"], ["CapsLock"]])
      expect(keyboardSemanticInput(focused, { ...focused, pressedCodes })).toBe(focused);
  });
  it("retains held Shift metadata so case/symbol labels still change", () => {
    const first = keyboardSemanticInput(focused, { ...focused, pressedCodes: ["ShiftLeft", "KeyA"] });
    expect(first.pressedCodes).toEqual(["ShiftLeft"]);
    expect(keyboardSemanticInput(first, { ...first, pressedCodes: ["ShiftLeft", "KeyB"] })).toBe(first);
    const both = keyboardSemanticInput(first, { ...first, pressedCodes: ["ShiftLeft", "ShiftRight"] });
    expect(both.pressedCodes).toEqual(["ShiftLeft", "ShiftRight"]);
    const right = keyboardSemanticInput(both, { ...both, pressedCodes: ["ShiftRight"] });
    expect(right.pressedCodes).toEqual(["ShiftRight"]);
    expect(keyboardSemanticInput(right, focused).pressedCodes).toEqual([]);
  });
  it.each([
    { focused: false }, { composing: true }, { deadKey: true }, { capsLock: true }, { capsLock: null },
  ])("preserves the semantic transition %j", (change) => {
    const next = keyboardSemanticInput(focused, { ...focused, ...change, pressedCodes: ["KeyX"] });
    expect(next).not.toBe(focused);
    expect(next).toMatchObject(change);
    expect(next.pressedCodes).toEqual([]);
  });
});

describe("real keyboard observer to leaf-store bridge", () => {
  function bridge() {
    const input = new EventTarget(), win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { hidden: false, activeElement: input as unknown as Element });
    const store = new PressedKeyStore();
    const parents: KeyboardInputState[] = [];
    let semantic = EMPTY_KEYBOARD_INPUT;
    const stopObserver = observeKeyboardInput(input as unknown as HTMLTextAreaElement, (next) => {
      store.replace(next.pressedCodes);
      const updated = keyboardSemanticInput(semantic, next);
      if (updated !== semantic) parents.push(semantic = updated);
    }, { window: win, document: doc });
    const send = (target: EventTarget, type: string, props = {}) =>
      target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), props));
    const key = (code: string, type = "keydown", props = {}) => send(input, type, { code, key: code, getModifierState: () => false, ...props });
    return { input, win, doc, store, parents, send, key, stop: () => { stopObserver(); store.clear(); } };
  }

  it("routes ordinary down/up and repeats only to affected leaves after initial Caps Lock observation", () => {
    const f = bridge();
    f.key("KeyA");
    f.key("KeyA", "keyup");
    const initial = f.parents.length;
    const b = vi.fn();
    f.store.subscribe("KeyB", b);
    for (const code of ["KeyB", "KeyC", "KeyB"]) f.key(code);
    expect(f.store.getSnapshot("KeyB")).toBe(true);
    expect(f.store.getSnapshot("KeyC")).toBe(true);
    f.key("KeyB", "keyup");
    f.send(f.win, "keyup", { code: "KeyC", getModifierState: () => false });
    expect(f.parents).toHaveLength(initial);
    expect(b).toHaveBeenCalledTimes(2);
    f.stop();
  });

  it.each(["input-blur", "window-blur", "hidden"])("clears both held chords and semantic input on %s", (boundary) => {
    const f = bridge();
    f.key("ShiftLeft");
    f.key("KeyA");
    f.send(f.input, "compositionstart");
    expect(f.parents.at(-1)?.composing).toBe(true);
    if (boundary === "hidden") { f.doc.hidden = true; f.send(f.doc, "visibilitychange"); }
    else f.send(boundary === "window-blur" ? f.win : f.input, "blur");
    expect(f.store.getSnapshot("KeyA")).toBe(false);
    expect(f.store.getSnapshot("ShiftLeft")).toBe(false);
    expect(f.parents.at(-1)).toEqual(EMPTY_KEYBOARD_INPUT);
    f.stop();
  });

  it("forwards Caps Lock keyup, dead keys and composition without inventing committed text", () => {
    const f = bridge();
    f.key("CapsLock", "keyup", { getModifierState: () => true });
    expect(f.parents.at(-1)?.capsLock).toBe(true);
    f.key("Quote", "keydown", { key: "Dead", getModifierState: () => true });
    expect(f.parents.at(-1)?.deadKey).toBe(true);
    f.send(f.input, "compositionstart");
    expect(f.parents.at(-1)).toMatchObject({ composing: true, deadKey: false });
    f.send(f.input, "compositionend");
    expect(f.parents.at(-1)).toMatchObject({ composing: false, deadKey: false });
    f.stop();
  });

  it("clears held snapshots at replacement/unmount and rejects every late observer event", () => {
    const f = bridge();
    f.key("KeyA");
    const a = vi.fn();
    f.store.subscribe("KeyA", a);
    const parents = f.parents.length;
    f.stop();
    expect(a).toHaveBeenCalledTimes(1);
    expect(f.store.getSnapshot("KeyA")).toBe(false);
    f.key("KeyA");
    f.send(f.win, "focus");
    expect(f.parents).toHaveLength(parents);
    expect(f.store.getSnapshot("KeyA")).toBe(false);
  });
});
