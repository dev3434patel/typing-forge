# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-accessibility.spec.ts >> the command palette stays inside a landscape phone viewport and supports touch dismissal
- Location: e2e\navigation-accessibility.spec.ts:61:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    43.99090576171875
```

# Page snapshot

```yaml
- generic:
  - generic [aria-hidden]:
    - generic:
      - generic:
        - banner:
          - link:
            - /url: "#main-content"
            - text: Skip to content
          - generic:
            - link:
              - /url: /
              - generic:
                - generic: Sparow
                - generic: Type
            - generic:
              - button
              - link:
                - /url: /settings
              - link:
                - /url: /auth
          - navigation:
            - link:
              - /url: /
              - text: Test
            - link:
              - /url: /learn
              - text: Learn
            - link:
              - /url: /race
              - text: Race
            - link:
              - /url: /stats
              - text: Stats
            - link:
              - /url: /leaderboard
              - text: Rankings
            - link:
              - /url: /keyboard-lab
              - text: Keyboard Lab
        - main:
          - paragraph: Make it yours
          - heading [level=1]: Your practice, your space.
          - paragraph: Preferences are saved separately for each account and this device’s guest.
          - status: Preferences saved on this device.
          - generic:
            - heading [level=2]: Appearance
            - generic:
              - button [pressed]:
                - generic: Aa bb
                - generic: Sparow dark
              - button:
                - generic: Aa bb
                - generic: Sparow light
            - heading [level=3]: More palettes
            - generic:
              - button:
                - generic: Aa bb
                - generic: Graphite
              - button:
                - generic: Aa bb
                - generic: Midnight blue
              - button:
                - generic: Aa bb
                - generic: Ember
              - button:
                - generic: Aa bb
                - generic: Mono ink
              - button:
                - generic: Aa bb
                - generic: Paper
              - button:
                - generic: Aa bb
                - generic: Aurora
          - region:
            - generic:
              - generic:
                - generic:
                  - generic: Opening animation
                  - generic: The full 3D keyboard plays once per browser session. Replay it anytime; reduced motion is respected.
                - checkbox
              - button: Replay opening animation
          - generic:
            - generic:
              - heading [level=2]: Typing preferences
              - generic:
                - generic:
                  - text: Practice language
                  - combobox
                - generic:
                  - text: Keyboard layout
                  - combobox
                - generic:
                  - text: Text size
                  - generic: 26px
                  - slider: "26"
                - generic:
                  - text: Caret style
                  - combobox
                - generic:
                  - generic:
                    - text: Target WPM
                    - spinbutton: "35"
                  - generic:
                    - text: Daily goal · min
                    - spinbutton: "10"
            - generic:
              - heading [level=2]: Focus & feedback
              - generic:
                - generic:
                  - generic: Live statistics
                  - generic: Show speed and accuracy while you type.
                - checkbox [checked]
              - generic:
                - generic:
                  - generic: Focus mode
                  - generic: Keep supporting details quiet during your test.
                - checkbox
              - generic:
                - generic:
                  - generic: Smooth caret
                  - generic: Animate the caret when reduced motion is off.
                - checkbox [checked]
              - generic:
                - generic:
                  - generic: Reduced motion
                  - generic: Keep animation still. Your device’s reduced-motion setting always applies.
                - checkbox
              - generic:
                - generic:
                  - generic: Pace guide
                  - generic: Show your target pace during practice.
                - checkbox
              - generic:
                - generic:
                  - generic: Typing sound
                  - generic: A subtle click. Off by default.
                - checkbox
              - status: Typing sound is unavailable in this browser. Your sound preference is kept for devices that support it.
              - generic:
                - text: Sound pack
                - combobox
                - generic: Five synthesized styles. Sound starts only while you type.
              - generic:
                - text: Volume
                - slider: "0.2"
          - generic:
            - heading [level=2]: Your data
            - paragraph: 0 sessions in this account’s local history. Browser storage is available. Private custom text stays on this device unless you choose cloud storage. Event evidence expires after 90 days; summaries remain.
            - generic:
              - button: Export my local data
              - button: Reset preferences
        - contentinfo:
          - generic:
            - generic:
              - generic:
                - generic: Sparow
                - generic: Type
              - text: Find your rhythm.
            - generic:
              - link:
                - /url: /about
                - text: About & metrics
              - link:
                - /url: /settings
                - text: Preferences & data
              - link:
                - /url: /touch-typing
                - text: Touch typing guide
              - link:
                - /url: /privacy
                - text: Privacy
              - link:
                - /url: /terms
                - text: Terms
              - link:
                - /url: /offline
                - text: Offline
              - generic: SparowType © 2026
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "SparowType commands" [level=2] [ref=e5]
      - paragraph [ref=e6]: Search pages and themes. Use arrow keys and Enter to select.
      - combobox [expanded] [active] [ref=e11]
      - listbox "Suggestions" [ref=e12]:
        - generic [ref=e13]:
          - generic [aria-hidden] [ref=e14]: Go to
          - group "Go to" [ref=e15]:
            - option "Practice" [selected] [ref=e16]
            - option "Adaptive learning" [ref=e17]
            - option "Race" [ref=e18]
            - option "Progress and history" [ref=e19]
            - option "Rankings" [ref=e20]
            - option "Preferences" [ref=e21]
            - option "About & metrics" [ref=e22]
            - option "Keyboard Lab" [ref=e23]
          - generic [aria-hidden] [ref=e24]: Theme
          - group "Theme" [ref=e25]:
            - option "Sparow dark" [ref=e26]
            - option "Sparow light" [ref=e27]
            - option "Graphite" [ref=e28]
            - option "Midnight blue" [ref=e29]
            - option "Ember" [ref=e30]
            - option "Mono ink" [ref=e31]
            - option "Paper" [ref=e32]
            - option "Aurora" [ref=e33]
    - button "Close" [ref=e34]
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
> 78 |   expect(target!.width).toBeGreaterThanOrEqual(44);
     |                         ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  79 |   expect(target!.height).toBeGreaterThanOrEqual(44);
  80 |   await close.click();
  81 |   await expect(dialog).toBeHidden();
  82 |   await expect(origin).toBeFocused();
  83 | });
  84 | 
```