import { test, expect } from "@playwright/test";
import { completeCorrectedCat, exportedResult, focusTyping } from "./helpers";
import { mkdir } from "node:fs/promises";
test("results explain both accuracy denominators and replay corrections without rewriting them", async ({
  page,
}, testInfo) => {
  await completeCorrectedCat(page);
  const proof = page.getByRole("region", { name: "Score explanation" });
  await expect(
    proof.getByText(/3 correct ÷ 4 insertion attempts × 100 = 75.0%/),
  ).toBeVisible();
  await expect(
    proof.getByText(/3 correct ÷ 3 processed positions × 100 = 100.0%/),
  ).toBeVisible();
  await proof.getByRole("button", { name: "Inspect session evidence" }).click();
  await expect(
    proof.getByText("Recorded edits reproduce this result", { exact: true }),
  ).toBeVisible();
  const table = proof.getByRole("table", {
    name: "Word by word credited characters",
  });
  await expect(
    table.getByRole("cell", { name: "cat", exact: true }),
  ).toHaveCount(2);
  await proof.getByRole("button", { name: "Replay edits" }).click();
  await proof.getByRole("slider", { name: "Replay position" }).press("End");
  await expect(
    proof.getByLabel("Replayed transcript", { exact: true }),
  ).toHaveText("cat");
  await expect(
    proof.getByText(
      /4 insertion attempts · 1 deletion actions · 75.0% input accuracy/,
    ),
  ).toBeVisible();
  await proof.getByRole("button", { name: "Play replay" }).click();
  await expect(proof.getByRole("button", { name: "Play replay" })).toBeVisible({
    timeout: 3000,
  });
  const result = await exportedResult(page);
  expect(result.metrics.inputAccuracy).toBe(75);
  expect(result.finalText).toBe("cat");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mkdir("audit/accuracy-research-2026-10-15", { recursive: true });
  await page.screenshot({
    path: `audit/accuracy-research-2026-10-15/result-evidence-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("score explanations and replay fit a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await completeCorrectedCat(page);
  const proof = page.getByRole("region", { name: "Score explanation" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await proof.getByRole("button", { name: "Inspect session evidence" }).click();
  await expect(
    proof.getByRole("table", { name: "Word by word credited characters" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await proof.getByRole("button", { name: "Replay edits" }).click();
  await proof.getByRole("slider", { name: "Replay position" }).press("End");
  await expect(
    proof.getByLabel("Replayed transcript", { exact: true }),
  ).toHaveText("cat");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("precision mode rejects errors without erasing their accuracy cost", async ({
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
    .fill("cat");
  await page.getByRole("button", { name: "Start private practice" }).click();
  const input = await focusTyping(page);
  await input.pressSequentially("cx", { delay: 60 });
  await expect(input).toHaveValue("c");
  await input.pressSequentially("at", { delay: 60 });
  await expect(
    page.getByRole("region", { name: "Session results" }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.configuration.rejectIncorrect).toBe(true);
  expect(result.metrics.inputAccuracy).toBe(75);
  expect(result.metrics.finalTextAccuracy).toBe(100);
  expect(result.metrics.incorrectAttempts).toBe(1);
  expect(result.metrics.deletionActions).toBe(0);
  expect(JSON.parse(result.comparisonKey).rejectionPolicy).toBe(true);
});
