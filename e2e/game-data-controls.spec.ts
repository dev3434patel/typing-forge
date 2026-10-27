import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { phpApiBase } from "./php-api-fixture";

test.use({ serviceWorkers: "block" });

test("game-only workspace exports include its sanitized best and reset preserves another owner's best", async ({
  page,
  baseURL,
}) => {
  // Seed owned summaries to isolate export/reset integration. Actual completed
  // game persistence is exercised independently by games.spec.ts.
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    const guestKey = "sparowtype.signal-run.v1:guest";
    if (!sessionStorage.getItem("game-data-seeded")) {
      localStorage.setItem(
        guestKey,
        JSON.stringify({
          paced: {
            version: "signal-run-v1",
            mode: "paced",
            gates: 8,
            cleanGates: 7,
            accuracy: 96,
            elapsedMs: 60_000,
            paused: false,
            draft: "must not export",
          },
        }),
      );
      localStorage.setItem(
        "sparowtype.signal-run.v1:another-owner",
        JSON.stringify({
          paced: {
            version: "signal-run-v1",
            mode: "paced",
            gates: 18,
            cleanGates: 18,
            accuracy: 100,
            elapsedMs: 60_000,
            paused: false,
          },
        }),
      );
      sessionStorage.setItem("game-data-seeded", "true");
    }
  });
  const api = phpApiBase(baseURL!);
  await page.route(`${api.href}**`, (route) =>
    route.fulfill({ json: { user: null, csrfToken: "local-data-fixture" } }),
  );
  const exportData = async (label: string) => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: label, exact: true }).click();
    const download = await pending;
    const file = await download.path();
    expect(file).not.toBeNull();
    return JSON.parse(await readFile(file!, "utf8"));
  };
  await page.goto(new URL("settings", baseURL!).href);
  const settings = await exportData("Export my local data");
  expect(settings.ownerId).toBe("guest");
  expect(settings.sessions).toEqual([]);
  expect(settings.gameBests.paced).toMatchObject({ gates: 8, accuracy: 96 });
  expect(settings.gameBests.paced).not.toHaveProperty("draft");
  await page.goto(new URL("profile", baseURL!).href);
  const profile = await exportData("Export this workspace");
  expect(profile.ownerId).toBe("guest");
  expect(profile.sessions).toEqual([]);
  expect(profile.gameBests).toEqual(settings.gameBests);
  const other = await page.evaluate(() =>
    localStorage.getItem("sparowtype.signal-run.v1:another-owner"),
  );
  await page
    .getByRole("textbox", {
      name: "Type DELETE to enable this action",
      exact: true,
    })
    .fill("DELETE");
  await page
    .getByRole("button", { name: "Reset guest workspace", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "This device workspace has been reset." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sparowtype.signal-run.v1:guest"),
    ),
  ).toBeNull();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sparowtype.signal-run.v1:another-owner"),
    ),
  ).toBe(other);
  await page.goto(new URL("games", baseURL!).href);
  await page
    .getByRole("button", { name: "60-second run", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Local game best", exact: true }),
  ).toContainText("first local best");
});
