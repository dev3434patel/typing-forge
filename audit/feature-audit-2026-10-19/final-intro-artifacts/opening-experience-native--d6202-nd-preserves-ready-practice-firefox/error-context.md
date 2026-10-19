# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> native context loss switches to fallback and preserves ready practice
- Location: e2e\opening-experience.spec.ts:434:1

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