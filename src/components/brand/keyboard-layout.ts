/** ANSI 60% keyboard: 61 physical keys, five rows, fifteen key units wide. */
export interface KeyboardKey {
  id: string;
  label: string;
  key: string;
  /** Center in key units; multiply by KEYBOARD_PITCH for world coordinates. */
  x: number;
  z: number;
  width: number;
}

export const KEYBOARD_PITCH = 0.37;

type KeyDefinition = readonly [
  id: string,
  label: string,
  width?: number,
  key?: string,
];
const rows: readonly (readonly KeyDefinition[])[] = [
  [
    ["Escape", "Esc"],
    ["Digit1", "1"],
    ["Digit2", "2"],
    ["Digit3", "3"],
    ["Digit4", "4"],
    ["Digit5", "5"],
    ["Digit6", "6"],
    ["Digit7", "7"],
    ["Digit8", "8"],
    ["Digit9", "9"],
    ["Digit0", "0"],
    ["Minus", "-"],
    ["Equal", "="],
    ["Backspace", "Back", 2],
  ],
  [
    ["Tab", "Tab", 1.5],
    ...[..."QWERTYUIOP"].map((key): KeyDefinition => [`Key${key}`, key]),
    ["BracketLeft", "["],
    ["BracketRight", "]"],
    ["Backslash", "\\", 1.5],
  ],
  [
    ["CapsLock", "Caps", 1.75],
    ...[..."ASDFGHJKL"].map((key): KeyDefinition => [`Key${key}`, key]),
    ["Semicolon", ";"],
    ["Quote", "'"],
    ["Enter", "Enter", 2.25],
  ],
  [
    ["ShiftLeft", "Shift", 2.25],
    ...[..."ZXCVBNM"].map((key): KeyDefinition => [`Key${key}`, key]),
    ["Comma", ","],
    ["Period", "."],
    ["Slash", "/"],
    ["ShiftRight", "Shift", 2.75],
  ],
  [
    ["ControlLeft", "Ctrl", 1.25],
    ["MetaLeft", "Win", 1.25],
    ["AltLeft", "Alt", 1.25],
    ["Space", "Space", 6.25, " "],
    ["AltRight", "Alt", 1.25],
    ["Fn", "Fn", 1.25],
    ["ContextMenu", "Menu", 1.25],
    ["ControlRight", "Ctrl", 1.25],
  ],
];

export const KEYBOARD_KEYS: readonly KeyboardKey[] = rows.flatMap(
  (row, rowIndex) => {
    let offset = -7.5;
    return row.map(([id, label, width = 1, key = label]) => {
      const center = offset + width / 2;
      offset += width;
      return { id, label, key, x: center, z: rowIndex - 2, width };
    });
  },
);

export const KEYBOARD_BOUNDS = {
  left: -7.5,
  right: 7.5,
  top: -2.5,
  bottom: 2.5,
} as const;
