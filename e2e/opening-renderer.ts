import { expect, test, type Page } from "@playwright/test";

interface NativePaintReceipt {
  supported: boolean;
  observed: boolean;
  startTime: number | null;
  observationError?: string;
}

/** Pause before navigation without a browser round-trip racing a 25ms deadline. */
export async function freezeOpeningClock(page: Page) {
  const origin = new Date('2026-10-19T12:00:00Z');
  await page.clock.install({ time: origin });
  await page.clock.pauseAt(new Date(origin.getTime() + 60_000));
}

/**
 * page.clock and DOM getContext fault injection affect the document, not a
 * WorkerGlobalScope. Clocked renderer tests explicitly exercise the supported
 * main-thread path; opening-worker.spec.ts covers the production worker path
 * with native clocks and native transferable canvases.
 */
export async function selectDocumentOpeningRenderer(page: Page) {
  test.info().annotations.push({
    type: "renderer-scope",
    description:
      "Document renderer selected explicitly: page.clock and HTMLCanvasElement context injection cannot patch WorkerGlobalScope. Native production workers are covered with normal clocks in opening-worker.spec.ts.",
  });
  await page.addInitScript(() => {
    const receipt: NativePaintReceipt = {
      supported:
        typeof PerformanceObserver === "function" &&
        PerformanceObserver.supportedEntryTypes.includes("paint"),
      observed: false,
      startTime: null,
    };
    Object.assign(window, { openingFixtureNativePaint: receipt });
    if (receipt.supported) {
      const observer = new PerformanceObserver((list) => {
        const paint = list
          .getEntries()
          .find((entry) => entry.name === "first-contentful-paint");
        if (paint) {
          receipt.observed = true;
          receipt.startTime = paint.startTime;
          observer.disconnect();
        }
      });
      try {
        observer.observe({ type: "paint", buffered: true });
      } catch (error) {
        receipt.observationError = String(error);
        observer.disconnect();
      }
    }
    if (
      !Reflect.deleteProperty(
        HTMLCanvasElement.prototype,
        "transferControlToOffscreen",
      )
    ) {
      throw new Error(
        "Cannot select the document renderer for this clocked test",
      );
    }
  });
}

/**
 * Clock.install replaces performance.getEntries* with empty lists and pauses idle
 * callbacks. Observe genuine paint independently, then advance only the product's
 * existing idle/capability-fallback scheduling. No synthetic paint is published.
 * Renderer assertions share the caller's original deadline, rather than adding
 * another real-time budget. Full choreography begins at actual renderer readiness.
 */
export async function advanceClockedOpeningPreparation(
  page: Page,
  originalTimeoutMs: number,
) {
  const deadline = Date.now() + originalTimeoutMs;
  await page.clock.runFor(80);
  const readReceipt = () =>
    page.evaluate(
      () =>
        (window as Window & { openingFixtureNativePaint: NativePaintReceipt })
          .openingFixtureNativePaint,
    );
  await expect
    .poll(
      async () => {
        const receipt = await readReceipt();
        return (
          !receipt.supported ||
          Boolean(receipt.observationError) ||
          receipt.observed
        );
      },
      { timeout: Math.max(1, deadline - Date.now()) },
    )
    .toBe(true);
  const paint = await readReceipt();
  const clockAdvancedMs =
    paint.supported && !paint.observationError ? 500 : 1500;
  await page.clock.runFor(clockAdvancedMs - 80);
  await test.info().attach("clocked-renderer-paint-preparation", {
    contentType: "application/json",
    body: JSON.stringify({
      nativePaint: paint,
      schedulingPath:
        paint.supported && !paint.observationError
          ? "genuine-paint-observer-then-existing-400ms-idle-window"
          : "existing-1000ms-capability-fallback-then-400ms-idle-window",
      clockAdvancedMs,
      originalTimeoutMs,
      remainingTimeoutMs: Math.max(1, deadline - Date.now()),
    }),
  });
  return {
    clockAdvancedMs,
    remainingTimeoutMs: Math.max(1, deadline - Date.now()),
  };
}

/** Finish the actual presentation, whose 4.2s origin is renderer readiness. */
export async function completeClockedOpening(page: Page, duration = 4500) {
  const opening = page.getByTestId("opening-experience");
  if (
    (await opening.getAttribute("data-mode")) === "full" &&
    (await opening.getAttribute("data-presentation")) === "preparing"
  ) {
    const preparation = await advanceClockedOpeningPreparation(page, 20_000);
    await expect.poll(async () => {
      await page.clock.runFor(16);
      return opening.getAttribute("data-presentation");
    }, { timeout: preparation.remainingTimeoutMs, intervals: [100, 250, 500] }).toBe("playing");
  }
  await page.clock.fastForward(duration);
  // The finish callback schedules a nested exit timer at the clock destination.
  await page.clock.runFor(200);
}
