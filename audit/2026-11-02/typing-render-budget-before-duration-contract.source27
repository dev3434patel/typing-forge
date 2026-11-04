import { expect, test } from "@playwright/test";
import { customPractice, exportedResult } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
});

test("key feedback borders match their state immediately while press motion and settled bounds remain", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const input = await customPractice(page, "as");
  const board = page.getByTestId("live-keyboard-board");
  const wrong = board.locator('[data-key-code="KeyX"]');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const board = document.querySelector('[data-testid="live-keyboard-board"]')!;
    const wrong = board.querySelector<HTMLElement>('[data-key-code="KeyX"]')!;
    const correct = board.querySelector<HTMLElement>('[data-key-code="KeyA"]')!;
    const probe = document.createElement("span");
    probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none";
    document.body.append(probe);
    const color = (token: string) => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color; };
    const expected = { error: color("--forge-error"), errorSurface: color("--forge-errorSurface"), accent: color("--forge-accent"), border: color("--forge-borderStrong"), surface: color("--forge-surface") };
    probe.remove();
    const bounds = (node: HTMLElement) => {
      const key = node.getBoundingClientRect(), row = node.parentElement!.getBoundingClientRect();
      return { width: key.width, height: key.height, offsetTop: key.top - row.top };
    };
    const sample = (node: HTMLElement) => {
      const style = getComputedStyle(node);
      return { border: style.borderTopColor, background: style.backgroundColor,
        animations: node.getAnimations().map(animation => ({ property: "transitionProperty" in animation ? String(animation.transitionProperty) : "other", duration: animation.effect?.getComputedTiming().duration })) };
    };
    const receipt = { wrong: null as ReturnType<typeof sample> | null, cleared: null as ReturnType<typeof sample> | null, correct: null as ReturnType<typeof sample> | null };
    const observer = new MutationObserver(() => {
      // Sample in the actual DOM-update microtask, before IPC waits can let a
      // stale border interpolation finish and conceal delayed feedback.
      if (!receipt.wrong && wrong.dataset.pressedKey === "true" && wrong.dataset.incorrectKey === "true") receipt.wrong = sample(wrong);
      if (receipt.wrong && !receipt.cleared && !wrong.hasAttribute("data-pressed-key") && !wrong.hasAttribute("data-incorrect-key")) receipt.cleared = sample(wrong);
      if (!receipt.correct && correct.dataset.pressedKey === "true" && correct.dataset.lastInput === "true") receipt.correct = sample(correct);
    });
    observer.observe(board, { subtree: true, attributes: true, attributeFilter: ["data-pressed-key", "data-incorrect-key", "data-last-input"] });
    Object.assign(window, { immediateKeyReceipt: { expected, receipt, observer, baseline: bounds(wrong), bounds, wrong } });
  });
  try {
    await page.keyboard.down("x");
    await expect(input).toHaveValue("x");
    await expect.poll(() => wrong.evaluate(node => {
      const transform = getComputedStyle(node).transform;
      return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
    })).toBeCloseTo(2, 2);
    await page.keyboard.up("x");
    await input.press("Backspace");
    await expect(input).toHaveValue("");
    await expect.poll(() => wrong.evaluate(node => {
      const transform = getComputedStyle(node).transform;
      return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
    })).toBeCloseTo(0, 2);
    await page.keyboard.down("a");
    await expect(input).toHaveValue("a");
    await page.keyboard.up("a");
    const observed = await page.evaluate(() => {
      const value = (window as Window & { immediateKeyReceipt: {
        expected: Record<string, string>; receipt: Record<string, { border: string; background: string; animations: Array<{ property: string; duration: number | string | null }> }>;
        baseline: { width: number; height: number; offsetTop: number }; bounds: (node: HTMLElement) => { width: number; height: number; offsetTop: number }; wrong: HTMLElement;
      } }).immediateKeyReceipt;
      return { expected: value.expected, receipt: value.receipt, baseline: value.baseline, settled: value.bounds(value.wrong) };
    });
    expect(observed.receipt.wrong.border).toBe(observed.expected.error);
    expect(observed.receipt.wrong.background).toBe(observed.expected.errorSurface);
    expect(observed.receipt.cleared.border).toBe(observed.expected.border);
    expect(observed.receipt.cleared.background).toBe(observed.expected.surface);
    expect(observed.receipt.correct.border).toBe(observed.expected.accent);
    expect(observed.receipt.correct.background).toBe(observed.expected.accent);
    expect(observed.receipt.wrong.animations).toContainEqual({ property: "transform", duration: 90 });
    for (const dimension of ["width", "height", "offsetTop"] as const)
      expect(Math.abs(observed.settled[dimension] - observed.baseline[dimension])).toBeLessThanOrEqual(0.02);
    await input.press("s");
    const result = await exportedResult(page);
    expect(result.finalText).toBe("as");
    expect(result.metrics.insertionAttempts).toBe(3);
    expect(result.metrics.incorrectAttempts).toBe(1);
    expect(result.metrics.inputAccuracy).toBeCloseTo(200 / 3, 8);
  } finally {
    await page.evaluate(() => (window as Window & { immediateKeyReceipt: { observer: MutationObserver } }).immediateKeyReceipt.observer.disconnect());
  }
});

test("ordinary physical chords update their key leaves without remapping the keyboard", async ({ page }) => {
  const input = await customPractice(page, "cat dog");
  await input.press("c"); // Establish observed Caps Lock state before the budget.
  const board = page.getByTestId("live-keyboard-board");
  await expect(input).toHaveValue("c");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const textarea = document.querySelector('textarea[aria-label="Typing input"]')!;
    const native = Array.prototype.map;
    const receipt = { firstRowMaps: 0 };
    // The existing physical row is the same14-key Backquote...Backspace model
    // in all layouts. Count the real mapper without changing any result.
    Array.prototype.map = function (this: unknown[], ...args: Parameters<typeof native>) {
      if (this.length === 14 &&
        (this[0] as { code?: string } | undefined)?.code === "Backquote" &&
        (this[13] as { code?: string } | undefined)?.code === "Backspace") receipt.firstRowMaps++;
      return Reflect.apply(native, this, args);
    };
    const preventTyping = (event: Event) => {
      if (["KeyF", "KeyJ"].includes((event as KeyboardEvent).code)) event.preventDefault();
    };
    // Keep this a physical-only flow, with native key events still propagating
    // to the real guide observer. No canonical text or scoring event is forged.
    textarea.addEventListener("keydown", preventTyping, true);
    Object.assign(window, { physicalLeafReceipt: { receipt, native, textarea, preventTyping } });
  });
  let maps = -1;
  try {
    await page.keyboard.down("f");
    await expect(board.locator('[data-key-code="KeyF"]')).toHaveAttribute("data-pressed-key", "true");
    await page.keyboard.down("j");
    await expect(board.locator('[data-key-code="KeyJ"]')).toHaveAttribute("data-pressed-key", "true");
    await page.keyboard.up("f");
    await expect(board.locator('[data-key-code="KeyF"]')).not.toHaveAttribute("data-pressed-key");
    await expect(board.locator('[data-key-code="KeyJ"]')).toHaveAttribute("data-pressed-key", "true");
    await page.keyboard.up("j");
    await expect(board.locator("[data-pressed-key]")).toHaveCount(0);
    await expect(input).toHaveValue("c");
    maps = await page.evaluate(() => (window as Window & {
      physicalLeafReceipt: { receipt: { firstRowMaps: number } };
    }).physicalLeafReceipt.receipt.firstRowMaps);
  } finally {
    await page.evaluate(() => {
      const value = (window as Window & { physicalLeafReceipt: {
        native: typeof Array.prototype.map; textarea: Element; preventTyping: EventListener;
      } }).physicalLeafReceipt;
      Array.prototype.map = value.native;
      value.textarea.removeEventListener("keydown", value.preventTyping, true);
    });
  }
  expect(maps).toBe(0);
  await input.pressSequentially("at dog");
  const result = await exportedResult(page);
  expect(result.finalText).toBe("cat dog");
  expect(result.metrics.insertionAttempts).toBe(7);
  expect(result.metrics.inputAccuracy).toBe(100);
});

test("native canonical letters remap only rows with changed expected or actual keys", async ({ page }) => {
  const input = await customPractice(page, "asdf jkl;");
  const board = page.getByTestId("live-keyboard-board");
  await input.press("a");
  await expect(board.locator('[data-key-code="KeyA"]')).toHaveAttribute("data-last-input", "true");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const native = Array.prototype.map;
    const rowStarts = ["Backquote", "Tab", "CapsLock", "ShiftLeft", "ControlLeft"];
    const receipt: Record<string, number> = Object.fromEntries(rowStarts.map((code) => [code, 0]));
    Array.prototype.map = function (this: unknown[], ...args: Parameters<typeof native>) {
      const first = this[0] as { code?: string; width?: number } | undefined;
      if (first?.code && typeof first.width === "number" && rowStarts.includes(first.code)) receipt[first.code]++;
      return Reflect.apply(native, this, args);
    };
    Object.assign(window, { canonicalRowReceipt: { receipt, native } });
  });
  let maps: Record<string, number> = {};
  try {
    await input.pressSequentially("sdf ");
    // The home row clears its expected letter while Space is prescribed and
    // pressed. It must not retain old expected/actual decoration after crossing.
    await expect(board.locator('[data-key-code="Space"]')).toHaveAttribute("data-last-input", "true");
    await expect(board.locator('[data-key-code="Space"]')).not.toHaveAttribute("data-expected-key");
    await expect(board.locator('[data-key-code="KeyJ"]')).toHaveAttribute("data-expected-key", "true");
    await expect(board.locator('[data-key-code="KeyF"]')).not.toHaveAttribute("data-last-input");
    await input.press("j");
    await expect(input).toHaveValue("asdf j");
    await expect(board.locator('[data-key-code="KeyJ"]')).toHaveAttribute("data-last-input", "true");
    await expect(board.locator('[data-key-code="Space"]')).not.toHaveAttribute("data-last-input");
    maps = await page.evaluate(() => (window as Window & {
      canonicalRowReceipt: { receipt: Record<string, number> };
    }).canonicalRowReceipt.receipt);
  } finally {
    await page.evaluate(() => {
      const value = (window as Window & { canonicalRowReceipt: { native: typeof Array.prototype.map } }).canonicalRowReceipt;
      Array.prototype.map = value.native;
    });
  }
  expect(maps.CapsLock).toBeGreaterThan(0); // Positive mapping control.
  expect(maps.ControlLeft).toBeGreaterThan(0); // Actual Space row changed.
  expect(maps.Backquote).toBe(0);
  expect(maps.Tab).toBe(0);
  expect(maps.ShiftLeft).toBe(0);
  await input.pressSequentially("kl;");
  const result = await exportedResult(page);
  expect(result.finalText).toBe("asdf jkl;");
  expect(result.metrics.insertionAttempts).toBe(9);
  expect(result.metrics.inputAccuracy).toBe(100);
});

test("physical guide feedback and clock ticks leave the unchanged passage alone", async ({
  page,
}) => {
  const input = await customPractice(page, "calm hands build steady rhythm");
  await input.press("c");
  await expect(
    page.getByTestId("typing-target").locator('[data-slot-index="0"]'),
  ).toHaveAttribute("data-status", "correct");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const field = document.querySelector('[data-testid="typing-target"]')!;
    const receipt = { mutations: 0 };
    const observer = new MutationObserver((records) => {
      receipt.mutations += records.length;
    });
    observer.observe(field, {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true,
    });
    Object.assign(window, { passageRenderReceipt: { receipt, observer } });
  });
  await input.press("Shift");
  // Several real presentation ticks must keep the same target DOM. They still
  // update elapsed time and WPM outside the passage.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const value = (
            window as Window & {
              passageRenderReceipt: { receipt: { mutations: number } };
            }
          ).passageRenderReceipt.receipt.mutations;
          return value;
        }),
      { intervals: [300, 300, 300] },
    )
    .toBe(0);
  await page.waitForTimeout(400);
  const mutations = await page.evaluate(() => {
    const value = (
      window as Window & {
        passageRenderReceipt: {
          receipt: { mutations: number };
          observer: MutationObserver;
        };
      }
    ).passageRenderReceipt;
    value.observer.disconnect();
    return value.receipt.mutations;
  });
  expect(mutations).toBe(0);
  await input.pressSequentially("alm hands build steady rhythm");
  const result = await exportedResult(page);
  expect(result.finalText).toBe("calm hands build steady rhythm");
  expect(result.metrics.inputAccuracy).toBe(100);
  expect(result.metrics.insertionAttempts).toBe(30);
});

test("following a wrapped correct word keeps native glyph anchors through internal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const word = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz";
  const input = await customPractice(page, `${word} end`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await input.press("a");
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const target = document.querySelector('[data-testid="typing-target"]')!;
    const native = Element.prototype.getClientRects;
    const receipt = { reads: 0 };
    Element.prototype.getClientRects = function () {
      if (this.hasAttribute("data-slot-index") && target.contains(this)) receipt.reads++;
      return native.call(this);
    };
    Object.assign(window, { caretScrollReceipt: { receipt, native } });
  });
  await input.pressSequentially(word.slice(1, 47));
  const observed = await page.evaluate(() => {
    const value = (window as Window & {
      caretScrollReceipt: { receipt: { reads: number }; native: typeof Element.prototype.getClientRects };
    }).caretScrollReceipt;
    Element.prototype.getClientRects = value.native;
    const target = document.querySelector('[data-testid="typing-target"]')!;
    const viewport = target.parentElement!;
    const current = target.querySelector('[data-current="true"]')!.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    return { reads: value.receipt.reads, scrollTop: viewport.scrollTop,
      contained: current.top >= bounds.top - 1 && current.bottom <= bounds.bottom + 1 };
  });
  expect(observed.scrollTop).toBeGreaterThan(0);
  expect(observed.contained).toBe(true);
  expect(observed.reads).toBe(0);
  await expect(input).toHaveValue(word.slice(0, 47));
  await input.pressSequentially(`${word.slice(47)} end`);
  const result = await exportedResult(page);
  expect(result.finalText).toBe(`${word} end`);
  expect(result.metrics.insertionAttempts).toBe(word.length + 4);
  expect(result.metrics.inputAccuracy).toBe(100);
});
