import { expect, test } from "@playwright/test";
import { customPractice, exportedResult } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
});

test("native physical feedback is present in the same target event before React root bubbling", async ({ page }) => {
  const input = await customPractice(page, "cat dog");
  await input.press("c"); // Establish Caps Lock observation before a physical-only chord.
  await input.evaluate(element => {
    const snapshots: Array<{ type: string; code: string; f: boolean; j: boolean }> = [];
    const beforeDefault = (event: Event) => {
      if (["KeyF", "KeyJ"].includes((event as KeyboardEvent).code)) event.preventDefault();
    };
    const sample = (event: Event) => {
      const key = event as KeyboardEvent;
      if (!["KeyF", "KeyJ"].includes(key.code)) return;
      const board = document.querySelector('[data-testid="live-keyboard-board"]')!;
      snapshots.push({ type: key.type, code: key.code,
        f: board.querySelector('[data-key-code="KeyF"]')!.getAttribute("data-pressed-key") === "true",
        j: board.querySelector('[data-key-code="KeyJ"]')!.getAttribute("data-pressed-key") === "true" });
    };
    // Added after the actual input-local guide observer; no IPC or paint wait
    // can conceal deferred React-only handling of a physical key transition.
    element.addEventListener("keydown", beforeDefault, true);
    element.addEventListener("keydown", sample);
    element.addEventListener("keyup", sample);
    Object.assign(window, { physicalAttributeProbe: { element, snapshots, beforeDefault, sample } });
  });
  try {
    await page.keyboard.down("f");
    await page.keyboard.down("j");
    await page.keyboard.up("f");
    await page.keyboard.up("j");
    const snapshots = await page.evaluate(() => (window as Window & { physicalAttributeProbe: { snapshots: unknown[] } }).physicalAttributeProbe.snapshots);
    expect(snapshots).toEqual([
      { type: "keydown", code: "KeyF", f: true, j: false },
      { type: "keydown", code: "KeyJ", f: true, j: true },
      { type: "keyup", code: "KeyF", f: false, j: true },
      { type: "keyup", code: "KeyJ", f: false, j: false },
    ]);
    await expect(input).toHaveValue("c");
    await expect(page.getByTestId("live-keyboard-board").locator("[data-pressed-key]")).toHaveCount(0);
  } finally {
    await page.evaluate(() => {
      const probe = (window as Window & { physicalAttributeProbe: { element: Element; beforeDefault: EventListener; sample: EventListener } }).physicalAttributeProbe;
      probe.element.removeEventListener("keydown", probe.beforeDefault, true);
      probe.element.removeEventListener("keydown", probe.sample);
      probe.element.removeEventListener("keyup", probe.sample);
    });
  }
  await input.pressSequentially("at dog");
  const result = await exportedResult(page);
  expect(result.finalText).toBe("cat dog");
  expect(result.metrics.insertionAttempts).toBe(7);
  expect(result.metrics.inputAccuracy).toBe(100);
});

test("held attributes survive canonical corrections and clear on blur and restart", async ({ page }) => {
  const input = await customPractice(page, "cat dog");
  const board = page.getByTestId("live-keyboard-board");
  const x = board.locator('[data-key-code="KeyX"]');
  await page.keyboard.down("x");
  await expect(input).toHaveValue("x");
  await expect(x).toHaveAttribute("data-pressed-key", "true");
  await expect(x).toHaveAttribute("data-incorrect-key", "true");
  await input.press("Backspace");
  await expect(input).toHaveValue("");
  await expect(x).toHaveAttribute("data-pressed-key", "true");
  await expect(x).not.toHaveAttribute("data-incorrect-key");
  await page.keyboard.down("c");
  await expect(input).toHaveValue("c");
  await expect(board.locator('[data-key-code="KeyC"]')).toHaveAttribute("data-last-input", "true");
  await expect(x).toHaveAttribute("data-pressed-key", "true");
  await page.keyboard.up("c");
  await page.getByRole("button", { name: "Finger guide", exact: true }).focus();
  await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
  await page.keyboard.up("x");
  await input.focus();
  await page.keyboard.down("a");
  await expect(input).toHaveValue("ca");
  await expect(board.locator('[data-key-code="KeyA"]')).toHaveAttribute("data-pressed-key", "true");
  await page.getByRole("button", { name: "Restart with new text", exact: true }).click();
  await page.keyboard.up("a");
  // Custom restart returns to the retained passage editor before a new run.
  await expect(page.getByRole("textbox", { name: "Custom practice passage", exact: true })).toHaveValue("cat dog");
  await page.getByRole("button", { name: "Start private practice", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Typing input", exact: true })).toHaveValue("");
  await expect(page.getByTestId("live-keyboard-board").locator("[data-pressed-key]")).toHaveCount(0);
});
