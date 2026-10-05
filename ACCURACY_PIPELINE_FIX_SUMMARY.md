> Canonical policy: [ACCURACY_SEMANTICS.md](ACCURACY_SEMANTICS.md). Headline accuracy is keystroke-based (correctKeystrokes / totalKeystrokes). There is no 99.99 cap. The notes below are historical and do not override that policy.

# Accuracy Pipeline Fix Summary

## Issues Found and Fixed

### Issue 1: `professional-accuracy.ts` Used Wrong Formula
**Problem**: The accuracy calculation in `generateProfessionalAccuracyReport` was using:
```typescript
typedAccuracy = (correctChars / totalTypedChars) * 100
```

**Canonical Formula** (from MVP spec):
```typescript
accuracy = (correctChars / totalDenominator) * 100
where totalDenominator = correctChars + incorrectChars + missedChars + extraChars
```

**Fix**: Updated `professional-accuracy.ts` lines 271-299 to use the canonical denominator formula, matching `metrics-engine.calculateAccuracy()` exactly.

### Issue 2: Time-Based Tests Counted Untyped Remainder as Missed
**Problem**: `computeSessionMetrics` in `metrics-engine.ts` was counting untyped remainder text as `missedChars` for ALL tests, including time-based tests.

**MVP Spec Rule**: "For time‑based tests, untyped remainder text is not counted as missed characters. Only what was actually typed is analyzed."

**Fix**: 
1. Added `isTimeBasedTest` parameter to `computeSessionMetrics()` (defaults to `false` for backward compatibility)
2. Updated logic to only count missed chars if `!isTimeBasedTest`
3. Updated `useTestResults.tsx` to pass `isTimeBasedTest: true` when `mode === 'time'`

### Issue 3: Inconsistency Between Engines
**Problem**: `metrics-engine` and `professional-accuracy` were calculating accuracy differently, causing UI to show different values than expected.

**Fix**: Both engines now use the exact same canonical formula:
- `metrics-engine.calculateAccuracy()` - canonical function
- `professional-accuracy.generateProfessionalAccuracyReport()` - now uses same denominator

## Code Changes

### 1. `src/lib/metrics-engine.ts`
- Added `isTimeBasedTest: boolean = false` parameter to `computeSessionMetrics()`
- Updated missed chars logic: only count if `!isTimeBasedTest`

### 2. `src/lib/professional-accuracy.ts`
- Changed accuracy calculation from `(correctChars / totalTypedChars)` to `(correctChars / totalDenominator)`
- `totalDenominator = correctChars + incorrectChars + missedChars + extraChars`
- Matches `metrics-engine.calculateAccuracy()` exactly

### 3. `src/hooks/useTestResults.tsx`
- Updated `computeSessionMetrics` call to pass `isTimeBasedTest: mode === 'time'`

### 4. `src/lib/__tests__/accuracy-pipeline.test.ts` (NEW)
- Created comprehensive end-to-end tests verifying:
  - Perfect typing → 100% accuracy
  - One typo → correct accuracy calculation
  - Backspace used → capped at 99.99%
  - Time-based partial typing → untyped remainder NOT counted as missed
  - Extra characters → included in denominator
  - Empty test → 100% accuracy

## Test Results
All 6 accuracy pipeline tests pass:
- ✓ Perfect typing, no backspace
- ✓ One typo, no correction
- ✓ Typo corrected with backspace (capped at 99.99%)
- ✓ Time-based test - partial typing (untyped remainder NOT counted)
- ✓ Extra characters typed
- ✓ Empty test

## Impact
- **Before**: Accuracy felt "wrong" because:
  - Time-based tests penalized users for not finishing (counted untyped text as errors)
  - Different formulas used in different places caused inconsistency
  - Results screen showed different accuracy than expected

- **After**: Accuracy is now:
  - Mathematically correct using canonical formula
  - Consistent across all engines and UI components
  - Fair for time-based tests (only analyzes what was typed)
  - Properly capped at 99.99% when backspace is used

## Verification
The accuracy pipeline now ensures:
1. ✅ Canonical formula used everywhere: `(correctChars / totalDenominator) * 100`
2. ✅ Time-based tests don't count untyped remainder as missed
3. ✅ Backspace usage caps accuracy at 99.99%
4. ✅ Both `metrics-engine` and `professional-accuracy` return identical values
5. ✅ UI displays the same accuracy from canonical sources
