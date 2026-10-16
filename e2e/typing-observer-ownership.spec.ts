import { expect, test, type Page } from "@playwright/test";
import { focusTyping } from "./helpers";

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
  const text = await page.getByTestId("typing-target").textContent();
  const position = Math.min(100, text!.length - 2);
  const count = text![position - 1] === " " ? position - 1 : position;
  await input.pressSequentially(text!.slice(0, count), { delay: 3 });
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
