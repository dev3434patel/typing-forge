import { expect, test, type Page } from "@playwright/test";
import type { KeyboardSceneDiagnostics } from "../src/components/brand/keyboard-scene";
import {
  advanceClockedOpeningPreparation,
  selectDocumentOpeningRenderer,
} from "./opening-renderer";

const sceneBridge = /\/keyboard-scene-bridge[^/]*\.(?:js|ts)(?:\?.*)?$/;

async function firstOpening(page: Page) {
  await selectDocumentOpeningRenderer(page);
  await page.clock.install();
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 25),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const opening = page.getByTestId("opening-experience");
  await expect(opening).toHaveAttribute("data-mode", "full");
  return opening;
}

async function skipToPractice(page: Page) {
  await page.keyboard.press("Escape");
  await page.clock.runFor(200);
  await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("");
  await input.pressSequentially("x");
  await expect(input).toHaveValue("x");
}

test("a delayed scene shows no preliminary keyboard before the real WebGL keyboard", async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let bridgeRequests = 0;
  await page.route(sceneBridge, async (route) => {
    bridgeRequests++;
    await gate;
    await route.continue();
  });

  try {
    const opening = await firstOpening(page);
    const fallback = opening.locator(".awakening-fallback");
    await expect(opening).toHaveAttribute("data-renderer", "loading");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    const preparation = await advanceClockedOpeningPreparation(page, 20_000);
    await expect.poll(() => bridgeRequests).toBe(1);
    // Pass the former 850ms fallback switch while the actual scene is pending.
    await page.clock.runFor(Math.max(0, 1600 - preparation.clockAdvancedMs));
    await expect(opening).toHaveAttribute("data-renderer", "loading");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    await expect(opening.locator(".awakening-key")).toHaveCount(61);
    await page.screenshot({ path: info.outputPath("loading-no-keyboard.png") });

    const supported = await page.evaluate(() => {
      const context = document.createElement("canvas").getContext("webgl2");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return Boolean(context);
    });
    test.skip(
      !supported,
      "UNVERIFIED: this runner cannot render the real WebGL2 keyboard.",
    );
    release();
    await expect
      .poll(
        async () => {
          // Native parallel shader readiness can use timers on low-power hosts.
          // Advance small genuine product-clock steps without bypassing its deadline.
          await page.clock.runFor(16);
          return opening.getAttribute("data-renderer");
        },
        { timeout: preparation.remainingTimeoutMs, intervals: [100, 250, 500] },
      )
      .toBe("webgl");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    const canvas = opening.locator(".awakening-canvas");
    const diagnostics: KeyboardSceneDiagnostics = JSON.parse(
      (await canvas.getAttribute("data-scene"))!,
    );
    expect(diagnostics).toMatchObject({
      renderer: "webgl2",
      thread: "main-thread",
      keyCount: 61,
      keycapMeshes: 1,
      contextLost: false,
      disposed: false,
    });
    expect(diagnostics.frames).toBeGreaterThan(0);
    expect(diagnostics.drawCalls).toBeGreaterThan(0);
    if (diagnostics.tier === "desktop" && !diagnostics.degraded)
      expect(diagnostics.bloom).toBe(true);
    await page.clock.runFor(200);
    await expect(fallback).toHaveCSS("visibility", "hidden");
    await page.screenshot({ path: info.outputPath("main-webgl-keyboard.png") });
    await skipToPractice(page);
  } finally {
    release();
  }
});

test("a genuinely unavailable scene retains the complete recovery keyboard and usable practice", async ({
  page,
}) => {
  let bridgeRequests = 0;
  await page.route(sceneBridge, async (route) => {
    bridgeRequests++;
    await route.abort();
  });
  const opening = await firstOpening(page);
  await expect(opening.locator(".awakening-fallback")).toHaveCSS(
    "visibility",
    "hidden",
  );
  const preparation = await advanceClockedOpeningPreparation(page, 15_000);
  await expect.poll(() => bridgeRequests).toBe(1);
  await expect(opening).toHaveAttribute("data-renderer", "fallback", {
    timeout: preparation.remainingTimeoutMs,
  });
  await expect(opening.locator(".awakening-fallback")).toBeVisible();
  await expect(opening.locator(".awakening-key")).toHaveCount(61);
  await page.clock.runFor(Math.max(0, 3300 - preparation.clockAdvancedMs));
  await expect(opening.locator(".awakening-title-typed")).toContainText(
    "Sparow",
  );
  await expect(opening.locator('.awakening-key[data-press="true"]')).toHaveCount(
    1,
  );
  await skipToPractice(page);
});
