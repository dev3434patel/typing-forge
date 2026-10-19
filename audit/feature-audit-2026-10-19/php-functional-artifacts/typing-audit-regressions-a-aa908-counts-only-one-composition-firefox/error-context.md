# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: typing-audit-regressions.spec.ts >> a delayed canonical-equivalent learning IME echo counts only one composition
- Location: e2e\typing-audit-regressions.spec.ts:40:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toHaveCount(expected) failed

Locator: locator('.learn-stream-text [data-typed]')
Expected: 1
Error: Test timeout of 30000ms exceeded.

Call log:
  - Expect "toHaveCount" locator('.learn-stream-text [data-typed]') with timeout 5000ms
  - waiting for locator('.learn-stream-text [data-typed]')
  - Test timeout of 30000ms exceeded.

```

# Test source

```ts
  1   | import { expect, test, type Locator } from "@playwright/test";
  2   | import { exportedResult, focusTyping } from "./helpers";
  3   | 
  4   | test.beforeEach(async ({ page }) => {
  5   |   await page.addInitScript(() => {
  6   |     localStorage.setItem("sparowtype.opening-animation.enabled", "false");
  7   |   });
  8   | });
  9   | 
  10  | async function composition(input: Locator, text: string) {
  11  |   await input.evaluate((element, value) => {
  12  |     const textarea = element as HTMLTextAreaElement;
  13  |     textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
  14  |     Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, value);
  15  |     textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: value }));
  16  |   }, text);
  17  | }
  18  | 
  19  | for (const mode of ["Quote", "Code"] as const) {
  20  |   test(`${mode} records the actual Latin content and ignores inactive generated-word toggles`, async ({ page }) => {
  21  |     await page.goto("/");
  22  |     await page.getByLabel("Language", { exact: true }).selectOption("ar");
  23  |     await page.getByRole("button", { name: "punctuation", exact: true }).click();
  24  |     await page.getByRole("button", { name: "# numbers", exact: true }).click();
  25  |     await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: mode, exact: true }).click();
  26  |     const input = await focusTyping(page);
  27  |     await input.pressSequentially("a");
  28  |     await page.getByRole("button", { name: "Finish", exact: true }).click();
  29  |     const result = await exportedResult(page);
  30  |     expect(result.configuration).toMatchObject({
  31  |       mode: mode.toLowerCase(), language: "en", script: "Latin", punctuation: false, numbers: false,
  32  |     });
  33  |     const comparison = JSON.parse(result.comparisonKey);
  34  |     expect(comparison).toMatchObject({ language: "en", script: "Latin", punctuation: false, numbers: false });
  35  |     expect(result.initialTarget).toMatch(/[A-Za-z]/);
  36  |     expect(result.initialTarget).not.toMatch(/[\u0600-\u06ff]/);
  37  |   });
  38  | }
  39  | 
  40  | test("a delayed canonical-equivalent learning IME echo counts only one composition", async ({ page }) => {
  41  |   await page.goto("/learn?language=en&layout=qwerty");
  42  |   const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  43  |   await input.focus();
  44  |   await composition(input, "e\u0301");
> 45  |   await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(1);
      |                                                                 ^ Error: expect(locator).toHaveCount(expected) failed
  46  |   // Deliberately exceed the previous 30 ms heuristic before the browser's final
  47  |   // input event; correctness must follow event ownership under a busy main thread.
  48  |   await page.waitForTimeout(100);
  49  |   await input.evaluate((element) => {
  50  |     const textarea = element as HTMLTextAreaElement;
  51  |     Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "é");
  52  |     textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "é" }));
  53  |   });
  54  |   await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(1);
  55  |   await input.pressSequentially("a");
  56  |   await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  57  |   const result = await exportedResult(page);
  58  |   expect(result.finalText).toBe("éa");
  59  |   expect(result.metrics.insertionAttempts).toBe(2);
  60  |   expect(result.events.filter((event) => event.provenance === "composition")).toHaveLength(1);
  61  | });
  62  | 
  63  | test("a new physical key can immediately repeat a learning composition's letter", async ({ page }) => {
  64  |   await page.goto("/learn?language=en&layout=qwerty");
  65  |   const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  66  |   await input.focus();
  67  |   await input.evaluate((element) => {
  68  |     const textarea = element as HTMLTextAreaElement;
  69  |     const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  70  |     textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
  71  |     setValue.call(textarea, "a");
  72  |     textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "a" }));
  73  |     textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a", code: "KeyA" }));
  74  |     setValue.call(textarea, "a");
  75  |     textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
  76  |     textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a", code: "KeyA" }));
  77  |   });
  78  |   await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(2);
  79  |   await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  80  |   const result = await exportedResult(page);
  81  |   expect(result.finalText).toBe("aa");
  82  |   expect(result.metrics.insertionAttempts).toBe(2);
  83  |   expect(result.events.map((event) => event.provenance)).toEqual(["composition", "keyboard"]);
  84  | });
  85  | 
  86  | for (const legacyKeydown of [false, true]) {
  87  |   test(`a virtual key can repeat an IME letter with ${legacyKeydown ? "legacy keyCode 229" : "no keydown"} and no composition echo`, async ({ page }) => {
  88  |     await page.goto("/learn?language=en&layout=qwerty");
  89  |     const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  90  |     await input.focus();
  91  |     await input.evaluate((element, sendLegacyKeydown) => {
  92  |       const textarea = element as HTMLTextAreaElement;
  93  |       const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  94  |       textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
  95  |       setValue.call(textarea, "a");
  96  |       textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "a" }));
  97  |       // Some soft keyboards do not emit ordinary physical keydown events. A
  98  |       // generic insertText still represents a new character, even when equal.
  99  |       if (sendLegacyKeydown) {
  100 |         textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Unidentified", keyCode: 229 }));
  101 |       }
  102 |       setValue.call(textarea, "a");
  103 |       textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
  104 |     }, legacyKeydown);
  105 |     await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(2);
  106 |     await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  107 |     const result = await exportedResult(page);
  108 |     expect(result.finalText).toBe("aa");
  109 |     expect(result.metrics.insertionAttempts).toBe(2);
  110 |     expect(result.events.map((event) => event.provenance)).toEqual(["composition", "keyboard"]);
  111 |   });
  112 | }
  113 | 
```