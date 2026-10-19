import { expect, test, type Page } from "@playwright/test";
import { focusTyping } from "./helpers";
import { phpApiBase } from "./php-api-fixture";

test("real two-browser PHP human race shares opponent pace and settles server results", async ({ page, browser, baseURL }, info) => {
  const hostEmail = process.env.PHP_E2E_RACE_HOST_EMAIL;
  const hostPassword = process.env.PHP_E2E_RACE_HOST_PASSWORD;
  const opponentEmail = process.env.PHP_E2E_RACE_OPPONENT_EMAIL;
  const opponentPassword = process.env.PHP_E2E_RACE_OPPONENT_PASSWORD;
  test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1" || !hostEmail || !hostPassword || !opponentEmail || !opponentPassword,
    "Requires two dedicated accounts on the explicit PHP acceptance deployment.");
  test.setTimeout(90_000);
  const api = phpApiBase(baseURL!);
  const peerContext = await browser.newContext({ baseURL });
  const peer = await peerContext.newPage();
  let roomId: string | undefined;
  const pageErrors: string[] = [];
  for (const target of [page, peer]) {
    target.on("pageerror", error => pageErrors.push(error.message));
    await target.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  }
  const signIn = async (target: Page, email: string, password: string) => {
    await target.goto("/auth");
    await target.getByLabel("Email", { exact: true }).fill(email);
    await target.getByLabel("Password", { exact: true }).fill(password);
    await target.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(target).toHaveURL("/");
    await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
    await target.goto("/race");
  };
  try {
    await signIn(page, hostEmail!, hostPassword!);
    await signIn(peer, opponentEmail!, opponentPassword!);
    await page.getByRole("combobox", { name: "Duration", exact: true }).selectOption("30");
    const createdResponse = page.waitForResponse(response => response.url() === new URL("race/create", api).href && response.request().method() === "POST");
    await page.getByRole("button", { name: "Create room", exact: true }).click();
    const created = await createdResponse;
    expect(created.status()).toBe(200);
    const { room } = await created.json() as { room: { id: string; room_code: string } };
    roomId = room.id;
    await expect(page.getByRole("heading", { name: "Your track is ready.", exact: true })).toBeVisible();
    const displayedCode = await page.getByText(room.room_code, { exact: true }).innerText();
    await peer.getByRole("textbox", { name: "Room code", exact: true }).fill(displayedCode);
    const joinedResponse = peer.waitForResponse(response => response.url() === new URL("race/join", api).href && response.request().method() === "POST");
    await peer.getByRole("button", { name: "Join", exact: true }).click();
    const joined = await joinedResponse;
    expect(joined.status()).toBe(200);
    const joinedBody = await joined.json() as { room: { id: string; status: string; started_at: string; deadline_at: string; server_now: string } };
    const serverClockOffset = Date.parse(joinedBody.room.server_now) - Date.now();
    expect(Number.isFinite(serverClockOffset)).toBe(true);
    expect(joinedBody.room.id).toBe(roomId);
    expect(joinedBody.room.status).toBe("countdown");
    expect(Date.parse(joinedBody.room.deadline_at) - Date.parse(joinedBody.room.started_at)).toBe(30_000);
    await expect(peer.getByRole("heading", { name: "Get ready…", exact: true })).toBeVisible();
    for (const target of [page, peer]) {
      await expect(target.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "running", { timeout: 15_000 });
    }
    const passage = (await page.getByTestId("typing-target").textContent())!;
    expect(await peer.getByTestId("typing-target").textContent()).toBe(passage);
    const hostText = passage.split(" ").slice(0, 3).join(" ") + " ";
    const peerText = passage.split(" ").slice(0, 2).join(" ") + " ";
    const hostInput = await focusTyping(page);
    await hostInput.pressSequentially(hostText, { delay: 90 });
    await expect(hostInput).toHaveValue(hostText);
    await expect.poll(async () => Number(await peer.getByTestId("race-pace-legend").getAttribute("data-position")), { timeout: 10_000 }).toBeGreaterThan(0);
    const peerInput = await focusTyping(peer);
    await peerInput.pressSequentially(peerText, { delay: 100 });
    await expect(peerInput).toHaveValue(peerText);
    await expect.poll(async () => Number(await page.getByTestId("race-pace-legend").getAttribute("data-position")), { timeout: 10_000 }).toBeGreaterThan(0);
    for (const target of [page, peer]) {
      await expect(target.getByTestId("race-pace-legend")).toContainText("Opponent · confirmed progress");
      expect(await target.getByTestId("opponent-caret").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(197, 199, 205)");
    }
    // Partial Finish submissions do not end the shared timed room. Exercise
    // ordinary-clock automatic completion and the server's three-second grace.
    const remainingSharedMs = Date.parse(joinedBody.room.deadline_at) - (Date.now() + serverClockOffset);
    const settlementBudgetMs = Math.min(45_000, Math.max(5_000, remainingSharedMs + 3_000 + 6_000));
    for (const target of [page, peer]) {
      await expect(target.getByRole("heading", { name: /^(You won this race|Opponent won this race|Race tied)$/ })).toBeVisible({ timeout: settlementBudgetMs });
      await expect(target.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
      await expect(target.getByRole("alert")).toHaveCount(0);
    }
    expect(pageErrors).toEqual([]);
    await info.attach("real-human-race-ui", { contentType: "application/json", body: JSON.stringify({
      browser: info.project.name, roomId, distinctBrowserContexts: true, countdown: joinedBody.room,
      hostTypedCharacters: hostText.length, opponentTypedCharacters: peerText.length,
      observedServerConfirmedPaceBothDirections: true, settledResultsBothDirections: true,
      finish: "ordinary-clock automatic 30-second timeout; server grace and polling observed", settlementBudgetMs,
      input: "ordinary browser clock and individual Playwright key events; no paste, injected transcript, or mocked API",
    }) });
  } finally {
    try {
      if (roomId) {
        const response = await page.request.get(new URL("auth/session", api).href);
        const state = await response.json() as { user: { id: string } | null; csrfToken: string };
        if (state.user) {
          const left = await page.request.post(new URL("race/leave", api).href, {
            headers: { "X-CSRF-Token": state.csrfToken }, data: { raceId: roomId, expectedOwner: state.user.id },
          });
          expect(left.ok(), "Own race room cleanup").toBe(true);
        }
      }
    } finally { await peerContext.close(); }
  }
});
