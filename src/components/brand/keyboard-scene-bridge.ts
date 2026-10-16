import type {
  KeyboardSceneDiagnostics,
  KeyboardSceneHandle,
  KeyboardSceneOptions,
  KeyboardSceneViewport,
} from "./keyboard-scene";
import type {
  KeyboardWorkerRequest,
  KeyboardWorkerResponse,
} from "./keyboard-worker-protocol";
import keyboardWorkerUrl from "virtual:keyboard-worker-url";

export interface KeyboardSceneBridgeOptions extends KeyboardSceneOptions {
  /** A transferred canvas cannot regain a main-thread context. React owns its replacement. */
  replaceCanvas: (previous: HTMLCanvasElement) => Promise<HTMLCanvasElement>;
}

const cancelled = () => new DOMException("Opening cancelled", "AbortError");

/** Same scene and materials, with GPU preparation outside the document event loop. */
export async function createOpeningKeyboardScene(
  canvas: HTMLCanvasElement,
  options: KeyboardSceneBridgeOptions,
): Promise<KeyboardSceneHandle> {
  if (options.signal?.aborted) throw cancelled();
  const canTransfer =
    typeof Worker === "function" &&
    typeof OffscreenCanvas === "function" &&
    typeof canvas.transferControlToOffscreen === "function";
  if (!canTransfer) {
    const { createKeyboardScene } = await import("./keyboard-scene");
    if (options.signal?.aborted) throw cancelled();
    return createKeyboardScene(canvas, options);
  }

  let worker: Worker | undefined;
  let transferred = false;
  let stopped = false;
  let recovering = false;
  let ready = false;
  let fallback: KeyboardSceneHandle | undefined;
  let startedAt: number | undefined;
  let progress = 0;
  let pointerFrame = 0;
  let pointer = { x: 0, y: 0 };
  let shutdownTimer: number | undefined;
  let observer: ResizeObserver | undefined;
  let diagnostic: KeyboardSceneDiagnostics;
  let resolveReady: (handle: KeyboardSceneHandle) => void;
  let rejectReady: (reason: unknown) => void;
  const prepared = new Promise<KeyboardSceneHandle>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const viewport = (): KeyboardSceneViewport => ({
    width: Math.max(1, Math.round(canvas.clientWidth || innerWidth)),
    height: Math.max(1, Math.round(canvas.clientHeight || innerHeight)),
    pixelRatio: devicePixelRatio || 1,
  });
  const send = (message: KeyboardWorkerRequest, transfer?: Transferable[]) => {
    worker?.postMessage(message, transfer ?? []);
  };
  const resized = () => {
    if (stopped || recovering) return;
    send({ type: "resize", viewport: viewport() });
  };
  const sendPointer = () => {
    pointerFrame = 0;
    if (!stopped && !recovering) send({ type: "pointer", ...pointer });
  };
  const pointerMoved = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const bounds = canvas.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 2 - 1,
      y: ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 2 - 1,
    };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(sendPointer);
  };
  const pointerLeft = () => {
    pointer = { x: 0, y: 0 };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(sendPointer);
  };
  const disconnectDocument = () => {
    observer?.disconnect();
    observer = undefined;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    window.removeEventListener("resize", resized);
    window.removeEventListener("pointermove", pointerMoved);
    window.removeEventListener("pointerleave", pointerLeft);
    window.removeEventListener("blur", pointerLeft);
  };
  const terminate = () => {
    clearTimeout(shutdownTimer);
    worker?.terminate();
    worker = undefined;
  };
  const dispose = () => {
    if (stopped) return;
    stopped = true;
    disconnectDocument();
    options.signal?.removeEventListener("abort", dispose);
    fallback?.dispose();
    if (worker) {
      // Normally the worker acknowledges real resource disposal. Termination bounds
      // recovery when a driver is stuck compiling; the browser then owns context release.
      send({ type: "dispose" });
      shutdownTimer = window.setTimeout(terminate, 200);
    }
    if (!ready) rejectReady(cancelled());
  };
  const handle: KeyboardSceneHandle = {
    start(elapsedMs = 0) {
      if (stopped) return;
      startedAt = performance.now() - Math.max(0, elapsedMs);
      if (fallback) fallback.start(elapsedMs);
      else send({ type: "start", elapsedMs });
    },
    setProgress(value) {
      progress = value;
      if (fallback) fallback.setProgress(value);
      else if (!stopped) send({ type: "progress", progress: value });
    },
    resize(next) {
      if (fallback) fallback.resize(next);
      else if (!stopped) send({ type: "resize", viewport: next ?? viewport() });
    },
    setPointer(x, y) {
      if (fallback) fallback.setPointer(x, y);
      else if (!stopped) send({ type: "pointer", x, y });
    },
    dispose,
    getDiagnostics: () => fallback?.getDiagnostics() ?? { ...diagnostic },
  };
  const recover = async () => {
    if (stopped || recovering) return;
    recovering = true;
    disconnectDocument();
    terminate();
    options.onFailure();
    try {
      const replacement = transferred
        ? await options.replaceCanvas(canvas)
        : canvas;
      if (stopped || options.signal?.aborted) throw cancelled();
      const { createKeyboardScene } = await import("./keyboard-scene");
      if (stopped || options.signal?.aborted) throw cancelled();
      const recovered = await createKeyboardScene(replacement, options);
      if (stopped || options.signal?.aborted) {
        recovered.dispose();
        throw cancelled();
      }
      fallback = recovered;
      recovered.setProgress(progress);
      if (startedAt !== undefined)
        recovered.start(performance.now() - startedAt);
      recovering = false;
      options.onRestored?.();
      if (!ready) {
        ready = true;
        resolveReady(handle);
      }
    } catch (error) {
      if (!ready) rejectReady(error);
      if (!stopped) {
        options.onFailure();
        dispose();
      }
    }
  };
  const received = ({ data }: MessageEvent<KeyboardWorkerResponse>) => {
    if (data.type === "disposed") {
      terminate();
      return;
    }
    if (data.type === "diagnostics") {
      diagnostic = data.diagnostics;
      options.onDiagnostics?.(diagnostic);
      return;
    }
    if (stopped || recovering) return;
    if (data.type === "ready") {
      diagnostic = data.diagnostics;
      ready = true;
      const measured = viewport();
      if (
        measured.width !== diagnostic.width ||
        measured.height !== diagnostic.height ||
        Math.min(
          measured.pixelRatio,
          diagnostic.tier === "mobile" ? 1 : 1.5,
        ) !== diagnostic.pixelRatio
      )
        send({ type: "resize", viewport: measured });
      options.onDiagnostics?.(diagnostic);
      resolveReady(handle);
    } else if (data.type === "failure") void recover();
    else if (data.type === "restored") options.onRestored?.();
    else if (data.type === "phase") options.onProgress?.(data.phase);
    else if (data.type === "key") options.onKey?.(data.letter);
    else if (data.type === "complete") options.onComplete?.();
  };

  options.signal?.addEventListener("abort", dispose, { once: true });
  try {
    worker = new Worker(keyboardWorkerUrl, {
      type: "module",
      name: "SparowType keyboard renderer",
    });
    worker.addEventListener("message", received);
    worker.addEventListener("error", (event) => {
      event.preventDefault();
      void recover();
    });
    worker.addEventListener("messageerror", () => void recover());
    const offscreen = canvas.transferControlToOffscreen();
    transferred = true;
    send(
      {
        type: "initialize",
        canvas: offscreen,
        lowPower: options.lowPower,
        finePointer: !options.lowPower && matchMedia("(pointer: fine)").matches,
        viewport: viewport(),
      },
      [offscreen],
    );
    window.addEventListener("resize", resized);
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(resized);
      observer.observe(canvas);
    }
    if (!options.lowPower && matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", pointerMoved, { passive: true });
      window.addEventListener("pointerleave", pointerLeft);
      window.addEventListener("blur", pointerLeft);
    }
  } catch {
    void recover();
  }
  return prepared;
}
