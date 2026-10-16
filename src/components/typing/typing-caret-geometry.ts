type CaretStyle = "line" | "block" | "outline" | "underline";
type FragmentRect = Readonly<{
  left: number;
  right: number;
  top: number;
  width: number;
  height: number;
}>;

export interface TypingCaretAnchor {
  readonly leading: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly rtl: boolean;
}

/** A character's first native fragment represents the insertion line, including
 * a zero-width newline. Union bounds can span both sides of a line break.
 */
export function typingCaretAnchor(
  fragment: FragmentRect,
  viewport: Readonly<{ left: number; top: number }>,
  options: Readonly<{
    fontSize: number;
    scrollLeft: number;
    scrollTop: number;
    rtl: boolean;
  }>,
): TypingCaretAnchor | null {
  if (
    ![
      fragment.left,
      fragment.right,
      fragment.top,
      fragment.width,
      fragment.height,
      viewport.left,
      viewport.top,
      options.fontSize,
      options.scrollLeft,
      options.scrollTop,
    ].every(Number.isFinite) ||
    options.fontSize <= 0 ||
    fragment.width < 0 ||
    fragment.height <= 0
  ) {
    return null;
  }
  return {
    leading:
      (options.rtl ? fragment.right : fragment.left) -
      viewport.left + options.scrollLeft,
    top: fragment.top - viewport.top + options.scrollTop,
    width: Math.max(fragment.width || options.fontSize * 0.6, 4),
    height: Math.max(fragment.height, options.fontSize),
    rtl: options.rtl,
  };
}

/** All styles share one measured font box; underline offset is applied once. */
export function typingCaretGeometry(anchor: TypingCaretAnchor, style: CaretStyle) {
  const width = style === "line" ? 2 : anchor.width;
  return {
    left: anchor.leading - (anchor.rtl ? width : 0),
    top: anchor.top + (style === "underline" ? anchor.height - 2 : 0),
    width,
    height: style === "underline" ? 2 : anchor.height,
  };
}
