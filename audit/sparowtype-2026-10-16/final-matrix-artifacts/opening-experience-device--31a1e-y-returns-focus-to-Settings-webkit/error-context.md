# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: opening-experience.spec.ts >> device opt-out persists while manual replay returns focus to Settings
- Location: e2e\opening-experience.spec.ts:73:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('textbox', { name: 'Typing input', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('textbox', { name: 'Typing input', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Typing input', exact: true })

```

```yaml
- status: Loading your workspace…
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { INTRO_ENABLED_STORAGE_KEY, INTRO_SEEN_SESSION_KEY } from "../src/lib/opening-experience";
  3  | 
  4  | async function firstOpening(page: Page) {
  5  |   await page.clock.install();
  6  |   await page.goto("/");
  7  |   const opening = page.getByRole("dialog", { name: "SparowType", exact: true });
  8  |   await expect(opening).toBeVisible();
  9  |   await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 50));
  10 |   return opening;
  11 | }
  12 | 
  13 | test("opening finishes automatically without mounting a test or recording intro keys", async ({ page }) => {
  14 |   const opening = await firstOpening(page);
  15 |   const input = page.getByRole("textbox", { name: "Typing input", exact: true });
  16 |   await expect(input).toHaveCount(0);
  17 |   await page.keyboard.press("a");
  18 |   await expect(opening).toBeVisible();
  19 |   await expect(input).toHaveCount(0);
  20 |   await page.clock.fastForward(2400);
  21 |   await expect(opening).toHaveCount(0);
  22 |   await expect(input).toBeFocused();
  23 |   await expect(input).toHaveValue("");
  24 |   await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  25 |   await expect(page.getByTestId("typing-target").locator("[data-typed]")).toHaveCount(0);
  26 |   await page.reload();
  27 |   await expect(input).toBeVisible();
  28 |   await expect(opening).toHaveCount(0);
  29 | });
  30 | 
  31 | test("Enter, Escape and Space skip immediately without entering the new passage", async ({ page }) => {
  32 |   await firstOpening(page);
  33 |   for (const key of ["Enter", "Escape", "Space"]) {
  34 |     if (key !== "Enter") {
  35 |       await page.evaluate((storageKey) => sessionStorage.removeItem(storageKey), INTRO_SEEN_SESSION_KEY);
  36 |       await page.reload();
  37 |       await expect(page.getByTestId("opening-experience")).toBeVisible();
  38 |     }
  39 |     await expect(page.getByRole("button", { name: "Skip intro", exact: false })).toBeFocused();
  40 |     await page.keyboard.press(key);
  41 |     const input = page.getByRole("textbox", { name: "Typing input", exact: true });
  42 |     await expect(input).toBeFocused();
  43 |     await expect(input).toHaveValue("");
  44 |     await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  45 |   }
  46 | });
  47 | 
  48 | test("deep links and reduced-motion preference bypass the automatic opening", async ({ page }) => {
  49 |   await page.goto("/learn");
  50 |   await expect(page.getByRole("region", { name: "Adaptive typing lesson", exact: true })).toBeVisible();
  51 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  52 |   await page.emulateMedia({ reducedMotion: "reduce" });
  53 |   await page.goto("/");
  54 |   await expect(page.getByRole("textbox", { name: "Typing input", exact: true })).toBeVisible();
  55 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  56 | });
  57 | 
  58 | test("opening completes when browser storage is unavailable", async ({ page }) => {
  59 |   await page.addInitScript(() => {
  60 |     for (const name of ["localStorage", "sessionStorage"]) {
  61 |       Object.defineProperty(window, name, {
  62 |         configurable: true,
  63 |         get() { throw new DOMException("Storage unavailable", "SecurityError"); },
  64 |       });
  65 |     }
  66 |   });
  67 |   await firstOpening(page);
  68 |   await page.clock.fastForward(2400);
  69 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  70 |   await expect(page.getByRole("textbox", { name: "Typing input", exact: true })).toBeVisible();
  71 | });
  72 | 
  73 | test("device opt-out persists while manual replay returns focus to Settings", async ({ page }) => {
  74 |   await page.addInitScript((storageKey) => localStorage.setItem(storageKey, "false"), INTRO_ENABLED_STORAGE_KEY);
  75 |   await page.goto("/");
> 76 |   await expect(page.getByRole("textbox", { name: "Typing input", exact: true })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  77 |   await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  78 |   await page.goto("/settings");
  79 |   await expect(page.getByRole("checkbox", { name: "Opening animation", exact: true })).not.toBeChecked();
  80 |   const replay = page.getByRole("button", { name: "Replay opening animation", exact: true });
  81 |   await replay.click();
  82 |   await expect(page.getByTestId("opening-experience")).toBeVisible();
  83 |   await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  84 |   await expect(replay).toBeFocused();
  85 |   await expect(page.getByRole("checkbox", { name: "Opening animation", exact: true })).not.toBeChecked();
  86 | });
  87 | 
```