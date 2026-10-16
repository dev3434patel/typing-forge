# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: input-guardrails.spec.ts >> paste and drop stay outside the practice transcript and never start its clock
- Location: e2e\input-guardrails.spec.ts:25:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Start private practice', exact: true })
    - locator resolved to <button class="forge-button mt-4">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | import { readFile } from "node:fs/promises";
  3  | import type { SessionResult } from "../src/lib/typing-core";
  4  | 
  5  | export async function focusTyping(page: Page) {
  6  |   const input = page.getByRole("textbox", {
  7  |     name: "Typing input",
  8  |     exact: true,
  9  |   });
  10 |   await expect(input).toBeVisible();
  11 |   // Desktop starts focused; touch devices retain the explicit keyboard activation.
  12 |   if (
  13 |     !(await input.evaluate((element) => element === document.activeElement))
  14 |   ) {
  15 |     await page
  16 |       .getByRole("button", { name: /^Click here or tab to start typing/ })
  17 |       .click();
  18 |   }
  19 |   await expect(input).toBeFocused();
  20 |   return input;
  21 | }
  22 | export async function customPractice(page: Page, passage: string) {
  23 |   await page.goto("/");
  24 |   await page
  25 |     .getByRole("group", { name: "Test mode", exact: true })
  26 |     .getByRole("button", { name: "Custom", exact: true })
  27 |     .click();
  28 |   await page
  29 |     .getByRole("textbox", { name: "Custom practice passage", exact: true })
  30 |     .fill(passage);
  31 |   await page
  32 |     .getByRole("button", { name: "Start private practice", exact: true })
> 33 |     .click();
     |      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  34 |   return focusTyping(page);
  35 | }
  36 | export async function exportedResult(page: Page): Promise<SessionResult> {
  37 |   const downloadEvent = page.waitForEvent("download");
  38 |   await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  39 |   const download = await downloadEvent;
  40 |   const path = await download.path();
  41 |   expect(path).not.toBeNull();
  42 |   return JSON.parse(await readFile(path!, "utf8")) as SessionResult;
  43 | }
  44 | export async function completeCorrectedCat(page: Page) {
  45 |   const input = await customPractice(page, "cat");
  46 |   await input.pressSequentially("cx", { delay: 70 });
  47 |   await input.press("Backspace");
  48 |   await input.pressSequentially("at", { delay: 70 });
  49 |   await expect(
  50 |     page.getByRole("region", { name: "Session results", exact: true }),
  51 |   ).toBeVisible();
  52 | }
  53 | 
```