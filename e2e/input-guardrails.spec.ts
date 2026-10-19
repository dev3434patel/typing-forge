import { expect, test, type Locator } from "@playwright/test";
import { customPractice, exportedResult, focusTyping } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sparowtype.opening-animation.enabled", "false"));
});

async function blockedTransferEvents(input: Locator) {
  return input.evaluate((element) => [
    new Event("paste", { bubbles: true, cancelable: true }),
    new Event("drop", { bubbles: true, cancelable: true }),
    new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertFromPaste", data: "cat" }),
    new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertFromDrop", data: "cat" }),
  ].map((event) => !element.dispatchEvent(event)));
}

async function reportCapsLock(input: Locator, enabled: boolean) {
  await input.evaluate((element, state) => {
    const event = new KeyboardEvent("keydown", { key: "CapsLock", code: "CapsLock", bubbles: true });
    Object.defineProperty(event, "getModifierState", { value: (modifier: string) => modifier === "CapsLock" && state });
    element.dispatchEvent(event);
  }, enabled);
}

test("paste and drop stay outside the practice transcript and never start its clock", async ({ page }) => {
  const input = await customPractice(page, "cat");
  expect(await blockedTransferEvents(input)).toEqual([true, true, true, true]);
  await expect(input).toHaveValue("");
  await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  await expect(page.getByTestId("typing-input-notice")).toHaveText("Paste is disabled during typing practice.");
  // A browser that reports the transfer only at input is also rejected.
  await input.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "cat");
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertFromDrop", data: "cat" }));
  });
  await expect(input).toHaveValue("");
  await input.pressSequentially("cat");
  await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  const result = await exportedResult(page);
  expect(result.metrics.insertionAttempts).toBe(3);
  expect(result.metrics.inputAccuracy).toBe(100);
  expect(result.events.every((event) => event.provenance === "keyboard")).toBe(true);
});

test("adaptive practice blocks transfer input and reports only observed Caps Lock state", async ({ page }) => {
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  const input = page.getByRole("textbox", { name: "Type the practice text", exact: true });
  await expect(input).toBeVisible();
  await input.focus();
  await expect(page.getByTestId("lesson-input-notice")).toHaveCount(0);
  expect(await blockedTransferEvents(input)).toEqual([true, true, true, true]);
  await expect(input).toHaveValue("");
  await expect(page.getByRole("progressbar", { name: "Lesson progress", exact: true })).toHaveAttribute("value", "0");
  await expect(page.getByRole("status").filter({ hasText: "Paste is disabled during typing practice." })).toBeVisible();
  await reportCapsLock(input, true);
  await expect(page.getByTestId("lesson-input-notice")).toHaveText("Caps Lock is on.");
  await reportCapsLock(input, false);
  await expect(page.getByTestId("lesson-input-notice")).toHaveCount(0);
});

test("feedback preferences persist and outline carets respect reduced motion in both modes", async ({ page }) => {
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Caret style", exact: true }).selectOption("outline");
  await page.getByRole("checkbox", { name: "Reduced motion", exact: true }).check();
  await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  const packs = page.getByRole("combobox", { name: "Sound pack", exact: true });
  await expect(packs.getByRole("option")).toHaveCount(5);
  await packs.selectOption("mechanical");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(packs).toHaveValue("mechanical");
  await expect(page.getByRole("checkbox", { name: "Reduced motion", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
  const input = await customPractice(page, "cat dog");
  const caret = page.locator('[data-testid="typing-viewport"] > .caret-outline');
  await expect(caret).toBeVisible();
  await expect(caret).toHaveCSS("border-top-width", "2px");
  await expect(caret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(caret).toHaveCSS("transition-property", "none");
  await expect(page.getByTestId("typing-input-notice")).toHaveCount(0);
  await reportCapsLock(input, true);
  await expect(page.getByTestId("typing-input-notice")).toContainText("Caps Lock is on.");
  await reportCapsLock(input, false);
  await input.pressSequentially("cat");
  await expect(input).toHaveValue("cat");
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Type the practice text", exact: true }).focus();
  const learnCaret = page.locator(".learn-caret.caret-outline");
  await expect(learnCaret).toBeVisible();
  await expect(learnCaret).toHaveCSS("border-top-width", "2px");
  await expect(learnCaret).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(learnCaret).toHaveCSS("transition-property", "none");
});

test("supported typing audio creates one context on input and disposes it on navigation", async ({ page }) => {
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  const supported = await page.evaluate(() => typeof AudioContext === "function");
  test.skip(!supported, "UNVERIFIED: this browser runner exposes no standard AudioContext API; this is not a native Safari capability claim.");
  await page.addInitScript(() => {
    const tracked = window as Window & {
      audioContexts: number;
      disposedAudioContexts: number;
      audioConstructorInstalled: boolean;
    };
    tracked.audioContexts = 0;
    tracked.disposedAudioContexts = 0;
    const instrumented = new Proxy(window.AudioContext, {
      construct(target, args) {
        tracked.audioContexts++;
        const context = Reflect.construct(target, args) as AudioContext;
        const close = context.close.bind(context);
        context.close = () => { tracked.disposedAudioContexts++; return close(); };
        return context;
      },
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, writable: true, value: instrumented });
    tracked.audioConstructorInstalled = window.AudioContext === instrumented && AudioContext === instrumented;
  });
  await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  await page.getByRole("combobox", { name: "Sound pack", exact: true }).selectOption("mechanical");
  const input = await customPractice(page, "cat dog");
  await page.waitForFunction(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
    .some((resource) => resource.name.includes("keyboard-audio") && resource.responseEnd > 0));
  // Download completion alone does not establish dynamic-import evaluation.
  await page.evaluate(async () => {
    const resource = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .find((entry) => entry.name.includes("keyboard-audio") && entry.responseEnd > 0)!;
    await import(resource.name);
  });
  expect(await page.evaluate(() => (window as Window & { audioConstructorInstalled: boolean }).audioConstructorInstalled)).toBe(true);
  expect(await page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(0);
  await input.pressSequentially("cat");
  await expect.poll(() => page.evaluate(() => (window as Window & { audioContexts: number }).audioContexts)).toBe(1);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your practice, your space.", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { disposedAudioContexts: number }).disposedAudioContexts)).toBe(1);
});

test("unavailable browser audio is explained without clearing the saved sound preference", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined }));
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  const notice = page.getByRole("status").filter({ hasText: "Typing sound is unavailable in this browser." });
  await expect(notice).toBeVisible();
  await page.getByRole("checkbox", { name: "Typing sound", exact: true }).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(notice).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Typing sound", exact: true })).toBeChecked();
});

test("idle practice has no 100ms interval and the active deadline still persists exactly", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  // Bootstrap and first-paint scheduling use the ordinary browser clock. The
  // deterministic test clock begins only after a real idle workspace exists.
  await page.clock.install();
  await page.evaluate(() => {
    const tracked = window as Window & { practiceIntervals: number };
    tracked.practiceIntervals = 0;
    const interval = window.setInterval.bind(window);
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 100) tracked.practiceIntervals++;
      return interval(handler, timeout, ...args);
    }) as typeof window.setInterval;
  });
  await page.getByRole("group", { name: "Test duration", exact: true }).getByRole("button", { name: "15 seconds", exact: true }).click();
  const input = await focusTyping(page);
  const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
  await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 1000));
  await page.clock.fastForward(60_000);
  await expect(page.getByRole("region", { name: "Typing session", exact: true })).toHaveAttribute("data-status", "ready");
  expect(await page.evaluate(() => (window as Window & { practiceIntervals: number }).practiceIntervals)).toBe(0);
  await input.press(first);
  await page.clock.fastForward(16_000);
  await expect(page.getByRole("region", { name: "Session results", exact: true })).toBeVisible();
  const result = await exportedResult(page);
  expect(result.elapsedMs).toBe(15_000);
  expect(result.metrics.insertionAttempts).toBe(1);
  await expect(page.getByRole("status").filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  await page.goto("/stats", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("table", { name: "Completed sessions, most recent first", exact: true }).getByRole("row").nth(1)).toContainText("15.0s");
});

test("ordinary-clock cold startup and reload reach editable practice without timer instrumentation", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const receipts: unknown[] = [];
  for (const attempt of ["cold", "reload"] as const) {
    const startedAt = Date.now();
    const response = attempt === "cold"
      ? await page.goto("/", { waitUntil: "domcontentloaded" })
      : await page.reload({ waitUntil: "domcontentloaded" });
    expect([200, 304]).toContain(response?.status());
    await expect(page.getByRole("group", { name: "Test duration", exact: true })).toBeVisible();
    const session = page.getByRole("region", { name: "Typing session", exact: true });
    await expect(session).toHaveAttribute("data-status", "ready");
    await expect(page.getByRole("status").filter({ hasText: "Preparing your typing workspace…" })).toBeHidden();
    const input = await focusTyping(page);
    const first = (await page.getByTestId("typing-target").innerText()).slice(0, 1);
    await input.press(first);
    await expect(input).toHaveValue(first);
    await expect(session).toHaveAttribute("data-status", "running");
    receipts.push({
      attempt,
      responseStatus: response!.status(),
      readyAndInputElapsedMs: Date.now() - startedAt,
      ...await page.evaluate(() => ({
        clock: "ordinary browser clock; Playwright clock is not installed",
        timeOrigin: performance.timeOrigin,
        performanceNow: performance.now(),
        navigationType: (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type,
      })),
    });
  }
  await info.attach("ordinary-clock-workspace-startup", {
    body: JSON.stringify({ receipts, pageErrors: errors }, null, 2),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});
