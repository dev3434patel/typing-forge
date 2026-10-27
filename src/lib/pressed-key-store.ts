import type { KeyboardInputState } from "./live-keyboard";

/** One guide's physical keys. Subscribers observe only their own boolean; no
 * typing text, timing, preferences or global listeners belong to this store. */
export class PressedKeyStore {
  private pressed = new Set<string>();
  private listeners = new Map<string, Set<() => void>>();

  constructor(codes: readonly string[] = []) {
    this.pressed = new Set(codes);
  }

  getSnapshot(code: string): boolean {
    return this.pressed.has(code);
  }

  subscribe(code: string, listener: () => void): () => void {
    const listeners = this.listeners.get(code) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(code, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && this.listeners.get(code) === listeners)
        this.listeners.delete(code);
    };
  }

  replace(codes: readonly string[]): void {
    const next = new Set(codes);
    const changed = [
      ...[...this.pressed].filter((code) => !next.has(code)),
      ...[...next].filter((code) => !this.pressed.has(code)),
    ];
    if (changed.length === 0) return;
    // Publish the complete chord before any key subscriber reads its snapshot.
    this.pressed = next;
    for (const code of changed)
      for (const listener of [...(this.listeners.get(code) ?? [])]) listener();
  }

  clear(): void {
    this.replace([]);
  }
}

/** Only Shift changes the full keyboard's labels. Other held keys go directly
 * to their leaf subscribers while semantic input state retains its identity. */
export function keyboardSemanticInput(
  previous: KeyboardInputState,
  next: KeyboardInputState,
): KeyboardInputState {
  const shifts = next.pressedCodes.filter(
    (code) => code === "ShiftLeft" || code === "ShiftRight",
  );
  if (
    previous.focused === next.focused &&
    previous.composing === next.composing &&
    previous.deadKey === next.deadKey &&
    previous.capsLock === next.capsLock &&
    previous.pressedCodes.length === shifts.length &&
    previous.pressedCodes.every((code, index) => code === shifts[index])
  ) return previous;
  return { ...next, pressedCodes: shifts };
}
