import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { customPractice, exportedResult, focusTyping } from "./helpers";

test("a retained wrong letter is visible in place, advances, and can be corrected honestly", async ({
  page,
}, info) => {
  const input = await customPractice(page, "cat dog");
  await input.pressSequentially("cx", { delay: 50 });
  const target = page.getByTestId("typing-target");
  const wrong = target.locator('[data-slot-index="1"]');
  await expect(input).toHaveValue("cx");
  await expect(wrong.locator("[data-typed-glyph]")).toHaveText("x");
  await expect(wrong.locator(".typing-expected-hint")).toHaveText("a");
  await expect(target.locator('[data-current="true"]')).toHaveAttribute(
    "data-expected",
    "t",
  );
  expect(
    await wrong.evaluate(
      (element) => getComputedStyle(element).textDecorationLine,
    ),
  ).toContain("underline");
  const feedback = page.getByTestId("typing-feedback");
  await expect(feedback).toContainText("You typed x");
  await expect(feedback).toContainText("Expected a");
  await expect(feedback).toContainText("Added to your text");
  await mkdir("audit/wrong-key-feedback-2026-10-16", { recursive: true });
  await page.screenshot({
    path: `audit/wrong-key-feedback-2026-10-16/practice-${info.project.name}.png`,
    fullPage: true,
  });
  await input.press("Backspace");
  await expect(input).toHaveValue("c");
  await expect(wrong).not.toHaveAttribute("data-status", "incorrect");
  await expect(feedback).not.toContainText("Expected a");
  await input.pressSequentially("at dog", { delay: 20 });
  await expect(
    page.getByRole("region", { name: "Session results" }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("cat dog");
  expect(result.metrics.inputAccuracy).toBe(87.5);
  expect(result.metrics.incorrectAttempts).toBe(1);
  expect(result.metrics.deletionActions).toBe(1);
});

test("explicit precision mode shows the rejected key and expected character", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode" })
    .getByRole("button", { name: "Custom", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "Precision mode · stop on errors" })
    .check();
  await page
    .getByRole("textbox", { name: "Custom practice passage" })
    .fill("cat dog");
  await page.getByRole("button", { name: "Start private practice" }).click();
  const input = await focusTyping(page);
  await input.pressSequentially("cx", { delay: 50 });
  await expect(input).toHaveValue("c");
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-expected", "a");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed x",
  );
  await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "Not inserted",
  );
  await input.press("x");
  await expect(page.getByTestId("typing-feedback").getByRole("status")).toContainText("2 incorrect attempts so far");
  await input.press("a");
  await expect(input).toHaveValue("ca");
  await expect(page.getByTestId("typing-feedback")).not.toContainText(
    "Not inserted",
  );
});

test("an early space has visible input feedback even when the final separator aligns correctly", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog");
  await input.pressSequentially("c ");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed Space",
  );
  await expect(page.getByTestId("typing-feedback")).toContainText("Expected a");
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-expected", "d");
  await input.press("Backspace");
  await expect(input).toHaveValue("c");
  await expect(page.getByTestId("typing-feedback")).not.toContainText(
    "You typed Space",
  );
});

test("overtyping a word reports the actual input and the missing separator", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog");
  await input.pressSequentially("catx");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed x",
  );
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "Expected Space",
  );
});

test("wrong code newline and tab input have visible glyphs", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode" })
    .getByRole("button", { name: "Code", exact: true })
    .click();
  const input = await focusTyping(page);
  const target = page.getByTestId("typing-target");
  const first = target.locator('[data-slot-index="0"]');
  await input.press("Enter");
  await expect(first).toHaveAttribute("data-typed", "\n");
  await expect(first.locator("[data-typed-glyph]")).toHaveText("↵");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed Enter",
  );
  await input.fill("\t");
  await expect(first.locator("[data-typed-glyph]")).toHaveText("⇥");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed Tab",
  );
});

test("wrong composed input shows the normalized committed letter and counts one attempt", async ({
  page,
}) => {
  const input = await customPractice(page, "école");
  await input.evaluate((element) => {
    const field = element as HTMLTextAreaElement;
    const set = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    field.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    set.call(field, "n");
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "n",
        inputType: "insertCompositionText",
        isComposing: true,
      }),
    );
    set.call(field, "n\u0303");
    field.dispatchEvent(
      new CompositionEvent("compositionend", {
        bubbles: true,
        data: "n\u0303",
      }),
    );
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "n\u0303",
        inputType: "insertCompositionText",
      }),
    );
  });
  await expect(
    page
      .getByTestId("typing-target")
      .locator('[data-slot-index="0"] [data-typed-glyph]'),
  ).toHaveText("ñ");
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed ñ",
  );
  await expect(page.getByTestId("typing-feedback")).toContainText("Expected é");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.metrics.insertionAttempts).toBe(1);
  expect(result.metrics.incorrectAttempts).toBe(1);
  expect(result.finalText).toBe("ñ");
});

test("wrong-key feedback fits mobile and restarting clears the previous input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const input = await customPractice(page, "cat dog");
  await input.pressSequentially("cx");
  await expect(page.getByTestId("typing-feedback")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Restart with new text", exact: true })
    .click();
  await page.getByRole("button", { name: "Start private practice", exact: true }).click();
  await expect(page.getByTestId("typing-target")).toBeVisible();
  await expect(page.getByTestId("typing-feedback")).not.toContainText(
    "You typed x",
  );
  await expect(
    page.getByTestId("typing-target").locator("[data-typed]"),
  ).toHaveCount(0);
});
