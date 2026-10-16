# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-pages.spec.ts >> populated history, comparison chart and account controls fit narrow and tablet screens
- Location: e2e\responsive-pages.spec.ts:19:1

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 274
Received:    275
```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - banner [ref=f2e4]:
    - link "Skip to content" [ref=f2e5]:
      - /url: "#main-content"
    - generic [ref=f2e6]:
      - link "SparowType home" [ref=f2e7]:
        - /url: /
        - generic [ref=f2e8]:
          - generic [ref=f2e9]: Sparow
          - generic [ref=f2e10]: Type
      - generic [ref=f2e11]:
        - button "Switch to light theme" [ref=f2e12]
        - link "Settings" [ref=f2e19]:
          - /url: /settings
        - link "Sign in" [ref=f2e23]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=f2e27]:
      - link "Test" [ref=f2e28]:
        - /url: /
      - link "Learn" [ref=f2e31]:
        - /url: /learn
      - link "Race" [ref=f2e35]:
        - /url: /race
      - link "Stats" [ref=f2e45]:
        - /url: /stats
      - link "Rankings" [ref=f2e48]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=f2e55]:
        - /url: /keyboard-lab
  - main [ref=f2e58]:
    - generic [ref=f2e59]:
      - generic [ref=f2e65]:
        - paragraph [ref=f2e66]: Your SparowType profile
        - heading "Guest workspace" [level=1] [ref=f2e67]
        - paragraph [ref=f2e68]: 1 saved sessions · 0.0 minutes practiced
      - link "Sign in" [ref=f2e69]:
        - /url: /auth
    - generic [ref=f2e73]:
      - generic [ref=f2e74]:
        - generic [ref=f2e75]:
          - heading "Public identity" [level=2] [ref=f2e76]
          - paragraph [ref=f2e77]: A handle appears in human rooms and eligible rankings. Your email is private.
          - generic [ref=f2e78]: Handle
          - textbox "Handle" [disabled] [ref=f2e79]:
            - /placeholder: Sign in to choose a handle
          - paragraph [ref=f2e80]: 3–24 lowercase letters, numbers or underscores.
          - button "Save handle" [disabled] [ref=f2e81]
        - generic [ref=f2e82]:
          - heading "Your data, your choice" [level=2] [ref=f2e83]
          - paragraph [ref=f2e87]: Replay evidence and private text expire after 90 days. Summary history stays until you delete it. Cloud storage of private passages needs separate consent for each session.
          - button "Export this workspace" [ref=f2e88]
          - link "Practice & appearance settings" [ref=f2e92]:
            - /url: /settings
          - paragraph [ref=f2e96]: "Workspace: guest · durable browser storage"
      - generic [ref=f2e97]:
        - generic [ref=f2e98]:
          - heading "Personal bests by comparison" [level=2] [ref=f2e99]
          - paragraph [ref=f2e100]: V3 metrics only. Repeated content, languages and durations are separate comparisons.
          - paragraph [ref=f2e101]: Complete a V3 session to set your first personal best.
        - generic [ref=f2e102]:
          - generic [ref=f2e103]:
            - generic [ref=f2e104]:
              - heading "Your saved sessions" [level=2] [ref=f2e105]
              - paragraph [ref=f2e106]: Deletion also reconciles cloud comparisons and learning evidence.
            - link "View progress" [ref=f2e107]:
              - /url: /stats
          - generic [ref=f2e109]:
            - generic [ref=f2e110]:
              - paragraph [ref=f2e111]:
                - text: custom
                - generic [ref=f2e112]: 47.3 WPM
              - paragraph [ref=f2e113]: 10/16/2026, 8:47:29 PM · local only
            - button "Delete custom session from 10/16/2026, 8:47:29 PM" [ref=f2e114]: Delete
    - generic [ref=f2e115]:
      - heading "Reset guest workspace" [level=2] [ref=f2e116]
      - paragraph [ref=f2e117]: Remove guest history and learning evidence from this device. Other signed-in workspaces are preserved. Export your history first if you want a copy.
      - generic [ref=f2e118]: Type DELETE to enable this action
      - generic [ref=f2e119]:
        - textbox "Type DELETE to enable this action" [ref=f2e120]
        - button "Reset guest workspace" [disabled] [ref=f2e121]
  - contentinfo [ref=f2e122]:
    - generic [ref=f2e123]:
      - generic [ref=f2e124]:
        - generic [ref=f2e125]:
          - generic [ref=f2e126]: Sparow
          - generic [ref=f2e127]: Type
        - text: Find your rhythm.
      - generic [ref=f2e128]:
        - link "About & metrics" [ref=f2e129]:
          - /url: /about
        - link "Preferences & data" [ref=f2e130]:
          - /url: /settings
        - link "Touch typing guide" [ref=f2e131]:
          - /url: /touch-typing
        - link "Privacy" [ref=f2e132]:
          - /url: /privacy
        - link "Terms" [ref=f2e133]:
          - /url: /terms
        - link "Offline" [ref=f2e134]:
          - /url: /offline
        - generic [ref=f2e135]: SparowType © 2026
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | import { completeCorrectedCat } from "./helpers";
  3  | 
  4  | async function expectViewportFit(page: Page) {
  5  |   await page.waitForFunction(
  6  |     () => document.fonts.status === "loaded" && document.fonts.check('400 16px "Inter Variable"', "SparowType"),
  7  |     undefined,
  8  |     { timeout: 10_000 },
  9  |   );
  10 |   const dimensions = await page.evaluate(() => ({
  11 |     document: document.documentElement.scrollWidth,
  12 |     body: document.body.scrollWidth,
  13 |     viewport: document.documentElement.clientWidth,
  14 |   }));
> 15 |   expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
     |                               ^ Error: expect(received).toBeLessThanOrEqual(expected)
  16 |   expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  17 | }
  18 | 
  19 | test("populated history, comparison chart and account controls fit narrow and tablet screens", async ({ page }, info) => {
  20 |   test.setTimeout(90_000);
  21 |   await page.setViewportSize({ width: 320, height: 800 });
  22 |   await completeCorrectedCat(page);
  23 |   await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  24 | 
  25 |   for (const width of [320, 768]) {
  26 |     await page.setViewportSize({ width, height: 800 });
  27 |     await page.goto("/stats", { waitUntil: "domcontentloaded" });
  28 |     await page.locator("#main-content").waitFor();
  29 |     const history = page.getByRole("table", { name: "Completed sessions, most recent first", exact: true });
  30 |     await expect(history.getByRole("row")).toHaveCount(2);
  31 |     await expect(history.getByRole("row").nth(1)).toContainText("75.0%");
  32 |     await page.getByRole("combobox", { name: "Comparison", exact: true }).selectOption({ index: 1 });
  33 |     const chart = page.getByRole("img", { name: /Typing speed for 1 matched sessions/ });
  34 |     await expect(chart).toBeVisible();
  35 |     await expect(chart.locator("svg").first()).toBeVisible();
  36 |     const calendar = page.getByRole("heading", { name: "Recent practice days", exact: true }).locator("..");
  37 |     await expect(calendar.locator("[tabindex='0']")).toHaveCount(35);
  38 |     expect(await calendar.evaluate((element) => {
  39 |       const panel = element.getBoundingClientRect();
  40 |       return Array.from(element.querySelectorAll("[tabindex='0']")).every((day) => {
  41 |         const rect = day.getBoundingClientRect();
  42 |         return rect.left >= panel.left && rect.right <= panel.right;
  43 |       });
  44 |     })).toBe(true);
  45 |     await expectViewportFit(page);
  46 |     const scroller = history.locator("..");
  47 |     await scroller.scrollIntoViewIfNeeded();
  48 |     await scroller.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  49 |     await expect(history.getByRole("columnheader", { name: "Save state", exact: true })).toBeInViewport();
  50 |     if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/stats-populated-320-${info.project.name}.png`, fullPage: true });
  51 | 
  52 |     await page.goto("/profile", { waitUntil: "domcontentloaded" });
  53 |     await page.locator("#main-content").waitFor();
  54 |     await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  55 |     await expect(page.getByText("1 saved sessions", { exact: false })).toBeVisible();
  56 |     await expect(page.getByRole("button", { name: /^Delete custom session from/ })).toBeVisible();
  57 |     const settings = page.getByRole("link", { name: "Practice & appearance settings", exact: true });
  58 |     const bounds = await settings.boundingBox();
  59 |     expect(bounds).not.toBeNull();
  60 |     expect(bounds!.x).toBeGreaterThanOrEqual(0);
  61 |     expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  62 |     await expectViewportFit(page);
  63 |     if (width === 320) await page.screenshot({ path: `audit/responsive-2026-10-16/profile-populated-320-${info.project.name}.png`, fullPage: true });
  64 |   }
  65 | });
  66 | 
```