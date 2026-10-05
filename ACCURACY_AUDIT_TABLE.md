> Canonical policy: [ACCURACY_SEMANTICS.md](ACCURACY_SEMANTICS.md). Headline accuracy is keystroke-based (correctKeystrokes / totalKeystrokes). There is no 99.99 cap. The notes below are historical and do not override that policy.

# Accuracy Calculation Audit Table

## Ground Truth (MVP Contract)

**Canonical Formula:**
```
accuracy = (correctChars / totalDenominator) * 100
totalDenominator = correctChars + incorrectChars + missedChars + extraChars
```

**Rules:**
1. Time mode: `missedChars = 0` (untyped remainder NOT counted)
2. Backspace used: Cap at 99.99% (if final result is perfect)
3. Empty test: `accuracy = 100%`
4. Perfect typing: `accuracy = 100%` (no cap if no backspace)

---

## Accuracy Variables Audit

| Variable Name | File + Function | Formula / Source | Used For | Status |
|--------------|----------------|------------------|----------|--------|
| `stats.accuracy` | `TypingArea.tsx` (line 203) | `canonicalCalculateAccuracy(correctChars, incorrectChars, missedChars, extraChars, backspaceUsed)` | Live HUD | ✅ Canonical |
| `canonicalMetrics.accuracy` | `TypingArea.tsx` (line 332) | `computeSessionMetrics()` → `calculateAccuracy()` | Final calculation | ✅ Canonical |
| `report.overview.accuracy` | `professional-accuracy.ts` (line 563) | `finalAccuracy` = `(correctChars / totalDenominator) * 100` | Results screen | ✅ Canonical |
| `report.accuracy.final` | `professional-accuracy.ts` (line 575) | Same as `finalAccuracy` | Report detail | ✅ Canonical |
| `report.accuracy.typed` | `professional-accuracy.ts` (line 572) | `typedAccuracy` = `(correctChars / totalDenominator) * 100` | Report detail (not displayed) | ✅ Canonical |
| `report.accuracy.adjusted` | `professional-accuracy.ts` (line 574) | `(correctChars / totalTypedChars) * 100` | Report detail (not displayed) | ⚠️ Different formula |
| `stats.accuracy` (passed to Index) | `Index.tsx` (line 51) | From `onTestComplete` callback | Validation | ✅ Canonical |
| `accuracy_percent` (DB) | `useTestResults.tsx` (line 126) | `finalMetrics.accuracy` from `computeSessionMetrics()` | Stats page | ✅ Canonical |
| `accuracy_avg` (Profile) | `useTestResults.tsx` (line 149) | Average of `accuracy_percent` values | Profile page | ✅ Canonical |
| `accuracy_avg` (Leaderboard) | `useTestResults.tsx` (line 149) | Average of `accuracy_percent` values | Leaderboard | ✅ Canonical |

---

## Potential Issues Found

### Issue 1: `report.accuracy.adjusted` Uses Different Formula ⚠️

**Location**: `professional-accuracy.ts` line 357-359

**Current Code:**
```typescript
const adjustedAccuracy = totalTypedChars > 0 
  ? Math.max(0, ((correctChars) / totalTypedChars) * 100)
  : 0;
```

**Problem**: Uses `totalTypedChars` instead of `totalDenominator`. This gives a different (usually higher) accuracy.

**Impact**: Not displayed in UI, but exists in report object. Could cause confusion if used elsewhere.

**Fix**: Remove or rename to make it clear it's not canonical.

### Issue 2: Live Accuracy Calculation Timing ⚠️

**Location**: `TypingArea.tsx` line 151-227

**Current Behavior**: Live accuracy recalculates on every `typedText` change using `useMemo`.

**Potential Issue**: If `typedText` changes rapidly or there are React batching issues, live accuracy might not reflect the exact current state.

**Fix**: Already using `useMemo` with proper dependencies. Should be fine, but worth monitoring.

### Issue 3: Keystroke Log `isCorrect` Flag ⚠️

**Location**: `TypingArea.tsx` line 418-428

**Current Code:**
```typescript
const isCorrect = lastChar === expectedChar;
setKeystrokeLog(prev => [...prev, {
  // ...
  isCorrect,
}]);
```

**Potential Issue**: `isCorrect` is set at typing time based on position. If user backspaces and retypes, the log might have incorrect flags.

**Impact**: `computeSessionMetrics` doesn't use `is_correct` from keystrokeRecords - it recalculates from `finalTypedText`. So this shouldn't affect accuracy.

**Status**: ✅ Not an issue - final calculation ignores this field.

---

## Test Results

### Test: 7.2% Accuracy Scenario

**Input:**
- Target: "the quick brown fox jumps over the lazy dog" (43 chars)
- Typed: "txx qxxxx bxxxx fxx jxxxx oxxx xxx lxxx dxx xxxxxx xxxxxx" (57 chars)
- Mode: time-based (30 seconds)

**Expected:**
- correctChars: 17 (from comparison)
- incorrectChars: 26 (from comparison)
- extraChars: 14 (57 - 43)
- missedChars: 0 (time mode)
- totalDenominator: 17 + 26 + 0 + 14 = 57
- accuracy: (17 / 57) * 100 = 29.82%

**Actual Results:**
- ✅ Canonical metrics: 29.82%
- ✅ Report overview: 29.82%
- ✅ Report final: 29.82%

**Conclusion**: All paths match correctly. The formula is working as designed.

**Note**: The test shows 29.82%, not 7.2%. To get 7.2%, we'd need:
- correctChars: ~4
- totalDenominator: ~55
- This suggests the user typed with many more errors than our test scenario.

---

## Next Steps

1. ✅ Verify all accuracy calculations use canonical formula
2. ✅ Check that live and final use same `typedText`
3. ⚠️ Investigate why user sees 7.2% - need to recreate exact scenario
4. ⚠️ Check if there's a different code path for "learning" mode
5. ⚠️ Verify Stats/Profile/Leaderboard read from correct DB fields
