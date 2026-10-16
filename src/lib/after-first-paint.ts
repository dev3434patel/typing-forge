type PaintEntry = { name: string };
type PaintSubscription = { observe(): void; disconnect(): void };
interface PaintPreparationHost {
  paintEntries(): readonly PaintEntry[];
  observerTypes?: readonly string[];
  createObserver?: (
    publish: (entries: readonly PaintEntry[]) => void,
  ) => PaintSubscription;
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
  requestIdle?: (callback: () => void, timeout: number) => number;
  cancelIdle?: (id: number) => void;
}

function browserHost(): PaintPreparationHost {
  const Observer = globalThis.PerformanceObserver;
  return {
    paintEntries: () => performance.getEntriesByName("first-contentful-paint"),
    observerTypes:
      typeof Observer === "function" ? Observer.supportedEntryTypes : undefined,
    createObserver:
      typeof Observer === "function"
        ? (publish) => {
            const observer = new Observer((list) => publish(list.getEntries()));
            return {
              observe: () =>
                observer.observe({ type: "paint", buffered: true }),
              disconnect: () => observer.disconnect(),
            };
          }
        : undefined,
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (id) => window.clearTimeout(id),
    requestIdle:
      typeof window.requestIdleCallback === "function"
        ? (callback, timeout) =>
            window.requestIdleCallback(callback, { timeout })
        : undefined,
    cancelIdle:
      typeof window.cancelIdleCallback === "function"
        ? (id) => window.cancelIdleCallback(id)
        : undefined,
  };
}

/** Prioritize real content paint, then warm the workspace without relying on optional APIs. */
export function scheduleAfterFirstPaint(
  prepare: () => void,
  host: PaintPreparationHost = browserHost(),
): () => void {
  let active = true;
  let scheduled = false;
  let job: { kind: "idle" | "timer"; id: number } | undefined;
  let observer: PaintSubscription | undefined;
  const run = () => {
    if (active) prepare();
  };
  const afterPaint = () => {
    if (!active || scheduled) return;
    scheduled = true;
    observer?.disconnect();
    host.clearTimeout(fallback);
    if (host.requestIdle && host.cancelIdle) {
      try {
        job = { kind: "idle", id: host.requestIdle(run, 400) };
        return;
      } catch {
        // A partial or disabled idle API still has a normal cancellable timer path.
      }
    }
    job = { kind: "timer", id: host.setTimeout(run, 0) };
  };
  const fallback = host.setTimeout(afterPaint, 1000);
  try {
    if (
      host
        .paintEntries()
        .some((entry) => entry.name === "first-contentful-paint")
    )
      afterPaint();
    else if (host.createObserver && host.observerTypes?.includes("paint")) {
      observer = host.createObserver((entries) => {
        if (entries.some((entry) => entry.name === "first-contentful-paint"))
          afterPaint();
      });
      observer.observe();
    }
  } catch {
    observer?.disconnect();
    observer = undefined;
    // The original one-second fallback remains armed if paint observation fails.
  }
  return () => {
    active = false;
    observer?.disconnect();
    host.clearTimeout(fallback);
    if (job?.kind === "idle") host.cancelIdle?.(job.id);
    else if (job) host.clearTimeout(job.id);
  };
}
