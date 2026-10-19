import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { phpApiBase } from "./php-api-fixture";
import { focusTyping } from "./helpers";

test("real PHP account signup, replay upload, independent-device history/preferences and account deletion", async ({ page, browser, baseURL }, info) => {
  test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1", "Enable PHP_E2E_ACCEPTANCE=1 only against the intended local/staging PHP and MySQL acceptance database. This creates and deletes its own dedicated account.");
  test.setTimeout(90000);
  const api = phpApiBase(baseURL!);
  const email = `sparowtype-${randomUUID()}@example.test`;
  const password = `Acceptance!${randomUUID()}`;
  let owner: string | null = null;
  let second: BrowserContext | null = null;
  let current: Page = page;
  const session = async (target: Page) => {
    const response = await target.request.get(new URL("auth/session", api).href);
    expect(response.ok()).toBe(true);
    return response.json() as Promise<{ user: { id: string; email: string } | null; csrfToken: string }>;
  };
  const signIn = async (target: Page) => {
    await target.goto("/auth");
    await target.getByLabel("Email", { exact: true }).fill(email);
    await target.getByLabel("Password", { exact: true }).fill(password);
    await target.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(target).toHaveURL("/");
    await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  };
  try {
    await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
    await page.goto("/auth");
    await page.getByRole("button", { name: "Don't have an account? Sign up", exact: true }).click();
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    const signupResponse = page.waitForResponse(response => response.url() === new URL('auth/signup', api).href && response.request().method() === 'POST');
    await page.getByRole("button", { name: "Create Account", exact: true }).click();
    const signup = await signupResponse;
    expect(signup.ok(), `Dedicated acceptance signup returned HTTP ${signup.status()}; verify the intended test database and its rate-limit window before interpreting cookie policy.`).toBe(true);
    const emittedCookies = (await signup.headersArray()).filter(header => header.name.toLowerCase() === 'set-cookie');
    expect(emittedCookies.some(header => /;\s*HttpOnly(?:;|$)/i.test(header.value) && /;\s*SameSite=Lax(?:;|$)/i.test(header.value))).toBe(true);
    await expect(page).toHaveURL("/");
    const signedIn = await session(page);
    expect(signedIn.user?.email).toBe(email);
    owner = signedIn.user!.id;
    const cookies = await page.context().cookies();
    expect(cookies.some(cookie => cookie.httpOnly)).toBe(true);
    await info.attach('session-cookie-policy', {
      contentType:'application/json',
      body:JSON.stringify({emittedHttpOnlyAndSameSiteLax:true, browserReportedSameSite:cookies.filter(cookie=>cookie.httpOnly).map(cookie=>cookie.sameSite), limitation:'Windows WebKit can report None despite the actual SameSite=Lax header. This verifies emitted policy and HttpOnly storage, not native cross-site cookie enforcement.'}),
    });

    await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: "Words", exact: true }).click();
    await page.getByRole("button", { name: /10\s*words/i }).click();
    const input = await focusTyping(page);
    const passage = (await page.getByTestId("typing-target").textContent())!;
    expect(passage.length).toBeGreaterThan(5);
    const wrong = passage[1] === "x" ? "z" : "x";
    await input.pressSequentially(passage[0] + wrong, { delay: 70 });
    await input.press("Backspace");
    await input.pressSequentially(passage.slice(1), { delay: 70 });
    await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
    await expect(page.getByText("Saved to your account.", { exact: true })).toBeVisible({ timeout: 20000 });
    const historyResponse = await page.request.get(new URL(`sessions?expectedOwner=${owner}&limit=500&offset=0`, api).href);
    expect(historyResponse.ok()).toBe(true);
    const history = await historyResponse.json();
    expect(history.sessions).toHaveLength(1);
    expect(history.sessions[0].metrics.incorrectAttempts).toBe(1);
    expect(history.sessions[0].metrics.inputAccuracy).toBeCloseTo(100 * passage.length / (passage.length + 1));

    await page.goto("/settings");
    await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
    await page.getByRole("combobox", { name: "Keyboard layout", exact: true }).selectOption("dvorak");
    await expect(page.getByText("Preferences saved to your account.", { exact: true })).toBeVisible({ timeout: 10000 });
    await page.goto("/profile");
    await page.getByRole("textbox", { name: "Handle", exact: true }).fill(`qa_${randomUUID().replaceAll("-", "").slice(0, 16)}`);
    await page.getByRole("button", { name: "Save handle", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Your public handle is saved.");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();

    // A new context has no originating IndexedDB, preference storage or cookies.
    second = await browser.newContext({ baseURL });
    await second.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
    current = await second.newPage();
    await signIn(current);
    await current.goto("/profile");
    await expect(current.getByText("1 saved sessions", { exact: false })).toBeVisible({ timeout: 10000 });
    await current.goto("/settings");
    await expect(current.locator("html")).toHaveAttribute("data-theme", "paper");
    await expect(current.getByRole("combobox", { name: "Keyboard layout", exact: true })).toHaveValue("dvorak");
    await current.goto("/profile");
    await current.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");
    await current.getByRole("button", { name: "Permanently delete account", exact: true }).click();
    await expect(current.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
    expect((await session(current)).user).toBeNull();
    owner = null;
  } finally {
    // Cleanup is restricted to the unique account created by this test.
    if (owner) {
      const state = await session(current);
      if (state.user?.id === owner) {
        const removed = await current.request.post(new URL("account/delete", api).href, {
          headers: { "X-CSRF-Token": state.csrfToken }, data: { confirmation: "DELETE MY ACCOUNT", expectedOwner: owner },
        });
        expect(removed.ok(), "Dedicated acceptance account cleanup").toBe(true);
      }
    }
    await second?.close();
  }
});
