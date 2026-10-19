# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-accessibility.spec.ts >> the command palette stays inside a landscape phone viewport and supports touch dismissal
- Location: e2e\navigation-accessibility.spec.ts:61:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Replay opening animation', exact: true })
Expected: focused
Received: inactive
Timeout:  5000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'Replay opening animation', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Replay opening animation', exact: true })
    14 × locator resolved to <button type="button" id="sparowtype-replay-opening" class="forge-button-secondary">…</button>
       - unexpected value "inactive"

```

```yaml
- button "Replay opening animation"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   await page.addInitScript(() =>
  5  |     localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  6  |   );
  7  | });
  8  | 
  9  | test("practice aliases identify the current workspace in desktop and mobile navigation", async ({ page }) => {
  10 |   test.setTimeout(90_000);
  11 |   for (const width of [390, 1440]) {
  12 |     await page.setViewportSize({ width, height: 900 });
  13 |     for (const [route, label] of [
  14 |       ["/typing-test", "Test"],
  15 |       ["/typing-practice", "Learn"],
  16 |       ["/practice/", "Learn"],
  17 |     ]) {
  18 |       await page.goto(route, { waitUntil: "domcontentloaded" });
  19 |       const navigation = page.getByRole("navigation", {
  20 |         name: width < 1280 ? "Mobile navigation" : "Main navigation",
  21 |         exact: true,
  22 |       });
  23 |       await expect(navigation.getByRole("link", { name: label, exact: true }))
  24 |         .toHaveAttribute("aria-current", "page");
  25 |       await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  26 |     }
  27 |     await page.getByRole("navigation", {
  28 |       name: width < 1280 ? "Mobile navigation" : "Main navigation",
  29 |       exact: true,
  30 |     }).getByRole("link", { name: "Stats", exact: true }).click();
  31 |     await expect(page).toHaveURL(/\/stats$/);
  32 |     await expect(page.getByRole("navigation", {
  33 |       name: width < 1280 ? "Mobile navigation" : "Main navigation",
  34 |       exact: true,
  35 |     }).getByRole("link", { name: "Stats", exact: true }))
  36 |       .toHaveAttribute("aria-current", "page");
  37 |   }
  38 | });
  39 | 
  40 | test("keyboard users can pan the narrow keyboard lab diagram", async ({ page }) => {
  41 |   await page.setViewportSize({ width: 390, height: 844 });
  42 |   await page.goto("/keyboard-lab", { waitUntil: "domcontentloaded" });
  43 |   const keyboard = page.getByRole("region", {
  44 |     name: "Physical key observations",
  45 |     exact: true,
  46 |   });
  47 |   await expect(keyboard).toBeVisible();
  48 |   expect(await keyboard.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  49 |   await keyboard.focus();
  50 |   await expect(keyboard).toBeFocused();
  51 |   await keyboard.press("ArrowRight");
  52 |   await expect.poll(() => keyboard.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  53 |   const intervals = page.getByRole("region", {
  54 |     name: "Observed transition intervals",
  55 |     exact: true,
  56 |   });
  57 |   await intervals.focus();
  58 |   await expect(intervals).toBeFocused();
  59 | });
  60 | 
  61 | test("the command palette stays inside a landscape phone viewport and supports touch dismissal", async ({ page }) => {
  62 |   await page.setViewportSize({ width: 568, height: 320 });
  63 |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  64 |   const origin = page.getByRole("button", { name: "Replay opening animation", exact: true });
  65 |   await origin.focus();
  66 |   await page.keyboard.press("ControlOrMeta+k");
  67 |   const dialog = page.getByRole("dialog", { name: "SparowType commands", exact: true });
  68 |   await expect(dialog).toBeVisible();
  69 |   const bounds = await dialog.boundingBox();
  70 |   expect(bounds).not.toBeNull();
  71 |   expect(bounds!.y).toBeGreaterThanOrEqual(0);
  72 |   expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(321);
  73 |   // Preserve the entrance bounds assertion above, then measure the settled touch target.
  74 |   await expect.poll(() => dialog.evaluate(element => element.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  75 |   const close = dialog.getByRole("button", { name: "Close", exact: true });
  76 |   const target = await close.boundingBox();
  77 |   expect(target).not.toBeNull();
  78 |   expect(target!.width).toBeGreaterThanOrEqual(44);
  79 |   expect(target!.height).toBeGreaterThanOrEqual(44);
  80 |   await close.click();
  81 |   await expect(dialog).toBeHidden();
> 82 |   await expect(origin).toBeFocused();
     |                        ^ Error: expect(locator).toBeFocused() failed
  83 | });
  84 | 
```