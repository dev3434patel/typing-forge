import { expect, test } from "@playwright/test";
import { customPractice, focusTyping } from "./helpers";
import { THEMES } from "../src/lib/themes";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

test("live keyboard separates held chords, next character and the actual wrong uppercase input", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog");
  const board = page.getByTestId("live-keyboard-board");
  await expect(board).toBeVisible();
  await expect(board.locator('[data-key-code="KeyC"]')).toHaveAttribute(
    "data-expected-key",
    "true",
  );
  await page.keyboard.down("Shift");
  await expect(board.locator('[data-key-code="ShiftLeft"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await page.keyboard.down("X");
  await expect(input).toHaveValue("X");
  await expect(board.locator('[data-key-code="KeyX"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await expect(board.locator('[data-key-code="KeyX"]')).toHaveAttribute(
    "data-incorrect-key",
    "true",
  );
  await expect(board.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "data-expected-key",
    "true",
  );
  await expect(page.getByTestId("keyboard-last-input")).toHaveText(
    "Typed X · expected c",
  );
  await page.keyboard.up("X");
  await expect(board.locator('[data-key-code="KeyX"]')).not.toHaveAttribute(
    "data-pressed-key",
  );
  await expect(board.locator('[data-key-code="ShiftLeft"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await page.keyboard.up("Shift");
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
  // A mistake stays visible as input feedback, independently of key release.
  await expect(board.locator('[data-key-code="KeyX"]')).toHaveAttribute(
    "data-incorrect-key",
    "true",
  );
  await input.press("Backspace");
  await expect(input).toHaveValue("");
  await expect(board.locator("[data-incorrect-key]")).toHaveCount(0);
});

test("held keys clear on focus loss and restart without taking over normal keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  const input = await focusTyping(page);
  const board = page.getByTestId("live-keyboard-board");
  await page.keyboard.down("f");
  await expect(board.locator('[data-key-code="KeyF"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  const guide = page.getByRole("button", { name: "Finger guide", exact: true });
  await guide.focus();
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
  await page.keyboard.up("f");
  await input.focus();
  await page.keyboard.down("a");
  await expect(board.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await page
    .getByRole("button", { name: "Restart with new text", exact: true })
    .click();
  await page.keyboard.up("a");
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByTestId("live-keyboard-board").locator("[data-pressed-key]"),
  ).toHaveCount(0);
  await expect(
    page
      .getByTestId("live-keyboard-board")
      .locator("button, input, [tabindex]"),
  ).toHaveCount(0);
});

test("IME commits and native characters never invent a physical held key", async ({
  page,
}) => {
  const input = await customPractice(page, "calm words");
  await input.evaluate((element) =>
    element.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    ),
  );
  await expect(page.getByTestId("live-keyboard")).toContainText("Composing");
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(textarea, "é");
    textarea.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "é" }),
    );
  });
  await expect(input).toHaveValue("é");
  await expect(page.getByTestId("keyboard-last-input")).toContainText(
    "Typed é",
  );
  await expect(page.getByTestId("keyboard-last-input")).toContainText(
    "composed text",
  );
  await expect(
    page
      .getByTestId("live-keyboard-board")
      .locator("[data-pressed-key], [data-last-input]"),
  ).toHaveCount(0);
  await page.goto("/learn?language=ar&layout=native");
  const native = page.getByTestId("live-keyboard-board");
  await expect(native).toHaveAttribute("data-mapped", "false");
  await expect(native.locator("[data-key-code]")).toHaveCount(0);
  await expect(page.getByTestId("live-keyboard")).toContainText(
    "physical keys are not inferred",
  );
});

test("keyboard visibility and finger preferences persist across Test, Learn and Settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Finger guide", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Finger guide", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Hide keyboard", exact: true })
    .click();
  await expect(page.getByTestId("live-keyboard-board")).toHaveCount(0);
  await page.goto("/learn");
  await expect(
    page.getByRole("button", { name: "Show keyboard", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show keyboard", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Finger guide", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.getByTestId("live-keyboard-board")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finger guide", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.goto("/settings");
  await expect(
    page.getByRole("checkbox", { name: "Live keyboard", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Finger guide", exact: true }),
  ).not.toBeChecked();
});

test("adaptive lessons show actual presses and mastery overlays through repeated input", async ({
  page,
}) => {
  await page.goto("/learn?language=en&layout=dvorak");
  const input = page.getByRole("textbox", {
    name: "Type the practice text",
    exact: true,
  });
  await input.focus();
  const board = page.getByTestId("live-keyboard-board");
  await expect(board).toHaveAccessibleName(/^Dvorak logical keyboard\./);
  await expect(board.locator("[data-locked]")).not.toHaveCount(0);
  await page.keyboard.down("a");
  await page.keyboard.down("a");
  await expect(board.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(2);
  await page.keyboard.up("a");
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
  await expect(page.getByTestId("keyboard-last-input")).toContainText(
    "Typed a",
  );
  await input.press("Backspace");
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(1);
});

test("race practice shares the same input keyboard without treating bot pace as a held user key", async ({
  page,
}) => {
  await page.goto("/race");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  const input = await focusTyping(page);
  const board = page.getByTestId("live-keyboard-board");
  await expect(board).toBeVisible();
  await expect(page.getByTestId("opponent-caret")).toHaveCount(1);
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
  await page.keyboard.down("r");
  await expect(board.locator('[data-key-code="KeyR"]')).toHaveAttribute(
    "data-pressed-key",
    "true",
  );
  await page.keyboard.up("r");
  await expect(input).toHaveValue("r");
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
});

test("five-row keyboard fits 320px and its key text stays readable across every theme", async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 320, height: 740 });
  const receipts: unknown[] = [];
  for (const theme of THEMES) {
    await page.goto("/settings");
    await page.getByRole("button", { name: theme.name, exact: false }).click();
    const typingInput = await customPractice(page, "1 calm words");
    const board = page.getByTestId("live-keyboard-board");
    await expect(board).toBeVisible();
    const receipt = await board.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const keys = Array.from(
        element.querySelectorAll<HTMLElement>("[data-key-code]"),
      );
      const sample = getComputedStyle(
        keys.find((key) => key.dataset.keyCode === "KeyA")!,
      );
      const luminance = (color: string) =>
        (color.match(/[\d.]+/g) || [])
          .slice(0, 3)
          .map(Number)
          .map((value) => {
            const n = value / 255;
            return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
          })
          .reduce(
            (total, value, index) =>
              total + value * [0.2126, 0.7152, 0.0722][index],
            0,
          );
      const light = luminance(sample.color),
        background = luminance(sample.backgroundColor);
      return {
        rows: element.querySelectorAll(".live-keyboard-row").length,
        keys: keys.length,
        fits: keys.every((key) => {
          const r = key.getBoundingClientRect();
          return r.left >= bounds.left - 1 && r.right <= bounds.right + 1;
        }),
        documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
        contrast:
          (Math.max(light, background) + 0.05) /
          (Math.min(light, background) + 0.05),
      };
    });
    expect(receipt).toMatchObject({
      rows: 5,
      keys: 61,
      fits: true,
      documentFits: true,
    });
    expect(receipt.contrast, theme.name).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.down("1");
    await expect(typingInput).toHaveValue("1");
    const heldContrast = await board
      .locator('[data-key-code="Digit1"]')
      .evaluate((element) => {
        const key = getComputedStyle(element);
        const alternate = getComputedStyle(
          element.querySelector(".live-key-alternate")!,
        );
        const luminance = (color: string) =>
          (color.match(/[\d.]+/g) || [])
            .slice(0, 3)
            .map(Number)
            .map((value) => {
              const n = value / 255;
              return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (total, value, index) =>
                total + value * [0.2126, 0.7152, 0.0722][index],
              0,
            );
        const background = luminance(key.backgroundColor);
        return [key.color, alternate.color].map((color) => {
          const text = luminance(color);
          return (
            (Math.max(text, background) + 0.05) /
            (Math.min(text, background) + 0.05)
          );
        });
      });
    await page.keyboard.up("1");
    expect(
      Math.min(...heldContrast),
      `${theme.name}: held main and alternate glyphs`,
    ).toBeGreaterThanOrEqual(4.5);
    receipts.push({ theme: theme.id, ...receipt, heldContrast });
  }
  await info.attach("live-keyboard-mobile-themes", {
    contentType: "application/json",
    body: JSON.stringify(receipts),
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const input = await focusTyping(page);
  await input.focus();
  await page.keyboard.down("a");
  const motion = await page
    .getByTestId("live-keyboard-board")
    .locator('[data-key-code="KeyA"]')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        durations: style.transitionDuration
          .split(",")
          .map((duration) => Number.parseFloat(duration)),
        transform: style.transform,
      };
    });
  expect(Math.max(...motion.durations)).toBeLessThanOrEqual(0.00001);
  expect(motion.transform).toBe("none");
  await page.keyboard.up("a");
});
