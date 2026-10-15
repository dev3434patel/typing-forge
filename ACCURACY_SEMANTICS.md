# Accuracy Semantics - Canonical Definition

## Canonical Accuracy (Strict, Used Everywhere)

**Formula:**
```
accuracy = (correctChars / totalDenominator) * 100
totalDenominator = correctChars + incorrectChars + missedChars + extraChars
```

**Rules:**
1. **Time mode**: `missedChars = 0` (untyped remainder NOT counted as errors)
2. **Non-time modes**: `missedChars = targetText.length - typedText.length` (if target > typed)
3. **Backspace used**: NO CAP - Perfect final result = 100% accuracy always
4. **No chars typed**: `accuracy = 100%` (empty test is perfect)
5. **Perfect typing**: If `correctChars = totalTypedChars` and `incorrectChars = 0`, then `accuracy = 100%`

**Implementation:**
- `metrics-engine.calculateAccuracy()` - Core function
- `metrics-engine.computeSessionMetrics()` - Full session calculation
- `professional-accuracy.generateProfessionalAccuracyReport()` - Detailed report

## Live Accuracy (Shown During Typing)

**MUST use the same canonical formula** as final accuracy.

**Implementation:**
- `TypingArea.tsx` live stats calculation uses `canonicalCalculateAccuracy()`
- Uses same `typedText`, `targetText`, and mode logic as final calculation
- **Result**: Live accuracy ≈ Final accuracy (within 1% tolerance)

**Why this matters:**
- User sees 99% live → expects ~99% final
- If user types many errors → live should drop immediately
- No surprises or confusion

## Accuracy Calculation Flow

```
User Types → typedText updated → Live Stats Calculated
                                      ↓
                              canonicalCalculateAccuracy()
                                      ↓
                              Display in HUD (live)
                                      ↓
Test Finishes → Same typedText → computeSessionMetrics()
                                      ↓
                              Same canonicalCalculateAccuracy()
                                      ↓
                              Display in Results (final)
```

**Key Point**: Both paths use the SAME `typedText`, SAME `targetText`, SAME formula.
