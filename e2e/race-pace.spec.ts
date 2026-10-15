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

test("gray bot pace moves while the user is idle without creating user input", async ({
  page,
}, info) => {
  const input = await startBot(page);
  const marker = page.getByTestId("opponent-caret");
  await expect
    .poll(async () => Number(await marker.getAttribute("data-position")))
    .toBeGreaterThan(0);
  await expect(input).toHaveValue("");
  await expect(
    page.getByTestId("typing-target").locator('[data-current="true"]'),
  ).toHaveAttribute("data-slot-index", "0");
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
    path: `audit/race-pace-2026-10-16/bot-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(marker).toHaveCount(0);
  const result = await exportedResult(page);
  expect(result.finalText).toBe("");
  expect(result.events).toHaveLength(0);
  expect(result.metrics.insertionAttempts).toBe(0);
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
    path: `audit/race-pace-2026-10-16/mobile-${info.project.name}.png`,
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
  await startBot(page);
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
