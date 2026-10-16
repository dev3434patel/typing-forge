import {
  createKeyboardScene,
  type KeyboardSceneHandle,
} from "./keyboard-scene";
import type {
  KeyboardWorkerRequest,
  KeyboardWorkerResponse,
} from "./keyboard-worker-protocol";

// DOM and worker share the renderer, not globals. Avoid mixing lib.dom and lib.webworker.
const host = globalThis as unknown as {
  postMessage(message: KeyboardWorkerResponse): void;
  addEventListener(
    name: "message",
    listener: (event: MessageEvent<KeyboardWorkerRequest>) => void,
  ): void;
  close(): void;
};
let scene: KeyboardSceneHandle | undefined;
let cancellation: AbortController | undefined;
let disposed = false;
const send = (message: KeyboardWorkerResponse) => host.postMessage(message);

host.addEventListener("message", async ({ data }) => {
  if (data.type === "dispose") {
    disposed = true;
    cancellation?.abort();
    scene?.dispose();
    scene = undefined;
    send({ type: "disposed" });
    host.close();
    return;
  }
  if (disposed) return;
  if (data.type === "initialize") {
    if (cancellation) return;
    cancellation = new AbortController();
    try {
      const handle = await createKeyboardScene(data.canvas, {
        lowPower: data.lowPower,
        finePointer: data.finePointer,
        viewport: data.viewport,
        signal: cancellation.signal,
        onFailure: () => {
          if (!disposed)
            send({
              type: "failure",
              message: "Worker WebGL context unavailable",
            });
        },
        onRestored: () => send({ type: "restored" }),
        onDiagnostics: (diagnostics) =>
          send({ type: "diagnostics", diagnostics }),
        onKey: (letter) => send({ type: "key", letter }),
        onProgress: (phase) => send({ type: "phase", phase }),
        onComplete: () => send({ type: "complete" }),
      });
      if (disposed) {
        handle.dispose();
        return;
      }
      scene = handle;
      send({ type: "ready", diagnostics: handle.getDiagnostics() });
    } catch (error) {
      if (!disposed)
        send({
          type: "failure",
          message:
            error instanceof Error ? error.message : "Worker rendering failed",
        });
    }
    return;
  }
  if (!scene) return;
  if (data.type === "start") scene.start(data.elapsedMs);
  if (data.type === "progress") scene.setProgress(data.progress);
  if (data.type === "resize") scene.resize(data.viewport);
  if (data.type === "pointer") scene.setPointer(data.x, data.y);
});
