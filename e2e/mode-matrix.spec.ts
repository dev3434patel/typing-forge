import { test, expect } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

for (const mode of [
  "Words",
  "Quote",
  "Code:javascript",
  "Code:typescript",
  "Code:python",
  "Code:rust",
  "Code:sql",
]) {
  test(`finite mode completes and exports exact committed input: ${mode}`, async ({
    page,
  }) => {
    await page.goto("/");
    const [label, language] = mode.split(":");
    await page
      .getByRole("group", { name: "Test mode" })
      .getByRole("button", { name: label, exact: true })
      .click();
    if (language)
      await page
        .getByRole("combobox", { name: "Code language" })
        .selectOption(language);
    if (label === "Words")
      await page
        .getByRole("group", { name: "Word count" })
        .getByRole("button", { name: "25 words", exact: true })
        .click();
    const target = await page.getByTestId("typing-target").innerText();
    expect(target.length).toBeGreaterThan(10);
    const input = await focusTyping(page);
    // Committed-text adapter smoke test, not evidence of physical typing speed.
    await input.fill(target);
    await expect(
      page.getByRole("region", { name: "Session results" }),
    ).toBeVisible();
    const result = await exportedResult(page);
    expect(result.finalText).toBe(target);
    expect(result.metrics.inputAccuracy).toBe(100);
    expect(result.metrics.finalTextAccuracy).toBe(100);
    expect(result.metrics.incorrect).toBe(0);
    expect(result.metrics.extra).toBe(0);
    expect(result.metrics.missed).toBe(0);
    expect(result.finishReason).toBe("completed");
    if (language)
      expect(result.configuration).toMatchObject({
        scoringPolicy: "code",
        codeLanguage: language,
      });
    if (label === "Words") expect(result.configuration.wordCount).toBe(25);
    expect(result.configuration.settings?.contentId).toBeTruthy();
  });
}
