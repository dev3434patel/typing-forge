import { expect, test, type BrowserContext } from "@playwright/test";
import { loadEnv } from "vite";

const publicEnv = loadEnv("production", process.cwd(), "VITE_");
const cloudUrl = publicEnv.VITE_SUPABASE_URL;
const cloudKey =
  publicEnv.VITE_SUPABASE_ANON_KEY || publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
const comparison = JSON.stringify({
  version: "forge-v3",
  mode: "time",
  durationMs: 30000,
  language: "en",
  layout: "qwerty",
  policy: "word-credit-v1",
});
const params = { p_comparison_key: comparison, p_limit: 25, p_offset: 0 };
type RpcCall = { name: string; body: Record<string, unknown>; method: string };
type MockResponse = { status?: number; body: unknown };
type PeriodScenario = (period: unknown, callNumber: number) => MockResponse;

function entry(handle: string, wpm: number, count: number) {
  return {
    position: 1,
    user_id: "a1111111-1111-4111-8111-111111111111",
    handle,
    best_wpm: wpm,
    avg_accuracy: 96.5,
    test_count: count,
    total_entries: 1,
    is_own: false,
  };
}
const allTime = [entry("fixture_alltime", 81.4, 11)];

/**
 * Only local preview pages/assets reach a network. All configured cloud HTTP
 * is fulfilled here and any other origin is aborted. Fixture rows prove UI
 * transport/rendering only; the separate SQL fixture proves UTC filtering.
 */
async function mockRankings(
  context: BrowserContext,
  appUrl: string,
  periodScenario: PeriodScenario,
) {
  const appOrigin = new URL(appUrl).origin;
  const cloudOrigin = new URL(cloudUrl).origin;
  const calls: RpcCall[] = [];
  const unexpected: string[] = [];
  let periodCalls = 0;
  const headers = {
    "access-control-allow-origin": appOrigin,
    "access-control-allow-headers":
      "apikey, authorization, content-type, x-client-info, prefer, x-supabase-api-version",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  };
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const cloudRequest =
      url.origin === cloudOrigin &&
      (url.pathname.startsWith("/rest/") ||
        url.pathname.startsWith("/auth/") ||
        url.pathname.startsWith("/functions/"));
    if (!cloudRequest && url.origin === appOrigin) {
      await route.continue();
      return;
    }
    if (!cloudRequest) {
      unexpected.push(`Blocked external ${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const respond = async (result: MockResponse) =>
      route.fulfill({
        status: result.status ?? 200,
        headers,
        contentType: "application/json",
        body: JSON.stringify(result.body),
      });
    if (url.pathname === "/rest/v1/rpc/forge_ranked_cohorts") {
      await respond({
        body: [{ comparison_key: comparison, participants: 3 }],
      });
      return;
    }
    const name = url.pathname.split("/").at(-1)!;
    if (name === "forge_rankings" || name === "forge_rankings_period") {
      const body = request.postDataJSON() as Record<string, unknown>;
      calls.push({ name, body, method: request.method() });
      await respond(
        name === "forge_rankings"
          ? { body: allTime }
          : periodScenario(body.p_period, ++periodCalls),
      );
      return;
    }
    unexpected.push(
      `Unexpected cloud fixture ${request.method()} ${url.pathname}`,
    );
    await respond({
      status: 501,
      body: { message: "Unconfigured test transport" },
    });
  });
  return { calls, unexpected };
}

test.use({ serviceWorkers: "block", timezoneId: "Pacific/Kiritimati" });
test.beforeEach(() => {
  test.skip(
    !cloudUrl || !cloudKey,
    "UNVERIFIED transport: this build has no public cloud configuration; period RPC controls require the configured client. No backend request is sent by these tests.",
  );
});

test("period controls preserve the old all-time RPC and render server day/week aggregates in UTC", async ({
  page,
  context,
  baseURL,
}) => {
  const mock = await mockRankings(context, baseURL!, (period) => ({
    body:
      period === "day"
        ? [entry("fixture_today", 42.7, 2)]
        : [entry("fixture_week", 63.2, 5)],
  }));
  // Deliberately unrelated client calendar/timezone. Requests must not submit
  // browser-computed dates or locally filter the period's returned aggregates.
  await page.clock.install({ time: new Date("2038-01-03T23:58:00Z") });
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("group", {
    name: "Ranking period",
    exact: true,
  });
  await expect(
    filters.getByRole("button", { name: "All time", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(mock.calls).toEqual([
    { name: "forge_rankings", body: params, method: "POST" },
  ]);
  expect(
    await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
  ).toBe("Pacific/Kiritimati");
  await expect(
    page.getByRole("combobox", { name: "Comparison", exact: true }),
  ).toContainText("3 all-time typists");

  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_today", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "42.7", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#ranking-period-description")).toContainText(
    "00:00 to the next 00:00 UTC",
  );
  expect(mock.calls.at(-1)).toEqual({
    name: "forge_rankings_period",
    body: { ...params, p_period: "day" },
    method: "POST",
  });

  await filters.getByRole("button", { name: "This week", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_week", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "63.2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "fixture_today", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#ranking-period-description")).toContainText(
    "Monday 00:00 to the next Monday 00:00 UTC",
  );
  expect(mock.calls.at(-1)).toEqual({
    name: "forge_rankings_period",
    body: { ...params, p_period: "week" },
    method: "POST",
  });
  await expect(
    filters.getByRole("button", { name: "This week", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  expect(mock.calls.at(-1)).toEqual({
    name: "forge_rankings",
    body: params,
    method: "POST",
  });
  expect(mock.calls).toHaveLength(4);
  expect(mock.unexpected).toEqual([]);
});

test("an empty day stays empty and a failed week can be retried without sample entries", async ({
  page,
  context,
  baseURL,
}) => {
  let weekAttempts = 0;
  const mock = await mockRankings(context, baseURL!, (period) => {
    if (period === "day") return { body: [] };
    if (++weekAttempts === 1)
      return {
        status: 503,
        body: {
          code: "FIXTURE_UNAVAILABLE",
          message: "The period service is temporarily unavailable.",
        },
      };
    return { body: [entry("fixture_retry_week", 58.1, 3)] };
  });
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("group", {
    name: "Ranking period",
    exact: true,
  });
  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(
    page.getByText("There are no accepted scores for this comparison today.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await filters.getByRole("button", { name: "This week", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "The period service is temporarily unavailable.",
  );
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_retry_week", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    mock.calls.filter((call) => call.body.p_period === "week"),
  ).toHaveLength(2);
  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  expect(mock.unexpected).toEqual([]);
});

test("a missing period endpoint shows its real error and returns to all-time only by user choice", async ({
  page,
  context,
  baseURL,
}) => {
  const mock = await mockRankings(context, baseURL!, () => ({
    status: 404,
    body: {
      code: "PGRST202",
      message:
        "Could not find the function public.forge_rankings_period in the schema cache",
      details: "Period endpoint is not installed in this fixture.",
      hint: null,
    },
  }));
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  const filters = page.getByRole("group", {
    name: "Ranking period",
    exact: true,
  });
  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not find the function public.forge_rankings_period in the schema cache",
  );
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    filters.getByRole("button", { name: "Today", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    mock.calls.filter((call) => call.name === "forge_rankings"),
  ).toHaveLength(1);
  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "fixture_alltime", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    mock.calls.filter((call) => call.name === "forge_rankings"),
  ).toHaveLength(2);
  expect(mock.unexpected).toEqual([]);
});
