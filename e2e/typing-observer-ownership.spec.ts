import { expect, test, type Page } from "@playwright/test";
import { exportedResult, focusTyping } from "./helpers";

interface ObserverReceipt {
  id: number;
  kind: "learn" | "race";
  disconnectCalls: number;
}
interface OwnershipReceipts {
  observers: ObserverReceipt[];
  scrollAdds: number;
  scrollRemoves: number;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sparowtype.opening-animation.enabled", "false");
    const receipts: OwnershipReceipts = {
      observers: [],
      scrollAdds: 0,
      scrollRemoves: 0,
    };
    Object.assign(window, { typingFlowOwnership: receipts });
    const NativeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends NativeObserver {
      receipt?: ObserverReceipt;
      observe(target: Element, options?: ResizeObserverOptions) {
        const kind = target.classList.contains("learn-stream")
          ? "learn"
          : target.getAttribute("data-testid") === "typing-viewport"
            ? "race"
            : null;
        if (kind && !this.receipt) {
          this.receipt = {
            id: receipts.observers.length + 1,
            kind,
            disconnectCalls: 0,
          };
          receipts.observers.push(this.receipt);
        }
        super.observe(target, options);
      }
      disconnect() {
        if (this.receipt) this.receipt.disconnectCalls++;
        super.disconnect();
      }
    };
    const originalAdd = Element.prototype.addEventListener;
    const originalRemove = Element.prototype.removeEventListener;
    Element.prototype.addEventListener = function (...args) {
      if (
        args[0] === "scroll" &&
        this.getAttribute("data-testid") === "typing-viewport"
      )
        receipts.scrollAdds++;
      return Reflect.apply(originalAdd, this, args);
    };
    Element.prototype.removeEventListener = function (...args) {
      if (
        args[0] === "scroll" &&
        this.getAttribute("data-testid") === "typing-viewport"
      )
        receipts.scrollRemoves++;
      return Reflect.apply(originalRemove, this, args);
    };
  });
});

function readOwnership(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(
        JSON.stringify(
          (window as Window & { typingFlowOwnership: OwnershipReceipts })
            .typingFlowOwnership,
        ),
      ) as OwnershipReceipts,
  );
}

async function expectContainedLearningCaret(page: Page) {
  await expect
    .poll(() =>
      page.locator(".learn-stream").evaluate((element) => {
        const viewport = element.getBoundingClientRect();
        const caret = element.querySelector<HTMLElement>(".learn-caret");
        if (!caret) return false;
        const rect = caret.getBoundingClientRect();
        return (
          rect.top >= viewport.top - 2 &&
          rect.bottom <= viewport.bottom + 2 &&
          rect.left >= viewport.left - 2 &&
          rect.right <= viewport.right + 2
        );
      }),
    )
    .toBe(true);
}

test("learning keeps one native layout observer through input, deletion and resize and cleans each real lesson stage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 780, height: 900 });
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", {
    name: "Type the practice text",
    exact: true,
  });
  await input.focus();
  const text = await page.locator("#lesson-passage").textContent();
  expect(text).toBeTruthy();
  const before = await readOwnership(page);
  expect(before.observers).toEqual([
    { id: 1, kind: "learn", disconnectCalls: 0 },
  ]);
  let count = Math.min(120, text!.length - 2);
  // Keep two editable characters in the current word; submitted words must
  // stay locked without weakening the observer/deletion geometry checks.
  while (count > 20 && text!.slice(0, count).split(" ").at(-1)!.length < 2)
    count--;
  expect(count).toBeGreaterThan(20);
  await input.pressSequentially(text!.slice(0, count), { delay: 3 });
  await expect(
    page.locator('.learn-stream [data-current="true"]'),
  ).toHaveAttribute("data-slot-index", String(count));
  await input.press("Backspace");
  await input.press("Backspace");
  await expect(
    page.locator('.learn-stream [data-current="true"]'),
  ).toHaveAttribute("data-slot-index", String(count - 2));
  await expect(page.locator(".learn-stream [data-typed]")).toHaveCount(
    count - 2,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expectContainedLearningCaret(page);
  expect(await readOwnership(page)).toEqual(before);

  await page
    .getByRole("button", { name: "Finish practice", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Session results", exact: true }),
  ).toBeVisible();
  expect((await readOwnership(page)).observers).toEqual([
    { id: 1, kind: "learn", disconnectCalls: 1 },
  ]);
  await page.getByRole("button", { name: "Next test", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(
    page.locator('.learn-stream [data-current="true"]'),
  ).toHaveAttribute("data-slot-index", "0");
  await expectContainedLearningCaret(page);
  const next = await readOwnership(page);
  expect(next.observers).toEqual([
    { id: 1, kind: "learn", disconnectCalls: 1 },
    { id: 2, kind: "learn", disconnectCalls: 0 },
  ]);
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: "Stats", exact: true })
    .click();
  await expect(input).toHaveCount(0);
  const after = await readOwnership(page);
  expect(after.observers).toEqual([
    { id: 1, kind: "learn", disconnectCalls: 1 },
    { id: 2, kind: "learn", disconnectCalls: 1 },
  ]);
  await test.info().attach("learning-native-observer-ownership", {
    contentType: "application/json",
    body: JSON.stringify({
      observedInputCharacters: count,
      deletedCharacters: 2,
      before,
      next,
      after,
    }),
  });
});

test("bot and user progress keep native resize and scroll subscriptions stable until leaving the race", async ({
  page,
}) => {
  await page.setViewportSize({ width: 780, height: 900 });
  await page.goto("/race");
  await page
    .getByRole("combobox", { name: "Difficulty", exact: true })
    .selectOption("pro");
  await page
    .getByRole("button", { name: "Start bot practice", exact: true })
    .click();
  const input = await focusTyping(page);
  const marker = page.getByTestId("opponent-caret");
  await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  await expect(marker).toHaveAttribute("data-position", "0");
  await expect(input).toHaveValue("");
  const text = await page.getByTestId("typing-target").textContent();
  const position = Math.min(100, text!.length - 2);
  const count = text![position - 1] === " " ? position - 1 : position;
  await input.pressSequentially(text!.slice(0, 1), { delay: 3 });
  await expect
    .poll(async () => Number(await marker.getAttribute("data-position")))
    .toBeGreaterThan(0);
  const initialPosition = Number(await marker.getAttribute("data-position"));
  const before = await readOwnership(page);
  expect(before.observers).toHaveLength(2);
  expect(
    before.observers.every(
      (receipt) => receipt.kind === "race" && receipt.disconnectCalls === 0,
    ),
  ).toBe(true);
  expect(before.scrollAdds).toBeGreaterThan(0);
  expect(before.scrollRemoves).toBe(0);
  await input.pressSequentially(text!.slice(1, count), { delay: 3 });
  await input.press("Backspace");
  await expect(input).toHaveValue(text!.slice(0, count - 1));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => Number(await marker.getAttribute("data-position")))
    .toBeGreaterThan(initialPosition);
  expect(await readOwnership(page)).toEqual(before);
  await page.getByRole("button", { name: "Leave race", exact: true }).click();
  await expect(marker).toHaveCount(0);
  const after = await readOwnership(page);
  expect(
    after.observers.every((receipt) => receipt.disconnectCalls === 1),
  ).toBe(true);
  expect(after.scrollRemoves).toBe(after.scrollAdds);
  await test.info().attach("race-native-observer-scroll-ownership", {
    contentType: "application/json",
    body: JSON.stringify({
      observedInputCharacters: count,
      initialPosition,
      before,
      after,
    }),
  });
});

test("Learn reuses measured glyph windows across spaces and preserves native caret geometry after font, error and rotation changes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn?language=en&layout=qwerty");
  const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  await input.focus();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)));
  });
  const text = (await page.locator("#lesson-passage").textContent())!;
  let count = Math.min(60, text.length - 20);
  // Exercise replacement inside a word and a serif-sensitive glyph. Some
  // letters have almost identical native widths in these two font families.
  // Keep the measured >0.5px font-change assertion meaningful on every engine.
  while (count > 20 && (!/^[ilrt]$/.test(text[count]) || !/^[A-Za-z]$/.test(text[count - 1]))) count--;
  expect(count).toBeGreaterThan(20);
  expect(text[count]).toMatch(/^[ilrt]$/);
  expect(text[count - 1]).toMatch(/^[A-Za-z]$/);
  expect(text.slice(1, count).split(" ").length).toBeGreaterThan(2);
  await input.pressSequentially(text.slice(0, 1));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const ownership = await readOwnership(page);
  await page.evaluate(() => {
    const original = Element.prototype.getBoundingClientRect;
    const receipt = { glyphReads: 0 };
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches(".learn-stream-text [data-slot-index]")) receipt.glyphReads++;
      return Reflect.apply(original, this, []);
    };
    Object.assign(window, { learnWindowReceipt: { receipt, restore: () => { Element.prototype.getBoundingClientRect = original; } } });
  });
  let nativeReadBudget = -1;
  try {
    await input.pressSequentially(text.slice(1, count), { delay: 3 });
    await expect(page.locator('.learn-stream [data-current="true"]')).toHaveAttribute("data-slot-index", String(count));
    nativeReadBudget = await page.evaluate(() =>
      (window as Window & { learnWindowReceipt: { receipt: { glyphReads: number } } }).learnWindowReceipt.receipt.glyphReads);
  } finally {
    if (!page.isClosed()) await page.evaluate(() =>
      (window as Window & { learnWindowReceipt?: { restore: () => void } }).learnWindowReceipt?.restore());
  }
  expect(nativeReadBudget, "Warm measured window must not reread glyph bounds at each correct character or space").toBe(0);
  await page.evaluate(() => {
    const receipt = { mutations: 0 }, text = document.querySelector(".learn-stream-text")!;
    const observer = new MutationObserver(records => { receipt.mutations += records.length; });
    observer.observe(text, { subtree: true, attributes: true, childList: true, characterData: true });
    Object.assign(window, { learnIdleReceipt: { receipt, observer } });
  });
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => {
    const probe = (window as Window & { learnIdleReceipt: { receipt: { mutations: number }; observer: MutationObserver } }).learnIdleReceipt;
    probe.observer.disconnect(); return probe.receipt.mutations;
  }), "Clock refreshes must leave unchanged passage and marker DOM alone").toBe(0);
  const geometry = async () => page.locator(".learn-stream").evaluate(container => {
    const current = container.querySelector<HTMLElement>('[data-current="true"]')!, caret = container.querySelector<HTMLElement>(".learn-caret")!;
    const glyph = current.getBoundingClientRect(), drawn = caret.getBoundingClientRect();
    return { dx: Math.abs(glyph.left - drawn.left), dy: Math.abs(glyph.top - drawn.top),
      dh: Math.abs(glyph.height - drawn.height), width: drawn.width, nativeWidth: glyph.width };
  });
  const expectNative = async () => {
    await expect.poll(async () => { const box = await geometry(); return Math.max(box.dx, box.dy, box.dh, Math.abs(box.width - 2)); }).toBeLessThan(0.75);
  };
  await expectNative();
  const originalWidth = (await geometry()).nativeWidth;
  await page.evaluate(() => document.documentElement.style.setProperty("--font-mono", "Georgia, serif"));
  await expect(page.locator(".learn-stream-text")).toHaveCSS("font-family", /Georgia/);
  await expectNative();
  expect(Math.abs((await geometry()).nativeWidth - originalWidth)).toBeGreaterThan(0.5);
  const wrong = text[count] === "x" ? "z" : "x";
  await input.pressSequentially(wrong);
  await expect(page.locator(`.learn-stream [data-slot-index="${count}"]`)).toHaveAttribute("data-status", "incorrect");
  await expectNative();
  await input.press("Backspace");
  await expect(page.locator('.learn-stream [data-current="true"]')).toHaveAttribute("data-slot-index", String(count));
  await expectNative();
  await page.setViewportSize({ width: 780, height: 390 });
  await expectNative();
  await expectContainedLearningCaret(page);
  await input.pressSequentially(text.slice(count, count + 10), { delay: 3 });
  await expectNative();
  expect(await readOwnership(page)).toEqual(ownership);
  await page.getByRole("button", { name: "Finish practice", exact: true }).click();
  const result = await exportedResult(page);
  expect(result.finalText).toBe(text.slice(0, count + 10));
  expect(result.metrics.insertionAttempts).toBe(count + 11);
  expect(result.metrics.incorrectAttempts).toBe(1);
  expect(result.metrics.deletedUnits).toBe(1);
  await test.info().attach("learn-forward-native-window", { contentType: "application/json", body: JSON.stringify({ count, nativeReadBudget, ownership, finalTextExact: true }) });
});
