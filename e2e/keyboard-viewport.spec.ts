import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { focusTyping } from "./helpers";

type ViewportCase = {
  width: number;
  height: number;
  fontSize: number;
};

async function setCssViewport(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  const actual = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  // Windows WebKit can apply host display scaling even to an empty page.
  // Calibrate the browser window, never the product CSS, so the test really
  // exercises the named CSS viewport at a visualViewport scale of one.
  if (
    Math.abs(actual.width - width) > 1 ||
    Math.abs(actual.height - height) > 1
  )
    await page.setViewportSize({
      width: Math.round((width * width) / actual.width),
      height: Math.round((height * height) / actual.height),
    });
  await expect
    .poll(() =>
      page.evaluate(
        ({ width, height }) =>
          Math.abs(innerWidth - width) <= 1 &&
          Math.abs(innerHeight - height) <= 1 &&
          (visualViewport?.scale ?? 1) === 1,
        { width, height },
      ),
    )
    .toBe(true);
}

/**
 * The update fixture follows pwa-notices.spec.ts: startPwa observes a real
 * EventTarget registration with a waiting worker and an existing controller.
 * Only the browser service-worker boundary is replaced. The production PWA
 * state, actual update banner, route layout and typing input all run normally.
 */
async function preparePage(
  page: Page,
  viewport: ViewportCase,
  updateAvailable: boolean,
) {
  await setCssViewport(page, viewport.width, viewport.height);
  await page.addInitScript(
    ({ fontSize, updateAvailable }) => {
      localStorage.setItem("sparowtype.opening-animation.enabled", "false");
      localStorage.setItem(
        "typingforge:v3:guest:preferences",
        JSON.stringify({
          fontSize,
          showKeyboard: true,
          showFingerGuide: true,
          language: "en",
          layout: "qwerty",
        }),
      );
      const registration = Object.assign(new EventTarget(), {
        installing: null,
        waiting: updateAvailable
          ? { state: "installed", postMessage: () => undefined }
          : null,
      });
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: Object.assign(new EventTarget(), {
          controller: {},
          register: async () => registration,
        }),
      });
    },
    { fontSize: viewport.fontSize, updateAvailable },
  );
  await page.goto("/");
  await expect(page.getByTestId("live-keyboard-board")).toBeVisible();
  const banner = page.getByRole("complementary", {
    name: "App availability",
    exact: true,
  });
  if (updateAvailable) {
    await expect(
      banner.getByRole("button", { name: "Reload to update", exact: true }),
    ).toBeVisible();
  } else {
    await expect(banner).toHaveCount(0);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  const input = await focusTyping(page);
  // Clicking an input may scroll it into view. The desktop contract is checked
  // from the initial document position, not from Playwright's automatic scroll.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(input).toBeFocused();
  return input;
}

async function layoutReceipt(page: Page) {
  return page.evaluate(() => {
    const keyboard = document.querySelector<HTMLElement>(
      '[data-testid="live-keyboard"]',
    )!;
    const board = document.querySelector<HTMLElement>(
      '[data-testid="live-keyboard-board"]',
    )!;
    const text = document.querySelector<HTMLElement>(
      '[data-testid="typing-target"]',
    )!;
    const viewport = document.querySelector<HTMLElement>(
      '[data-testid="typing-viewport"]',
    )!;
    const rect = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        height: bounds.height,
      };
    };
    const textStyle = getComputedStyle(text);
    const lineHeight = Number.parseFloat(textStyle.lineHeight);
    const textBounds = text.getBoundingClientRect();
    const viewportBounds = viewport.getBoundingClientRect();
    const visibleLines = new Set(
      [...text.querySelectorAll(".typing-character")]
        .map((element) => element.getBoundingClientRect())
        .filter(
          (bounds) =>
            bounds.width > 0 &&
            bounds.top >= viewportBounds.top - 1 &&
            bounds.bottom <= viewportBounds.bottom + 1,
        )
        .map((bounds) =>
          Math.round((bounds.top - textBounds.top) / lineHeight),
        ),
    ).size;
    const controls = [
      ...document.querySelectorAll<HTMLElement>(
        ".test-toolbar button, .test-toolbar select, .typing-controls button, .live-keyboard button, .typing-shortcut-help > summary, [aria-label='App availability'] button",
      ),
    ]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => ({
        label:
          element.getAttribute("aria-label") || element.textContent?.trim(),
        height: element.getBoundingClientRect().height,
      }));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      visualViewportScale: window.visualViewport?.scale ?? 1,
      devicePixelRatio,
      headerGroups: [...document.querySelectorAll("header > div > *")]
        .filter((element) => element.getClientRects().length > 0)
        .map(rect),
      scrollY,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      keyboard: rect(keyboard),
      board: rect(board),
      feedback: rect(keyboard.querySelector(".live-keyboard-feedback")!),
      caption: rect(keyboard.querySelector(".live-keyboard-caption")!),
      rows: board.querySelectorAll(".live-keyboard-row").length,
      keys: board.querySelectorAll("[data-key-code]").length,
      keyLabelsOutsideCaps: [
        ...board.querySelectorAll<HTMLElement>(".live-key-label"),
      ]
        .filter((label) => {
          const key = label.closest<HTMLElement>(".live-key")!;
          const bounds = key.getBoundingClientRect();
          const content = label.getBoundingClientRect();
          const style = getComputedStyle(key);
          return (
            content.top <
              bounds.top + Number.parseFloat(style.borderTopWidth) - 1 ||
            content.bottom >
              bounds.bottom - Number.parseFloat(style.borderBottomWidth) + 1
          );
        })
        .map((label) => label.textContent),
      text: {
        fontSize: Number.parseFloat(textStyle.fontSize),
        lineHeight,
        viewportHeight: viewportBounds.height,
        visibleLines,
      },
      controls,
    };
  });
}

type LayoutReceipt = Awaited<ReturnType<typeof layoutReceipt>>;

function checkSharedContract(
  receipt: LayoutReceipt,
  fontSize: number,
  state: string,
) {
  expect
    .soft(receipt.horizontalOverflow, `${state}: horizontal overflow`)
    .toBe(false);
  expect
    .soft(receipt.visualViewportScale, `${state}: 100% visual scale`)
    .toBe(1);
  for (let index = 1; index < receipt.headerGroups.length; index++)
    expect
      .soft(
        receipt.headerGroups[index - 1].right,
        `${state}: header groups do not overlap`,
      )
      .toBeLessThanOrEqual(receipt.headerGroups[index].left + 1);
  expect.soft(receipt.rows, `${state}: all five keyboard rows`).toBe(5);
  expect
    .soft(
      receipt.keyLabelsOutsideCaps,
      `${state}: legends stay inside keycap borders`,
    )
    .toEqual([]);
  expect
    .soft(receipt.keys, `${state}: complete ANSI reference`)
    .toBeGreaterThanOrEqual(61);
  expect
    .soft(receipt.board.left, `${state}: keyboard left edge`)
    .toBeGreaterThanOrEqual(0);
  expect
    .soft(receipt.board.right, `${state}: keyboard right edge`)
    .toBeLessThanOrEqual(receipt.viewport.width + 1);
  expect
    .soft(receipt.text.fontSize, `${state}: chosen text size is retained`)
    .toBe(fontSize);
  expect
    .soft(receipt.text.viewportHeight, `${state}: three full text lines`)
    .toBeGreaterThanOrEqual(receipt.text.lineHeight * 3 - 1);
  expect
    .soft(
      receipt.text.visibleLines,
      `${state}: passage contains three visible lines`,
    )
    .toBeGreaterThanOrEqual(3);
  for (const control of receipt.controls)
    expect
      .soft(control.height, `${state}: 44px ${control.label} control`)
      .toBeGreaterThanOrEqual(43.99);
}

async function attachReceipts(info: TestInfo, receipts: unknown[]) {
  await info.attach("keyboard-viewport-layout", {
    body: JSON.stringify(receipts, null, 2),
    contentType: "application/json",
  });
}

const desktopViewports: ViewportCase[] = [
  { width: 1440, height: 900, fontSize: 26 },
  { width: 1366, height: 768, fontSize: 26 },
  { width: 1280, height: 720, fontSize: 26 },
  { width: 1240, height: 720, fontSize: 26 },
  { width: 1536, height: 864, fontSize: 26 },
  { width: 1920, height: 900, fontSize: 26 },
  { width: 1810, height: 900, fontSize: 26 },
];

for (const { width, height } of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 844 },
]) {
  test(`consolidated controls and shortcut help remain usable at ${width}x${height}`, async ({
    page,
  }) => {
    await preparePage(page, { width, height, fontSize: 26 }, true);
    const help = page.locator('summary[aria-label="Typing shortcuts"]');
    await help.click();
    const panel = page.locator(".typing-shortcut-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Tab → Enter restarts");
    await panel.locator("p").first().click();
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    await page.evaluate(() => {
      const toolbar = document.querySelector(".live-keyboard-toolbar")!;
      window.scrollBy(0, toolbar.getBoundingClientRect().top - 4);
    });
    await expect
      .poll(async () => (await panel.boundingBox())?.y ?? -1)
      .toBeGreaterThanOrEqual(0);
    await setCssViewport(page, width, height - 80);
    await expect
      .poll(async () => {
        const position = await panel.boundingBox();
        return (
          !!position &&
          position.y >= 0 &&
          position.y + position.height <= height - 80
        );
      })
      .toBe(true);
    await setCssViewport(page, width, height);
    await help.press("Escape");
    await expect(panel).not.toBeVisible();
    await expect(help).toBeFocused();
    await page
      .getByRole("button", { name: "Hide keyboard", exact: true })
      .click();
    await expect(page.getByTestId("live-keyboard-board")).toHaveCount(0);
    const session = page.getByRole("region", {
      name: "Typing session",
      exact: true,
    });
    const previousId = await session.getAttribute("data-session-id");
    await page
      .getByRole("button", { name: "Restart with new text", exact: true })
      .click();
    await expect(session).not.toHaveAttribute("data-session-id", previousId!);
    await page
      .getByRole("button", { name: "Show keyboard", exact: true })
      .click();
    await expect(page.getByTestId("live-keyboard-board")).toBeVisible();
    const input = await focusTyping(page);
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
    await input.press("Tab");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
  });
}

for (const viewport of desktopViewports) {
  for (const updateAvailable of [false, true]) {
    test(`whole keyboard and feedback fit ${viewport.width}x${viewport.height} at 100% ${updateAvailable ? "with" : "without"} update banner`, async ({
      page,
    }, info) => {
      const input = await preparePage(page, viewport, updateAvailable);
      const receipts: unknown[] = [];
      async function inspect(state: string) {
        const receipt = await layoutReceipt(page);
        receipts.push({ state, updateAvailable, ...receipt });
        checkSharedContract(receipt, viewport.fontSize, state);
        expect
          .soft(receipt.scrollY, `${state}: no initial scrolling needed`)
          .toBe(0);
        expect
          .soft(
            receipt.keyboard.top,
            `${state}: keyboard toolbar remains onscreen`,
          )
          .toBeGreaterThanOrEqual(0);
        expect
          .soft(
            receipt.keyboard.bottom,
            `${state}: whole keyboard including captions`,
          )
          .toBeLessThanOrEqual(receipt.viewport.height);
        expect
          .soft(
            receipt.feedback.bottom,
            `${state}: next and actual key feedback`,
          )
          .toBeLessThanOrEqual(receipt.viewport.height);
        expect
          .soft(
            receipt.caption.bottom,
            `${state}: keyboard explanation and legend`,
          )
          .toBeLessThanOrEqual(receipt.viewport.height);
        await expect(input).toBeFocused();
      }
      try {
        await inspect("ready");
        const expected = await page
          .locator('[data-current="true"][data-expected]')
          .first()
          .getAttribute("data-expected");
        expect(expected).toBeTruthy();
        const wrong = expected === "x" ? "q" : "x";
        await input.pressSequentially(wrong);
        await expect(page.getByTestId("keyboard-last-input")).toContainText(
          `Typed ${wrong}`,
        );
        await expect(page.getByTestId("typing-feedback")).toContainText(
          "You typed",
        );
        await inspect("incorrect-input");
        await input.press("Backspace");
        await input.pressSequentially(expected!);
        await expect(page.getByTestId("typing-feedback")).toContainText(
          "Keep going.",
        );
        await inspect("running-corrected");
      } finally {
        await attachReceipts(info, receipts);
      }
    });
  }
}

const scrollingViewports: ViewportCase[] = [
  { width: 1440, height: 900, fontSize: 40 },
  { width: 390, height: 844, fontSize: 26 },
  { width: 844, height: 390, fontSize: 26 },
];

for (const viewport of scrollingViewports) {
  for (const updateAvailable of [false, true]) {
    test(`all keyboard rows stay reachable by normal scrolling at ${viewport.width}x${viewport.height}, font ${viewport.fontSize}, ${updateAvailable ? "with" : "without"} update banner`, async ({
      page,
    }, info) => {
      const input = await preparePage(page, viewport, updateAvailable);
      const receipts: unknown[] = [];
      try {
        const initial = await layoutReceipt(page);
        receipts.push({ state: "initial", updateAvailable, ...initial });
        checkSharedContract(initial, viewport.fontSize, "scrolling layout");
        const reachables = page.locator(
          ".live-keyboard-row, .live-keyboard-feedback, .live-keyboard-caption",
        );
        await expect(reachables).toHaveCount(7);
        for (const element of await reachables.all()) {
          await element.scrollIntoViewIfNeeded();
          const visible = await element.evaluate((target) => {
            const bounds = target.getBoundingClientRect();
            const x = bounds.left + bounds.width / 2;
            const y = bounds.top + bounds.height / 2;
            const hit = document.elementFromPoint(x, y);
            const clippingAncestors: string[] = [];
            for (
              let ancestor = target.parentElement;
              ancestor &&
              ancestor !== document.body &&
              ancestor !== document.documentElement;
              ancestor = ancestor.parentElement
            ) {
              const style = getComputedStyle(ancestor);
              if (!/(?:hidden|clip|auto|scroll)/.test(style.overflowY))
                continue;
              const clip = ancestor.getBoundingClientRect();
              if (bounds.top < clip.top - 1 || bounds.bottom > clip.bottom + 1)
                clippingAncestors.push(ancestor.className);
            }
            return {
              className: target.className,
              top: bounds.top,
              bottom: bounds.bottom,
              left: bounds.left,
              right: bounds.right,
              viewportHeight: innerHeight,
              viewportWidth: innerWidth,
              documentScrollY: scrollY,
              hit: !!hit && (target === hit || target.contains(hit)),
              clippingAncestors,
              internalScrollers: [
                ...document.querySelectorAll<HTMLElement>(
                  ".live-keyboard, .live-keyboard-board, .live-keyboard-keys",
                ),
              ]
                .filter(
                  (container) =>
                    container.scrollHeight > container.clientHeight + 1 &&
                    /(?:hidden|clip|auto|scroll)/.test(
                      getComputedStyle(container).overflowY,
                    ),
                )
                .map((container) => container.className),
            };
          });
          receipts.push(visible);
          expect
            .soft(visible.top, `${visible.className}: reachable top`)
            .toBeGreaterThanOrEqual(-1);
          expect
            .soft(visible.bottom, `${visible.className}: reachable bottom`)
            .toBeLessThanOrEqual(visible.viewportHeight + 1);
          expect
            .soft(visible.left, `${visible.className}: left edge`)
            .toBeGreaterThanOrEqual(-1);
          expect
            .soft(visible.right, `${visible.className}: right edge`)
            .toBeLessThanOrEqual(visible.viewportWidth + 1);
          expect
            .soft(visible.hit, `${visible.className}: unobscured content`)
            .toBe(true);
          expect
            .soft(
              visible.clippingAncestors,
              `${visible.className}: no clipped ancestor`,
            )
            .toEqual([]);
          expect
            .soft(
              visible.internalScrollers,
              "scroll the document, not a cropped keyboard",
            )
            .toEqual([]);
        }
        const scrollPolicy = await page.evaluate(() => ({
          root: getComputedStyle(document.documentElement).overflowY,
          body: getComputedStyle(document.body).overflowY,
          height: document.documentElement.scrollHeight,
          viewport: innerHeight,
        }));
        receipts.push({ scrollPolicy });
        expect.soft(scrollPolicy.root).not.toMatch(/^(?:hidden|clip)$/);
        expect.soft(scrollPolicy.body).not.toMatch(/^(?:hidden|clip)$/);
        await input.focus();
        await expect(input).toBeFocused();
        await input.pressSequentially("x");
        await expect(input).toHaveValue("x");
        await expect(
          page.getByTestId("live-keyboard-board").locator(".live-keyboard-row"),
        ).toHaveCount(5);
      } finally {
        await attachReceipts(info, receipts);
      }
    });
  }
}
