import { expect, test, type Locator } from "@playwright/test";
import { customPractice, exportedResult } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

/** Native soft-keyboard fallback: no keydown or beforeinput is dispatched. */
async function nativeInput(
  input: Locator,
  value: string,
  inputType: string,
  data: string | null,
) {
  await input.evaluate((element, change) => {
    const field = element as HTMLTextAreaElement;
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(field, change.value);
    field.setSelectionRange(change.value.length, change.value.length);
    field.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: change.inputType,
      data: change.data,
    }));
  }, { value, inputType, data });
}

test.describe("native editing across presentation frames", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("several native input events in one task complete with every attempt intact", async ({ page }) => {
    const input = await customPractice(page, "cat dog");
    const drafts = await input.evaluate(element => {
      const field = element as HTMLTextAreaElement;
      const values: string[] = [];
      for (const text of "cat dog") {
        field.value += text;
        field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
        values.push(field.value);
      }
      return values;
    });
    expect(drafts).toEqual(["c", "ca", "cat", "cat ", "cat d", "cat do", "cat dog"]);
    const result = await exportedResult(page);
    expect(result.finalText).toBe("cat dog");
    expect(result.events).toHaveLength(7);
    expect(result.metrics.insertionAttempts).toBe(7);
    expect(result.metrics.inputAccuracy).toBe(100);
  });

  test("pausing before the next paint preserves pending text and cannot be undone by an old frame", async ({ page }) => {
    const input = await customPractice(page, "cat dog");
    await input.evaluate(element => {
      const field = element as HTMLTextAreaElement;
      for (const text of "ca") {
        field.value += text;
        field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      }
      field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape", code: "Escape" }));
    });
    await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "paused");
    await expect(input).toHaveValue("ca");
    await expect(input).toBeDisabled();
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "paused");
    await expect(page.locator('[data-testid="typing-target"] [data-status="correct"]')).toHaveCount(2);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(input).toBeFocused();
    await input.pressSequentially("t dog");
    const result = await exportedResult(page);
    expect(result.finalText).toBe("cat dog");
    expect(result.metrics.insertionAttempts).toBe(7);
    expect(result.metrics.inputAccuracy).toBe(100);
    expect(result.pauseIntervals).toHaveLength(1);
  });

  test("an IME draft survives live clock updates and commits exactly once", async ({ page }) => {
    const input = await customPractice(page, "cat dog");
    await input.press("c");
    await input.evaluate(element => {
      const field = element as HTMLTextAreaElement;
      field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
      field.value = "cあ";
      field.setSelectionRange(2, 2);
      field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "あ", isComposing: true }));
    });
    await expect(page.locator(".typing-hud")).toContainText("1s");
    await expect(input).toHaveValue("cあ");
    await input.evaluate(element => {
      const field = element as HTMLTextAreaElement;
      field.value = "ca";
      field.setSelectionRange(2, 2);
      field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "a" }));
      field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: "a" }));
    });
    await expect(input).toHaveValue("ca");
    await input.pressSequentially("t dog");
    const result = await exportedResult(page);
    expect(result.finalText).toBe("cat dog");
    expect(result.metrics.insertionAttempts).toBe(7);
    expect(result.metrics.inputAccuracy).toBe(100);
    expect(result.events.filter(event => event.type === "composition")).toHaveLength(1);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(1000);
  });
});

test.describe("mobile retained-text input integrity", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  for (const inputType of ["insertReplacementText", "insertText"]) {
    test(`practice native ${inputType} starts on input and preserves replacement provenance without leaking it`, async ({ page }) => {
      const input = await customPractice(page, "cat dog");
      const session = page.getByRole("region", { name: "Typing session", exact: true });
      await expect(session).toHaveAttribute("data-status", "ready");
      await nativeInput(input, "c", inputType, "c");
      await expect(input).toHaveValue("c");
      await expect(session).toHaveAttribute("data-status", "running");
      await input.press("x");
      await nativeInput(input, "ca", inputType, "a");
      await expect(input).toHaveValue("ca");
      await input.pressSequentially("t dog");
      await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();

      const result = await exportedResult(page);
      const source = inputType === "insertReplacementText" ? "autocorrect" : "keyboard";
      expect(result.finalText).toBe("cat dog");
      expect(result.events[0].provenance).toBe(source);
      expect(result.events[2]).toMatchObject({ type: "replace", provenance: source, start: 1, end: 2, text: "a" });
      expect(result.events.filter((_, index) => index !== 0 && index !== 2)
        .every(event => event.provenance === "keyboard")).toBe(true);
      expect(result.metrics).toMatchObject({ insertionAttempts: 8, correctAttempts: 7, incorrectAttempts: 1, inputAccuracy: 87.5 });
      if (source === "autocorrect") expect(result.assistance).toContain("autocorrect");
      else expect(result.assistance).not.toContain("autocorrect");
    });

    test(`practice unchanged native ${inputType} preserves assistance without attempts or an idle clock start`, async ({ page }) => {
      const input = await customPractice(page, "cat dog");
      const session = page.getByRole("region", { name: "Typing session", exact: true });
      await nativeInput(input, "", inputType, "");
      await expect(input).toHaveValue("");
      await expect(session).toHaveAttribute("data-status", "ready");
      await expect(page.getByTestId("typing-target").locator('[data-current="true"]')).toHaveAttribute("data-slot-index", "0");

      await input.pressSequentially("ca");
      await nativeInput(input, "ca", inputType, "a");
      await expect(input).toHaveValue("ca");
      await expect(session).toHaveAttribute("data-status", "running");
      await expect(page.getByTestId("typing-target").locator('[data-current="true"]')).toHaveAttribute("data-slot-index", "2");
      await input.pressSequentially("t dog");
      await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();

      const result = await exportedResult(page);
      expect(result.finalText).toBe("cat dog");
      expect(result.metrics).toMatchObject({ insertionAttempts: 7, correctAttempts: 7, incorrectAttempts: 0, inputAccuracy: 100, deletionActions: 0, deletedUnits: 0 });
      const markers = result.events.filter(event => event.text === "");
      if (inputType === "insertReplacementText") {
        expect(markers).toHaveLength(2);
        expect(markers[0]).toMatchObject({ type: "replace", start: 0, end: 0, offsetMs: 0, provenance: "autocorrect" });
        expect(markers[1]).toMatchObject({ type: "replace", start: 2, end: 2, provenance: "autocorrect" });
        expect(result.assistance).toContain("autocorrect");
        expect(result.eligibility.reasons).toContain("Assisted input");
      } else {
        expect(markers).toEqual([]);
        expect(result.assistance).not.toContain("autocorrect");
        expect(result.eligibility.reasons).not.toContain("Assisted input");
      }
      expect(result.events.filter(event => event.text !== "").every(event => event.provenance === "keyboard")).toBe(true);
    });
  }

  for (const postCompositionEcho of [false, true]) {
    test(`practice composition ${postCompositionEcho ? "with" : "without"} a final native echo retains a later insertion and deletion`, async ({ page }) => {
      const composedText = postCompositionEcho ? "e\u0301" : "c";
      const first = composedText.normalize("NFC");
      const prefix = postCompositionEcho ? "cat " : "";
      const passage = `${prefix}${first}at dog`;
      const input = await customPractice(page, passage);
      if (prefix) await input.pressSequentially(prefix);
      await input.evaluate((element, change) => {
        const field = element as HTMLTextAreaElement;
        field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(field, change.prefix + change.text);
        field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertCompositionText", data: change.text, isComposing: true }));
      }, { prefix, text: composedText });
      await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", prefix ? "running" : "ready");
      await input.evaluate((element, text) => element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: text })), composedText);
      await expect(input).toHaveValue(prefix + first);
      await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "running");
      if (postCompositionEcho) {
        // Some adapters append the final committed batch again. Its explicit
        // composition ownership must restore native and controlled values.
        await nativeInput(input, prefix + first + composedText, "insertCompositionText", composedText);
        await expect(input).toHaveValue(prefix + first);
      }

      // Some keyboards end composition after their final input and emit no echo.
      // An independent insert then delete must not be mistaken for that old echo.
      await nativeInput(input, `${prefix}${first}a`, "insertText", "a");
      await expect(input).toHaveValue(`${prefix}${first}a`);
      await nativeInput(input, prefix + first, "deleteContentBackward", null);
      await expect(input).toHaveValue(prefix + first);
      await expect(page.getByTestId("typing-target").locator('[data-current="true"]')).toHaveAttribute("data-slot-index", String(prefix.length + 1));
      await nativeInput(input, `${prefix}${first}a`, "insertText", "a");
      await input.pressSequentially("t dog");
      await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();

      const result = await exportedResult(page);
      expect(result.finalText).toBe(passage);
      expect(result.metrics).toMatchObject({ insertionAttempts: 8 + prefix.length, correctAttempts: 8 + prefix.length, incorrectAttempts: 0, inputAccuracy: 100, deletionActions: 1, deletedUnits: 1 });
      expect(result.events.filter(event => event.provenance === "composition")).toHaveLength(1);
      expect(result.events[prefix.length]).toMatchObject({ type: "composition", text: first, provenance: "composition" });
      expect(result.events[prefix.length + 2]).toMatchObject({ type: "delete", start: prefix.length + 1, end: prefix.length + 2 });
      expect(result.events.filter((_, index) => index !== prefix.length).every(event => event.provenance === "keyboard")).toBe(true);
      expect(result.assistance).not.toContain("autocorrect");
    });
  }
});

for (const inputType of ["insertReplacementText", "insertText"]) {
  test(`adaptive native ${inputType} preserves actual provenance and assessment eligibility`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(new URL("learn?language=en&layout=qwerty", baseURL!).href);
    const input = page.getByRole("textbox", {
      name: "Type the practice text",
      exact: true,
    });
    const text = (await page.locator(".learn-stream-text").textContent())!;
    expect(text.length).toBeGreaterThan(3);
    await input.focus();
    await input.pressSequentially(text[0], { delay: 30 });
    await input.evaluate(
      (element, change) => {
        const field = element as HTMLTextAreaElement;
        Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value",
        )!.set!.call(field, change.text);
        field.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: change.inputType,
            data: change.text,
          }),
        );
      },
      { inputType, text: text[1] },
    );
    await input.pressSequentially(text.slice(2), { delay: 2 });
    await expect(
      page.getByRole("region", { name: "Session results", exact: true }),
    ).toBeVisible();
    const result = await exportedResult(page);
    const autocorrect = inputType === "insertReplacementText";
    expect(result.events[1].provenance).toBe(
      autocorrect ? "autocorrect" : "keyboard",
    );
    expect(result.finalText).toBe(text);
    expect(result.metrics.inputAccuracy).toBe(100);
    const evidence = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("typingforge:v3:guest:learning") || "{}",
        ).sessions[0],
    );
    expect(evidence.assessment).toBe(!autocorrect);
    if (autocorrect) {
      expect(result.assistance).toContain("autocorrect");
      expect(evidence.attempts[1]).toMatchObject({
        attributable: false,
        latencyMs: null,
      });
      expect(evidence.attempts[2]).toMatchObject({
        attributable: false,
        latencyMs: null,
      });
    } else expect(result.assistance).not.toContain("autocorrect");
  });
}
