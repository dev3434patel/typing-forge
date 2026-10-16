# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: font-readiness.spec.ts >> signed-out ranked page records unused mono versus requested font readiness
- Location: audit\keyboard-awakens-2026-10-16\font-diagnostic\font-readiness.spec.ts:417:1

# Error details

```
Error: Required layout fonts did not become ready: {"status":"loaded","faces":[{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+1f00-1fff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Inter Variable","status":"loaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Sora","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Sora","status":"loaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Sora Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"}]}. Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7]:
        - /url: /
        - generic [ref=e8]:
          - generic [ref=e9]: Sparow
          - generic [ref=e10]: Type
      - generic [ref=e11]:
        - button "Switch to light theme" [ref=e12]
        - link "Settings" [ref=e19]:
          - /url: /settings
        - link "Sign in" [ref=e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e27]:
      - link "Test" [ref=e28]:
        - /url: /
      - link "Learn" [ref=e31]:
        - /url: /learn
      - link "Race" [ref=e35]:
        - /url: /race
      - link "Stats" [ref=e45]:
        - /url: /stats
      - link "Rankings" [ref=e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e55]:
        - /url: /keyboard-lab
  - main [ref=e58]:
    - generic [ref=e59]:
      - generic [ref=e60]:
        - paragraph [ref=e61]: Server issued challenge
        - heading "Make your mark." [level=1] [ref=e65]
        - paragraph [ref=e66]: One shared standard. A fixed start, a fixed deadline, and replayed results.
      - link "Rankings" [ref=e67]:
        - /url: /leaderboard
    - generic [ref=e71]:
      - heading "A fair comparison starts with clear rules." [level=2] [ref=e72]
      - paragraph [ref=e73]: This challenge uses the same English word corpus, QWERTY layout and keyboard input rules for everyone. The clock starts after a three second countdown and keeps running during pauses in your typing.
      - paragraph [ref=e74]: Corrected mistakes remain in input accuracy. Results are provisional until accepted by the server. Browser evidence can be checked for consistency; it cannot prove that a human typed it.
      - generic [ref=e75]:
        - text: Challenge duration
        - combobox "Challenge duration" [ref=e76]:
          - option "15 seconds"
          - option "30 seconds" [selected]
          - option "60 seconds"
          - option "120 seconds"
      - link "Sign in to start" [ref=e77]:
        - /url: /auth
  - contentinfo [ref=e81]:
    - generic [ref=e82]:
      - generic [ref=e83]:
        - generic [ref=e84]:
          - generic [ref=e85]: Sparow
          - generic [ref=e86]: Type
        - text: Find your rhythm.
      - generic [ref=e87]:
        - link "About & metrics" [ref=e88]:
          - /url: /about
        - link "Preferences & data" [ref=e89]:
          - /url: /settings
        - link "Touch typing guide" [ref=e90]:
          - /url: /touch-typing
        - link "Privacy" [ref=e91]:
          - /url: /privacy
        - link "Terms" [ref=e92]:
          - /url: /terms
        - link "Offline" [ref=e93]:
          - /url: /offline
        - generic [ref=e94]: SparowType © 2026
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | const layoutFonts = [
  4  |   {
  5  |     family: "Inter Variable",
  6  |     font: '400 16px "Inter Variable"',
  7  |     text: "SparowType",
  8  |   },
  9  |   { family: "Sora", font: '600 24px "Sora"', text: "Guest workspace" },
  10 |   {
  11 |     family: "JetBrains Mono Variable",
  12 |     font: '400 26px "JetBrains Mono Variable"',
  13 |     text: "typing practice",
  14 |   },
  15 | ];
  16 | 
  17 | /** Wait for the actual layout faces, rather than unrelated fonts in FontFaceSet.status. */
  18 | export async function waitForLayoutFonts(page: Page) {
  19 |   await page.evaluate((requests) => {
  20 |     for (const request of requests)
  21 |       void document.fonts
  22 |         .load(request.font, request.text)
  23 |         .catch(() => undefined);
  24 |   }, layoutFonts);
  25 |   try {
  26 |     await expect
  27 |       .poll(
  28 |         () =>
  29 |           page.evaluate(
  30 |             (requests) =>
  31 |               requests.every(
  32 |                 (request) =>
  33 |                   document.fonts.check(request.font, request.text) &&
  34 |                   Array.from(document.fonts).some(
  35 |                     (face) =>
  36 |                       face.family.replace(/["']/g, "") === request.family &&
  37 |                       face.status === "loaded",
  38 |                   ),
  39 |               ),
  40 |             layoutFonts,
  41 |           ),
  42 |         { timeout: 10_000 },
  43 |       )
  44 |       .toBe(true);
  45 |   } catch (error) {
  46 |     const evidence = await page.evaluate(() => ({
  47 |       status: document.fonts.status,
  48 |       faces: Array.from(document.fonts).map((face) => ({
  49 |         family: face.family,
  50 |         status: face.status,
  51 |         unicodeRange: face.unicodeRange,
  52 |       })),
  53 |     }));
> 54 |     throw new Error(
     |           ^ Error: Required layout fonts did not become ready: {"status":"loaded","faces":[{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+1f00-1fff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"Inter Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Inter Variable","status":"loaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+460-52f, U+1c80-1c8a, U+20b4, U+2de0-2dff, U+a640-a69f, U+fe2e-fe2f"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+301, U+400-45f, U+490-491, U+4b0-4b1, U+2116"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+370-377, U+37a-37f, U+384-38a, U+38c, U+38e-3a1, U+3a3-3ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+102-103, U+110-111, U+128-129, U+168-169, U+1a0-1a1, U+1af-1b0, U+300-301, U+303-304, U+308-309, U+323, U+329, U+1ea0-1ef9, U+20ab"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"JetBrains Mono Variable","status":"unloaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Sora","status":"unloaded","unicodeRange":"U+100-2ba, U+2bd-2c5, U+2c7-2cc, U+2ce-2d7, U+2dd-2ff, U+304, U+308, U+329, U+1d00-1dbf, U+1e00-1e9f, U+1ef2-1eff, U+2020, U+20a0-20ab, U+20ad-20c0, U+2113, U+2c60-2c7f, U+a720-a7ff"},{"family":"Sora","status":"loaded","unicodeRange":"U+0-ff, U+131, U+152-153, U+2bb-2bc, U+2c6, U+2da, U+2dc, U+304, U+308, U+329, U+2000-206f, U+20ac, U+2122, U+2191, U+2193, U+2212, U+2215, U+feff, U+fffd"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Inter Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"},{"family":"Sora Fallback","status":"unloaded","unicodeRange":"U+0-10FFFF"}]}. Error: expect(received).toBe(expected) // Object.is equality
  55 |       `Required layout fonts did not become ready: ${JSON.stringify(evidence)}. ${String(error)}`,
  56 |     );
  57 |   }
  58 | }
  59 | 
```