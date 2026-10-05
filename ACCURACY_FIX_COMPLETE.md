> Canonical policy: [ACCURACY_SEMANTICS.md](ACCURACY_SEMANTICS.md). Headline accuracy is keystroke-based (correctKeystrokes / totalKeystrokes). There is no 99.99 cap. The notes below are historical and do not override that policy.

# Accuracy Calculation Fix - Complete Solution

## Problem Identified

The accuracy shown in the UI was **wrong** because:

1. **TypingArea.tsx** was using a simplified accuracy formula:
   ```typescript
   calculateAccuracy(correctChars, typedText.length)
   ```
   This doesn't account for:
   - Missed characters (for non-time tests)
   - Extra characters
   - Proper backspace handling

2. **Inconsistent calculations** between:
   - Live UI stats (TypingArea)
   - Final test completion (TypingArea → Index.tsx)
   - Professional accuracy report
   - Database storage

## Root Cause

The `typing-engine.calculateAccuracy()` function is a simplified wrapper that assumes:
- `incorrectChars = totalChars - correctChars`
- `missedChars = 0`
- `extraChars = 0`
- `backspaceUsed = false`

This is **NOT** the canonical formula from the MVP spec.

## Solution Implemented

### 1. Fixed TypingArea.tsx Live Stats (Lines 140-200)
**Before:**
```typescript
let accuracy = calculateAccuracy(correctChars, typedText.length);
if (backspaceCount > 0 && accuracy === 100) {
  accuracy = 99.99;
}
```

**After:**
```typescript
// Calculate correct/incorrect/missed/extra properly
const comparisonLength = Math.min(typedText.length, targetText.length);
let correctChars = 0;
let incorrectChars = 0;
let missedChars = 0;
let extraChars = 0;

// Compare typed vs target
for (let i = 0; i < comparisonLength; i++) {
  if (typedText[i] === targetText[i]) {
    correctChars++;
  } else {
    incorrectChars++;
  }
}

// Handle extra chars
if (typedText.length > targetText.length) {
  extraChars = typedText.length - targetText.length;
}

// Handle missed chars (NOT for time-based tests)
if (settings.mode !== 'time' && targetText.length > typedText.length) {
  missedChars = targetText.length - typedText.length;
}

// Use CANONICAL accuracy formula
const accuracy = canonicalCalculateAccuracy(
  correctChars,
  incorrectChars,
  missedChars,
  extraChars,
  backspaceCount > 0
);
```

### 2. Fixed TypingArea.tsx Final Stats (Lines 238-280)
**Before:**
```typescript
onTestComplete({
  accuracy: stats.accuracy, // Wrong - from simplified formula
  ...
});
```

**After:**
```typescript
// CRITICAL: Use canonical computeSessionMetrics for final accuracy
const keystrokeRecords: KeystrokeRecord[] = keystrokeLog.map(...);
const isTimeBasedTest = settings.mode === 'time';
const canonicalMetrics = computeSessionMetrics(
  keystrokeRecords,
  targetText,
  typedText,
  isTimeBasedTest
);

onTestComplete({
  accuracy: canonicalMetrics.accuracy, // CANONICAL ACCURACY
  ...
});
```

### 3. Already Fixed: professional-accuracy.ts
Uses canonical formula:
```typescript
const totalDenominator = correctChars + incorrectChars + missedChars + extraChars;
const typedAccuracy = totalDenominator > 0 
  ? (correctChars / totalDenominator) * 100 
  : 100;
```

### 4. Already Fixed: metrics-engine.ts
Canonical formula with time-based test support:
```typescript
export function calculateAccuracy(
  correctChars: number,
  incorrectChars: number,
  missedChars: number,
  extraChars: number,
  backspaceUsed: boolean
): number {
  const totalDenominator = correctChars + incorrectChars + missedChars + extraChars;
  if (totalDenominator === 0) return 100;
  
  let accuracy = (correctChars / totalDenominator) * 100;
  
  if (backspaceUsed && accuracy >= 100) {
    accuracy = 99.99;
  }
  
  return Math.round(accuracy * 100) / 100;
}
```

## Canonical Formula (MVP Spec)

```
accuracy = (correctChars / totalDenominator) * 100

where:
  totalDenominator = correctChars + incorrectChars + missedChars + extraChars

Rules:
  1. If backspace used → cap at 99.99%
  2. For time-based tests → missedChars = 0 (untyped remainder NOT counted)
  3. Empty test (no typing) → 100% accuracy
```

## Verification

All accuracy calculations now use the **same canonical formula**:

1. ✅ **Live UI stats** (TypingArea) → `canonicalCalculateAccuracy()`
2. ✅ **Final test completion** (TypingArea) → `computeSessionMetrics()`
3. ✅ **Professional report** (Index.tsx) → `generateProfessionalAccuracyReport()`
4. ✅ **Database storage** (useTestResults) → `computeSessionMetrics()`
5. ✅ **UI display** (ProfessionalResultsScreen) → `report.overview.accuracy`

## Test Coverage

All 6 accuracy pipeline tests pass:
- ✓ Perfect typing → 100%
- ✓ One typo → correct calculation
- ✓ Backspace used → capped at 99.99%
- ✓ Time-based partial typing → untyped remainder NOT counted
- ✓ Extra characters → included in denominator
- ✓ Empty test → 100%

## Impact

**Before:**
- Accuracy felt "wrong" even when typing correctly
- Different values shown in different places
- Time-based tests penalized for not finishing

**After:**
- ✅ Mathematically correct using canonical formula
- ✅ Consistent across all components
- ✅ Fair for time-based tests
- ✅ Properly handles backspace, extra chars, missed chars

The accuracy pipeline is now **100% correct and consistent** throughout the entire application.
