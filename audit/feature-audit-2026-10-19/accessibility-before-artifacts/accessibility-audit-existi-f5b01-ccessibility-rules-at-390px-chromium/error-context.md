# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-audit.spec.ts >> existing guest pages and completed results meet automated accessibility rules at 390px
- Location: e2e\accessibility-audit.spec.ts:12:3

# Error details

```
Error: /auth at 390px: [{"id":"color-contrast","impact":"serious","help":"Elements must meet minimum color contrast ratio thresholds","nodes":[{"target":[".brand-wordmark > span:nth-child(1)"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 18.0pt (24px), font weight: bold). Expected contrast ratio of 3:1"},{"target":[".brand-wordmark-accent"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.17 (foreground color: #3d4d18, background color: #07070a, font size: 18.0pt (24px), font weight: bold). Expected contrast ratio of 3:1"},{"target":["h1"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 22.5pt (30px), font weight: bold). Expected contrast ratio of 3:1"},{"target":[".mb-8 > p"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.45 (foreground color: #2c2c34, background color: #07070a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:bg-accent"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".my-5"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.43 (foreground color: #2c2c34, background color: #09090d, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"email\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.18 (foreground color: #48484b, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"password\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.18 (foreground color: #48484b, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".bg-primary"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 2.17 (foreground color: #07070a, background color: #3d4d18, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:text-foreground[type=\"button\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.43 (foreground color: #2c2c34, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["a"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.45 (foreground color: #2c2c34, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"}]}]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 86

- Array []
+ Array [
+   Object {
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 18.0pt (24px), font weight: bold). Expected contrast ratio of 3:1",
+         "target": Array [
+           ".brand-wordmark > span:nth-child(1)",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.17 (foreground color: #3d4d18, background color: #07070a, font size: 18.0pt (24px), font weight: bold). Expected contrast ratio of 3:1",
+         "target": Array [
+           ".brand-wordmark-accent",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 22.5pt (30px), font weight: bold). Expected contrast ratio of 3:1",
+         "target": Array [
+           "h1",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.45 (foreground color: #2c2c34, background color: #07070a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".mb-8 > p",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.2 (foreground color: #48484b, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".hover\\:bg-accent",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.43 (foreground color: #2c2c34, background color: #09090d, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".my-5",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.18 (foreground color: #48484b, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "label[for=\"email\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.18 (foreground color: #48484b, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "label[for=\"password\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.17 (foreground color: #07070a, background color: #3d4d18, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".bg-primary",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.43 (foreground color: #2c2c34, background color: #09090d, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".hover\\:text-foreground[type=\"button\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.45 (foreground color: #2c2c34, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "a",
+         ],
+       },
+     ],
+   },
+ ]
```

```
Error: /keyboard-lab at 390px: [{"id":"scrollable-region-focusable","impact":"serious","help":"Scrollable region must have keyboard access","nodes":[{"target":["div[aria-label=\"Physical key observations\"]"],"failureSummary":"Fix any of the following:\n  Element should have focusable content\n  Element should be focusable"}]}]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 17

- Array []
+ Array [
+   Object {
+     "help": "Scrollable region must have keyboard access",
+     "id": "scrollable-region-focusable",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element should have focusable content
+   Element should be focusable",
+         "target": Array [
+           "div[aria-label=\"Physical key observations\"]",
+         ],
+       },
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=f16e1]:
  - generic [ref=f16e4]:
    - banner [ref=f16e5]:
      - link "Skip to content" [ref=f16e6] [cursor=pointer]:
        - /url: "#main-content"
      - generic [ref=f16e7]:
        - link "SparowType home" [ref=f16e8] [cursor=pointer]:
          - /url: /
          - generic [ref=f16e9]:
            - generic [ref=f16e10]: Sparow
            - generic [ref=f16e11]: Type
        - generic [ref=f16e12]:
          - button "Switch to light theme" [ref=f16e13]
          - link "Settings" [ref=f16e20] [cursor=pointer]:
            - /url: /settings
          - link "Sign in" [ref=f16e24] [cursor=pointer]:
            - /url: /auth
      - navigation "Mobile navigation" [ref=f16e28]:
        - link "Test" [ref=f16e29] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=f16e32] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=f16e36] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=f16e46] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=f16e49] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=f16e56] [cursor=pointer]:
          - /url: /keyboard-lab
    - main [ref=f16e59]:
      - region "Session results" [active] [ref=f16e60]:
        - generic [ref=f16e62]:
          - paragraph [ref=f16e63]: Session complete
          - paragraph [ref=f16e64]: custom · English · qwerty · forge-v3
        - generic [ref=f16e65]:
          - generic [ref=f16e66]:
            - paragraph [ref=f16e67]: Words per minute
            - generic [ref=f16e68]: "123"
            - paragraph [ref=f16e69]: credited word speed
          - generic [ref=f16e70]:
            - paragraph [ref=f16e71]: Input accuracy
            - generic [ref=f16e72]: 75.0%
            - paragraph [ref=f16e73]: 3 / 4 insertion attempts
        - region "Speed and error timeline" [ref=f16e74]:
          - generic [ref=f16e75]:
            - heading "Your rhythm" [level=2] [ref=f16e76]
            - generic [ref=f16e77]:
              - generic [ref=f16e78]: ● WPM
              - button "● Raw" [pressed] [ref=f16e79]
              - button "● Errors" [pressed] [ref=f16e80]
          - generic [ref=f16e83]:
            - img [ref=f16e84]:
              - generic [ref=f16e87]: 0.3s
              - generic [ref=f16e92]:
                - generic [ref=f16e93]: "0"
                - generic [ref=f16e95]: "35"
                - generic [ref=f16e97]: "70"
                - generic [ref=f16e99]: "105"
                - generic [ref=f16e101]: "140"
            - generic:
              - generic:
                - paragraph: 0.3 seconds
                - list:
                  - listitem: "Errors : 1.0"
                  - listitem: "WPM : 123.3"
                  - listitem: "Raw WPM : 123.3"
          - group [ref=f16e118]:
            - generic "View accessible chart data" [ref=f16e119] [cursor=pointer]
        - generic [ref=f16e120]:
          - generic [ref=f16e121]:
            - paragraph [ref=f16e122]: Correct-character WPM
            - paragraph [ref=f16e123]: "123"
            - group [ref=f16e124]:
              - generic "How it’s measured" [ref=f16e125] [cursor=pointer]
          - generic [ref=f16e126]:
            - paragraph [ref=f16e127]: Raw WPM
            - paragraph [ref=f16e128]: "123"
            - group [ref=f16e129]:
              - generic "How it’s measured" [ref=f16e130] [cursor=pointer]
          - generic [ref=f16e131]:
            - paragraph [ref=f16e132]: Attempt rate
            - paragraph [ref=f16e133]: "164"
            - group [ref=f16e134]:
              - generic "How it’s measured" [ref=f16e135] [cursor=pointer]
          - generic [ref=f16e136]:
            - paragraph [ref=f16e137]: Consistency
            - paragraph [ref=f16e138]: —
            - group [ref=f16e139]:
              - generic "How it’s measured" [ref=f16e140] [cursor=pointer]
          - generic [ref=f16e141]:
            - paragraph [ref=f16e142]: 5s burst
            - paragraph [ref=f16e143]: —
            - group [ref=f16e144]:
              - generic "How it’s measured" [ref=f16e145] [cursor=pointer]
          - generic [ref=f16e146]:
            - paragraph [ref=f16e147]: Final accuracy
            - paragraph [ref=f16e148]: 100%
            - group [ref=f16e149]:
              - generic "How it’s measured" [ref=f16e150] [cursor=pointer]
          - generic [ref=f16e151]:
            - paragraph [ref=f16e152]: Duration
            - paragraph [ref=f16e153]: 0.3s
            - group [ref=f16e154]:
              - generic "How it’s measured" [ref=f16e155] [cursor=pointer]
        - region "Score explanation" [ref=f16e156]:
          - generic [ref=f16e157]:
            - generic [ref=f16e158]:
              - heading "Every number, explained" [level=2] [ref=f16e159]
              - paragraph [ref=f16e160]: Accuracy of your attempts and correctness of the final text answer different questions. Displayed values are rounded; exports retain precision.
            - link "Check your keyboard →" [ref=f16e161] [cursor=pointer]:
              - /url: /keyboard-lab
          - generic [ref=f16e162]:
            - generic [ref=f16e163]:
              - term [ref=f16e164]: Input accuracy
              - definition [ref=f16e165]: 3 correct ÷ 4 insertion attempts × 100 = 75.0%
            - generic [ref=f16e166]:
              - term [ref=f16e167]: Final text accuracy
              - definition [ref=f16e168]: 3 correct ÷ 3 processed positions × 100 = 100.0%
            - generic [ref=f16e169]:
              - term [ref=f16e170]: Credited WPM
              - definition [ref=f16e171]: 3 credited characters ÷ 5 ÷ 0.00486667 minutes = 123.3 WPM
            - generic [ref=f16e172]:
              - term [ref=f16e173]: Raw WPM
              - definition [ref=f16e174]: 3 retained characters ÷ 5 ÷ 0.00486667 minutes = 123.3 WPM
            - generic [ref=f16e175]:
              - term [ref=f16e176]: Attempt rate
              - definition [ref=f16e177]: 4 inserted characters ÷ 5 ÷ 0.00486667 minutes = 164.4 WPM
          - paragraph [ref=f16e178]: 1 incorrect insertion attempts remain in input accuracy even after corrections. Final text has 0 incorrect, 0 extra and 0 missed positions. 0 untouched future positions are excluded. Deletions are separate actions.
          - paragraph [ref=f16e179]: WPM credits eligible words, not raw speed multiplied by accuracy. Character totals and insertion attempts can differ after edits or word skips. Consistency describes your rhythm under Forge’s formula; it is not an accuracy score or directly interchangeable with another site’s consistency.
          - button "Inspect session evidence" [ref=f16e180]
        - generic [ref=f16e181]:
          - generic [ref=f16e182]:
            - heading "Characters, accounted for" [level=2] [ref=f16e183]
            - generic [ref=f16e184]:
              - generic [ref=f16e185]:
                - text: "3"
                - generic [ref=f16e186]: correct
              - generic [ref=f16e187]:
                - text: "0"
                - generic [ref=f16e188]: incorrect
              - generic [ref=f16e189]:
                - text: "0"
                - generic [ref=f16e190]: extra
              - generic [ref=f16e191]:
                - text: "0"
                - generic [ref=f16e192]: missed
            - paragraph [ref=f16e193]: 0 untyped · 1 deletion actions · 1 deleted characters
          - generic [ref=f16e194]:
            - heading "Practice insight" [level=2] [ref=f16e195]
            - paragraph [ref=f16e196]: 1 incorrect insertion attempt remains in your input accuracy. 1 character was removed while editing.
            - link "Build accuracy with a focused lesson" [ref=f16e197] [cursor=pointer]:
              - /url: /learn?keys=a&source=9eb134af-85b3-4af3-a3fe-508f49f11f7c&language=en&layout=qwerty&retest=%2F%3Fretest%3D9eb134af-85b3-4af3-a3fe-508f49f11f7c
        - group [ref=f16e200]:
          - generic "Final-text keyboard map Measured final characters only. Untyped keys have no color." [ref=f16e201] [cursor=pointer]:
            - text: Final-text keyboard map
            - generic [ref=f16e202]: Measured final characters only. Untyped keys have no color.
        - group [ref=f16e203]:
          - generic "Session details & comparison eligibility" [ref=f16e204] [cursor=pointer]
        - status [ref=f16e207]:
          - generic [ref=f16e210]: Private content saved on this device. Cloud storage requires your consent.
        - generic [ref=f16e211]:
          - generic [ref=f16e212]:
            - button "Next test" [ref=f16e213]
            - button "Repeat passage" [ref=f16e217]
          - generic [ref=f16e218]:
            - button "Share image" [ref=f16e219]
            - button "Export JSON" [ref=f16e223]
        - paragraph [ref=f16e224]: Tab → Enter starts the next test.
        - status
    - contentinfo [ref=f16e225]:
      - generic [ref=f16e226]:
        - generic [ref=f16e227]:
          - generic [ref=f16e228]:
            - generic [ref=f16e229]: Sparow
            - generic [ref=f16e230]: Type
          - text: Find your rhythm.
        - generic [ref=f16e231]:
          - link "About & metrics" [ref=f16e232] [cursor=pointer]:
            - /url: /about
          - link "Preferences & data" [ref=f16e233] [cursor=pointer]:
            - /url: /settings
          - link "Touch typing guide" [ref=f16e234] [cursor=pointer]:
            - /url: /touch-typing
          - link "Privacy" [ref=f16e235] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=f16e236] [cursor=pointer]:
            - /url: /terms
          - link "Offline" [ref=f16e237] [cursor=pointer]:
            - /url: /offline
          - generic [ref=f16e238]: SparowType © 2026
  - generic [aria-hidden] [ref=f16e239]: "0"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import axe from "axe-core";
  3  | import { completeCorrectedCat } from "./helpers";
  4  | 
  5  | test.beforeEach(async ({ page }) => {
  6  |   await page.addInitScript(() =>
  7  |     localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  8  |   );
  9  | });
  10 | 
  11 | for (const width of [390, 1440]) {
  12 |   test(`existing guest pages and completed results meet automated accessibility rules at ${width}px`, async ({ page }, info) => {
  13 |     test.setTimeout(120_000);
  14 |     await page.setViewportSize({ width, height: 900 });
  15 |     const receipts = [];
  16 |     for (const route of ["/", "/learn", "/race", "/ranked", "/stats", "/profile", "/leaderboard", "/settings", "/auth", "/keyboard-lab", "/about", "/privacy", "/terms", "/touch-typing", "/offline", "/missing-page", "completed-results"]) {
  17 |       if (route === "completed-results") await completeCorrectedCat(page);
  18 |       else await page.goto(route, { waitUntil: "domcontentloaded" });
  19 |       await expect(page.locator("main#main-content")).toBeVisible();
  20 |       // Evaluate through the test driver; keep the application’s strict script CSP intact.
  21 |       await page.evaluate(axe.source);
  22 |       const result = await page.evaluate(async () => {
  23 |         const engine = (window as Window & { axe: typeof axe }).axe;
  24 |         const report = await engine.run(document, {
  25 |           runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  26 |         });
  27 |         return {
  28 |           violations: report.violations.map(({ id, impact, help, nodes }) => ({
  29 |             id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  30 |           })),
  31 |           incomplete: report.incomplete.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
  32 |           passes: report.passes.length,
  33 |           version: engine.version,
  34 |         };
  35 |       });
  36 |       receipts.push({ route, width, ...result });
  37 |       await info.attach(`automated-accessibility-${route.replaceAll("/", "_") || "home"}`, {
  38 |         body: JSON.stringify(receipts.at(-1), null, 2), contentType: "application/json",
  39 |       });
> 40 |       expect.soft(result.violations, `${route} at ${width}px: ${JSON.stringify(result.violations)}`).toEqual([]);
     |                                                                                                      ^ Error: /keyboard-lab at 390px: [{"id":"scrollable-region-focusable","impact":"serious","help":"Scrollable region must have keyboard access","nodes":[{"target":["div[aria-label=\"Physical key observations\"]"],"failureSummary":"Fix any of the following:\n  Element should have focusable content\n  Element should be focusable"}]}]
  41 |     }
  42 |     await info.attach("automated-accessibility-scope", {
  43 |       body: JSON.stringify({ receipts, limitation: "Automated WCAG-tagged checks only. Incomplete rules need manual review; this does not establish native screen-reader or full WCAG conformance." }, null, 2),
  44 |       contentType: "application/json",
  45 |     });
  46 |   });
  47 | }
  48 | 
```