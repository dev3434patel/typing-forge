import { expect, test, type Page } from "@playwright/test";
import { customPractice, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

async function expectVisibleCaret(page: Page) {
  await expect
    .poll(async () =>
      page.getByTestId("typing-viewport").evaluate((element) => {
        const viewport = element.getBoundingClientRect();
        const caret = element.querySelector<HTMLElement>(
          ":scope > .forge-caret",
        );
        if (!caret) return false;
        const rect = caret.getBoundingClientRect();
        return (
          rect.top >= viewport.top - 2 &&
          rect.bottom <= viewport.bottom + 2 &&
          rect.left >= viewport.left - 2 &&
          rect.right <= viewport.right + 2
        );
      }),
    )
    .toBe(true);
}

test("desktop starts ready and focused without starting the clock", async ({
  page,
}, info) => {
  await page.goto("/");
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Typing session" }),
  ).toHaveAttribute("data-status", "ready");
  await expect(
    page.getByRole("region", { name: "Test configuration" }),
  ).toBeVisible();
  const dimensions = await page
    .getByTestId("typing-viewport")
    .evaluate((element) => {
      const passage = element.querySelector(".typing-text")!;
      return {
        height: element.clientHeight,
        lineHeight: parseFloat(getComputedStyle(passage).lineHeight),
      };
    });
  expect(Math.abs(dimensions.height - dimensions.lineHeight * 3)).toBeLessThan(
    1,
  );
  await expectVisibleCaret(page);
  await page.screenshot({
    path: `audit/typing-experience-2026-10-16/ready-${info.project.name}.png`,
    fullPage: true,
  });
});

test("Tab then Enter restarts and accepts the first new character", async ({
  page,
}) => {
  await page.goto("/");
  const input = await focusTyping(page);
  const target = page.getByTestId("typing-target");
  const first = await target
    .locator('[data-slot-index="0"]')
    .getAttribute("data-expected");
  await input.pressSequentially(first!);
  const before = await target.textContent();
  await input.press("Tab");
  const restart = page.getByRole("button", { name: "Restart with new text" });
  await expect(restart).toBeFocused();
  await restart.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(target).not.toHaveText(before!);
  const next = await target
    .locator('[data-slot-index="0"]')
    .getAttribute("data-expected");
  await input.pressSequentially(next!);
  await expect(input).toHaveValue(next!);
  await expect(target.locator('[data-slot-index="0"]')).toHaveAttribute(
    "data-status",
    "correct",
  );
});

test("whole-word flow rolls by full lines, resizes and backspaces to the beginning", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 780, height: 900 });
  const text = Array(30).fill("cat dog quiet calm clear focus").join(" ");
  const input = await customPractice(page, text);
  const target = page.getByTestId("typing-target");
  await expect(target).toHaveText(text);
  const allWordsSingleLine = await target
    .locator("[data-typing-word]")
    .evaluateAll((words) =>
      words.every((word) => {
        const chars = Array.from(word.querySelectorAll(".typing-character"));
        return chars.every(
          (char) =>
            Math.abs(
              char.getBoundingClientRect().top -
                chars[0].getBoundingClientRect().top,
            ) < 1,
        );
      }),
    );
  expect(allWordsSingleLine).toBe(true);
  await input.fill(text.slice(0, 210));
  const viewport = page.getByTestId("typing-viewport");
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  const row = await viewport.evaluate(
    (element) =>
      element.scrollTop /
      parseFloat(
        getComputedStyle(element.querySelector(".typing-text")!).lineHeight,
      ),
  );
  expect(Math.abs(row - Math.round(row))).toBeLessThan(0.03);
  await expectVisibleCaret(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectVisibleCaret(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `audit/typing-experience-2026-10-16/flow-mobile-${info.project.name}.png`,
    fullPage: true,
  });
  await input.fill(text.slice(0, 3));
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBe(0);
  await expectVisibleCaret(page);
});

test("sustained typing reuses its layout observer and keeps the caret through resize and deletion", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const receipts = { starts: 0, disconnects: 0 };
    Object.assign(window, { typingObserverReceipts: receipts });
    const NativeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      tracksTyping = false;
      observe(target: Element, options?: ResizeObserverOptions) {
        if (target.getAttribute("data-testid") === "typing-viewport") {
          this.tracksTyping = true;
          receipts.starts++;
        }
        super.observe(target, options);
      }
      disconnect() {
        if (this.tracksTyping) receipts.disconnects++;
        super.disconnect();
      }
    };
  });
  await page.setViewportSize({ width: 780, height: 900 });
  const text = Array(40).fill("cat dog quiet calm clear focus").join(" ");
  const input = await customPractice(page, text);
  const readReceipts = () =>
    page.evaluate(() => ({
      ...(
        window as unknown as {
          typingObserverReceipts: { starts: number; disconnects: number };
        }
      ).typingObserverReceipts,
    }));
  const before = await readReceipts();
  expect(before.starts).toBeGreaterThan(0);
  await input.pressSequentially(text.slice(0, 210), { delay: 5 });
  await expect(input).toHaveValue(text.slice(0, 210));
  await expectVisibleCaret(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectVisibleCaret(page);
  await input.pressSequentially(text.slice(210, 240), { delay: 5 });
  await input.press("Backspace");
  await input.press("Backspace");
  await expect(input).toHaveValue(text.slice(0, 238));
  await expectVisibleCaret(page);
  expect(await readReceipts()).toEqual(before);
  await expect(
    page.getByRole("region", { name: "Typing session", exact: true }),
  ).toHaveAttribute("data-status", "running");
});

test("blur preserves input and refocus resumes the same passage", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog quiet calm");
  await input.pressSequentially("cx");
  const text = await page.getByTestId("typing-target").textContent();
  await page
    .getByRole("button", { name: "Show accessible text editor" })
    .focus();
  await expect(input).not.toBeFocused();
  await page
    .getByRole("button", { name: /^Click here or tab to start typing/ })
    .click();
  await expect(input).toHaveValue("cx");
  await expect(page.getByTestId("typing-target")).toHaveText(text!);
  await input.press("Backspace");
  await input.press("a");
  await expect(input).toHaveValue("ca");
});

test("overtyped letters stay beside their word and move the caret past the extra input", async ({
  page,
}) => {
  const input = await customPractice(page, "cat dog quiet calm");
  await input.pressSequentially("catxx");
  const target = page.getByTestId("typing-target");
  await expect(target.locator("[data-typing-word]").first()).toHaveText(
    "catxx",
  );
  await expect(target.locator('[data-current="true"]')).toHaveAttribute(
    "data-expected",
    " ",
  );
  const positions = await target.evaluate((element) => {
    const extras = element.querySelectorAll('[data-status="extra"]');
    const extra = extras[extras.length - 1].getBoundingClientRect();
    const cursor = element
      .querySelector('[data-current="true"]')!
      .getBoundingClientRect();
    return { extraRight: extra.right, cursorLeft: cursor.left };
  });
  expect(Math.abs(positions.cursorLeft - positions.extraRight)).toBeLessThan(2);
  await input.press("Backspace");
  await expect(target.locator("[data-typing-word]").first()).toHaveText("catx");
});

test("RTL language keeps a measured caret and intact word groups", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("ar");
  const input = await focusTyping(page);
  const target = page.getByTestId("typing-target");
  await expect(page.getByTestId("typing-viewport")).toHaveAttribute(
    "dir",
    "rtl",
  );
  const first = await target
    .locator('[data-slot-index="0"]')
    .getAttribute("data-expected");
  await input.pressSequentially(first!);
  await expect(target.locator('[data-slot-index="0"]')).toHaveAttribute(
    "data-status",
    "correct",
  );
  await expectVisibleCaret(page);
  expect(await target.locator("[data-typing-word]").count()).toBeGreaterThan(1);
});

test("long free writing follows the visible end caret without clipping new input", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode" })
    .getByRole("button", { name: "Zen", exact: true })
    .click();
  await page.getByRole("button", { name: "Free writing", exact: true }).click();
  const input = await focusTyping(page);
  const content = Array(12)
    .fill("A quiet line of original writing.")
    .join("\n");
  await input.fill(content);
  await expect(input).toHaveValue(content);
  await expect
    .poll(() =>
      page
        .getByTestId("typing-viewport")
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await expectVisibleCaret(page);
  await input.press("End");
  await input.pressSequentially(" More.");
  await expect(input).toHaveValue(content + " More.");
  await expectVisibleCaret(page);
});

test("learning keyboard distinguishes the next key from an actual wrong uppercase key", async ({
  page,
}, info) => {
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", { name: "Type the practice text" });
  await expect(input).toBeFocused();
  await input.press("X");
  await expect(page.locator('.learn-keyboard [data-key="x"]')).toHaveClass(
    /learn-key-incorrect/,
  );
  await expect(page.getByTestId("typing-feedback")).toContainText(
    "You typed X",
  );
  await expect(
    page.locator(".learn-keyboard [data-expected-key] "),
  ).toHaveCount(1);
  await page.screenshot({
    path: `audit/typing-experience-2026-10-16/learn-feedback-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Hide keyboard" }).click();
  await expect(page.locator(".learn-keyboard")).toHaveCount(0);
  await page.getByRole("button", { name: "Show keyboard" }).click();
  await expect(page.locator(".learn-keyboard")).toBeVisible();
});

test("a rolled learning lesson keeps its input and Resume control in the visible viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn?language=en");
  const input = page.getByRole("textbox", { name: "Type the practice text" });
  const target = page.locator(".learn-stream-text");
  const content = await target.textContent();
  await input.pressSequentially(
    content!.slice(0, Math.floor(content!.length * 0.7)),
  );
  await expect
    .poll(() =>
      page.locator(".learn-stream").evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const resume = page.getByRole("button", {
    name: "Resume practice",
    exact: true,
  });
  await expect(resume).toBeInViewport();
  await expect(resume).toBeFocused();
  await resume.click();
  await expect(input).toBeFocused();
  const expected = await target
    .locator('[data-current="true"]')
    .getAttribute("data-expected");
  const index = await target
    .locator('[data-current="true"]')
    .getAttribute("data-slot-index");
  await input.pressSequentially(expected!);
  await expect(target.locator(`[data-slot-index="${index}"]`)).toHaveAttribute(
    "data-status",
    "correct",
  );
});

test("learning caret follows extra letters even while the canonical cursor stays on Space", async ({
  page,
}) => {
  await page.goto("/learn?language=en");
  const input = page.getByRole("textbox", { name: "Type the practice text" });
  const target = page.locator(".learn-stream-text");
  const firstWord = (await target.textContent())!.split(" ")[0];
  await input.pressSequentially(firstWord + "xx");
  const cursor = target.locator('[data-current="true"]');
  await expect(cursor).toHaveAttribute("data-expected", " ");
  await input.press("x");
  await expect(target.locator("[data-typing-word]").first()).toHaveText(
    firstWord + "xxx",
  );
  await expect
    .poll(async () =>
      page.locator(".learn-stream").evaluate((element) => {
        const marker = element
          .querySelector('[data-current="true"]')!
          .getBoundingClientRect();
        const caret = element
          .querySelector(".learn-caret")!
          .getBoundingClientRect();
        return Math.abs(caret.left - marker.left);
      }),
    )
    .toBeLessThan(2);
});

test.describe("touch activation", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("touch users choose when to open the typing keyboard", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", {
      name: "Typing input",
      exact: true,
    });
    await expect(input).toBeVisible();
    await expect(input).not.toBeFocused();
    await page
      .getByRole("button", { name: /^Click here or tab to start typing/ })
      .click();
    await expect(input).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
});

test("Escape leaves an active learning composition under IME control", async ({
  page,
}) => {
  await page.goto("/learn?language=en");
  const input = page.getByRole("textbox", { name: "Type the practice text" });
  await expect(input).toBeFocused();
  await input.evaluate((element) =>
    element.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    ),
  );
  await input.press("Escape");
  await expect(input).toBeFocused();
  await input.evaluate((element) =>
    element.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "" }),
    ),
  );
  await expect(page.locator(".learn-stream-text [data-typed]")).toHaveCount(0);
});
