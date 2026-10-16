# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wrong-key-feedback.spec.ts >> explicit precision mode shows the rejected key and expected character
- Location: e2e\wrong-key-feedback.spec.ts:54:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Start private practice' })
    - locator resolved to <button class="forge-button mt-4">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "Skip to content" [ref=e5]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - link "SparowType home" [ref=e7]:
        - /url: /
        - generic [ref=e8]:
          - generic [ref=e9]: Sparow
          - generic [ref=e10]: Type
      - generic [ref=e11]:
        - button "Switch to light theme" [ref=e12]
        - button "Open command palette" [ref=e19]
        - link "Settings" [ref=e22]:
          - /url: /settings
        - link "Sign in" [ref=e26]:
          - /url: /auth
    - navigation "Mobile navigation" [ref=e31]:
      - link "Test" [ref=e32]:
        - /url: /
      - link "Learn" [ref=e35]:
        - /url: /learn
      - link "Race" [ref=e39]:
        - /url: /race
      - link "Stats" [ref=e49]:
        - /url: /stats
      - link "Rankings" [ref=e52]:
        - /url: /leaderboard
      - link "Keyboard Lab" [ref=e59]:
        - /url: /keyboard-lab
  - main [ref=e62]:
    - heading "Typing practice" [level=1] [ref=e63]
    - region "Test configuration" [ref=e64]:
      - group "Test mode" [ref=e66]:
        - button "Time" [ref=e67]
        - button "Words" [ref=e71]
        - button "Quote" [ref=e74]
        - button "Code" [ref=e78]
        - button "Custom" [pressed] [ref=e83]
        - button "Zen" [ref=e87]
      - generic [ref=e90]:
        - generic "Wrong insertion attempts count toward accuracy but do not advance the caret. Compared separately from normal practice." [ref=e91]:
          - checkbox "Precision mode · stop on errors" [checked] [ref=e92]
          - text: Precision mode · stop on errors
        - paragraph [ref=e93]: Your own text. Stored on this device unless you choose to upload.
    - generic [ref=e94]:
      - heading "Bring your own passage" [level=2] [ref=e95]
      - paragraph [ref=e96]: Paste up to 10,000 characters to practice. Your text stays private on this device.
      - generic [ref=e97]: Custom practice passage
      - textbox "Custom practice passage" [active] [ref=e98]:
        - /placeholder: Add something you want to get better at typing…
        - text: cat dog
      - button "Start private practice" [ref=e99]
  - contentinfo [ref=e103]:
    - generic [ref=e104]:
      - generic [ref=e105]:
        - generic [ref=e106]:
          - generic [ref=e107]: Sparow
          - generic [ref=e108]: Type
        - text: Find your rhythm.
      - generic [ref=e109]:
        - link "About & metrics" [ref=e110]:
          - /url: /about
        - link "Preferences & data" [ref=e111]:
          - /url: /settings
        - link "Touch typing guide" [ref=e112]:
          - /url: /touch-typing
        - link "Privacy" [ref=e113]:
          - /url: /privacy
        - link "Terms" [ref=e114]:
          - /url: /terms
        - link "Offline" [ref=e115]:
          - /url: /offline
        - generic [ref=e116]: SparowType © 2026
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { mkdir } from "node:fs/promises";
  3   | import { customPractice, exportedResult, focusTyping } from "./helpers";
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await page.addInitScript(() =>
  7   |     localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  8   |   );
  9   | });
  10  | 
  11  | test("a retained wrong letter is visible in place, advances, and can be corrected honestly", async ({
  12  |   page,
  13  | }, info) => {
  14  |   const input = await customPractice(page, "cat dog");
  15  |   await input.pressSequentially("cx", { delay: 50 });
  16  |   const target = page.getByTestId("typing-target");
  17  |   const wrong = target.locator('[data-slot-index="1"]');
  18  |   await expect(input).toHaveValue("cx");
  19  |   await expect(wrong.locator("[data-typed-glyph]")).toHaveText("x");
  20  |   await expect(wrong.locator(".typing-expected-hint")).toHaveText("a");
  21  |   await expect(target.locator('[data-current="true"]')).toHaveAttribute(
  22  |     "data-expected",
  23  |     "t",
  24  |   );
  25  |   expect(
  26  |     await wrong.evaluate(
  27  |       (element) => getComputedStyle(element).textDecorationLine,
  28  |     ),
  29  |   ).toContain("underline");
  30  |   const feedback = page.getByTestId("typing-feedback");
  31  |   await expect(feedback).toContainText("You typed x");
  32  |   await expect(feedback).toContainText("Expected a");
  33  |   await expect(feedback).toContainText("Added to your text");
  34  |   await mkdir("audit/wrong-key-feedback-2026-10-16", { recursive: true });
  35  |   await page.screenshot({
  36  |     path: `audit/wrong-key-feedback-2026-10-16/practice-${info.project.name}.png`,
  37  |     fullPage: true,
  38  |   });
  39  |   await input.press("Backspace");
  40  |   await expect(input).toHaveValue("c");
  41  |   await expect(wrong).not.toHaveAttribute("data-status", "incorrect");
  42  |   await expect(feedback).not.toContainText("Expected a");
  43  |   await input.pressSequentially("at dog", { delay: 20 });
  44  |   await expect(
  45  |     page.getByRole("region", { name: "Session results" }),
  46  |   ).toBeVisible();
  47  |   const result = await exportedResult(page);
  48  |   expect(result.finalText).toBe("cat dog");
  49  |   expect(result.metrics.inputAccuracy).toBe(87.5);
  50  |   expect(result.metrics.incorrectAttempts).toBe(1);
  51  |   expect(result.metrics.deletionActions).toBe(1);
  52  | });
  53  | 
  54  | test("explicit precision mode shows the rejected key and expected character", async ({
  55  |   page,
  56  | }) => {
  57  |   await page.goto("/");
  58  |   await page
  59  |     .getByRole("group", { name: "Test mode" })
  60  |     .getByRole("button", { name: "Custom", exact: true })
  61  |     .click();
  62  |   await page
  63  |     .getByRole("checkbox", { name: "Precision mode · stop on errors" })
  64  |     .check();
  65  |   await page
  66  |     .getByRole("textbox", { name: "Custom practice passage" })
  67  |     .fill("cat dog");
> 68  |   await page.getByRole("button", { name: "Start private practice" }).click();
      |                                                                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  69  |   const input = await focusTyping(page);
  70  |   await input.pressSequentially("cx", { delay: 50 });
  71  |   await expect(input).toHaveValue("c");
  72  |   await expect(
  73  |     page.getByTestId("typing-target").locator('[data-current="true"]'),
  74  |   ).toHaveAttribute("data-expected", "a");
  75  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  76  |     "You typed x",
  77  |   );
  78  |   await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  79  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  80  |     "Not inserted",
  81  |   );
  82  |   await input.press("x");
  83  |   await expect(
  84  |     page.getByTestId("typing-feedback").getByRole("status"),
  85  |   ).toContainText("2 incorrect attempts so far");
  86  |   await input.press("a");
  87  |   await expect(input).toHaveValue("ca");
  88  |   await expect(page.getByTestId("typing-feedback")).not.toContainText(
  89  |     "Not inserted",
  90  |   );
  91  | });
  92  | 
  93  | test("an early space has visible input feedback even when the final separator aligns correctly", async ({
  94  |   page,
  95  | }) => {
  96  |   const input = await customPractice(page, "cat dog");
  97  |   await input.pressSequentially("c ");
  98  |   await expect(page.getByTestId("typing-feedback")).toContainText(
  99  |     "You typed Space",
  100 |   );
  101 |   await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  102 |   await expect(
  103 |     page.getByTestId("typing-target").locator('[data-current="true"]'),
  104 |   ).toHaveAttribute("data-expected", "d");
  105 |   await input.press("Backspace");
  106 |   await expect(input).toHaveValue("c");
  107 |   await expect(page.getByTestId("typing-feedback")).not.toContainText(
  108 |     "You typed Space",
  109 |   );
  110 | });
  111 | 
  112 | test("overtyping a word reports the actual input and the missing separator", async ({
  113 |   page,
  114 | }) => {
  115 |   const input = await customPractice(page, "cat dog");
  116 |   await input.pressSequentially("catx");
  117 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  118 |     "You typed x",
  119 |   );
  120 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  121 |     "Expected Space",
  122 |   );
  123 | });
  124 | 
  125 | test("wrong code newline and tab input have visible glyphs", async ({
  126 |   page,
  127 | }) => {
  128 |   await page.goto("/");
  129 |   await page
  130 |     .getByRole("group", { name: "Test mode" })
  131 |     .getByRole("button", { name: "Code", exact: true })
  132 |     .click();
  133 |   const input = await focusTyping(page);
  134 |   const target = page.getByTestId("typing-target");
  135 |   const first = target.locator('[data-slot-index="0"]');
  136 |   await input.press("Enter");
  137 |   await expect(first).toHaveAttribute("data-typed", "\n");
  138 |   await expect(first.locator("[data-typed-glyph]")).toHaveText("↵");
  139 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  140 |     "You typed Enter",
  141 |   );
  142 |   await input.fill("\t");
  143 |   await expect(first.locator("[data-typed-glyph]")).toHaveText("⇥");
  144 |   await expect(page.getByTestId("typing-feedback")).toContainText(
  145 |     "You typed Tab",
  146 |   );
  147 | });
  148 | 
  149 | test("wrong composed input shows the normalized committed letter and counts one attempt", async ({
  150 |   page,
  151 | }) => {
  152 |   const input = await customPractice(page, "école");
  153 |   await input.evaluate((element) => {
  154 |     const field = element as HTMLTextAreaElement;
  155 |     const set = Object.getOwnPropertyDescriptor(
  156 |       HTMLTextAreaElement.prototype,
  157 |       "value",
  158 |     )!.set!;
  159 |     field.dispatchEvent(
  160 |       new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
  161 |     );
  162 |     set.call(field, "n");
  163 |     field.dispatchEvent(
  164 |       new InputEvent("input", {
  165 |         bubbles: true,
  166 |         data: "n",
  167 |         inputType: "insertCompositionText",
  168 |         isComposing: true,
```