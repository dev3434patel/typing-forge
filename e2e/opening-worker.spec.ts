import { expect, test, type Page, type TestInfo } from "@playwright/test";
import type { Worker as PlaywrightWorker } from "@playwright/test";
import type { KeyboardSceneDiagnostics } from "../src/components/brand/keyboard-scene";
import { INTRO_SEEN_SESSION_KEY } from "../src/lib/opening-experience";

interface WorkerReceipt {
  type: string;
  atMs?: number;
  diagnostics?: KeyboardSceneDiagnostics;
  viewport?: { width: number; height: number; pixelRatio: number };
  lowPower?: boolean;
  finePointer?: boolean;
  supported?: boolean;
}
interface WorkerRecord {
  url: string;
  sent: WorkerReceipt[];
  received: WorkerReceipt[];
  terminated: number;
  terminatedAtMs: number | null;
}
interface FallbackAnimationSample {
  id: number;
  name: string;
  currentTime: number | null;
  timelineTime: number | null;
  timelineId: number;
  rate: number;
  endTime: number | null;
  state: string;
  renderer: string | null;
}
interface FallbackAnimationAction extends FallbackAnimationSample {
  action: "pause" | "play" | "finish";
  atMs: number;
}
type AuditedWindow = Window & {
  openingWorkerAudit?: { records: WorkerRecord[]; workers: Worker[] };
  fallbackAnimationAudit?: {
    actions: FallbackAnimationAction[];
    sample: () => FallbackAnimationSample[];
  };
};
const workerEntry = /\/keyboard-render[.-]worker[^/]*\.(?:js|ts)(?:\?.*)?$/;

async function observeNativeWorker(page: Page, info: TestInfo) {
  info.annotations.push({
    type: "browser-runtime-version",
    description: page.context().browser()?.version() ?? "UNAVAILABLE",
  });
  const supported = await page.evaluate(
    () =>
      typeof Worker === "function" &&
      typeof OffscreenCanvas === "function" &&
      typeof HTMLCanvasElement.prototype.transferControlToOffscreen ===
        "function",
  );
  test.skip(
    !supported,
    "UNVERIFIED: this runner has no native transferable-canvas worker API. Document fallback is covered independently.",
  );
  info.annotations.push({
    type: "scope",
    description:
      "Native Worker and OffscreenCanvas, normal clocks; no renderer mock or document-renderer override.",
  });
  await page.addInitScript(() => {
    const audit = { records: [] as WorkerRecord[], workers: [] as Worker[] };
    (window as AuditedWindow).openingWorkerAudit = audit;
    const NativeWorker = window.Worker;
    const instrumented = new Proxy(NativeWorker, {
      construct(target, args) {
        const worker = Reflect.construct(target, args) as Worker;
        if (
          (args[1] as WorkerOptions | undefined)?.name !==
          "SparowType keyboard renderer"
        )
          return worker;
        const record: WorkerRecord = {
          url: String(args[0]),
          sent: [],
          received: [],
          terminated: 0,
          terminatedAtMs: null,
        };
        audit.records.push(record);
        audit.workers.push(worker);
        worker.postMessage = new Proxy(worker.postMessage, {
          apply(method, receiver, argumentsList) {
            const data = argumentsList[0] as WorkerReceipt;
            record.sent.push({
              type: data.type,
              atMs: performance.now(),
              ...(data.viewport ? { viewport: data.viewport } : {}),
              ...(data.type === "initialize"
                ? { lowPower: data.lowPower, finePointer: data.finePointer }
                : {}),
            });
            return Reflect.apply(method, receiver, argumentsList);
          },
        });
        worker.terminate = new Proxy(worker.terminate, {
          apply(method, receiver, argumentsList) {
            record.terminated++;
            record.terminatedAtMs = performance.now();
            return Reflect.apply(method, receiver, argumentsList);
          },
        });
        worker.addEventListener(
          "message",
          ({ data }: MessageEvent<WorkerReceipt>) => {
            if (
              ["ready", "diagnostics", "failure", "disposed"].includes(
                data.type,
              ) ||
              data.type.startsWith("test-")
            )
              record.received.push({ ...data, atMs: performance.now() });
          },
        );
        return worker;
      },
    });
    Object.defineProperty(window, "Worker", {
      configurable: true,
      writable: true,
      value: instrumented,
    });
  });
}

async function records(page: Page) {
  return page.evaluate(
    () => (window as AuditedWindow).openingWorkerAudit?.records ?? [],
  );
}

async function observeNativeFallbackAnimations(page: Page) {
  await page.addInitScript(() => {
    const ids = new WeakMap<Animation, number>();
    const timelines = new WeakMap<AnimationTimeline, number>();
    let nextId = 0;
    let nextTimeline = 0;
    const actions: FallbackAnimationAction[] = [];
    const sample = (animation: Animation): FallbackAnimationSample | null => {
      if (!(animation instanceof CSSAnimation)) return null;
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target;
      if (
        !(target instanceof Element) ||
        !target.closest(".awakening-fallback")
      )
        return null;
      if (!ids.has(animation)) ids.set(animation, ++nextId);
      if (animation.timeline && !timelines.has(animation.timeline))
        timelines.set(animation.timeline, ++nextTimeline);
      const end = effect?.getComputedTiming().endTime;
      return {
        id: ids.get(animation)!,
        name: animation.animationName,
        currentTime:
          typeof animation.currentTime === "number"
            ? animation.currentTime
            : null,
        timelineTime:
          typeof animation.timeline?.currentTime === "number"
            ? animation.timeline.currentTime
            : null,
        timelineId: animation.timeline ? timelines.get(animation.timeline)! : 0,
        rate: animation.playbackRate,
        endTime: typeof end === "number" && Number.isFinite(end) ? end : null,
        state: animation.playState,
        renderer:
          target
            .closest('[data-testid="opening-experience"]')
            ?.getAttribute("data-renderer") ?? null,
      };
    };
    for (const action of ["pause", "play", "finish"] as const) {
      const native = Animation.prototype[action];
      Animation.prototype[action] = function (...args) {
        const result = Reflect.apply(native, this, args);
        const measured = sample(this);
        if (measured)
          actions.push({ ...measured, action, atMs: performance.now() });
        return result;
      };
    }
    (window as AuditedWindow).fallbackAnimationAudit = {
      actions,
      sample: () =>
        Array.from(
          document
            .querySelector(".awakening-fallback")
            ?.getAnimations({ subtree: true }) || [],
        )
          .map(sample)
          .filter(
            (item): item is FallbackAnimationSample =>
              item !== null && item.name === "awakening-key-dissolve",
          ),
    };
  });
}
async function firstWorkerReady(page: Page) {
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) => receipt.type === "ready",
      ),
    )
    .toBe(true);
}
async function firstWorkerInitialized(page: Page) {
  await expect
    .poll(async () =>
      (await records(page))[0]?.sent.some(
        (receipt) => receipt.type === "initialize",
      ),
    )
    .toBe(true);
}
async function readyPractice(page: Page) {
  await expect(page.getByTestId("opening-experience")).toHaveCount(0);
  const input = page.getByRole("textbox", {
    name: "Typing input",
    exact: true,
  });
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Typing session", exact: true }),
  ).toHaveAttribute("data-status", "ready");
  return input;
}
async function expectWorkerClosed(
  page: Page,
  policy: "acknowledged" | "watchdog-allowed" = "acknowledged",
) {
  await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  await expect
    .poll(
      () =>
        page.workers().filter((worker) => workerEntry.test(worker.url()))
          .length,
    )
    .toBe(0);
  const [record] = await records(page);
  const dispose = record.sent.find((receipt) => receipt.type === "dispose");
  if (dispose?.atMs === undefined || record.terminatedAtMs === null)
    throw new Error(
      "No monotonic dispose/terminate receipts for native worker",
    );
  const acknowledged =
    record.received.some((receipt) => receipt.type === "disposed") &&
    record.received.some((receipt) => receipt.diagnostics?.disposed);
  const elapsedMs = record.terminatedAtMs - dispose.atMs;
  let path = "acknowledged-disposal";
  if (policy === "acknowledged" || acknowledged) {
    expect(acknowledged).toBe(true);
  } else {
    // A busy GPU worker gets a200ms disposal grace period before termination.
    // Require measured watchdog timing and actual native closure. A missing
    // acknowledgement alone never establishes successful explicit disposal.
    expect(elapsedMs).toBeGreaterThanOrEqual(190);
    expect(elapsedMs).toBeLessThanOrEqual(1000);
    path = "watchdog-termination-no-disposal-acknowledgement";
  }
  await test.info().attach("native-worker-shutdown", {
    body: JSON.stringify({
      path,
      policy,
      disposeAtMs: dispose.atMs,
      terminatedAtMs: record.terminatedAtMs,
      elapsedMs,
      terminated: record.terminated,
      liveNativeWorkers: page
        .workers()
        .filter((worker) => workerEntry.test(worker.url())).length,
    }),
    contentType: "application/json",
  });
}

test.afterEach(async ({ page }, info) => {
  if (page.isClosed()) return;
  const observed = await records(page).catch(() => []);
  await info.attach("native-worker-receipts", {
    body: JSON.stringify(observed, null, 2),
    contentType: "application/json",
  });
  const animationActions = await page
    .evaluate(() => (window as AuditedWindow).fallbackAnimationAudit?.actions)
    .catch(() => undefined);
  if (animationActions)
    await info.attach("native-fallback-animation-actions", {
      body: JSON.stringify(animationActions),
      contentType: "application/json",
    });
});

test("default native worker draws the complete keyboard while document tasks, resize and skip remain responsive", async ({
  page,
}, info) => {
  await observeNativeWorker(page, info);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      get: () => 8,
    });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await firstWorkerReady(page);
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) =>
          receipt.diagnostics?.thread === "worker" &&
          receipt.diagnostics.frames > 0 &&
          receipt.diagnostics.drawCalls > 0,
      ),
    )
    .toBe(true);
  const [record] = await records(page);
  const scene = [...record.received]
    .reverse()
    .find((receipt) => receipt.diagnostics?.frames)?.diagnostics;
  if (!scene) throw new Error("No real worker draw diagnostics were received");
  expect(scene).toMatchObject({
    thread: "worker",
    keyCount: 61,
    keycapMeshes: 1,
    tier: "desktop",
    bloom: true,
    environment: true,
    environmentIntensity: 0.35,
    contextLost: false,
    disposed: false,
  });
  expect(scene.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  expect(scene.cameraElevationDegrees).toBeLessThanOrEqual(42);
  expect(
    record.sent.find((receipt) => receipt.type === "initialize"),
  ).toMatchObject({ lowPower: false, finePointer: true });
  const responsiveness = await page.evaluate(async () => {
    const started = performance.now();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const timerAtMs = performance.now() - started;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    return {
      timerAtMs,
      frameAtMs: performance.now() - started,
      openingPresent: Boolean(
        document.querySelector('[data-testid="opening-experience"]'),
      ),
    };
  });
  expect(responsiveness.openingPresent).toBe(true);
  await info.attach("document-task-and-paint-during-worker", {
    body: JSON.stringify(responsiveness),
    contentType: "application/json",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const canvas = page.locator(".awakening-canvas");
  const viewport = await canvas.evaluate((element) => ({
    width: Math.round(element.clientWidth),
    height: Math.round(element.clientHeight),
  }));
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) =>
          receipt.diagnostics?.width === viewport.width &&
          receipt.diagnostics.height === viewport.height,
      ),
    )
    .toBe(true);
  expect(
    (await records(page))[0].sent.some(
      (receipt) =>
        receipt.type === "resize" && receipt.viewport?.width === viewport.width,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expectWorkerClosed(page, "watchdog-allowed");
  const input = await readyPractice(page);
  await input.pressSequentially("a");
  await expect(input).toHaveValue("a");
});

test("native worker acknowledges real resource disposal at an explicitly idle renderer boundary", async ({
  page,
}, info) => {
  await observeNativeWorker(page, info);
  info.annotations.push({
    type: "scope",
    description:
      "Protocol-only idle-boundary proof: native desktop full-quality draw first, then a test-owned RAF hold. This cadence-controlled case is not a performance measurement.",
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      get: () => 8,
    });
    const ObservedWorker = window.Worker;
    window.Worker = new Proxy(ObservedWorker, {
      construct(target, args) {
        const worker = Reflect.construct(target, args) as Worker;
        if (
          (args[1] as WorkerOptions | undefined)?.name ===
          "SparowType keyboard renderer"
        )
          worker.addEventListener("message", ({ data }: MessageEvent) => {
            // Request the boundary from the actual native ready event, before
            // driver assertions can consume the fixed opening interval.
            if (data.type === "ready")
              worker.postMessage({ type: "test-request-native-idle-boundary" });
          });
        return worker;
      },
    });
  });
  await page.route(/\/assets\/keyboard-render[.-]worker[^/]*\.js$/, async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const injection = `
const nativeRequestAnimationFrame = self.requestAnimationFrame.bind(self);
const nativeCancelAnimationFrame = self.cancelAnimationFrame.bind(self);
const pendingNativeFrames = new Set();
let nativeFrameHold = false;
let nativeHeldFrameReported = false;
self.requestAnimationFrame = (callback) => {
  const id = nativeRequestAnimationFrame((time) => {
    pendingNativeFrames.delete(id);
    if (nativeFrameHold) {
      if (!nativeHeldFrameReported) {
        nativeHeldFrameReported = true;
        postMessage({type:"test-native-render-frame-held"});
      }
      return;
    }
    callback(time);
  });
  pendingNativeFrames.add(id);
  return id;
};
self.cancelAnimationFrame = (id) => {
  pendingNativeFrames.delete(id);
  nativeCancelAnimationFrame(id);
};
addEventListener("message", ({data}) => {
  if (data.type === "test-request-native-idle-boundary") {
    nativeFrameHold = true;
    postMessage({type:"test-native-idle-boundary"});
  }
  if (data.type === "dispose") {
    // No synthetic disposed message or resource API substitution. The actual
    // application's disposal handler still cancels and disposes its resources.
    pendingNativeFrames.clear();
  }
});
`;
    await route.fulfill({ response, body: injection + body });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await firstWorkerReady(page);
  await expect
    .poll(async () => {
      const [record] = await records(page);
      return (
        record?.received.some(
          (receipt) => receipt.type === "test-native-idle-boundary",
        ) &&
        record.received.some(
          (receipt) => receipt.type === "test-native-render-frame-held",
        )
      );
    })
    .toBe(true);
  const [record] = await records(page);
  const ready = record.received.find((receipt) => receipt.type === "ready");
  await page.keyboard.press("Escape");
  await expectWorkerClosed(page, "acknowledged");
  const input = await readyPractice(page);
  await input.pressSequentially("a");
  await expect(input).toHaveValue("a");
  expect(ready?.diagnostics).toMatchObject({
    thread: "worker",
    keyCount: 61,
    keycapMeshes: 1,
    tier: "desktop",
    bloom: true,
    environment: true,
    environmentIntensity: 0.35,
    contextLost: false,
    disposed: false,
  });
  expect(ready!.diagnostics!.frames).toBeGreaterThan(0);
  expect(ready!.diagnostics!.drawCalls).toBeGreaterThan(0);
  expect(ready!.diagnostics!.cameraElevationDegrees).toBeGreaterThanOrEqual(28);
  expect(ready!.diagnostics!.cameraElevationDegrees).toBeLessThanOrEqual(42);
  await info.attach("native-idle-boundary-acknowledgement", {
    body: JSON.stringify({
      scope: "Protocol-only; native RAF cadence held after actual full-quality draw",
      ready,
      idleReceipts: record.received.filter((receipt) =>
        receipt.type.startsWith("test-native-"),
      ),
      shutdown: (await records(page))[0],
    }),
    contentType: "application/json",
  });
});

test("five consecutive native-worker startup reloads close each prior owner and final skip closes the last worker", async ({
  page,
}, info) => {
  await observeNativeWorker(page, info);
  info.annotations.push({
    type: "scope",
    description:
      "Native startup ownership includes pending GPU preparation. Dedicated quality and idle-acknowledgement cases separately require the complete desktop61-key full-quality draw.",
  });
  // A real document unload may mark the first visit as seen after a test removes
  // its key. Reset at the next document's start so both lifecycle passes really
  // exercise full workers; the ordinary returning-visit contract has its own test.
  await page.addInitScript(
    (key) => sessionStorage.removeItem(key),
    INTRO_SEEN_SESSION_KEY,
  );
  const live = new Set<PlaywrightWorker>();
  const closed: { sequence: number; url: string; closedAtNodeMs: number }[] =
    [];
  const started: { sequence: number; url: string; startedAtNodeMs: number }[] =
    [];
  let maximumLive = 0;
  page.on("worker", (worker) => {
    if (!workerEntry.test(worker.url())) return;
    const sequence = started.length + 1;
    started.push({
      sequence,
      url: worker.url(),
      startedAtNodeMs: performance.now(),
    });
    live.add(worker);
    maximumLive = Math.max(maximumLive, live.size);
    worker.on("close", () => {
      live.delete(worker);
      closed.push({
        sequence,
        url: worker.url(),
        closedAtNodeMs: performance.now(),
      });
    });
  });
  let initial: WorkerRecord[] = [];
  let initialOwnership: {
    nativePublished: number;
    liveWorkers: number;
    maximumLive: number;
    configuration: WorkerReceipt | undefined;
  } | null = null;
  const cycles: {
    reload: number;
    records: WorkerRecord[];
    priorWorkersClosed: number;
    liveWorkers: number;
  }[] = [];
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await firstWorkerInitialized(page);
    await expect
      .poll(
        () =>
          page.workers().filter((worker) => workerEntry.test(worker.url()))
            .length,
      )
      .toBe(1);
    initial = await records(page);
    initialOwnership = {
      nativePublished: page
        .workers()
        .filter((worker) => workerEntry.test(worker.url())).length,
      liveWorkers: live.size,
      maximumLive,
      configuration: initial[0]?.sent.find(
        (receipt) => receipt.type === "initialize",
      ),
    };
    expect(initialOwnership).toMatchObject({
      nativePublished: 1,
      liveWorkers: 1,
      maximumLive: 1,
      configuration: {
        type: "initialize",
        lowPower: false,
        finePointer: true,
      },
    });
    for (let reload = 1; reload <= 5; reload++) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("opening-experience")).toHaveAttribute(
        "data-mode",
        "full",
      );
      // These are real rapid reloads, including pending GPU preparation. The
      // dedicated quality and idle-ack cases prove full PBR readiness;
      // cancellation must still close each native owner before the next one.
      await firstWorkerInitialized(page);
      await expect.poll(() => closed.length).toBe(reload);
      // A successful constructor/postMessage in the document can precede
      // Playwright's native worker publication, especially during rapid Edge
      // reloads. Wait for the real owner; retain the exact ownership checks.
      await expect
        .poll(
          () =>
            page.workers().filter((worker) => workerEntry.test(worker.url()))
              .length,
        )
        .toBe(1);
      expect(
        page.workers().filter((worker) => workerEntry.test(worker.url())),
      ).toHaveLength(1);
      expect(live.size).toBe(1);
      expect(maximumLive).toBe(1);
      cycles.push({
        reload,
        records: await records(page),
        priorWorkersClosed: closed.length,
        liveWorkers: live.size,
      });
    }
    await page.keyboard.press("Escape");
    await expectWorkerClosed(page, "watchdog-allowed");
    expect(closed).toHaveLength(6);
    expect(live.size).toBe(0);
    expect(maximumLive).toBe(1);
    const input = await readyPractice(page);
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
  } finally {
    info.annotations.push({
      type: "limitation",
      description:
        "Five actual reloads and native worker closure/ownership are finite lifecycle evidence, not a universal heap/GPU-memory leak guarantee.",
    });
    await info.attach("five-native-worker-reload-cycles", {
      body: JSON.stringify(
        {
          scope: "Native startup ownership, including pending GPU preparation",
          initialOwnership,
          initial,
          cycles,
          started,
          closed,
          maximumLive,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }
});

test("skipping while the native worker entry is blocked terminates startup and preserves the first typing key", async ({
  page,
}, info) => {
  await observeNativeWorker(page, info);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.context().route(workerEntry, async (route) => {
    await gate;
    await route.continue().catch(() => undefined); // Cancellation is expected after termination.
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect
      .poll(async () =>
        (await records(page))[0]?.sent.some(
          (receipt) => receipt.type === "initialize",
        ),
      )
      .toBe(true);
    expect(
      (await records(page))[0].received.some(
        (receipt) => receipt.type === "ready",
      ),
    ).toBe(false);
    await page.keyboard.press("Escape");
    await expectWorkerClosed(page, "watchdog-allowed");
    const input = await readyPractice(page);
    await input.pressSequentially("x");
    await expect(input).toHaveValue("x");
  } finally {
    release();
  }
});

async function expectRecoveredDocumentScene(page: Page) {
  const opening = page.getByTestId("opening-experience");
  const canvas = page.locator(".awakening-canvas");
  await expect(opening).toHaveAttribute("data-renderer", "webgl");
  await expect
    .poll(async () => {
      const raw = await canvas.getAttribute("data-scene");
      const scene = raw
        ? (JSON.parse(raw) as KeyboardSceneDiagnostics)
        : undefined;
      return (
        scene?.thread === "main-thread" &&
        scene.keyCount === 61 &&
        scene.frames > 0 &&
        scene.drawCalls > 0
      );
    })
    .toBe(true);
  await expect(canvas).toHaveCount(1);
  await expect.poll(async () => (await records(page))[0]?.terminated).toBe(1);
  await page.keyboard.press("Escape");
  await readyPractice(page);
}

test("a native worker transport failure replaces the transferred canvas with the complete real document renderer", async ({
  page,
}, info) => {
  await observeNativeWorker(page, info);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await firstWorkerReady(page);
  await page.evaluate(() =>
    (window as AuditedWindow).openingWorkerAudit!.workers[0].dispatchEvent(
      new ErrorEvent("error", { message: "Injected worker transport failure" }),
    ),
  );
  await expectRecoveredDocumentScene(page);
});

async function nativeContextLoss(
  page: Page,
  info: TestInfo,
  phase: "preparation" | "live",
) {
  if (phase === "live") await observeNativeFallbackAnimations(page);
  await observeNativeWorker(page, info);
  await page.context().route(workerEntry, async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const injection = `
const originalOffscreenContext = OffscreenCanvas.prototype.getContext;
let contextForNativeLoss;
function requestNativeContextLoss() {
  if (!contextForNativeLoss) return;
  postMessage({type:"test-native-context-loss-requested"});
  contextForNativeLoss.loseContext();
}
OffscreenCanvas.prototype.getContext = function (...args) {
  const context = Reflect.apply(originalOffscreenContext, this, args);
  if (args[0] === "webgl2" && context) {
    const extension = context.getExtension("WEBGL_lose_context");
    postMessage({type:"test-context-loss-capability",supported:Boolean(extension)});
    contextForNativeLoss = extension;
    if (extension && ${JSON.stringify(phase)} === "preparation")
      setTimeout(requestNativeContextLoss, 100);
  }
  return context;
};
addEventListener("message", ({data}) => {
  if (data.type === "test-request-native-context-loss") requestAnimationFrame(() => {
    postMessage({type:"test-live-animation-frame"});
    requestNativeContextLoss();
  });
});
`;
    await route.fulfill({ response, body: injection + body });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) => receipt.type === "test-context-loss-capability",
      ),
    )
    .toBe(true);
  const available = (await records(page))[0].received.find(
    (receipt) => receipt.type === "test-context-loss-capability",
  )?.supported;
  test.skip(
    !available,
    "UNVERIFIED: this native worker has no WEBGL_lose_context extension.",
  );
  if (phase === "live") {
    await firstWorkerReady(page);
    const ready = (await records(page))[0].received.find(
      (receipt) => receipt.type === "ready",
    )?.diagnostics;
    if (!ready)
      throw new Error("No native worker readiness receipt before live loss");
    expect(ready.frames).toBeGreaterThan(0);
    expect(ready.drawCalls).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Set(
              (window as AuditedWindow)
                .fallbackAnimationAudit!.actions.filter(
                  (item) =>
                    item.action === "pause" &&
                    item.name === "awakening-key-dissolve",
                )
                .map((item) => item.id),
            ).size,
        ),
      )
      .toBe(61);
    // Diagnostics are batched every20 frames. Use a real worker RAF receipt to
    // establish live loss without waiting for that unrelated FPS sample window.
    const pausedSnapshots = await page.evaluate(async () => {
      // These are native document frames, not an advanced/faked clock. Let a
      // pending native pause settle, then prove the hidden phase stays fixed.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const before = (window as AuditedWindow).fallbackAnimationAudit!.sample();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const after = (window as AuditedWindow).fallbackAnimationAudit!.sample();
      (window as AuditedWindow).openingWorkerAudit!.workers[0].postMessage({
        type: "test-request-native-context-loss",
      });
      return { before, after };
    });
    await info.attach("native-hidden-fallback-phase", {
      body: JSON.stringify(pausedSnapshots),
      contentType: "application/json",
    });
    expect(pausedSnapshots.before).toHaveLength(61);
    expect(pausedSnapshots.after).toHaveLength(61);
    // Keep all five predicates for all 61 native samples, but report them in one
    // assertion. Hundreds of traced expect calls can consume the remaining
    // fixed 4.2s intro interval before the strict recovery draw is observed.
    const pausedPhaseErrors = pausedSnapshots.before.flatMap((before) => {
      const after = pausedSnapshots.after.find((item) => item.id === before.id);
      if (!after) return [`animation ${before.id}: missing second native sample`];
      const errors: string[] = [];
      if (before.state !== "paused") errors.push("first sample is not paused");
      if (after.state !== "paused") errors.push("second sample is not paused");
      if (before.renderer !== "webgl") errors.push("fallback is not hidden");
      if (
        typeof before.currentTime !== "number" ||
        typeof after.currentTime !== "number" ||
        !Number.isFinite(before.currentTime) ||
        !Number.isFinite(after.currentTime) ||
        Math.abs(after.currentTime - before.currentTime) >= 0.05
      )
        errors.push("native paused phase changed (one-decimal tolerance)");
      if (
        typeof before.timelineTime !== "number" ||
        typeof after.timelineTime !== "number" ||
        !(after.timelineTime > before.timelineTime)
      )
        errors.push("native document timeline did not advance");
      return errors.map((error) => `animation ${before.id}: ${error}`);
    });
    expect(pausedPhaseErrors).toEqual([]);
    await expect
      .poll(async () =>
        (await records(page))[0]?.received.some(
          (receipt) => receipt.type === "test-live-animation-frame",
        ),
      )
      .toBe(true);
  }
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) => receipt.type === "test-native-context-loss-requested",
      ),
    )
    .toBe(true);
  await expect
    .poll(async () =>
      (await records(page))[0]?.received.some(
        (receipt) => receipt.diagnostics?.contextLost,
      ),
    )
    .toBe(true);
  if (phase === "live") {
    const readActions = () =>
      page.evaluate(
        () => (window as AuditedWindow).fallbackAnimationAudit!.actions,
      );
    await expect
      .poll(async () => {
        const actions = await readActions();
        return new Set(
          actions
            .filter(
              (item) =>
                item.name === "awakening-key-dissolve" &&
                (item.action === "play" || item.action === "finish") &&
                item.renderer === "fallback",
            )
            .map((item) => item.id),
        ).size;
      })
      .toBe(61);
    const actions = await readActions();
    const pauses = actions.filter(
      (item, index) =>
        item.action === "pause" &&
        item.name === "awakening-key-dissolve" &&
        !actions
          .slice(0, index)
          .some(
            (earlier) => earlier.id === item.id && earlier.action === "pause",
          ),
    );
    const checked = pauses.map((pause) => {
      const resume = actions.find(
        (item) =>
          item.id === pause.id &&
          item.atMs >= pause.atMs &&
          (item.action === "play" || item.action === "finish"),
      );
      if (
        !resume ||
        pause.currentTime === null ||
        pause.timelineTime === null ||
        resume.timelineTime === null
      )
        return {
          id: pause.id,
          error: "missing finite native pause/resume phase",
        };
      const elapsed = Math.max(0, resume.timelineTime - pause.timelineTime);
      const expected = pause.currentTime + elapsed * pause.rate;
      const finished =
        pause.rate > 0 && pause.endTime !== null && expected >= pause.endTime;
      const expectedTime = finished ? pause.endTime! : expected;
      return {
        id: pause.id,
        pause,
        resume,
        elapsed,
        expectedTime,
        error:
          resume.timelineId !== pause.timelineId ||
          resume.rate !== pause.rate ||
          resume.renderer !== "fallback" ||
          resume.currentTime === null ||
          Math.abs(resume.currentTime - expectedTime) > 40 ||
          resume.action !== (finished ? "finish" : "play")
            ? "native fallback did not catch up on its original timeline"
            : null,
      };
    });
    await info.attach("native-fallback-resume-phase", {
      body: JSON.stringify(checked),
      contentType: "application/json",
    });
    expect(checked).toHaveLength(61);
    expect(checked.filter((item) => item.error)).toEqual([]);
  }
  await expectRecoveredDocumentScene(page);
}

test("actual worker WebGL context loss during preparation recovers with a fresh canvas and keeps practice usable", async ({
  page,
}, info) => {
  await nativeContextLoss(page, info, "preparation");
});

test("actual worker WebGL context loss after live frames recovers with a fresh canvas and keeps practice usable", async ({
  page,
}, info) => {
  await nativeContextLoss(page, info, "live");
});
