# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: race-pace.spec.ts >> light-theme pace remains visible and resizes without leaving a marker in normal practice
- Location: e2e\race-pace.spec.ts:109:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('textbox', { name: 'Typing input', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('textbox', { name: 'Typing input', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Typing input', exact: true })

```

```yaml
- status: Loading your workspace…
```

# Test source

```ts
  31  |   ).toBeVisible();
  32  |   await expect(page.getByTestId("race-pace-legend")).toContainText("Bot pace");
  33  |   await expect(page.getByTestId("race-pace-legend")).toContainText("ahead");
  34  |   expect(
  35  |     await marker.evaluate(
  36  |       (element) => getComputedStyle(element).backgroundColor,
  37  |     ),
  38  |   ).toBe("rgb(197, 199, 205)");
  39  |   expect(
  40  |     await page
  41  |       .getByTestId("typing-viewport")
  42  |       .evaluate((element) => element.scrollTop),
  43  |   ).toBe(0);
  44  |   await page.screenshot({
  45  |     path: `audit/race-pace-2026-10-16/bot-${info.project.name}.png`,
  46  |     fullPage: true,
  47  |   });
  48  |   await page.getByRole("button", { name: "Finish", exact: true }).click();
  49  |   await expect(marker).toHaveCount(0);
  50  |   const result = await exportedResult(page);
  51  |   expect(result.finalText).toBe("");
  52  |   expect(result.events).toHaveLength(0);
  53  |   expect(result.metrics.insertionAttempts).toBe(0);
  54  | });
  55  | 
  56  | test("opponent progress does not scroll away from a leading user or recolor their mistakes", async ({
  57  |   page,
  58  | }, info) => {
  59  |   await page.setViewportSize({ width: 390, height: 844 });
  60  |   const input = await startBot(page);
  61  |   const target = page.getByTestId("typing-target");
  62  |   const text = await target.textContent();
  63  |   const cut = text!.indexOf(" ", 210);
  64  |   await input.fill(text!.slice(0, cut + 1));
  65  |   const current = target.locator('[data-current="true"]');
  66  |   const expected = await current.getAttribute("data-expected");
  67  |   const wrong = expected === "x" ? "z" : "x";
  68  |   const index = await current.getAttribute("data-slot-index");
  69  |   await input.pressSequentially(wrong);
  70  |   const wrongSlot = target.locator(`[data-slot-index="${index}"]`);
  71  |   await expect(wrongSlot).toHaveAttribute("data-status", "incorrect");
  72  |   await expect(wrongSlot).not.toHaveClass(/opponent-passed/);
  73  |   await expect(page.getByTestId("race-pace-legend")).toContainText("behind");
  74  |   await expect
  75  |     .poll(() =>
  76  |       page
  77  |         .getByTestId("typing-viewport")
  78  |         .evaluate((element) => element.scrollTop),
  79  |     )
  80  |     .toBeGreaterThan(0);
  81  |   await expect(page.getByTestId("opponent-caret")).toHaveAttribute(
  82  |     "data-in-view",
  83  |     "false",
  84  |   );
  85  |   await expect
  86  |     .poll(() =>
  87  |       page.getByTestId("typing-viewport").evaluate((element) => {
  88  |         const bounds = element.getBoundingClientRect();
  89  |         const caret = element
  90  |           .querySelector<HTMLElement>(":scope > .forge-caret")!
  91  |           .getBoundingClientRect();
  92  |         return caret.top >= bounds.top - 1 && caret.bottom <= bounds.bottom + 1;
  93  |       }),
  94  |     )
  95  |     .toBe(true);
  96  |   expect(
  97  |     await page.evaluate(
  98  |       () => document.documentElement.scrollWidth <= innerWidth,
  99  |     ),
  100 |   ).toBe(true);
  101 |   await page.screenshot({
  102 |     path: `audit/race-pace-2026-10-16/mobile-${info.project.name}.png`,
  103 |     fullPage: true,
  104 |   });
  105 |   await input.press("Backspace");
  106 |   await expect(wrongSlot).not.toHaveAttribute("data-status", "incorrect");
  107 | });
  108 | 
  109 | test("light-theme pace remains visible and resizes without leaving a marker in normal practice", async ({
  110 |   page,
  111 | }) => {
  112 |   await page.goto("/settings");
  113 |   await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
  114 |   await startBot(page);
  115 |   const marker = page.getByTestId("opponent-caret");
  116 |   await expect
  117 |     .poll(async () => Number(await marker.getAttribute("data-position")))
  118 |     .toBeGreaterThan(0);
  119 |   expect(
  120 |     await marker.evaluate(
  121 |       (element) => getComputedStyle(element).backgroundColor,
  122 |     ),
  123 |   ).toBe("rgb(98, 101, 109)");
  124 |   await page.setViewportSize({ width: 540, height: 820 });
  125 |   await expect(marker).toHaveAttribute("data-in-view", "true");
  126 |   await page.getByRole("button", { name: "Leave race", exact: true }).click();
  127 |   await expect(page.getByTestId("opponent-caret")).toHaveCount(0);
  128 |   await page.goto("/");
  129 |   await expect(
  130 |     page.getByRole("textbox", { name: "Typing input", exact: true }),
> 131 |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  132 |   await expect(page.getByTestId("opponent-caret")).toHaveCount(0);
  133 |   await expect(page.getByTestId("race-pace-legend")).toHaveCount(0);
  134 | });
  135 | 
```