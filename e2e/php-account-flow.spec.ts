import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { phpApiBase } from "./php-api-fixture";
import { focusTyping } from "./helpers";

test("real PHP account signup, replay upload, independent-device history/preferences and account deletion", async ({ page, browser, baseURL }, info) => {
  test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1", "Enable PHP_E2E_ACCEPTANCE=1 only against the intended local/staging PHP and MySQL acceptance database. This creates and deletes its own dedicated account.");
  test.setTimeout(90000);
  const timingAudit = process.env.SPAROWTYPE_NATIVE_TIMING_AUDIT === "1";
  const timingOrigin = timingAudit ? performance.now() : 0;
  let timingEntries = 0;
  const stage = (label: string) => {
    if (timingAudit && timingEntries++ < 160)
      console.log(JSON.stringify({ type: "native-account-stage", stage: label, elapsedMs: Math.round((performance.now() - timingOrigin) * 1000) / 1000 }));
  };
  stage("test.begin");
  const api = phpApiBase(baseURL!);
  const email = `sparowtype-${randomUUID()}@example.test`;
  const password = `Acceptance!${randomUUID()}`;
  let owner: string | null = null;
  let second: BrowserContext | null = null;
  let current: Page = page;
  const session = async (target: Page) => {
    stage("session.request");
    const response = await target.request.get(new URL("auth/session", api).href);
    stage("session.response");
    expect(response.ok()).toBe(true);
    return response.json() as Promise<{ user: { id: string; email: string } | null; csrfToken: string }>;
  };
  const signIn = async (target: Page) => {
    stage("second.signin.goto-auth");
    await target.goto("/auth");
    stage("second.signin.fill-email");
    await target.getByLabel("Email", { exact: true }).fill(email);
    stage("second.signin.fill-password");
    await target.getByLabel("Password", { exact: true }).fill(password);
    stage("second.signin.click");
    await target.getByRole("button", { name: "Sign In", exact: true }).click();
    stage("second.signin.expect-home-url");
    await expect(target).toHaveURL("/");
    stage("second.signin.expect-account-link");
    await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
    stage("second.signin.complete");
  };
  try {
    stage("first.init-script");
    await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
    stage("first.goto-auth");
    await page.goto("/auth");
    stage("first.signup.switch-form");
    await page.getByRole("button", { name: "Don't have an account? Sign up", exact: true }).click();
    stage("first.signup.fill-email");
    await page.getByLabel("Email", { exact: true }).fill(email);
    stage("first.signup.fill-password");
    await page.getByLabel("Password", { exact: true }).fill(password);
    const signupResponse = page.waitForResponse(response => response.url() === new URL('auth/signup', api).href && response.request().method() === 'POST');
    stage("first.signup.click-create");
    await page.getByRole("button", { name: "Create Account", exact: true }).click();
    stage("first.signup.await-response");
    const signup = await signupResponse;
    expect(signup.ok(), `Dedicated acceptance signup returned HTTP ${signup.status()}; verify the intended test database and its rate-limit window before interpreting cookie policy.`).toBe(true);
    stage("first.signup.read-cookie-headers");
    const emittedCookies = (await signup.headersArray()).filter(header => header.name.toLowerCase() === 'set-cookie');
    expect(emittedCookies.some(header => /;\s*HttpOnly(?:;|$)/i.test(header.value) && /;\s*SameSite=Lax(?:;|$)/i.test(header.value))).toBe(true);
    stage("first.signup.expect-home-url");
    await expect(page).toHaveURL("/");
    stage("first.signup.read-session");
    const signedIn = await session(page);
    expect(signedIn.user?.email).toBe(email);
    owner = signedIn.user!.id;
    stage("first.signup.read-cookie-policy");
    const cookies = await page.context().cookies();
    expect(cookies.some(cookie => cookie.httpOnly)).toBe(true);
    stage("first.signup.attach-cookie-policy");
    await info.attach('session-cookie-policy', {
      contentType:'application/json',
      body:JSON.stringify({emittedHttpOnlyAndSameSiteLax:true, browserReportedSameSite:cookies.filter(cookie=>cookie.httpOnly).map(cookie=>cookie.sameSite), limitation:'Windows WebKit can report None despite the actual SameSite=Lax header. This verifies emitted policy and HttpOnly storage, not native cross-site cookie enforcement.'}),
    });

    stage("first.words.select-mode");
    await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: "Words", exact: true }).click();
    stage("first.words.select-count");
    await page.getByRole("button", { name: /10\s*words/i }).click();
    stage("first.words.focus-input");
    const input = await focusTyping(page);
    stage("first.words.read-passage");
    const passage = (await page.getByTestId("typing-target").textContent())!;
    expect(passage.length).toBeGreaterThan(5);
    const wrong = passage[1] === "x" ? "z" : "x";
    stage("first.words.type-wrong-prefix");
    await input.pressSequentially(passage[0] + wrong, { delay: 70 });
    stage("first.words.correct-backspace");
    await input.press("Backspace");
    stage("first.words.type-rest");
    await input.pressSequentially(passage.slice(1), { delay: 70 });
    stage("first.words.expect-results");
    await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
    stage("first.words.expect-saved");
    await expect(page.getByText("Saved to your account.", { exact: true })).toBeVisible({ timeout: 20000 });
    stage("first.words.request-history");
    const historyResponse = await page.request.get(new URL(`sessions?expectedOwner=${owner}&limit=500&offset=0`, api).href);
    expect(historyResponse.ok()).toBe(true);
    stage("first.words.read-history");
    const history = await historyResponse.json();
    expect(history.sessions).toHaveLength(1);
    expect(history.sessions[0].metrics.incorrectAttempts).toBe(1);
    expect(history.sessions[0].metrics.inputAccuracy).toBeCloseTo(100 * passage.length / (passage.length + 1));

    stage("first.lesson.goto");
    await page.goto("/lessons?lesson=home-anchors");
    stage("first.lesson.start");
    await page.getByRole("button", { name: "Start lesson", exact: true }).click();
    stage("first.lesson.focus-input");
    const courseInput = await focusTyping(page);
    stage("first.lesson.read-passage");
    const coursePassage = (await page.getByTestId("typing-target").textContent())!;
    stage("first.lesson.type-passage");
    await courseInput.pressSequentially(coursePassage, { delay: 70 });
    stage("first.lesson.expect-checkpoint");
    await expect(page.getByRole("heading", { name: "Checkpoint earned.", exact: true })).toBeVisible();
    stage("first.lesson.expect-saved");
    await expect(page.getByText("Saved to your account.", { exact: true })).toBeVisible({ timeout: 20000 });
    stage("first.lesson.expect-progress");
    await expect(page.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible();

    stage("first.settings.goto");
    await page.goto("/settings");
    stage("first.settings.select-paper");
    await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
    stage("first.settings.select-dvorak");
    await page.getByRole("combobox", { name: "Keyboard layout", exact: true }).selectOption("dvorak");
    stage("first.settings.hide-keyboard");
    await page.getByRole("checkbox", { name: "Live keyboard", exact: true }).uncheck();
    stage("first.settings.hide-finger-guide");
    await page.getByRole("checkbox", { name: "Finger guide", exact: true }).uncheck();
    stage("first.settings.expect-saved");
    await expect(page.getByText("Preferences saved to your account.", { exact: true })).toBeVisible({ timeout: 10000 });
    stage("first.profile.goto");
    await page.goto("/profile");
    stage("first.profile.fill-handle");
    await page.getByRole("textbox", { name: "Handle", exact: true }).fill(`qa_${randomUUID().replaceAll("-", "").slice(0, 16)}`);
    stage("first.profile.save-handle");
    await page.getByRole("button", { name: "Save handle", exact: true }).click();
    stage("first.profile.expect-handle-saved");
    await expect(page.getByRole("status")).toContainText("Your public handle is saved.");
    stage("first.profile.sign-out");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    stage("first.profile.expect-guest");
    await expect(page.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();

    // A new context has no originating IndexedDB, preference storage or cookies.
    stage("second.create-context");
    second = await browser.newContext({ baseURL });
    stage("second.init-script");
    await second.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
    stage("second.create-page");
    current = await second.newPage();
    stage("second.signin.begin");
    await signIn(current);
    stage("second.profile-history.goto");
    await current.goto("/profile");
    stage("second.profile-history.expect-two-sessions");
    await expect(current.getByText("2 saved sessions", { exact: false })).toBeVisible({ timeout: 10000 });
    stage("second.lesson.goto");
    await current.goto("/lessons?lesson=home-anchors");
    stage("second.lesson.expect-progress");
    await expect(current.getByText("1 of 2 checkpoints", { exact: true })).toBeVisible({ timeout: 10000 });
    stage("second.settings.goto");
    await current.goto("/settings");
    stage("second.settings.expect-paper");
    await expect(current.locator("html")).toHaveAttribute("data-theme", "paper");
    stage("second.settings.expect-dvorak");
    await expect(current.getByRole("combobox", { name: "Keyboard layout", exact: true })).toHaveValue("dvorak");
    stage("second.settings.expect-keyboard-hidden");
    await expect(current.getByRole("checkbox", { name: "Live keyboard", exact: true })).not.toBeChecked();
    stage("second.settings.expect-finger-guide-hidden");
    await expect(current.getByRole("checkbox", { name: "Finger guide", exact: true })).not.toBeChecked();
    stage("second.profile-deletion.goto");
    await current.goto("/profile");
    stage("second.profile-deletion.fill-confirmation");
    await current.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");
    stage("second.profile-deletion.click-delete");
    await current.getByRole("button", { name: "Permanently delete account", exact: true }).click();
    stage("second.profile-deletion.expect-guest");
    await expect(current.getByRole("heading", { name: "Guest workspace", exact: true })).toBeVisible();
    stage("second.profile-deletion.expect-empty-session");
    expect((await session(current)).user).toBeNull();
    owner = null;
    stage("workflow.complete");
  } finally {
    stage("cleanup.begin");
    // Cleanup is restricted to the unique account created by this test.
    if (owner) {
      stage("cleanup.owner-session");
      const state = await session(current);
      if (state.user?.id === owner) {
        stage("cleanup.owner-delete-request");
        const removed = await current.request.post(new URL("account/delete", api).href, {
          headers: { "X-CSRF-Token": state.csrfToken }, data: { confirmation: "DELETE MY ACCOUNT", expectedOwner: owner },
        });
        expect(removed.ok(), "Dedicated acceptance account cleanup").toBe(true);
        stage("cleanup.owner-delete-confirmed");
      }
    }
    stage("cleanup.close-second-context");
    await second?.close();
    stage("cleanup.complete");
  }
});
