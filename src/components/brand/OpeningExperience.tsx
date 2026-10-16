import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOpeningPreferences as usePreferences } from "@/lib/opening-preferences";
import { scheduleAfterFirstPaint } from "@/lib/after-first-paint";
import { BrandWordmark } from "./BrandMark";
import { KeyboardFallback } from "./KeyboardFallback";
import type { KeyboardSceneHandle } from "./keyboard-scene";
import {
  INTRO_PREFERENCE_EVENT,
  INTRO_REPLAY_EVENT,
  getOpeningMode,
  markOpeningExperienceSeen,
  openingDuration,
  shouldUseLowPowerScene,
  type OpeningMode,
} from "@/lib/opening-experience";
import "./opening-experience.css";

type Receipt = { name: string; status: "ready" | "pending" | "fallback" };
const WORDMARK = "SparowType";
const FADE_MS = 160;

/** Intro input is consumed before practice mounts; visual clocks never enter score evidence. */
export function OpeningExperience({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const [mode, setMode] = useState<OpeningMode>(() =>
    getOpeningMode(preferences.reducedMotion),
  );
  const [replay, setReplay] = useState(0);
  const [entered, setEntered] = useState(mode === "off");
  const [closing, setClosing] = useState(false);
  const [renderer, setRenderer] = useState<"loading" | "webgl" | "fallback">(
    "loading",
  );
  const [letters, setLetters] = useState(0);
  const [phase, setPhase] = useState("A signal becomes a keystroke.");
  const [hint, setHint] = useState(false);
  const [muted, setMuted] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pendingCanvas = useRef<((element: HTMLCanvasElement) => void) | null>(
    null,
  );
  const attachCanvas = useCallback((element: HTMLCanvasElement | null) => {
    canvas.current = element;
    if (element && pendingCanvas.current) {
      const accept = pendingCanvas.current;
      pendingCanvas.current = null;
      accept(element);
    }
  }, []);
  const scene = useRef<KeyboardSceneHandle | null>(null);
  const closeTimer = useRef<number>();
  const active = useRef(mode !== "off");
  const restoreFocus = useRef(false);
  const handoffCancellation = useRef<AbortController>();
  const handoff = useRef<Promise<
    ReturnType<(typeof import("./caret-handoff"))["beginCaretHandoff"]>
  > | null>(null);
  const sound = useRef<ReturnType<
    (typeof import("@/lib/keyboard-audio"))["createKeyboardAudio"]
  > | null>(null);
  const mutedRef = useRef(true);
  const audioSupported = typeof globalThis.AudioContext === "function";
  const progress = receipts.length
    ? receipts.filter((item) => item.status !== "pending").length /
      receipts.length
    : 0;
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const finish = useCallback((instant = false, automatic = false) => {
    if (!active.current) return;
    active.current = false;
    if (automatic && !instant && !restoreFocus.current) {
      const source = document
        .querySelector(".awakening-type-caret")
        ?.getBoundingClientRect();
      if (source?.width && source.height) {
        const cancellation = new AbortController();
        handoffCancellation.current = cancellation;
        const cancel = () => cancellation.abort();
        for (const name of ["keydown", "pointerdown", "resize", "scroll"])
          window.addEventListener(name, cancel, {
            capture: true,
            signal: cancellation.signal,
          });
        const importDeadline = window.setTimeout(cancel, 1000);
        cancellation.signal.addEventListener(
          "abort",
          () => clearTimeout(importDeadline),
          { once: true },
        );
        handoff.current = import("./caret-handoff")
          .then(({ beginCaretHandoff }) => {
            clearTimeout(importDeadline);
            return cancellation.signal.aborted
              ? null
              : beginCaretHandoff(source, cancellation);
          })
          .catch(() => {
            clearTimeout(importDeadline);
            cancellation.abort();
            return null;
          });
      }
    }
    markOpeningExperienceSeen();
    scene.current?.dispose();
    scene.current = null;
    setClosing(true);
    closeTimer.current = window.setTimeout(
      () => {
        setEntered(true);
        setMode("off");
        setClosing(false);
      },
      instant ? 0 : FADE_MS,
    );
  }, []);

  useEffect(() => {
    const replayIntro = () => {
      active.current = true;
      restoreFocus.current = true;
      setClosing(false);
      setLetters(0);
      setMode(
        preferences.reducedMotion ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "reduced"
          : "full",
      );
      setReplay((value) => value + 1);
    };
    const changed = (event: Event) => {
      if (
        (event as CustomEvent<{ enabled: boolean }>).detail?.enabled === false
      )
        finish(true);
    };
    window.addEventListener(INTRO_REPLAY_EVENT, replayIntro);
    window.addEventListener(INTRO_PREFERENCE_EVENT, changed);
    return () => {
      window.removeEventListener(INTRO_REPLAY_EVENT, replayIntro);
      window.removeEventListener(INTRO_PREFERENCE_EVENT, changed);
    };
  }, [finish, preferences.reducedMotion]);

  useEffect(() => {
    if (mode === "off") {
      void handoff.current?.then((caret) => caret?.complete());
      if (restoreFocus.current) {
        // The lazy Settings route may commit after the opening has unmounted.
        const restore = () => {
          const button = document.getElementById("sparowtype-replay-opening");
          if (
            !button?.getClientRects().length ||
            getComputedStyle(button).visibility === "hidden"
          )
            return;
          button.focus();
          restoreFocus.current = false;
          stop();
        };
        const observer = new MutationObserver(restore);
        const stop = () => {
          observer.disconnect();
          clearTimeout(timer);
        };
        const timer = window.setTimeout(stop, 5000);
        observer.observe(document.body, { childList: true, subtree: true });
        restore();
        return stop;
      }
      return;
    }
    let cancelled = false;
    const cancellation = new AbortController();
    const started = performance.now();
    const timers: number[] = [];
    let disposeScenePreparation: (() => void) | undefined;
    active.current = true;
    setRenderer(mode === "full" ? "loading" : "fallback");
    setLetters(mode === "full" ? 0 : WORDMARK.length);
    setHint(false);
    setPhase(
      mode === "full"
        ? "A signal becomes a keystroke."
        : "Your next rhythm starts here.",
    );
    const later = (callback: () => void, ms: number) =>
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) callback();
        }, ms),
      );
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.repeat) return;
      if (event.key === "Tab") return;
      if (
        document.activeElement instanceof HTMLButtonElement &&
        ["Enter", " "].includes(event.key)
      )
        return;
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      finish();
    };
    const hidden = () => {
      if (document.hidden) finish(true);
    };
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motionChanged = () => {
      if (media.matches) finish(true);
    };
    window.addEventListener("keydown", keydown, true);
    document.addEventListener("visibilitychange", hidden);
    media.addEventListener("change", motionChanged);
    later(() => setHint(true), 600);
    later(
      () => finish(mode === "reduced", true),
      openingDuration(mode) - (mode === "reduced" ? 0 : FADE_MS),
    );
    if (mode === "full") {
      setReceipts([
        { name: "Preferences", status: "ready" },
        {
          name: "Practice text",
          status: "pending",
        },
        { name: "Typefaces", status: "pending" },
        { name: "Keyboard scene", status: "pending" },
      ]);
      const receipt = (name: string, status: Receipt["status"]) => {
        if (!cancelled)
          setReceipts((items) =>
            items.map((item) =>
              item.name === name ? { ...item, status } : item,
            ),
          );
      };
      void import("@/lib/content-packs")
        .then(({ getContentPack }) => {
          receipt(
            "Practice text",
            getContentPack(preferences.language).words.length
              ? "ready"
              : "fallback",
          );
        })
        .catch(() => receipt("Practice text", "fallback"));
      let fontSettled = false;
      const fonts = Promise.all([
        document.fonts.load("700 72px Sora"),
        document.fonts.load('400 26px "JetBrains Mono Variable"'),
        document.fonts.load('400 16px "Inter Variable"'),
      ]);
      void fonts.then(
        () => {
          fontSettled = true;
          receipt("Typefaces", "ready");
        },
        () => {
          fontSettled = true;
          receipt("Typefaces", "fallback");
        },
      );
      later(() => {
        if (!fontSettled) receipt("Typefaces", "fallback");
      }, 2200);
      // Frame callbacks can precede contentful paint; give the visible opening priority.
      disposeScenePreparation = scheduleAfterFirstPaint(() => {
        if (cancelled || !active.current) return;
        void import("./keyboard-scene-bridge")
          .then(async (module) => {
            if (cancelled || !active.current || !canvas.current) return;
            const device = navigator as Navigator & {
              deviceMemory?: number;
            };
            const handle = await module.createOpeningKeyboardScene(
              canvas.current,
              {
                signal: cancellation.signal,
                replaceCanvas: () =>
                  new Promise<HTMLCanvasElement>((resolve, reject) => {
                    if (cancelled || cancellation.signal.aborted) {
                      reject(
                        new DOMException(
                          "Opening cancelled",
                          "AbortError",
                        ),
                      );
                      return;
                    }
                    const abort = () => {
                      pendingCanvas.current = null;
                      reject(
                        new DOMException(
                          "Opening cancelled",
                          "AbortError",
                        ),
                      );
                    };
                    cancellation.signal.addEventListener("abort", abort, {
                      once: true,
                    });
                    pendingCanvas.current = (replacement) => {
                      cancellation.signal.removeEventListener(
                        "abort",
                        abort,
                      );
                      resolve(replacement);
                    };
                    setCanvasVersion((value) => value + 1);
                  }),
                lowPower: shouldUseLowPowerScene({
                  hardwareConcurrency: device.hardwareConcurrency,
                  deviceMemory: device.deviceMemory,
                  coarsePointer: matchMedia("(pointer: coarse)").matches,
                }),
                onFailure: () => {
                  if (!cancelled) setRenderer("fallback");
                  receipt("Keyboard scene", "fallback");
                },
                onRestored: () => {
                  if (!cancelled) setRenderer("webgl");
                },
                onDiagnostics: (data) => {
                  if (canvas.current) {
                    canvas.current.dataset.scene = JSON.stringify(data);
                  }
                },
              },
            );
            if (cancelled || !active.current) {
              handle.dispose();
              return;
            }
            scene.current = handle;
            handle.setProgress(progressRef.current);
            setRenderer("webgl");
            receipt("Keyboard scene", "ready");
            handle.start(performance.now() - started);
          })
          .catch(() => {
            if (!cancelled) setRenderer("fallback");
            receipt("Keyboard scene", "fallback");
          });
      });
      later(() => {
        setRenderer((value) => (value === "loading" ? "fallback" : value));
      }, 850);
      later(() => setPhase("From possibility to precision."), 1600);
      later(() => setPhase("Ten keystrokes. One new beginning."), 2700);
      for (let index = 0; index < WORDMARK.length; index++)
        later(
          () => {
            setLetters(index + 1);
            if (!mutedRef.current) sound.current?.play("mechanical", 0.25);
          },
          2700 + index * 90,
        );
      later(() => setPhase("Make every keystroke yours."), 3600);
    } else setReceipts([]);
    return () => {
      cancelled = true;
      disposeScenePreparation?.();
      cancellation.abort();
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", keydown, true);
      document.removeEventListener("visibilitychange", hidden);
      media.removeEventListener("change", motionChanged);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [mode, replay, finish, preferences.language]);

  useEffect(() => {
    scene.current?.setProgress(progress);
  }, [progress]);
  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      handoffCancellation.current?.abort();
      void handoff.current?.then((caret) => caret?.dispose());
      sound.current?.dispose();
    },
    [],
  );
  const toggleSound = async () => {
    if (mutedRef.current) {
      try {
        const audio = (sound.current ??= (
          await import("@/lib/keyboard-audio")
        ).createKeyboardAudio());
        await audio.unlock();
      } catch {
        return;
      }
    }
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  };

  return (
    <>
      {entered && (
        <div
          data-workspace-root=""
          aria-hidden={mode !== "off" ? true : undefined}
          ref={(node) => {
            if (node) node.inert = mode !== "off";
          }}
          style={{ display: mode === "off" ? "contents" : "none" }}
        >
          {children}
        </div>
      )}
      {mode !== "off" && (
        <main
          key={replay}
          className="awakening"
          aria-label="SparowType introduction"
          data-mode={mode}
          data-renderer={renderer}
          data-closing={closing}
          data-testid="opening-experience"
          onClick={(event) => {
            if (!(event.target as Element).closest("button")) finish();
          }}
        >
          <p className="awakening-status" role="status" aria-live="polite">
            Loading SparowType
          </p>
          <div className="awakening-grid" aria-hidden="true" />
          <div className="awakening-coordinates" aria-hidden="true">
            <span>SPAROWTYPE / INPUT SYSTEM 01</span>
            <span>EST. 2026 · READY FOR YOUR RHYTHM</span>
          </div>
          <div className="awakening-signal" aria-hidden="true" />
          {mode === "full" && (
            <div className="awakening-scene" aria-hidden="true">
              <canvas
                key={canvasVersion}
                ref={attachCanvas}
                className="awakening-canvas"
              />
              <KeyboardFallback
                hidden={renderer === "webgl"}
                pressedKey={
                  letters > 0 ? WORDMARK[letters - 1].toUpperCase() : null
                }
              />
              <div className="awakening-orbit" />
            </div>
          )}
          <div className="awakening-title" aria-hidden="true">
            <span className="awakening-title-underlay">
              <BrandWordmark />
            </span>
            <span className="awakening-title-typed">
              <span>{WORDMARK.slice(0, Math.min(letters, 6))}</span>
              <span className="awakening-accent">
                {WORDMARK.slice(6, letters)}
              </span>
              <i className="awakening-type-caret" />
            </span>
          </div>
          <div className="awakening-caption" aria-hidden="true">
            <span className="awakening-caption-line" />
            {phase}
            <span className="awakening-caption-line" />
          </div>
          <div className="awakening-controls">
            <div className="awakening-readiness" aria-label="Asset readiness">
              {mode === "full" && (
                <>
                  <span>
                    {Math.round(progress * 100)
                      .toString()
                      .padStart(3, "0")}
                    %
                  </span>
                  <div className="awakening-readiness-track">
                    <span style={{ transform: `scaleX(${progress})` }} />
                  </div>
                  <span>
                    {receipts.some((item) => item.status === "fallback")
                      ? "Fallback ready"
                      : progress === 1
                        ? "Ready to type"
                        : "Preparing your workspace"}
                  </span>
                </>
              )}
            </div>
            <div className="awakening-actions">
              {mode === "full" && (
                <button
                  type="button"
                  className="awakening-mute"
                  disabled={!audioSupported}
                  aria-label={
                    !audioSupported
                      ? "Sound unavailable: intro audio is not supported in this browser"
                      : muted
                        ? "Sound off: enable intro sound"
                        : "Sound on: mute intro sound"
                  }
                  aria-pressed={!muted}
                  onClick={() => {
                    void toggleSound();
                  }}
                >
                  {!audioSupported
                    ? "Sound unavailable"
                    : muted
                      ? "Sound off"
                      : "Sound on"}
                  <span aria-hidden="true">{muted ? "○" : "◉"}</span>
                </button>
              )}
              <button
                type="button"
                className="awakening-skip"
                onClick={() => finish()}
              >
                Skip intro <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          <p
            className="awakening-skip-hint"
            aria-hidden="true"
            data-visible={hint}
          >
            Press any key, click or tap to enter
          </p>
        </main>
      )}
    </>
  );
}
export default OpeningExperience;
