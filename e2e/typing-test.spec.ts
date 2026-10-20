import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  completeCorrectedCat,
  customPractice,
  exportedResult,
  focusTyping,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

test("a corrected mistake yields 75% input accuracy and perfect final text once", async ({
  page,
}) => {
  await completeCorrectedCat(page);
  const results = page.getByRole("region", {
    name: "Session results",
    exact: true,
  });
  await expect(
    results.getByText("3 / 4 insertion attempts", { exact: true }),
  ).toBeVisible();
  await expect(results.getByText("75.0%", { exact: true })).toBeVisible();
  await expect(
    results
      .getByText("Final accuracy", { exact: true })
      .locator("..")
      .getByText("100%", { exact: true }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("cat");
  expect(result.metrics.inputAccuracy).toBe(75);
  expect(result.metrics.finalTextAccuracy).toBe(100);
  expect(result.metrics.deletionActions).toBe(1);
  expect(result.events).toHaveLength(5);
  await expect(
    page.getByRole("button", { name: "Next test", exact: true }),
  ).toHaveCount(1);
  const evidenceDirectory = test.info().outputPath();
  await mkdir(evidenceDirectory, { recursive: true });
  const shareDownloadEvent = page.waitForEvent("download");
  await results
    .getByRole("button", { name: "Share image", exact: true })
    .click();
  const shareDownload = await shareDownloadEvent;
  expect(shareDownload.suggestedFilename()).toBe("sparowtype-result.png");
  const sharePath = resolve(evidenceDirectory, "result-share.png");
  await shareDownload.saveAs(sharePath);
  const png = await readFile(sharePath);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.toString("ascii", 12, 16)).toBe("IHDR");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  const axisLabels = results.locator(
    ".recharts-xAxis .recharts-cartesian-axis-tick-value",
  );
  await expect(axisLabels.first()).toBeVisible();
  for (const label of await axisLabels.allTextContents())
    expect(label).toMatch(/^\d+(?:\.\d)?s$/);
  const nextTest = results.getByRole("button", {
    name: "Next test",
    exact: true,
  });
  await nextTest.focus();
  await expect(nextTest).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Skip to content", exact: true }),
  ).not.toBeFocused();
  await page.screenshot({
    path: resolve(evidenceDirectory, "results-desktop.png"),
    fullPage: true,
  });
});

test("a 15 second deadline includes the whole idle period and persists the final cutoff", async ({
  page,
}) => {
  test.setTimeout(30000);
  await page.goto("/");
  const duration = page
    .getByRole("group", { name: "Test duration", exact: true })
    .getByRole("button", { name: "15 seconds", exact: true });
  await duration.click();
  await expect(duration).toHaveAttribute("aria-pressed", "true");
  const target = await page.getByTestId("typing-target").innerText();
  const input = await focusTyping(page);
  await input.pressSequentially(target.slice(0, 10), { delay: 10 });
  await expect(input).toHaveValue(target.slice(0, 10));
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible({ timeout: 18000 });
  const result = await exportedResult(page);
  expect(result.elapsedMs).toBe(15000);
  expect(result.metrics.wpm).toBe(8);
  expect(result.finalText).toBe(target.slice(0, 10));
  expect(result.timeSeries).toHaveLength(15);
  expect(result.timeSeries[14].localWpm).toBe(0);
  expect(result.timeSeries[14].wpm).toBe(result.metrics.wpm);
});

test("code Tab preserves normal focus by default and indents only after opting in", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Code", exact: true })
    .click();
  const indentation = page.getByRole("checkbox", {
    name: "Enable Tab indentation",
    exact: true,
  });
  await expect(indentation).not.toBeChecked();
  let input = await focusTyping(page);
  await input.press("Tab");
  await expect(input).not.toBeFocused();
  await expect(input).toHaveValue("");
  await indentation.check();
  await expect(indentation).toBeChecked();
  input = await focusTyping(page);
  await input.press("Tab");
  await expect(input).toHaveValue("    ");
  await input.press("Shift+Tab");
  await expect(input).not.toBeFocused();
  await input.focus();
  await input.press("ControlOrMeta+A");
  await input.press("Backspace");
  // Code remains freely editable; deleting indentation retains its provenance.
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const indented = await exportedResult(page);
  expect(indented.finalText).toBe("");
  expect(indented.events[0].provenance).toBe("generated");
  expect(indented.assistance).toContain("generated");
  await page.getByRole("button", { name: "Next test", exact: true }).click();
  const nextTarget = await page.getByTestId("typing-target").innerText();
  input = await focusTyping(page);
  await input.fill(nextTarget);
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.configuration.scoringPolicy).toBe("code");
  expect(result.finishReason).toBe("completed");
  expect(result.finalText).toBe(nextTarget);
  expect(result.metrics.correct).toBe(result.metrics.retainedUnits);
  expect(result.metrics.creditedUnits).toBe(result.metrics.correct);
  expect(result.configuration.settings?.tabIndents).toBe(true);
});

test("composition commits one NFC grapheme and ignores intermediate IME changes", async ({
  page,
}) => {
  const input = await customPractice(page, "é");
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    textarea.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    setValue.call(textarea, "e");
    textarea.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: "e",
        isComposing: true,
      }),
    );
    setValue.call(textarea, "e\u0301");
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
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
  const result = await exportedResult(page);
  expect(result.finalText).toBe("é");
  expect(result.metrics.insertionAttempts).toBe(1);
  expect(result.events).toHaveLength(1);
  expect(result.events[0].provenance).toBe("composition");
  expect(result.metrics.inputAccuracy).toBe(100);
});

test("repeat preserves the exact target and creates a new id with repeated-content provenance", async ({
  page,
}) => {
  await completeCorrectedCat(page);
  const first = await exportedResult(page);
  await page
    .getByRole("button", { name: "Repeat passage", exact: true })
    .click();
  await expect(page.getByTestId("typing-target")).toHaveText("cat");
  const input = await focusTyping(page);
  await input.pressSequentially("cat", { delay: 30 });
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
  const second = await exportedResult(page);
  expect(second.clientSessionId).not.toBe(first.clientSessionId);
  expect(second.targetText).toBe(first.targetText);
  expect(second.configuration.repeatedContent).toBe(true);
  expect(second.comparisonKey).not.toBe(first.comparisonKey);
});

test("prompted zen appends target segments and finishes only through the visible action", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Zen", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Zen style", exact: true })
      .getByRole("button", { name: "Prompted practice", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const initialTarget = await page.getByTestId("typing-target").innerText();
  expect(initialTarget.length).toBeGreaterThan(100);
  const input = await focusTyping(page);
  await input.fill(initialTarget);
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(
      async () => (await page.getByTestId("typing-target").innerText()).length,
    )
    .toBeGreaterThan(initialTarget.length);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.configuration.mode).toBe("zen");
  expect(result.configuration.scoringPolicy).toBe("prose");
  expect(result.initialTarget).toBe(initialTarget);
  expect(result.targetText.startsWith(initialTarget)).toBe(true);
  expect(result.issuedTargetSegments.length).toBeGreaterThan(0);
  expect(result.finalText).toBe(initialTarget);
  expect(result.finishReason).toBe("manual");
});

test("free writing has raw speed and no invented target accuracy or credited WPM", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("group", { name: "Test mode", exact: true })
    .getByRole("button", { name: "Zen", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Zen style", exact: true })
    .getByRole("button", { name: "Free writing", exact: true })
    .click();
  const input = await focusTyping(page);
  await input.pressSequentially("Words on a blank page.", { delay: 20 });
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.configuration.scoringPolicy).toBe("free");
  expect(result.targetText).toBe("");
  expect(result.metrics.wpm).toBeNull();
  expect(result.metrics.inputAccuracy).toBeNull();
  expect(result.metrics.finalTextAccuracy).toBeNull();
  expect(result.metrics.rawWpm).toBeGreaterThan(0);
  expect(result.configuration.privacy).toBe("private-custom");
});
