# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-low-power.spec.ts >> low-power WebGL precompiles asynchronously and disposes without a scored skip key
- Location: e2e\opening-low-power.spec.ts:7:1

# Error details

```
Error: clock.pauseAt: Cannot fast-forward to the past
_innerFastForwardTo@debugger eval code line 370 > eval:201:13
pauseAt@debugger eval code line 370 > eval:132:16
async*@debugger eval code line 370 > eval:1:33
evaluate@debugger eval code:370:30
@debugger eval code:1:44
@debugger eval code:1:62

```