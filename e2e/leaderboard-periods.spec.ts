import { expect, test, type BrowserContext } from "@playwright/test";
import { phpApiBase } from "./php-api-fixture";

const comparison = JSON.stringify({ version: "forge-v3", mode: "time", durationMs: 30000, language: "en", layout: "qwerty", policy: "word-credit-v1" });
type Call = { method: string; comparisonKey: string | null; period: string | null; limit: string | null; offset: string | null };
type MockResponse = { status?: number; body: unknown };
function entry(handle: string, wpm: number, count: number) {
  return { position: 1, user_id: "a1111111-1111-4111-8111-111111111111", handle, best_wpm: wpm, avg_accuracy: 96.5, test_count: count, total_entries: 1, is_own: false };
}
const allTime = [entry("fixture_alltime", 81.4, 11)];
const expectedCall = (period: string): Call => ({ method: "GET", comparisonKey: comparison, period, limit: "25", offset: "0" });

async function mockRankings(context: BrowserContext, appUrl: string, scenario: (period: string, callNumber: number) => MockResponse) {
  const base = phpApiBase(appUrl);
  const calls: Call[] = [], unexpected: string[] = [];
  let periodCalls = 0;
  await context.route(`${base.href}**`, async route => {
    const request = route.request(), url = new URL(request.url());
    const path = url.pathname.slice(base.pathname.length - 1);
    const respond = (result: MockResponse) => route.fulfill({ status: result.status ?? 200, json: result.body });
    if (path === "/auth/session") { await respond({ body: { user: null, csrfToken: "fixture-csrf" } }); return; }
    if (path === "/leaderboards/cohorts") { await respond({ body: { cohorts: [{ comparison_key: comparison, participants: 3 }] } }); return; }
    if (path === "/leaderboards") {
      const period = url.searchParams.get("period")!;
      calls.push({ method: request.method(), comparisonKey: url.searchParams.get("comparisonKey"), period, limit: url.searchParams.get("limit"), offset: url.searchParams.get("offset") });
      await respond(period === "alltime" ? { body: { entries: allTime, total: 1 } } : scenario(period, ++periodCalls));
      return;
    }
    unexpected.push(`${request.method()} ${path}`);
    await respond({ status: 501, body: { error: { code: "fixture-unconfigured", message: "Unexpected fixture request" } } });
  });
  return { calls, unexpected };
}

test.use({ serviceWorkers: "block", timezoneId: "Pacific/Kiritimati" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
});

test("period controls request server all-time, day and week aggregates in UTC", async ({ page, context, baseURL }) => {
  const mock = await mockRankings(context, baseURL!, period => ({ body: { entries: period === "day" ? [entry("fixture_today", 42.7, 2)] : [entry("fixture_week", 63.2, 5)], total: 1 } }));
  await page.clock.install({ time: new Date("2038-01-03T23:58:00Z") });
  await page.goto("/leaderboard");
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  const filters = page.getByRole("group", { name: "Ranking period", exact: true });
  await expect(filters.getByRole("button", { name: "All time", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(mock.calls).toEqual([expectedCall("alltime")]);
  expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe("Pacific/Kiritimati");
  await expect(page.getByRole("combobox", { name: "Comparison", exact: true })).toContainText("3 all-time typists");
  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_today", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "42.7", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toHaveCount(0);
  await expect(page.locator("#ranking-period-description")).toContainText("00:00 to the next 00:00 UTC");
  expect(mock.calls.at(-1)).toEqual(expectedCall("day"));
  await filters.getByRole("button", { name: "This week", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_week", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "63.2", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "fixture_today", exact: true })).toHaveCount(0);
  await expect(page.locator("#ranking-period-description")).toContainText("Monday 00:00 to the next Monday 00:00 UTC");
  expect(mock.calls.at(-1)).toEqual(expectedCall("week"));
  await expect(filters.getByRole("button", { name: "This week", exact: true })).toHaveAttribute("aria-pressed", "true");
  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  expect(mock.calls.at(-1)).toEqual(expectedCall("alltime"));
  expect(mock.calls).toHaveLength(4); expect(mock.unexpected).toEqual([]);
});

test("an empty day stays empty and a failed week can be retried without sample entries", async ({ page, context, baseURL }) => {
  let attempts = 0;
  const mock = await mockRankings(context, baseURL!, period => period === "day" ? { body: { entries: [], total: 0 } }
    : ++attempts === 1 ? { status: 503, body: { error: { code: "unavailable", message: "The period service is temporarily unavailable." } } }
      : { body: { entries: [entry("fixture_retry_week", 58.1, 3)], total: 1 } });
  await page.goto("/leaderboard");
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  const filters = page.getByRole("group", { name: "Ranking period", exact: true });
  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByText("There are no accepted scores for this comparison today.", { exact: false })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await filters.getByRole("button", { name: "This week", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("The period service is temporarily unavailable.");
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_retry_week", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(mock.calls.filter(call => call.period === "week")).toHaveLength(2);
  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  expect(mock.unexpected).toEqual([]);
});

test("an unavailable period endpoint shows its real error and returns to all-time only by user choice", async ({ page, context, baseURL }) => {
  const mock = await mockRankings(context, baseURL!, () => ({ status: 404, body: { error: { code: "not-found", message: "The requested ranking period endpoint is unavailable." } } }));
  await page.goto("/leaderboard");
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  const filters = page.getByRole("group", { name: "Ranking period", exact: true });
  await filters.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("The requested ranking period endpoint is unavailable.");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(filters.getByRole("button", { name: "Today", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(mock.calls.filter(call => call.period === "alltime")).toHaveLength(1);
  await filters.getByRole("button", { name: "All time", exact: true }).click();
  await expect(page.getByRole("cell", { name: "fixture_alltime", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(mock.calls.filter(call => call.period === "alltime")).toHaveLength(2);
  expect(mock.unexpected).toEqual([]);
});
