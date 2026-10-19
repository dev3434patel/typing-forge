# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation-accessibility.spec.ts >> practice aliases identify the current workspace in desktop and mobile navigation
- Location: e2e\navigation-accessibility.spec.ts:9:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })
Expected: "page"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Test', exact: true }) with timeout 5000ms
  - waiting for getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "SparowType home":
    - /url: /
    - text: Sparow Type
  - button "Switch to light theme":
    - img
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
    - text: Sign in
  - navigation "Mobile navigation":
    - link "Test":
      - /url: /
      - img
      - text: Test
    - link "Learn":
      - /url: /learn
      - img
      - text: Learn
    - link "Race":
      - /url: /race
      - img
      - text: Race
    - link "Stats":
      - /url: /stats
      - img
      - text: Stats
    - link "Rankings":
      - /url: /leaderboard
      - img
      - text: Rankings
    - link "Keyboard Lab":
      - /url: /keyboard-lab
      - img
      - text: Keyboard Lab
- main:
  - heading "Typing practice" [level=1]
  - region "Test configuration":
    - group "Test mode":
      - button "Time" [pressed]:
        - img
        - text: Time
      - button "Words":
        - img
        - text: Words
      - button "Quote":
        - img
        - text: Quote
      - button "Code":
        - img
        - text: Code
      - button "Custom":
        - img
        - text: Custom
      - button "Zen":
        - img
        - text: Zen
    - group "Test duration":
      - button "15 seconds"
      - button "30 seconds" [pressed]
      - button "60 seconds"
      - button "120 seconds"
    - checkbox "Precision mode · stop on errors"
    - text: Precision mode · stop on errors Language
    - combobox "Language":
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
    - button "punctuation":
      - img
      - text: punctuation
    - button "# numbers"
  - region "Typing session":
    - text: 30s remaining —wpm —acc % Ready when you are
    - paragraph: "Practice passage: head thought grow other are first mine fun are clear he zero at test time send watch new watch there kite or shore train through out here down star new lean go play flow tree time learn zinc where two very mean root paper south often eat nature light the raise tire rent head zero when wide hard plain queen is zone than seat ton nine stop word here mine game hill pink well silver state meet foot flow never letter map joy much top gold good i care era together late fine pretty lean hope ground retina own glass train game still room rain ton eye simple his soft off zone ratio round ante from town summer game power"
    - textbox "Typing input"
    - paragraph: Type the text above. Wrong letters stay visible; Backspace corrects.
    - status
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
    - button "Restart with new text":
      - img
    - button "Show accessible text editor":
      - img
    - button "Finish" [disabled]:
      - img
      - text: Finish
    - status: Ready to type
- contentinfo:
  - text: Sparow Type Find your rhythm.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - link "Touch typing guide":
    - /url: /touch-typing
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Offline":
    - /url: /offline
  - text: SparowType © 2026
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
> 24 |         .toHaveAttribute("aria-current", "page");
     |          ^ Error: expect(locator).toHaveAttribute(expected) failed
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
  82 |   await expect(origin).toBeFocused();
  83 | });
  84 | 
```