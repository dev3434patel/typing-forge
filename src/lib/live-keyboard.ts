import { getContentPack, getLayout } from "./content-packs";
import { REFERENCE_MAPS } from "./keyboard-lab";
import type { InputProvenance } from "./typing-core";

export type Finger =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumb"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";
export const FINGER_NAMES: Readonly<Record<Finger, string>> = {
  "left-pinky": "Left little finger",
  "left-ring": "Left ring finger",
  "left-middle": "Left middle finger",
  "left-index": "Left index finger",
  thumb: "Either thumb",
  "right-index": "Right index finger",
  "right-middle": "Right middle finger",
  "right-ring": "Right ring finger",
  "right-pinky": "Right little finger",
};
export interface LiveKey {
  code: string;
  width: number;
  label: string;
  base?: string;
  shifted?: string;
  finger?: Finger;
  home?: boolean;
  deadBase?: boolean;
  deadShift?: boolean;
}
export interface LiveLayout {
  id: string;
  label: string;
  reference: string;
  mapped: boolean;
  rows: readonly (readonly LiveKey[])[];
  characters: readonly string[];
}
export interface LiveKeyboardAttempt {
  typed: string;
  expected?: string;
  correct: boolean;
  eventSequence: number;
  provenance: InputProvenance;
}
export interface KeyboardInputState {
  pressedCodes: readonly string[];
  focused: boolean;
  composing: boolean;
  deadKey: boolean;
  capsLock: boolean | null;
}
export const EMPTY_KEYBOARD_INPUT: KeyboardInputState = Object.freeze({
  pressedCodes: Object.freeze([]),
  focused: false,
  composing: false,
  deadKey: false,
  capsLock: null,
});

type Definition = readonly [code: string, width?: number];
const ROWS: readonly (readonly Definition[])[] = [
  [
    ["Backquote"],
    ...Array.from({ length: 10 }, (_, i): Definition => [
      `Digit${(i + 1) % 10}`,
    ]),
    ["Minus"],
    ["Equal"],
    ["Backspace", 2],
  ],
  [
    ["Tab", 1.5],
    ...[..."QWERTYUIOP"].map((c): Definition => [`Key${c}`]),
    ["BracketLeft"],
    ["BracketRight"],
    ["Backslash", 1.5],
  ],
  [
    ["CapsLock", 1.75],
    ...[..."ASDFGHJKL"].map((c): Definition => [`Key${c}`]),
    ["Semicolon"],
    ["Quote"],
    ["Enter", 2.25],
  ],
  [
    ["ShiftLeft", 2.25],
    ...[..."ZXCVBNM"].map((c): Definition => [`Key${c}`]),
    ["Comma"],
    ["Period"],
    ["Slash"],
    ["ShiftRight", 2.75],
  ],
  [
    ["ControlLeft", 1.25],
    ["MetaLeft", 1.25],
    ["AltLeft", 1.25],
    ["Space", 6.25],
    ["AltRight", 1.25],
    ["MetaRight", 1.25],
    ["ContextMenu", 1.25],
    ["ControlRight", 1.25],
  ],
];
const SPECIAL: Readonly<Record<string, string>> = {
  Backspace: "⌫",
  Tab: "tab",
  CapsLock: "caps",
  Enter: "enter",
  ShiftLeft: "shift",
  ShiftRight: "shift",
  ControlLeft: "ctrl",
  ControlRight: "ctrl",
  MetaLeft: "meta",
  MetaRight: "meta",
  AltLeft: "alt",
  AltRight: "alt",
  ContextMenu: "menu",
  Space: "space",
};
const US: Readonly<Record<string, readonly [string, string]>> = {
  Backquote: ["`", "~"],
  Digit1: ["1", "!"],
  Digit2: ["2", "@"],
  Digit3: ["3", "#"],
  Digit4: ["4", "$"],
  Digit5: ["5", "%"],
  Digit6: ["6", "^"],
  Digit7: ["7", "&"],
  Digit8: ["8", "*"],
  Digit9: ["9", "("],
  Digit0: ["0", ")"],
  Minus: ["-", "_"],
  Equal: ["=", "+"],
  BracketLeft: ["[", "{"],
  BracketRight: ["]", "}"],
  Backslash: ["\\", "|"],
  Semicolon: [";", ":"],
  Quote: ["'", '"'],
  Comma: [",", "<"],
  Period: [".", ">"],
  Slash: ["/", "?"],
};
// Reference punctuation verified against QMK's keymap_french.h,
// keymap_german.h and keymap_dvorak.h on 2026-10-20:
// https://github.com/qmk/qmk_firmware/tree/master/quantum/keymap_extras
// These are key/character facts, not imported QMK firmware or implementation.
// Explicit desktop reference variants. AltGr, custom remapping and IME sequences
// are deliberately not inferred from a character or an operating-system name.
const VARIANTS: Readonly<
  Record<string, Readonly<Record<string, readonly [string, string]>>>
> = {
  dvorak: {
    Minus: ["[", "{"],
    Equal: ["]", "}"],
    BracketLeft: ["/", "?"],
    BracketRight: ["=", "+"],
    Quote: ["-", "_"],
  },
  azerty: {
    Backquote: ["²", ""],
    Digit1: ["&", "1"],
    Digit2: ["é", "2"],
    Digit3: ['"', "3"],
    Digit4: ["'", "4"],
    Digit5: ["(", "5"],
    Digit6: ["-", "6"],
    Digit7: ["è", "7"],
    Digit8: ["_", "8"],
    Digit9: ["ç", "9"],
    Digit0: ["à", "0"],
    Minus: [")", "°"],
    Equal: ["=", "+"],
    BracketLeft: ["^", "¨"],
    BracketRight: ["$", "£"],
    Backslash: ["*", "µ"],
    Quote: ["ù", "%"],
    KeyM: [",", "?"],
    Comma: [";", "."],
    Period: [":", "/"],
    Slash: ["!", "§"],
    IntlBackslash: ["<", ">"],
  },
  qwertz: {
    Backquote: ["^", "°"],
    Digit2: ["2", '"'],
    Digit3: ["3", "§"],
    Digit6: ["6", "&"],
    Digit7: ["7", "/"],
    Digit8: ["8", "("],
    Digit9: ["9", ")"],
    Digit0: ["0", "="],
    Minus: ["ß", "?"],
    Equal: ["´", "`"],
    BracketLeft: ["ü", "Ü"],
    BracketRight: ["+", "*"],
    Backslash: ["#", "'"],
    Quote: ["ä", "Ä"],
    Comma: [",", ";"],
    Period: [".", ":"],
    Slash: ["-", "_"],
    IntlBackslash: ["<", ">"],
  },
};
const FINGERS: Readonly<Record<string, Finger>> = Object.fromEntries(
  [
    [
      "left-pinky",
      [
        "Backquote",
        "Digit1",
        "Tab",
        "KeyQ",
        "CapsLock",
        "KeyA",
        "ShiftLeft",
        "KeyZ",
        "IntlBackslash",
        "ControlLeft",
      ],
    ],
    ["left-ring", ["Digit2", "KeyW", "KeyS", "KeyX"]],
    ["left-middle", ["Digit3", "KeyE", "KeyD", "KeyC"]],
    [
      "left-index",
      ["Digit4", "Digit5", "KeyR", "KeyT", "KeyF", "KeyG", "KeyV", "KeyB"],
    ],
    [
      "right-index",
      ["Digit6", "Digit7", "KeyY", "KeyU", "KeyH", "KeyJ", "KeyN", "KeyM"],
    ],
    ["right-middle", ["Digit8", "KeyI", "KeyK", "Comma"]],
    ["right-ring", ["Digit9", "KeyO", "KeyL", "Period"]],
    [
      "right-pinky",
      [
        "Digit0",
        "Minus",
        "Equal",
        "KeyP",
        "BracketLeft",
        "BracketRight",
        "Backslash",
        "Semicolon",
        "Quote",
        "Slash",
        "Enter",
        "Backspace",
        "ShiftRight",
        "ControlRight",
      ],
    ],
    ["thumb", ["Space"]],
  ].flatMap(([finger, codes]) =>
    (codes as string[]).map((code) => [code, finger as Finger]),
  ),
);

const layoutCache = new Map<string, LiveLayout>();
export function liveKeyboardLayout(
  layout: string,
  language = "en",
): LiveLayout {
  const pack = getContentPack(language);
  const selected = pack.script === "Latin" ? layout : "native";
  const cacheKey = `${selected}:${pack.id}`;
  if (layoutCache.has(cacheKey)) return layoutCache.get(cacheKey)!;
  const mapping = REFERENCE_MAPS[selected];
  if (!mapping) {
    const native: LiveLayout = {
      id: "native",
      label: getLayout("native").label,
      reference: "Character reference · physical layout is not mapped",
      mapped: false,
      rows: [],
      characters: [...pack.introductionOrder, " "],
    };
    layoutCache.set(cacheKey, native);
    return native;
  }
  const iso = selected === "azerty" || selected === "qwertz";
  const rows = ROWS.map((row, index) => {
    const definitions: Definition[] = [...row];
    if (iso && index === 3)
      definitions.splice(0, 1, ["ShiftLeft", 1.25], ["IntlBackslash"]);
    return definitions.map(([code, width = 1]): LiveKey => {
      const override = VARIANTS[selected]?.[code];
      const base = override?.[0] ?? mapping[code] ?? US[code]?.[0];
      const shifted =
        override?.[1] ??
        (base && base.toLocaleUpperCase(pack.id) !== base
          ? base.toLocaleUpperCase(pack.id)
          : Object.values(US).find((pair) => pair[0] === base)?.[1]);
      const deadBase =
        (selected === "azerty" && code === "BracketLeft") ||
        (selected === "qwertz" && ["Backquote", "Equal"].includes(code));
      const deadShift =
        (selected === "azerty" && code === "BracketLeft") ||
        (selected === "qwertz" && code === "Equal");
      return {
        code,
        width,
        label: SPECIAL[code] ?? base ?? "",
        base:
          code === "Space"
            ? " "
            : code === "Enter"
              ? "\n"
              : code === "Tab"
                ? "\t"
                : base,
        shifted,
        finger: FINGERS[code],
        home: code === "KeyF" || code === "KeyJ",
        deadBase,
        deadShift,
      };
    });
  });
  const reference =
    selected === "azerty"
      ? "French AZERTY reference"
      : selected === "qwertz"
        ? "German QWERTZ reference"
        : "US desktop reference";
  const result: LiveLayout = {
    id: selected,
    label: getLayout(selected).label,
    reference,
    mapped: true,
    rows,
    characters: [],
  };
  layoutCache.set(cacheKey, result);
  return result;
}
export function locateKeyboardCharacter(
  layout: LiveLayout,
  character: string | null | undefined,
): { key: LiveKey; shifted: boolean } | null {
  if (!character || !layout.mapped) return null;
  const normalized = character === "\r\n" ? "\n" : character.normalize("NFC");
  const keys = layout.rows.flat();
  const base = keys.find((key) => !key.deadBase && key.base === normalized);
  if (base) return { key: base, shifted: false };
  const shifted = keys.find(
    (key) => !key.deadShift && key.shifted === normalized,
  );
  return shifted ? { key: shifted, shifted: true } : null;
}
export function oppositeShift(finger: Finger | undefined): string | null {
  if (finger?.startsWith("left-")) return "ShiftRight";
  if (finger?.startsWith("right-")) return "ShiftLeft";
  return null;
}
export function isKeyboardCasePair(key: LiveKey): boolean {
  return (
    !!key.base &&
    key.base !== key.base.toUpperCase() &&
    key.shifted === key.base.toUpperCase()
  );
}
/** Caps Lock reverses alphabetic case; it does not supply shifted punctuation. */
export function keyboardNeedsShift(
  location: ReturnType<typeof locateKeyboardCharacter>,
  capsLock: boolean | null,
): boolean {
  if (!location) return false;
  return isKeyboardCasePair(location.key)
    ? location.shifted !== (capsLock === true)
    : location.shifted;
}
export function keyboardAttempt(
  attempts: readonly LiveKeyboardAttempt[],
): LiveKeyboardAttempt | null {
  for (let index = attempts.length - 1; index >= 0; index--)
    if (!attempts[index].correct) return attempts[index];
  return attempts.at(-1) ?? null;
}

interface KeySignal {
  code?: string;
  key?: string;
  isComposing?: boolean;
  getModifierState?: (name: string) => boolean;
}
export function pressKeyboardKey(
  state: KeyboardInputState,
  event: KeySignal,
): KeyboardInputState {
  const code =
    event.code &&
    /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(event.code) &&
    event.code !== "Unidentified"
      ? event.code
      : null;
  const pressedCodes =
    code && !state.pressedCodes.includes(code)
      ? [...state.pressedCodes, code]
      : state.pressedCodes;
  const composing = state.composing || event.isComposing === true;
  const deadKey = event.key === "Dead";
  const capsLock = event.getModifierState
    ? event.getModifierState("CapsLock")
    : state.capsLock;
  if (
    pressedCodes === state.pressedCodes &&
    state.focused &&
    composing === state.composing &&
    deadKey === state.deadKey &&
    capsLock === state.capsLock
  )
    return state;
  return { pressedCodes, focused: true, composing, deadKey, capsLock };
}
export function releaseKeyboardKey(
  state: KeyboardInputState,
  code: string,
): KeyboardInputState {
  return state.pressedCodes.includes(code)
    ? {
        ...state,
        pressedCodes: state.pressedCodes.filter((key) => key !== code),
      }
    : state;
}

/** Input-local observation only. No event is cancelled, scored, stored or uploaded. */
export function observeKeyboardInput(
  input: HTMLTextAreaElement,
  onChange: (state: KeyboardInputState) => void,
  environment: {
    window: EventTarget;
    document: EventTarget & { hidden: boolean; activeElement: Element | null };
  } = { window, document },
): () => void {
  let state: KeyboardInputState = {
    ...EMPTY_KEYBOARD_INPUT,
    focused: environment.document.activeElement === input,
  };
  let alive = true;
  const publish = (next: KeyboardInputState) => {
    if (alive && next !== state) {
      state = next;
      onChange(state);
    }
  };
  const clear = () => publish(EMPTY_KEYBOARD_INPUT);
  const down = (event: Event) => {
    if (
      environment.document.activeElement === input &&
      !environment.document.hidden
    )
      publish(pressKeyboardKey(state, event as KeyboardEvent));
  };
  const up = (event: Event) => {
    const signal = event as KeyboardEvent;
    let next = releaseKeyboardKey(state, signal.code);
    if (
      next.focused &&
      environment.document.activeElement === input &&
      !environment.document.hidden &&
      typeof signal.getModifierState === "function"
    ) {
      const capsLock = signal.getModifierState("CapsLock");
      if (capsLock !== next.capsLock) next = { ...next, capsLock };
    }
    publish(next);
  };
  const focus = () => publish({ ...state, focused: true });
  const compositionStart = () =>
    publish({ ...state, composing: true, deadKey: false });
  const compositionEnd = () =>
    publish({ ...state, composing: false, deadKey: false });
  const visibility = () => {
    if (environment.document.hidden) clear();
  };
  const windowFocus = () => {
    if (
      environment.document.activeElement === input &&
      !environment.document.hidden
    )
      focus();
  };
  const bindings: Array<[EventTarget, string, EventListener]> = [
    [input, "keydown", down],
    [input, "keyup", up],
    [input, "focus", focus],
    [input, "blur", clear],
    [input, "compositionstart", compositionStart],
    [input, "compositionend", compositionEnd],
    [environment.window, "keyup", up],
    [environment.window, "blur", clear],
    [environment.window, "focus", windowFocus],
    [environment.document, "visibilitychange", visibility],
  ];
  bindings.forEach(([target, type, handler]) =>
    target.addEventListener(type, handler),
  );
  onChange(state);
  return () => {
    alive = false;
    bindings.forEach(([target, type, handler]) =>
      target.removeEventListener(type, handler),
    );
  };
}
