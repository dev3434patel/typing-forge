import { expect, test, type Page } from "@playwright/test";
import { completeCorrectedCat } from "./helpers";

async function expectViewportFit(page: Page) {
  await page.waitForFunction(
    () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "Typing Forge"),
    undefined,
    { timeout: 10_000 },
  );
  const dimensions = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test("populated history, comparison chart and account controls fit narrow and tablet screens", async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 800 });
  await completeCorrectedCat(page);
  await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();

  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/stats", { waitUntil: "domcontentloaded" });
    await page.locator("#main-content").waitFor();
    const history = page.getByRole("table", { name: "Completed sessions, most recent first", exact: true });
    await expect(history.getByRole("row")).toHaveCount(2);
    await expect(history.getByRole("row").nth(1)).toContainText("75.0%");
    await page.getByRole("combobox", { name: "Comparison", exact: true }).selectOption({ index: 1 });
    const chart = page.getByRole("img", { name: /Typing speed for 1 matched sessions/ });
    await expect(chart).toBeVisible();
    await expect(chart.locator("svg").first()).toBeVisible();
    const calendar = page.getByRole("heading", { name: "Recent practice days", exact: true }).locator("..");
    await expect(calendar.locator("[tabindex='0']")).toHaveCount(35);
    expect(await calendar.evaluate((element) => {
      const panel = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll("[tabindex='0']")).every((day) => {
        const rect = day.getBoundingClientRect();
        return rect.left >= panel.left && rect.right <= panel.right;
      });
    })).toBe(true);
    await expectViewportFit(page);
    const scroller = history.locator("..");
    await scroller.scrollIntoViewIfNeeded();
    await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect(history.getByRole("columnheader", { name: "Save state", exact: true })).toBeInViewport();
    if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/stats-populated-320-${info.project.name}.png`, fullPage: true });

    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await page.locator("#main-content").waitFor();
    await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
    await expect(page.getByText("1 saved sessions", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete custom session from/ })).toBeVisible();
    const settings = page.getByRole("link", { name: "Practice & appearance settings", exact: true });
    const bounds = await settings.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await expectViewportFit(page);
    if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/profile-populated-320-${info.project.name}.png`, fullPage: true });
  }
});
