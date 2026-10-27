import type { TypingCaretAnchor } from "./typing-caret-geometry";

export interface CaretLayoutState {
  readonly targetText: string;
  readonly finalText: string;
  readonly cursor: number;
  readonly fontSize: number;
  readonly fontKey: string;
  readonly scoringPolicy: string;
  readonly rtl: boolean;
  readonly composing: boolean;
}

export interface MeasuredCaretWordSlot {
  readonly index: number;
  readonly expected: string;
  readonly anchor: TypingCaretAnchor;
}

export interface CachedCaretMeasurement {
  readonly anchor: TypingCaretAnchor;
  readonly lineHeight: number;
}

const MAX_CACHED_WORD = 64;
export const MAX_CACHED_FORWARD_GLYPHS = 128;

/** This is an optimization boundary, not text segmentation for the engine.
 * Whitespace, long words and complex text keep the native measurement path.
 */
export function caretCacheWordRange(target: string, cursor: number) {
  if (!Number.isInteger(cursor) || cursor < 0 || !/^[!-~]$/.test(target[cursor] ?? ""))
    return null;
  const start = target.lastIndexOf(" ", cursor - 1) + 1;
  const separator = target.indexOf(" ", cursor);
  const end = separator < 0 ? target.length : separator;
  return end - start <= MAX_CACHED_WORD ? { start, end } : null;
}

/** Bounded real native glyph boxes, never an estimated advance.
 * Color-only correct-prefix updates leave those boxes unchanged. Everything
 * else is measured again. Coordinates include viewport scroll, so scrolling
 * does not turn cached anchors into stale screen coordinates.
 */
export class TypingCaretWordCache {
  private previous?: CaretLayoutState;
  private target?: string;
  private printableTarget = false;
  private entries?: Map<number, CachedCaretMeasurement>;

  invalidate(): void {
    this.previous = undefined;
    this.entries = undefined;
  }

  private eligible(state: CaretLayoutState): boolean {
    if (this.target !== state.targetText) {
      this.target = state.targetText;
      this.printableTarget = /^[\x20-\x7e]+$/.test(state.targetText);
    }
    return this.printableTarget && state.scoringPolicy === "prose" &&
      !state.rtl && !state.composing && Number.isFinite(state.fontSize) && state.fontSize > 0 &&
      Number.isInteger(state.cursor) && state.cursor >= 0 && state.cursor < state.targetText.length &&
      state.cursor === state.finalText.length && state.targetText.startsWith(state.finalText);
  }

  canCache(state: CaretLayoutState): boolean {
    return this.eligible(state) && caretCacheWordRange(state.targetText, state.cursor) !== null;
  }

  read(state: CaretLayoutState): CachedCaretMeasurement | null {
    const previous = this.previous;
    const sameGeometry = previous && previous.targetText === state.targetText &&
      previous.fontSize === state.fontSize && previous.fontKey === state.fontKey &&
      previous.scoringPolicy === state.scoringPolicy && previous.rtl === state.rtl &&
      previous.composing === state.composing;
    const unchangedOrCorrectInsertion = previous && (
      (state.finalText === previous.finalText && state.cursor === previous.cursor) ||
      (state.finalText.length === previous.finalText.length + 1 &&
        state.finalText.startsWith(previous.finalText))
    );
    if (!sameGeometry || !unchangedOrCorrectInsertion || !this.eligible(state) ||
      (state.targetText[state.cursor] !== " " && caretCacheWordRange(state.targetText, state.cursor) === null))
      this.entries = undefined;
    this.previous = { ...state };
    return this.entries?.get(state.cursor) ?? null;
  }

  store(
    state: CaretLayoutState,
    slots: readonly MeasuredCaretWordSlot[],
    lineHeight: number,
  ): boolean {
    this.entries = undefined;
    if (!this.canCache(state) || !Number.isFinite(lineHeight) || lineHeight <= 0)
      return false;
    const range = caretCacheWordRange(state.targetText, state.cursor)!;
    if (slots.length !== range.end - range.start) return false;
    const entries = new Map<number, CachedCaretMeasurement>();
    for (let offset = 0; offset < slots.length; offset++) {
      const slot = slots[offset], anchor = slot.anchor;
      if (slot.index !== range.start + offset || slot.expected !== state.targetText[slot.index] ||
        !anchor || anchor.rtl || ![anchor.leading, anchor.top, anchor.width, anchor.height].every(Number.isFinite) ||
        anchor.width <= 0 || anchor.height <= 0)
        return false;
      entries.set(slot.index, { anchor: { ...anchor }, lineHeight });
    }
    this.previous = { ...state };
    this.entries = entries;
    return true;
  }

  /** A contiguous measured window may include real whitespace boxes and wraps.
   * Invalid/incomplete identities fail atomically; missing positions are never
   * reconstructed from neighbours, glyph widths or a preceding line. */
  storeForward(
    state: CaretLayoutState,
    slots: readonly MeasuredCaretWordSlot[],
    lineHeight: number,
  ): boolean {
    this.entries = undefined;
    if (!this.eligible(state) || !slots.length || slots.length > MAX_CACHED_FORWARD_GLYPHS ||
      !Number.isFinite(lineHeight) || lineHeight <= 0)
      return false;
    const entries = new Map<number, CachedCaretMeasurement>();
    for (let offset = 0; offset < slots.length; offset++) {
      const slot = slots[offset], index = state.cursor + offset, anchor = slot.anchor;
      if (slot.index !== index || index >= state.targetText.length || slot.expected !== state.targetText[index] ||
        (slot.expected !== " " && caretCacheWordRange(state.targetText, index) === null) ||
        !anchor || anchor.rtl || ![anchor.leading, anchor.top, anchor.width, anchor.height].every(Number.isFinite) ||
        anchor.width <= 0 || anchor.height <= 0)
        return false;
      entries.set(index, { anchor: { ...anchor }, lineHeight });
    }
    this.previous = { ...state };
    this.entries = entries;
    return true;
  }
}
