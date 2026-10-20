import { expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { SessionResult } from "../src/lib/typing-core";

export async function settlePageVisuals(page: Page) {
  // Static accessibility readings need the final painted colors, while clocks
  // and infinite caret animations must remain active during the test.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document.getAnimations()
        .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map(animation => animation.finished.catch(() => undefined)),
    );
  });
}

export async function focusTyping(page: Page) {
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeVisible();
  // Desktop starts focused; touch devices retain the explicit keyboard activation.
  if (
    !(await input.evaluate((element) => element === document.activeElement))
  ) {
    await page
      .getByRole("button", { name: /^Click here or tab to start typing/ })
      .click();
  }
  await expect(input).toBeFocused();
  return input;
}
export async function customPractice(page: Page, passage: string) {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Custom", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Custom practice passage", exact: true })
    .fill(passage);
  await page
    .getByRole("button", { name: "Start private practice", exact: true })
    .click();
  return focusTyping(page);
}
export async function exportedResult(page: Page): Promise<SessionResult> {
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await downloadEvent;
  const path = await download.path();
  expect(path).not.toBeNull();
  return JSON.parse(await readFile(path!, "utf8")) as SessionResult;
}
export async function completeCorrectedCat(page: Page) {
  const input = await customPractice(page, "cat");
  await input.pressSequentially("cx", { delay: 70 });
  await input.press("Backspace");
  await input.pressSequentially("at", { delay: 70 });
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
}
