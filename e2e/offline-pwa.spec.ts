import { expect, test as base } from "@playwright/test";
import { completeCorrectedCat } from "./helpers";
import { INTRO_ENABLED_STORAGE_KEY } from "../src/lib/opening-experience";
import { startPwaStaticServer } from "./pwa-static-server";

const test = base.extend<{
  offlineServer: Awaited<ReturnType<typeof startPwaStaticServer>>;
}>({
  offlineServer: async ({ browserName: _browserName }, provide) => {
    const server = await startPwaStaticServer();
    try {
      await provide(server);
    } finally {
      await server.stop();
    }
  },
  baseURL: async ({ offlineServer }, provide) => {
    await provide(offlineServer.origin);
  },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "false"),
    INTRO_ENABLED_STORAGE_KEY,
  );
});
test("public app download supports a real server outage and clearing preserves real history", async ({
  page,
  offlineServer,
}, testInfo) => {
  await page.goto("/offline");
  test.skip(
    !(await page.evaluate(
      () => "serviceWorker" in navigator && "caches" in window,
    )),
    "UNVERIFIED: this browser does not expose the service-worker/cache APIs required for offline installation.",
  );
  await expect(
    page.getByRole("heading", { name: "Your offline workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Public download: available/)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const cachedPaths = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) =>
      name.startsWith("sparowtype-public-v1-"),
    );
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => new URL(request.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(cachedPaths).toContain("/index.html");
  expect(cachedPaths).toContain("/_offline-recovery.html");
  expect(
    cachedPaths.some((path) =>
      /\/(?:auth|profile|stats|api|rest|functions)(?:\/|$)/.test(path),
    ),
  ).toBe(false);
  await completeCorrectedCat(page);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  ).toBeVisible();
  await offlineServer.stop();
  // This independent HTTP request must fail because the server no longer
  // accepts connections; window/worker online hints are not the transport.
  await expect(
    fetch(`${offlineServer.origin}/offline-build.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1000),
    }),
  ).rejects.toThrow();
  await testInfo.attach("true-outage-build", {
    body: JSON.stringify(
      {
        ...offlineServer.build,
        origin: offlineServer.origin,
        transport:
          "Owned HTTP server stopped; accepting and active connections closed. No Playwright offline emulation.",
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await completeCorrectedCat(page);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  ).toBeVisible();
  await page.goto("/touch-typing");
  await expect(
    page.getByRole("heading", {
      name: "Learn touch typing, one calm step at a time.",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", {
      name: "This page needs a connection.",
      exact: true,
    }),
  ).toBeVisible();
  await offlineServer.resume();
  await page.goto("/offline");
  await page
    .getByRole("button", { name: "Remove offline download", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Public offline files removed." }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      for (const name of (await caches.keys()).filter((value) =>
        value.startsWith("sparowtype-public-v1-"),
      ))
        if (await (await caches.open(name)).match("/index.html")) return true;
      return false;
    }),
  ).toBe(false);
  await page.goto("/stats");
  const table = page.getByRole("table", {
    name: "Completed sessions, most recent first",
    exact: true,
  });
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("row").nth(1)).toContainText("75.0%");
  await expect(table.getByRole("row").nth(2)).toContainText("75.0%");
});
