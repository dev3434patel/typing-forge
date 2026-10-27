import { expect, test, type Page } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

async function startBot(page: Page) {
  await page.goto("/race");
  await page
    .getByRole("combobox", { name: "Difficulty", exact: true })
    .selectOption("pro");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  const input = await focusTyping(page);
  await expect(page.getByTestId("opponent-caret")).toHaveCount(1);
  return input;
}

test("a stationary measured bot point skips correct-input layout reads and recaptures edits and font changes", async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    localStorage.setItem("typingforge:v3:guest:preferences", JSON.stringify({
      schemaVersion: 3, values: { smoothCaret: false, reducedMotion: true },
    }));
  });
  await page.setViewportSize({ width: 1024, height: 900 });
  const input = await startBot(page);
  const target = page.getByTestId("typing-target"), marker = page.getByTestId("opponent-caret");
  const text = await target.locator("[data-slot-index][data-expected]").evaluateAll(elements => elements
    .sort((left, right) => Number((left as HTMLElement).dataset.slotIndex) - Number((right as HTMLElement).dataset.slotIndex))
    .map(element => (element as HTMLElement).dataset.expected).join(""));
  const prefix = text.slice(0, 24);
  await input.press(prefix[0]);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const target = document.querySelector('[data-testid="typing-target"]')!;
    const native = Element.prototype.getBoundingClientRect;
    const reads: number[] = [];
    const baseline = Number(document.querySelector('[data-testid="opponent-caret"]')!.getAttribute("data-position"));
    Element.prototype.getBoundingClientRect = function () {
      if (this.hasAttribute("data-slot-index") && target.contains(this)) {
        const position = Number(document.querySelector('[data-testid="opponent-caret"]')!.getAttribute("data-position"));
        if (Number(this.getAttribute("data-slot-index")) === position) reads.push(position);
      }
      return native.call(this);
    };
    Object.assign(window, { opponentPointReads: { native, baseline, reads } });
  });
  let observation: { baseline: number; reads: number[] };
  try {
    await input.pressSequentially(prefix.slice(1));
  } finally {
    observation = await page.evaluate(() => {
      const value = (window as Window & { opponentPointReads: {
        native: typeof Element.prototype.getBoundingClientRect; baseline: number; reads: number[];
      } }).opponentPointReads;
      Element.prototype.getBoundingClientRect = value.native;
      return { baseline: value.baseline, reads: value.reads };
    });
  }
  await expect(input).toHaveValue(prefix);
  let previous = observation.baseline;
  for (const position of observation.reads) {
    expect(position, "A stable rival point must not be measured again for a correct player insertion.").not.toBe(previous);
    previous = position;
  }
  async function aligned() {
    await expect.poll(() => marker.evaluate(element => {
      const viewport = element.parentElement!, position = element.getAttribute("data-position");
      const slot = viewport.querySelector<HTMLElement>(`.typing-text [data-slot-index="${position}"][data-expected]`)
        ?? viewport.querySelector<HTMLElement>("[data-opponent-end-anchor]");
      if (!slot) return false;
      const point = element.getBoundingClientRect(), expected = slot.getBoundingClientRect();
      return Math.abs(point.left - expected.left) <= 1 && Math.abs(point.top - expected.top) <= 1;
    })).toBe(true);
  }
  const wrong = text[prefix.length] === "x" ? "z" : "x";
  await input.press(wrong);
  await expect(input).toHaveValue(prefix + wrong);
  await aligned();
  await input.press("Backspace");
  await expect(input).toHaveValue(prefix);
  await aligned();
  await page.evaluate(() => document.documentElement.style.setProperty("--font-mono", "serif"));
  await aligned();
  await page.setViewportSize({ width: 390, height: 844 });
  await aligned();
  await page.setViewportSize({ width: 844, height: 390 });
  await aligned();
  expect(await marker.evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(197, 199, 205)");
  await info.attach("opponent-native-point-reuse", {
    contentType: "application/json", body: JSON.stringify({ ...observation, typedPrefixCharacters: prefix.length,
      scope: "Real bot movement remains enabled. Native reads are allowed on each changed bot position; repeated reads of a stationary point during correct-prefix input are rejected. Edit/font/rotation geometry is checked separately." }),
  });
});

test("gray bot pace starts with the first native letter and then moves without creating more user input", async ({
  page,
}, info) => {
  const input = await startBot(page);
  const marker = page.getByTestId("opponent-caret");
  const first = await page.getByTestId("typing-target").locator('[data-current="true"]').getAttribute("data-expected");
  expect(first).toMatch(/^[a-z]$/);
  await input.pressSequentially(first!);
  await expect
    .poll(async () => Number(await marker.getAttribute("data-position")))
    .toBeGreaterThan(0);
  await expect(input).toHaveValue(first!);
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-slot-index", "1");
  await expect(
    page.getByTestId("typing-target").locator(".opponent-passed").first(),
  ).toBeVisible();
  await expect(page.getByTestId("race-pace-legend")).toContainText("Bot pace");
  await expect(page.getByTestId("race-pace-legend")).toContainText("ahead");
  expect(
    await marker.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(197, 199, 205)");
  expect(
    await page
      .getByTestId("typing-viewport")
      .evaluate((element) => element.scrollTop),
  ).toBe(0);
  await page.screenshot({
    path: test.info().outputPath(`bot-${info.project.name}.png`),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(marker).toHaveCount(0);
  const result = await exportedResult(page);
  expect(result.finalText).toBe(first);
  expect(result.events).toHaveLength(1);
  expect(result.metrics.insertionAttempts).toBe(1);
});

test("opponent progress does not scroll away from a leading user or recolor their mistakes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const input = await startBot(page);
  const target = page.getByTestId("typing-target");
  const text = await target.textContent();
  const cut = text!.indexOf(" ", 210);
  await input.fill(text!.slice(0, cut + 1));
  const current = target.locator('[data-current="true"]');
  const expected = await current.getAttribute("data-expected");
  const wrong = expected === "x" ? "z" : "x";
  const index = await current.getAttribute("data-slot-index");
  await input.pressSequentially(wrong);
  const wrongSlot = target.locator(`[data-slot-index="${index}"]`);
  await expect(wrongSlot).toHaveAttribute("data-status", "incorrect");
  await expect(wrongSlot).not.toHaveClass(/opponent-passed/);
  await expect(page.getByTestId("race-pace-legend")).toContainText("behind");
  await expect
    .poll(() =>
      page
        .getByTestId("typing-viewport")
        .evaluate((element) => element.scrollTop),
    )
    .toBeGreaterThan(0);
  await expect(page.getByTestId("opponent-caret")).toHaveAttribute(
    "data-in-view",
    "false",
  );
  await expect
    .poll(() =>
      page.getByTestId("typing-viewport").evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const caret = element
          .querySelector<HTMLElement>(":scope > .forge-caret")!
          .getBoundingClientRect();
        return caret.top >= bounds.top - 1 && caret.bottom <= bounds.bottom + 1;
      }),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath(`mobile-${info.project.name}.png`),
    fullPage: true,
  });
  await input.press("Backspace");
  await expect(wrongSlot).not.toHaveAttribute("data-status", "incorrect");
});

test("light-theme pace remains visible and resizes without leaving a marker in normal practice", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Aa bb Paper", exact: true }).click();
  const input = await startBot(page);
  const first = await page.getByTestId("typing-target").locator('[data-current="true"]').getAttribute("data-expected");
  await input.pressSequentially(first!);
  const marker = page.getByTestId("opponent-caret");
  await expect
    .poll(async () => Number(await marker.getAttribute("data-position")))
    .toBeGreaterThan(0);
  expect(
    await marker.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(98, 101, 109)");
  await page.setViewportSize({ width: 540, height: 820 });
  await expect(marker).toHaveAttribute("data-in-view", "true");
  await page.getByRole("button", { name: "Leave race", exact: true }).click();
  await expect(page.getByTestId("opponent-caret")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start bot practice", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: "Test", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("opponent-caret")).toHaveCount(0);
  await expect(page.getByTestId("race-pace-legend")).toHaveCount(0);
});
