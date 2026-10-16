# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sparowtype-brand.spec.ts >> light and dark headers keep every control separate at mobile, tablet and desktop widths
- Location: e2e\sparowtype-brand.spec.ts:82:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    42.3125
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e13]: SparowType
      - navigation "Main navigation" [ref=e14]:
        - link "Test" [ref=e15] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e18] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e22] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e32] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e35] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e42] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e45]:
        - button "Switch to light theme" [active] [ref=e46]
        - button "Open command palette" [ref=e53]
        - link "Settings" [ref=e56] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e60] [cursor=pointer]:
          - /url: /auth
  - main [ref=e65]:
    - paragraph [ref=e66]: Make it yours
    - heading "Your practice, your space." [level=1] [ref=e67]
    - paragraph [ref=e68]: Preferences are saved separately for each account and this device’s guest.
    - status [ref=e69]: Preferences saved on this device.
    - generic [ref=e70]:
      - heading "Appearance" [level=2] [ref=e71]
      - generic "Sparow themes" [ref=e72]:
        - button "Aa bb Sparow dark" [pressed] [ref=e73]:
          - generic [ref=e74]: Aa bb
          - generic [ref=e75]: Sparow dark
        - button "Aa bb Sparow light" [ref=e78]:
          - generic [ref=e79]: Aa bb
          - generic [ref=e80]: Sparow light
      - heading "More palettes" [level=3] [ref=e81]
      - generic "More themes" [ref=e82]:
        - button "Aa bb Graphite" [ref=e83]:
          - generic [ref=e84]: Aa bb
          - generic [ref=e85]: Graphite
        - button "Aa bb Midnight blue" [ref=e86]:
          - generic [ref=e87]: Aa bb
          - generic [ref=e88]: Midnight blue
        - button "Aa bb Ember" [ref=e89]:
          - generic [ref=e90]: Aa bb
          - generic [ref=e91]: Ember
        - button "Aa bb Mono ink" [ref=e92]:
          - generic [ref=e93]: Aa bb
          - generic [ref=e94]: Mono ink
        - button "Aa bb Paper" [ref=e95]:
          - generic [ref=e96]: Aa bb
          - generic [ref=e97]: Paper
        - button "Aa bb Aurora" [ref=e98]:
          - generic [ref=e99]: Aa bb
          - generic [ref=e100]: Aurora
    - region [ref=e101]:
      - generic [ref=e102]:
        - generic [ref=e103]:
          - generic [ref=e104]:
            - generic [ref=e105]: Opening animation
            - generic [ref=e106]: A brief keyboard welcome when you open SparowType. Saved on this device; reduced motion is respected.
          - checkbox "Opening animation" [ref=e107]
        - button "Replay opening animation" [ref=e108]
    - generic [ref=e111]:
      - generic [ref=e112]:
        - heading "Typing preferences" [level=2] [ref=e113]
        - generic [ref=e114]:
          - generic [ref=e115]:
            - text: Practice language
            - combobox "Practice language" [ref=e116]:
              - option "English" [selected]
              - option "Español"
              - option "Français"
              - option "Deutsch"
              - option "Português"
              - option "Italiano"
              - option "Русский"
              - option "हिन्दी"
              - option "العربية"
              - option "Gujarati transliteration (Latin)"
          - generic [ref=e117]:
            - text: Keyboard layout
            - combobox "Keyboard layout" [ref=e118]:
              - option "QWERTY" [selected]
              - option "Dvorak"
              - option "Colemak"
              - option "Colemak-DH"
              - option "AZERTY"
              - option "QWERTZ"
              - option "Native / unmapped"
          - generic [ref=e119]:
            - text: Text size
            - generic [ref=e120]: 26px
            - slider "Text size" [ref=e121]: "26"
          - generic [ref=e122]:
            - text: Caret style
            - combobox "Caret style" [ref=e123]:
              - option "Line" [selected]
              - option "Block"
              - option "Underline"
          - generic [ref=e124]:
            - generic [ref=e125]:
              - text: Target WPM
              - spinbutton "Target WPM" [ref=e126]: "35"
            - generic [ref=e127]:
              - text: Daily goal · min
              - spinbutton "Daily goal · min" [ref=e128]: "10"
      - generic [ref=e129]:
        - heading "Focus & feedback" [level=2] [ref=e130]
        - generic [ref=e131]:
          - generic [ref=e132]:
            - generic [ref=e133]: Live statistics
            - generic [ref=e134]: Show speed and accuracy while you type.
          - checkbox "Live statistics Show speed and accuracy while you type." [checked] [ref=e135]
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]: Focus mode
            - generic [ref=e139]: Keep supporting details quiet during your test.
          - checkbox "Focus mode Keep supporting details quiet during your test." [ref=e140]
        - generic [ref=e141]:
          - generic [ref=e142]:
            - generic [ref=e143]: Smooth caret
            - generic [ref=e144]: Animate the caret when reduced motion is off.
          - checkbox "Smooth caret Animate the caret when reduced motion is off." [checked] [ref=e145]
        - generic [ref=e146]:
          - generic [ref=e147]:
            - generic [ref=e148]: Pace guide
            - generic [ref=e149]: Show your target pace during practice.
          - checkbox "Pace guide Show your target pace during practice." [ref=e150]
        - generic [ref=e151]:
          - generic [ref=e152]:
            - generic [ref=e153]: Typing sound
            - generic [ref=e154]: A subtle click. Off by default.
          - checkbox "Typing sound A subtle click. Off by default." [ref=e155]
        - generic [ref=e156]:
          - text: Volume
          - slider "Sound volume" [ref=e157]: "0.2"
    - generic [ref=e158]:
      - heading "Your data" [level=2] [ref=e159]
      - paragraph [ref=e160]: 0 sessions in this account’s local history. Browser storage is available. Private custom text stays on this device unless you choose cloud storage. Event evidence expires after 90 days; summaries remain.
      - generic [ref=e161]:
        - button "Export my local data" [ref=e162]
        - button "Reset preferences" [ref=e166]
      - status
  - contentinfo [ref=e170]:
    - generic [ref=e171]:
      - generic [ref=e172]: Find your rhythm. Let it fly.
      - generic [ref=e178]:
        - link "About & metrics" [ref=e179] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e180] [cursor=pointer]:
          - /url: /settings
        - generic [ref=e181]: SparowType © 2026
```

# Test source

```ts
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
  119 |           }
  120 |           return {
  121 |             viewport,
  122 |             document: document.documentElement.scrollWidth,
  123 |             rowWidth: row.clientWidth,
  124 |             rowScroll: row.scrollWidth,
  125 |             outside: controls.filter(({ rect }) => rect.left < -1 || rect.right > viewport + 1).map(({ label }) => label),
  126 |             overlaps,
  127 |           };
  128 |         });
  129 |         expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  130 |         expect(dimensions.rowScroll).toBeLessThanOrEqual(dimensions.rowWidth + 1);
  131 |         expect(dimensions.outside).toEqual([]);
  132 |         expect(dimensions.overlaps).toEqual([]);
  133 |         const toggle = header.getByRole("button", {
  134 |           name: theme === "light" ? "Switch to dark theme" : "Switch to light theme",
  135 |           exact: true,
  136 |         });
  137 |         const bounds = await toggle.boundingBox();
  138 |         expect(bounds).not.toBeNull();
> 139 |         expect(bounds!.width).toBeGreaterThanOrEqual(44);
      |                               ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  140 |         expect(bounds!.height).toBeGreaterThanOrEqual(44);
  141 |       });
  142 |     }
  143 |   }
  144 | });
  145 | 
```