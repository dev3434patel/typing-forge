# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> small-screen test controls wrap in all six modes and keep select targets usable
- Location: e2e\responsive-layout.spec.ts:93:1

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
        - generic [ref=e13]: SparowType
      - generic [ref=e14]:
        - button "Switch to light theme" [ref=e15]
        - link "Settings" [ref=e22]:
          - /url: /settings
        - link "Sign in" [ref=e26]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e30]:
      - link "Test" [ref=e31]:
        - /url: /
      - link "Learn" [ref=e34]:
        - /url: /learn
      - link "Race" [ref=e38]:
        - /url: /race
      - link "Stats" [ref=e48]:
        - /url: /stats
      - link "Rankings" [ref=e51]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e58]:
        - /url: /keyboard-lab
  - main [ref=e61]:
    - heading "Typing practice" [level=1] [ref=e62]
    - region "Test configuration" [ref=e63]:
      - group "Test mode" [ref=e65]:
        - button "Time" [ref=e66]
        - button "Words" [ref=e70]
        - button "Quote" [ref=e73]
        - button "Code" [ref=e77]
        - button "Custom" [pressed] [ref=e82]
        - button "Zen" [ref=e86]
      - generic [ref=e89]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e90]:
          - checkbox "Precision mode · stop on errors" [ref=e91]
          - text: Precision mode · stop on errors
        - paragraph [ref=e92]: Your own text. Stored on this device unless you choose to upload.
    - generic [ref=e93]:
      - heading "Bring your own passage" [level=2] [ref=e94]
      - paragraph [ref=e95]: Paste up to 10,000 characters to practice. Your text stays private on this device.
      - generic [ref=e96]: Custom practice passage
      - textbox "Custom practice passage" [ref=e97]:
        - /placeholder: Add something you want to get better at typing…
      - button "Start private practice" [disabled] [ref=e98]
  - contentinfo [ref=e102]:
    - generic [ref=e103]:
      - generic [ref=e104]: Find your rhythm. Let it fly.
      - generic [ref=e110]:
        - link "About & metrics" [ref=e111]:
          - /url: /about
        - link "Preferences & data" [ref=e112]:
          - /url: /settings
        - generic [ref=e113]: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { completeCorrectedCat, focusTyping } from "./helpers";
  3   | 
  4   | async function expectPageFits(page: Page) {
  5   |   await page.locator("#main-content").waitFor();
> 6   |   await page.waitForFunction(
      |              ^ TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
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
  60  |     await expect(select).toBeVisible();
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
```