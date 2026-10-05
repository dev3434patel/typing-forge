# Accuracy semantics

There are two accuracy numbers. They are never mixed, capped, or overridden.

## Primary accuracy (headline)

Keystroke-based, the same model MonkeyType and Keybr use.

```
accuracy = correctKeystrokes / totalKeystrokes * 100
```

- A keystroke is one printable key press.
- Backspace is not a keystroke, but a wrong key that was later deleted still counts as incorrect.
- Rounded to 2 decimals. No 99.99 cap. No forced 100.
- Zero keystrokes returns 0 (never NaN).
- A perfect run with no mistyped keys is 100.
- One corrected typo is below 100 even when the final text matches.

`metrics-engine.calculateKeystrokeAccuracy()` and `computeSessionMetrics().accuracy` are the source of truth. The live HUD, the results screen, and stored results all read this value.

## Secondary accuracy (final text)

How close the finished string is to the target. Corrected mistakes disappear from this number.

```
finalTextAccuracy = correctChars / (correctChars + incorrectChars + missedChars + extraChars) * 100
```

- Time mode: untyped remainder is not missed (`missedChars = 0`).
- Other modes: untyped remainder is missed.
- An empty comparison (nothing typed and nothing wrong) is 100.
- Labeled in the UI as "Final-text accuracy". It is not the headline number.

## Words per minute

```
netWpm = (correctChars in the final text / 5) / elapsedMinutes
rawWpm = (all typed characters / 5) / elapsedMinutes
```

## Consistency

Sample raw WPM once per second. `cov = stdev / mean`.

```
consistency = 100 * (1 - tanh(cov + cov^3/3 + cov^5/5))
```

Clamped to 0..100, rounded to 2 decimals. Fewer than two samples returns 100.
