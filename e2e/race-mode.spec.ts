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

test("deployed two-account race authorization and RLS", async ({ request }) => {
  const url = process.env.FORGE_E2E_SUPABASE_URL,
    key = process.env.FORGE_E2E_SUPABASE_ANON_KEY;
  const firstEmail = process.env.FORGE_E2E_AUTH_EMAIL,
    firstPassword = process.env.FORGE_E2E_AUTH_PASSWORD;
  const secondEmail = process.env.FORGE_E2E_SECOND_EMAIL,
    secondPassword = process.env.FORGE_E2E_SECOND_PASSWORD;
  test.skip(
    !url ||
      !key ||
      !firstEmail ||
      !firstPassword ||
      !secondEmail ||
      !secondPassword,
    "Requires a deployed test backend URL/anon key and two dedicated authenticated test accounts. No mocked backend establishes authorization.",
  );
  const signIn = async (email: string, password: string) => {
    const response = await request.post(
      `${url}/auth/v1/token?grant_type=password`,
      { headers: { apikey: key! }, data: { email, password } },
    );
    expect(response.ok()).toBe(true);
    return (await response.json()) as {
      access_token: string;
      user: { id: string };
    };
  };
  const host = await signIn(firstEmail!, firstPassword!),
    outsider = await signIn(secondEmail!, secondPassword!);
  expect(host.user.id).not.toBe(outsider.user.id);
  const headers = (token: string) => ({
    apikey: key!,
    Authorization: `Bearer ${token}`,
  });
  const created = await request.post(`${url}/rest/v1/rpc/forge_create_race`, {
    headers: headers(host.access_token),
    data: { p_duration: 15 },
  });
  expect(created.ok()).toBe(true);
  const room = (await created.json()) as {
    id: string;
    room_code: string;
    status: string;
    version: number;
  };
  expect(room.status).toBe("waiting");
  try {
    const outsiderRead = await request.post(
      `${url}/rest/v1/rpc/forge_get_race`,
      {
        headers: headers(outsider.access_token),
        data: { p_code: room.room_code },
      },
    );
    expect(outsiderRead.status()).toBe(403);
    const forgedWrite = await request.patch(
      `${url}/rest/v1/race_sessions?id=eq.${room.id}`,
      {
        headers: headers(host.access_token),
        data: {
          status: "completed",
          winner_id: host.user.id,
          host_progress: 100,
          host_wpm: 9999,
        },
      },
    );
    expect(forgedWrite.status()).toBe(403);
    const joined = await request.post(`${url}/rest/v1/rpc/forge_join_race`, {
      headers: headers(outsider.access_token),
      data: { p_code: room.room_code },
    });
    expect(joined.ok()).toBe(true);
    const joinedRoom = (await joined.json()) as {
      opponent_id: string;
      status: string;
      started_at: string;
      deadline_at: string;
      version: number;
    };
    expect(joinedRoom.opponent_id).toBe(outsider.user.id);
    expect(joinedRoom.status).toBe("countdown");
    expect(
      Date.parse(joinedRoom.deadline_at) - Date.parse(joinedRoom.started_at),
    ).toBe(15000);
    expect(joinedRoom.version).toBeGreaterThan(room.version);
  } finally {
    const left = await request.post(`${url}/rest/v1/rpc/forge_leave_race`, {
      headers: headers(host.access_token),
      data: { p_race_id: room.id },
    });
    expect(left.ok()).toBe(true);
  }
});
