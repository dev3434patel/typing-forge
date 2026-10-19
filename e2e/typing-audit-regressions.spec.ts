import { expect, test, type Locator } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
  });
});

async function composition(input: Locator, text: string) {
  await input.evaluate((element, value) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, value);
    textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: value }));
  }, text);
}

for (const mode of ["Quote", "Code"] as const) {
  test(`${mode} records the actual Latin content and ignores inactive generated-word toggles`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Language", { exact: true }).selectOption("ar");
    await page.getByRole("button", { name: "punctuation", exact: true }).click();
    await page.getByRole("button", { name: "# numbers", exact: true }).click();
    await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: mode, exact: true }).click();
    const input = await focusTyping(page);
    await input.pressSequentially("a");
    await page.getByRole("button", { name: "Finish", exact: true }).click();
    const result = await exportedResult(page);
    expect(result.configuration).toMatchObject({
      mode: mode.toLowerCase(), language: "en", script: "Latin", punctuation: false, numbers: false,
    });
    const comparison = JSON.parse(result.comparisonKey);
    expect(comparison).toMatchObject({ language: "en", script: "Latin", punctuation: false, numbers: false });
    expect(result.initialTarget).toMatch(/[A-Za-z]/);
    expect(result.initialTarget).not.toMatch(/[\u0600-\u06ff]/);
  });
}

test("a delayed canonical-equivalent learning IME echo counts only one composition", async ({ page }) => {
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  await input.focus();
  await composition(input, "e\u0301");
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(1);
  // Deliberately exceed the previous 30 ms heuristic before the browser's final
  // input event; correctness must follow event ownership under a busy main thread.
  await page.waitForTimeout(100);
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "é");
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "é" }));
  });
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(1);
  await input.pressSequentially("a");
  await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("éa");
  expect(result.metrics.insertionAttempts).toBe(2);
  expect(result.events.filter((event) => event.provenance === "composition")).toHaveLength(1);
});

test("a new physical key can immediately repeat a learning composition's letter", async ({ page }) => {
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  await input.focus();
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
    setValue.call(textarea, "a");
    textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "a" }));
    textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a", code: "KeyA" }));
    setValue.call(textarea, "a");
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
    textarea.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a", code: "KeyA" }));
  });
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(2);
  await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("aa");
  expect(result.metrics.insertionAttempts).toBe(2);
  expect(result.events.map((event) => event.provenance)).toEqual(["composition", "keyboard"]);
});

for (const legacyKeydown of [false, true]) {
  test(`a virtual key can repeat an IME letter with ${legacyKeydown ? "legacy keyCode 229" : "no keydown"} and no composition echo`, async ({ page }) => {
    await page.goto("/learn?language=en&layout=qwerty");
    const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
    await input.focus();
    await input.evaluate((element, sendLegacyKeydown) => {
      const textarea = element as HTMLTextAreaElement;
      const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      textarea.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
      setValue.call(textarea, "a");
      textarea.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "a" }));
      // Some soft keyboards do not emit ordinary physical keydown events. A
      // generic insertText still represents a new character, even when equal.
      if (sendLegacyKeydown) {
        textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Unidentified", keyCode: 229 }));
      }
      setValue.call(textarea, "a");
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "a" }));
    }, legacyKeydown);
    await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(2);
    await page.getByRole("button", { name: "Finish practice", exact: true }).click();
    const result = await exportedResult(page);
    expect(result.finalText).toBe("aa");
    expect(result.metrics.insertionAttempts).toBe(2);
    expect(result.events.map((event) => event.provenance)).toEqual(["composition", "keyboard"]);
  });
}
