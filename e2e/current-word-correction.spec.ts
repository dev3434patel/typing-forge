import { expect, test, type Locator } from "@playwright/test";
import { customPractice, exportedResult, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

/** Exercise a browser input fallback without relying on a preceding keydown. */
async function inputFallback(
  input: Locator,
  value: string,
  inputType: string,
  data: string | null = null,
) {
  await input.evaluate(
    (element, change) => {
      const textarea = element as HTMLTextAreaElement;
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )!.set!.call(textarea, change.value);
      textarea.setSelectionRange(change.value.length, change.value.length);
      textarea.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: change.inputType,
          data: change.data,
        }),
      );
    },
    { value, inputType, data },
  );
}

/** Simulate the native default edit only when beforeinput has not consumed it. */
async function nativeDeletion(input: Locator, inputType: string) {
  return input.evaluate((element, kind) => {
    const textarea = element as HTMLTextAreaElement;
    const event = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: kind,
    });
    const allowed = textarea.dispatchEvent(event);
    if (!allowed) return { prevented: true };
    let start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      start =
        kind === "deleteWordBackward"
          ? textarea.value.slice(0, start).replace(/\s*\S+\s*$/u, "").length
          : Math.max(0, start - 1);
    }
    const next = textarea.value.slice(0, start) + textarea.value.slice(end);
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, next);
    textarea.setSelectionRange(start, start);
    textarea.dispatchEvent(
      new InputEvent("input", { bubbles: true, inputType: kind }),
    );
    return { prevented: false };
  }, inputType);
}

test("Space commits a correct word while Backspace and word-delete edit only the current word", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog quiet calm");
  await input.pressSequentially("cat");
  await input.press("Backspace");
  await expect(input).toHaveValue("ca");
  await input.pressSequentially("t ");
  for (const key of ["Backspace", "Control+Backspace", "Alt+Backspace"]) {
    await input.press(key);
    await expect(input).toHaveValue("cat ");
  }
  await input.pressSequentially("dox");
  await input.press("Backspace");
  await expect(input).toHaveValue("cat do");
  for (const key of ["Control+Backspace", "Alt+Backspace"]) {
    await input.press(key);
    await expect(input).toHaveValue("cat ");
    await input.pressSequentially("do");
  }
  await input.press("g");
  await expect(input).toHaveValue("cat dog");
  await input.press("Space");
  await input.press("Backspace");
  await expect(input).toHaveValue("cat dog ");
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-expected", "q");
});

test("a submitted wrong word cannot be repaired later and blocked edits do not change result counts", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog quiet calm");
  await input.pressSequentially("cxt dox");
  await input.press("Backspace");
  await input.pressSequentially("g ");
  await expect(input).toHaveValue("cxt dog ");
  await input.press("Control+Backspace");
  await input.press("Backspace");
  await inputFallback(input, "cat dog ", "insertReplacementText", "a");
  await expect(input).toHaveValue("cxt dog ");
  await expect(
    page.getByTestId("typing-target").locator('[data-slot-index="1"]'),
  ).toHaveAttribute("data-status", "incorrect");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("cxt dog ");
  expect(result.metrics.insertionAttempts).toBe(9);
  expect(result.metrics.incorrectAttempts).toBe(2);
  expect(result.metrics.inputAccuracy).toBeCloseTo((7 / 9) * 100);
  expect(result.metrics.deletionActions).toBe(1);
  expect(result.metrics.deletedUnits).toBe(1);
});

test("selection, cut, undo and input-only fallback cannot modify the submitted prefix", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog quiet calm");
  await input.pressSequentially("cat do");
  await input.press("ControlOrMeta+A");
  await expect
    .poll(() =>
      input.evaluate(
        (element) => (element as HTMLTextAreaElement).selectionStart,
      ),
    )
    .toBe(4);
  await input.press("x");
  await expect(input).toHaveValue("cat x");
  await input.press("ControlOrMeta+A");
  await input.press("ControlOrMeta+X");
  await expect(input).toHaveValue("cat ");
  await input.press("ControlOrMeta+Z");
  expect(await input.inputValue()).toMatch(/^cat /u);
  const before = await input.inputValue();
  await inputFallback(input, "bat " + before.slice(4), "historyUndo");
  await expect(input).toHaveValue(before);
  await inputFallback(input, "bat z", "insertText", "z");
  await expect(input).toHaveValue(before);
  // A fallback that removes across the boundary is clipped to the current word.
  await inputFallback(input, "", "deleteContentBackward");
  await expect(input).toHaveValue("cat ");
  await input.pressSequentially("dog");
  await expect(input).toHaveValue("cat dog");
});

test.describe("mobile beforeinput correction", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("soft-keyboard deletion without keydown respects the committed word boundary", async ({
    page,
  }) => {
    const input = await customPractice(page, "cat dog quiet calm");
    await input.pressSequentially("cat do");
    await nativeDeletion(input, "deleteContentBackward");
    await expect(input).toHaveValue("cat d");
    await nativeDeletion(input, "deleteWordBackward");
    await expect(input).toHaveValue("cat ");
    const boundary = await nativeDeletion(input, "deleteContentBackward");
    expect(boundary.prevented).toBe(true);
    await expect(input).toHaveValue("cat ");
    await input.pressSequentially("dog ");
    await nativeDeletion(input, "deleteWordBackward");
    await expect(input).toHaveValue("cat dog ");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test("learning supports native deletion from its empty draft while protecting completed words", async ({
  page,
}) => {
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", {
    name: "Type the practice text",
    exact: true,
  });
  const target = page.locator(".learn-stream-text");
  const passage = (await target.textContent())!;
  const boundary = passage.indexOf(" ") + 1;
  expect(boundary).toBeGreaterThan(1);
  const prefix = passage.slice(0, boundary);
  await input.pressSequentially(prefix);
  await expect(input).toHaveValue("");
  await input.press("Backspace");
  await nativeDeletion(input, "deleteWordBackward");
  await expect(target.locator("[data-typed]")).toHaveCount(boundary);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute(
    "data-slot-index",
    String(boundary),
  );
  const currentWord = passage.slice(boundary).split(" ")[0];
  expect(currentWord.length).toBeGreaterThanOrEqual(2);
  await input.pressSequentially(currentWord.slice(0, 2));
  await expect(input).toHaveValue("");
  await nativeDeletion(input, "deleteContentBackward");
  await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  await input.press("Control+Backspace");
  await expect(target.locator("[data-typed]")).toHaveCount(boundary);
  await nativeDeletion(input, "deleteContentBackward");
  await expect(target.locator("[data-typed]")).toHaveCount(boundary);
  await page.getByRole("button", { name: "New lesson", exact: true }).click();
  await expect(input).toBeFocused();
  await input.press("x");
  await nativeDeletion(input, "deleteContentBackward");
  await expect(target.locator("[data-typed]")).toHaveCount(0);
});

test("local bot practice uses the same word boundary without affecting opponent progress", async ({
  page,
}) => {
  await page.goto("/race");
  await page
    .getByRole("combobox", { name: "Difficulty", exact: true })
    .selectOption("beginner");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  const input = await focusTyping(page);
  const target = page.getByTestId("typing-target");
  const passage = (await target.textContent())!;
  const boundary = passage.indexOf(" ") + 1;
  const prefix = passage.slice(0, boundary);
  const currentWord = passage.slice(boundary).split(" ")[0];
  await input.pressSequentially(prefix + currentWord.slice(0, 1));
  await input.press("Control+Backspace");
  await expect(input).toHaveValue(prefix);
  await input.press("Backspace");
  await nativeDeletion(input, "deleteWordBackward");
  await expect(input).toHaveValue(prefix);
  await input.pressSequentially(currentWord + " ");
  await input.press("Backspace");
  await expect(input).toHaveValue(prefix + currentWord + " ");
  await expect(page.getByTestId("opponent-caret")).toHaveCount(1);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.configuration.mode).toBe("race");
  expect(result.configuration.settings?.localBot).toBe(true);
  expect(result.finalText).toBe(prefix + currentWord + " ");
  expect(result.metrics.inputAccuracy).toBe(100);
  expect(result.metrics.deletionActions).toBe(1);
});

test("learning IME cleanup events cannot delete a canonical committed composition", async ({
  page,
}) => {
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", {
    name: "Type the practice text",
    exact: true,
  });
  const target = page.locator(".learn-stream-text");
  const passage = (await target.textContent())!;
  const boundary = passage.indexOf(" ") + 1;
  const firstCurrentCharacter = passage[boundary];
  await input.pressSequentially(passage.slice(0, boundary));
  await input.evaluate((element, character) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, character);
    textarea.dispatchEvent(
      new CompositionEvent("compositionend", {
        bubbles: true,
        data: character,
      }),
    );
  }, firstCurrentCharacter);
  await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  for (const kind of ["deleteCompositionText", "deleteByComposition"]) {
    await inputFallback(input, "", kind);
    await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  }
  // Some keyboards report a generic composing deletion after compositionend.
  // Native isComposing ownership must win even when no compositionstart follows.
  const nativeCompositionDeletion = await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const before = new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteContentBackward",
      isComposing: true,
    });
    const allowed = textarea.dispatchEvent(before);
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, "");
    textarea.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "deleteContentBackward",
        isComposing: true,
      }),
    );
    return { allowed };
  });
  expect(nativeCompositionDeletion.allowed).toBe(true);
  await expect(target.locator("[data-typed]")).toHaveCount(boundary + 1);
  await expect(
    target.locator(`[data-slot-index="${boundary}"]`),
  ).toHaveAttribute("data-typed", firstCurrentCharacter);
  await nativeDeletion(input, "deleteContentBackward");
  await expect(target.locator("[data-typed]")).toHaveCount(boundary);
  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  const result = await exportedResult(page);
  expect(result.finalText).toBe(passage.slice(0, boundary));
  expect(result.metrics.insertionAttempts).toBe(boundary + 1);
  expect(result.metrics.deletionActions).toBe(1);
  expect(
    result.events.filter((event) => event.provenance === "composition"),
  ).toHaveLength(1);
});

test("composition preserves its committed prefix and Tab then Enter resets the word boundary", async ({
  page,
}) => {
  const input = await customPractice(page, "cat élan dog quiet");
  await input.pressSequentially("cat ");
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    textarea.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    setValue.call(textarea, "cat e");
    textarea.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: "e",
        isComposing: true,
      }),
    );
    setValue.call(textarea, "cat e\u0301");
    textarea.dispatchEvent(
      new CompositionEvent("compositionend", {
        bubbles: true,
        data: "e\u0301",
      }),
    );
    textarea.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: "e\u0301",
      }),
    );
  });
  await expect(input).toHaveValue("cat é");
  await expect(
    page.getByTestId("typing-target").locator('[data-slot-index="4"]'),
  ).toHaveAttribute("data-status", "correct");
  await input.press("Backspace");
  await expect(input).toHaveValue("cat ");
  await input.press("Backspace");
  await expect(input).toHaveValue("cat ");
  await input.press("Tab");
  const restart = page.getByRole("button", {
    name: "Restart with new text",
    exact: true,
  });
  await expect(restart).toBeFocused();
  await restart.press("Enter");
  await expect(
    page.getByRole("textbox", { name: "Custom practice passage", exact: true }),
  ).toHaveValue("cat élan dog quiet");
  await page
    .getByRole("button", { name: "Start private practice", exact: true })
    .click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await input.press("x");
  await input.press("Backspace");
  await expect(input).toHaveValue("");
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-slot-index", "0");
});
