import { expect, test, type Page } from "@playwright/test";
import { completeCorrectedCat, focusTyping } from "./helpers";
import { waitForLayoutFonts } from "./layout-fonts";

test.beforeEach(async ({ page }) => {
  // Measure the product layout and native controls after the separately tested opening.
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

async function expectPageFits(page: Page) {
  await page.locator("#main-content").waitFor();
  await waitForLayoutFonts(page);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: Array.from(document.querySelectorAll("main, header, footer"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1;
      })
      .map((element) => element.tagName),
  }));
  expect(dimensions.document, page.url()).toBeLessThanOrEqual(
    dimensions.viewport + 1,
  );
  expect(dimensions.body, page.url()).toBeLessThanOrEqual(
    dimensions.viewport + 1,
  );
  expect(dimensions.offenders, page.url()).toEqual([]);
}

for (const width of [320, 390, 768, 1440]) {
  test(`main local pages fit a ${width}px viewport`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/learn",
      "/race",
      "/stats",
      "/settings",
      "/keyboard-lab",
      "/leaderboard",
      "/ranked",
      "/profile",
      "/auth",
      "/about",
    ]) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expectPageFits(page);
      });
    }
  });
}

test("every theme provides opaque, readable native language options", async ({
  page,
}) => {
  test.setTimeout(180_000);
  for (const [id, name, scheme] of [
    ["sparow-dark", "Sparow dark", "dark"],
    ["sparow-light", "Sparow light", "light"],
    ["graphite", "Graphite", "dark"],
    ["midnight-blue", "Midnight blue", "dark"],
    ["ember", "Ember", "dark"],
    ["mono-ink", "Mono ink", "dark"],
    ["paper", "Paper", "light"],
    ["aurora", "Aurora", "dark"],
  ]) {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name, exact: false }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", id);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const select = page.getByRole("combobox", {
      name: "Language",
      exact: true,
    });
    await expect(select).toBeVisible();
    const menu = await select.evaluate((element) => {
      const control = element as HTMLSelectElement;
      const option = getComputedStyle(control.options[1]);
      const components = (color: string) => color.match(/[\d.]+/g)!.map(Number);
      const luminance = (color: string) =>
        components(color)
          .slice(0, 3)
          .map((value) => value / 255)
          .map((value) =>
            value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
          )
          .reduce(
            (sum, value, index) =>
              sum + value * [0.2126, 0.7152, 0.0722][index],
            0,
          );
      const foreground = luminance(option.color);
      const background = luminance(option.backgroundColor);
      return {
        scheme: getComputedStyle(control).colorScheme,
        background: components(option.backgroundColor),
        contrast:
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05),
      };
    });
    expect(menu.scheme, name).toBe(scheme);
    expect(menu.background[3] ?? 1, name).toBe(1);
    expect(menu.contrast, name).toBeGreaterThanOrEqual(4.5);
  }
  // Native keyboard selection still changes the content and survives reload.
  const select = page.getByRole("combobox", { name: "Language", exact: true });
  await select.focus();
  await select.press("Home");
  await select.press("ArrowDown");
  await select.press("Enter");
  await expect(select).toHaveValue("es");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#main-content").waitFor();
  await expect(select).toHaveValue("es");
});

test("small-screen test controls wrap in all six modes and keep select targets usable", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const mode of ["Time", "Words", "Quote", "Code", "Custom", "Zen"]) {
    await page
      .getByRole("group", { name: "Test mode", exact: true })
      .getByRole("button", { name: mode, exact: true })
      .click();
    await expectPageFits(page);
    const toolbar = page.getByRole("region", { name: "Test configuration" });
    for (const control of await toolbar.locator("button, select").all()) {
      const rect = await control.boundingBox();
      expect(rect).not.toBeNull();
      expect(Math.round(rect!.height)).toBeGreaterThanOrEqual(44);
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
    }
    if (mode === "Code") {
      await page
        .getByRole("combobox", { name: "Code language" })
        .selectOption("python");
      await page.screenshot({
        path: `audit/responsive-2026-10-16/code-320-${info.project.name}.png`,
        fullPage: true,
      });
    }
  }
  await page
    .getByRole("combobox", { name: "Language", exact: true })
    .selectOption("gu-Latn");
  await expectPageFits(page);
});

test("narrow results retain the whole keyboard map and expanded evidence", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 760 });
  await completeCorrectedCat(page);
  await expectPageFits(page);
  const map = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Final-text keyboard map" }),
  });
  await map.locator("summary").click();
  const keysFit = await map.evaluate((element) => {
    const parent = element.getBoundingClientRect();
    return Array.from(element.querySelectorAll("span[title]"))
      .filter((key) => key.getBoundingClientRect().width > 0)
      .every((key) => {
        const rect = key.getBoundingClientRect();
        return rect.left >= parent.left && rect.right <= parent.right;
      });
  });
  expect(keysFit).toBe(true);
  const speed = await page
    .getByText("Words per minute", { exact: true })
    .locator("..")
    .boundingBox();
  const accuracy = await page
    .getByText("Input accuracy", { exact: true })
    .first()
    .locator("..")
    .boundingBox();
  expect(speed!.y + speed!.height).toBeLessThanOrEqual(accuracy!.y);
  await page
    .getByRole("button", { name: "Inspect session evidence", exact: true })
    .click();
  const table = page.getByRole("region", {
    name: "Word credit table",
    exact: true,
  });
  await table.focus();
  await expect(table).toBeFocused();
  expect(
    await table.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Replay edits", exact: true }).click();
  await page
    .getByRole("slider", { name: "Replay position", exact: true })
    .press("End");
  await page.getByText("Recorded edit events", { exact: true }).click();
  const events = page.getByRole("region", {
    name: "Recorded edit event table",
    exact: true,
  });
  await events.focus();
  await expect(events).toBeFocused();
  await page
    .getByText("Session details & comparison eligibility", { exact: false })
    .click();
  await expectPageFits(page);
  await page.screenshot({
    path: `audit/responsive-2026-10-16/results-320-${info.project.name}.png`,
    fullPage: true,
  });
});

test("race and learning remain usable after landscape and narrow resize", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/race", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  const input = await focusTyping(page);
  await input.pressSequentially("test");
  await page.setViewportSize({ width: 320, height: 568 });
  await expectPageFits(page);
  await expect(page.getByTestId("opponent-caret")).toBeVisible();
  await input.press("Tab");
  await page
    .getByRole("button", { name: "Restart with new text" })
    .press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await page.goto("/learn?language=en&layout=qwertz", {
    waitUntil: "domcontentloaded",
  });
  const keyboard = page.getByRole("img", { name: /^QWERTZ logical keyboard/ });
  await expect(keyboard).toBeVisible();
  expect(
    await keyboard.evaluate((element) => {
      const frame = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll(".learn-keyboard-row")).every(
        (row) => {
          const keys = Array.from(row.querySelectorAll(".learn-key")).map(
            (key) => key.getBoundingClientRect(),
          );
          return keys.every(
            (key) =>
              key.left >= frame.left - 1 &&
              key.right <= frame.right + 1 &&
              Math.abs(key.top - keys[0].top) < 1,
          );
        },
      );
    }),
  ).toBe(true);
  for (const name of ["Correction policy", "Input method"]) {
    const control = page.getByRole("combobox", { name, exact: true });
    expect(
      Math.round((await control.boundingBox())!.height),
    ).toBeGreaterThanOrEqual(44);
  }
  await expectPageFits(page);
  await page
    .getByRole("combobox", { name: "Correction policy", exact: true })
    .selectOption("stop");
  await page
    .getByText("Learning progress & evidence", { exact: false })
    .click();
  await expectPageFits(page);
});
