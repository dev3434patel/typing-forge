import { expect, test } from "@playwright/test";
import axe from "axe-core";
import path from "node:path";
import { startFrontendStaticServer } from "./frontend-static-server";

const outputs = (process.env.SPAROWTYPE_STATIC_OUTPUTS || "").split(",").filter(Boolean);
test.skip(outputs.length === 0, "Build and select a dedicated frontend-only artifact first.");
for (const directory of outputs) for (const width of [390, 1440]) {
  test(`${directory} game states meet automated accessibility rules at ${width}px`, async ({ page }, info) => {
    const server = await startFrontendStaticServer(directory);
    const readings: { state: string; violations: unknown[] }[] = [];
    try {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
      await page.goto(new URL("games", server.baseURL).href);
      await expect(page.getByTestId("signal-run")).toHaveAttribute("data-phase", "ready");
      const scan = async (state: string) => {
        await page.evaluate(async () => { await document.fonts.ready; });
        await page.evaluate(axe.source);
        const result = await page.evaluate(async () => {
          const tool = (window as typeof window & { axe: typeof axe }).axe;
          const result = await tool.run(document);
          return result.violations.map(value => ({ id: value.id, impact: value.impact, description: value.description, nodes: value.nodes.map(node => ({ html: node.html, failureSummary: node.failureSummary })) }));
        });
        readings.push({ state, violations: result });
      };
      await scan("ready");
      if (width === 1440) await page.screenshot({ path: path.resolve(`audit/mobile-games-static-2026-10-20/static-${server.deployment.target}-games-ready-1440.png`), fullPage: true });
      await page.getByRole("button", { name: "Start calm journey", exact: true }).click();
      const input = page.getByRole("textbox", { name: "Your word", exact: true });
      const word = (await page.getByTestId("game-target").getAttribute("aria-label"))!.replace("Target word: ", "");
      await input.pressSequentially(word);
      await input.press("Enter");
      await scan("playing");
      if (width === 390) await page.screenshot({ path: path.resolve(`audit/mobile-games-static-2026-10-20/static-${server.deployment.target}-games-playing-390.png`), fullPage: true });
      await page.getByRole("button", { name: "End run", exact: true }).click();
      await expect(page.getByTestId("game-result")).toBeVisible();
      await scan("completed");
      await info.attach("static-game-accessibility", { body: JSON.stringify({ target: server.deployment, width, readings }, null, 2), contentType: "application/json" });
      expect(readings.flatMap(value => value.violations)).toEqual([]);
    } finally { await server.stop(); }
  });
}
