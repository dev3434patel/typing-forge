# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sparowtype-brand.spec.ts >> legacy light preferences migrate without resetting language, layout or text size
- Location: e2e\sparowtype-brand.spec.ts:46:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Switch to light theme', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Switch to light theme', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Switch to light theme', exact: true })

```

```yaml
- status: Loading your workspace…
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | const INTRO_PREFERENCE_KEY = "sparowtype.opening-animation.enabled";
  4   | // Keep the existing owner-scoped key: the rebrand must retain stored choices.
  5   | const GUEST_PREFERENCES_KEY = "typingforge:v3:guest:preferences";
  6   | 
  7   | test.beforeEach(async ({ page }) => {
  8   |   await page.addInitScript((key) => {
  9   |     localStorage.setItem(key, "false");
  10  |   }, INTRO_PREFERENCE_KEY);
  11  | });
  12  | 
  13  | async function expectMainTheme(page: Page, theme: "dark" | "light") {
  14  |   await expect(page.locator("html")).toHaveAttribute("data-theme", `sparow-${theme}`);
  15  |   await expect(page.getByRole("button", {
  16  |     name: theme === "light" ? "Switch to dark theme" : "Switch to light theme",
  17  |     exact: true,
> 18  |   })).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  19  |   expect(await page.locator("html").evaluate((element) => getComputedStyle(element).colorScheme)).toBe(theme);
  20  | }
  21  | 
  22  | test("SparowType identity and the header theme choice persist across reload", async ({ page }) => {
  23  |   await page.goto("/", { waitUntil: "domcontentloaded" });
  24  |   const home = page.getByRole("link", { name: "SparowType home", exact: true });
  25  |   await expect(home).toBeVisible();
  26  |   await expect(home.locator("svg")).toBeVisible();
  27  |   await expect(home.locator(".brand-wordmark")).toHaveText("SparowType");
  28  |   await expect(page).toHaveTitle("Practice · SparowType");
  29  |   await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/sparowtype.svg");
  30  |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  31  | 
  32  |   await expectMainTheme(page, "dark");
  33  |   await page.getByRole("button", { name: "Switch to light theme", exact: true }).click();
  34  |   await expectMainTheme(page, "light");
  35  |   await page.reload({ waitUntil: "domcontentloaded" });
  36  |   await expectMainTheme(page, "light");
  37  |   await expect(page).toHaveTitle("Practice · SparowType");
  38  |   await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#F6F7FA");
  39  | 
  40  |   await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
  41  |   await page.reload({ waitUntil: "domcontentloaded" });
  42  |   await expectMainTheme(page, "dark");
  43  |   await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0B0D12");
  44  | });
  45  | 
  46  | test("legacy light preferences migrate without resetting language, layout or text size", async ({ page }) => {
  47  |   await page.addInitScript((key) => {
  48  |     // Seed only the first load; a later reload must read the real saved update.
  49  |     if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
  50  |       schemaVersion: 3,
  51  |       values: { theme: "forge-light", language: "es", fontSize: 32, layout: "dvorak" },
  52  |       pending: {},
  53  |       cloudVersion: 0,
  54  |       updatedAt: 100,
  55  |     }));
  56  |   }, GUEST_PREFERENCES_KEY);
  57  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  58  |   await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  59  |   await expectMainTheme(page, "light");
  60  |   await expect(page.getByRole("button", { name: /Sparow light$/ })).toHaveAttribute("aria-pressed", "true");
  61  |   const language = page.getByRole("combobox", { name: "Practice language", exact: true });
  62  |   const layout = page.getByRole("combobox", { name: "Keyboard layout", exact: true });
  63  |   const textSize = page.getByRole("slider", { name: "Text size", exact: true });
  64  |   await expect(language).toHaveValue("es");
  65  |   await expect(layout).toHaveValue("dvorak");
  66  |   await expect(textSize).toHaveValue("32");
  67  | 
  68  |   await page.getByRole("button", { name: "Switch to dark theme", exact: true }).click();
  69  |   await expectMainTheme(page, "dark");
  70  |   await page.reload({ waitUntil: "domcontentloaded" });
  71  |   await expectMainTheme(page, "dark");
  72  |   await expect(language).toHaveValue("es");
  73  |   await expect(layout).toHaveValue("dvorak");
  74  |   await expect(textSize).toHaveValue("32");
  75  |   await expect.poll(() => page.evaluate((key) => {
  76  |     return JSON.parse(localStorage.getItem(key) || "null")?.values;
  77  |   }, GUEST_PREFERENCES_KEY)).toMatchObject({
  78  |     theme: "sparow-dark", language: "es", fontSize: 32, layout: "dvorak",
  79  |   });
  80  | });
  81  | 
  82  | test("light and dark headers keep every control separate at mobile, tablet and desktop widths", async ({ page }) => {
  83  |   test.setTimeout(60_000);
  84  |   await page.goto("/settings", { waitUntil: "domcontentloaded" });
  85  |   const header = page.getByRole("banner");
  86  |   await expect(header.getByRole("link", { name: "SparowType home", exact: true })).toBeVisible();
  87  |   await page.waitForFunction(
  88  |     () => document.fonts.status === "loaded" && document.fonts.check('400 18px "Inter Variable"', "SparowType"),
  89  |     undefined,
  90  |     { timeout: 10_000 },
  91  |   );
  92  |   for (const width of [320, 390, 1024, 1440]) {
  93  |     await page.setViewportSize({ width, height: 900 });
  94  |     for (const theme of ["dark", "light"] as const) {
  95  |       await test.step(`${width}px · ${theme}`, async () => {
  96  |         if (await page.locator("html").getAttribute("data-theme") !== `sparow-${theme}`) {
  97  |           await header.getByRole("button", {
  98  |             name: theme === "dark" ? "Switch to dark theme" : "Switch to light theme",
  99  |             exact: true,
  100 |           }).click();
  101 |         }
  102 |         await expectMainTheme(page, theme);
  103 |         const dimensions = await header.locator(":scope > div").first().evaluate((row) => {
  104 |           const viewport = document.documentElement.clientWidth;
  105 |           const controls = Array.from(row.querySelectorAll("a, button"))
  106 |             .map((element) => ({
  107 |               label: element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName,
  108 |               rect: element.getBoundingClientRect(),
  109 |             }))
  110 |             .filter(({ rect }) => rect.width > 0 && rect.height > 0);
  111 |           const overlaps: string[] = [];
  112 |           for (let first = 0; first < controls.length; first++) {
  113 |             for (let second = first + 1; second < controls.length; second++) {
  114 |               const a = controls[first], b = controls[second];
  115 |               const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
  116 |               const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
  117 |               if (overlapX > 0.5 && overlapY > 0.5) overlaps.push(`${a.label} / ${b.label}`);
  118 |             }
```