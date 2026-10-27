interface LearningRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LearningCaretContentBox {
  readonly leading: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly rtl: false;
}

/** Preserve Learn's actual union bounds in content coordinates. Do not use the
 * test caret's glyph clamps: a narrow Learn glyph keeps its original width. */
export function learningCaretContentBox({ boundary, marker, scrollLeft, scrollTop }: {
  boundary: Pick<LearningRect, "left" | "top">;
  marker: LearningRect;
  scrollLeft: number;
  scrollTop: number;
}): LearningCaretContentBox | null {
  if (![boundary.left, boundary.top, marker.left, marker.top, marker.width, marker.height, scrollLeft, scrollTop].every(Number.isFinite) ||
    marker.width <= 0 || marker.height <= 0) return null;
  return { leading: marker.left - boundary.left + scrollLeft, top: marker.top - boundary.top + scrollTop,
    width: marker.width, height: marker.height, rtl: false };
}

/** Apply the unchanged Learn style/row calculation to a measured neutral box. */
export function learningCaretGeometryFromContentBox(box: Pick<LearningCaretContentBox, "leading" | "top" | "width" | "height">, options: {
  fontSize: number;
  style: "line" | "block" | "underline" | "outline";
  direction: "ltr" | "rtl";
}) {
  return learningCaretGeometry({ boundary: { left: 0, top: 0 },
    marker: { left: box.leading, top: box.top, width: box.width, height: box.height },
    scrollLeft: 0, scrollTop: 0, ...options });
}

/** Content coordinates stay invariant when the clipped lesson stage scrolls. */
export function learningCaretGeometry({
  boundary,
  marker,
  scrollLeft,
  scrollTop,
  fontSize,
  style,
  direction,
}: {
  boundary: Pick<LearningRect, "left" | "top">;
  marker: LearningRect;
  scrollLeft: number;
  scrollTop: number;
  fontSize: number;
  style: "line" | "block" | "underline" | "outline";
  direction: "ltr" | "rtl";
}) {
  if (
    ![
      boundary.left,
      boundary.top,
      marker.left,
      marker.top,
      marker.width,
      marker.height,
      scrollLeft,
      scrollTop,
      fontSize,
    ].every(Number.isFinite) ||
    fontSize <= 0 || marker.width < 0 || marker.height <= 0
  ) return null;
  const width = Math.max(marker.width, 2);
  const x = marker.left - boundary.left + scrollLeft;
  const y = marker.top - boundary.top + scrollTop;
  const lineHeight = fontSize * 1.85;
  return {
    x: x + (style === "line" && direction === "rtl" ? width : 0),
    y: y + (style === "underline" ? marker.height - 2 : 0),
    width: style === "line" ? 2 : width,
    height: style === "underline" ? 2 : marker.height,
    scrollTop: Math.max(0, Math.floor((y + 1) / lineHeight) * lineHeight - lineHeight),
  };
}
