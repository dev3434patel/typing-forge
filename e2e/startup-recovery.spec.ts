import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { completeCorrectedCat, focusTyping } from "./helpers";

// These faults target the network, not an installed offline worker/cache.
test.use({ serviceWorkers: "block", viewport: { width: 320, height: 800 } });

function contrast(foreground: string, background: string) {
  const luminance = (css: string) => {
    const channels = (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    if (channels.length !== 3)
      throw new Error(`Unsupported measured color: ${css}`);
    const linear = channels.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const first = luminance(foreground),
    second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function inspectRecovery(page: Page, info: TestInfo, phase: string) {
  const main = page.locator("main.app-recovery");
  await expect(
    main.getByRole("heading", {
      name: "Let’s get you back to practice.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(main).toContainText(
    "Your saved history is retained on this device.",
  );
  const reload = main.getByRole("button", {
    name: "Reload SparowType",
    exact: true,
  });
  await expect(reload).toBeVisible();
  const measured = await main.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const button = element.querySelector("button")!;
    const buttonRect = button.getBoundingClientRect();
    const buttonStyle = getComputedStyle(button);
    const paragraphStyle = getComputedStyle(
      element.querySelector("p:last-of-type")!,
    );
    return {
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      main: { left: rect.left, right: rect.right, width: rect.width },
      button: {
        left: buttonRect.left,
        right: buttonRect.right,
        width: buttonRect.width,
        height: buttonRect.height,
      },
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
      foreground: style.color,
      background: style.backgroundColor,
      paragraph: paragraphStyle.color,
      buttonForeground: buttonStyle.color,
      buttonBackground: buttonStyle.backgroundColor,
    };
  });
  expect(measured.scrollWidth).toBeLessThanOrEqual(measured.viewport + 1);
  expect(measured.main.left).toBeGreaterThanOrEqual(0);
  expect(measured.main.right).toBeLessThanOrEqual(measured.viewport + 1);
  expect(measured.button.left).toBeGreaterThanOrEqual(0);
  expect(measured.button.right).toBeLessThanOrEqual(measured.viewport + 1);
  expect(measured.button.height).toBeGreaterThanOrEqual(44);
  expect(measured.button.width).toBeGreaterThanOrEqual(44);
  expect(measured.fontSize).toBeGreaterThanOrEqual(16);
  expect(measured.lineHeight).toBeGreaterThanOrEqual(24);
  expect(measured.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(
    contrast(measured.foreground, measured.background),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrast(measured.paragraph, measured.background),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrast(measured.buttonForeground, measured.buttonBackground),
  ).toBeGreaterThanOrEqual(4.5);
  await page.keyboard.press("Tab");
  await expect(reload).toBeFocused();
  await expect(reload).toHaveCSS("outline-style", "solid");
  await expect(reload).toHaveCSS("outline-width", "2px");
  await info.attach(`${phase}-recovery-geometry`, {
    body: JSON.stringify(measured),
    contentType: "application/json",
  });
  await info.attach(`${phase}-recovery-320px`, {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  return reload;
}

test("startup recovers from real workspace script and stylesheet failures at 320px without losing guest history", async ({
  page,
  context,
}, info) => {
  await context.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
  await completeCorrectedCat(page);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /saved.*device|saved.*locally|local.*saved/i }),
  ).toBeVisible();

  // A missing stylesheet can reject Vite's preload before App.js is requested.
  // Exercise each asset separately on a fresh document, without fabricated fetches.
  for (const extension of ["css", "js"] as const) {
    const fresh = await context.newPage();
    const asset = new RegExp(`/assets/App-[^/]+\\.${extension}(?:\\?.*)?$`);
    const blocked: string[] = [];
    await fresh.route(asset, async (route) => {
      blocked.push(route.request().url());
      await route.abort("failed");
    });
    try {
      await fresh.goto("/", { waitUntil: "domcontentloaded" });
      const reload = await inspectRecovery(fresh, info, extension);
      expect(blocked.length).toBeGreaterThan(0);
      expect(blocked.every((url) => asset.test(url))).toBe(true);
      await info.attach(`${extension}-actual-blocked-workspace-assets`, {
        body: JSON.stringify(blocked),
        contentType: "application/json",
      });
      await fresh.unroute(asset);
      const loaded = fresh.waitForResponse(
        (response) => asset.test(response.url()) && response.status() === 200,
      );
      await reload.click();
      await loaded;
      const input = await focusTyping(fresh);
      await expect(input).toHaveValue("");
      await expect(
        fresh.getByRole("region", { name: "Typing session", exact: true }),
      ).toHaveAttribute("data-status", "ready");
      await fresh.goto("/stats", { waitUntil: "domcontentloaded" });
      const rows = fresh
        .getByRole("table", {
          name: "Completed sessions, most recent first",
          exact: true,
        })
        .getByRole("row");
      await expect(rows).toHaveCount(2);
      await expect(rows.nth(1)).toContainText("75.0%");
    } finally {
      await fresh.close();
    }
  }
});
