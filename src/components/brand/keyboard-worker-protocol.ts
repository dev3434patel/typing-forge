import type {
  KeyboardSceneDiagnostics,
  KeyboardSceneViewport,
} from "./keyboard-scene";

/** Structured-clone messages only: the rendering worker never owns document input. */
export type KeyboardWorkerRequest =
  | {
      type: "initialize";
      canvas: OffscreenCanvas;
      lowPower: boolean;
      finePointer: boolean;
      viewport: KeyboardSceneViewport;
    }
  | { type: "start"; elapsedMs: number }
  | { type: "progress"; progress: number }
  | { type: "resize"; viewport: KeyboardSceneViewport }
  | { type: "pointer"; x: number; y: number }
  | { type: "dispose" };

export type KeyboardWorkerResponse =
  | { type: "ready"; diagnostics: KeyboardSceneDiagnostics }
  | { type: "diagnostics"; diagnostics: KeyboardSceneDiagnostics }
  | { type: "key"; letter: string }
  | { type: "phase"; phase: string }
  | { type: "complete" }
  | { type: "restored" }
  | { type: "failure"; message: string }
  | { type: "disposed" };
