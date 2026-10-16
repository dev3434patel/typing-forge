import { expect, test } from "@playwright/test";
import {
  advanceClockedOpeningPreparation,
  selectDocumentOpeningRenderer,
} from "./opening-renderer";

test("low-power WebGL precompiles asynchronously and disposes without a scored skip key", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    Object.defineProperty(navigator, "deviceMemory", { get: () => 4 });
  });
  await selectDocumentOpeningRenderer(page);
  await page.clock.install();
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 25),
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const supported = await page.evaluate(() => {
    const context = document.createElement("canvas").getContext("webgl2");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  });
  test.skip(
    !supported,
    "UNVERIFIED: native WebGL2 is unavailable on this runner.",
  );
  const opening = page.getByTestId("opening-experience");
  await expect(opening).toHaveAttribute("data-mode", "full");
  const preparation = await advanceClockedOpeningPreparation(page, 20_000);
  await expect
    .poll(
      async () => {
        // Three's parallel shader readiness polls use10ms timers. Advance them while
        // keeping the independent four-second automatic finish safely in the future.
        await page.clock.runFor(30);
        return opening.getAttribute("data-renderer");
      },
      { timeout: preparation.remainingTimeoutMs },
    )
    .toBe("webgl");
  const canvas = page.locator(".awakening-canvas");
  const diagnostics = JSON.parse((await canvas.getAttribute("data-scene"))!);
  expect(diagnostics).toMatchObject({
    thread: "main-thread",
    tier: "mobile",
    bloom: false,
    keyCount: 61,
    keycapMeshes: 1,
    asyncShaderCompile: true,
    disposed: false,
  });
  expect(diagnostics.frames).toBeGreaterThan(0);
  expect(diagnostics.pixelRatio).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-scene"))!).disposed,
    )
    .toBe(true);
  await page.clock.runFor(200);
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Typing session", exact: true }),
  ).toHaveAttribute("data-status", "ready");
});
