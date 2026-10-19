# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> five full reload cycles close their native canvas resources before entry
- Location: e2e\opening-experience.spec.ts:470:1

# Error details

```
Error: browserContext.close: Protocol error (Browser.removeBrowserContext): can't access property "_maybeDontRestoreTabs", this[#windows][aWindow.__SSi] is undefined
```

# Page snapshot

```yaml
- main "SparowType introduction" [ref=e1]:
  - status [ref=e2]: Loading SparowType
  - generic [aria-hidden] [ref=e4]:
    - generic [ref=e5]: SPAROWTYPE / INPUT SYSTEM 01
    - generic [ref=e6]: EST. 2026 · READY FOR YOUR RHYTHM
  - generic [ref=e10]:
    - generic [ref=e11]: Sparow
    - generic [ref=e12]: Type
  - generic [aria-hidden] [ref=e14]: A signal becomes a keystroke.
  - generic [ref=e17]:
    - generic "Asset readiness" [ref=e18]:
      - generic [ref=e19]: 075%
      - generic [ref=e22]: Preparing your workspace
    - generic [ref=e23]:
      - 'button "Sound off: enable intro sound" [ref=e24] [cursor=pointer]':
        - text: Sound off
        - generic [aria-hidden] [ref=e25]: ○
      - button "Skip intro" [ref=e26] [cursor=pointer]:
        - text: Skip intro
        - generic [aria-hidden] [ref=e27]: ↗
  - paragraph [aria-hidden] [ref=e28]: Press any key, click or tap to enter
```