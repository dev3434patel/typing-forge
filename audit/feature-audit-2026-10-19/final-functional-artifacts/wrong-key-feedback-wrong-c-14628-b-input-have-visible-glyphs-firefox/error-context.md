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
    13 × locator resolved to <span data-typed-glyph="true">↵</span>
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
        - link "Learn" [ref=e24] [cursor=pointer]:
          - /url: /learn
        - link "Race" [ref=e29] [cursor=pointer]:
          - /url: /race
        - link "Stats" [ref=e39] [cursor=pointer]:
          - /url: /stats
        - link "Rankings" [ref=e45] [cursor=pointer]:
          - /url: /leaderboard
        - link "Keyboard Lab" [ref=e53] [cursor=pointer]:
          - /url: /keyboard-lab
      - generic [ref=e64]:
        - button "Switch to light theme" [ref=e65]
        - button "Open command palette" [ref=e76]
        - link "Settings" [ref=e79] [cursor=pointer]:
          - /url: /settings
        - link "Sign in" [ref=e85] [cursor=pointer]:
          - /url: /auth
  - main [ref=e90]:
    - heading "Typing practice" [level=1] [ref=e91]
    - option "JavaScript" [selected]
    - option "TypeScript"
    - option "Python"
    - option "Rust"
    - option "SQL (PostgreSQL)"
    - region "Typing session" [ref=e92]:
      - generic [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]:
            - generic [ref=e96]: 5s
            - generic [ref=e97]: elapsed
          - generic [ref=e98]: 0wpm
          - generic [ref=e99]: 0acc %
        - generic [ref=e100]: Find your rhythm
      - generic [ref=e102]:
        - generic [ref=e104]:
          - generic [ref=e105]:
            - text: ↵
            - generic [aria-hidden]: f
          - generic [ref=e106]:
            - text: ⇥
            - generic [aria-hidden]: u
          - generic [ref=e107]: "n"
          - generic [ref=e108]: c
          - generic [ref=e109]: t
          - generic [ref=e110]: i
          - generic [ref=e111]: o
          - generic [ref=e112]: "n"
          - generic [ref=e114]: s
          - generic [ref=e115]: u
          - generic [ref=e116]: m
          - generic [ref=e117]: (
          - generic [ref=e118]: v
          - generic [ref=e119]: a
          - generic [ref=e120]: l
          - generic [ref=e121]: u
          - generic [ref=e122]: e
          - generic [ref=e123]: s
          - generic [ref=e124]: )
          - generic [ref=e126]: "{"
          - generic [ref=e129]: r
          - generic [ref=e130]: e
          - generic [ref=e131]: t
          - generic [ref=e132]: u
          - generic [ref=e133]: r
          - generic [ref=e134]: "n"
          - generic [ref=e136]: v
          - generic [ref=e137]: a
          - generic [ref=e138]: l
          - generic [ref=e139]: u
          - generic [ref=e140]: e
          - generic [ref=e141]: s
          - generic [ref=e142]: .
          - generic [ref=e143]: r
          - generic [ref=e144]: e
          - generic [ref=e145]: d
          - generic [ref=e146]: u
          - generic [ref=e147]: c
          - generic [ref=e148]: e
          - generic [ref=e149]: (
          - generic [ref=e150]: (
          - generic [ref=e151]: t
          - generic [ref=e152]: o
          - generic [ref=e153]: t
          - generic [ref=e154]: a
          - generic [ref=e155]: l
          - generic [ref=e156]: ","
          - generic [ref=e158]: v
          - generic [ref=e159]: a
          - generic [ref=e160]: l
          - generic [ref=e161]: u
          - generic [ref=e162]: e
          - generic [ref=e163]: )
          - generic [ref=e165]: =
          - generic [ref=e166]: ">"
          - generic [ref=e168]: t
          - generic [ref=e169]: o
          - generic [ref=e170]: t
          - generic [ref=e171]: a
          - generic [ref=e172]: l
          - generic [ref=e174]: +
          - generic [ref=e176]: v
          - generic [ref=e177]: a
          - generic [ref=e178]: l
          - generic [ref=e179]: u
          - generic [ref=e180]: e
          - generic [ref=e181]: ","
          - generic [ref=e183]: "0"
          - generic [ref=e184]: )
          - generic [ref=e185]: ;
          - generic [ref=e186]: "}"
          - generic [ref=e187]: c
          - generic [ref=e188]: o
          - generic [ref=e189]: "n"
          - generic [ref=e190]: s
          - generic [ref=e191]: o
          - generic [ref=e192]: l
          - generic [ref=e193]: e
          - generic [ref=e194]: .
          - generic [ref=e195]: l
          - generic [ref=e196]: o
          - generic [ref=e197]: g
          - generic [ref=e198]: (
          - generic [ref=e199]: s
          - generic [ref=e200]: u
          - generic [ref=e201]: m
          - generic [ref=e202]: (
          - generic [ref=e203]: "["
          - generic [ref=e204]: "2"
          - generic [ref=e205]: ","
          - generic [ref=e207]: "4"
          - generic [ref=e208]: ","
          - generic [ref=e210]: "6"
          - generic [ref=e211]: "]"
          - generic [ref=e212]: )
          - generic [ref=e213]: )
          - generic [ref=e214]: ;
        - paragraph [ref=e215]: "Practice passage: function sum(values) { return values.reduce((total, value) => total + value, 0); } console.log(sum([2, 4, 6]));"
        - textbox "Typing input" [active] [ref=e216]
      - generic [ref=e218]:
        - generic [ref=e219]:
          - generic [ref=e220]:
            - text: You typed
            - generic [ref=e221]: Tab
          - generic [ref=e222]:
            - text: Expected
            - generic [ref=e223]: u
          - generic [ref=e224]: Added to your text · Backspace to correct, or keep typing.
        - status [ref=e225]: You typed Tab. Expected u. Added to your text. Backspace to correct, or keep typing. 2 incorrect attempts so far.
      - generic [ref=e226]:
        - paragraph [ref=e227]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e228]:
          - button "Restart with new text" [ref=e229]
          - button "Show accessible text editor" [ref=e233]
          - button "Pause practice" [ref=e237]
          - button "Finish" [ref=e241]
      - status [ref=e245]: Test running
  - contentinfo [ref=e246]:
    - generic [ref=e247]:
      - generic [ref=e248]:
        - generic [ref=e249]:
          - generic [ref=e250]: Sparow
          - generic [ref=e251]: Type
        - text: Find your rhythm.
      - generic [ref=e252]:
        - link "About & metrics" [ref=e253] [cursor=pointer]:
          - /url: /about
        - link "Preferences & data" [ref=e254] [cursor=pointer]:
          - /url: /settings
        - link "Touch typing guide" [ref=e255] [cursor=pointer]:
          - /url: /touch-typing
        - link "Privacy" [ref=e256] [cursor=pointer]:
          - /url: /privacy
        - link "Terms" [ref=e257] [cursor=pointer]:
          - /url: /terms
        - link "Offline" [ref=e258] [cursor=pointer]:
          - /url: /offline
        - generic [ref=e259]: SparowType © 2026
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