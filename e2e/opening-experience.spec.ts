import { expect, test, type Page } from "@playwright/test";
import {
  INTRO_ENABLED_STORAGE_KEY,
  INTRO_REPLAY_EVENT,
  INTRO_SEEN_SESSION_KEY,
} from "../src/lib/opening-experience";
import type { KeyboardSceneDiagnostics } from "../src/components/brand/keyboard-scene";
import {
  advanceClockedOpeningPreparation,
  selectDocumentOpeningRenderer,
} from "./opening-renderer";

const PREFERENCES_KEY = "typingforge:v3:guest:preferences";
async function holdClock(page: Page) {
  await selectDocumentOpeningRenderer(page);
  await page.clock.install();
  await page.clock.pauseAt(
    new Date((await page.evaluate(() => Date.now())) + 25),
  );
}
async function firstOpening(page: Page) {
  await holdClock(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const opening = page.getByTestId("opening-experience");
  await expect(opening).toHaveAttribute("data-mode", "full");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(
    page.getByRole("main", { name: "SparowType introduction", exact: true }),
  ).toBeVisible();
  await expect(opening.locator(".awakening-mute")).toHaveAccessibleName(
    /^(Sound off: enable intro sound|Sound unavailable: intro audio is not supported in this browser)$/,
  );
  await expect(
    page.getByRole("status").filter({ hasText: "Loading SparowType" }),
  ).toBeVisible();
  return opening;
}
async function expectReadyPractice(page: Page) {
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Typing session", exact: true }),
  ).toHaveAttribute("data-status", "ready");
  await expect(
    page.getByTestId("typing-target").locator("[data-typed]"),
  ).toHaveCount(0);
  return input;
}
async function completeAutomaticOpening(page: Page, duration = 4500) {
  const opening = page.getByTestId("opening-experience");
  if (
    (await opening.getAttribute("data-mode")) === "full" &&
    (await opening.getAttribute("data-presentation")) === "preparing"
  ) {
    const preparation = await advanceClockedOpeningPreparation(page, 20_000);
    await expect
      .poll(
        async () => {
          await page.clock.runFor(16);
          return opening.getAttribute("data-presentation");
        },
        { timeout: preparation.remainingTimeoutMs, intervals: [100, 250, 500] },
      )
      .toBe("playing");
  }
  await page.clock.fastForward(duration);
  // fastForward fires a due finish callback at its destination; run the nested exit timer separately.
  await page.clock.runFor(200);
}
async function requireNativeWebGL(page: Page) {
  const supported = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  });
  test.skip(
    !supported,
    "UNVERIFIED: this runner cannot create a native WebGL2 context.",
  );
}
async function realScene(page: Page) {
  await requireNativeWebGL(page);
  const preparation = await advanceClockedOpeningPreparation(page, 20_000);
  const opening = page.getByTestId("opening-experience");
  await expect
    .poll(
      async () => {
        await page.clock.runFor(16);
        return opening.getAttribute("data-renderer");
      },
      { timeout: preparation.remainingTimeoutMs, intervals: [100, 250, 500] },
    )
    .toBe("webgl");
  await expect(opening).toHaveAttribute("data-presentation", "playing");
  const canvas = page.locator(".awakening-canvas");
  await expect
    .poll(async () => {
      const raw = await canvas.getAttribute("data-scene");
      return raw ? JSON.parse(raw).frames : 0;
    })
    .toBeGreaterThan(0);
  return { canvas };
}

test("full opening gates practice and returning visitors receive the 900ms wordmark", async ({
  page,
}) => {
  const opening = await firstOpening(page);
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toHaveCount(0);
  await expect(opening).toHaveAttribute("data-closing", "false");
  await completeAutomaticOpening(page);
  await expect(await expectReadyPractice(page)).toBeFocused();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(opening).toHaveAttribute("data-mode", "returning");
  await expect(opening.locator("canvas")).toHaveCount(0);
  await page.clock.fastForward(730);
  await expect(opening).toHaveAttribute("data-closing", "false");
  await page.clock.runFor(171);
  await expectReadyPractice(page);
});

test("ordinary letters, Enter, Escape and Space skip without input leakage while Tab preserves focus", async ({
  page,
}) => {
  await firstOpening(page);
  for (const key of ["a", "Enter", "Escape", "Space"]) {
    if (key !== "a") {
      await page.evaluate(
        (storageKey) => sessionStorage.removeItem(storageKey),
        INTRO_SEEN_SESSION_KEY,
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("opening-experience")).toHaveAttribute(
        "data-mode",
        "full",
      );
    }
    await page.keyboard.press(key);
    await expect(page.getByTestId("opening-experience")).toHaveAttribute(
      "data-closing",
      "true",
    );
    await expect(
      page.getByRole("textbox", { name: "Typing input", exact: true }),
    ).toHaveCount(0);
    await page.clock.runFor(200);
    await expectReadyPractice(page);
  }
  await page.evaluate(
    (storageKey) => sessionStorage.removeItem(storageKey),
    INTRO_SEEN_SESSION_KEY,
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  const opening = page.getByTestId("opening-experience");
  await expect(opening).toHaveAttribute("data-mode", "full");
  await page.keyboard.press("Tab");
  await expect(opening).toHaveAttribute("data-closing", "false");
  await expect(opening.locator("button:focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.clock.runFor(200);
  await expectReadyPractice(page);
});

test("a replay during the closing fade owns its lifetime instead of inheriting the previous exit timer", async ({
  page,
}) => {
  const opening = await firstOpening(page);
  await page.keyboard.press("Escape");
  await expect(opening).toHaveAttribute("data-closing", "true");
  await page.evaluate(
    (name) => window.dispatchEvent(new Event(name)),
    INTRO_REPLAY_EVENT,
  );
  await expect(opening).toHaveAttribute("data-mode", "full");
  await expect(opening).toHaveAttribute("data-closing", "false");
  await page.clock.runFor(200);
  await expect(opening).toHaveAttribute("data-mode", "full");
  await expect(opening).toHaveAttribute("data-closing", "false");
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.clock.runFor(200);
  await expectReadyPractice(page);
});

test("automatic caret handoff leaves the first real keystroke available to practice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.classList.contains("awakening-handoff"))
        document.documentElement.dataset.caretHandoffs = String(
          Number(document.documentElement.dataset.caretHandoffs || 0) + 1,
        );
      return Reflect.apply(original, this, args);
    };
  });
  await firstOpening(page);
  await completeAutomaticOpening(page);
  const input = await expectReadyPractice(page);
  await page.clock.runFor(80);
  await expect(page.locator("html")).toHaveAttribute(
    "data-caret-handoffs",
    "1",
  );
  await input.pressSequentially("x");
  await expect(input).toHaveValue("x");
  await expect(page.locator(".awakening-handoff")).toHaveCount(0);
  await expect(
    page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
  ).not.toHaveCSS("visibility", "hidden");
});

for (const failure of [
  "blocked chunk",
  "late chunk",
  "animation API",
] as const) {
  test(`caret handoff ${failure} preserves input and the real caret`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let release = () => {};
    if (failure === "blocked chunk")
      await page.route(/\/assets\/caret-handoff[^/]*\.js/, (route) =>
        route.abort(),
      );
    if (failure === "late chunk") {
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/\/assets\/caret-handoff[^/]*\.js/, async (route) => {
        await gate;
        await route.continue();
      });
    }
    if (failure === "animation API")
      await page.addInitScript(() => {
        const original = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          if (this.classList.contains("awakening-handoff")) {
            document.documentElement.dataset.handoffAnimationFailure =
              "exercised";
            throw new Error("Unavailable animation");
          }
          return Reflect.apply(original, this, args);
        };
      });
    await firstOpening(page);
    await completeAutomaticOpening(page);
    const input = await expectReadyPractice(page);
    if (failure === "animation API") {
      await page.clock.runFor(80);
      await expect(page.locator("html")).toHaveAttribute(
        "data-handoff-animation-failure",
        "exercised",
      );
    }
    await input.pressSequentially("x");
    if (failure === "late chunk") {
      const response = page.waitForResponse(/\/assets\/caret-handoff[^/]*\.js/);
      release();
      await response;
    }
    await page.clock.runFor(100);
    await expect(input).toHaveValue("x");
    await expect(page.locator(".awakening-handoff")).toHaveCount(0);
    await expect(
      page.getByTestId("typing-viewport").locator(":scope > .forge-caret"),
    ).not.toHaveCSS("visibility", "hidden");
    expect(errors).toEqual([]);
  });
}

test.describe("touch entry", () => {
  test.use({ hasTouch: true });
  test("a tap on the composition skips and leaves practice ready", async ({
    page,
  }) => {
    const opening = await firstOpening(page);
    await opening.tap({ position: { x: 30, y: 100 } });
    await page.clock.runFor(200);
    await expectReadyPractice(page);
  });
});

for (const source of ["system", "device preference"] as const) {
  test(`${source} reduced motion uses the 300ms wordmark without downloading WebGL`, async ({
    page,
  }) => {
    const rendererRequests: string[] = [];
    page.on("request", (request) => {
      if (
        /keyboard-scene|keyboard-bloom|deps\/(three|gsap)/.test(request.url())
      )
        rendererRequests.push(request.url());
    });
    if (source === "system")
      await page.emulateMedia({ reducedMotion: "reduce" });
    else
      await page.addInitScript((key) => {
        localStorage.setItem(
          key,
          JSON.stringify({ schemaVersion: 3, values: { reducedMotion: true } }),
        );
      }, PREFERENCES_KEY);
    await holdClock(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const opening = page.getByTestId("opening-experience");
    await expect(opening).toHaveAttribute("data-mode", "reduced");
    await expect(opening.locator("canvas")).toHaveCount(0);
    await page.clock.fastForward(290);
    await expect(opening).toBeVisible();
    await page.clock.runFor(11);
    await expectReadyPractice(page);
    expect(rendererRequests).toEqual([]);
  });
}

test("deep links remain immediate and a device opt-out persists through manual replay", async ({
  page,
}) => {
  await holdClock(page);
  await page.goto("/learn");
  await expect(
    page.getByRole("region", { name: "Adaptive typing lesson", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  await page.addInitScript(
    (key) => localStorage.setItem(key, "false"),
    INTRO_ENABLED_STORAGE_KEY,
  );
  await page.goto("/");
  await expectReadyPractice(page);
  await page.goto("/settings");
  const toggle = page.getByRole("checkbox", {
    name: "Opening animation",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  const replay = page.getByRole("button", {
    name: "Replay opening animation",
    exact: true,
  });
  await replay.click();
  await expect(page.getByTestId("opening-experience")).toHaveAttribute(
    "data-mode",
    "full",
  );
  await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  await page.clock.runFor(200);
  await expect(replay).toBeFocused();
  await expect(toggle).not.toBeChecked();
});

test("blocked browser storage and unavailable WebGL retain a complete fallback keyboard", async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"])
      Object.defineProperty(window, name, {
        configurable: true,
        get() {
          throw new DOMException("Storage unavailable", "SecurityError");
        },
      });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl2" ||
        type === "webgl" ||
        type === "experimental-webgl"
      ) {
        document.documentElement.dataset.unavailableWebglAttempts = String(
          Number(
            document.documentElement.dataset.unavailableWebglAttempts || 0,
          ) + 1,
        );
        return null;
      }
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  const opening = await firstOpening(page);
  const preparation = await advanceClockedOpeningPreparation(page, 15_000);
  await expect(opening).toHaveAttribute("data-renderer", "fallback", {
    timeout: preparation.remainingTimeoutMs,
  });
  await expect
    .poll(async () =>
      Number(
        (await page
          .locator("html")
          .getAttribute("data-unavailable-webgl-attempts")) || 0,
      ),
    )
    .toBeGreaterThan(0);
  await expect(opening.locator(".awakening-key")).toHaveCount(61);
  await expect(opening.locator(".awakening-fallback")).toBeVisible();
  await completeAutomaticOpening(page);
  await expectReadyPractice(page);
});

test("native WebGL renders 61 instanced caps, then disposes before practice mounts", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await firstOpening(page);
  const { canvas } = await realScene(page);
  // The keyboard receives the whole choreography after actual GPU readiness.
  await page.clock.fastForward(2580);
  await page.clock.runFor(50);
  const data: KeyboardSceneDiagnostics = JSON.parse(
    (await canvas.getAttribute("data-scene"))!,
  );
  expect(data).toMatchObject({
    renderer: "webgl2",
    thread: "main-thread",
    keyCount: 61,
    keycapMeshes: 1,
    contextLost: false,
    disposed: false,
  });
  expect(data.frames).toBeGreaterThan(0);
  expect(data.drawCalls).toBeGreaterThan(0);
  expect(data.pixelRatio).toBeLessThanOrEqual(data.tier === "mobile" ? 1 : 1.5);
  if (data.tier === "desktop" && !data.degraded) expect(data.bloom).toBe(true);
  await page.getByRole("button", { name: "Skip intro", exact: false }).click();
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-scene"))!).disposed,
    )
    .toBe(true);
  await page.clock.runFor(200);
  await expectReadyPractice(page);
});

test("native context loss switches to fallback and preserves ready practice", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const opening = await firstOpening(page);
  const { canvas } = await realScene(page);
  const canLoseContext = await canvas.evaluate((element) =>
    Boolean(
      (element as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context"),
    ),
  );
  test.skip(
    !canLoseContext,
    "UNVERIFIED: this native WebGL2 runner has no WEBGL_lose_context extension.",
  );
  await canvas.evaluate((element) =>
    (element as HTMLCanvasElement)
      .getContext("webgl2")!
      .getExtension("WEBGL_lose_context")!
      .loseContext(),
  );
  await expect(opening).toHaveAttribute("data-renderer", "fallback");
  await expect
    .poll(
      async () =>
        JSON.parse((await canvas.getAttribute("data-scene"))!).contextLost,
    )
    .toBe(true);
  await expect(opening.locator(".awakening-fallback")).toBeVisible();
  await page.keyboard.press("a");
  await page.clock.runFor(200);
  await expectReadyPractice(page);
});

test("five full reload cycles close their native canvas resources before entry", async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const records: Array<{ disposed: boolean; lost: boolean }> = [];
    const seen = new WeakSet<object>();
    Object.assign(window, { openingContextRecords: records });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      const result = Reflect.apply(original, this, [type, ...args]);
      if (
        type === "webgl2" &&
        result &&
        this.classList.contains("awakening-canvas") &&
        !seen.has(result)
      ) {
        seen.add(result);
        const record = { disposed: false, lost: false };
        records.push(record);
        this.addEventListener(
          "webglcontextlost",
          () => {
            record.lost = true;
          },
          { once: true },
        );
        const observer = new MutationObserver(() => {
          const state = this.dataset.scene;
          if (state && JSON.parse(state).disposed) {
            record.disposed = true;
            observer.disconnect();
          }
        });
        observer.observe(this, {
          attributes: true,
          attributeFilter: ["data-scene"],
        });
      }
      return result;
    } as typeof original;
  });
  await firstOpening(page);
  const cycles: Array<{
    cycle: number;
    records: Array<{ disposed: boolean; lost: boolean }>;
  }> = [];
  for (let cycle = 0; cycle < 5; cycle++) {
    if (cycle > 0) {
      await page.evaluate(
        (key) => sessionStorage.removeItem(key),
        INTRO_SEEN_SESSION_KEY,
      );
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("opening-experience")).toHaveAttribute(
        "data-mode",
        "full",
      );
    }
    await realScene(page);
    await page.keyboard.press("a");
    await page.clock.runFor(200);
    await expectReadyPractice(page);
    const records = await page.evaluate(
      () =>
        (
          window as unknown as {
            openingContextRecords: Array<{ disposed: boolean; lost: boolean }>;
          }
        ).openingContextRecords,
    );
    expect(records).toHaveLength(1);
    expect(records[0].disposed).toBe(true);
    cycles.push({ cycle: cycle + 1, records });
  }
  info.annotations.push({
    type: "limitation",
    description:
      "Native creation and explicit disposal receipts verified; this is not a universal GPU-memory or garbage-collection guarantee.",
  });
  await info.attach("native-context-disposal-cycles", {
    body: JSON.stringify(cycles, null, 2),
    contentType: "application/json",
  });
});
