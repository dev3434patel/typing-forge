# Accuracy Diagnostic & Detailed Fix

## Problem Analysis

Based on the screenshot showing **7.2% accuracy** when the user likely saw higher live accuracy, there are several potential issues:

### Potential Root Causes:

1. **TypedText Mismatch**: The `typedText` used for live calculation might differ from the `typedText` passed to final calculation
2. **Character Counting Issue**: The character-by-character comparison might be counting incorrectly
3. **Mode Detection Issue**: `isTimeBasedTest` might not be set correctly
4. **Report vs Stats Mismatch**: The report might be using different `typedText` than stats

## Detailed Diagnostic Steps

### Step 1: Add Comprehensive Logging

Add detailed logging to trace the exact flow:

```typescript
// In TypingArea.tsx - onTestComplete handler
console.log('[ACCURACY DIAGNOSTIC] ========================================');
console.log('[ACCURACY DIAGNOSTIC] Test Complete - Full State Snapshot');
console.log('[ACCURACY DIAGNOSTIC] Mode:', settings.mode);
console.log('[ACCURACY DIAGNOSTIC] typedText length:', typedText.length);
console.log('[ACCURACY DIAGNOSTIC] targetText length:', targetText.length);
console.log('[ACCURACY DIAGNOSTIC] typedText sample:', typedText.substring(0, 100));
console.log('[ACCURACY DIAGNOSTIC] targetText sample:', targetText.substring(0, 100));
console.log('[ACCURACY DIAGNOSTIC] Live stats:', {
  accuracy: stats.accuracy,
  correctChars: stats.correctChars,
  incorrectChars: stats.incorrectChars,
  totalChars: stats.totalChars,
});
console.log('[ACCURACY DIAGNOSTIC] ========================================');
```

### Step 2: Verify TypedText Consistency

Ensure `typedText` is the same in both calculations:

```typescript
// In TypingArea.tsx
const finalTypedText = typedText; // Use current state
console.log('[ACCURACY DIAGNOSTIC] finalTypedText === typedText:', finalTypedText === typedText);
console.log('[ACCURACY DIAGNOSTIC] finalTypedText length:', finalTypedText.length);
console.log('[ACCURACY DIAGNOSTIC] finalTypedText sample:', finalTypedText.substring(0, 100));
```

### Step 3: Compare Character Counts

Add detailed character-by-character comparison logging:

```typescript
// In professional-accuracy.ts
console.log('[ACCURACY DIAGNOSTIC] Character Comparison:');
let debugCorrect = 0;
let debugIncorrect = 0;
for (let i = 0; i < Math.min(typedText.length, targetText.length); i++) {
  const match = typedText[i] === targetText[i];
  if (match) debugCorrect++;
  else debugIncorrect++;
  if (i < 20) { // Log first 20
    console.log(`[ACCURACY DIAGNOSTIC] Pos ${i}: typed="${typedText[i]}" (${typedText.charCodeAt(i)}), target="${targetText[i]}" (${targetText.charCodeAt(i)}), match=${match}`);
  }
}
console.log('[ACCURACY DIAGNOSTIC] Total correct:', debugCorrect);
console.log('[ACCURACY DIAGNOSTIC] Total incorrect:', debugIncorrect);
```

## Critical Fixes to Apply

### Fix 1: Ensure TypedText is Captured at Test Finish

The `typedText` state might change between live calculation and test finish. Capture it explicitly:

```typescript
// In TypingArea.tsx - onTestComplete handler
useEffect(() => {
  if (status === 'finished') {
    // CRITICAL: Capture typedText IMMEDIATELY when test finishes
    // Don't rely on closure - use current state value
    const capturedTypedText = typedText;
    const capturedTargetText = targetText;
    
    // Verify captured text matches current state
    if (capturedTypedText !== typedText) {
      console.error('[CRITICAL] typedText changed between capture and use!');
    }
    
    // Use captured values for all calculations
    const isTimeBasedTest = settings.mode === 'time';
    const canonicalMetrics = computeSessionMetrics(
      keystrokeRecords,
      capturedTargetText,
      capturedTypedText, // Use captured value
      isTimeBasedTest
    );
    
    // ... rest of code
  }
}, [status, typedText, targetText, /* other deps */]);
```

### Fix 2: Use Same TypedText in Report Generation

Ensure Index.tsx uses the exact same typedText:

```typescript
// In Index.tsx - handleTestComplete
const handleTestComplete = useCallback(async (stats: TypingStats & { 
  typedText: string;
  targetText: string;
  // ... other props
}) => {
  // CRITICAL: Use stats.typedText directly (it's the captured value from TypingArea)
  const reportTypedText = stats.typedText;
  const reportTargetText = stats.targetText;
  
  // Verify it matches what was used for stats
  console.log('[ACCURACY DIAGNOSTIC] Report generation:', {
    statsAccuracy: stats.accuracy,
    statsTypedTextLength: stats.typedText.length,
    reportTypedTextLength: reportTypedText.length,
    match: stats.typedText === reportTypedText,
  });
  
  const isTimeBasedTest = settings.mode === 'time';
  const report = generateProfessionalAccuracyReport(
    reportTargetText,
    reportTypedText, // Use same typedText as stats
    stats.keystrokeLog,
    stats.elapsedTime,
    stats.backspaceCount,
    stats.wpmHistory,
    isTimeBasedTest
  );
  
  // ... rest of code
}, [/* deps */]);
```

### Fix 3: Add Validation in Report Generation

Add validation to ensure report accuracy matches stats accuracy:

```typescript
// In Index.tsx - after report generation
const accuracyDiscrepancy = Math.abs(stats.accuracy - report.overview.accuracy);

if (accuracyDiscrepancy > 1) {
  console.error('[CRITICAL ACCURACY MISMATCH]', {
    statsAccuracy: stats.accuracy,
    reportAccuracy: report.overview.accuracy,
    discrepancy: accuracyDiscrepancy,
    statsCorrectChars: stats.correctChars,
    statsIncorrectChars: stats.incorrectChars,
    reportCorrectChars: report.accuracy.correctChars,
    reportIncorrectChars: report.accuracy.incorrectChars,
    statsTypedTextLength: stats.typedText.length,
    reportTypedTextLength: stats.typedText.length,
    mode: settings.mode,
    isTimeBasedTest: settings.mode === 'time',
  });
  
  // CRITICAL FIX: If discrepancy is large, use stats accuracy (what user saw)
  if (accuracyDiscrepancy > 5) {
    console.warn('[ACCURACY FIX] Using stats accuracy due to large discrepancy');
    report.overview.accuracy = stats.accuracy;
    report.accuracy.final = stats.accuracy;
  }
}
```

### Fix 4: Ensure Live Accuracy Updates Correctly

Make sure live accuracy calculation uses the exact same logic:

```typescript
// In TypingArea.tsx - stats useMemo
const stats = useMemo(() => {
  // CRITICAL: Validate inputs
  if (typeof typedText !== 'string' || typeof targetText !== 'string') {
    console.error('[Live Accuracy] Invalid inputs');
    return { /* default */ };
  }
  
  // CRITICAL: Use exact same comparison logic as final calculation
  const comparisonLength = Math.min(typedText.length, targetText.length);
  let correctChars = 0;
  let incorrectChars = 0;
  
  // Character-by-character comparison (SAME as computeSessionMetrics)
  for (let i = 0; i < comparisonLength; i++) {
    if (typedText[i] === targetText[i]) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }
  
  // Handle extra chars
  const extraChars = typedText.length > targetText.length 
    ? typedText.length - targetText.length 
    : 0;
  
  // Handle missed chars (SAME logic as computeSessionMetrics)
  const isTimeBasedTest = settings.mode === 'time';
  const missedChars = (!isTimeBasedTest && targetText.length > typedText.length)
    ? targetText.length - typedText.length
    : 0;
  
  // Use canonical accuracy formula (SAME as computeSessionMetrics)
  const accuracy = canonicalCalculateAccuracy(
    correctChars,
    incorrectChars,
    missedChars,
    extraChars,
    backspaceCount > 0
  );
  
  return {
    wpm: calculateWPM(correctChars, elapsedTime),
    accuracy,
    correctChars,
    incorrectChars,
    totalChars: typedText.length,
    elapsedTime,
  };
}, [typedText, targetText, startTime, backspaceCount, settings.mode]);
```

## Implementation Plan

1. **Add all diagnostic logging** to trace the issue
2. **Apply Fix 1**: Capture typedText explicitly at test finish
3. **Apply Fix 2**: Ensure same typedText in report generation
4. **Apply Fix 3**: Add validation and fallback
5. **Apply Fix 4**: Ensure live accuracy uses exact same logic
6. **Test**: Run a test and check console logs
7. **Analyze**: Review logs to identify exact issue
8. **Fix**: Apply targeted fix based on logs

## Expected Console Output

After applying fixes, you should see:

```
[ACCURACY DIAGNOSTIC] Test Complete - Full State Snapshot
[ACCURACY DIAGNOSTIC] Mode: time
[ACCURACY DIAGNOSTIC] typedText length: 55
[ACCURACY DIAGNOSTIC] targetText length: 200
[ACCURACY DIAGNOSTIC] Live stats: { accuracy: 10.91, correctChars: 6, incorrectChars: 49, ... }
[ACCURACY DIAGNOSTIC] Character Comparison:
[ACCURACY DIAGNOSTIC] Pos 0: typed="t" (116), target="t" (116), match=true
[ACCURACY DIAGNOSTIC] Pos 1: typed="x" (120), target="h" (104), match=false
...
[ACCURACY DIAGNOSTIC] Total correct: 6
[ACCURACY DIAGNOSTIC] Total incorrect: 49
[ACCURACY DIAGNOSTIC] Report generation: { statsAccuracy: 10.91, reportAccuracy: 10.91, match: true }
```

If there's a mismatch, the logs will show exactly where it occurs.
