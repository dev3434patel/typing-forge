# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: php-account-flow.spec.ts >> real PHP account signup, replay upload, independent-device history/preferences and account deletion
- Location: e2e\php-account-flow.spec.ts:6:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - region "Notifications (F8)":
      - list [ref=e5]:
        - listitem [ref=e6]:
          - generic [ref=e7]:
            - generic [ref=e8]: Error
            - generic [ref=e9]: Too many requests. Wait briefly before retrying.
          - button [ref=e10]
    - main [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e19]:
            - generic [ref=e20]: Sparow
            - generic [ref=e21]: Type
          - heading "Create Account" [level=1] [ref=e22]
          - paragraph [ref=e23]: Join the community and start improving
        - generic [ref=e24]:
          - generic [ref=e25]:
            - paragraph [ref=e26]: Choose your public handle in Profile after signing in. Your email stays private.
            - generic [ref=e27]:
              - text: Email
              - textbox "Email" [ref=e32]:
                - /placeholder: you@example.com
                - text: sparowtype-0e7403b5-370b-44da-af60-8f12441ba164@example.test
            - generic [ref=e33]:
              - text: Password
              - textbox "Password" [ref=e38]:
                - /placeholder: ••••••••
                - text: Acceptance!2194af5b-83d2-4155-ac3e-0acb74d12f77
            - button "Create Account" [ref=e39]
          - button "Already have an account? Sign in" [ref=e41]
        - link "← Back to typing" [ref=e43] [cursor=pointer]:
          - /url: /
  - status [ref=e44]: Notification ErrorToo many requests. Wait briefly before retrying.
```

# Test source

```ts
  1   | import { expect, test, type BrowserContext, type Page } from "@playwright/test";
  2   | import { randomUUID } from "node:crypto";
  3   | import { phpApiBase } from "./php-api-fixture";
  4   | import { focusTyping } from "./helpers";
  5   | 
  6   | test("real PHP account signup, replay upload, independent-device history/preferences and account deletion", async ({ page, browser, baseURL }, info) => {
  7   |   test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1", "Enable PHP_E2E_ACCEPTANCE=1 only against the intended local/staging PHP and MySQL acceptance database. This creates and deletes its own dedicated account.");
  8   |   test.setTimeout(90000);
  9   |   const api = phpApiBase(baseURL!);
  10  |   const email = `sparowtype-${randomUUID()}@example.test`;
  11  |   const password = `Acceptance!${randomUUID()}`;
  12  |   let owner: string | null = null;
  13  |   let second: BrowserContext | null = null;
  14  |   let current: Page = page;
  15  |   const session = async (target: Page) => {
  16  |     const response = await target.request.get(new URL("auth/session", api).href);
  17  |     expect(response.ok()).toBe(true);
  18  |     return response.json() as Promise<{ user: { id: string; email: string } | null; csrfToken: string }>;
  19  |   };
  20  |   const signIn = async (target: Page) => {
  21  |     await target.goto("/auth");
  22  |     await target.getByLabel("Email", { exact: true }).fill(email);
  23  |     await target.getByLabel("Password", { exact: true }).fill(password);
  24  |     await target.getByRole("button", { name: "Sign In", exact: true }).click();
  25  |     await expect(target).toHaveURL("/");
  26  |     await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  27  |   };
  28  |   try {
  29  |     await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  30  |     await page.goto("/auth");
  31  |     await page.getByRole("button", { name: "Don't have an account? Sign up", exact: true }).click();
  32  |     await page.getByLabel("Email", { exact: true }).fill(email);
  33  |     await page.getByLabel("Password", { exact: true }).fill(password);
  34  |     const signupResponse = page.waitForResponse(response => response.url() === new URL('auth/signup', api).href && response.request().method() === 'POST');
  35  |     await page.getByRole("button", { name: "Create Account", exact: true }).click();
  36  |     const emittedCookies = (await (await signupResponse).headersArray()).filter(header => header.name.toLowerCase() === 'set-cookie');
> 37  |     expect(emittedCookies.some(header => /;\s*HttpOnly(?:;|$)/i.test(header.value) && /;\s*SameSite=Lax(?:;|$)/i.test(header.value))).toBe(true);
      |                                                                                                                                       ^ Error: expect(received).toBe(expected) // Object.is equality
  38  |     await expect(page).toHaveURL("/");
  39  |     const signedIn = await session(page);
  40  |     expect(signedIn.user?.email).toBe(email);
  41  |     owner = signedIn.user!.id;
  42  |     const cookies = await page.context().cookies();
  43  |     expect(cookies.some(cookie => cookie.httpOnly)).toBe(true);
  44  |     await info.attach('session-cookie-policy', {
  45  |       contentType:'application/json',
  46  |       body:JSON.stringify({emittedHttpOnlyAndSameSiteLax:true, browserReportedSameSite:cookies.filter(cookie=>cookie.httpOnly).map(cookie=>cookie.sameSite), limitation:'Windows WebKit can report None despite the actual SameSite=Lax header. This verifies emitted policy and HttpOnly storage, not native cross-site cookie enforcement.'}),
  47  |     });
  48  | 
  49  |     await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: "Words", exact: true }).click();
  50  |     await page.getByRole("button", { name: /10\s*words/i }).click();
  51  |     const input = await focusTyping(page);
  52  |     const passage = (await page.getByTestId("typing-target").textContent())!;
  53  |     expect(passage.length).toBeGreaterThan(5);
  54  |     const wrong = passage[1] === "x" ? "z" : "x";
  55  |     await input.pressSequentially(passage[0] + wrong, { delay: 70 });
  56  |     await input.press("Backspace");
  57  |     await input.pressSequentially(passage.slice(1), { delay: 70 });
  58  |     await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  59  |     await expect(page.getByText("Saved to your account.", { exact: true })).toBeVisible({ timeout: 20000 });
  60  |     const historyResponse = await page.request.get(new URL(`sessions?expectedOwner=${owner}&limit=500&offset=0`, api).href);
  61  |     expect(historyResponse.ok()).toBe(true);
  62  |     const history = await historyResponse.json();
  63  |     expect(history.sessions).toHaveLength(1);
  64  |     expect(history.sessions[0].metrics.incorrectAttempts).toBe(1);
  65  |     expect(history.sessions[0].metrics.inputAccuracy).toBeCloseTo(100 * passage.length / (passage.length + 1));
  66  | 
  67  |     await page.goto("/settings");
  68  |     await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
  69  |     await page.getByRole("combobox", { name: "Keyboard layout", exact: true }).selectOption("dvorak");
  70  |     await expect(page.getByText("Preferences saved to your account.", { exact: true })).toBeVisible({ timeout: 10000 });
  71  |     await page.goto("/profile");
  72  |     await page.getByRole("textbox", { name: "Handle", exact: true }).fill(`qa_${randomUUID().replaceAll("-", "").slice(0, 16)}`);
  73  |     await page.getByRole("button", { name: "Save handle", exact: true }).click();
  74  |     await expect(page.getByRole("status")).toContainText("Your public handle is saved.");
  75  |     await page.getByRole("button", { name: "Sign out", exact: true }).click();
  76  |     await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  77  | 
  78  |     // A new context has no originating IndexedDB, preference storage or cookies.
  79  |     second = await browser.newContext({ baseURL });
  80  |     await second.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  81  |     current = await second.newPage();
  82  |     await signIn(current);
  83  |     await current.goto("/profile");
  84  |     await expect(current.getByText("1 saved sessions", { exact: false })).toBeVisible({ timeout: 10000 });
  85  |     await current.goto("/settings");
  86  |     await expect(current.locator("html")).toHaveAttribute("data-theme", "paper");
  87  |     await expect(current.getByRole("combobox", { name: "Keyboard layout", exact: true })).toHaveValue("dvorak");
  88  |     await current.goto("/profile");
  89  |     await current.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");
  90  |     await current.getByRole("button", { name: "Permanently delete account", exact: true }).click();
  91  |     await expect(current.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
  92  |     expect((await session(current)).user).toBeNull();
  93  |     owner = null;
  94  |   } finally {
  95  |     // Cleanup is restricted to the unique account created by this test.
  96  |     if (owner) {
  97  |       const state = await session(current);
  98  |       if (state.user?.id === owner) {
  99  |         const removed = await current.request.post(new URL("account/delete", api).href, {
  100 |           headers: { "X-CSRF-Token": state.csrfToken }, data: { confirmation: "DELETE MY ACCOUNT", expectedOwner: owner },
  101 |         });
  102 |         expect(removed.ok(), "Dedicated acceptance account cleanup").toBe(true);
  103 |       }
  104 |     }
  105 |     await second?.close();
  106 |   }
  107 | });
  108 | 
```