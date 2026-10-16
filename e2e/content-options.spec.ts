import { expect, test } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
});

test("quote lengths create complete passages and repeating retains the exact long passage", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("group", { name: "Test mode", exact: true }).getByRole("button", { name: "Quote", exact: true }).click();
  const lengths = page.getByRole("group", { name: "Quote length", exact: true });
  const target = page.getByTestId("typing-target");
  await expect(lengths.getByRole("button", { name: "Short", exact: true })).toHaveAttribute("aria-pressed", "true");
  const short = (await target.textContent())!;
  await lengths.getByRole("button", { name: "Medium", exact: true }).click();
  const medium = (await target.textContent())!;
  expect(medium.length).toBeGreaterThan(short.length);
  await lengths.getByRole("button", { name: "Long", exact: true }).click();
  const long = (await target.textContent())!;
  expect(long.length).toBeGreaterThan(medium.length);
  const input = await focusTyping(page);
  await input.fill(long);
  await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  const first = await exportedResult(page);
  expect(first.configuration.settings?.quoteLength).toBe("long");
  expect(first.finalText).toBe(long);
  await page.getByRole("button", { name: "Repeat passage", exact: true }).click();
  await expect(target).toHaveText(long);
  await (await focusTyping(page)).fill(long);
  await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  const repeated = await exportedResult(page);
  expect(repeated.configuration.repeatedContent).toBe(true);
  expect(repeated.configuration.settings?.quoteLength).toBe("long");
  expect(repeated.configuration.settings?.contentId).toBe(first.configuration.settings?.contentId);
  expect(repeated.initialTarget).toBe(first.initialTarget);
});

test("the Workman preference persists and feeds both reference keyboard views", async ({ page }) => {
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  const layout = page.getByRole("combobox", { name: "Keyboard layout", exact: true });
  await layout.selectOption("workman");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(layout).toHaveValue("workman");
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("img", { name: /^Workman logical keyboard\./ })).toBeVisible();
  await page.goto("/keyboard-lab", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("combobox", { name: "Reference layout", exact: true })).toHaveValue("workman");
  await expect(page.locator('[data-key-code="KeyW"] > [aria-hidden="true"]')).toHaveText("d");
  await expect(page.locator('[data-key-code="KeyC"] > [aria-hidden="true"]')).toHaveText("m");
});
