import { test, expect } from "@playwright/test";
import { phpApiBase } from "./php-api-fixture";

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
