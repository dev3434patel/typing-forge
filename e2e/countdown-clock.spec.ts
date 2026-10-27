import { expect, test } from "@playwright/test";
import { phpApiBase } from "./php-api-fixture";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    const intervals: number[] = [];
    Object.assign(window, { routeIntervalDelays: intervals });
    const original = window.setInterval.bind(window);
    window.setInterval = ((
      handler: TimerHandler,
      delay?: number,
      ...args: unknown[]
    ) => {
      intervals.push(delay ?? 0);
      return original(handler, delay, ...args);
    }) as typeof window.setInterval;
  });
});

for (const routePath of ["/race", "/ranked"]) {
  test(`${routePath} guest entry has no short route presentation interval`, async ({
    page,
    baseURL,
  }) => {
    const api = phpApiBase(baseURL!);
    await page.route(`${api.href}**`, (route) =>
      route.fulfill({
        json: { user: null, csrfToken: "countdown-guest-fixture" },
      }),
    );
    const metadata = await page.request.get(
      new URL("deployment.json", baseURL!).href,
    );
    expect(metadata.ok()).toBe(true);
    const deployment = (await metadata.json()) as { frontendOnly: boolean };
    await page.goto(new URL(routePath.slice(1), baseURL!).href);
    const signIn = page.getByRole("link", {
      name:
        routePath === "/race" ? "Sign in for human races" : "Sign in to start",
      exact: true,
    });
    if (deployment.frontendOnly) {
      await expect(signIn).toHaveCount(0);
      await expect(
        page.getByText(
          routePath === "/race"
            ? /Human races require a server\./
            : /Ranked challenges require a server\./,
        ),
      ).toBeVisible();
      if (routePath === "/race")
        await expect(
          page.getByRole("button", { name: "Start bot practice", exact: true }),
        ).toBeEnabled();
    } else await expect(signIn).toBeVisible();
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { routeIntervalDelays: number[] }
        ).routeIntervalDelays.filter((delay) => delay === 50 || delay === 100),
      ),
    ).toEqual([]);
  });
}

test("a server-issued ranked countdown enters the already-running session without a persistent route interval", async ({
  page,
  baseURL,
}) => {
  const metadata = await page.request.get(
    new URL("deployment.json", baseURL!).href,
  );
  expect(metadata.ok()).toBe(true);
  const deployment = (await metadata.json()) as { frontendOnly: boolean };
  test.skip(
    deployment.frontendOnly,
    "This PHP-contract countdown fixture requires a PHP-enabled bundle. Static availability and bot practice have separate assertions.",
  );
  // This is an explicit API-contract fixture, not deployed authentication or
  // anti-cheat acceptance. It exercises the real countdown/typing components.
  const api = phpApiBase(baseURL!);
  const user = {
    id: "10000000-0000-4000-8000-000000000001",
    email: "countdown@example.test",
    handle: "countdown_fixture",
    created_at: "2026-10-20T00:00:00Z",
  };
  const unexpected: string[] = [];
  await page.route(`${api.href}**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.slice(api.pathname.length - 1);
    if (path === "/auth/session")
      return route.fulfill({
        json: { user, csrfToken: "countdown-owner-fixture" },
      });
    if (path === "/preferences")
      return route.fulfill({ json: { preferences: {}, version: 0 } });
    if (path === "/sessions")
      return route.fulfill({
        json: {
          sessions: [],
          learningEvidence: [],
          version: 0,
          hasMore: false,
        },
      });
    if (path === "/data/version")
      return route.fulfill({ json: { version: 0 } });
    if (path === "/challenges/issue") {
      const now = await page.evaluate(() => Date.now());
      const iso = (offset: number) => new Date(now + offset).toISOString();
      return route.fulfill({
        json: {
          challenge: {
            id: "20000000-0000-4000-8000-000000000001",
            user_id: user.id,
            nonce: "30000000-0000-4000-8000-000000000001",
            target_text: "cat dog quiet calm clear steady ".repeat(100),
            configuration: {
              mode: "time",
              durationMs: 15_000,
              language: "en",
              keyboardLayout: "qwerty",
              inputMethod: "keyboard",
              scoringPolicy: "prose",
              contentRevision: "forge-ranked-en-v1",
              correctionPolicy: "current-word",
            },
            issued_at: iso(0),
            server_now: iso(0),
            starts_at: iso(3_000),
            deadline_at: iso(18_000),
            expires_at: iso(180_000),
          },
        },
      });
    }
    unexpected.push(`${route.request().method()} ${path}`);
    return route.fulfill({
      status: 503,
      json: {
        error: {
          code: "fixture-unconfigured",
          message: "Unexpected countdown fixture request.",
        },
      },
    });
  });
  await page.goto(new URL("ranked", baseURL!).href);
  const start = page.getByRole("button", {
    name: "Start ranked challenge",
    exact: true,
  });
  await expect(start).toBeEnabled();
  await page.clock.install();
  await page
    .getByRole("combobox", { name: "Challenge duration", exact: true })
    .selectOption("15");
  await start.click();
  await expect(
    page.getByText("Your 15 second challenge starts on the server countdown.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toHaveCount(0);
  await page.clock.fastForward(3_500);
  const session = page.getByRole("region", {
    name: "Typing session",
    exact: true,
  });
  await expect(session).toHaveAttribute("data-status", "running");
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeEnabled();
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { routeIntervalDelays: number[] }
      ).routeIntervalDelays.filter((delay) => delay === 50 || delay === 100),
    ),
  ).toEqual([]);
  expect(unexpected).toEqual([]);
});
