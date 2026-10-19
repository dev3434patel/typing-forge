import { test, expect, type Page, type Route } from "@playwright/test";
import { phpApiBase } from "./php-api-fixture";

// These tests own every account response. Worker-controlled traffic can bypass
// Playwright page routes; offline-worker behavior has its own separate coverage.
test.use({ serviceWorkers: "block" });

const owner = "a1111111-1111-4111-8111-111111111111";
const initialHandle = "profile_fixture";

async function installIdentityFixture(page: Page, appUrl: string, profile: (route: Route) => Promise<void>) {
  const api = phpApiBase(appUrl);
  const calls = { sessions: 0, profiles: 0, savedHandles: [] as string[] };
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  await page.route(`${api.href}**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(api.pathname.length - 1);
    if (path === "/auth/session") {
      calls.sessions++;
      await route.fulfill({ json: { user: { id: owner, email: "profile@fixture.invalid", handle: initialHandle, created_at: "2026-10-19T00:00:00Z" }, csrfToken: `profile-csrf-${calls.sessions}` } });
    } else if (path === "/profile" && request.method() === "GET") {
      calls.profiles++;
      await profile(route);
    } else if (path === "/profile" && request.method() === "POST") {
      const body = request.postDataJSON() as { expectedOwner: string; handle: string };
      expect(body.expectedOwner).toBe(owner);
      calls.savedHandles.push(body.handle);
      await route.fulfill({ json: { id: owner, handle: body.handle } });
    } else {
      const body = path === "/preferences" ? { preferences: {}, version: 0 }
        : path === "/data/version" ? { ownerId: owner, version: 0 }
          : path.startsWith("/sessions") ? { ownerId: owner, sessions: [], learningEvidence: [], version: 0, hasMore: false }
            : {};
      await route.fulfill({ json: body });
    }
  });
  return { api, calls };
}

test("a delayed initial profile response keeps the handle unavailable until its identity is loaded", async ({ page, baseURL }) => {
  let releaseProfile!: () => void;
  const profileGate = new Promise<void>(resolve => { releaseProfile = resolve; });
  const { calls } = await installIdentityFixture(page, baseURL!, async route => {
    await profileGate;
    await route.fulfill({ json: { id: owner, handle: initialHandle } });
  });
  try {
    await page.goto("/profile");
    await expect.poll(() => calls.profiles).toBe(1);
    const handle = page.getByRole("textbox", { name: "Handle", exact: true });
    const save = page.getByRole("button", { name: "Save handle", exact: true });
    await expect(handle).toBeDisabled();
    await expect(save).toBeDisabled();
    await expect(page.getByRole("status").filter({ hasText: "Loading public identity…" })).toBeVisible();
    releaseProfile();
    await expect(handle).toBeEnabled();
    await expect(handle).toHaveValue(initialHandle);
    await handle.fill("delayed_identity_draft");
    await save.click();
    await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
    expect(calls.savedHandles).toEqual(["delayed_identity_draft"]);
    expect(calls.profiles).toBe(1);
  } finally {
    releaseProfile();
  }
});

test("same-account auth refresh preserves the unsaved handle without requesting the profile again", async ({ page, baseURL }) => {
  const { api, calls } = await installIdentityFixture(page, baseURL!, route => route.fulfill({ json: { id: owner, handle: initialHandle } }));
  await page.goto("/profile");
  const handle = page.getByRole("textbox", { name: "Handle", exact: true });
  await expect(handle).toHaveValue(initialHandle);
  await handle.fill("same_account_draft");
  const beforeRefresh = calls.sessions;
  const refreshed = page.waitForResponse(response => response.url() === `${api.href}auth/session`);
  await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "sparowtype:auth-changed", newValue: "same-account-refresh" })));
  await refreshed;
  await expect.poll(() => calls.sessions).toBeGreaterThan(beforeRefresh);
  // Cross the rendering/effect boundary after the auth response has published.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(handle).toHaveValue("same_account_draft");
  await page.getByRole("button", { name: "Save handle", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
  expect(calls.savedHandles).toEqual(["same_account_draft"]);
  expect(calls.profiles).toBe(1);
});

test("an initial profile fetch error remains visible and releases handle editing", async ({ page, baseURL }) => {
  const { calls } = await installIdentityFixture(page, baseURL!, route => route.fulfill({ status: 503, json: { error: { code: "identity-unavailable", message: "Public identity unavailable in this fixture." } } }));
  await page.goto("/profile");
  await expect(page.getByRole("status").filter({ hasText: "Public identity unavailable in this fixture." })).toBeVisible();
  const handle = page.getByRole("textbox", { name: "Handle", exact: true });
  await expect(handle).toBeEnabled();
  await expect(page.getByRole("status").filter({ hasText: "Loading public identity…" })).toHaveCount(0);
  await handle.fill("recovered_identity");
  await page.getByRole("button", { name: "Save handle", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your public handle is saved." })).toBeVisible();
  expect(calls.savedHandles).toEqual(["recovered_identity"]);
});
