import { test, expect, type Page } from "@playwright/test";
import { phpApiBase } from "./php-api-fixture";
import { focusTyping } from "./helpers";

// These tests own every API response. Service-worker-owned fetches bypass page
// routing; actual PWA caching/worker behavior has separate acceptance coverage.
test.use({ serviceWorkers: "block" });

const pendingAccount = { id: "a1111111-1111-4111-8111-111111111111", email: "readiness@example.test", handle: "readiness_fixture", created_at: "2026-10-20T00:00:00Z" };

async function holdAccountBootstrap(page: Page, appUrl: string, account: typeof pendingAccount | null) {
  const base = phpApiBase(appUrl);
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const observed = new Promise<void>(resolve => { requested = resolve; });
  const paths: string[] = [];
  await page.route(`${base.href}**`, async route => {
    const path = new URL(route.request().url()).pathname.slice(base.pathname.length - 1);
    paths.push(path);
    if (path === "/auth/session") {
      requested();
      await gate;
      await route.fulfill({ json: { user: account, csrfToken: "readiness-fixture" } });
    } else {
      const body = path === "/preferences" ? { preferences: {}, version: 0 }
        : path === "/sessions" ? { sessions: [], learningEvidence: [], version: 0, hasMore: false }
        : path === "/data/version" ? { ownerId: account?.id ?? "guest", version: 0 }
        : path === "/profile" && account ? { id: account.id, handle: account.handle }
        : {};
      await route.fulfill({ json: body });
    }
  });
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  return { release, observed, paths };
}

for (const account of [true, false]) {
  for (const workspace of ["Test", "Learn", "Lessons", "Games", "local bot"] as const) {
    test(`initial owner readiness protects ${workspace} with a delayed ${account ? "account" : "guest"} session`, async ({ page, baseURL }, info) => {
      const fixture = await holdAccountBootstrap(page, baseURL!, account ? pendingAccount : null);
      const route = { Test: "/", Learn: "/learn", Lessons: "/lessons?lesson=home-anchors", Games: "/games", "local bot": "/race" }[workspace];
      try {
        await page.goto(route);
        await fixture.observed;
        await expect(page.getByRole("status", { name: "Preparing account workspace", exact: true })).toBeVisible();
        await expect(page.locator("#main-content")).toHaveCount(0);
        await expect(page.locator(".typing-workspace, [aria-label='Adaptive typing lesson'], .course-preview, [aria-label='Signal Run game']")).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Start bot practice", exact: true })).toHaveCount(0);
        fixture.release();
        await expect(page.locator("main#main-content")).toBeVisible();
        await expect(page.getByRole("link", { name: account ? "Account" : "Sign in", exact: true })).toBeVisible();
        let retainedPrefix: string;
        if (workspace === "Learn") {
          const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
          const target = (await page.locator(".learn-stream-text").textContent())!;
          retainedPrefix = target.slice(0, 4);
          await input.focus();
          await input.pressSequentially(retainedPrefix, { delay: 20 });
          // Adaptive input is a transient native draft, cleared after each
          // commit. The canonical retained text lives in the passage slots.
          const committed = page.locator('.learn-stream-text [data-typed]');
          await expect(committed).toHaveCount(retainedPrefix.length);
          await expect(committed).toHaveText([...retainedPrefix]);
          await expect(page.locator('.learn-stream-text [data-current="true"]')).toHaveAttribute('data-slot-index', String(retainedPrefix.length));
          await expect(input).toHaveValue("");
        } else if (workspace === "Games") {
          await page.getByRole("button", { name: "Start calm journey", exact: true }).click();
          const input = page.getByRole("textbox", { name: "Your word", exact: true });
          retainedPrefix = (await page.getByTestId("game-target").getAttribute("aria-label"))!.replace("Target word: ", "").slice(0, 2);
          await input.pressSequentially(retainedPrefix, { delay: 20 });
          await expect(input).toHaveValue(retainedPrefix);
          await expect(page.getByRole("region", { name: "Signal Run game", exact: true })).toBeVisible();
        } else {
          if (workspace === "Lessons") await page.getByRole("button", { name: "Start lesson", exact: true }).click();
          if (workspace === "local bot") await page.getByRole("button", { name: "Start bot practice", exact: true }).click();
          const input = await focusTyping(page);
          retainedPrefix = (await page.getByTestId("typing-target").textContent())!.slice(0, 4);
          await input.pressSequentially(retainedPrefix, { delay: 20 });
          await expect(input).toHaveValue(retainedPrefix);
        }
        await expect(page.getByRole("status", { name: "Preparing account workspace", exact: true })).toHaveCount(0);
        await info.attach("initial-owner-readiness", { contentType: "application/json", body: JSON.stringify({
          workspace, resolvedOwner: account ? pendingAccount.id : "guest", retainedPrefix,
          noProvisionalControllerMounted: true, requests: fixture.paths, realBackendRequests: false,
        }) });
      } finally { fixture.release(); }
    });
  }
}

test("public sign-in remains available while the initial cookie session is pending", async ({ page, baseURL }) => {
  const fixture = await holdAccountBootstrap(page, baseURL!, null);
  try {
    await page.goto("/auth");
    await fixture.observed;
    await expect(page.getByRole("heading", { name: "Welcome Back", exact: true })).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toBeEnabled();
    await expect(page.getByRole("status", { name: "Preparing account workspace", exact: true })).toHaveCount(0);
  } finally { fixture.release(); }
});

test("cross-tab account change discards a previous owner's unsaved private passage", async ({ page, baseURL }) => {
  const base = phpApiBase(baseURL!);
  const alice = "a1111111-1111-4111-8111-111111111111", bob = "b2222222-2222-4222-8222-222222222222";
  let owner = alice;
  // All PHP API traffic is intercepted. This verifies UI account isolation and
  // cookie-session notifications; it is separate from real account acceptance.
  await page.route(`${base.href}**`, async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.slice(base.pathname.length - 1);
    const requestedOwner = url.searchParams.get("expectedOwner");
    if (requestedOwner && requestedOwner !== owner) {
      await route.fulfill({ status: 409, json: { error: { code: "owner-changed", message: "Account changed" } } });
      return;
    }
    const user = { id: owner, email: `${owner}@fixture.invalid`, handle: owner === alice ? "alice" : "bob", created_at: "2026-10-19T00:00:00Z" };
    const body = path === "/auth/session" ? { user, csrfToken: `fixture-${owner}` }
      : path === "/preferences" ? { preferences: {}, version: 0 }
      : path.startsWith("/sessions") ? { sessions: [], learningEvidence: [], version: 0, hasMore: false }
      : path === "/data/version" ? { ownerId: owner, version: 0 }
      : path === "/profile" ? { id: owner, handle: user.handle }
      : {};
    await route.fulfill({ json: body });
  });
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  await page.getByRole("group", { name: "Test mode" }).getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByRole("textbox", { name: "Custom practice passage" }).fill("Private passage belonging to the previous account");
  await page.getByRole("button", { name: "Start private practice" }).click();
  await expect(page.getByTestId("typing-target")).toContainText("Private passage");
  owner = bob;
  await page.evaluate(() => {
    // A second tab announces only that cookie auth changed; no token or account
    // data is trusted from localStorage. The API must provide the new identity.
    window.dispatchEvent(new StorageEvent("storage", { key: "sparowtype:auth-changed", newValue: "fixture-notification" }));
  });
  await expect(page.getByRole("textbox", { name: "Custom practice passage" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Custom practice passage" })).toHaveValue("");
  await expect(page.getByTestId("typing-target")).toHaveCount(0);
  await expect(page.getByText("Private passage belonging to the previous account", { exact: true })).toHaveCount(0);
});
