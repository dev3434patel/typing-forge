import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
  await page.goto("/games");
});

test("a stale tab completion does not overwrite a better persisted local best", async ({
  page,
}) => {
  await page.clock.install();
  const input = await start(page, true);
  await input.pressSequentially(await target(page));
  await input.press("Enter");
  // Simulate another tab persisting a stronger result after this game mounted.
  // No storage event is delivered here: completion must re-read the actual key.
  await page.evaluate(() =>
    localStorage.setItem(
      "sparowtype.signal-run.v1:guest",
      JSON.stringify({
        paced: {
          version: "signal-run-v1",
          mode: "paced",
          gates: 16,
          cleanGates: 14,
          accuracy: 97,
          elapsedMs: 60_000,
          paused: false,
        },
      }),
    ),
  );
  await page.clock.fastForward(60_001);
  await expect(page.getByTestId("game-result")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Local game best" }),
  ).toContainText("16 / 18 gates");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("sparowtype.signal-run.v1:guest")!)
          .paced.gates,
    ),
  ).toBe(16);
});

test("game bests observe another tab’s update and clear without affecting the active word", async ({
  page,
}) => {
  const input = await start(page);
  await input.press("x");
  await page.evaluate(() => {
    const key = "sparowtype.signal-run.v1:guest";
    const newValue = JSON.stringify({
      calm: {
        version: "signal-run-v1",
        mode: "calm",
        gates: 18,
        cleanGates: 17,
        accuracy: 99,
        elapsedMs: 40_000,
        paused: false,
      },
    });
    localStorage.setItem(key, newValue);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  });
  await expect(
    page.getByRole("region", { name: "Local game best" }),
  ).toContainText("18 / 18 gates");
  await expect(input).toHaveValue("x");
  await page.evaluate(() => {
    const key = "sparowtype.signal-run.v1:guest";
    localStorage.removeItem(key);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: null }));
  });
  await expect(
    page.getByRole("region", { name: "Local game best" }),
  ).toContainText("first local best");
  await expect(input).toHaveValue("x");
});

async function start(page: Page, paced = false) {
  if (paced)
    await page
      .getByRole("button", { name: "60-second run", exact: true })
      .click();
  await page
    .getByRole("button", {
      name: paced ? "Start 60-second run" : "Start calm journey",
      exact: true,
    })
    .click();
  const input = page.getByRole("textbox", { name: "Your word", exact: true });
  await expect(input).toBeFocused();
  return input;
}

async function target(page: Page) {
  return (await page
    .getByTestId("game-target")
    .getAttribute("aria-label"))!.replace("Target word: ", "");
}

test("preparing a paced run, focus, modifiers and pre-typing resume do not spend its minute", async ({ page }) => {
  await page.clock.install();
  const input = await start(page, true);
  await input.press("Shift");
  await input.press("Backspace");
  await page.clock.fastForward(90_000);
  await expect(page.getByText("60s", { exact: true })).toBeVisible();
  await expect(page.getByTestId("signal-run")).toHaveAttribute("data-phase", "playing");
  await expect(page.getByTestId("game-accuracy")).toHaveText("—");
  await input.press("Escape");
  await page.clock.fastForward(90_000);
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await page.clock.fastForward(90_000);
  await expect(page.getByText("60s", { exact: true })).toBeVisible();
  // Even an incorrect first character starts a real attempt and the full minute.
  const first = (await target(page))[0];
  await input.press(first === "x" ? "z" : "x");
  await expect(page.getByTestId("game-accuracy")).toHaveText("0.0%");
  await page.clock.fastForward(1000);
  await expect(page.getByText("59s", { exact: true })).toBeVisible();
  await page.clock.fastForward(59_001);
  await expect(page.getByTestId("game-result")).toBeVisible();
  await expect(page.getByTestId("game-attempt-evidence")).toContainText("0 / 1 correct character attempts");
  await expect(page.getByTestId("game-result")).toContainText("Active time 60.0s");
});

test("calm game starts deliberately, opens word gates and moves through all three stages", async ({
  page,
}) => {
  await expect(page.getByTestId("signal-run")).toHaveAttribute(
    "data-phase",
    "ready",
  );
  await expect(page.getByTestId("game-accuracy")).toHaveText("—");
  await expect(page.getByText("No timer", { exact: true })).toBeVisible();
  const input = await start(page);
  let characters = 0;
  for (let gate = 0; gate < 18; gate++) {
    const word = await target(page);
    characters += word.length;
    await input.pressSequentially(word);
    await expect(page.getByTestId("game-gates")).toHaveText(`${gate} / 18`);
    await input.press("Enter");
    if (gate < 17) await expect(input).toHaveValue("");
  }
  await expect(page.getByTestId("signal-run")).toHaveAttribute(
    "data-phase",
    "complete",
  );
  await expect(page.getByTestId("game-result")).toContainText(
    "Every gate. One clear signal.",
  );
  await expect(page.getByTestId("game-attempt-evidence")).toContainText(
    `${characters} / ${characters} correct character attempts`,
  );
  const record = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sparowtype.signal-run.v1:guest")!),
  );
  expect(record.calm).toMatchObject({
    gates: 18,
    cleanGates: 18,
    accuracy: 100,
  });
  expect(record.calm).not.toHaveProperty("draft");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Local game best" }),
  ).toContainText("18 / 18 gates");
  await page
    .getByRole("button", { name: "60-second run", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Local game best" }),
  ).toContainText("first local best");
  await page
    .getByRole("button", { name: "Clear game bests", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sparowtype.signal-run.v1:guest"),
    ),
  ).toBeNull();
});

test("corrected mistakes remain in the game’s attempt accuracy and clean-gate evidence", async ({
  page,
}) => {
  const input = await start(page);
  const word = await target(page);
  await input.press("x");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.press("Backspace");
  await input.pressSequentially(word);
  await input.press("Enter");
  await page.getByRole("button", { name: "End run", exact: true }).click();
  await expect(page.getByTestId("game-attempt-evidence")).toContainText(
    `${word.length} / ${word.length + 1} correct character attempts · 1 deleted`,
  );
  await expect(page.getByTestId("game-result")).toContainText("0 clean gates");
  await expect(page.getByTestId("game-accuracy")).toHaveText(
    `${((word.length / (word.length + 1)) * 100).toFixed(1)}%`,
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sparowtype.signal-run.v1:guest"),
    ),
  ).toBeNull();
});

test("pause preserves the current word, resume restores input and restart clears run evidence", async ({
  page,
}) => {
  const input = await start(page, true);
  const first = (await target(page))[0];
  await input.press(first);
  await input.press("Escape");
  await expect(page.getByTestId("signal-run")).toHaveAttribute(
    "data-phase",
    "paused",
  );
  await expect(input).toHaveValue(first);
  await expect(input).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Resume game", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(first);
  await page.getByRole("button", { name: "Restart game", exact: true }).click();
  await expect(page.getByTestId("signal-run")).toHaveAttribute(
    "data-phase",
    "ready",
  );
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("game-accuracy")).toHaveText("—");
});

test("paced mode uses the active deadline, including an idle interval, without invented attempts", async ({
  page,
}) => {
  await page.clock.install();
  const input = await start(page, true);
  await input.pressSequentially(await target(page));
  await input.press("Enter");
  await page.clock.fastForward(60_001);
  await expect(page.getByTestId("game-result")).toBeVisible();
  await expect(page.getByTestId("game-gates")).toHaveText("1 / 18");
  const record = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("sparowtype.signal-run.v1:guest")!),
  );
  expect(record.paced).toMatchObject({
    gates: 1,
    cleanGates: 1,
    elapsedMs: 60_000,
  });
});

test("IME provisional text is not scored and its committed input echo is not counted twice", async ({
  page,
}) => {
  const input = await start(page);
  const word = await target(page);
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    field.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    set.call(field, text.slice(0, 2));
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: text.slice(0, 2),
        isComposing: true,
      }),
    );
  }, word);
  await expect(page.getByTestId("game-accuracy")).toHaveText("—");
  await input.evaluate((element, text) => {
    const field = element as HTMLInputElement;
    const set = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    set.call(field, text);
    field.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: text }),
    );
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertFromComposition",
        data: text,
      }),
    );
  }, word);
  await expect(page.getByTestId("game-accuracy")).toHaveText("100.0%");
  await input.press("Enter");
  await page.getByRole("button", { name: "End run", exact: true }).click();
  await expect(page.getByTestId("game-attempt-evidence")).toContainText(
    `${word.length} / ${word.length} correct character attempts`,
  );
});

test("same-value native replacement still records another wrong character attempt", async ({
  page,
}) => {
  const input = await start(page);
  await input.press("x");
  await input.evaluate((element) => {
    const field = element as HTMLInputElement;
    field.setSelectionRange(0, 1);
    field.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: "x",
      }),
    );
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: "x",
      }),
    );
  });
  await page.getByRole("button", { name: "End run", exact: true }).click();
  await expect(page.getByTestId("game-attempt-evidence")).toContainText(
    "0 / 2 correct character attempts",
  );
});

test("mobile reduced-motion layout has native input, visible controls and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const input = await start(page);
  await expect(input).toBeVisible();
  expect(
    await page
      .locator(".signal-gate-entry")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const button of [
    page.getByRole("button", { name: "Open gate", exact: true }),
    page.getByRole("button", { name: "Pause", exact: true }),
  ]) {
    const size = await button.boundingBox();
    expect(size!.height).toBeGreaterThanOrEqual(44);
  }
  await input.pressSequentially(await target(page));
  await page.getByRole("button", { name: "Open gate", exact: true }).click();
  await expect(page.getByTestId("game-gates")).toHaveText("1 / 18");
});
