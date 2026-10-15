# Visible wrong-key feedback — 16 October 2026

Normal practice now shows the character actually entered and moves forward when it is wrong. The expected character appears as a small cue underneath. Learn defaults to allowing errors and Backspace corrections. Stop-on-error remains an explicit choice and displays the rejected character instead of silently ignoring it.

For target `cat dog`, entering `cx` shows a red, underlined `x`, an `a` cue and **You typed x · Expected a**. The cursor advances to `t`. Backspace removes `x`; the original incorrect insertion still lowers input accuracy. With explicit stop-on-error, `x` appears in the feedback strip while the cursor waits at `a`.

## Repairs

- Test/Race and Learn previously drew the expected letter at incorrect positions, obscuring the actual input. Both now use the shared `TypingCharacter` renderer.
- Test emitted `char-incorrect`, but the stylesheet only included `char-error`. The missing error selector is now present.
- `TypingFeedback` uses a copied, read-only view of the canonical controller's most recent input attempts. It does not replay the session or independently recalculate correctness. Target extensions cannot reinterpret old feedback.
- A premature Space can align to a correct final separator after skipping letters. Feedback still shows the actual incorrect Space attempt and its original expected letter.
- Invisible wrong Space, Tab and Enter units receive visible names/glyphs. Code retains the target's line boundaries.
- Learn commits each observed input batch atomically. Mixed batches retain rejected mistakes even when their last character is correct; per-unit attempts and timing attribution stay canonical.
- Error announcements include the incorrect-attempt total so repeated identical wrong input changes the live-region text. Correct typing is not announced on every keystroke. Actual screen-reader acceptance remains a separate check.
- Deletion clears recent-input feedback; restart and owner-workspace changes discard the previous controller's feedback.

The result schema, metrics version and formulas are unchanged. No migration or backend deployment is required for this presentation update. Existing results are preserved. The new default changes which error policy a fresh Learn session selects; its configuration and comparison key still record that policy.

## Verification

Evidence is under `audit/wrong-key-feedback-2026-10-16/`:

- **448 unit tests in 28 files passed**, including 17 new focused checks for canonical feedback, mixed batches, replacement, deletion, composition, immutable copies and target chronology.
- App/tooling, strict domain and portable TypeScript checks passed. ESLint passed with zero errors and the nine existing Fast Refresh warnings. Production build and gzip budgets passed.
- The broader Chromium checkpoint passed **58 cases with two cloud skips** before the final small atomic-batch/announcement adjustment.
- Final source passed **30 focused browser checks: ten each in Chromium, Firefox and WebKit**, with zero failures or skips, recorded in `feedback-final.json`. This includes accepted and rejected errors, correction accounting, mixed batches, premature spaces, word overtyping, code whitespace, normalized composition, mobile fit and restart. Exact per-engine counts and exit status are in [verification-summary.json](../audit/wrong-key-feedback-2026-10-16/verification-summary.json).

The actual inspected practice screenshot is [practice-chromium.png](../audit/wrong-key-feedback-2026-10-16/practice-chromium.png). Synthetic committed/composition events establish adapter behavior; they do not certify every native OS IME. Earlier broader WebKit/runtime release gates in the implementation ledger remain separate from this focused regression result.
