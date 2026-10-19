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
    - link "Skip to content" [ref=e6]:
      - /url: "#main-content"
    - generic [ref=e7]:
      - link "SparowType home" [ref=e8]:
        - /url: /
        - generic [ref=e9]:
          - generic [ref=e10]: Sparow
          - generic [ref=e11]: Type
      - generic [ref=e12]:
        - button "Switch to light theme" [ref=e13]
        - button "Open command palette" [ref=e20]
        - link "Settings" [ref=e23]:
          - /url: /settings
        - link "Sign in" [ref=e27]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e32]:
      - link "Test" [ref=e33]:
        - /url: /
      - link "Learn" [ref=e36]:
        - /url: /learn
      - link "Race" [ref=e40]:
        - /url: /race
      - link "Stats" [ref=e50]:
        - /url: /stats
      - link "Rankings" [ref=e53]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e60]:
        - /url: /keyboard-lab
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
          - generic [ref=e79]: l
          - generic [ref=e80]: a
          - generic [ref=e81]: s
          - generic [ref=e82]: s
          - generic [ref=e84]: P
          - generic [ref=e85]: r
          - generic [ref=e86]: a
          - generic [ref=e87]: c
          - generic [ref=e88]: t
          - generic [ref=e89]: i
          - generic [ref=e90]: c
          - generic [ref=e91]: e
          - generic [ref=e92]: T
          - generic [ref=e93]: i
          - generic [ref=e94]: m
          - generic [ref=e95]: e
          - generic [ref=e96]: r
          - generic [ref=e98]: "{"
          - generic [ref=e101]: c
          - generic [ref=e102]: o
          - generic [ref=e103]: "n"
          - generic [ref=e104]: s
          - generic [ref=e105]: t
          - generic [ref=e106]: r
          - generic [ref=e107]: u
          - generic [ref=e108]: c
          - generic [ref=e109]: t
          - generic [ref=e110]: o
          - generic [ref=e111]: r
          - generic [ref=e112]: (
          - generic [ref=e113]: s
          - generic [ref=e114]: e
          - generic [ref=e115]: c
          - generic [ref=e116]: o
          - generic [ref=e117]: "n"
          - generic [ref=e118]: d
          - generic [ref=e119]: s
          - generic [ref=e120]: )
          - generic [ref=e122]: "{"
          - generic [ref=e124]: t
          - generic [ref=e125]: h
          - generic [ref=e126]: i
          - generic [ref=e127]: s
          - generic [ref=e128]: .
          - generic [ref=e129]: s
          - generic [ref=e130]: e
          - generic [ref=e131]: c
          - generic [ref=e132]: o
          - generic [ref=e133]: "n"
          - generic [ref=e134]: d
          - generic [ref=e135]: s
          - generic [ref=e137]: =
          - generic [ref=e139]: s
          - generic [ref=e140]: e
          - generic [ref=e141]: c
          - generic [ref=e142]: o
          - generic [ref=e143]: "n"
          - generic [ref=e144]: d
          - generic [ref=e145]: s
          - generic [ref=e146]: ;
          - generic [ref=e148]: "}"
          - generic [ref=e151]: t
          - generic [ref=e152]: i
          - generic [ref=e153]: c
          - generic [ref=e154]: k
          - generic [ref=e155]: (
          - generic [ref=e156]: )
          - generic [ref=e158]: "{"
          - generic [ref=e160]: t
          - generic [ref=e161]: h
          - generic [ref=e162]: i
          - generic [ref=e163]: s
          - generic [ref=e164]: .
          - generic [ref=e165]: s
          - generic [ref=e166]: e
          - generic [ref=e167]: c
          - generic [ref=e168]: o
          - generic [ref=e169]: "n"
          - generic [ref=e170]: d
          - generic [ref=e171]: s
          - generic [ref=e173]: =
          - generic [ref=e175]: M
          - generic [ref=e176]: a
          - generic [ref=e177]: t
          - generic [ref=e178]: h
          - generic [ref=e179]: .
          - generic [ref=e180]: m
          - generic [ref=e181]: a
          - generic [ref=e182]: x
          - generic [ref=e183]: (
          - generic [ref=e184]: "0"
          - generic [ref=e185]: ","
          - generic [ref=e187]: t
          - generic [ref=e188]: h
          - generic [ref=e189]: i
          - generic [ref=e190]: s
          - generic [ref=e191]: .
          - generic [ref=e192]: s
          - generic [ref=e193]: e
          - generic [ref=e194]: c
          - generic [ref=e195]: o
          - generic [ref=e196]: "n"
          - generic [ref=e197]: d
          - generic [ref=e198]: s
          - generic [ref=e200]: "-"
          - generic [ref=e202]: "1"
          - generic [ref=e203]: )
          - generic [ref=e204]: ;
          - generic [ref=e206]: "}"
          - generic [ref=e207]: "}"
          - generic [ref=e208]: c
          - generic [ref=e209]: o
          - generic [ref=e210]: "n"
          - generic [ref=e211]: s
          - generic [ref=e212]: t
          - generic [ref=e214]: t
          - generic [ref=e215]: i
          - generic [ref=e216]: m
          - generic [ref=e217]: e
          - generic [ref=e218]: r
          - generic [ref=e220]: =
          - generic [ref=e222]: "n"
          - generic [ref=e223]: e
          - generic [ref=e224]: w
          - generic [ref=e226]: P
          - generic [ref=e227]: r
          - generic [ref=e228]: a
          - generic [ref=e229]: c
          - generic [ref=e230]: t
          - generic [ref=e231]: i
          - generic [ref=e232]: c
          - generic [ref=e233]: e
          - generic [ref=e234]: T
          - generic [ref=e235]: i
          - generic [ref=e236]: m
          - generic [ref=e237]: e
          - generic [ref=e238]: r
          - generic [ref=e239]: (
          - generic [ref=e240]: "3"
          - generic [ref=e241]: "0"
          - generic [ref=e242]: )
          - generic [ref=e243]: ;
          - generic [ref=e244]: t
          - generic [ref=e245]: i
          - generic [ref=e246]: m
          - generic [ref=e247]: e
          - generic [ref=e248]: r
          - generic [ref=e249]: .
          - generic [ref=e250]: t
          - generic [ref=e251]: i
          - generic [ref=e252]: c
          - generic [ref=e253]: k
          - generic [ref=e254]: (
          - generic [ref=e255]: )
          - generic [ref=e256]: ;
        - paragraph [ref=e257]: "Practice passage: class PracticeTimer { constructor(seconds) { this.seconds = seconds; } tick() { this.seconds = Math.max(0, this.seconds - 1); } } const timer = new PracticeTimer(30); timer.tick();"
        - textbox "Typing input" [active] [ref=e258]
      - status [ref=e259]: Previous words are locked. You can correct only the current word.
      - generic [ref=e261]:
        - generic [ref=e262]:
          - generic [ref=e263]:
            - text: You typed
            - generic [ref=e264]: Enter
          - generic [ref=e265]:
            - text: Expected
            - generic [ref=e266]: c
          - generic [ref=e267]: Added to your text · Backspace to correct, or keep typing.
        - status [ref=e268]: You typed Enter. Expected c. Added to your text. Backspace to correct, or keep typing. 1 incorrect attempts so far.
      - generic [ref=e269]:
        - paragraph [ref=e270]: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts · Correct current word only
        - generic [ref=e271]:
          - button "Restart with new text" [ref=e272]
          - button "Show accessible text editor" [ref=e276]
          - button "Pause practice" [ref=e280]
          - button "Finish" [ref=e284]
      - status [ref=e287]: Test running
  - contentinfo [ref=e288]:
    - generic [ref=e289]:
      - generic [ref=e290]:
        - generic [ref=e291]:
          - generic [ref=e292]: Sparow
          - generic [ref=e293]: Type
        - text: Find your rhythm.
      - generic [ref=e294]:
        - link "About & metrics" [ref=e295]:
          - /url: /about
        - link "Preferences & data" [ref=e296]:
          - /url: /settings
        - link "Touch typing guide" [ref=e297]:
          - /url: /touch-typing
        - link "Privacy" [ref=e298]:
          - /url: /privacy
        - link "Terms" [ref=e299]:
          - /url: /terms
        - link "Offline" [ref=e300]:
          - /url: /offline
        - generic [ref=e301]: SparowType © 2026
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