# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-pages.spec.ts >> populated history, comparison chart and account controls fit narrow and tablet screens
- Location: e2e\responsive-pages.spec.ts:19:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('table', { name: 'Completed sessions, most recent first', exact: true }).getByRole('row')
Expected: 2
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('table', { name: 'Completed sessions, most recent first', exact: true }).getByRole('row') with timeout 5000ms
  - waiting for getByRole('table', { name: 'Completed sessions, most recent first', exact: true }).getByRole('row')
    12 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- status [ref=f3e3]: Loading your workspace…
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { completeCorrectedCat } from "./helpers";
  3  | 
  4  | async function expectViewportFit(page: Page) {
  5  |   await page.waitForFunction(
  6  |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "Typing Forge"),
  7  |     undefined,
  8  |     { timeout: 10_000 },
  9  |   );
  10 |   const dimensions = await page.evaluate(() => ({
  11 |     document: document.documentElement.scrollWidth,
  12 |     body: document.body.scrollWidth,
  13 |     viewport: document.documentElement.clientWidth,
  14 |   }));
  15 |   expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  16 |   expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  17 | }
  18 | 
  19 | test("populated history, comparison chart and account controls fit narrow and tablet screens", async ({ page }, info) => {
  20 |   test.setTimeout(90_000);
  21 |   await page.setViewportSize({ width: 320, height: 800 });
  22 |   await completeCorrectedCat(page);
  23 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  24 | 
  25 |   for (const width of [320, 768]) {
  26 |     await page.setViewportSize({ width, height: 800 });
  27 |     await page.goto("/stats", { waitUntil: "domcontentloaded" });
  28 |     const history = page.getByRole("table", { name: "Completed sessions, most recent first", exact: true });
> 29 |     await expect(history.getByRole("row")).toHaveCount(2);
     |                                            ^ Error: expect(locator).toHaveCount(expected) failed
  30 |     await expect(history.getByRole("row").nth(1)).toContainText("75.0%");
  31 |     await page.getByRole("combobox", { name: "Comparison", exact: true }).selectOption({ index: 1 });
  32 |     const chart = page.getByRole("img", { name: /Typing speed for 1 matched sessions/ });
  33 |     await expect(chart).toBeVisible();
  34 |     await expect(chart.locator("svg").first()).toBeVisible();
  35 |     const calendar = page.getByRole("heading", { name: "Recent practice days", exact: true }).locator("..");
  36 |     await expect(calendar.locator("[tabindex='0']")).toHaveCount(35);
  37 |     expect(await calendar.evaluate((element) => {
  38 |       const panel = element.getBoundingClientRect();
  39 |       return Array.from(element.querySelectorAll("[tabindex='0']")).every((day) => {
  40 |         const rect = day.getBoundingClientRect();
  41 |         return rect.left >= panel.left && rect.right <= panel.right;
  42 |       });
  43 |     })).toBe(true);
  44 |     await expectViewportFit(page);
  45 |     const scroller = history.locator("..");
  46 |     await scroller.scrollIntoViewIfNeeded();
  47 |     await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  48 |     await expect(history.getByRole("columnheader", { name: "Save state", exact: true })).toBeInViewport();
  49 |     if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/stats-populated-320-${info.project.name}.png`, fullPage: true });
  50 | 
  51 |     await page.goto("/profile", { waitUntil: "domcontentloaded" });
  52 |     await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  53 |     await expect(page.getByText("1 saved sessions", { exact: false })).toBeVisible();
  54 |     await expect(page.getByRole("button", { name: /^Delete custom session from/ })).toBeVisible();
  55 |     const settings = page.getByRole("link", { name: "Practice & appearance settings", exact: true });
  56 |     const bounds = await settings.boundingBox();
  57 |     expect(bounds).not.toBeNull();
  58 |     expect(bounds!.x).toBeGreaterThanOrEqual(0);
  59 |     expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  60 |     await expectViewportFit(page);
  61 |     if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/profile-populated-320-${info.project.name}.png`, fullPage: true });
  62 |   }
  63 | });
  64 | 
```