# MVP+ Prompt: Super-Accuracy Typing Forge

You are working in the Typing Forge / Typing Master codebase.
The MVP is implemented and passing tests (IMPLEMENTATION_STATUS.md), but we now require **MVP+ level**: per-keystroke correctness, zero UI drift, and React-safe state updates.

## Global Requirements

### Canonical Metrics Pipeline

All final metrics (WPM, raw WPM, accuracy, consistency, error counts, backspace usage, per-char stats) must be computed from the keystroke log by `lib/metrics-engine.ts` and `lib/professional-accuracy.ts`.

**No page/component may re-implement formulas independently** (including Race, TypingArea, Keybr, Stats, Profile, Leaderboard).

Live UI metrics (TypingArea, race UI, Keybr lessons) may compute incremental values, but:
- They must follow the same formulas as `metrics-engine` (with comments referencing the canonical functions).
- A dedicated test file `metrics-consistency.test.ts` must ensure live vs final metrics match within tight tolerance (< 1% WPM, < 0.5% accuracy).

### Per-Keystroke Fidelity

Every keystroke is logged with: expected char, typed char, timestamp, cursor index, is_backspace, and is_correct, as in the `KeystrokeRecord` interface.

The keystroke log is the single source for:
- Session metrics
- Professional accuracy report
- WPM history and consistency
- Keybr per-character statistics

**Add tests that construct fixed synthetic keystroke logs and assert the exact metrics returned by:**
- `metrics-engine.computeSessionMetrics`
- `professional-accuracy.generateProfessionalAccuracyReport`
- `keybr-engine.calculatePerCharMetrics`

### React-Safe State Updates

Fix any warnings like:
> "Cannot update a component (TestSettings) while rendering a different component (TypingArea)."

**Rules:**
- No component may call any setter (Zustand store, useState, or context) during render that causes another mounted component to update.
- All such updates must occur in event handlers or `useEffect` hooks.
- Inspect `TypingArea.tsx`, `TestSettings.tsx`, and `Index.tsx` for any state updates inside render and refactor them into `useEffect` or callbacks passed from parents.

### Cross-Page Numeric Consistency

For a given session, the values displayed on:
- Results screen (`ProfessionalResultsScreen`),
- `/stats` page (summary cards and charts),
- `/profile` (overview + history),
- `/leaderboard` (best/avg stats),

must all be derived from the same stored numbers and must not contradict each other.

**Strengthen E2E tests** (`typing-test.spec.ts`, `stats-dashboard.spec.ts`, `profile-flow.spec.ts`, `leaderboard.spec.ts`) to:
- Run a controlled test.
- Capture WPM, accuracy, consistency from the results screen.
- Assert those same numbers appear (or are within strict tolerance) on Stats, Profile, and Leaderboard.

### Key-to-Key Learning Precision

`keybr-engine` must:
- Respect unlock criteria of ≥35 WPM and ≥95% accuracy per character with precise threshold tests (e.g., 34.9 WPM or 94.9% must not unlock; 35.0 WPM and 95.0% must unlock).
- Use weighted confidence updates: exactly 70% new, 30% old, with tests checking this numerically.
- Generate lessons where ~70% of words focus on weak letters, with tests that validate distribution over many lessons.

### Race & Bot Accuracy Guarantees

`Race.tsx` must use `metrics-engine` functions for any race metrics (no inline formulas).

`race-state-machine` tests must confirm:
- Progress is always 0–100, WPM 0–500, accuracy 0–100, and races never end outside these bounds.
- Winner selection respects the exact priority: progress → WPM → finish time.

`bot-engine` tests must confirm:
- Average WPM per difficulty is close to configured mean (within a defined tolerance).
- Mistake and correction rates approximate configured probabilities.
- Bots never exceed enforced metric bounds.

### Edge-Case and Determinism Tests

Extend tests for:
- 0 characters typed.
- Very short (<2s) and very long (~30-minute equivalent) sessions.
- Only mistakes (accuracy near 0%).
- Heavy backspace usage, confirming accuracy cap at 99.99% and correct backspace count.

Ensure every metrics function is deterministic: running twice on the same log returns identical output.

### Documentation Sync

After each change, update `IMPLEMENTATION_STATUS.md` and the "Typing Experience Quality Checklist" to reflect new guarantees (e.g., "React render path has no cross-component state updates; all metric displays are backed by canonical calculations and tested cross-page").

## Work Style

Work file-by-file, starting with: `TypingArea.tsx`, `TestSettings.tsx`, `Index.tsx`, `Race.tsx`, `metrics-engine.ts`, `professional-accuracy.ts`, `keybr-engine.ts`.

For each change:
1. Show the patch.
2. Explain briefly how it:
   - Removes render-time state updates, or
   - Routes metrics through the canonical pipeline, or
   - Tightens per-keystroke/edge-case correctness.

**Do not change API shapes defined in the original MVP; only improve correctness, safety, and tests.**

## Verification Checklist

After implementing changes, verify:
- [ ] No React warnings about updating components during render
- [ ] All metrics calculations reference canonical functions in comments
- [ ] Live metrics match final metrics within tolerance (tested)
- [ ] Cross-page consistency tests pass with strict numeric assertions
- [ ] All edge cases have deterministic tests
- [ ] Keybr unlock thresholds are precisely tested
- [ ] Race mode never exceeds bounds (tested)
- [ ] Bot behavior matches configs (tested)
- [ ] `IMPLEMENTATION_STATUS.md` updated with new guarantees
