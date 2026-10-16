# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 390px viewport
- Location: e2e\responsive-layout.spec.ts:33:3

# Error details

```
TimeoutError: page.waitForFunction: Timeout 10000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - link "Skip to content" [ref=f1e5]:
      - /url: "#main-content"
    - generic [ref=f1e6]:
      - link "SparowType home" [ref=f1e7]:
        - /url: /
        - generic [ref=f1e8]:
          - generic [ref=f1e9]: Sparow
          - generic [ref=f1e10]: Type
      - generic [ref=f1e11]:
        - button "Switch to light theme" [ref=f1e12]
        - link "Settings" [ref=f1e19]:
          - /url: /settings
        - link "Sign in" [ref=f1e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=f1e27]:
      - link "Test" [ref=f1e28]:
        - /url: /
      - link "Learn" [ref=f1e31]:
        - /url: /learn
      - link "Race" [ref=f1e35]:
        - /url: /race
      - link "Stats" [ref=f1e45]:
        - /url: /stats
      - link "Rankings" [ref=f1e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=f1e55]:
        - /url: /keyboard-lab
  - main [ref=f1e58]:
    - generic [ref=f1e59]:
      - generic [ref=f1e60]:
        - heading "Make every key feel natural." [level=1] [ref=f1e61]
        - paragraph [ref=f1e62]: Adaptive practice · a little more confidence with every lesson
      - link "Adjust target and daily goal" [ref=f1e63]:
        - /url: /settings
    - generic [ref=f1e64]:
      - region "Adaptive typing lesson" [ref=f1e65]:
        - generic [ref=f1e66]:
          - generic [ref=f1e67]:
            - generic [ref=f1e68]: Adaptive lesson
            - heading "Focus on e" [level=2] [ref=f1e69]
          - generic [ref=f1e70]:
            - generic [ref=f1e71]: Available keys
            - paragraph [ref=f1e72]: e t a o i n
          - generic [ref=f1e73]:
            - generic [ref=f1e74]: WPM
            - paragraph [ref=f1e75]: —
          - generic [ref=f1e76]:
            - generic [ref=f1e77]: Attempt accuracy
            - paragraph [ref=f1e78]: —
          - button "New lesson" [ref=f1e79]
        - progressbar "Lesson progress" [ref=f1e81]
        - generic [ref=f1e82]:
          - generic [ref=f1e83]:
            - generic [aria-hidden]:
              - generic:
                - generic: i
                - generic: "n"
                - generic: "n"
                - generic: a
                - generic: t
                - generic: e
              - generic:
                - generic: a
                - generic: t
                - generic: t
                - generic: e
                - generic: "n"
                - generic: t
                - generic: i
                - generic: o
                - generic: "n"
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
                - generic: t
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: e
                - generic: a
                - generic: t
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: a
                - generic: "n"
                - generic: t
                - generic: e
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: "n"
                - generic: e
                - generic: t
              - generic:
                - generic: "n"
                - generic: o
                - generic: t
                - generic: e
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: t
                - generic: e
                - generic: e
                - generic: "n"
              - generic:
                - generic: "n"
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: "n"
                - generic: i
                - generic: "n"
                - generic: e
              - generic:
                - generic: t
                - generic: i
                - generic: e
              - generic:
                - generic: a
                - generic: "n"
                - generic: t
                - generic: e
              - generic:
                - generic: i
                - generic: "n"
                - generic: "n"
                - generic: a
                - generic: t
                - generic: e
              - generic:
                - generic: e
                - generic: a
                - generic: t
              - generic:
                - generic: t
                - generic: i
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: t
                - generic: e
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
          - textbox "Type the practice text" [active] [ref=f1e84]
        - generic [ref=f1e86]:
          - paragraph [ref=f1e87]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=f1e88]
        - img "QWERTY logical keyboard. Expected i." [ref=f1e89]:
          - generic [ref=f1e90]:
            - generic [ref=f1e91]:
              - generic [ref=f1e92]: q
              - generic [ref=f1e93]: w
              - generic [ref=f1e94]: e
              - generic [ref=f1e95]: r
              - generic [ref=f1e96]: t
              - generic [ref=f1e97]: "y"
              - generic [ref=f1e98]: u
              - generic [ref=f1e99]: i
              - generic [ref=f1e100]: o
              - generic [ref=f1e101]: p
            - generic [ref=f1e102]:
              - generic [ref=f1e103]: a
              - generic [ref=f1e104]: s
              - generic [ref=f1e105]: d
              - generic [ref=f1e106]: f
              - generic [ref=f1e107]: g
              - generic [ref=f1e108]: h
              - generic [ref=f1e109]: j
              - generic [ref=f1e110]: k
              - generic [ref=f1e111]: l
            - generic [ref=f1e112]:
              - generic [ref=f1e113]: z
              - generic [ref=f1e114]: x
              - generic [ref=f1e115]: c
              - generic [ref=f1e116]: v
              - generic [ref=f1e117]: b
              - generic [ref=f1e118]: "n"
              - generic [ref=f1e119]: m
            - generic [ref=f1e120]: space
          - paragraph [ref=f1e122]: "QWERTY · Outlined: next character · Red: your incorrect input"
        - paragraph [ref=f1e123]: Click the lesson and start typing. Your actual input appears as you type, including mistakes. Backspace corrects the text while every original mistake remains in attempt accuracy. Escape releases focus. Tab moves to the next control.
        - paragraph [ref=f1e124]: innate attention one ten tent one eat one ante one none none net note one teen none nine tie ante innate eat tie note one
        - generic [ref=f1e125]:
          - generic [ref=f1e126]:
            - generic [ref=f1e127]: Correction policy
            - combobox "Correction policy" [ref=f1e128]:
              - option "Allow corrections" [selected]
              - option "Stop on error"
          - generic [ref=f1e129]:
            - generic [ref=f1e130]: Input method
            - combobox "Input method" [ref=f1e131]:
              - option "Physical keyboard" [selected]
              - option "Composition / IME"
              - option "On-screen keyboard"
          - generic [ref=f1e132]:
            - checkbox "Mixed review" [ref=f1e133]
            - text: Mixed review
          - button "Hide keyboard" [pressed] [ref=f1e134]
        - paragraph [ref=f1e137]:
          - generic [ref=f1e138]: esc
          - text: release focus
          - generic [ref=f1e139]: ·
          - generic [ref=f1e140]: tab
          - text: next control
          - generic [ref=f1e141]: ·
          - text: Backspace to correct
      - group [ref=f1e142]:
        - generic "+ Learning progress & evidence 0 / 26 mastered · target 35 WPM" [ref=f1e143] [cursor=pointer]:
          - text: + Learning progress & evidence
          - generic [ref=f1e144]: 0 / 26 mastered · target 35 WPM
  - contentinfo [ref=f1e145]:
    - generic [ref=f1e146]:
      - generic [ref=f1e147]:
        - generic [ref=f1e148]:
          - generic [ref=f1e149]: Sparow
          - generic [ref=f1e150]: Type
        - text: Find your rhythm.
      - generic [ref=f1e151]:
        - link "About & metrics" [ref=f1e152]:
          - /url: /about
        - link "Preferences & data" [ref=f1e153]:
          - /url: /settings
        - link "Touch typing guide" [ref=f1e154]:
          - /url: /touch-typing
        - link "Privacy" [ref=f1e155]:
          - /url: /privacy
        - link "Terms" [ref=f1e156]:
          - /url: /terms
        - link "Offline" [ref=f1e157]:
          - /url: /offline
        - generic [ref=f1e158]: SparowType © 2026
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