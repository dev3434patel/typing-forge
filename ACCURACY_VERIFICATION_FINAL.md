> Canonical policy: [ACCURACY_SEMANTICS.md](ACCURACY_SEMANTICS.md). Headline accuracy is keystroke-based (correctKeystrokes / totalKeystrokes). There is no 99.99 cap. The notes below are historical and do not override that policy.

# Accuracy Verification Final - MVP+ Contract

This document verifies that accuracy calculation is **100% consistent** across all screens, modes, and functions in Typing Forge.

## Canonical Accuracy Definition

**Formula:**
```
accuracy = (correctChars / totalDenominator) * 100
totalDenominator = correctChars + incorrectChars + missedChars + extraChars
```

**Rules:**
1. **Time mode**: `missedChars = 0` (untyped remainder NOT counted)
2. **Non-time modes**: `missedChars = targetText.length - typedText.length` (if target > typed)
3. **Perfect final result**: `accuracy = 100%` (no backspace cap)
4. **Empty test**: `accuracy = 100%` (nothing typed = nothing wrong)

**Implementation:** `metrics-engine.calculateAccuracy()` + `computeSessionMetrics()`

---

## Verification by Domain

### ✅ Typing Test System

#### Time Mode
- **Live HUD**: ✅ Uses `canonicalCalculateAccuracy()` with correct counts (file: `TypingArea.tsx`, lines 149-216)
- **Final Results**: ✅ Uses `computeSessionMetrics()` → `calculateAccuracy()` (file: `TypingArea.tsx`, lines 304-309)
- **Missed Chars**: ✅ Set to 0 for time-based tests (file: `TypingArea.tsx`, line 187; `metrics-engine.ts`, line 263)
- **Consistency**: ✅ Live and final use SAME `typedText`, SAME `targetText`, SAME formula

#### Words Mode
- **Live HUD**: ✅ Uses `canonicalCalculateAccuracy()` with correct counts (file: `TypingArea.tsx`, lines 149-216)
- **Final Results**: ✅ Uses `computeSessionMetrics()` → `calculateAccuracy()` (file: `TypingArea.tsx`, lines 304-309)
- **Missed Chars**: ✅ Counts untyped remainder as missed (file: `TypingArea.tsx`, line 188; `metrics-engine.ts`, line 263)
- **Consistency**: ✅ Live and final use SAME `typedText`, SAME `targetText`, SAME formula

#### Quote Mode
- **Live HUD**: ✅ Uses `canonicalCalculateAccuracy()` with correct counts (file: `TypingArea.tsx`, lines 149-216)
- **Final Results**: ✅ Uses `computeSessionMetrics()` → `calculateAccuracy()` (file: `TypingArea.tsx`, lines 304-309)
- **Missed Chars**: ✅ Counts untyped remainder as missed (file: `TypingArea.tsx`, line 188)
- **Consistency**: ✅ Live and final use SAME `typedText`, SAME `targetText`, SAME formula

#### Code Mode
- **Live HUD**: ✅ Uses `canonicalCalculateAccuracy()` with correct counts (file: `TypingArea.tsx`, lines 149-216)
- **Final Results**: ✅ Uses `computeSessionMetrics()` → `calculateAccuracy()` (file: `TypingArea.tsx`, lines 304-309)
- **Missed Chars**: ✅ Counts untyped remainder as missed (file: `TypingArea.tsx`, line 188)
- **Consistency**: ✅ Live and final use SAME `typedText`, SAME `targetText`, SAME formula

#### Zen Mode
- **Live HUD**: ✅ Uses `canonicalCalculateAccuracy()` with correct counts (file: `TypingArea.tsx`, lines 149-216)
- **Final Results**: ✅ Uses `computeSessionMetrics()` → `calculateAccuracy()` (file: `TypingArea.tsx`, lines 304-309)
- **Missed Chars**: ✅ Counts untyped remainder as missed (file: `TypingArea.tsx`, line 188)
- **Consistency**: ✅ Live and final use SAME `typedText`, SAME `targetText`, SAME formula

#### Keybr Mode
- **Live HUD**: ✅ Uses `calculateAccuracy()` from typing-engine (file: `KeybrLessonMode.tsx`, line 137)
- **Final Results**: ✅ Uses canonical accuracy calculation
- **Consistency**: ✅ Uses same formula as main typing system

---

### ✅ Professional Accuracy System

#### Overview Section
- **Accuracy Display**: ✅ Uses `report.overview.accuracy` from `generateProfessionalAccuracyReport()` (file: `ProfessionalResultsScreen.tsx`, line 121)
- **Source**: ✅ `professional-accuracy.ts` → `finalAccuracy` (line 323)
- **Formula**: ✅ Canonical formula: `(correctChars / totalDenominator) * 100` (file: `professional-accuracy.ts`, lines 312-313)

#### Accuracy Breakdown Section
- **Correct Chars**: ✅ `report.accuracy.correctChars` (file: `ProfessionalResultsScreen.tsx`, line 222)
- **Incorrect Chars**: ✅ `report.accuracy.incorrectChars` (file: `ProfessionalResultsScreen.tsx`, line 229)
- **Missed Chars**: ✅ `report.accuracy.missedChars` (file: `ProfessionalResultsScreen.tsx`, line 236)
- **Extra Chars**: ✅ `report.accuracy.extraChars` (file: `ProfessionalResultsScreen.tsx`, line 242)
- **Error Rate**: ✅ Calculated from `errors.totalErrors / totalTypedChars` (file: `professional-accuracy.ts`, lines 357-361)

#### Character Type Distribution
- **Letters Accuracy**: ✅ `distribution.letters.accuracy` = `(correct / (correct + incorrect)) * 100` (file: `professional-accuracy.ts`, lines 273-275)
- **Spaces Accuracy**: ✅ `distribution.spaces.accuracy` = `(correct / (correct + incorrect)) * 100` (file: `professional-accuracy.ts`, lines 273-275)
- **Numbers Accuracy**: ✅ `distribution.numbers.accuracy` = `(correct / (correct + incorrect)) * 100` (file: `professional-accuracy.ts`, lines 273-275)
- **Punctuation Accuracy**: ✅ `distribution.punctuation.accuracy` = `(correct / (correct + incorrect)) * 100` (file: `professional-accuracy.ts`, lines 273-275)
- **Consistency**: ✅ All use same base counts from character-by-character comparison

#### Report Generation
- **Function**: ✅ `generateProfessionalAccuracyReport()` (file: `professional-accuracy.ts`, line 186)
- **Mode Parameter**: ✅ Accepts `isTimeBasedTest` parameter (line 193) to correctly calculate `missedChars`
- **Formula**: ✅ Uses canonical `calculateAccuracy()` formula (lines 312-313)
- **Called From**: ✅ `Index.tsx` line 39, passes `isTimeBasedTest` correctly (line 40)

---

### ✅ Stats & Analytics

#### Stats Page (`/stats`)
- **Accuracy Source**: ✅ Reads `accuracy_percent` from `test_sessions` table (file: `Stats.tsx`, line 69)
- **No Recomputation**: ✅ Never recalculates accuracy from scratch
- **Accuracy Streaks**: ✅ Uses `calculateAccuracyStreaks()` which reads stored `accuracy_percent` (file: `Stats.tsx`, line 112)
- **Consistency**: ✅ All accuracy values come from canonical calculations stored in database

#### Accuracy Streaks Component
- **Function**: ✅ `calculateAccuracyStreaks()` (file: `stats-utils.ts`)
- **Source**: ✅ Uses `test.accuracy` from stored test results
- **Thresholds**: ✅ 100%, 98%, 95%, 90% (matches MVP spec)

---

### ✅ Profile & Leaderboard

#### Profile Overview
- **Accuracy Display**: ✅ Uses `leaderboardData?.accuracy_avg` from Supabase (file: `ProfileHeader.tsx`, line 67)
- **Source**: ✅ Built from canonical `accuracy_percent` values in `test_sessions` table
- **Calculation**: ✅ Average of all test accuracies (file: `useTestResults.tsx`, lines 149-150)

#### Leaderboard
- **Accuracy Ranking**: ✅ Uses `accuracy_avg` from `leaderboards` table (file: `Leaderboard.tsx`, line 89)
- **Source**: ✅ Built from canonical `accuracy_percent` values (file: `useTestResults.tsx`, lines 149-150)
- **Consistency**: ✅ All leaderboard accuracy values come from canonical calculations

---

### ✅ Race Mode

#### Live Accuracy
- **Calculation**: ✅ Uses `calculateAccuracy()` from metrics-engine (file: `Race.tsx`, line 420)
- **Formula**: ✅ Canonical formula with correct counts (file: `Race.tsx`, lines 410-426)
- **Update Frequency**: ✅ Calculated on each keystroke (file: `Race.tsx`, line 398)

#### Final Accuracy
- **Calculation**: ✅ Uses `calculateAccuracy()` from metrics-engine (file: `Race.tsx`, line 252)
- **Formula**: ✅ Canonical formula with correct counts (file: `Race.tsx`, lines 240-261)
- **Storage**: ✅ Saved to database with `host_accuracy` or `opponent_accuracy` (file: `Race.tsx`, lines 279-280)

#### Consistency
- **Live vs Final**: ✅ Both use same `calculateAccuracy()` function
- **Tolerance**: ✅ Should match within 1% (rounding differences)

---

## Test Coverage

### ✅ Unit Tests

#### `accuracy-pipeline.test.ts`
- **Test Case 1**: ✅ Perfect typing → 100% accuracy
- **Test Case 2**: ✅ One typo → ~66.67% accuracy
- **Test Case 3**: ✅ Typo corrected with backspace → 100% accuracy (no cap)
- **Test Case 4**: ✅ Time-based partial typing → 100% accuracy (no missed chars)
- **Test Case 5**: ✅ Extra characters → 75% accuracy
- **Test Case 6**: ✅ Empty test → 100% accuracy
- **Test Case 7**: ✅ Many errors scenario (6 correct, 49 incorrect) → ~10.91% accuracy
- **Test Case 8**: ✅ Perfect typing with backspace → 100% accuracy (no cap)

#### `metrics-consistency.test.ts`
- **Test**: ✅ Live accuracy matches final accuracy within 1% tolerance
- **Test**: ✅ Many errors scenario - live and final both show low accuracy (~10-12%)
- **Test**: ✅ Perfect typing with backspace - both show 100% accuracy

---

## Critical Fixes Applied

### 1. Live Accuracy Calculation
- **File**: `TypingArea.tsx`
- **Fix**: ✅ Uses canonical `calculateAccuracy()` with correct counts
- **Mode Handling**: ✅ Correctly sets `missedChars = 0` for time-based tests
- **Result**: Live accuracy now matches final accuracy within 1% tolerance

### 2. Final Accuracy Calculation
- **File**: `TypingArea.tsx` (onTestComplete)
- **Fix**: ✅ Uses `computeSessionMetrics()` → canonical `calculateAccuracy()`
- **Mode Handling**: ✅ Passes `isTimeBasedTest` correctly to `computeSessionMetrics()`
- **Result**: Final accuracy uses canonical formula consistently

### 3. Professional Accuracy Report
- **File**: `professional-accuracy.ts`
- **Fix**: ✅ Added `isTimeBasedTest` parameter to correctly calculate `missedChars`
- **Fix**: ✅ Uses canonical formula matching `metrics-engine.calculateAccuracy()`
- **Result**: Report accuracy matches final accuracy exactly

### 4. Index.tsx Report Generation
- **File**: `Index.tsx`
- **Fix**: ✅ Passes `isTimeBasedTest` parameter to `generateProfessionalAccuracyReport()`
- **Fix**: ✅ Validates report accuracy matches stats accuracy
- **Result**: Consistent accuracy across all display paths

---

## Verification Summary

| Domain | Live Accuracy | Final Accuracy | Storage | Display | Status |
|--------|---------------|---------------|---------|----------|--------|
| Time Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Words Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Quote Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Code Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Zen Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Keybr Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Race Mode | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Canonical | ✅ Verified |
| Stats Page | N/A | ✅ Stored | ✅ Stored | ✅ Stored | ✅ Verified |
| Profile | N/A | ✅ Stored | ✅ Stored | ✅ Stored | ✅ Verified |
| Leaderboard | N/A | ✅ Stored | ✅ Stored | ✅ Stored | ✅ Verified |

---

## Guarantees

1. ✅ **Live accuracy ≈ Final accuracy** (within 1% tolerance)
2. ✅ **All accuracy calculations use canonical formula**
3. ✅ **Time-based tests don't count untyped remainder as missed**
4. ✅ **Perfect final result = 100% accuracy** (no backspace cap)
5. ✅ **Many errors scenario shows low accuracy immediately** (not 99%)
6. ✅ **All stored accuracy values come from canonical calculations**
7. ✅ **All displayed accuracy values come from canonical calculations**

---

## Test Files That Guarantee Behavior

- `src/lib/__tests__/accuracy-pipeline.test.ts` - End-to-end accuracy consistency
- `src/lib/__tests__/metrics-consistency.test.ts` - Live vs final accuracy matching
- `src/lib/__tests__/metrics-engine.test.ts` - Canonical formula correctness
- `src/lib/__tests__/professional-accuracy.test.ts` - Report generation accuracy

---

**Last Updated**: 2026-02-12
**Status**: ✅ All accuracy calculations verified and consistent
