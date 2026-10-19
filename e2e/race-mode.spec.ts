import { test, expect } from "@playwright/test";
import { focusTyping, exportedResult } from "./helpers";

test("a guest can finish clearly labelled local bot practice", async ({
  page,
}) => {
  await page.goto("/race");
  await page
    .getByRole("combobox", { name: "Difficulty", exact: true })
    .selectOption("beginner");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  await expect(page.getByText("local bot", { exact: true })).toBeVisible();
  const input = await focusTyping(page);
  await input.pressSequentially("hello", { delay: 100 });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bot practice complete", exact: true }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.configuration.mode).toBe("race");
  expect(result.configuration.settings?.localBot).toBe(true);
  await page.getByRole("button", { name: "Next test", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("local bot", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Leave race", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start bot practice", exact: true }),
  ).toBeVisible();
});

test("human rooms require authentication while bot practice remains available", async ({
  page,
}) => {
  await page.goto("/race");
  await expect(
    page.getByRole("link", { name: "Sign in for human races", exact: true }),
  ).toHaveAttribute("href", "/auth");
  await expect(
    page.getByRole("button", { name: "Create room", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start bot practice", exact: true }),
  ).toBeEnabled();
});

test("PHP two-account race authorization and server-owned countdown", async ({ playwright, baseURL }) => {
  const firstEmail = process.env.PHP_E2E_RACE_HOST_EMAIL,
    firstPassword = process.env.PHP_E2E_RACE_HOST_PASSWORD;
  const secondEmail = process.env.PHP_E2E_RACE_OPPONENT_EMAIL,
    secondPassword = process.env.PHP_E2E_RACE_OPPONENT_PASSWORD;
  test.skip(
    process.env.PHP_E2E_ACCEPTANCE !== "1" ||
      !firstEmail ||
      !firstPassword ||
      !secondEmail ||
      !secondPassword,
    "UNVERIFIED: requires PHP_E2E_ACCEPTANCE=1 and two dedicated PHP race test accounts. Guest bot and API-fixture tests do not establish deployed two-account authorization.",
  );
  const url = process.env.PHP_E2E_API_URL || new URL("/api", baseURL!).href;
  const signIn = async (email: string, password: string) => {
    const context = await playwright.request.newContext();
    const bootstrap = await context.get(`${url}/auth/session`);
    expect(bootstrap.ok()).toBe(true);
    const guest = await bootstrap.json() as { csrfToken: string };
    const response = await context.post(`${url}/auth/signin`, {
      headers: { "X-CSRF-Token": guest.csrfToken }, data: { email, password },
    });
    expect(response.ok()).toBe(true);
    const signed = await response.json() as { user: { id: string }; csrfToken: string };
    return {
      context,
      user: signed.user,
      post: (path: string, data: Record<string, unknown>) => context.post(`${url}${path}`, {
        headers: { "X-CSRF-Token": signed.csrfToken }, data,
      }),
    };
  };
  const host = await signIn(firstEmail!, firstPassword!),
    outsider = await signIn(secondEmail!, secondPassword!);
  expect(host.user.id).not.toBe(outsider.user.id);
  const created = await host.post('/race/create', { duration: 15 });
  expect(created.ok()).toBe(true);
  const { room } = (await created.json()) as { room: {
    id: string;
    room_code: string;
    status: string;
    version: number;
  }};
  expect(room.status).toBe("waiting");
  try {
    const outsiderRead = await outsider.post('/race/get', { code: room.room_code });
    expect(outsiderRead.status()).toBe(403);
    const changedOwner = await host.post('/race/get', { code: room.room_code, expectedOwner: outsider.user.id });
    expect(changedOwner.status()).toBe(409);
    const joined = await outsider.post('/race/join', { code: room.room_code });
    expect(joined.ok()).toBe(true);
    const { room: joinedRoom } = (await joined.json()) as { room: {
      opponent_id: string;
      status: string;
      started_at: string;
      deadline_at: string;
      version: number;
    }};
    expect(joinedRoom.opponent_id).toBe(outsider.user.id);
    expect(joinedRoom.status).toBe("countdown");
    expect(
      Date.parse(joinedRoom.deadline_at) - Date.parse(joinedRoom.started_at),
    ).toBe(15000);
    expect(joinedRoom.version).toBeGreaterThan(room.version);
  } finally {
    try {
      const left = await host.post('/race/leave', { raceId: room.id });
      expect(left.ok()).toBe(true);
    } finally {
      await Promise.all([host.context.dispose(), outsider.context.dispose()]);
    }
  }
});
