# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-pwa.spec.ts >> public app download supports offline guest practice and clearing preserves real history
- Location: e2e\offline-pwa.spec.ts:11:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Your offline workspace', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Your offline workspace', exact: true }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Your offline workspace', exact: true })

```

```yaml
- main:
  - paragraph: SparowType · Offline
  - heading "This page needs a connection." [level=1]
  - paragraph: Your browser can reopen the public practice workspace from its completed app download. Account requests, live rankings and human races need a connection. Your local typing history is not removed.
  - navigation "Offline recovery":
    - link "Open guest practice":
      - /url: /
    - link "Open adaptive lessons":
      - /url: /learn
    - link "Offline information":
      - /url: /offline
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { completeCorrectedCat } from "./helpers";
  3   | import { INTRO_ENABLED_STORAGE_KEY } from "../src/lib/opening-experience";
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await page.addInitScript(
  7   |     (key) => localStorage.setItem(key, "false"),
  8   |     INTRO_ENABLED_STORAGE_KEY,
  9   |   );
  10  | });
  11  | test("public app download supports offline guest practice and clearing preserves real history", async ({
  12  |   page,
  13  |   context,
  14  | }) => {
  15  |   test.skip(
  16  |     !process.env.CI && !process.env.PLAYWRIGHT_BASE_URL,
  17  |     "Offline integration requires a production build/preview; the development server intentionally does not register a worker.",
  18  |   );
  19  |   await page.goto("/offline");
  20  |   test.skip(
  21  |     !(await page.evaluate(
  22  |       () => "serviceWorker" in navigator && "caches" in window,
  23  |     )),
  24  |     "UNVERIFIED: this browser does not expose the service-worker/cache APIs required for offline installation.",
  25  |   );
  26  |   await expect(
  27  |     page.getByRole("heading", { name: "Your offline workspace", exact: true }),
> 28  |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  29  |   await expect(page.getByText(/Public download: available/)).toBeVisible();
  30  |   await expect
  31  |     .poll(() =>
  32  |       page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  33  |     )
  34  |     .toBe(true);
  35  |   const cachedPaths = await page.evaluate(async () => {
  36  |     const names = (await caches.keys()).filter((name) =>
  37  |       name.startsWith("sparowtype-public-v1-"),
  38  |     );
  39  |     return (
  40  |       await Promise.all(
  41  |         names.map(async (name) =>
  42  |           (await (await caches.open(name)).keys()).map(
  43  |             (request) => new URL(request.url).pathname,
  44  |           ),
  45  |         ),
  46  |       )
  47  |     ).flat();
  48  |   });
  49  |   expect(cachedPaths).toContain("/index.html");
  50  |   expect(cachedPaths).toContain("/offline.html");
  51  |   expect(
  52  |     cachedPaths.some((path) =>
  53  |       /\/(?:auth|profile|stats|api|rest|functions)(?:\/|$)/.test(path),
  54  |     ),
  55  |   ).toBe(false);
  56  |   await completeCorrectedCat(page);
  57  |   await expect(
  58  |     page
  59  |       .getByRole("status")
  60  |       .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  61  |   ).toBeVisible();
  62  |   await context.setOffline(true);
  63  |   await completeCorrectedCat(page);
  64  |   await expect(
  65  |     page
  66  |       .getByRole("status")
  67  |       .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  68  |   ).toBeVisible();
  69  |   await page.goto("/touch-typing");
  70  |   await expect(
  71  |     page.getByRole("heading", {
  72  |       name: "Learn touch typing, one calm step at a time.",
  73  |       exact: true,
  74  |     }),
  75  |   ).toBeVisible();
  76  |   await page.goto("/profile");
  77  |   await expect(
  78  |     page.getByRole("heading", {
  79  |       name: "This page needs a connection.",
  80  |       exact: true,
  81  |     }),
  82  |   ).toBeVisible();
  83  |   await context.setOffline(false);
  84  |   await page.goto("/offline");
  85  |   await page
  86  |     .getByRole("button", { name: "Remove offline download", exact: true })
  87  |     .click();
  88  |   await expect(
  89  |     page
  90  |       .getByRole("status")
  91  |       .filter({ hasText: "Public offline files removed." }),
  92  |   ).toBeVisible();
  93  |   expect(
  94  |     await page.evaluate(async () => {
  95  |       for (const name of (await caches.keys()).filter((value) =>
  96  |         value.startsWith("sparowtype-public-v1-"),
  97  |       ))
  98  |         if (await (await caches.open(name)).match("/index.html")) return true;
  99  |       return false;
  100 |     }),
  101 |   ).toBe(false);
  102 |   await page.goto("/stats");
  103 |   const table = page.getByRole("table", {
  104 |     name: "Completed sessions, most recent first",
  105 |     exact: true,
  106 |   });
  107 |   await expect(table.getByRole("row")).toHaveCount(3);
  108 |   await expect(table.getByRole("row").nth(1)).toContainText("75.0%");
  109 |   await expect(table.getByRole("row").nth(2)).toContainText("75.0%");
  110 | });
  111 | 
```