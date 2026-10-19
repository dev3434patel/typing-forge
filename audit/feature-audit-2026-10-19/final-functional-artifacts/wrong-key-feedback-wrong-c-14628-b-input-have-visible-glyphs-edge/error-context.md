# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wrong-key-feedback.spec.ts >> wrong code newline and tab input have visible glyphs
- Location: e2e\wrong-key-feedback.spec.ts:123:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('typing-target').locator('[data-slot-index="0"]').locator('[data-typed-glyph]')
Expected: "⇥"
Received: "↵"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByTestId('typing-target').locator('[data-slot-index="0"]').locator('[data-typed-glyph]') with timeout 5000ms
  - waiting for getByTestId('typing-target').locator('[data-slot-index="0"]').locator('[data-typed-glyph]')
    14 × locator resolved to <span data-typed-glyph="true">↵</span>
       - unexpected value "↵"

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - link "Skip to content" [ref=e6] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e7]:
      - link "SparowType home" [ref=e8] [cursor=pointer]:
        - /url: /
        - generic [ref=e9]:
          - generic [ref=e10]: Sparow
          - generic [ref=e11]: Type
      - navigation "Main navigation" [ref=e12]:
        - link "Test" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Learn" [ref=e16] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e20] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e30] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e33] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e40] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e43]:
        - button "Switch to light theme" [ref=e44]
        - button "Open command palette" [ref=e51]
        - link "Settings" [ref=e54] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e58] [cursor=pointer]:
          - /url: /auth
  - main [ref=e63]:
    - heading "Typing practice" [level=1] [ref=e64]
    - option "JavaScript" [selected]
    - option "TypeScript"
    - option "Python"
    - option "Rust"
    - option "SQL (PostgreSQL)"
    - region "Typing session" [ref=e65]:
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68]:
            - generic [ref=e69]: 5s
            - generic [ref=e70]: elapsed
          - generic [ref=e71]: 0wpm
          - generic [ref=e72]: 0acc %
        - generic [ref=e73]: Find your rhythm
      - generic [ref=e75]:
        - generic [ref=e77]:
          - generic [ref=e78]:
            - text: ↵
            - generic [aria-hidden]: c
          - generic [ref=e79]:
            - text: ⇥
            - generic [aria-hidden]: o
          - generic [ref=e80]: "n"
          - generic [ref=e81]: s
          - generic [ref=e82]: t
          - generic [ref=e84]: w
          - generic [ref=e85]: o
          - generic [ref=e86]: r
          - generic [ref=e87]: d
          - generic [ref=e88]: s
          - generic [ref=e90]: =
          - generic [ref=e92]: "["
          - generic [ref=e93]: "\""
          - generic [ref=e94]: c
          - generic [ref=e95]: a
          - generic [ref=e96]: l
          - generic [ref=e97]: m
          - generic [ref=e98]: "\""
          - generic [ref=e99]: ","
          - generic [ref=e101]: "\""
          - generic [ref=e102]: c
          - generic [ref=e103]: l
          - generic [ref=e104]: e
          - generic [ref=e105]: a
          - generic [ref=e106]: r
          - generic [ref=e107]: "\""
          - generic [ref=e108]: ","
          - generic [ref=e110]: "\""
          - generic [ref=e111]: s
          - generic [ref=e112]: t
          - generic [ref=e113]: e
          - generic [ref=e114]: a
          - generic [ref=e115]: d
          - generic [ref=e116]: "y"
          - generic [ref=e117]: "\""
          - generic [ref=e118]: "]"
          - generic [ref=e119]: ;
          - generic [ref=e120]: c
          - generic [ref=e121]: o
          - generic [ref=e122]: "n"
          - generic [ref=e123]: s
          - generic [ref=e124]: t
          - generic [ref=e126]: l
          - generic [ref=e127]: e
          - generic [ref=e128]: "n"
          - generic [ref=e129]: g
          - generic [ref=e130]: t
          - generic [ref=e131]: h
          - generic [ref=e132]: s
          - generic [ref=e134]: =
          - generic [ref=e136]: w
          - generic [ref=e137]: o
          - generic [ref=e138]: r
          - generic [ref=e139]: d
          - generic [ref=e140]: s
          - generic [ref=e141]: .
          - generic [ref=e142]: m
          - generic [ref=e143]: a
          - generic [ref=e144]: p
          - generic [ref=e145]: (
          - generic [ref=e146]: w
          - generic [ref=e147]: o
          - generic [ref=e148]: r
          - generic [ref=e149]: d
          - generic [ref=e151]: =
          - generic [ref=e152]: ">"
          - generic [ref=e154]: w
          - generic [ref=e155]: o
          - generic [ref=e156]: r
          - generic [ref=e157]: d
          - generic [ref=e158]: .
          - generic [ref=e159]: l
          - generic [ref=e160]: e
          - generic [ref=e161]: "n"
          - generic [ref=e162]: g
          - generic [ref=e163]: t
          - generic [ref=e164]: h
          - generic [ref=e165]: )
          - generic [ref=e166]: ;
          - generic [ref=e167]: c
          - generic [ref=e168]: o
          - generic [ref=e169]: "n"
          - generic [ref=e170]: s
          - generic [ref=e171]: o
          - generic [ref=e172]: l
          - generic [ref=e173]: e
          - generic [ref=e174]: .
          - generic [ref=e175]: l
          - generic [ref=e176]: o
          - generic [ref=e177]: g
          - generic [ref=e178]: (
          - generic [ref=e179]: l
          - generic [ref=e180]: e
          - generic [ref=e181]: "n"
          - generic [ref=e182]: g
          - generic [ref=e183]: t
          - generic [ref=e184]: h
          - generic [ref=e185]: s
          - generic [ref=e186]: .
          - generic [ref=e187]: j
          - generic [ref=e188]: o
          - generic [ref=e189]: i
          - generic [ref=e190]: "n"
          - generic [ref=e191]: (
          - generic [ref=e192]: "\""
          - generic [ref=e193]: ","
          - generic [ref=e195]: "\""
          - generic [ref=e196]: )
          - generic [ref=e197]: )
          - generic [ref=e198]: ;
        - paragraph [ref=e199]: "Practice passage: const words = [\"calm\", \"clear\", \"steady\"]; const lengths = words.map(word => word.length); console.log(lengths.join(\", \"));"
        - textbox "Typing input" [active] [ref=e200]
      - generic [ref=e202]:
        - generic [ref=e203]:
          - generic [ref=e204]:
            - text: You typed
            - generic [ref=e205]: Tab
          - generic [ref=e206]:
            - text: Expected
            - generic [ref=e207]: o
          - generic [ref=e208]: Added to your text · Backspace to correct, or keep typing.
        - status [ref=e209]: You typed Tab. Expected o. Added to your text. Backspace to correct, or keep typing. 2 incorrect attempts so far.
      - generic [ref=e210]:
        - paragraph [ref=e211]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e212]:
          - button "Restart with new text" [ref=e213]
          - button "Show accessible text editor" [ref=e217]
          - button "Pause practice" [ref=e221]
          - button "Finish" [ref=e225]
      - status [ref=e228]: Test running
  - contentinfo [ref=e229]:
    - generic [ref=e230]:
      - generic [ref=e231]:
        - generic [ref=e232]:
          - generic [ref=e233]: Sparow
          - generic [ref=e234]: Type
        - text: Find your rhythm.
      - generic [ref=e235]:
        - link "About & metrics" [ref=e236] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e237] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e238] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e239] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e240] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e241] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e242]: SparowType © 2026
```

# Test source

```ts
  41  |   await input.pressSequentially("at dog", { delay: 20 });
  42  |   await expect(
  43  |     page.getByRole("region", { name: "Session results" }),
  44  |   ).toBeVisible();
  45  |   const result = await exportedResult(page);
  46  |   expect(result.finalText).toBe("cat dog");
  47  |   expect(result.metrics.inputAccuracy).toBe(87.5);
  48  |   expect(result.metrics.incorrectAttempts).toBe(1);
  49  |   expect(result.metrics.deletionActions).toBe(1);
  50  | });
  51  | 
  52  | test("explicit precision mode shows the rejected key and expected character", async ({
  53  |   page,
  54  | }) => {
  55  |   await page.goto("/");
  56  |   await page
  57  |     .getByRole("group", { name: "Test mode" })
  58  |     .getByRole("button", { name: "Custom", exact: true })
  59  |     .click();
  60  |   await page
  61  |     .getByRole("checkbox", { name: "Precision mode · stop on errors" })
  62  |     .check();
  63  |   await page
  64  |     .getByRole("textbox", { name: "Custom practice passage" })
  65  |     .fill("cat dog");
  66  |   await page.getByRole("button", { name: "Start private practice" }).click();
  67  |   const input = await focusTyping(page);
  68  |   await input.pressSequentially("cx", { delay: 50 });
  69  |   await expect(input).toHaveValue("c");
  70  |   await expect(
  71  |     page.getByTestId("typing-target").locator('[data-current="true"]'),
  72  |   ).toHaveAttribute("data-expected", "a");
  73  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  74  |     "You typed x",
  75  |   );
  76  |   await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  77  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  78  |     "Not inserted",
  79  |   );
  80  |   await input.press("x");
  81  |   await expect(
  82  |     page.getByTestId("typing-feedback").getByRole("status"),
  83  |   ).toContainText("2 incorrect attempts so far");
  84  |   await input.press("a");
  85  |   await expect(input).toHaveValue("ca");
  86  |   await expect(page.getByTestId("typing-feedback")).not.toContainText(
  87  |     "Not inserted",
  88  |   );
  89  | });
  90  | 
  91  | test("an early space has visible input feedback even when the final separator aligns correctly", async ({
  92  |   page,
  93  | }) => {
  94  |   const input = await customPractice(page, "cat dog");
  95  |   await input.pressSequentially("c ");
  96  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  97  |     "You typed Space",
  98  |   );
  99  |   await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  100 |   await expect(
  101 |     page.getByTestId("typing-target").locator('[data-current="true"]'),
  102 |   ).toHaveAttribute("data-expected", "d");
  103 |   await input.press("Backspace");
  104 |   await expect(input).toHaveValue("c");
  105 |   await expect(page.getByTestId("typing-feedback")).not.toContainText(
  106 |     "You typed Space",
  107 |   );
  108 | });
  109 | 
  110 | test("overtyping a word reports the actual input and the missing separator", async ({
  111 |   page,
  112 | }) => {
  113 |   const input = await customPractice(page, "cat dog");
  114 |   await input.pressSequentially("catx");
  115 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  116 |     "You typed x",
  117 |   );
  118 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  119 |     "Expected Space",
  120 |   );
  121 | });
  122 | 
  123 | test("wrong code newline and tab input have visible glyphs", async ({
  124 |   page,
  125 | }) => {
  126 |   await page.goto("/");
  127 |   await page
  128 |     .getByRole("group", { name: "Test mode" })
  129 |     .getByRole("button", { name: "Code", exact: true })
  130 |     .click();
  131 |   const input = await focusTyping(page);
  132 |   const target = page.getByTestId("typing-target");
  133 |   const first = target.locator('[data-slot-index="0"]');
  134 |   await input.press("Enter");
  135 |   await expect(first).toHaveAttribute("data-typed", "\n");
  136 |   await expect(first.locator("[data-typed-glyph]")).toHaveText("↵");
  137 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  138 |     "You typed Enter",
  139 |   );
  140 |   await input.fill("\t");
> 141 |   await expect(first.locator("[data-typed-glyph]")).toHaveText("⇥");
      |                                                     ^ Error: expect(locator).toHaveText(expected) failed
  142 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  143 |     "You typed Tab",
  144 |   );
  145 | });
  146 | 
  147 | test("wrong composed input shows the normalized committed letter and counts one attempt", async ({
  148 |   page,
  149 | }) => {
  150 |   const input = await customPractice(page, "école");
  151 |   await input.evaluate((element) => {
  152 |     const field = element as HTMLTextAreaElement;
  153 |     const set = Object.getOwnPropertyDescriptor(
  154 |       HTMLTextAreaElement.prototype,
  155 |       "value",
  156 |     )!.set!;
  157 |     field.dispatchEvent(
  158 |       new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
  159 |     );
  160 |     set.call(field, "n");
  161 |     field.dispatchEvent(
  162 |       new InputEvent("input", {
  163 |         bubbles: true,
  164 |         data: "n",
  165 |         inputType: "insertCompositionText",
  166 |         isComposing: true,
  167 |       }),
  168 |     );
  169 |     set.call(field, "n\u0303");
  170 |     field.dispatchEvent(
  171 |       new CompositionEvent("compositionend", {
  172 |         bubbles: true,
  173 |         data: "n\u0303",
  174 |       }),
  175 |     );
  176 |     field.dispatchEvent(
  177 |       new InputEvent("input", {
  178 |         bubbles: true,
  179 |         data: "n\u0303",
  180 |         inputType: "insertCompositionText",
  181 |       }),
  182 |     );
  183 |   });
  184 |   await expect(
  185 |     page
  186 |       .getByTestId("typing-target")
  187 |       .locator('[data-slot-index="0"] [data-typed-glyph]'),
  188 |   ).toHaveText("ñ");
  189 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  190 |     "You typed ñ",
  191 |   );
  192 |   await expect(page.getByTestId("typing-feedback")).toContainText("Expected é");
  193 |   await page.getByRole("button", { name: "Finish", exact: true }).click();
  194 |   const result = await exportedResult(page);
  195 |   expect(result.metrics.insertionAttempts).toBe(1);
  196 |   expect(result.metrics.incorrectAttempts).toBe(1);
  197 |   expect(result.finalText).toBe("ñ");
  198 | });
  199 | 
  200 | test("wrong-key feedback fits mobile and restarting clears the previous input", async ({
  201 |   page,
  202 | }) => {
  203 |   await page.setViewportSize({ width: 390, height: 844 });
  204 |   const input = await customPractice(page, "cat dog");
  205 |   await input.pressSequentially("cx");
  206 |   await expect(page.getByTestId("typing-feedback")).toBeVisible();
  207 |   expect(
  208 |     await page.evaluate(
  209 |       () => document.documentElement.scrollWidth <= innerWidth,
  210 |     ),
  211 |   ).toBe(true);
  212 |   await page
  213 |     .getByRole("button", { name: "Restart with new text", exact: true })
  214 |     .click();
  215 |   await page
  216 |     .getByRole("button", { name: "Start private practice", exact: true })
  217 |     .click();
  218 |   await expect(page.getByTestId("typing-target")).toBeVisible();
  219 |   await expect(page.getByTestId("typing-feedback")).not.toContainText(
  220 |     "You typed x",
  221 |   );
  222 |   await expect(
  223 |     page.getByTestId("typing-target").locator("[data-typed]"),
  224 |   ).toHaveCount(0);
  225 | });
  226 | 
```