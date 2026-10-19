# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-audit.spec.ts >> existing guest pages and completed results meet automated accessibility rules at 1440px
- Location: e2e\accessibility-audit.spec.ts:12:3

# Error details

```
Error: /auth at 1440px: [{"id":"color-contrast","impact":"serious","help":"Elements must meet minimum color contrast ratio thresholds","nodes":[{"target":[".mb-8 > p"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:bg-accent"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.36 (foreground color: #636367, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".my-5"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"email\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"password\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".bg-primary"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.35 (foreground color: #07070a, background color: #546b1f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:text-foreground[type=\"button\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["a"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"}]}]

expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 65

- Array []
+ Array [
+   Object {
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".mb-8 > p",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.36 (foreground color: #636367, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".hover\\:bg-accent",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".my-5",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "label[for=\"email\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "label[for=\"password\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.35 (foreground color: #07070a, background color: #546b1f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".bg-primary",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           ".hover\\:text-foreground[type=\"button\"]",
+         ],
+       },
+       Object {
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "target": Array [
+           "a",
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
        - navigation "Main navigation" [ref=f16e12]:
          - link "Test" [ref=f16e13] [cursor=pointer]:
            - /url: /
          - link "Learn" [ref=f16e16] [cursor=pointer]:
            - /url: /learn
          - link "Race" [ref=f16e20] [cursor=pointer]:
            - /url: /race
          - link "Stats" [ref=f16e30] [cursor=pointer]:
            - /url: /stats
          - link "Rankings" [ref=f16e33] [cursor=pointer]:
            - /url: /leaderboard
          - link "Keyboard Lab" [ref=f16e40] [cursor=pointer]:
            - /url: /keyboard-lab
        - generic [ref=f16e43]:
          - button "Switch to light theme" [ref=f16e44]
          - button "Open command palette" [ref=f16e51]
          - link "Settings" [ref=f16e54] [cursor=pointer]:
            - /url: /settings
          - link "Sign in" [ref=f16e58] [cursor=pointer]:
            - /url: /auth
    - main [ref=f16e63]:
      - region "Session results" [active] [ref=f16e64]:
        - generic [ref=f16e66]:
          - paragraph [ref=f16e67]: Session complete
          - paragraph [ref=f16e68]: custom · English · qwerty · forge-v3
        - generic [ref=f16e69]:
          - generic [ref=f16e70]:
            - paragraph [ref=f16e71]: Words per minute
            - generic [ref=f16e72]: "120"
            - paragraph [ref=f16e73]: credited word speed
          - generic [ref=f16e74]:
            - paragraph [ref=f16e75]: Input accuracy
            - generic [ref=f16e76]: 75.0%
            - paragraph [ref=f16e77]: 3 / 4 insertion attempts
        - region "Speed and error timeline" [ref=f16e78]:
          - generic [ref=f16e79]:
            - heading "Your rhythm" [level=2] [ref=f16e80]
            - generic [ref=f16e81]:
              - generic [ref=f16e82]: ● WPM
              - button "● Raw" [pressed] [ref=f16e83]
              - button "● Errors" [pressed] [ref=f16e84]
          - generic [ref=f16e87]:
            - img [ref=f16e88]:
              - generic [ref=f16e91]: 0.3s
              - generic [ref=f16e96]:
                - generic [ref=f16e97]: "0"
                - generic [ref=f16e99]: "30"
                - generic [ref=f16e101]: "60"
                - generic [ref=f16e103]: "90"
                - generic [ref=f16e105]: "120"
            - generic:
              - generic:
                - paragraph: 0.3 seconds
                - list:
                  - listitem: "Errors : 1.0"
                  - listitem: "WPM : 119.6"
                  - listitem: "Raw WPM : 119.6"
          - group [ref=f16e122]:
            - generic "View accessible chart data" [ref=f16e123] [cursor=pointer]
        - generic [ref=f16e124]:
          - generic [ref=f16e125]:
            - paragraph [ref=f16e126]: Correct-character WPM
            - paragraph [ref=f16e127]: "120"
            - group [ref=f16e128]:
              - generic "How it’s measured" [ref=f16e129] [cursor=pointer]
          - generic [ref=f16e130]:
            - paragraph [ref=f16e131]: Raw WPM
            - paragraph [ref=f16e132]: "120"
            - group [ref=f16e133]:
              - generic "How it’s measured" [ref=f16e134] [cursor=pointer]
          - generic [ref=f16e135]:
            - paragraph [ref=f16e136]: Attempt rate
            - paragraph [ref=f16e137]: "160"
            - group [ref=f16e138]:
              - generic "How it’s measured" [ref=f16e139] [cursor=pointer]
          - generic [ref=f16e140]:
            - paragraph [ref=f16e141]: Consistency
            - paragraph [ref=f16e142]: —
            - group [ref=f16e143]:
              - generic "How it’s measured" [ref=f16e144] [cursor=pointer]
          - generic [ref=f16e145]:
            - paragraph [ref=f16e146]: 5s burst
            - paragraph [ref=f16e147]: —
            - group [ref=f16e148]:
              - generic "How it’s measured" [ref=f16e149] [cursor=pointer]
          - generic [ref=f16e150]:
            - paragraph [ref=f16e151]: Final accuracy
            - paragraph [ref=f16e152]: 100%
            - group [ref=f16e153]:
              - generic "How it’s measured" [ref=f16e154] [cursor=pointer]
          - generic [ref=f16e155]:
            - paragraph [ref=f16e156]: Duration
            - paragraph [ref=f16e157]: 0.3s
            - group [ref=f16e158]:
              - generic "How it’s measured" [ref=f16e159] [cursor=pointer]
        - region "Score explanation" [ref=f16e160]:
          - generic [ref=f16e161]:
            - generic [ref=f16e162]:
              - heading "Every number, explained" [level=2] [ref=f16e163]
              - paragraph [ref=f16e164]: Accuracy of your attempts and correctness of the final text answer different questions. Displayed values are rounded; exports retain precision.
            - link "Check your keyboard →" [ref=f16e165] [cursor=pointer]:
              - /url: /keyboard-lab
          - generic [ref=f16e166]:
            - generic [ref=f16e167]:
              - term [ref=f16e168]: Input accuracy
              - definition [ref=f16e169]: 3 correct ÷ 4 insertion attempts × 100 = 75.0%
            - generic [ref=f16e170]:
              - term [ref=f16e171]: Final text accuracy
              - definition [ref=f16e172]: 3 correct ÷ 3 processed positions × 100 = 100.0%
            - generic [ref=f16e173]:
              - term [ref=f16e174]: Credited WPM
              - definition [ref=f16e175]: 3 credited characters ÷ 5 ÷ 0.005015 minutes = 119.6 WPM
            - generic [ref=f16e176]:
              - term [ref=f16e177]: Raw WPM
              - definition [ref=f16e178]: 3 retained characters ÷ 5 ÷ 0.005015 minutes = 119.6 WPM
            - generic [ref=f16e179]:
              - term [ref=f16e180]: Attempt rate
              - definition [ref=f16e181]: 4 inserted characters ÷ 5 ÷ 0.005015 minutes = 159.5 WPM
          - paragraph [ref=f16e182]: 1 incorrect insertion attempts remain in input accuracy even after corrections. Final text has 0 incorrect, 0 extra and 0 missed positions. 0 untouched future positions are excluded. Deletions are separate actions.
          - paragraph [ref=f16e183]: WPM credits eligible words, not raw speed multiplied by accuracy. Character totals and insertion attempts can differ after edits or word skips. Consistency describes your rhythm under Forge’s formula; it is not an accuracy score or directly interchangeable with another site’s consistency.
          - button "Inspect session evidence" [ref=f16e184]
        - generic [ref=f16e185]:
          - generic [ref=f16e186]:
            - heading "Characters, accounted for" [level=2] [ref=f16e187]
            - generic [ref=f16e188]:
              - generic [ref=f16e189]:
                - text: "3"
                - generic [ref=f16e190]: correct
              - generic [ref=f16e191]:
                - text: "0"
                - generic [ref=f16e192]: incorrect
              - generic [ref=f16e193]:
                - text: "0"
                - generic [ref=f16e194]: extra
              - generic [ref=f16e195]:
                - text: "0"
                - generic [ref=f16e196]: missed
            - paragraph [ref=f16e197]: 0 untyped · 1 deletion actions · 1 deleted characters
          - generic [ref=f16e198]:
            - heading "Practice insight" [level=2] [ref=f16e199]
            - paragraph [ref=f16e200]: 1 incorrect insertion attempt remains in your input accuracy. 1 character was removed while editing.
            - link "Build accuracy with a focused lesson" [ref=f16e201] [cursor=pointer]:
              - /url: /learn?keys=a&source=84a51344-b8c5-4a98-b3d3-067145327a63&language=en&layout=qwerty&retest=%2F%3Fretest%3D84a51344-b8c5-4a98-b3d3-067145327a63
        - group [ref=f16e204]:
          - generic "Final-text keyboard map Measured final characters only. Untyped keys have no color." [ref=f16e205] [cursor=pointer]:
            - text: Final-text keyboard map
            - generic [ref=f16e206]: Measured final characters only. Untyped keys have no color.
        - group [ref=f16e207]:
          - generic "Session details & comparison eligibility" [ref=f16e208] [cursor=pointer]
        - status [ref=f16e211]:
          - generic [ref=f16e214]: Private content saved on this device. Cloud storage requires your consent.
        - generic [ref=f16e215]:
          - generic [ref=f16e216]:
            - button "Next test" [ref=f16e217]
            - button "Repeat passage" [ref=f16e221]
          - generic [ref=f16e222]:
            - button "Share image" [ref=f16e223]
            - button "Export JSON" [ref=f16e227]
        - paragraph [ref=f16e228]: Tab → Enter starts the next test.
        - status
    - contentinfo [ref=f16e229]:
      - generic [ref=f16e230]:
        - generic [ref=f16e231]:
          - generic [ref=f16e232]:
            - generic [ref=f16e233]: Sparow
            - generic [ref=f16e234]: Type
          - text: Find your rhythm.
        - generic [ref=f16e235]:
          - link "About & metrics" [ref=f16e236] [cursor=pointer]:
            - /url: /about
          - link "Preferences & data" [ref=f16e237] [cursor=pointer]:
            - /url: /settings
          - link "Touch typing guide" [ref=f16e238] [cursor=pointer]:
            - /url: /touch-typing
          - link "Privacy" [ref=f16e239] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=f16e240] [cursor=pointer]:
            - /url: /terms
          - link "Offline" [ref=f16e241] [cursor=pointer]:
            - /url: /offline
          - generic [ref=f16e242]: SparowType © 2026
  - generic [aria-hidden] [ref=f16e243]: "0"
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
     |                                                                                                      ^ Error: /auth at 1440px: [{"id":"color-contrast","impact":"serious","help":"Elements must meet minimum color contrast ratio thresholds","nodes":[{"target":[".mb-8 > p"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:bg-accent"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.36 (foreground color: #636367, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".my-5"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 9.0pt (12px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"email\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["label[for=\"password\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.3 (foreground color: #636367, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".bg-primary"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 3.35 (foreground color: #07070a, background color: #546b1f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":[".hover\\:text-foreground[type=\"button\"]"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.81 (foreground color: #3c3c46, background color: #0a0a0e, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"},{"target":["a"],"failureSummary":"Fix any of the following:\n  Element has insufficient color contrast of 1.84 (foreground color: #3c3c46, background color: #07070a, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1"}]}]
  41 |     }
  42 |     await info.attach("automated-accessibility-scope", {
  43 |       body: JSON.stringify({ receipts, limitation: "Automated WCAG-tagged checks only. Incomplete rules need manual review; this does not establish native screen-reader or full WCAG conformance." }, null, 2),
  44 |       contentType: "application/json",
  45 |     });
  46 |   });
  47 | }
  48 | 
```