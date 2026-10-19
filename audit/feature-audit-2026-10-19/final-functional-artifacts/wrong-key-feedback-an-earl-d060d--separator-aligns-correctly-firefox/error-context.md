# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wrong-key-feedback.spec.ts >> an early space has visible input feedback even when the final separator aligns correctly
- Location: e2e\wrong-key-feedback.spec.ts:91:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('textbox', { name: 'Typing input', exact: true })
Expected: "c"
Received: "c "
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: 'Typing input', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Typing input', exact: true })
    13 × locator resolved to <textarea dir="ltr" autocorrect="off" autocomplete="off" spellcheck="false" maxlength="100000" autocapitalize="off" aria-label="Typing input" aria-describedby="typing-instructions typing-passage typing-feedback" class="typing-input absolute inset-0 w-full h-full resize-none border-0 bg-transparent caret-transparent text-transparent outline-none focus:outline-none py-2">c </textarea>
       - unexpected value "c "

```

```yaml
- textbox "Typing input": c
```

# Test source

```ts
  4   | test.beforeEach(async ({ page }) => {
  5   |   await page.addInitScript(() =>
  6   |     localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  7   |   );
  8   | });
  9   | 
  10  | test("a retained wrong letter is visible in place, advances, and can be corrected honestly", async ({
  11  |   page,
  12  | }, info) => {
  13  |   const input = await customPractice(page, "cat dog");
  14  |   await input.pressSequentially("cx", { delay: 50 });
  15  |   const target = page.getByTestId("typing-target");
  16  |   const wrong = target.locator('[data-slot-index="1"]');
  17  |   await expect(input).toHaveValue("cx");
  18  |   await expect(wrong.locator("[data-typed-glyph]")).toHaveText("x");
  19  |   await expect(wrong.locator(".typing-expected-hint")).toHaveText("a");
  20  |   await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  21  |     "data-expected",
  22  |     "t",
  23  |   );
  24  |   expect(
  25  |     await wrong.evaluate(
  26  |       (element) => getComputedStyle(element).textDecorationLine,
  27  |     ),
  28  |   ).toContain("underline");
  29  |   const feedback = page.getByTestId("typing-feedback");
  30  |   await expect(feedback).toContainText("You typed x");
  31  |   await expect(feedback).toContainText("Expected a");
  32  |   await expect(feedback).toContainText("Added to your text");
  33  |   await page.screenshot({
  34  |     path: test.info().outputPath(`practice-${info.project.name}.png`),
  35  |     fullPage: true,
  36  |   });
  37  |   await input.press("Backspace");
  38  |   await expect(input).toHaveValue("c");
  39  |   await expect(wrong).not.toHaveAttribute("data-status", "incorrect");
  40  |   await expect(feedback).not.toContainText("Expected a");
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
> 104 |   await expect(input).toHaveValue("c");
      |                       ^ Error: expect(locator).toHaveValue(expected) failed
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
  141 |   await expect(first.locator("[data-typed-glyph]")).toHaveText("⇥");
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
```