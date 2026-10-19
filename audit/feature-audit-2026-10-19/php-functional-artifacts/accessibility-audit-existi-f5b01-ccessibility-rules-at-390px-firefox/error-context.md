# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-audit.spec.ts >> existing guest pages and completed results meet automated accessibility rules at 390px
- Location: e2e\accessibility-audit.spec.ts:12:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main#main-content')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('main#main-content') with timeout 5000ms
  - waiting for locator('main#main-content')

```

```yaml
- main "Typing workspace":
  - status: Preparing your typing workspace…
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
> 19 |       await expect(page.locator("main#main-content")).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  20 |       // Measure settled controls rather than a transient, partially opaque entrance frame.
  21 |       if (route === "/auth") await expect(page.locator("main > div")).toHaveCSS("opacity", "1");
  22 |       // Evaluate through the test driver; keep the application’s strict script CSP intact.
  23 |       await page.evaluate(axe.source);
  24 |       const result = await page.evaluate(async () => {
  25 |         const engine = (window as Window & { axe: typeof axe }).axe;
  26 |         const report = await engine.run(document, {
  27 |           runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
  28 |         });
  29 |         return {
  30 |           violations: report.violations.map(({ id, impact, help, nodes }) => ({
  31 |             id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  32 |           })),
  33 |           incomplete: report.incomplete.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
  34 |           passes: report.passes.length,
  35 |           version: engine.version,
  36 |         };
  37 |       });
  38 |       receipts.push({ route, width, ...result });
  39 |       await info.attach(`automated-accessibility-${route.replaceAll("/", "_") || "home"}`, {
  40 |         body: JSON.stringify(receipts.at(-1), null, 2), contentType: "application/json",
  41 |       });
  42 |       expect.soft(result.violations, `${route} at ${width}px: ${JSON.stringify(result.violations)}`).toEqual([]);
  43 |     }
  44 |     await info.attach("automated-accessibility-scope", {
  45 |       body: JSON.stringify({ receipts, limitation: "Automated WCAG-tagged checks only. Incomplete rules need manual review; this does not establish native screen-reader or full WCAG conformance." }, null, 2),
  46 |       contentType: "application/json",
  47 |     });
  48 |   });
  49 | }
  50 | 
```