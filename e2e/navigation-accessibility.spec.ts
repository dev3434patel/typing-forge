import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

async function navigationForViewport(page: Page, requestedWidth: number, stage: string) {
  const receipt = await page.evaluate(() => {
    const query = "(min-width:1200px)";
    return {
      query,
      matches: matchMedia(query).matches,
      innerWidth,
      outerWidth,
      documentWidth: document.documentElement.clientWidth,
      visualViewportWidth: visualViewport?.width,
      visualViewportScale: visualViewport?.scale,
      devicePixelRatio,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      navigation: Array.from(document.querySelectorAll("header nav")).map((element) => ({
        name: element.getAttribute("aria-label"),
        display: getComputedStyle(element).display,
        width: element.getBoundingClientRect().width,
      })),
    };
  });
  await test.info().attach(`navigation-layout-${requestedWidth}-${stage.replace(/\W/g, "-")}`, {
    body: JSON.stringify({ requestedWidth, stage, ...receipt }, null, 2),
    contentType: "application/json",
  });
  const expectedName = receipt.matches ? "Main navigation" : "Mobile navigation";
  const navigation = page.getByRole("navigation", { name: expectedName, exact: true });
  await expect(navigation, `Expected navigation from actual CSS breakpoint: ${JSON.stringify(receipt)}`).toBeVisible();
  await expect(page.getByRole("navigation", {
    name: receipt.matches ? "Mobile navigation" : "Main navigation",
    exact: true,
  })).toBeHidden();
  return navigation;
}

test("practice aliases identify the current workspace in desktop and mobile navigation", async ({ page }) => {
  test.setTimeout(90_000);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route, label] of [
      ["/typing-test", "Test"],
      ["/typing-practice", "Learn"],
      ["/practice/", "Learn"],
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const navigation = await navigationForViewport(page, width, route);
      await expect(navigation.getByRole("link", { name: label, exact: true }))
        .toHaveAttribute("aria-current", "page");
      await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
    }
    const navigation = await navigationForViewport(page, width, "before-stats");
    await navigation.getByRole("link", { name: "Stats", exact: true }).click();
    await expect(page).toHaveURL(/\/stats$/);
    await expect(navigation.getByRole("link", { name: "Stats", exact: true }))
      .toHaveAttribute("aria-current", "page");
  }
});

test("keyboard users can pan the narrow keyboard lab diagram", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/keyboard-lab", { waitUntil: "domcontentloaded" });
  const keyboard = page.getByRole("region", {
    name: "Physical key observations",
    exact: true,
  });
  await expect(keyboard).toBeVisible();
  expect(await keyboard.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await keyboard.focus();
  await expect(keyboard).toBeFocused();
  await keyboard.press("ArrowRight");
  await expect.poll(() => keyboard.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const intervals = page.getByRole("region", {
    name: "Observed transition intervals",
    exact: true,
  });
  await intervals.focus();
  await expect(intervals).toBeFocused();
});

test("the command palette stays inside a landscape phone viewport and supports touch dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  const origin = page.getByRole("button", { name: "Replay opening animation", exact: true });
  await origin.focus();
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "SparowType commands", exact: true });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(321);
  // Preserve the entrance bounds assertion above, then measure the settled touch target.
  await expect.poll(() => dialog.evaluate(element => element.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  const target = await close.boundingBox();
  expect(target).not.toBeNull();
  // Windows WebKit may represent a 44px target as 43.990905 CSS pixels.
  expect(Math.round(target!.width)).toBeGreaterThanOrEqual(44);
  expect(Math.round(target!.height)).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(origin).toBeFocused();
});
