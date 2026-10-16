# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> small-screen test controls wrap in all six modes and keep select targets usable
- Location: e2e\responsive-layout.spec.ts:98:1

# Error details

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7]:
        - /url: /
        - generic [ref=e8]:
          - generic [ref=e9]: Sparow
          - generic [ref=e10]: Type
      - generic [ref=e11]:
        - button "Switch to light theme" [ref=e12]
        - link "Settings" [ref=e19]:
          - /url: /settings
        - link "Sign in" [ref=e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e27]:
      - link "Test" [ref=e28]:
        - /url: /
      - link "Learn" [ref=e31]:
        - /url: /learn
      - link "Race" [ref=e35]:
        - /url: /race
      - link "Stats" [ref=e45]:
        - /url: /stats
      - link "Rankings" [ref=e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e55]:
        - /url: /keyboard-lab
  - main [ref=e58]:
    - heading "Typing practice" [level=1] [ref=e59]
    - region "Test configuration" [ref=e60]:
      - group "Test mode" [ref=e62]:
        - button "Time" [ref=e63]
        - button "Words" [ref=e67]
        - button "Quote" [ref=e70]
        - button "Code" [ref=e74]
        - button "Custom" [pressed] [ref=e79]
        - button "Zen" [ref=e83]
      - generic [ref=e86]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e87]:
          - checkbox "Precision mode · stop on errors" [ref=e88]
          - text: Precision mode · stop on errors
        - paragraph [ref=e89]: Your own text. Stored on this device unless you choose to upload.
    - generic [ref=e90]:
      - heading "Bring your own passage" [level=2] [ref=e91]
      - paragraph [ref=e92]: Paste up to 10,000 characters to practice. Your text stays private on this device.
      - generic [ref=e93]: Custom practice passage
      - textbox "Custom practice passage" [ref=e94]:
        - /placeholder: Add something you want to get better at typing…
      - button "Start private practice" [disabled] [ref=e95]
  - contentinfo [ref=e99]:
    - generic [ref=e100]:
      - generic [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e103]: Sparow
          - generic [ref=e104]: Type
        - text: Find your rhythm.
      - generic [ref=e105]:
        - link "About & metrics" [ref=e106]:
          - /url: /about
        - link "Preferences & data" [ref=e107]:
          - /url: /settings
        - link "Touch typing guide" [ref=e108]:
          - /url: /touch-typing
        - link "Privacy" [ref=e109]:
          - /url: /privacy
        - link "Terms" [ref=e110]:
          - /url: /terms
        - link "Offline" [ref=e111]:
          - /url: /offline
        - generic [ref=e112]: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | test.beforeEach(async ({ page }) => {
  5   |   // Measure the product layout and native controls after the separately tested opening.
  6   |   await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  7   | });
  8   | 
  9   | async function expectPageFits(page: Page) {
  10  |   await page.locator("#main-content").waitFor();
> 11  |   await page.waitForFunction(
      |              ^ TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
  12  |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "SparowType"),
  13  |     undefined,
  14  |     { timeout: 10_000 },
  15  |   );
  16  |   const dimensions = await page.evaluate(() => ({
  17  |     viewport: document.documentElement.clientWidth,
  18  |     document: document.documentElement.scrollWidth,
  19  |     body: document.body.scrollWidth,
  20  |     offenders: Array.from(document.querySelectorAll("main, header, footer"))
  21  |       .filter((element) => {
  22  |         const rect = element.getBoundingClientRect();
  23  |         return rect.left < -1 || rect.right > innerWidth + 1;
  24  |       })
  25  |       .map((element) => element.tagName),
  26  |   }));
  27  |   expect(dimensions.document, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  28  |   expect(dimensions.body, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
  29  |   expect(dimensions.offenders, page.url()).toEqual([]);
  30  | }
  31  | 
  32  | for (const width of [320, 390, 768, 1440]) {
  33  |   test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
  34  |     test.setTimeout(90_000);
  35  |     await page.setViewportSize({ width, height: 900 });
  36  |     for (const route of [
  37  |       "/", "/learn", "/race", "/stats", "/settings", "/keyboard-lab",
  38  |       "/leaderboard", "/ranked", "/profile", "/auth", "/about",
  39  |     ]) {
  40  |       await test.step(route, async () => {
  41  |         await page.goto(route, { waitUntil: "domcontentloaded" });
  42  |         await expectPageFits(page);
  43  |       });
  44  |     }
  45  |   });
  46  | }
  47  | 
  48  | test("every theme provides opaque, readable native language options", async ({ page }) => {
  49  |   test.setTimeout(180_000);
  50  |   for (const [id, name, scheme] of [
  51  |     ["sparow-dark", "Sparow dark", "dark"],
  52  |     ["sparow-light", "Sparow light", "light"],
  53  |     ["graphite", "Graphite", "dark"],
  54  |     ["midnight-blue", "Midnight blue", "dark"],
  55  |     ["ember", "Ember", "dark"],
  56  |     ["mono-ink", "Mono ink", "dark"],
  57  |     ["paper", "Paper", "light"],
  58  |     ["aurora", "Aurora", "dark"],
  59  |   ]) {
  60  |     await page.goto("/settings", { waitUntil: "domcontentloaded" });
  61  |     await page.getByRole("button", { name, exact: false }).click();
  62  |     await expect(page.locator("html")).toHaveAttribute("data-theme", id);
  63  |     await page.goto("/", { waitUntil: "domcontentloaded" });
  64  |     const select = page.getByRole("combobox", { name: "Language", exact: true });
  65  |     await expect(select).toBeVisible();
  66  |     const menu = await select.evaluate((element) => {
  67  |       const control = element as HTMLSelectElement;
  68  |       const option = getComputedStyle(control.options[1]);
  69  |       const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  70  |       const luminance = (color: string) => components(color).slice(0, 3)
  71  |         .map((value) => value / 255)
  72  |         .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  73  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  74  |       const foreground = luminance(option.color);
  75  |       const background = luminance(option.backgroundColor);
  76  |       return {
  77  |         scheme: getComputedStyle(control).colorScheme,
  78  |         background: components(option.backgroundColor),
  79  |         contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
  80  |       };
  81  |     });
  82  |     expect(menu.scheme, name).toBe(scheme);
  83  |     expect(menu.background[3] ?? 1, name).toBe(1);
  84  |     expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  85  |   }
  86  |   // Native keyboard selection still changes the content and survives reload.
  87  |   const select = page.getByRole("combobox", { name: "Language", exact: true });
  88  |   await select.focus();
  89  |   await select.press("Home");
  90  |   await select.press("ArrowDown");
  91  |   await select.press("Enter");
  92  |   await expect(select).toHaveValue("es");
  93  |   await page.reload({ waitUntil: "domcontentloaded" });
  94  |   await page.locator("#main-content").waitFor();
  95  |   await expect(select).toHaveValue("es");
  96  | });
  97  | 
  98  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  99  |   test.setTimeout(90_000);
  100 |   await page.setViewportSize({ width: 320, height: 568 });
  101 |   await page.goto("/", { waitUntil: "domcontentloaded" });
  102 |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  103 |     await page.getByRole("group", { name: "Test mode", exact: true })
  104 |       .getByRole("button", { name: mode, exact: true }).click();
  105 |     await expectPageFits(page);
  106 |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  107 |     for (const control of await toolbar.locator("button, select").all()) {
  108 |       const rect = await control.boundingBox();
  109 |       expect(rect).not.toBeNull();
  110 |       expect(Math.round(rect!.height)).toBeGreaterThanOrEqual(44);
  111 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
```