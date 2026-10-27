# TypingArea caret cache: implementation and verification scope

The final7 typing CPU profile identified repeated synchronous native caret geometry reads as a hot path. This change batches one current word's actual native glyph boxes and reuses those boxes across color-only correct-prefix updates. It does not change input capture, canonical events, timing, accuracy/WPM formulas, text rendering or opening-animation quality.

## Owned production scope

- `src/components/typing/TypingArea.tsx`: integrates the cache, keeps the existing native fallback, observes geometry changes, and avoids reading `scrollTop` on cache hits.
- `src/components/typing/typing-caret-cache.ts`: bounded one-word policy and native-anchor storage.
- `src/components/typing/typing-caret-cache.test.ts`: focused policy, geometry and invalidation regressions.

The existing `typingCaretAnchor` and `typingCaretGeometry` functions remain unchanged. The separate adaptive lesson caret work is owned by the coordinator.

## Geometry contract

Cache at most 64 actual character boxes for the current `[data-typing-word]` element. Each DOM `data-slot-index` and `data-expected` must match the corresponding target character; DOM ordinal positions are never substituted for canonical indexes. Boxes come from each character's first native `getClientRects()` fragment, with the same fractional coordinates and nominal font height as the existing fallback. A word that wraps internally retains each character's measured row. No fixed glyph advance is assumed, including for proportional fonts.

Store style-neutral `TypingCaretAnchor` values in viewport-content coordinates, plus a real computed line height. Existing line, block, outline and underline transformations are applied afterward. This avoids a second underline offset and avoids treating scrolled screen coordinates as stable content coordinates.

Reuse is restricted to LTR prose with a printable-ASCII target, an exact correct input prefix and a matching cursor. Between reads, only an unchanged state or a single correct suffix insertion can reuse a captured box. Whitespace, the end anchor, words over 64 characters, free writing, code, RTL, complex Unicode, composition and non-prefix edits use direct native geometry. Errors/extras/missed-text layouts fail the exact-prefix policy. A Backspace, replacement, reopened word or target change discards the previous word capture; a subsequently safe layout may be captured afresh.

## Invalidation and scrolling

Focus, paused/running status and accessible-editor reveal changes invalidate the word capture. ResizeObserver observes the text and its viewport. Window/visual-viewport resize and relevant ancestor/viewport scroll invalidate cached geometry. FontFaceSet loading completion/error and a root-only MutationObserver of `documentElement` class/style cover font fallback resolution, theme and asynchronous imported-font family changes even when a whole text block retains the same dimensions. The observer does not watch the typing subtree or per-character/caret styles.

Cache hits do not call `getClientRects`, `getBoundingClientRect`, `getComputedStyle` or a scrolling getter. The last requested caret scroll position is tracked; the component writes `scrollTop` only when that desired row changes, and clears the tracked value on external geometry/scroll invalidation. Native fallback retains the existing active-line centering rule.

## Focused verification

The cache and existing native caret geometry suites pass 42/42 tests across two files, including 35 new cache cases. Checks cover proportional/wrapped glyphs, retained fractional content coordinates after page/viewport scrolling, style-neutral anchors, one native capture across successive correct characters, Backspace/replacement/error recovery, target/font/IME/RTL/code/free invalidation, Unicode fallback, whitespace/end fallback, malformed/missing/reordered DOM indexes, hidden/non-finite boxes, line-height validity and the one-word size bound.

Scoped ESLint passes. The first application TypeScript attempt reported only the coordinator's concurrent Keybr CSS visibility type, which was corrected separately; the final application check is recorded by the coordinator's final gates.

## Still to verify on the new artifact

Browser caret assertions must exercise real wrapped words, correction/reopening, all caret styles, resizing/rotation, composition, RTL/code/free fallback, focus/toolbar return and font changes. Performance must be remeasured on the new build with the same declared protocols. Unit success does not establish a latency, FPS, physical-device or field-INP pass. The preserved final7 static mobile run measured Learn typing-event p98 at 128 ms, so it remains a failed performance target until a later artifact is actually measured.
