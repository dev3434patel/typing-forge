# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> every theme provides opaque, readable native language options
- Location: e2e\responsive-layout.spec.ts:43:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('combobox', { name: 'Language', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('combobox', { name: 'Language', exact: true }) with timeout 5000ms
  - waiting for getByRole('combobox', { name: 'Language', exact: true })

```

```yaml
- status: Loading your workspace…
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | async function expectPageFits(page: Page) {
  5   |   await page.locator("#main-content").waitFor();
  6   |   await page.waitForFunction(
  7   |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "SparowType"),
  8   |     undefined,
  9   |     { timeout: 10_000 },
  10  |   );
  11  |   const dimensions = await page.evaluate(() => ({
  12  |     viewport: document.documentElement.clientWidth,
  13  |     document: document.documentElement.scrollWidth,
  14  |     body: document.body.scrollWidth,
  15  |     offenders: Array.from(document.querySelectorAll("main, header, footer"))
  16  |       .filter((element) => {
  17  |         const rect = element.getBoundingClientRect();
  18  |         return rect.left < -1 || rect.right > innerWidth + 1;
  19  |       })
  20  |       .map((element) => element.tagName),
  21  |   }));
  22  |   expect(dimensions.document, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  23  |   expect(dimensions.body, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  24  |   expect(dimensions.offenders, page.url()).toEqual([]);
  25  | }
  26  | 
  27  | for (const width of [320, 390, 768, 1440]) {
  28  |   test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
  29  |     test.setTimeout(90_000);
  30  |     await page.setViewportSize({ width, height: 900 });
  31  |     for (const route of [
  32  |       "/", "/learn", "/race", "/stats", "/settings", "/keyboard-lab",
  33  |       "/leaderboard", "/ranked", "/profile", "/auth", "/about",
  34  |     ]) {
  35  |       await test.step(route, async () => {
  36  |         await page.goto(route, { waitUntil: "domcontentloaded" });
  37  |         await expectPageFits(page);
  38  |       });
  39  |     }
  40  |   });
  41  | }
  42  | 
  43  | test("every theme provides opaque, readable native language options", async ({ page }) => {
  44  |   test.setTimeout(180_000);
  45  |   for (const [id, name, scheme] of [
  46  |     ["sparow-dark", "Sparow dark", "dark"],
  47  |     ["sparow-light", "Sparow light", "light"],
  48  |     ["graphite", "Graphite", "dark"],
  49  |     ["midnight-blue", "Midnight blue", "dark"],
  50  |     ["ember", "Ember", "dark"],
  51  |     ["mono-ink", "Mono ink", "dark"],
  52  |     ["paper", "Paper", "light"],
  53  |     ["aurora", "Aurora", "dark"],
  54  |   ]) {
  55  |     await page.goto("/settings", { waitUntil: "domcontentloaded" });
  56  |     await page.getByRole("button", { name, exact: false }).click();
  57  |     await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  58  |     await page.goto("/", { waitUntil: "domcontentloaded" });
  59  |     const select = page.getByRole("combobox", { name: "Language", exact: true });
> 60  |     await expect(select).toBeVisible();
      |                          ^ Error: expect(locator).toBeVisible() failed
  61  |     const menu = await select.evaluate((element) => {
  62  |       const control = element as HTMLSelectElement;
  63  |       const option = getComputedStyle(control.options[1]);
  64  |       const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  65  |       const luminance = (color: string) => components(color).slice(0, 3)
  66  |         .map((value) => value / 255)
  67  |         .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  68  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  69  |       const foreground = luminance(option.color);
  70  |       const background = luminance(option.backgroundColor);
  71  |       return {
  72  |         scheme: getComputedStyle(control).colorScheme,
  73  |         background: components(option.backgroundColor),
  74  |         contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
  75  |       };
  76  |     });
  77  |     expect(menu.scheme, name).toBe(scheme);
  78  |     expect(menu.background[3] ?? 1, name).toBe(1);
  79  |     expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  80  |   }
  81  |   // Native keyboard selection still changes the content and survives reload.
  82  |   const select = page.getByRole("combobox", { name: "Language", exact: true });
  83  |   await select.focus();
  84  |   await select.press("Home");
  85  |   await select.press("ArrowDown");
  86  |   await select.press("Enter");
  87  |   await expect(select).toHaveValue("es");
  88  |   await page.reload({ waitUntil: "domcontentloaded" });
  89  |   await page.locator("#main-content").waitFor();
  90  |   await expect(select).toHaveValue("es");
  91  | });
  92  | 
  93  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  94  |   test.setTimeout(90_000);
  95  |   await page.setViewportSize({ width: 320, height: 568 });
  96  |   await page.goto("/", { waitUntil: "domcontentloaded" });
  97  |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  98  |     await page.getByRole("group", { name: "Test mode", exact: true })
  99  |       .getByRole("button", { name: mode, exact: true }).click();
  100 |     await expectPageFits(page);
  101 |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  102 |     for (const control of await toolbar.locator("button, select").all()) {
  103 |       const rect = await control.boundingBox();
  104 |       expect(rect).not.toBeNull();
  105 |       expect(Math.round(rect!.height)).toBeGreaterThanOrEqual(44);
  106 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  107 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  108 |     }
  109 |     if (mode === "Code") {
  110 |       await page.getByRole("combobox", { name: "Code language" }).selectOption("python");
  111 |       await page.screenshot({ path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`, fullPage: true });
  112 |     }
  113 |   }
  114 |   await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("gu-Latn");
  115 |   await expectPageFits(page);
  116 | });
  117 | 
  118 | test("narrow results retain the whole keyboard map and expanded evidence", async ({ page }, info) => {
  119 |   test.setTimeout(90_000);
  120 |   await page.setViewportSize({ width: 320, height: 760 });
  121 |   await completeCorrectedCat(page);
  122 |   await expectPageFits(page);
  123 |   const map = page.locator("details").filter({
  124 |     has: page.locator("summary", { hasText: "Final-text keyboard map" }),
  125 |   });
  126 |   await map.locator("summary").click();
  127 |   const keysFit = await map.evaluate((element) => {
  128 |     const parent = element.getBoundingClientRect();
  129 |     return Array.from(element.querySelectorAll("span[title]"))
  130 |       .filter((key) => key.getBoundingClientRect().width > 0)
  131 |       .every((key) => {
  132 |         const rect = key.getBoundingClientRect();
  133 |         return rect.left >= parent.left && rect.right <= parent.right;
  134 |       });
  135 |   });
  136 |   expect(keysFit).toBe(true);
  137 |   const speed = await page.getByText("Words per minute", { exact: true }).locator("..").boundingBox();
  138 |   const accuracy = await page.getByText("Input accuracy", { exact: true }).first().locator("..").boundingBox();
  139 |   expect(speed!.y + speed!.height).toBeLessThanOrEqual(accuracy!.y);
  140 |   await page.getByRole("button", { name: "Inspect session evidence", exact: true }).click();
  141 |   const table = page.getByRole("region", { name: "Word credit table", exact: true });
  142 |   await table.focus();
  143 |   await expect(table).toBeFocused();
  144 |   expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  145 |   await page.getByRole("button", { name: "Replay edits", exact: true }).click();
  146 |   await page.getByRole("slider", { name: "Replay position", exact: true }).press("End");
  147 |   await page.getByText("Recorded edit events", { exact: true }).click();
  148 |   const events = page.getByRole("region", { name: "Recorded edit event table", exact: true });
  149 |   await events.focus();
  150 |   await expect(events).toBeFocused();
  151 |   await page.getByText("Session details & comparison eligibility", { exact: false }).click();
  152 |   await expectPageFits(page);
  153 |   await page.screenshot({ path: `audit/responsive-2026-10-16/results-320-${info.project.name}.png`, fullPage: true });
  154 | });
  155 | 
  156 | test("race and learning remain usable after landscape and narrow resize", async ({ page }) => {
  157 |   test.setTimeout(90_000);
  158 |   await page.setViewportSize({ width: 568, height: 320 });
  159 |   await page.goto("/race", { waitUntil: "domcontentloaded" });
  160 |   await page.getByRole("button", { name: "Start bot practice", exact: true }).click();
```