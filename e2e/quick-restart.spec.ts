import { expect, test, type Page } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

async function botPractice(page: Page) {
  await page.goto("/race");
  await page
    .getByRole("combobox", { name: "Difficulty", exact: true })
    .selectOption("pro");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  return focusTyping(page);
}

test("Tab then Enter creates fresh random bot races and resets typing, timer and opponent", async ({
  page,
}) => {
  await page.clock.install();
  const input = await botPractice(page);
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 1000),
  );
  const target = page.getByTestId("typing-target");
  const session = page.getByRole("region", {
    name: "Typing session",
    exact: true,
  });
  const marker = page.getByTestId("opponent-caret");
  const seen = new Set<string>();
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = (await target.textContent())!;
    const id = await session.getAttribute("data-session-id");
    seen.add(before);
    await input.pressSequentially("xx");
    await page.clock.fastForward(5000);
    await expect
      .poll(async () => Number(await marker.getAttribute("data-position")))
      .toBeGreaterThan(0);
    const edited = await target.textContent();
    await input.press("Tab");
    const restart = page.getByRole("button", {
      name: "Restart with new text",
      exact: true,
    });
    await expect(restart).toBeFocused();
    await expect(target).toHaveText(edited!);
    await restart.press("Enter");
    await expect(session).not.toHaveAttribute("data-session-id", id!);
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await expect(target.locator("[data-typed]")).toHaveCount(0);
    await expect(target.locator('[data-current="true"]')).toHaveAttribute(
      "data-slot-index",
      "0",
    );
    await expect(marker).toHaveAttribute("data-position", "0");
    await expect(page.getByTestId("race-pace-legend")).toContainText(
      "Alongside you",
    );
    await expect(
      page.getByText("Pro opponent", { exact: false }),
    ).toBeVisible();
    expect(seen.has((await target.textContent())!)).toBe(false);
    expect(await page.locator(".typing-hud .text-3xl").textContent()).toBe(
      "30s",
    );
  }
  const first = await target
    .locator('[data-slot-index="0"]')
    .getAttribute("data-expected");
  await input.pressSequentially(first!);
  await expect(input).toHaveValue(first!);
  await page.clock.fastForward(1000);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.metrics.insertionAttempts).toBe(1);
  expect(result.events).toHaveLength(1);
  expect(result.configuration.initialTarget).not.toBe([...seen][0]);
});

test("bot results support Tab then Enter for a fresh race at the same difficulty", async ({
  page,
}) => {
  const input = await botPractice(page);
  const before = await page.getByTestId("typing-target").textContent();
  await input.pressSequentially("test");
  await input.press("ControlOrMeta+Enter");
  const results = page.getByRole("region", {
    name: "Session results",
    exact: true,
  });
  await expect(results).toBeFocused();
  await page.keyboard.press("Tab");
  const next = page.getByRole("button", { name: "Next test", exact: true });
  await expect(next).toBeFocused();
  await next.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  await expect(page.getByText("Pro opponent", { exact: false })).toBeVisible();
  await expect(results).toHaveCount(0);
});

test("normal Test results use Tab then Enter for new random words", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
  await page.goto("/");
  const input = await focusTyping(page);
  const before = await page.getByTestId("typing-target").textContent();
  await input.pressSequentially("test");
  await input.press("ControlOrMeta+Enter");
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Next test", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
});

test("Shift+Tab and further Tab navigation keep ordinary bot controls reachable", async ({
  page,
}) => {
  const input = await botPractice(page);
  const target = page.getByTestId("typing-target");
  const before = await target.textContent();
  const id = await page
    .getByRole("region", { name: "Typing session", exact: true })
    .getAttribute("data-session-id");
  await input.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Leave race", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await input.press("Tab");
  await expect(
    page.getByRole("button", { name: "Restart with new text", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", {
      name: "Show accessible text editor",
      exact: true,
    }),
  ).toBeFocused();
  await expect(target).toHaveText(before!);
  await expect(
    page.getByRole("region", { name: "Typing session", exact: true }),
  ).toHaveAttribute("data-session-id", id!);
});

test.describe("touch device with a physical keyboard", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test("keyboard retry restores focus even when the primary pointer is touch", async ({
    page,
  }) => {
    const input = await botPractice(page);
    const before = await page.getByTestId("typing-target").textContent();
    await input.press("Tab");
    await expect(
      page.getByRole("button", { name: "Restart with new text", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await expect(page.getByTestId("typing-target")).not.toHaveText(before!);
  });
});
