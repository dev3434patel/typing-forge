/** Browser input observations, not a hardware diagnostic or benchmark score. */
export const LAB_IDLE_LIMIT_MS = 2_000;
export const LAB_PAIR_SAMPLE_LIMIT = 60;
export const LAB_ROWS = [
  [
    "Backquote",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
    "Backspace",
  ],
  [
    "Tab",
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
    "Backslash",
  ],
  [
    "CapsLock",
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
    "Enter",
  ],
  [
    "ShiftLeft",
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
    "ShiftRight",
  ],
  [
    "ControlLeft",
    "MetaLeft",
    "AltLeft",
    "Space",
    "AltRight",
    "MetaRight",
    "ControlRight",
  ],
] as const;

const LETTER_CODES = [
  [
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
  ],
  [
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
  ],
  [
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
  ],
];
/** Partial desktop reference maps. Locale variants and remapping can differ. */
const REFERENCE_ROWS: Record<string, string[]> = {
  qwerty: ["qwertyuiop", "asdfghjkl;", "zxcvbnm,./"],
  dvorak: ["',.pyfgcrl", "aoeuidhtns", ";qjkxbmwvz"],
  colemak: ["qwfpgjluy;", "arstdhneio", "zxcvbkm,./"],
  "colemak-dh": ["qwfpbjluy;", "arstgmneio", "zxcdvkh,./"],
  azerty: ["azertyuiop", "qsdfghjklm", "wxcvbn,;:!"],
  qwertz: ["qwertzuiop", "asdfghjklö", "yxcvbnm,.-"],
};
export const LAB_LAYOUT_LABELS: Readonly<Record<string, string>> = {
  qwerty: "QWERTY",
  dvorak: "Dvorak",
  colemak: "Colemak",
  "colemak-dh": "Colemak-DH",
  azerty: "AZERTY",
  qwertz: "QWERTZ",
  native: "Native / custom",
};
export const REFERENCE_MAPS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = Object.fromEntries(
  Object.entries(REFERENCE_ROWS).map(([layout, rows]) => [
    layout,
    Object.fromEntries(
      rows.flatMap((row, i) =>
        [...row].map((key, j) => [LETTER_CODES[i][j], key]),
      ),
    ),
  ]),
);

export interface LabKeyEvent {
  code: string;
  key: string;
  at: number;
  repeat?: boolean;
  isComposing?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}
export interface LabKeyObservation {
  presses: number;
  repeats: number;
  releases: number;
  pressed: boolean;
  logicalKeys: string[];
}
export interface LabTransition {
  from: string;
  to: string;
  samplesMs: number[];
}
export interface LabState {
  keys: Record<string, LabKeyObservation>;
  mapping: Record<string, string>;
  transitions: Record<string, LabTransition>;
  previous: { key: string; at: number } | null;
  presses: number;
  repeats: number;
  compositionEvents: number;
  shortcutEvents: number;
  unidentifiedEvents: number;
}
export function createLabState(): LabState {
  return {
    keys: {},
    mapping: {},
    transitions: {},
    previous: null,
    presses: 0,
    repeats: 0,
    compositionEvents: 0,
    shortcutEvents: 0,
    unidentifiedEvents: 0,
  };
}
const isPrintable = (key: string) =>
  [...key].length === 1 && key.trim().length > 0;
const validCode = (code: string) =>
  /^[A-Za-z][A-Za-z0-9]{0,39}$/.test(code) &&
  code !== "Unidentified" &&
  !Object.hasOwn(Object.prototype, code);
/** Call only for keydown in the explicitly focused lab input. */
export function observeLabKeyDown(
  state: LabState,
  event: LabKeyEvent,
): LabState {
  if (!Number.isFinite(event.at) || event.at < 0) return state;
  const next: LabState = { ...state, previous: null };
  const code = validCode(event.code) ? event.code : null;
  const key = event.key.slice(0, 40);
  if (code && (state.keys[code] || Object.keys(state.keys).length < 128)) {
    const observed = state.keys[code] ?? {
      presses: 0,
      repeats: 0,
      releases: 0,
      pressed: false,
      logicalKeys: [],
    };
    next.keys = {
      ...state.keys,
      [code]: {
        ...observed,
        pressed: true,
        presses: observed.presses + (event.repeat ? 0 : 1),
        repeats: observed.repeats + (event.repeat ? 1 : 0),
        logicalKeys: observed.logicalKeys.includes(key)
          ? observed.logicalKeys
          : [...observed.logicalKeys.slice(-7), key],
      },
    };
  } else next.unidentifiedEvents++;
  if (event.repeat) {
    next.repeats++;
    return next;
  }
  next.presses++;
  if (event.isComposing || key === "Process" || key === "Dead") {
    next.compositionEvents++;
    return next;
  }
  if (event.ctrlKey || event.altKey || event.metaKey) {
    next.shortcutEvents++;
    return next;
  }
  if (!isPrintable(key)) return next;
  const normalized = key.toLocaleLowerCase();
  if (code && !event.shiftKey)
    next.mapping = { ...state.mapping, [code]: normalized };
  if (state.previous) {
    const duration = event.at - state.previous.at;
    if (duration > 0 && duration <= LAB_IDLE_LIMIT_MS) {
      const id = JSON.stringify([state.previous.key, normalized]);
      const pair = state.transitions[id] ?? {
        from: state.previous.key,
        to: normalized,
        samplesMs: [],
      };
      // Bound ephemeral data even for a long visit or synthetic input.
      if (
        state.transitions[id] ||
        Object.keys(state.transitions).length < 256
      ) {
        next.transitions = {
          ...state.transitions,
          [id]: {
            ...pair,
            samplesMs: [
              ...pair.samplesMs.slice(-(LAB_PAIR_SAMPLE_LIMIT - 1)),
              duration,
            ],
          },
        };
      }
    }
  }
  next.previous = { key: normalized, at: event.at };
  return next;
}
export function observeLabKeyUp(state: LabState, code: string): LabState {
  const observed = Object.hasOwn(state.keys, code)
    ? state.keys[code]
    : undefined;
  if (!observed) return state;
  return {
    ...state,
    keys: {
      ...state.keys,
      [code]: { ...observed, pressed: false, releases: observed.releases + 1 },
    },
  };
}
/** Blur/composition resets continuity. Missing keyup never implies a faulty key. */
export function releaseLabFocus(state: LabState): LabState {
  return {
    ...state,
    previous: null,
    keys: Object.fromEntries(
      Object.entries(state.keys).map(([code, key]) => [
        code,
        { ...key, pressed: false },
      ]),
    ),
  };
}
export function median(values: readonly number[]): number | null {
  const sorted = values
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function transitionSummary(
  state: LabState,
): (LabTransition & { medianMs: number; qualified: boolean })[] {
  return Object.values(state.transitions)
    .map((pair) => ({
      ...pair,
      medianMs: median(pair.samplesMs)!,
      qualified: pair.samplesMs.length >= 3,
    }))
    .sort(
      (a, b) =>
        b.samplesMs.length - a.samplesMs.length || b.medianMs - a.medianMs,
    );
}
export function buildTransitionDrill(from: string, to: string): string {
  if (!isPrintable(from) || !isPrintable(to)) return "";
  return [
    `${from}${to}`,
    `${from}${to}`,
    `${to}${from}`,
    `${from}${to}${from}`,
    `${from}${to}`,
    `${to}${from}`,
    `${from}${to}`,
  ].join(" ");
}
export function compareLabLayouts(mapping: Readonly<Record<string, string>>) {
  return Object.entries(REFERENCE_MAPS)
    .map(([layout, reference]) => {
      const comparable = Object.entries(mapping).filter(
        ([code, value]) =>
          Object.hasOwn(reference, code) && /^\p{L}$/u.test(value),
      );
      const mismatches = comparable
        .filter(([code, value]) => reference[code] !== value)
        .map(([code]) => code);
      return {
        layout,
        checked: comparable.length,
        matched: comparable.length - mismatches.length,
        mismatches,
      };
    })
    .sort(
      (a, b) =>
        b.matched - a.matched || a.mismatches.length - b.mismatches.length,
    );
}
export type BrowserLayoutResult =
  | { status: "available"; mapping: Record<string, string> }
  | {
      status: "unsupported" | "insecure" | "blocked" | "failed";
      message: string;
    };
export interface KeyboardMapNavigator {
  keyboard?: {
    getLayoutMap?: () => Promise<Iterable<readonly [string, string]>>;
  };
}
/** No permission probes or keyboard lock. Invoke only from an explicit user action. */
export async function readBrowserLayout(
  navigatorValue: KeyboardMapNavigator,
  secureContext: boolean,
): Promise<BrowserLayoutResult> {
  if (!secureContext)
    return {
      status: "insecure",
      message:
        "Browser mapping needs HTTPS or a trusted localhost page. The manual check still works.",
    };
  try {
    const keyboard = navigatorValue.keyboard;
    if (typeof keyboard?.getLayoutMap !== "function")
      return {
        status: "unsupported",
        message:
          "This browser does not expose a layout map. Use the focused check below.",
      };
    const layout = await keyboard.getLayoutMap();
    const mapping = Object.fromEntries(
      [...layout]
        .filter(
          ([code, key]) =>
            validCode(code) && typeof key === "string" && key.length <= 40,
        )
        .slice(0, 256),
    );
    return { status: "available", mapping };
  } catch (cause) {
    const name =
      cause && typeof cause === "object" && "name" in cause
        ? String(cause.name)
        : "";
    return name === "SecurityError" || name === "NotAllowedError"
      ? {
          status: "blocked",
          message:
            "The browser or site policy blocked layout access. You can continue with the manual check.",
        }
      : {
          status: "failed",
          message:
            "The browser could not read its layout map. You can continue with the manual check.",
        };
  }
}
