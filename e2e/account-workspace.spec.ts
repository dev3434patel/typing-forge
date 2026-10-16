import { test, expect } from "@playwright/test";
import { loadEnv } from "vite";
const publicEnv = loadEnv("production", process.cwd(), "VITE_");
const cloudUrl = publicEnv.VITE_SUPABASE_URL;
const cloudKey = publicEnv.VITE_SUPABASE_ANON_KEY || publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
test("cross-tab account change discards a previous owner's unsaved private passage", async ({
  page,
}) => {
  test.skip(
    !cloudUrl || !cloudKey,
    "Public cloud configuration is absent; the app cannot establish an account workspace.",
  );
  const origin = new URL(cloudUrl).origin;
  const storageKey = `sb-${new URL(cloudUrl).hostname.split(".")[0]}-auth-token`;
  const alice = "a1111111-1111-4111-8111-111111111111",
    bob = "b2222222-2222-4222-8222-222222222222";
  function session(id: string) {
    return {
      access_token: "test.fixture.signature",
      refresh_token: "fixture-refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id,
        aud: "authenticated",
        role: "authenticated",
        email: `${id}@fixture.invalid`,
        app_metadata: {},
        user_metadata: {},
        created_at: "2026-01-01T00:00:00Z",
      },
    };
  }
  // All cloud traffic is intercepted. Fixture identities never reach a real service.
  await page.route(`${origin}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        route.request().url().includes("/auth/v1/user")
          ? session(alice).user
          : [],
      ),
    }),
  );
  await page.addInitScript(
    ({ key, value }) => {
      // This case verifies account isolation; the opening has dedicated lifecycle coverage.
      localStorage.setItem("sparowtype.opening-animation.enabled", "false");
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: storageKey, value: session(alice) },
  );
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Account", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Test mode" })
    .getByRole("button", { name: "Custom", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Custom practice passage" })
    .fill("Private passage belonging to the previous account");
  await page.getByRole("button", { name: "Start private practice" }).click();
  await expect(page.getByTestId("typing-target")).toContainText(
    "Private passage",
  );
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
      const channel = new BroadcastChannel(key);
      channel.postMessage({ event: "SIGNED_IN", session: value });
      channel.close();
    },
    { key: storageKey, value: session(bob) },
  );
  await expect(
    page.getByRole("textbox", { name: "Custom practice passage" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Custom practice passage" }),
  ).toHaveValue("");
  await expect(page.getByTestId("typing-target")).toHaveCount(0);
  await expect(
    page.getByText("Private passage belonging to the previous account", {
      exact: true,
    }),
  ).toHaveCount(0);
});
