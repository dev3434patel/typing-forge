# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quick-restart.spec.ts >> bot results support Tab then Enter for a fresh race at the same difficulty
- Location: e2e\quick-restart.spec.ts:80:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Pro opponent', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Pro opponent', { exact: true }) with timeout 5000ms
  - waiting for getByText('Pro opponent', { exact: true })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "Typing Forge home":
    - /url: /
    - img
    - text: typingforge.
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
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
    - text: Sign in
- main:
  - paragraph: A little friendly competition
  - heading "Find your racing rhythm." [level=1]
  - paragraph: Share a track with a friend, or warm up against a local bot.
  - button "Leave race":
    - img
    - text: Leave race
  - img
  - text: You 0wpm
  - paragraph: 0% correct target characters
  - img
  - text: Pro opponent local bot 85wpm
  - paragraph: 7% correct target characters
  - region "Typing session":
    - text: 26s remaining 0wpm —acc % Find your rhythm You Bot pace 85 wpm 35 characters ahead
    - paragraph: "Practice passage: school land many window onion test note ear earn fine yellow may grand smile iron other practice sort pink blue my zinc safe road person need sort those ready shore top space simple five two copy letter step practice much move made order he my only speed your first then map through ear south food find red low walk long flow hold talk copy voice face focus wait net seat same go large stop form person every talk net at never pretty air no map little round state back sort even part yes land share give task send zero rent"
    - textbox "Typing input"
    - paragraph: Type the text above. Wrong letters stay visible; Backspace corrects.
    - status
    - paragraph: Shared clock · Ctrl+Enter finishes · Tab → Enter restarts
    - button "Restart with new text":
      - img
    - button "Show accessible text editor":
      - img
    - button "Finish":
      - img
      - text: Finish
    - status: Test running
- contentinfo:
  - img
  - text: A little practice. Lasting progress.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - text: Typing Forge © 2026
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | import { exportedResult, focusTyping } from "./helpers";
  3   | 
  4   | async function botPractice(page: Page) {
  5   |   await page.goto("/race");
  6   |   await page
  7   |     .getByRole("combobox", { name: "Difficulty", exact: true })
  8   |     .selectOption("pro");
  9   |   await page
  10  |     .getByRole("button", { name: "Start bot practice", exact: true })
  11  |     .click();
  12  |   return focusTyping(page);
  13  | }
  14  | 
  15  | test("Tab then Enter creates fresh random bot races and resets typing, timer and opponent", async ({
  16  |   page,
  17  | }, info) => {
  18  |   await page.clock.install();
  19  |   const input = await botPractice(page);
  20  |   const target = page.getByTestId("typing-target");
  21  |   const session = page.getByRole("region", {
  22  |     name: "Typing session",
  23  |     exact: true,
  24  |   });
  25  |   const marker = page.getByTestId("opponent-caret");
  26  |   const seen = new Set<string>();
  27  |   for (let attempt = 0; attempt < 2; attempt++) {
  28  |     const before = (await target.textContent())!;
  29  |     const id = await session.getAttribute("data-session-id");
  30  |     seen.add(before);
  31  |     await input.pressSequentially("xx");
  32  |     await page.clock.fastForward(5000);
  33  |     await expect
  34  |       .poll(async () => Number(await marker.getAttribute("data-position")))
  35  |       .toBeGreaterThan(0);
  36  |     const edited = await target.textContent();
  37  |     await input.press("Tab");
  38  |     const restart = page.getByRole("button", {
  39  |       name: "Restart with new text",
  40  |       exact: true,
  41  |     });
  42  |     await expect(restart).toBeFocused();
  43  |     await expect(target).toHaveText(edited!);
  44  |     await restart.press("Enter");
  45  |     await expect(session).not.toHaveAttribute("data-session-id", id!);
  46  |     await expect(input).toBeFocused();
  47  |     await expect(input).toHaveValue("");
  48  |     await expect(target.locator("[data-typed]")).toHaveCount(0);
  49  |     await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  50  |       "data-slot-index",
  51  |       "0",
  52  |     );
  53  |     await expect(marker).toHaveAttribute("data-position", "0");
  54  |     await expect(page.getByTestId("race-pace-legend")).toContainText(
  55  |       "Alongside you",
  56  |     );
  57  |     await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
  58  |     expect(seen.has((await target.textContent())!)).toBe(false);
  59  |     expect(await page.locator(".typing-hud .text-3xl").textContent()).toBe(
  60  |       "30s",
  61  |     );
  62  |   }
  63  |   const first = await target
  64  |     .locator('[data-slot-index="0"]')
  65  |     .getAttribute("data-expected");
  66  |   await input.pressSequentially(first!);
  67  |   await expect(input).toHaveValue(first!);
  68  |   await page.clock.fastForward(1000);
  69  |   await page.getByRole("button", { name: "Finish", exact: true }).click();
  70  |   const result = await exportedResult(page);
  71  |   expect(result.metrics.insertionAttempts).toBe(1);
  72  |   expect(result.events).toHaveLength(1);
  73  |   expect(result.configuration.initialTarget).not.toBe([...seen][0]);
  74  |   await page.screenshot({
  75  |     path: `audit/quick-restart-2026-10-16/result-${info.project.name}.png`,
  76  |     fullPage: true,
  77  |   });
  78  | });
  79  | 
  80  | test("bot results support Tab then Enter for a fresh race at the same difficulty", async ({
  81  |   page,
  82  | }) => {
  83  |   const input = await botPractice(page);
  84  |   const before = await page.getByTestId("typing-target").textContent();
  85  |   await input.pressSequentially("test");
  86  |   await input.press("ControlOrMeta+Enter");
  87  |   const results = page.getByRole("region", {
  88  |     name: "Session results",
  89  |     exact: true,
  90  |   });
  91  |   await expect(results).toBeFocused();
  92  |   await page.keyboard.press("Tab");
  93  |   const next = page.getByRole("button", { name: "Next test", exact: true });
  94  |   await expect(next).toBeFocused();
  95  |   await next.press("Enter");
  96  |   await expect(input).toBeFocused();
  97  |   await expect(input).toHaveValue("");
  98  |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
> 99  |   await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  100 |   await expect(results).toHaveCount(0);
  101 | });
  102 | 
  103 | test("normal Test results use Tab then Enter for new random words", async ({
  104 |   page,
  105 | }) => {
  106 |   await page.goto("/");
  107 |   const input = await focusTyping(page);
  108 |   const before = await page.getByTestId("typing-target").textContent();
  109 |   await input.pressSequentially("test");
  110 |   await input.press("ControlOrMeta+Enter");
  111 |   await expect(
  112 |     page.getByRole("region", { name: "Session results", exact: true }),
  113 |   ).toBeFocused();
  114 |   await page.keyboard.press("Tab");
  115 |   await expect(
  116 |     page.getByRole("button", { name: "Next test", exact: true }),
  117 |   ).toBeFocused();
  118 |   await page.keyboard.press("Enter");
  119 |   await expect(input).toBeFocused();
  120 |   await expect(input).toHaveValue("");
  121 |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  122 | });
  123 | 
  124 | test("Shift+Tab and further Tab navigation keep ordinary bot controls reachable", async ({
  125 |   page,
  126 | }) => {
  127 |   const input = await botPractice(page);
  128 |   const target = page.getByTestId("typing-target");
  129 |   const before = await target.textContent();
  130 |   const id = await page
  131 |     .getByRole("region", { name: "Typing session", exact: true })
  132 |     .getAttribute("data-session-id");
  133 |   await input.press("Shift+Tab");
  134 |   await expect(
  135 |     page.getByRole("button", { name: "Leave race", exact: true }),
  136 |   ).toBeFocused();
  137 |   await page.keyboard.press("Tab");
  138 |   await expect(input).toBeFocused();
  139 |   await input.press("Tab");
  140 |   await expect(
  141 |     page.getByRole("button", { name: "Restart with new text", exact: true }),
  142 |   ).toBeFocused();
  143 |   await page.keyboard.press("Tab");
  144 |   await expect(
  145 |     page.getByRole("button", {
  146 |       name: "Show accessible text editor",
  147 |       exact: true,
  148 |     }),
  149 |   ).toBeFocused();
  150 |   await expect(target).toHaveText(before!);
  151 |   await expect(
  152 |     page.getByRole("region", { name: "Typing session", exact: true }),
  153 |   ).toHaveAttribute("data-session-id", id!);
  154 | });
  155 | 
  156 | test.describe("touch device with a physical keyboard", () => {
  157 |   test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  158 |   test("keyboard retry restores focus even when the primary pointer is touch", async ({
  159 |     page,
  160 |   }) => {
  161 |     const input = await botPractice(page);
  162 |     const before = await page.getByTestId("typing-target").textContent();
  163 |     await input.press("Tab");
  164 |     await expect(
  165 |       page.getByRole("button", { name: "Restart with new text", exact: true }),
  166 |     ).toBeFocused();
  167 |     await page.keyboard.press("Enter");
  168 |     await expect(input).toBeFocused();
  169 |     await expect(input).toHaveValue("");
  170 |     await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  171 |   });
  172 | });
  173 | 
```