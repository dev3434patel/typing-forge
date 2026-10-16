import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createKeyboardScene,
  type KeyboardSceneDiagnostics,
} from "./keyboard-scene";

const driver = vi.hoisted(() => ({
  renderers: [] as Array<{
    canvas: EventTarget;
    dispose: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    setAnimationLoop: ReturnType<typeof vi.fn>;
  }>,
  environmentDispose: vi.fn(),
  loseDuringEnvironment: false,
  compile: undefined as undefined | (() => Promise<void>),
}));
vi.mock("three", async (original) => {
  const actual = await original<typeof import("three")>();
  return {
    ...actual,
    WebGLRenderer: class {
      canvas: EventTarget;
      debug = {};
      shadowMap = {};
      info = { autoReset: false, render: { calls: 7 }, reset() {} };
      dispose = vi.fn();
      render = vi.fn();
      forceContextLoss = vi.fn();
      setAnimationLoop = vi.fn();
      setClearColor = vi.fn();
      setDrawingBufferSize = vi.fn();
      compileAsync = () => driver.compile?.() ?? Promise.resolve();
      constructor({ canvas }: { canvas: EventTarget }) {
        this.canvas = canvas;
        driver.renderers.push(this);
      }
    },
  };
});
vi.mock("./keyboard-environment", () => ({
  createKeyboardEnvironment: (
    _renderer: unknown,
    scene: { environmentIntensity: number },
  ) => {
    scene.environmentIntensity = 0.35;
    if (driver.loseDuringEnvironment)
      queueMicrotask(() =>
        driver.renderers
          .at(-1)!
          .canvas.dispatchEvent(
            new Event("webglcontextlost", { cancelable: true }),
          ),
      );
    return { dispose: driver.environmentDispose };
  },
}));
vi.mock("./keyboard-model", async (original) => ({
  ...(await original<typeof import("./keyboard-model")>()),
  paintKeyboardLegends: () => ({
    uvOffsets: new Float32Array(122),
    uvScales: new Float32Array(122).fill(0.1),
    planeSizes: new Float32Array(122).fill(0.1),
  }),
}));

class TestCanvas extends EventTarget {
  width = 1;
  height = 1;
}
const options = (
  lowPower: boolean,
  onDiagnostics: (data: KeyboardSceneDiagnostics) => void,
  signal?: AbortSignal,
) => ({
  lowPower,
  finePointer: false,
  signal,
  onDiagnostics,
  viewport: { width: 800, height: 600, pixelRatio: 1 },
  onFailure: vi.fn(),
  onRestored: vi.fn(),
});
beforeEach(() => {
  driver.renderers = [];
  driver.environmentDispose.mockReset();
  driver.loseDuringEnvironment = false;
  driver.compile = undefined;
  vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
  vi.stubGlobal("OffscreenCanvas", TestCanvas);
});
afterEach(() => vi.unstubAllGlobals());

describe("scene preparation lifecycle", () => {
  it("owns real context events while desktop FX import is still pending", async () => {
    driver.loseDuringEnvironment = true;
    const receipts: KeyboardSceneDiagnostics[] = [];
    const settings = options(false, (receipt) => receipts.push(receipt));
    await expect(
      createKeyboardScene(
        new TestCanvas() as unknown as OffscreenCanvas,
        settings,
      ),
    ).rejects.toThrow("cancelled");
    expect(receipts.some((receipt) => receipt.contextLost)).toBe(true);
    expect(receipts.at(-1)).toMatchObject({
      contextLost: true,
      disposed: true,
      frames: 0,
    });
    expect(driver.renderers[0].dispose).toHaveBeenCalledOnce();
    expect(driver.environmentDispose).toHaveBeenCalledOnce();
    expect(driver.renderers[0].render).not.toHaveBeenCalled();
    expect(
      driver.renderers[0].setAnimationLoop.mock.calls.every(
        ([callback]) => callback === null,
      ),
    ).toBe(true);
  });

  it("cannot return a ready scene after aborting an asynchronous shader preparation", async () => {
    let completeCompile = () => {};
    driver.compile = () =>
      new Promise<void>((resolve) => {
        completeCompile = resolve;
      });
    const cancellation = new AbortController();
    const receipts: KeyboardSceneDiagnostics[] = [];
    const pending = createKeyboardScene(
      new TestCanvas() as unknown as OffscreenCanvas,
      options(true, (receipt) => receipts.push(receipt), cancellation.signal),
    );
    const rejected = expect(pending).rejects.toThrow("cancelled");
    cancellation.abort();
    completeCompile();
    await rejected;
    expect(receipts.at(-1)).toMatchObject({
      disposed: true,
      frames: 0,
      asyncShaderCompile: true,
    });
    expect(driver.renderers[0].dispose).toHaveBeenCalledOnce();
    expect(driver.environmentDispose).toHaveBeenCalledOnce();
    expect(driver.renderers[0].render).not.toHaveBeenCalled();
  });

  it("keeps post-readiness context restoration available without reviving disposed scenes", async () => {
    const element = new TestCanvas();
    const settings = options(true, () => {});
    const handle = await createKeyboardScene(
      element as unknown as OffscreenCanvas,
      settings,
    );
    element.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(handle.getDiagnostics()).toMatchObject({
      contextLost: true,
      disposed: false,
    });
    element.dispatchEvent(new Event("webglcontextrestored"));
    const nextFrame =
      driver.renderers[0].setAnimationLoop.mock.calls.at(-1)![0];
    nextFrame(performance.now());
    expect(settings.onRestored).toHaveBeenCalledOnce();
    expect(handle.getDiagnostics()).toMatchObject({
      contextLost: false,
      disposed: false,
    });
    handle.dispose();
    const callbacksAfterDisposal =
      driver.renderers[0].setAnimationLoop.mock.calls.length;
    element.dispatchEvent(new Event("webglcontextrestored"));
    expect(driver.renderers[0].setAnimationLoop.mock.calls).toHaveLength(
      callbacksAfterDisposal,
    );
    expect(driver.environmentDispose).toHaveBeenCalledOnce();
  });
});
