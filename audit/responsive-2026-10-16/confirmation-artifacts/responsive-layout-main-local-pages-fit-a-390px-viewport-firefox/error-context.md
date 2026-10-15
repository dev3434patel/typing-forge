# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 390px viewport
- Location: e2e\responsive-layout.spec.ts:26:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.evaluate: Test timeout of 90000ms exceeded.
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | async function expectPageFits(page: Page) {
  5   |   await page.locator("#main-content").waitFor();
> 6   |   await page.evaluate(() => document.fonts.ready);
      |              ^ Error: page.evaluate: Test timeout of 90000ms exceeded.
  7   |   const dimensions = await page.evaluate(() => ({
  8   |     viewport: document.documentElement.clientWidth,
  9   |     document: document.documentElement.scrollWidth,
  10  |     body: document.body.scrollWidth,
  11  |     offenders: Array.from(document.querySelectorAll("main, header, footer"))
  12  |       .filter((element) => {
  13  |         const rect = element.getBoundingClientRect();
  14  |         return rect.left < -1 || rect.right > innerWidth + 1;
  15  |       })
  16  |       .map((element) => element.tagName),
  17  |   }));
  18  |   expect(dimensions, await page.url()).toMatchObject({
  19  |     document: dimensions.viewport,
  20  |     body: dimensions.viewport,
  21  |     offenders: [],
  22  |   });
  23  | }
  24  | 
  25  | for (const width of [320, 390, 768, 1440]) {
  26  |   test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
  27  |     test.setTimeout(90_000);
  28  |     await page.setViewportSize({ width, height: 900 });
  29  |     for (const route of [
  30  |       "/", "/learn", "/race", "/stats", "/settings", "/keyboard-lab",
  31  |       "/leaderboard", "/ranked", "/profile", "/auth", "/about",
  32  |     ]) {
  33  |       await test.step(route, async () => {
  34  |         await page.goto(route);
  35  |         await expectPageFits(page);
  36  |       });
  37  |     }
  38  |   });
  39  | }
  40  | 
  41  | test("every theme provides opaque, readable native language options", async ({ page }) => {
  42  |   test.setTimeout(180_000);
  43  |   for (const [id, name, scheme] of [
  44  |     ["forge-dark", "Forge dark", "dark"],
  45  |     ["forge-light", "Forge light", "light"],
  46  |     ["graphite", "Graphite", "dark"],
  47  |     ["midnight-blue", "Midnight blue", "dark"],
  48  |     ["ember", "Ember", "dark"],
  49  |     ["mono-ink", "Mono ink", "dark"],
  50  |     ["paper", "Paper", "light"],
  51  |     ["aurora", "Aurora", "dark"],
  52  |   ]) {
  53  |     await page.goto("/settings");
  54  |     await page.getByRole("button", { name, exact: false }).click();
  55  |     await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  56  |     await page.goto("/");
  57  |     const select = page.getByRole("combobox", { name: "Language", exact: true });
  58  |     await expect(select).toBeVisible();
  59  |     const menu = await select.evaluate((element) => {
  60  |       const control = element as HTMLSelectElement;
  61  |       const option = getComputedStyle(control.options[1]);
  62  |       const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  63  |       const luminance = (color: string) => components(color).slice(0, 3)
  64  |         .map((value) => value / 255)
  65  |         .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  66  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  67  |       const foreground = luminance(option.color);
  68  |       const background = luminance(option.backgroundColor);
  69  |       return {
  70  |         scheme: getComputedStyle(control).colorScheme,
  71  |         background: components(option.backgroundColor),
  72  |         contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
  73  |       };
  74  |     });
  75  |     expect(menu.scheme, name).toBe(scheme);
  76  |     expect(menu.background[3] ?? 1, name).toBe(1);
  77  |     expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  78  |   }
  79  |   // Native keyboard selection still changes the content and survives reload.
  80  |   const select = page.getByRole("combobox", { name: "Language", exact: true });
  81  |   await select.focus();
  82  |   await select.press("Home");
  83  |   await select.press("ArrowDown");
  84  |   await select.press("Enter");
  85  |   await expect(select).toHaveValue("es");
  86  |   await page.reload();
  87  |   await expect(select).toHaveValue("es");
  88  | });
  89  | 
  90  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  91  |   test.setTimeout(90_000);
  92  |   await page.setViewportSize({ width: 320, height: 568 });
  93  |   await page.goto("/");
  94  |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  95  |     await page.getByRole("group", { name: "Test mode", exact: true })
  96  |       .getByRole("button", { name: mode, exact: true }).click();
  97  |     await expectPageFits(page);
  98  |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  99  |     for (const control of await toolbar.locator("button, select").all()) {
  100 |       const rect = await control.boundingBox();
  101 |       expect(rect).not.toBeNull();
  102 |       expect(rect!.height).toBeGreaterThanOrEqual(44);
  103 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  104 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  105 |     }
  106 |     if (mode === "Code") {
```