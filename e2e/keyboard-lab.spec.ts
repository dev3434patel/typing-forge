import { expect, test } from "@playwright/test";

test("manual signals are focus-scoped; Tab, Shift+Tab and Escape leave normally", async ({ page }, testInfo) => {
  await page.goto("/keyboard-lab");
  const input = page.getByRole("textbox", {
    name: "Keyboard signal check",
    exact: true,
  });
  await expect(
    page.getByRole("heading", { name: "Know your input. Find your rhythm." }),
  ).toBeVisible();
  await input.focus();
  await page.keyboard.down("a");
  await expect(page.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "title",
    /pressed; 1 presses, 0 keyup events/,
  );
  await page.keyboard.up("a");
  await expect(page.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "title",
    /1 presses, 1 keyup events/,
  );
  await input.press("Tab");
  await expect(input).not.toBeFocused();
  // Native tab order may also include a scroll region; either is a valid exit.
  await page
    .getByRole("heading", { name: "Your key signals", exact: true })
    .click();
  const observedAfterTab = await page
    .getByTestId("lab-key-count")
    .textContent();
  await page.keyboard.press("x");
  await expect(page.getByTestId("lab-key-count")).toHaveText(observedAfterTab!);
  await input.focus();
  await input.press("Shift+Tab");
  await expect(input).not.toBeFocused();
  await input.focus();
  await input.press("Escape");
  await expect(input).not.toBeFocused();
  await expect(
    page.getByRole("status").filter({ hasText: "Paused · focus" }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath(`keyboard-lab-${testInfo.project.name}.png`), fullPage: true });
});

test("browser layout access happens only after an explicit request and never changes preferences automatically", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { keyboardLabCalls: 0 });
    Object.defineProperty(navigator, "keyboard", {
      configurable: true,
      value: {
        getLayoutMap: async () => {
          (window as unknown as { keyboardLabCalls: number })
            .keyboardLabCalls++;
          return new Map([
            ["KeyQ", "a"],
            ["KeyW", "z"],
            ["KeyA", "q"],
            ["KeyZ", "w"],
            ["KeyS", "s"],
            ["KeyD", "d"],
          ]);
        },
      },
    });
  });
  await page.goto("/keyboard-lab");
  const layout = page.getByLabel("Reference layout", { exact: true });
  await expect(layout).toHaveValue("qwerty");
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { keyboardLabCalls: number }).keyboardLabCalls,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Read browser layout", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Browser map available: 6 mappings." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { keyboardLabCalls: number }).keyboardLabCalls,
    ),
  ).toBe(1);
  await expect(layout).toHaveValue("qwerty");
  await expect(page.getByTestId("layout-agreement")).toContainText(
    "Differences may come from a locale variant",
  );
  await layout.selectOption("azerty");
  await expect(page.getByTestId("layout-agreement")).toContainText("6 of 6");
  const storedBefore = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("typingforge:v3:guest:preferences") || "{}",
      ).values?.layout ?? "qwerty",
  );
  expect(storedBefore).toBe("qwerty");
  await page
    .getByRole("button", { name: "Use this practice layout", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Practice layout set to AZERTY." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("typingforge:v3:guest:preferences") || "{}",
        ).values?.layout,
    ),
  ).toBe("azerty");
});

for (const capability of ["unsupported", "blocked"] as const) {
  test(`${capability} browser mapping has a working manual fallback`, async ({
    page,
  }) => {
    await page.addInitScript((capability) => {
      Object.defineProperty(navigator, "keyboard", {
        configurable: true,
        value:
          capability === "unsupported"
            ? undefined
            : {
                getLayoutMap: async () => {
                  throw new DOMException("Blocked by policy", "SecurityError");
                },
              },
      });
    }, capability);
    await page.goto("/keyboard-lab");
    await page
      .getByRole("button", { name: "Read browser layout", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({
        hasText:
          capability === "unsupported"
            ? "does not expose a layout map"
            : "blocked layout access",
      }),
    ).toBeVisible();
    const input = page.getByRole("textbox", {
      name: "Keyboard signal check",
      exact: true,
    });
    await input.pressSequentially("asdfgh", { delay: 20 });
    await expect(page.getByTestId("lab-key-count")).toHaveText("6");
    await expect(page.getByTestId("layout-agreement")).toContainText("6 of 6");
  });
}

test("repeated transitions produce a measured pair drill and targeted learning link", async ({
  page,
}) => {
  await page.goto("/keyboard-lab");
  const input = page.getByRole("textbox", {
    name: "Transition practice input",
    exact: true,
  });
  await input.pressSequentially("abababab", { delay: 35 });
  const pair = page.getByRole("row").filter({ hasText: "a → b" });
  await expect(pair).toContainText("4");
  await expect(pair).toContainText("ms");
  await page
    .getByRole("button", { name: "Practice a to b", exact: true })
    .click();
  await expect(page.getByTestId("transition-drill")).toHaveText(
    "ab ab ba aba ab ba ab",
  );
  const learn = page.getByRole("link", {
    name: "Continue in Learn",
    exact: true,
  });
  await expect(learn).toHaveAttribute("href", /keys=ab/);
  const before = await page.evaluate(() =>
    localStorage.getItem("typingforge:v3:guest:learning"),
  );
  expect(before).toBeNull();
  await learn.click();
  await expect(
    page.getByRole("heading", { name: "Make every key feel natural." }),
  ).toBeVisible();
});

test("composition and repeat signals never create invented pair timings; blur clears held state", async ({
  page,
}) => {
  await page.goto("/keyboard-lab");
  const input = page.getByRole("textbox", {
    name: "Keyboard signal check",
    exact: true,
  });
  await input.focus();
  await input.evaluate((element) => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, code: "KeyA", key: "a" }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyA",
        key: "a",
        repeat: true,
      }),
    );
    element.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true, data: "" }),
    );
    element.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "KeyB",
        key: "Process",
        isComposing: true,
      }),
    );
    element.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true, data: "क" }),
    );
  });
  await expect(
    page.getByText("No eligible transitions yet.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Repeat events excluded", { exact: true }).locator(".."),
  ).toContainText("1");
  await expect(
    page
      .getByText("Composition / dead-key events excluded", { exact: true })
      .locator(".."),
  ).toContainText("1");
  await page
    .getByRole("heading", { name: "Your key signals", exact: true })
    .click();
  await expect(page.locator('[data-key-code="KeyA"]')).toHaveAttribute(
    "title",
    /release state cleared/,
  );
});

test("lab data remains ephemeral and reset removes observations and browser mapping", async ({
  page,
}) => {
  await page.goto("/keyboard-lab");
  const input = page.getByRole("textbox", {
    name: "Keyboard signal check",
    exact: true,
  });
  await input.pressSequentially("abcdef", { delay: 20 });
  await expect(page.getByTestId("lab-key-count")).toHaveText("6");
  await page
    .getByRole("button", { name: "Clear observations", exact: true })
    .click();
  await expect(page.getByTestId("lab-key-count")).toHaveText("0");
  await expect(input).toHaveValue("");
  await input.pressSequentially("abcd", { delay: 20 });
  await page.reload();
  await expect(page.getByTestId("lab-key-count")).toHaveText("0");
  await expect(input).toHaveValue("");
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => /keyboard.lab/i.test(key)),
    ),
  ).toEqual([]);
});

test("mobile layout keeps capture accessible without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/keyboard-lab");
  await expect(
    page.getByRole("textbox", { name: "Keyboard signal check", exact: true }),
  ).toBeVisible();
  const geometry = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(geometry.pageWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(
    geometry.viewport,
  );
  await page
    .getByLabel("Reference layout", { exact: true })
    .selectOption("native");
  await expect(page.getByTestId("layout-agreement")).toContainText(
    "Native / custom",
  );
});
