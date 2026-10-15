# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quick-restart.spec.ts >> Tab then Enter creates fresh random bot races and resets typing, timer and opponent
- Location: e2e\quick-restart.spec.ts:15:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('opponent-caret')
Expected: "0"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByTestId('opponent-caret') with timeout 5000ms
  - waiting for getByTestId('opponent-caret')

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
  - text: You —wpm
  - paragraph: 0% correct target characters
  - img
  - text: Pro opponent local bot —wpm
  - paragraph: 0% correct target characters
  - region "Typing session":
    - text: 30s remaining —wpm —acc % Find your rhythm You Bot pace — wpm Alongside you
    - paragraph: "Practice passage: net red hard north with our same year raise quite wind earn our line write deep water through world world dear copy name food walk rest view ration say summer soft note write ton there good focus great ration open must name food world voice if heart wood back dark onion window short think ratio slow read warm earn plan end shore long draw nest lane none set zone as south plan read white notion foot long hill terrain how sore learn practice early none far five innate open forge code though wish full tire taste calm at a world"
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
  17  | }) => {
  18  |   await page.clock.install();
  19  |   const input = await botPractice(page);
  20  |   await page.clock.pauseAt(
  21  |     new Date((await page.evaluate(() => Date.now())) + 1000),
  22  |   );
  23  |   const target = page.getByTestId("typing-target");
  24  |   const session = page.getByRole("region", {
  25  |     name: "Typing session",
  26  |     exact: true,
  27  |   });
  28  |   const marker = page.getByTestId("opponent-caret");
  29  |   const seen = new Set<string>();
  30  |   for (let attempt = 0; attempt < 2; attempt++) {
  31  |     const before = (await target.textContent())!;
  32  |     const id = await session.getAttribute("data-session-id");
  33  |     seen.add(before);
  34  |     await input.pressSequentially("xx");
  35  |     await page.clock.fastForward(5000);
  36  |     await expect
  37  |       .poll(async () => Number(await marker.getAttribute("data-position")))
  38  |       .toBeGreaterThan(0);
  39  |     const edited = await target.textContent();
  40  |     await input.press("Tab");
  41  |     const restart = page.getByRole("button", {
  42  |       name: "Restart with new text",
  43  |       exact: true,
  44  |     });
  45  |     await expect(restart).toBeFocused();
  46  |     await expect(target).toHaveText(edited!);
  47  |     await restart.press("Enter");
  48  |     await expect(session).not.toHaveAttribute("data-session-id", id!);
  49  |     await expect(input).toBeFocused();
  50  |     await expect(input).toHaveValue("");
  51  |     await expect(target.locator("[data-typed]")).toHaveCount(0);
  52  |     await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  53  |       "data-slot-index",
  54  |       "0",
  55  |     );
> 56  |     await expect(marker).toHaveAttribute("data-position", "0");
      |                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  57  |     await expect(page.getByTestId("race-pace-legend")).toContainText(
  58  |       "Alongside you",
  59  |     );
  60  |     await expect(
  61  |       page.getByText("Pro opponent", { exact: false }),
  62  |     ).toBeVisible();
  63  |     expect(seen.has((await target.textContent())!)).toBe(false);
  64  |     expect(await page.locator(".typing-hud .text-3xl").textContent()).toBe(
  65  |       "30s",
  66  |     );
  67  |   }
  68  |   const first = await target
  69  |     .locator('[data-slot-index="0"]')
  70  |     .getAttribute("data-expected");
  71  |   await input.pressSequentially(first!);
  72  |   await expect(input).toHaveValue(first!);
  73  |   await page.clock.fastForward(1000);
  74  |   await page.getByRole("button", { name: "Finish", exact: true }).click();
  75  |   const result = await exportedResult(page);
  76  |   expect(result.metrics.insertionAttempts).toBe(1);
  77  |   expect(result.events).toHaveLength(1);
  78  |   expect(result.configuration.initialTarget).not.toBe([...seen][0]);
  79  | });
  80  | 
  81  | test("bot results support Tab then Enter for a fresh race at the same difficulty", async ({
  82  |   page,
  83  | }) => {
  84  |   const input = await botPractice(page);
  85  |   const before = await page.getByTestId("typing-target").textContent();
  86  |   await input.pressSequentially("test");
  87  |   await input.press("ControlOrMeta+Enter");
  88  |   const results = page.getByRole("region", {
  89  |     name: "Session results",
  90  |     exact: true,
  91  |   });
  92  |   await expect(results).toBeFocused();
  93  |   await page.keyboard.press("Tab");
  94  |   const next = page.getByRole("button", { name: "Next test", exact: true });
  95  |   await expect(next).toBeFocused();
  96  |   await next.press("Enter");
  97  |   await expect(input).toBeFocused();
  98  |   await expect(input).toHaveValue("");
  99  |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  100 |   await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
  101 |   await expect(results).toHaveCount(0);
  102 | });
  103 | 
  104 | test("normal Test results use Tab then Enter for new random words", async ({
  105 |   page,
  106 | }) => {
  107 |   await page.goto("/");
  108 |   const input = await focusTyping(page);
  109 |   const before = await page.getByTestId("typing-target").textContent();
  110 |   await input.pressSequentially("test");
  111 |   await input.press("ControlOrMeta+Enter");
  112 |   await expect(
  113 |     page.getByRole("region", { name: "Session results", exact: true }),
  114 |   ).toBeFocused();
  115 |   await page.keyboard.press("Tab");
  116 |   await expect(
  117 |     page.getByRole("button", { name: "Next test", exact: true }),
  118 |   ).toBeFocused();
  119 |   await page.keyboard.press("Enter");
  120 |   await expect(input).toBeFocused();
  121 |   await expect(input).toHaveValue("");
  122 |   await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  123 | });
  124 | 
  125 | test("Shift+Tab and further Tab navigation keep ordinary bot controls reachable", async ({
  126 |   page,
  127 | }) => {
  128 |   const input = await botPractice(page);
  129 |   const target = page.getByTestId("typing-target");
  130 |   const before = await target.textContent();
  131 |   const id = await page
  132 |     .getByRole("region", { name: "Typing session", exact: true })
  133 |     .getAttribute("data-session-id");
  134 |   await input.press("Shift+Tab");
  135 |   await expect(
  136 |     page.getByRole("button", { name: "Leave race", exact: true }),
  137 |   ).toBeFocused();
  138 |   await page.keyboard.press("Tab");
  139 |   await expect(input).toBeFocused();
  140 |   await input.press("Tab");
  141 |   await expect(
  142 |     page.getByRole("button", { name: "Restart with new text", exact: true }),
  143 |   ).toBeFocused();
  144 |   await page.keyboard.press("Tab");
  145 |   await expect(
  146 |     page.getByRole("button", {
  147 |       name: "Show accessible text editor",
  148 |       exact: true,
  149 |     }),
  150 |   ).toBeFocused();
  151 |   await expect(target).toHaveText(before!);
  152 |   await expect(
  153 |     page.getByRole("region", { name: "Typing session", exact: true }),
  154 |   ).toHaveAttribute("data-session-id", id!);
  155 | });
  156 | 
```