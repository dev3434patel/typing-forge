# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> main local pages fit a 320px viewport
- Location: e2e\responsive-layout.spec.ts:33:3

# Error details

```
Error: http://127.0.0.1:4175/profile

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 274
Received:    275
```

# Page snapshot

```yaml
- generic [ref=f8e3]:
  - banner [ref=f8e4]:
    - link "Skip to content" [ref=f8e5]:
      - /url: "#main-content"
    - generic [ref=f8e6]:
      - link "SparowType home" [ref=f8e7]:
        - /url: /
        - generic [ref=f8e8]:
          - generic [ref=f8e9]: Sparow
          - generic [ref=f8e10]: Type
      - generic [ref=f8e11]:
        - button "Switch to light theme" [ref=f8e12]
        - link "Settings" [ref=f8e19]:
          - /url: /settings
        - link "Sign in" [ref=f8e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=f8e27]:
      - link "Test" [ref=f8e28]:
        - /url: /
      - link "Learn" [ref=f8e31]:
        - /url: /learn
      - link "Race" [ref=f8e35]:
        - /url: /race
      - link "Stats" [ref=f8e45]:
        - /url: /stats
      - link "Rankings" [ref=f8e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=f8e55]:
        - /url: /keyboard-lab
  - main [ref=f8e58]:
    - generic [ref=f8e59]:
      - generic [ref=f8e65]:
        - paragraph [ref=f8e66]: Your SparowType profile
        - heading "Guest workspace" [level=1] [ref=f8e67]
        - paragraph [ref=f8e68]: 0 saved sessions · 0.0 minutes practiced
      - link "Sign in" [ref=f8e69]:
        - /url: /auth
    - generic [ref=f8e73]:
      - generic [ref=f8e74]:
        - generic [ref=f8e75]:
          - heading "Public identity" [level=2] [ref=f8e76]
          - paragraph [ref=f8e77]: A handle appears in human rooms and eligible rankings. Your email is private.
          - generic [ref=f8e78]: Handle
          - textbox "Handle" [disabled] [ref=f8e79]:
            - /placeholder: Sign in to choose a handle
          - paragraph [ref=f8e80]: 3–24 lowercase letters, numbers or underscores.
          - button "Save handle" [disabled] [ref=f8e81]
        - generic [ref=f8e82]:
          - heading "Your data, your choice" [level=2] [ref=f8e83]
          - paragraph [ref=f8e87]: Replay evidence and private text expire after 90 days. Summary history stays until you delete it. Cloud storage of private passages needs separate consent for each session.
          - button "Export this workspace" [disabled] [ref=f8e88]
          - link "Practice & appearance settings" [ref=f8e92]:
            - /url: /settings
          - paragraph [ref=f8e96]: "Workspace: guest · durable browser storage"
      - generic [ref=f8e97]:
        - generic [ref=f8e98]:
          - heading "Personal bests by comparison" [level=2] [ref=f8e99]
          - paragraph [ref=f8e100]: V3 metrics only. Repeated content, languages and durations are separate comparisons.
          - paragraph [ref=f8e101]: Complete a V3 session to set your first personal best.
        - generic [ref=f8e102]:
          - generic [ref=f8e103]:
            - generic [ref=f8e104]:
              - heading "Your saved sessions" [level=2] [ref=f8e105]
              - paragraph [ref=f8e106]: Deletion also reconciles cloud comparisons and learning evidence.
            - link "View progress" [ref=f8e107]:
              - /url: /stats
          - paragraph [ref=f8e108]: No sessions saved in this workspace yet.
    - generic [ref=f8e109]:
      - heading "Reset guest workspace" [level=2] [ref=f8e110]
      - paragraph [ref=f8e111]: Remove guest history and learning evidence from this device. Other signed-in workspaces are preserved. Export your history first if you want a copy.
      - generic [ref=f8e112]: Type DELETE to enable this action
      - generic [ref=f8e113]:
        - textbox "Type DELETE to enable this action" [ref=f8e114]
        - button "Reset guest workspace" [disabled] [ref=f8e115]
  - contentinfo [ref=f8e116]:
    - generic [ref=f8e117]:
      - generic [ref=f8e118]:
        - generic [ref=f8e119]:
          - generic [ref=f8e120]: Sparow
          - generic [ref=f8e121]: Type
        - text: Find your rhythm.
      - generic [ref=f8e122]:
        - link "About & metrics" [ref=f8e123]:
          - /url: /about
        - link "Preferences & data" [ref=f8e124]:
          - /url: /settings
        - link "Touch typing guide" [ref=f8e125]:
          - /url: /touch-typing
        - link "Privacy" [ref=f8e126]:
          - /url: /privacy
        - link "Terms" [ref=f8e127]:
          - /url: /terms
        - link "Offline" [ref=f8e128]:
          - /url: /offline
        - generic [ref=f8e129]: SparowType © 2026
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
  11  |   await page.waitForFunction(
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
> 27  |   expect(dimensions.document, page.url()).toBeLessThanOrEqual(dimensions.viewport + 1);
      |                                           ^ Error: http://127.0.0.1:4175/profile
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
  112 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  113 |     }
  114 |     if (mode === "Code") {
  115 |       await page.getByRole("combobox", { name: "Code language" }).selectOption("python");
  116 |       await page.screenshot({ path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`, fullPage: true });
  117 |     }
  118 |   }
  119 |   await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("gu-Latn");
  120 |   await expectPageFits(page);
  121 | });
  122 | 
  123 | test("narrow results retain the whole keyboard map and expanded evidence", async ({ page }, info) => {
  124 |   test.setTimeout(90_000);
  125 |   await page.setViewportSize({ width: 320, height: 760 });
  126 |   await completeCorrectedCat(page);
  127 |   await expectPageFits(page);
```