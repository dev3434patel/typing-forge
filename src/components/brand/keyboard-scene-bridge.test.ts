import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOpeningKeyboardScene } from "./keyboard-scene-bridge";
import { createKeyboardScene } from "./keyboard-scene";
import type {
  KeyboardSceneDiagnostics,
  KeyboardSceneHandle,
} from "./keyboard-scene";
import type {
  KeyboardWorkerRequest,
  KeyboardWorkerResponse,
} from "./keyboard-worker-protocol";

vi.mock("./keyboard-scene", () => ({ createKeyboardScene: vi.fn() }));

class RendererWorker extends EventTarget {
  static instances: RendererWorker[] = [];
  messages: KeyboardWorkerRequest[] = [];
  terminate = vi.fn();
  constructor() {
    super();
    RendererWorker.instances.push(this);
  }
  postMessage(message: KeyboardWorkerRequest) {
    this.messages.push(message);
  }
  reply(message: KeyboardWorkerResponse) {
    this.dispatchEvent(new MessageEvent("message", { data: message }));
  }
}
const diagnostics = (
  patch: Partial<KeyboardSceneDiagnostics> = {},
): KeyboardSceneDiagnostics => ({
  renderer: "webgl2",
  thread: "worker",
  keyCount: 61,
  keycapMeshes: 1,
  tier: "desktop",
  bloom: true,
  environment: true,
  environmentIntensity: 0.35,
  cameraElevationDegrees: 35,
  pixelRatio: 1,
  width: 800,
  height: 600,
  frames: 1,
  averageFps: 0,
  drawCalls: 8,
  degraded: false,
  contextLost: false,
  disposed: false,
  asyncShaderCompile: false,
  shaderPreparationMs: 0,
  ...patch,
});
const canvas = () =>
  ({
    clientWidth: 800,
    clientHeight: 600,
    transferControlToOffscreen: vi.fn(() => ({ transferred: true })),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  }) as unknown as HTMLCanvasElement;
let compatibility: KeyboardSceneHandle;
const options = () => ({
  lowPower: false,
  onFailure: vi.fn(),
  onRestored: vi.fn(),
  onDiagnostics: vi.fn(),
  replaceCanvas: vi.fn(async () => canvas()),
});

beforeEach(() => {
  RendererWorker.instances = [];
  const documentEvents = new EventTarget();
  vi.stubGlobal(
    "window",
    Object.assign(documentEvents, { setTimeout, clearTimeout }),
  );
  vi.stubGlobal("Worker", RendererWorker);
  vi.stubGlobal("OffscreenCanvas", class {});
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("innerWidth", 800);
  vi.stubGlobal("innerHeight", 600);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  compatibility = {
    start: vi.fn(),
    setProgress: vi.fn(),
    resize: vi.fn(),
    setPointer: vi.fn(),
    dispose: vi.fn(),
    getDiagnostics: () => diagnostics({ thread: "main-thread" }),
  };
  vi.mocked(createKeyboardScene).mockReset().mockResolvedValue(compatibility);
});
afterEach(() => vi.unstubAllGlobals());

describe("renderer worker ownership and recovery", () => {
  it("uses the shared main-thread renderer when transfer is unavailable", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const element = canvas(),
      settings = options();
    const result = await createOpeningKeyboardScene(element, settings);
    expect(result).toBe(compatibility);
    expect(createKeyboardScene).toHaveBeenCalledWith(element, settings);
    expect(RendererWorker.instances).toHaveLength(0);
    expect(settings.replaceCanvas).not.toHaveBeenCalled();
  });

  it("transfers once and forwards viewport, progress and time without document rendering", async () => {
    const element = canvas(),
      settings = options();
    const pending = createOpeningKeyboardScene(element, settings);
    const worker = RendererWorker.instances[0];
    expect(element.transferControlToOffscreen).toHaveBeenCalledTimes(1);
    expect(worker.messages[0]).toMatchObject({
      type: "initialize",
      lowPower: false,
      finePointer: true,
      viewport: { width: 800, height: 600, pixelRatio: 2 },
    });
    worker.reply({ type: "ready", diagnostics: diagnostics() });
    const handle = await pending;
    handle.start(350);
    handle.setProgress(0.75);
    handle.setPointer(0.2, -0.1);
    expect(worker.messages).toEqual(
      expect.arrayContaining([
        { type: "start", elapsedMs: 350 },
        { type: "progress", progress: 0.75 },
        { type: "pointer", x: 0.2, y: -0.1 },
      ]),
    );
    expect(createKeyboardScene).not.toHaveBeenCalled();
    handle.dispose();
    worker.reply({ type: "disposed" });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it("replaces a transferred canvas before compatibility recovery", async () => {
    const element = canvas(),
      settings = options();
    const replacement = canvas();
    settings.replaceCanvas.mockResolvedValue(replacement);
    const pending = createOpeningKeyboardScene(element, settings);
    const worker = RendererWorker.instances[0];
    worker.reply({ type: "failure", message: "No worker context" });
    const handle = await pending;
    expect(settings.replaceCanvas).toHaveBeenCalledWith(element);
    expect(createKeyboardScene).toHaveBeenCalledWith(replacement, settings);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(settings.onRestored).toHaveBeenCalledOnce();
    handle.dispose();
    expect(compatibility.dispose).toHaveBeenCalledOnce();
  });

  it("does not replace an untransferred canvas after worker construction failure", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw new Error("Worker blocked");
        }
      },
    );
    const element = canvas(),
      settings = options();
    const handle = await createOpeningKeyboardScene(element, settings);
    expect(settings.replaceCanvas).not.toHaveBeenCalled();
    expect(createKeyboardScene).toHaveBeenCalledWith(element, settings);
    handle.dispose();
  });

  it("aborts pending initialization and waits for actual worker disposal acknowledgement", async () => {
    const cancellation = new AbortController(),
      settings = options();
    const pending = createOpeningKeyboardScene(canvas(), {
      ...settings,
      signal: cancellation.signal,
    });
    const worker = RendererWorker.instances[0];
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    cancellation.abort();
    await rejected;
    expect(worker.messages.at(-1)).toEqual({ type: "dispose" });
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.reply({
      type: "diagnostics",
      diagnostics: diagnostics({ disposed: true }),
    });
    worker.reply({ type: "disposed" });
    expect(settings.onDiagnostics).toHaveBeenLastCalledWith(
      expect.objectContaining({ disposed: true }),
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(createKeyboardScene).not.toHaveBeenCalled();
  });

  it("preserves the running timeline and real progress after a worker context failure", async () => {
    const settings = options();
    const pending = createOpeningKeyboardScene(canvas(), settings);
    const worker = RendererWorker.instances[0];
    worker.reply({ type: "ready", diagnostics: diagnostics() });
    const handle = await pending;
    handle.start(900);
    handle.setProgress(0.5);
    worker.reply({ type: "failure", message: "Context lost" });
    await vi.waitFor(() =>
      expect(compatibility.start).toHaveBeenCalledWith(expect.any(Number)),
    );
    expect(
      vi.mocked(compatibility.start).mock.calls[0][0],
    ).toBeGreaterThanOrEqual(900);
    expect(compatibility.setProgress).toHaveBeenCalledWith(0.5);
    handle.dispose();
  });

  it("rejects failed canvas replacement and leaves the CSS fallback available", async () => {
    const settings = options();
    settings.replaceCanvas.mockRejectedValue(new Error("Opening removed"));
    const pending = createOpeningKeyboardScene(canvas(), settings);
    const rejected = expect(pending).rejects.toThrow("Opening removed");
    RendererWorker.instances[0].reply({
      type: "failure",
      message: "Context lost",
    });
    await rejected;
    expect(settings.onFailure).toHaveBeenCalled();
    expect(createKeyboardScene).not.toHaveBeenCalled();
  });
});
