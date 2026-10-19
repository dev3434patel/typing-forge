# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: php-human-race.spec.ts >> real two-browser PHP human race shares opponent pace and settles server results
- Location: e2e\php-human-race.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /^(You won this race|Opponent won this race|Race tied)$/ })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /^(You won this race|Opponent won this race|Race tied)$/ }) with timeout 15000ms
  - waiting for getByRole('heading', { name: /^(You won this race|Opponent won this race|Race tied)$/ })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "SparowType home":
    - /url: /
    - text: Sparow Type
  - navigation "Main navigation":
    - link "Test":
      - /url: /
      - img
      - text: Test
    - link "Learn":
      - /url: /learn
      - img
      - text: Learn
    - link "Race":
      - /url: /race
      - img
      - text: Race
    - link "Stats":
      - /url: /stats
      - img
      - text: Stats
    - link "Rankings":
      - /url: /leaderboard
      - img
      - text: Rankings
    - link "Keyboard Lab":
      - /url: /keyboard-lab
      - img
      - text: Keyboard Lab
  - button "Switch to light theme":
    - img
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Account":
    - /url: /profile
    - img
    - text: Account
- main:
  - paragraph: A little friendly competition
  - heading "Find your racing rhythm." [level=1]
  - paragraph: Share a track with a friend, or warm up against a local bot.
  - button "Leave race":
    - img
    - text: Leave race
  - img
  - text: You 49wpm
  - paragraph: 0% correct target characters
  - img
  - text: Opponent 20wpm
  - paragraph: 0% correct target characters
  - heading "Your result is in. Waiting for the server." [level=2]
  - paragraph: The server confirms the finish order and shared race timing.
  - region "Session results":
    - paragraph: Session complete
    - paragraph: race · English · qwerty · forge-v3
    - paragraph: Words per minute
    - text: "49"
    - paragraph: credited word speed
    - paragraph: Input accuracy
    - text: 100.0%
    - paragraph: 19 / 19 insertion attempts
    - region "Speed and error timeline":
      - heading "Your rhythm" [level=2]
      - text: ● WPM
      - button "● Raw" [pressed]
      - button "● Errors" [pressed]
      - img: 1s 2s 3s 4s 4.6s 0 20 40 60 80
      - group: View accessible chart data
    - paragraph: Correct-character WPM
    - paragraph: "49"
    - group: How it’s measured
    - paragraph: Raw WPM
    - paragraph: "49"
    - group: How it’s measured
    - paragraph: Attempt rate
    - paragraph: "49"
    - group: How it’s measured
    - paragraph: Consistency
    - paragraph: —
    - group: How it’s measured
    - paragraph: 5s burst
    - paragraph: —
    - group: How it’s measured
    - paragraph: Final accuracy
    - paragraph: 0.4%
    - group: How it’s measured
    - paragraph: Duration
    - paragraph: 4.6s
    - group: How it’s measured
    - region "Score explanation":
      - heading "Every number, explained" [level=2]
      - paragraph: Accuracy of your attempts and correctness of the final text answer different questions. Displayed values are rounded; exports retain precision.
      - link "Check your keyboard →":
        - /url: /keyboard-lab
      - term: Input accuracy
      - definition: 19 correct ÷ 19 insertion attempts × 100 = 100.0%
      - term: Final text accuracy
      - definition: 19 correct ÷ 4840 processed positions × 100 = 0.4%
      - term: Credited WPM
      - definition: 19 credited characters ÷ 5 ÷ 0.0768033 minutes = 49.5 WPM
      - term: Raw WPM
      - definition: 19 retained characters ÷ 5 ÷ 0.0768033 minutes = 49.5 WPM
      - term: Attempt rate
      - definition: 19 inserted characters ÷ 5 ÷ 0.0768033 minutes = 49.5 WPM
      - paragraph: 0 incorrect insertion attempts remain in input accuracy even after corrections. Final text has 0 incorrect, 0 extra and 4821 missed positions. 0 untouched future positions are excluded. Deletions are separate actions.
      - paragraph: WPM credits eligible words, not raw speed multiplied by accuracy. Character totals and insertion attempts can differ after edits or word skips. Consistency describes your rhythm under Forge’s formula; it is not an accuracy score or directly interchangeable with another site’s consistency.
      - button "Inspect session evidence"
    - heading "Characters, accounted for" [level=2]
    - text: 19 correct 0 incorrect 0 extra 4821 missed
    - paragraph: 0 untyped · 0 deletion actions · 0 deleted characters
    - heading "Practice insight" [level=2]
    - paragraph: Every insertion attempt matched its expected character. Keep that deliberate rhythm in your next session.
    - link "Build accuracy with a focused lesson":
      - /url: /learn?keys=&source=82a5f59f-d90f-4a60-9f00-00bddc8cd82b&language=en&layout=qwerty&retest=%2F%3Fretest%3D82a5f59f-d90f-4a60-9f00-00bddc8cd82b
      - text: Build accuracy with a focused lesson
      - img
    - group: Final-text keyboard map Measured final characters only. Untyped keys have no color.
    - group:
      - text: Session details & comparison eligibility
      - img
    - status:
      - img
      - text: Saved personal result on this device. This session is not eligible for cloud ranking.
    - button "Next test":
      - img
      - text: Next test
    - button "Share image":
      - img
      - text: Share image
    - button "Export JSON"
    - status
- contentinfo:
  - text: Sparow Type Find your rhythm.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - link "Touch typing guide":
    - /url: /touch-typing
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Offline":
    - /url: /offline
  - text: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { focusTyping } from "./helpers";
  3   | import { phpApiBase } from "./php-api-fixture";
  4   | 
  5   | test("real two-browser PHP human race shares opponent pace and settles server results", async ({ page, browser, baseURL }, info) => {
  6   |   const hostEmail = process.env.PHP_E2E_RACE_HOST_EMAIL;
  7   |   const hostPassword = process.env.PHP_E2E_RACE_HOST_PASSWORD;
  8   |   const opponentEmail = process.env.PHP_E2E_RACE_OPPONENT_EMAIL;
  9   |   const opponentPassword = process.env.PHP_E2E_RACE_OPPONENT_PASSWORD;
  10  |   test.skip(process.env.PHP_E2E_ACCEPTANCE !== "1" || !hostEmail || !hostPassword || !opponentEmail || !opponentPassword,
  11  |     "Requires two dedicated accounts on the explicit PHP acceptance deployment.");
  12  |   test.setTimeout(90_000);
  13  |   const api = phpApiBase(baseURL!);
  14  |   const peerContext = await browser.newContext({ baseURL });
  15  |   const peer = await peerContext.newPage();
  16  |   let roomId: string | undefined;
  17  |   const pageErrors: string[] = [];
  18  |   for (const target of [page, peer]) {
  19  |     target.on("pageerror", error => pageErrors.push(error.message));
  20  |     await target.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
  21  |   }
  22  |   const signIn = async (target: Page, email: string, password: string) => {
  23  |     await target.goto("/auth");
  24  |     await target.getByLabel("Email", { exact: true }).fill(email);
  25  |     await target.getByLabel("Password", { exact: true }).fill(password);
  26  |     await target.getByRole("button", { name: "Sign In", exact: true }).click();
  27  |     await expect(target).toHaveURL("/");
  28  |     await expect(target.getByRole("link", { name: "Account", exact: true })).toBeVisible();
  29  |     await target.goto("/race");
  30  |   };
  31  |   try {
  32  |     await signIn(page, hostEmail!, hostPassword!);
  33  |     await signIn(peer, opponentEmail!, opponentPassword!);
  34  |     await page.getByRole("combobox", { name: "Duration", exact: true }).selectOption("30");
  35  |     const createdResponse = page.waitForResponse(response => response.url() === new URL("race/create", api).href && response.request().method() === "POST");
  36  |     await page.getByRole("button", { name: "Create room", exact: true }).click();
  37  |     const created = await createdResponse;
  38  |     expect(created.status()).toBe(200);
  39  |     const { room } = await created.json() as { room: { id: string; room_code: string } };
  40  |     roomId = room.id;
  41  |     await expect(page.getByRole("heading", { name: "Your track is ready.", exact: true })).toBeVisible();
  42  |     const displayedCode = await page.getByText(room.room_code, { exact: true }).innerText();
  43  |     await peer.getByRole("textbox", { name: "Room code", exact: true }).fill(displayedCode);
  44  |     const joinedResponse = peer.waitForResponse(response => response.url() === new URL("race/join", api).href && response.request().method() === "POST");
  45  |     await peer.getByRole("button", { name: "Join", exact: true }).click();
  46  |     const joined = await joinedResponse;
  47  |     expect(joined.status()).toBe(200);
  48  |     const joinedBody = await joined.json() as { room: { id: string; status: string; started_at: string; deadline_at: string } };
  49  |     expect(joinedBody.room.id).toBe(roomId);
  50  |     expect(joinedBody.room.status).toBe("countdown");
  51  |     expect(Date.parse(joinedBody.room.deadline_at) - Date.parse(joinedBody.room.started_at)).toBe(30_000);
  52  |     await expect(peer.getByRole("heading", { name: "Get ready…", exact: true })).toBeVisible();
  53  |     for (const target of [page, peer]) {
  54  |       await expect(target.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "running", { timeout: 15_000 });
  55  |     }
  56  |     const passage = (await page.getByTestId("typing-target").textContent())!;
  57  |     expect(await peer.getByTestId("typing-target").textContent()).toBe(passage);
  58  |     const hostText = passage.split(" ").slice(0, 3).join(" ") + " ";
  59  |     const peerText = passage.split(" ").slice(0, 2).join(" ") + " ";
  60  |     const hostInput = await focusTyping(page);
  61  |     await hostInput.pressSequentially(hostText, { delay: 90 });
  62  |     await expect(hostInput).toHaveValue(hostText);
  63  |     await expect.poll(async () => Number(await peer.getByTestId("race-pace-legend").getAttribute("data-position")), { timeout: 10_000 }).toBeGreaterThan(0);
  64  |     const peerInput = await focusTyping(peer);
  65  |     await peerInput.pressSequentially(peerText, { delay: 100 });
  66  |     await expect(peerInput).toHaveValue(peerText);
  67  |     await expect.poll(async () => Number(await page.getByTestId("race-pace-legend").getAttribute("data-position")), { timeout: 10_000 }).toBeGreaterThan(0);
  68  |     for (const target of [page, peer]) {
  69  |       await expect(target.getByTestId("race-pace-legend")).toContainText("Opponent · confirmed progress");
  70  |       expect(await target.getByTestId("opponent-caret").evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(197, 199, 205)");
  71  |     }
  72  |     await page.getByRole("button", { name: "Finish", exact: true }).click();
  73  |     await peer.getByRole("button", { name: "Finish", exact: true }).click();
  74  |     for (const target of [page, peer]) {
> 75  |       await expect(target.getByRole("heading", { name: /^(You won this race|Opponent won this race|Race tied)$/ })).toBeVisible({ timeout: 15_000 });
      |                                                                                                                     ^ Error: expect(locator).toBeVisible() failed
  76  |       await expect(target.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  77  |       await expect(target.getByRole("alert")).toHaveCount(0);
  78  |     }
  79  |     expect(pageErrors).toEqual([]);
  80  |     await info.attach("real-human-race-ui", { contentType: "application/json", body: JSON.stringify({
  81  |       browser: info.project.name, roomId, distinctBrowserContexts: true, countdown: joinedBody.room,
  82  |       hostTypedCharacters: hostText.length, opponentTypedCharacters: peerText.length,
  83  |       observedServerConfirmedPaceBothDirections: true, settledResultsBothDirections: true,
  84  |       input: "ordinary browser clock and individual Playwright key events; no paste, injected transcript, or mocked API",
  85  |     }) });
  86  |   } finally {
  87  |     try {
  88  |       if (roomId) {
  89  |         const response = await page.request.get(new URL("auth/session", api).href);
  90  |         const state = await response.json() as { user: { id: string } | null; csrfToken: string };
  91  |         if (state.user) {
  92  |           const left = await page.request.post(new URL("race/leave", api).href, {
  93  |             headers: { "X-CSRF-Token": state.csrfToken }, data: { raceId: roomId, expectedOwner: state.user.id },
  94  |           });
  95  |           expect(left.ok(), "Own race room cleanup").toBe(true);
  96  |         }
  97  |       }
  98  |     } finally { await peerContext.close(); }
  99  |   }
  100 | });
  101 | 
```