import { expect, test } from "@playwright/test";
import axe from "axe-core";
import { completeCorrectedCat, settlePageVisuals } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

for (const width of [390, 1440]) {
  test(`existing guest pages and completed results meet automated accessibility rules at ${width}px`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const receipts = [];
    for (const route of ["/", "/learn", "/race", "/ranked", "/stats", "/profile", "/leaderboard", "/settings", "/auth", "/keyboard-lab", "/about", "/privacy", "/terms", "/touch-typing", "/offline", "/missing-page", "completed-results"]) {
      if (route === "completed-results") await completeCorrectedCat(page);
      else await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main#main-content")).toBeVisible();
      await settlePageVisuals(page);
      // Evaluate through the test driver; keep the application’s strict script CSP intact.
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => {
        const engine = (window as Window & { axe: typeof axe }).axe;
        const report = await engine.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        });
        return {
          violations: report.violations.map(({ id, impact, help, nodes }) => ({
            id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
          })),
          incomplete: report.incomplete.map(({ id, nodes }) => ({ id, nodeCount: nodes.length })),
          passes: report.passes.length,
          version: engine.version,
        };
      });
      receipts.push({ route, width, ...result });
      await info.attach(`automated-accessibility-${route.replaceAll("/", "_") || "home"}`, {
        body: JSON.stringify(receipts.at(-1), null, 2), contentType: "application/json",
      });
      expect.soft(result.violations, `${route} at ${width}px: ${JSON.stringify(result.violations)}`).toEqual([]);
    }
    await info.attach("automated-accessibility-scope", {
      body: JSON.stringify({ receipts, limitation: "Automated WCAG-tagged checks only. Incomplete rules need manual review; this does not establish native screen-reader or full WCAG conformance." }, null, 2),
      contentType: "application/json",
    });
  });
}
