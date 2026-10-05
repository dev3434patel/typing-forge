> Canonical policy: [ACCURACY_SEMANTICS.md](ACCURACY_SEMANTICS.md). Headline accuracy is keystroke-based (correctKeystrokes / totalKeystrokes). There is no 99.99 cap. The notes below are historical and do not override that policy.

# Live vs Final Accuracy Discrepancy - Manual Testing Guide

## Goal
Reproduce and measure discrepancy between live HUD accuracy during typing and final results accuracy after test completion.

## Preconditions
- Dev server running at http://localhost:8080 (or 8081)
- Browser with dev tools console open (F12) to capture any `[ACCURACY MISMATCH]` or `[ACCURACY DIAGNOSTIC]` logs

## Test Procedure

### Run 1: Error-Heavy Pattern (~80% wrong chars)

1. **Open** http://localhost:8080/ (or 8081)

2. **Configure**
   - Mode: **time**
   - Duration: **30s** (click the "30" button)
   - If already selected, leave as is

3. **Start**
   - Press **Enter** to reveal paragraph
   - Click in typing area or start typing
   - Timer begins on first keystroke

4. **Type with deliberate errors for ~10-15 seconds**
   - Strategy: For most characters, type `x` instead of the correct char
   - Mix in ~20% correct chars (especially spaces when target has space)
   - Example: target "the quick brown" → type "xhe xxxxc xrown" (mostly wrong)
   - Type steadily for 10-15 seconds

5. **While typing: capture LIVE ACCURACY**
   - Location: Top-center HUD, between timer and WPM
   - Format: Large number (e.g., `67%`) with "accuracy" label below
   - Record the value you see at ~8-10 seconds: **_______%**

6. **Let test end**
   - Wait for 30-second timer to reach 0 (or keep typing until it ends)
   - Results screen appears automatically

7. **Capture FINAL ACCURACY**
   - Main stat card labeled "Accuracy"
   - Also note: correct/incorrect/missed/extra if shown in detailed breakdown
   - Record: **_______%**
   - Key counts: correct **___** / incorrect **___** / extra **___** / missed **___**

8. **Calculate discrepancy**
   - Discrepancy = |live - final| = **_______%**
   - Significant if > 5%

### Run 2: Alternating Pattern (50% wrong)

1. **Restart**: Tab or "restart" button to get new test
2. **Same config**: time, 30s
3. **Type** for ~10-15 seconds with alternating correct/wrong:
   - Every 2nd character wrong (type `z` instead)
   - Correct char, wrong char, correct, wrong, ...
4. Capture live accuracy at ~8s: **_______%**
5. Let test end, capture final: **_______%**
6. Discrepancy: **_______%**

## Report Template

| Run | Live Accuracy (during typing) | Final Accuracy | Discrepancy | Significant (>5%)? |
|-----|-------------------------------|----------------|-------------|---------------------|
| 1   |                               |                |             |                     |
| 2   |                               |                |             |                     |

**UI clues observed:**
- Extra chars displayed? Y/N
- Totals that seemed inconsistent?

**Console logs:**
- Any `[ACCURACY MISMATCH]` messages?
- Any `[ACCURACY DIAGNOSTIC]` output?

## Expected Behavior (from code)

Both live and final use:
- Same `typedText` vs `targetText`
- Same `canonicalCalculateAccuracy` from `metrics-engine`
- Same character-by-character comparison
- For time mode: `missedChars = 0` (untyped remainder not counted)

A discrepancy > 1% triggers a console error. Index.tsx has a fallback: if report differs from stats by >5%, it overrides to use stats (what user saw).

## Automated Test

Run the Playwright test (requires dev server + `npx playwright install chromium`):
```bash
npx playwright test e2e/accuracy-discrepancy-standalone.spec.ts -c playwright-standalone.config.ts
```
