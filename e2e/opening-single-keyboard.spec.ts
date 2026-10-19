import { expect, test, type Page } from "@playwright/test";
import type { KeyboardSceneDiagnostics } from "../src/components/brand/keyboard-scene";
import {
  advanceClockedOpeningPreparation,
  freezeOpeningClock,
  selectDocumentOpeningRenderer,
} from "./opening-renderer";

const sceneBridge = /\/keyboard-scene-bridge[^/]*\.(?:js|ts)(?:\?.*)?$/;

interface NativePresentationReceipt {
  startedAt: number | null;
  completedAt: number | null;
  completedWhileOpen: boolean | null;
  closedAt: number | null;
  words: Array<{ text: string; atMs: number }>;
  after2700: { playing: boolean; closing: boolean; text: string } | null;
}

async function firstOpening(page: Page) {
  await selectDocumentOpeningRenderer(page);
  await freezeOpeningClock(page);
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

test("a late real 3D scene gets its complete keyboard and wordmark choreography without a preliminary keyboard", async ({
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
    await expect(opening).toHaveAttribute("data-presentation", "preparing");
    await expect(fallback).toHaveCount(0);
    const preparation = await advanceClockedOpeningPreparation(page, 20_000);
    await expect.poll(() => bridgeRequests).toBe(1);
    // Pass the former absolute 4.2-second finish while the actual scene is pending.
    await page.clock.runFor(Math.max(0, 4500 - preparation.clockAdvancedMs));
    await expect(opening).toHaveAttribute("data-renderer", "loading");
    await expect(opening).toHaveAttribute("data-presentation", "preparing");
    await expect(opening).toHaveAttribute("data-closing", "false");
    await expect(fallback).toHaveCount(0);
    await expect(opening.locator(".awakening-key")).toHaveCount(0);
    await expect(opening.locator(".awakening-title-typed")).toHaveText("");
    await expect(opening.locator(".awakening-type-caret")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await expect(opening.locator(".awakening-signal")).toHaveCSS(
      "animation-name",
      "awakening-blink",
    );
    await expect(opening.locator(".awakening-orbit")).toHaveCSS("opacity", "0");
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
          // Advance genuine product-clock steps while retaining its preparation deadline.
          await page.clock.runFor(16);
          return opening.getAttribute("data-renderer");
        },
        { timeout: preparation.remainingTimeoutMs, intervals: [100, 250, 500] },
      )
      .toBe("webgl");
    await expect(opening).toHaveAttribute("data-presentation", "playing");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    await expect(opening.locator(".awakening-canvas")).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(opening.locator(".awakening-title-typed")).toHaveText("");
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
    await page.clock.fastForward(2500);
    await page.clock.runFor(50);
    await expect(opening).toHaveAttribute("data-closing", "false");
    await expect(opening.locator(".awakening-caption")).toContainText(
      "From possibility to precision.",
    );
    await expect(opening.locator(".awakening-title-typed")).toHaveText("");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    await page.screenshot({ path: info.outputPath("main-webgl-keyboard.png") });
    await page.clock.runFor(180);
    await expect(opening.locator(".awakening-title-typed")).toHaveText("S");
    await expect(opening.locator(".awakening-type-caret")).toHaveCSS(
      "visibility",
      "visible",
    );
    await expect(opening.locator(".awakening-caption")).toContainText(
      "Ten keystrokes. One new beginning.",
    );
    await page.screenshot({
      path: info.outputPath("real-keyboard-types-S.png"),
    });
    await page.clock.runFor(900);
    await expect(opening.locator(".awakening-title-typed")).toHaveText(
      "SparowType",
    );
    await expect(opening).toHaveAttribute("data-closing", "false");
    await expect(fallback).toHaveCSS("visibility", "hidden");
    await page.screenshot({ path: info.outputPath("complete-wordmark.png") });
    await page.clock.runFor(600);
    await expect(page.getByTestId("opening-experience")).toHaveCount(0);
    const input = page.getByRole("textbox", {
      name: "Typing input",
      exact: true,
    });
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("");
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
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
  await expect(opening.locator(".awakening-fallback")).toHaveCount(0);
  const preparation = await advanceClockedOpeningPreparation(page, 15_000);
  await expect.poll(() => bridgeRequests).toBe(1);
  await expect(opening).toHaveAttribute("data-renderer", "fallback", {
    timeout: preparation.remainingTimeoutMs,
  });
  await expect(opening).toHaveAttribute("data-presentation", "playing");
  await expect(opening.locator(".awakening-fallback")).toBeVisible();
  await expect(opening.locator(".awakening-key")).toHaveCount(61);
  await page.clock.runFor(3300);
  await expect(opening.locator(".awakening-title-typed")).toContainText(
    "Sparow",
  );
  await expect(
    opening.locator('.awakening-key[data-press="true"]'),
  ).toHaveCount(1);
  await skipToPractice(page);
});

test("a scene that never prepares exits once at the bounded watchdog without a preliminary keyboard", async ({
  page,
}) => {
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
    const preparation = await advanceClockedOpeningPreparation(page, 15_000);
    await expect.poll(() => bridgeRequests).toBe(1);
    await page.clock.runFor(Math.max(0, 5900 - preparation.clockAdvancedMs));
    await expect(opening).toHaveAttribute("data-presentation", "preparing");
    await expect(opening).toHaveAttribute("data-closing", "false");
    await expect(opening.locator(".awakening-key")).toHaveCount(0);
    await page.clock.runFor(350);
    await expect(page.getByTestId("opening-experience")).toHaveCount(0);
    const input = page.getByRole("textbox", {
      name: "Typing input",
      exact: true,
    });
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("");
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
    release();
    await page.clock.runFor(200);
    await expect(page.getByTestId("opening-experience")).toHaveCount(0);
    await expect(input).toHaveValue("x");
  } finally {
    release();
  }
});

test("the normal-clock production worker shows the creative 3D keyboard through wordmark typing and automatic entry", async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  const supported = await page.evaluate(
    () =>
      typeof Worker === "function" &&
      typeof OffscreenCanvas === "function" &&
      typeof HTMLCanvasElement.prototype.transferControlToOffscreen ===
        "function",
  );
  test.skip(
    !supported,
    "UNVERIFIED: this runner has no native transferable-canvas worker API.",
  );
  info.annotations.push({
    type: "scope",
    description:
      "Native production Worker and OffscreenCanvas with normal clocks and explicit eight-core/eight-GB desktop capabilities; no document renderer, page.clock, quality override, or synthetic readiness.",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    const receipt: NativePresentationReceipt = {
      startedAt: null,
      completedAt: null,
      completedWhileOpen: null,
      closedAt: null,
      words: [],
      after2700: null,
    };
    Object.assign(window, { nativeKeyboardPresentation: receipt });
    const observer = new MutationObserver(() => {
      const opening = document.querySelector(
        '[data-testid="opening-experience"]',
      );
      if (!opening) {
        if (receipt.startedAt !== null) {
          receipt.closedAt = performance.now();
          observer.disconnect();
        }
        return;
      }
      if (
        receipt.startedAt === null &&
        opening.getAttribute("data-mode") === "full" &&
        opening.getAttribute("data-presentation") === "playing"
      ) {
        receipt.startedAt = performance.now();
        window.setTimeout(() => {
          const current = document.querySelector(
            '[data-testid="opening-experience"]',
          );
          receipt.after2700 = {
            playing: current?.getAttribute("data-presentation") === "playing",
            closing: current?.getAttribute("data-closing") === "true",
            text:
              current?.querySelector(".awakening-title-typed")?.textContent ||
              "",
          };
        }, 2705);
      }
      if (receipt.startedAt === null) return;
      const text = opening.querySelector(".awakening-title-typed")?.textContent;
      if (text && text !== receipt.words.at(-1)?.text) {
        receipt.words.push({ text, atMs: performance.now() });
        if (text === "SparowType") {
          receipt.completedAt = performance.now();
          receipt.completedWhileOpen = opening.getAttribute('data-closing') === 'false';
        }
      }
    });
    observer.observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-presentation", "data-closing"],
    });
  });
  const receipt = () =>
    page.evaluate(
      () =>
        (
          window as Window & {
            nativeKeyboardPresentation: NativePresentationReceipt;
          }
        ).nativeKeyboardPresentation,
    );
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const opening = page.getByTestId("opening-experience");
    await expect(opening).toHaveAttribute("data-mode", "full");
    await expect(opening).toHaveAttribute("data-presentation", "playing", {
      timeout: 7000,
    });
    await expect(opening).toHaveAttribute("data-renderer", "webgl");
    const diagnostics: KeyboardSceneDiagnostics = JSON.parse(
      (await opening.locator(".awakening-canvas").getAttribute("data-scene"))!,
    );
    expect(diagnostics).toMatchObject({
      renderer: "webgl2",
      thread: "worker",
      keyCount: 61,
      keycapMeshes: 1,
      tier: "desktop",
      bloom: true,
      environment: true,
      environmentIntensity: 0.35,
      degraded: false,
      contextLost: false,
      disposed: false,
    });
    expect(diagnostics.frames).toBeGreaterThan(0);
    expect(diagnostics.drawCalls).toBeGreaterThan(0);
    expect(diagnostics.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
    expect(diagnostics.cameraElevationDegrees).toBeLessThanOrEqual(42);
    expect(
      page
        .workers()
        .some((worker) => /keyboard-render[.-]worker/.test(worker.url())),
    ).toBe(true);
    await expect(opening.locator(".awakening-fallback")).toHaveCSS(
      "visibility",
      "hidden",
    );
    await expect.poll(async () => (await receipt()).after2700).not.toBeNull();
    expect((await receipt()).after2700).toMatchObject({
      playing: true,
      closing: false,
    });
    // Observe the actual DOM milestone before capturing. An in-flight screenshot
    // can stall Firefox long enough to coalesce the final letter and close timers.
    // The complete-wordmark capture below remains visual evidence after this check.
    await expect.poll(async () => (await receipt()).completedAt).not.toBeNull();
    expect((await receipt()).completedWhileOpen).toBe(true);
    if (await opening.count()) {
      await page.screenshot({ path: info.outputPath("native-3d-complete-wordmark.png") });
    }
    await expect(opening).toHaveCount(0);
    const observed = await receipt();
    expect(observed.startedAt).not.toBeNull();
    expect(observed.completedAt).not.toBeNull();
    expect(observed.closedAt).not.toBeNull();
    expect(observed.words[0].text).toBe("S");
    expect(observed.words.at(-1)?.text).toBe("SparowType");
    expect(observed.completedAt! - observed.startedAt!).toBeGreaterThan(2700);
    expect(observed.closedAt! - observed.startedAt!).toBeGreaterThan(4000);
    const input = page.getByRole("textbox", {
      name: "Typing input",
      exact: true,
    });
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("");
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
    await info.attach("native-full-quality-scene", {
      contentType: "application/json",
      body: JSON.stringify(diagnostics),
    });
  } finally {
    await info.attach("native-keyboard-wordmark-timeline", {
      contentType: "application/json",
      body: JSON.stringify(await receipt()),
    });
  }
});
