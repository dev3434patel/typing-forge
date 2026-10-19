import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { focusTyping } from "./helpers";
import { waitForLayoutFonts } from "./layout-fonts";
import { selectDocumentOpeningRenderer } from "./opening-renderer";

const PREFERENCES_KEY = "typingforge:v3:guest:preferences";
const VIEWPORTS = [
  { name: "360px phone", width: 360, height: 800 },
  { name: "390px phone", width: 390, height: 844 },
  { name: "768px tablet", width: 768, height: 1024 },
  { name: "1024px tablet", width: 1024, height: 768 },
  { name: "1280px desktop", width: 1280, height: 800 },
  { name: "1440px desktop", width: 1440, height: 900 },
  { name: "1920px desktop", width: 1920, height: 1080 },
  { name: "2560px desktop", width: 2560, height: 1440 },
  { name: "844px phone landscape", width: 844, height: 390 },
  { name: "640px 200% zoom equivalent", width: 640, height: 450 },
] as const;

async function pauseClock(page: Page) {
  await selectDocumentOpeningRenderer(page);
  const installedAt = new Date();
  await page.clock.install({ time: installedAt });
  // Pause the known clock before navigation creates product timers. A 25ms
  // browser-read/RPC gap can already be in the past on a busy host.
  await page.clock.pauseAt(new Date(installedAt.getTime() + 60_000));
}

async function expectNoHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return {
      viewport,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      sectionsOutsideViewport: Array.from(
        document.querySelectorAll("header, main, footer"),
      )
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 && (rect.left < -1 || rect.right > viewport + 1)
          );
        })
        .map((element) => element.tagName),
    };
  });
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.body).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.sectionsOutsideViewport).toEqual([]);
  return geometry;
}

async function expectIntroFits(page: Page) {
  const opening = page.getByTestId("opening-experience");
  const geometry = await opening.evaluate((element) => {
    const selectors = [
      ".awakening-title",
      ".awakening-caption",
      ".awakening-coordinates",
      ".awakening-controls",
      ".awakening-actions",
      ".awakening-actions button",
    ];
    const rect = (node: Element) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      opening: rect(element),
      elements: selectors.flatMap((selector) =>
        Array.from(element.querySelectorAll(selector)).map((node) => ({
          selector,
          ...rect(node),
        })),
      ),
      caption: rect(element.querySelector(".awakening-caption")!),
      controls: rect(element.querySelector(".awakening-controls")!),
    };
  });
  expect(geometry.opening.left).toBe(0);
  expect(geometry.opening.top).toBe(0);
  // Windows WebKit can expose fractional CSS bounds beside integer viewport APIs.
  expect(
    Math.abs(geometry.opening.width - geometry.viewport.width),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(geometry.opening.height - geometry.viewport.height),
  ).toBeLessThanOrEqual(1);
  for (const item of geometry.elements) {
    expect(item.left, item.selector).toBeGreaterThanOrEqual(-1);
    expect(item.top, item.selector).toBeGreaterThanOrEqual(-1);
    expect(item.right, item.selector).toBeLessThanOrEqual(
      geometry.viewport.width + 1,
    );
    expect(item.bottom, item.selector).toBeLessThanOrEqual(
      geometry.viewport.height + 1,
    );
    if (item.selector === ".awakening-actions button")
      expect(Math.round(item.height)).toBeGreaterThanOrEqual(44);
  }
  expect(geometry.caption.bottom + 4).toBeLessThanOrEqual(
    geometry.controls.top,
  );
  await expectNoHorizontalOverflow(page);
  return geometry;
}

async function expectMeasuredCaret(page: Page) {
  const viewport = page.getByTestId("typing-viewport");
  await expect(viewport.locator(":scope > .forge-caret")).toBeVisible();
  await expect
    .poll(() =>
      viewport.evaluate((element) => {
        const frame = element.getBoundingClientRect();
        const caret = element
          .querySelector(":scope > .forge-caret")!
          .getBoundingClientRect();
        const marker = element
          .querySelector('.typing-text [data-current="true"]')
          ?.getClientRects()[0];
        if (!marker) return false;
        return (
          element.querySelectorAll(".typing-text .forge-caret").length === 0 &&
          caret.width > 0 &&
          caret.height > 0 &&
          caret.left >= frame.left - 1 &&
          caret.right <= frame.right + 1 &&
          caret.top >= frame.top - 1 &&
          caret.bottom <= frame.bottom + 1 &&
          Math.abs(caret.left - marker.left) <= 1 &&
          Math.abs(caret.top - marker.top) <= 1
        );
      }),
    )
    .toBe(true);
  const caret = (await viewport
    .locator(":scope > .forge-caret")
    .boundingBox())!;
  const frame = (await viewport.boundingBox())!;
  return {
    ...caret,
    relativeX: caret.x - frame.x,
    relativeY: caret.y - frame.y,
  };
}

async function inspectTypingAndRestart(page: Page) {
  const input = await focusTyping(page);
  const target = page.getByTestId("typing-target");
  const session = page.getByRole("region", {
    name: "Typing session",
    exact: true,
  });
  await waitForLayoutFonts(page, () => page.clock.runFor(50));
  await expect(session).toHaveAttribute("data-status", "ready");
  const originalText = await target.textContent();
  const originalId = await session.getAttribute("data-session-id");
  const initialCaret = await expectMeasuredCaret(page);
  const first = target.locator('[data-slot-index="0"]');
  const expected = await first.getAttribute("data-expected");
  const wrong = expected === "x" ? "z" : "x";
  await input.pressSequentially(wrong);
  await expect(input).toHaveValue(wrong);
  await expect(first).toHaveAttribute("data-status", "incorrect");
  await expect(first.locator("[data-typed-glyph]")).toHaveText(wrong);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute(
    "data-slot-index",
    "1",
  );
  await page.clock.runFor(100);
  const wrongCaret = await expectMeasuredCaret(page);
  expect(wrongCaret!.x).toBeGreaterThan(initialCaret!.x);
  const inputRect = (await input.boundingBox())!;
  const viewportRect = (await page
    .getByTestId("typing-viewport")
    .boundingBox())!;
  expect(Math.abs(inputRect.x - viewportRect.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(inputRect.width - viewportRect.width)).toBeLessThanOrEqual(1);
  await expectNoHorizontalOverflow(page);
  await input.press("Tab");
  const restart = page.getByRole("button", {
    name: "Restart with new text",
    exact: true,
  });
  await expect(restart).toBeFocused();
  await restart.press("Enter");
  await page.clock.runFor(100);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(session).toHaveAttribute("data-status", "ready");
  await expect(session).not.toHaveAttribute("data-session-id", originalId!);
  await expect(target).not.toHaveText(originalText!);
  await expect(target.locator("[data-typed]")).toHaveCount(0);
  const freshCaret = await expectMeasuredCaret(page);
  expect(
    Math.abs(freshCaret.relativeX - initialCaret.relativeX),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(freshCaret.relativeY - initialCaret.relativeY),
  ).toBeLessThanOrEqual(1);
  const next = await first.getAttribute("data-expected");
  await input.pressSequentially(next!);
  await expect(input).toHaveValue(next!);
  await expect(first).toHaveAttribute("data-status", "correct");
  await page.clock.runFor(100);
  await expectMeasuredCaret(page);
  const pageGeometry = await expectNoHorizontalOverflow(page);
  return { initialCaret, wrongCaret, freshCaret, inputRect, pageGeometry };
}

async function attachGeometry(info: TestInfo, geometry: unknown) {
  await info.attach("viewport-geometry", {
    body: JSON.stringify(geometry, null, 2),
    contentType: "application/json",
  });
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: intro, home, wrong-key caret and fresh restart fit`, async ({
    page,
  }, info) => {
    test.setTimeout(45_000);
    if (viewport.width === 640)
      info.annotations.push({
        type: "zoom-equivalence",
        description:
          "640×450 CSS pixels represent the layout viewport of 1280×900 at 200% zoom; this does not simulate browser chrome or physical mobile keyboards.",
      });
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((key) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 3,
          values: { reducedMotion: true, smoothCaret: false },
        }),
      );
    }, PREFERENCES_KEY);
    await pauseClock(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("opening-experience")).toHaveAttribute(
      "data-mode",
      "reduced",
    );
    const introGeometry = await expectIntroFits(page);
    await page.clock.fastForward(350);
    await page.clock.runFor(50);
    await expect(page.getByTestId("opening-experience")).toHaveCount(0);
    const practiceGeometry = await inspectTypingAndRestart(page);
    await attachGeometry(info, { viewport, introGeometry, practiceGeometry });
  });
}

test("390px full mobile fallback contains every key and keeps controls separate", async ({
  page,
}, info) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl2" ||
        type === "webgl" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await pauseClock(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const opening = page.getByTestId("opening-experience");
  await expect(opening).toHaveAttribute("data-mode", "full");
  await page.clock.runFor(100);
  await expect(opening).toHaveAttribute("data-renderer", "fallback", {
    timeout: 15_000,
  });
  await page.clock.fastForward(2750);
  // Freeze CSS motion at the assembled moment; inspect the fallback's actual layout.
  await opening.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 2900;
    }
  });
  const introGeometry = await expectIntroFits(page);
  const keys = opening.locator(".awakening-key");
  await expect(keys).toHaveCount(61);
  const keyGeometry = await keys.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        label: element.textContent,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    }),
  );
  for (const key of keyGeometry) {
    expect(key.left, key.label!).toBeGreaterThanOrEqual(-1);
    expect(key.right, key.label!).toBeLessThanOrEqual(
      introGeometry.viewport.width + 1,
    );
    expect(key.top, key.label!).toBeGreaterThanOrEqual(0);
    expect(key.bottom, key.label!).toBeLessThanOrEqual(
      introGeometry.controls.top,
    );
  }
  await info.attach("mobile-full-fallback", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
  await attachGeometry(info, { introGeometry, keyGeometry });
  await page.keyboard.press("a");
  await page.clock.runFor(200);
  await expect(
    page.getByRole("textbox", { name: "Typing input", exact: true }),
  ).toHaveValue("");
});
