# Sustained typing CPU diagnosis

Date: 17 October 2026, Asia/Kolkata. Frozen build: `ddb953eb3a7408f509f9`.

This is diagnostic evidence, not a typing score or acceptance benchmark. A 1,239-character private custom target received an explicitly assisted 800-character atomic prefill, followed by 150 real native sequential input characters at 4× CPU throttling. The final 950-character prefix matched exactly, with no page errors. The real character driver took 12,748.2 ms while CPU sampling and timeline tracing were enabled; those instruments add overhead. No WPM claim is derived from this run.

The owned Chromium 156.0.8078.4 browser closed in the script's `finally` block. No application source changed during profiling.

## Retained evidence

- `profile-typing.mjs`: reproducible bounded diagnostic; checks the served build identity and has a 90-second watchdog.
- `typing-cpu-profile.cpuprofile`: raw CDP CPU profile.
- `typing-timeline-trace.json`: raw CDP timeline trace.
- `typing-profile-summary.json`: self/inclusive sampled call frames, exact served minified source locations/snippets, and timeline event aggregates.
- `typing-sustained.json`: separate full real-input acceptance benchmark. That run still failed the desired performance goal; the diagnostic prefill does not replace it.

## Findings

| Evidence | Observation | Source correspondence |
| --- | --- | --- |
| CPU profile | `getBoundingClientRect` sampled self time 1,761.6 ms, directly below the typing caret measurement callback. That callback has 1,847.6 ms inclusive time. | `src/components/typing/TypingArea.tsx`, `measureCaret`, lines 161–167 in the profiled source; served `TypingArea-ToMYRiyU.js:1:4742`. |
| Timeline | 300 Layout events total 2,034.9 ms, maximum 22.3 ms. This is a ratio of two events per real character. The events identify the document root and 4,364 total layout objects; individual events lack JS stack attribution. | The CPU call chain proves costly synchronous measurement, but this trace alone cannot assign every Layout event to React rather than native textarea editing. |
| Timeline | 526 Paint events total 2,880.3 ms; 324 PrePaint events total 1,263.5 ms. | Native rendering is substantial alongside JavaScript. These event aggregates can overlap other categories and must not be added together as disjoint wall time. |
| CPU profile, aggregate across identical source frames | Grapheme segmentation has 176.7 ms self / 181.1 ms inclusive sampled time, approximately 1.4% of the 13,201.0 ms sampled span. | `src/lib/typing-core/transcript.ts`, `graphemes`; served `useTestResults-nQgC-HKp.js:1:384`. Full retained text is segmented for the old and new value at input commit. |
| CPU profile | React synchronous rendering has approximately 2,794 ms inclusive time in its main render loop. Router URL creation and Link rendering occur during the input segment: approximately 269.2 ms and 267.9 ms inclusive respectively. | `src/components/typing/TypingArea.tsx` calls `onStatusChange` on every input/tick. `src/pages/Index.tsx` unconditionally publishes a new Zustand state object, while subscribing to the entire store. This triggers unrelated page shell work even when status remains `running`. |
| CPU profile | The semantic chunk model has approximately 539.4 ms inclusive sampled time, including callbacks/grouping. | `src/components/typing/typing-passage-model.ts`; served `TypingFeedback-D7bADFl_.js:6:1997`. Chunking prevents unchanged glyph reconciliation but still performs a full linear comparison. |

The sampled `(program)` frame accounts for 7,232.9 ms; it does not identify one JavaScript source function and must not be attributed entirely to ICU, React, layout, or idle time without additional evidence.

## Recommended sequence

1. Publish session status only when it changes, avoiding full page and navigation rerenders for every keystroke and timer snapshot. Preserve the existing score clock and input evidence.
2. Add the mathematically equivalent printable-ASCII segmentation fast path for common Latin input, with Unicode/CRLF/combining/IME regressions. This is bounded additional headroom, not the dominant diagnosis.
3. Test layout/paint containment around the existing fixed-height clipped typing viewport. Verify real caret geometry, scrolling, resize/rotation, wrong glyphs, long words, code and opponent markers before retaining it.
4. Repeat the full 1,239-character native-input benchmark at the same 4× CPU setting. If synchronous measurement remains dominant, profile a carefully invalidated visible-line geometry cache before attempting more rendering changes.

No result here establishes field INP, native mobile performance, or a universal no-drop speed threshold. The full typing benchmark remains the acceptance evidence.
