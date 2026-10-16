# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: secondary-pages.spec.ts >> public information pages have real recovery navigation and distinct metadata
- Location: e2e\secondary-pages.spec.ts:10:1

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
  2   | import { INTRO_ENABLED_STORAGE_KEY } from "../src/lib/opening-experience";
  3   | 
  4   | test.beforeEach(async ({ page }) => {
  5   |   await page.addInitScript(
  6   |     (key) => localStorage.setItem(key, "false"),
  7   |     INTRO_ENABLED_STORAGE_KEY,
  8   |   );
  9   | });
  10  | test("public information pages have real recovery navigation and distinct metadata", async ({
  11  |   page,
  12  | }) => {
  13  |   const descriptions = new Set<string>();
  14  |   for (const [path, heading] of [
  15  |     ["/privacy", "Privacy & your data"],
  16  |     ["/terms", "Use & service information"],
  17  |     ["/touch-typing", "Learn touch typing, one calm step at a time."],
  18  |     ["/offline", "Your offline workspace"],
  19  |   ]) {
  20  |     await page.goto(path);
  21  |     await expect(
  22  |       page.getByRole("heading", { name: heading, exact: true }),
> 23  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  24  |     await expect(page.locator("main#main-content")).toBeVisible();
  25  |     await expect(
  26  |       page.getByRole("link", { name: "SparowType home", exact: true }),
  27  |     ).toBeVisible();
  28  |     const description = await page
  29  |       .locator('meta[name="description"]')
  30  |       .getAttribute("content");
  31  |     expect(description?.length).toBeGreaterThan(30);
  32  |     descriptions.add(description!);
  33  |   }
  34  |   expect(descriptions.size).toBe(4);
  35  | });
  36  | test("intent aliases retain real workspaces and canonicalize without exposing private routes", async ({
  37  |   page,
  38  | }) => {
  39  |   await page.goto("/typing-test");
  40  |   await expect(
  41  |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  42  |   ).toBeVisible();
  43  |   const origin = new URL(page.url()).origin;
  44  |   await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
  45  |     "href",
  46  |     `${origin}/`,
  47  |   );
  48  |   await page.goto("/typing-practice");
  49  |   await expect(
  50  |     page.getByRole("region", { name: "Adaptive typing lesson", exact: true }),
  51  |   ).toBeVisible();
  52  |   await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
  53  |     "href",
  54  |     `${origin}/learn`,
  55  |   );
  56  |   await page.goto("/settings");
  57  |   await expect(
  58  |     page.getByRole("heading", {
  59  |       name: "Your practice, your space.",
  60  |       exact: true,
  61  |     }),
  62  |   ).toBeVisible();
  63  |   await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
  64  |     "content",
  65  |     "noindex,nofollow",
  66  |   );
  67  |   await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  68  |   await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  69  | });
  70  | test("unknown paths use the branded accessible recovery without an invented console error", async ({
  71  |   page,
  72  | }) => {
  73  |   const errors: string[] = [];
  74  |   page.on("console", (message) => {
  75  |     if (message.type() === "error") errors.push(message.text());
  76  |   });
  77  |   await page.goto("/a-page-that-does-not-exist");
  78  |   await expect(
  79  |     page.getByRole("heading", {
  80  |       name: "This page is out of reach.",
  81  |       exact: true,
  82  |     }),
  83  |   ).toBeVisible();
  84  |   await expect(page.locator("main#main-content")).toBeVisible();
  85  |   await expect(
  86  |     page.getByRole("navigation", { name: "Page recovery", exact: true }),
  87  |   ).toBeVisible();
  88  |   await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
  89  |     "content",
  90  |     "noindex,nofollow",
  91  |   );
  92  |   await page
  93  |     .getByRole("link", { name: "Return to practice", exact: true })
  94  |     .click();
  95  |   await expect(
  96  |     page.getByRole("textbox", { name: "Typing input", exact: true }),
  97  |   ).toBeVisible();
  98  |   expect(
  99  |     errors.filter((error) => /404 Error: User attempted/.test(error)),
  100 |   ).toEqual([]);
  101 | });
  102 | 
```