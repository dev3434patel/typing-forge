# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-layout.spec.ts >> race and learning remain usable after landscape and narrow resize
- Location: e2e\responsive-layout.spec.ts:156:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 44
Received:    43.99090576171875
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - link "Skip to content" [ref=f1e5]:
      - /url: "#main-content"
    - generic [ref=f1e6]:
      - link "Typing Forge home" [ref=f1e7]:
        - /url: /
        - generic [ref=f1e11]: typingforge.
      - generic [ref=f1e12]:
        - link "Settings" [ref=f1e13]:
          - /url: /settings
        - link "Sign in" [ref=f1e17]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=f1e21]:
      - link "Test" [ref=f1e22]:
        - /url: /
      - link "Learn" [ref=f1e25]:
        - /url: /learn
      - link "Race" [ref=f1e29]:
        - /url: /race
      - link "Stats" [ref=f1e39]:
        - /url: /stats
      - link "Rankings" [ref=f1e42]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=f1e49]:
        - /url: /keyboard-lab
  - main [ref=f1e52]:
    - generic [ref=f1e53]:
      - generic [ref=f1e54]:
        - heading "Make every key feel natural." [level=1] [ref=f1e55]
        - paragraph [ref=f1e56]: Adaptive practice · a little more confidence with every lesson
      - link "Adjust target and daily goal" [ref=f1e57]:
        - /url: /settings
    - generic [ref=f1e58]:
      - region "Adaptive typing lesson" [ref=f1e59]:
        - generic [ref=f1e60]:
          - generic [ref=f1e61]:
            - generic [ref=f1e62]: Adaptive lesson
            - heading "Focus on e" [level=2] [ref=f1e63]
          - generic [ref=f1e64]:
            - generic [ref=f1e65]: Available keys
            - paragraph [ref=f1e66]: e t a o i n
          - generic [ref=f1e67]:
            - generic [ref=f1e68]: WPM
            - paragraph [ref=f1e69]: —
          - generic [ref=f1e70]:
            - generic [ref=f1e71]: Attempt accuracy
            - paragraph [ref=f1e72]: —
          - button "New lesson" [ref=f1e73]
        - progressbar "Lesson progress" [ref=f1e75]
        - generic [ref=f1e76]:
          - generic [ref=f1e77]:
            - generic [aria-hidden]:
              - generic:
                - generic: "n"
                - generic: e
                - generic: o
                - generic: "n"
              - generic:
                - generic: i
                - generic: "n"
                - generic: "n"
                - generic: a
                - generic: t
                - generic: e
              - generic:
                - generic: t
                - generic: e
                - generic: e
                - generic: "n"
              - generic:
                - generic: t
                - generic: e
                - generic: a
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
                - generic: t
              - generic:
                - generic: a
                - generic: t
                - generic: t
                - generic: e
                - generic: "n"
                - generic: t
                - generic: i
                - generic: o
                - generic: "n"
              - generic:
                - generic: i
                - generic: "n"
                - generic: "n"
                - generic: a
                - generic: t
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: t
                - generic: e
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
              - generic:
                - generic: i
                - generic: "n"
                - generic: "n"
                - generic: a
                - generic: t
                - generic: e
              - generic:
                - generic: t
                - generic: i
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: "n"
                - generic: e
                - generic: a
                - generic: t
              - generic:
                - generic: "n"
                - generic: e
                - generic: t
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
                - generic: t
              - generic:
                - generic: "n"
                - generic: e
                - generic: a
                - generic: t
              - generic:
                - generic: "n"
                - generic: e
                - generic: o
                - generic: "n"
              - generic:
                - generic: t
                - generic: e
                - generic: "n"
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: o
                - generic: "n"
                - generic: e
              - generic:
                - generic: e
                - generic: a
                - generic: t
              - generic:
                - generic: "n"
                - generic: e
                - generic: t
              - generic:
                - generic: "n"
                - generic: o
                - generic: t
                - generic: e
              - generic:
                - generic: "n"
                - generic: o
                - generic: t
                - generic: e
              - generic:
                - generic: t
                - generic: i
                - generic: e
          - textbox "Type the practice text" [active] [ref=f1e78]
        - generic [ref=f1e80]:
          - paragraph [ref=f1e81]: Type the text above. Wrong letters stay visible; Backspace corrects.
          - status [ref=f1e82]
        - img "QWERTZ logical keyboard. Expected n." [ref=f1e83]:
          - generic [ref=f1e84]:
            - generic [ref=f1e85]:
              - generic [ref=f1e86]: q
              - generic [ref=f1e87]: w
              - generic [ref=f1e88]: e
              - generic [ref=f1e89]: r
              - generic [ref=f1e90]: t
              - generic [ref=f1e91]: z
              - generic [ref=f1e92]: u
              - generic [ref=f1e93]: i
              - generic [ref=f1e94]: o
              - generic [ref=f1e95]: p
              - generic [ref=f1e96]: ü
            - generic [ref=f1e97]:
              - generic [ref=f1e98]: a
              - generic [ref=f1e99]: s
              - generic [ref=f1e100]: d
              - generic [ref=f1e101]: f
              - generic [ref=f1e102]: g
              - generic [ref=f1e103]: h
              - generic [ref=f1e104]: j
              - generic [ref=f1e105]: k
              - generic [ref=f1e106]: l
              - generic [ref=f1e107]: ö
              - generic [ref=f1e108]: ä
            - generic [ref=f1e109]:
              - generic [ref=f1e110]: "y"
              - generic [ref=f1e111]: x
              - generic [ref=f1e112]: c
              - generic [ref=f1e113]: v
              - generic [ref=f1e114]: b
              - generic [ref=f1e115]: "n"
              - generic [ref=f1e116]: m
            - generic [ref=f1e117]: space
          - paragraph [ref=f1e119]: "QWERTZ · Outlined: next character · Red: your incorrect input"
        - paragraph [ref=f1e120]: Click the lesson and start typing. Your actual input appears as you type, including mistakes. Backspace corrects the text while every original mistake remains in attempt accuracy. Escape releases focus. Tab moves to the next control.
        - paragraph [ref=f1e121]: neon innate teen tea tent attention innate note ten innate tie none neat net tent neat neon ten one one eat net note note tie
        - generic [ref=f1e122]:
          - generic [ref=f1e123]:
            - generic [ref=f1e124]: Correction policy
            - combobox "Correction policy" [ref=f1e125]:
              - option "Allow corrections" [selected]
              - option "Stop on error"
          - generic [ref=f1e126]:
            - generic [ref=f1e127]: Input method
            - combobox "Input method" [ref=f1e128]:
              - option "Physical keyboard" [selected]
              - option "Composition / IME"
              - option "On-screen keyboard"
          - generic [ref=f1e129]:
            - checkbox "Mixed review" [ref=f1e130]
            - text: Mixed review
          - button "Hide keyboard" [pressed] [ref=f1e131]
        - paragraph [ref=f1e134]:
          - generic [ref=f1e135]: esc
          - text: release focus
          - generic [ref=f1e136]: ·
          - generic [ref=f1e137]: tab
          - text: next control
          - generic [ref=f1e138]: ·
          - text: Backspace to correct
      - group [ref=f1e139]:
        - generic "+ Learning progress & evidence 0 / 26 mastered · target 35 WPM" [ref=f1e140] [cursor=pointer]:
          - text: + Learning progress & evidence
          - generic [ref=f1e141]: 0 / 26 mastered · target 35 WPM
  - contentinfo [ref=f1e142]:
    - generic [ref=f1e143]:
      - generic [ref=f1e144]: A little practice. Lasting progress.
      - generic [ref=f1e147]:
        - link "About & metrics" [ref=f1e148]:
          - /url: /about
        - link "Preferences & data" [ref=f1e149]:
          - /url: /settings
        - generic [ref=f1e150]: Typing Forge © 2026
```

# Test source

```ts
  84  |   await select.press("Home");
  85  |   await select.press("ArrowDown");
  86  |   await select.press("Enter");
  87  |   await expect(select).toHaveValue("es");
  88  |   await page.reload({ waitUntil: "domcontentloaded" });
  89  |   await page.locator("#main-content").waitFor();
  90  |   await expect(select).toHaveValue("es");
  91  | });
  92  | 
  93  | test("small-screen test controls wrap in all six modes and keep select targets usable", async ({ page }, info) => {
  94  |   test.setTimeout(90_000);
  95  |   await page.setViewportSize({ width: 320, height: 568 });
  96  |   await page.goto("/", { waitUntil: "domcontentloaded" });
  97  |   for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
  98  |     await page.getByRole("group", { name: "Test mode", exact: true })
  99  |       .getByRole("button", { name: mode, exact: true }).click();
  100 |     await expectPageFits(page);
  101 |     const toolbar = page.getByRole("region", { name: "Test configuration" });
  102 |     for (const control of await toolbar.locator("button, select").all()) {
  103 |       const rect = await control.boundingBox();
  104 |       expect(rect).not.toBeNull();
  105 |       expect(rect!.height).toBeGreaterThanOrEqual(44);
  106 |       expect(rect!.x).toBeGreaterThanOrEqual(0);
  107 |       expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  108 |     }
  109 |     if (mode === "Code") {
  110 |       await page.getByRole("combobox", { name: "Code language" }).selectOption("python");
  111 |       await page.screenshot({ path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`, fullPage: true });
  112 |     }
  113 |   }
  114 |   await page.getByRole("combobox", { name: "Language", exact: true }).selectOption("gu-Latn");
  115 |   await expectPageFits(page);
  116 | });
  117 | 
  118 | test("narrow results retain the whole keyboard map and expanded evidence", async ({ page }, info) => {
  119 |   test.setTimeout(90_000);
  120 |   await page.setViewportSize({ width: 320, height: 760 });
  121 |   await completeCorrectedCat(page);
  122 |   await expectPageFits(page);
  123 |   const map = page.locator("details").filter({
  124 |     has: page.locator("summary", { hasText: "Final-text keyboard map" }),
  125 |   });
  126 |   await map.locator("summary").click();
  127 |   const keysFit = await map.evaluate((element) => {
  128 |     const parent = element.getBoundingClientRect();
  129 |     return Array.from(element.querySelectorAll("span[title]"))
  130 |       .filter((key) => key.getBoundingClientRect().width > 0)
  131 |       .every((key) => {
  132 |         const rect = key.getBoundingClientRect();
  133 |         return rect.left >= parent.left && rect.right <= parent.right;
  134 |       });
  135 |   });
  136 |   expect(keysFit).toBe(true);
  137 |   const speed = await page.getByText("Words per minute", { exact: true }).locator("..").boundingBox();
  138 |   const accuracy = await page.getByText("Input accuracy", { exact: true }).first().locator("..").boundingBox();
  139 |   expect(speed!.y + speed!.height).toBeLessThanOrEqual(accuracy!.y);
  140 |   await page.getByRole("button", { name: "Inspect session evidence", exact: true }).click();
  141 |   const table = page.getByRole("region", { name: "Word credit table", exact: true });
  142 |   await table.focus();
  143 |   await expect(table).toBeFocused();
  144 |   expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  145 |   await page.getByRole("button", { name: "Replay edits", exact: true }).click();
  146 |   await page.getByRole("slider", { name: "Replay position", exact: true }).press("End");
  147 |   await page.getByText("Recorded edit events", { exact: true }).click();
  148 |   const events = page.getByRole("region", { name: "Recorded edit event table", exact: true });
  149 |   await events.focus();
  150 |   await expect(events).toBeFocused();
  151 |   await page.getByText("Session details & comparison eligibility", { exact: false }).click();
  152 |   await expectPageFits(page);
  153 |   await page.screenshot({ path: `audit/responsive-2026-10-16/results-320-${info.project.name}.png`, fullPage: true });
  154 | });
  155 | 
  156 | test("race and learning remain usable after landscape and narrow resize", async ({ page }) => {
  157 |   test.setTimeout(90_000);
  158 |   await page.setViewportSize({ width: 568, height: 320 });
  159 |   await page.goto("/race", { waitUntil: "domcontentloaded" });
  160 |   await page.getByRole("button", { name: "Start bot practice", exact: true }).click();
  161 |   const input = await focusTyping(page);
  162 |   await input.pressSequentially("test");
  163 |   await page.setViewportSize({ width: 320, height: 568 });
  164 |   await expectPageFits(page);
  165 |   await expect(page.getByTestId("opponent-caret")).toBeVisible();
  166 |   await input.press("Tab");
  167 |   await page.getByRole("button", { name: "Restart with new text" }).press("Enter");
  168 |   await expect(input).toBeFocused();
  169 |   await expect(input).toHaveValue("");
  170 |   await page.goto("/learn?language=en&layout=qwertz", { waitUntil: "domcontentloaded" });
  171 |   const keyboard = page.getByRole("img", { name: /^QWERTZ logical keyboard/ });
  172 |   await expect(keyboard).toBeVisible();
  173 |   expect(await keyboard.evaluate((element) => {
  174 |     const frame = element.getBoundingClientRect();
  175 |     return Array.from(element.querySelectorAll(".learn-keyboard-row")).every((row) => {
  176 |       const keys = Array.from(row.querySelectorAll(".learn-key"))
  177 |         .map((key) => key.getBoundingClientRect());
  178 |       return keys.every((key) => key.left >= frame.left - 1 &&
  179 |         key.right <= frame.right + 1 && Math.abs(key.top - keys[0].top) < 1);
  180 |     });
  181 |   })).toBe(true);
  182 |   for (const name of ["Correction policy", "Input method"]) {
  183 |     const control = page.getByRole("combobox", { name, exact: true });
> 184 |     expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      |                                                   ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  185 |   }
  186 |   await expectPageFits(page);
  187 |   await page.getByRole("combobox", { name: "Correction policy", exact: true }).selectOption("stop");
  188 |   await page.getByText("Learning progress & evidence", { exact: false }).click();
  189 |   await expectPageFits(page);
  190 | });
  191 | 
```