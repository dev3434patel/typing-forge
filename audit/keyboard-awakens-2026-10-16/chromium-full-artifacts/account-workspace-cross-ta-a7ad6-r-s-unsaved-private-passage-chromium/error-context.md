# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account-workspace.spec.ts >> cross-tab account change discards a previous owner's unsaved private passage
- Location: e2e\account-workspace.spec.ts:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'Account', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('link', { name: 'Account', exact: true }) with timeout 5000ms
  - waiting for getByRole('link', { name: 'Account', exact: true })

```

```yaml
- status: Loading SparowType
- text: 100% Ready to type
- button "Enable intro sound": Sound off
- button "Skip intro"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { loadEnv } from "vite";
  3  | const publicEnv = loadEnv("production", process.cwd(), "VITE_");
  4  | const cloudUrl = publicEnv.VITE_SUPABASE_URL;
  5  | const cloudKey = publicEnv.VITE_SUPABASE_ANON_KEY || publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
  6  | test("cross-tab account change discards a previous owner's unsaved private passage", async ({
  7  |   page,
  8  | }) => {
  9  |   test.skip(
  10 |     !cloudUrl || !cloudKey,
  11 |     "Public cloud configuration is absent; the app cannot establish an account workspace.",
  12 |   );
  13 |   const origin = new URL(cloudUrl).origin;
  14 |   const storageKey = `sb-${new URL(cloudUrl).hostname.split(".")[0]}-auth-token`;
  15 |   const alice = "a1111111-1111-4111-8111-111111111111",
  16 |     bob = "b2222222-2222-4222-8222-222222222222";
  17 |   function session(id: string) {
  18 |     return {
  19 |       access_token: "test.fixture.signature",
  20 |       refresh_token: "fixture-refresh",
  21 |       expires_at: Math.floor(Date.now() / 1000) + 3600,
  22 |       expires_in: 3600,
  23 |       token_type: "bearer",
  24 |       user: {
  25 |         id,
  26 |         aud: "authenticated",
  27 |         role: "authenticated",
  28 |         email: `${id}@fixture.invalid`,
  29 |         app_metadata: {},
  30 |         user_metadata: {},
  31 |         created_at: "2026-01-01T00:00:00Z",
  32 |       },
  33 |     };
  34 |   }
  35 |   // All cloud traffic is intercepted. Fixture identities never reach a real service.
  36 |   await page.route(`${origin}/**`, (route) =>
  37 |     route.fulfill({
  38 |       status: 200,
  39 |       contentType: "application/json",
  40 |       body: JSON.stringify(
  41 |         route.request().url().includes("/auth/v1/user")
  42 |           ? session(alice).user
  43 |           : [],
  44 |       ),
  45 |     }),
  46 |   );
  47 |   await page.addInitScript(
  48 |     ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
  49 |     { key: storageKey, value: session(alice) },
  50 |   );
  51 |   await page.goto("/");
  52 |   await expect(
  53 |     page.getByRole("link", { name: "Account", exact: true }),
> 54 |   ).toBeVisible();
     |     ^ Error: expect(locator).toBeVisible() failed
  55 |   await page
  56 |     .getByRole("group", { name: "Test mode" })
  57 |     .getByRole("button", { name: "Custom", exact: true })
  58 |     .click();
  59 |   await page
  60 |     .getByRole("textbox", { name: "Custom practice passage" })
  61 |     .fill("Private passage belonging to the previous account");
  62 |   await page.getByRole("button", { name: "Start private practice" }).click();
  63 |   await expect(page.getByTestId("typing-target")).toContainText(
  64 |     "Private passage",
  65 |   );
  66 |   await page.evaluate(
  67 |     ({ key, value }) => {
  68 |       localStorage.setItem(key, JSON.stringify(value));
  69 |       const channel = new BroadcastChannel(key);
  70 |       channel.postMessage({ event: "SIGNED_IN", session: value });
  71 |       channel.close();
  72 |     },
  73 |     { key: storageKey, value: session(bob) },
  74 |   );
  75 |   await expect(
  76 |     page.getByRole("textbox", { name: "Custom practice passage" }),
  77 |   ).toBeVisible();
  78 |   await expect(
  79 |     page.getByRole("textbox", { name: "Custom practice passage" }),
  80 |   ).toHaveValue("");
  81 |   await expect(page.getByTestId("typing-target")).toHaveCount(0);
  82 |   await expect(
  83 |     page.getByText("Private passage belonging to the previous account", {
  84 |       exact: true,
  85 |     }),
  86 |   ).toHaveCount(0);
  87 | });
  88 | 
```