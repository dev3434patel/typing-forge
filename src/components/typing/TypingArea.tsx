import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Pause,
  Play,
  RotateCcw,
  Flag,
  Keyboard,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  SessionController,
  graphemes,
  utf16ToGraphemeOffset,
  type SessionConfig,
  type SessionResult,
  type SessionSnapshot,
  type InputProvenance,
} from "@/lib/typing-core";
import { usePreferences } from "@/contexts/PreferencesContext";
import { getContentPack } from "@/lib/content-packs";
import { cn } from "@/lib/utils";
import { TypingPassage } from "./TypingPassage";
import { TypingFeedback } from "./TypingFeedback";
import { OpponentPaceMarker } from "./OpponentPaceMarker";
import { opponentPacePosition, type RacePace } from "@/lib/race-pace";
import type { KeyboardAudio } from "@/lib/keyboard-audio";
import { useWordCorrection, WORD_CORRECTION_NOTICE } from "@/hooks/useWordCorrection";
import {
  typingCaretAnchor,
  typingCaretGeometry,
  type TypingCaretAnchor,
} from "./typing-caret-geometry";

interface Props {
  configuration: SessionConfig;
  onTestComplete: (result: SessionResult) => void;
  onRestart?: () => void;
  onStatusChange?: (status: SessionSnapshot["status"]) => void;
  appendContent?: () => string;
  controller?: SessionController;
  onSnapshot?: (snapshot: SessionSnapshot) => void;
  opponentPace?: RacePace;
  autoFocus?: boolean;
}
const number = (value: number | null, decimals = 0) =>
  value === null ? "—" : value.toFixed(decimals);
export function TypingArea({
  configuration,
  onTestComplete,
  onRestart,
  onStatusChange,
  appendContent,
  controller: supplied,
  onSnapshot,
  opponentPace,
  autoFocus,
}: Props) {
  const { preferences: p } = usePreferences();
  const [controller] = useState(
    () =>
      supplied ??
      new SessionController(configuration, {
        now: () => performance.now(),
        wallNow: () => Date.now(),
      }),
  );
  const [snapshot, setSnapshot] = useState(() => controller.snapshot());
  const [value, setValue] = useState(""),
    [focused, setFocused] = useState(false),
    [revealed, setRevealed] = useState(false);
  const [inputHint, setInputHint] = useState("");
  const [capsLock, setCapsLock] = useState<boolean | null>(null);
  const [caretPosition, setCaretPosition] = useState<TypingCaretAnchor | null>(
    null,
  );
  const textarea = useRef<HTMLTextAreaElement>(null),
    endCaret = useRef<HTMLSpanElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    passage = useRef<HTMLDivElement>(null),
    resumeButton = useRef<HTMLButtonElement>(null);
  const composing = useRef(false),
    provenance = useRef<InputProvenance>("keyboard"),
    finished = useRef(false),
    committedComposition = useRef<string | null>(null);
  const callbacks = useRef({
    onTestComplete,
    onStatusChange,
    appendContent,
    onSnapshot,
  });
  callbacks.current = {
    onTestComplete,
    onStatusChange,
    appendContent,
    onSnapshot,
  };
  const audio = useRef<KeyboardAudio | null>(null);
  const canPause = configuration.mode !== "race" && !configuration.challengeId;
  const tabIndents =
    configuration.mode === "code" &&
    configuration.settings?.tabIndents === true;
  const update = useCallback(
    (next: SessionSnapshot) => {
      if (
        callbacks.current.appendContent &&
        ["time", "zen"].includes(configuration.mode) &&
        graphemes(next.targetText).length - next.cursor < 160 &&
        next.status !== "finished"
      ) {
        controller.appendTarget(` ${callbacks.current.appendContent()}`);
        next = controller.snapshot();
      }
      setSnapshot(next);
      callbacks.current.onSnapshot?.(next);
      callbacks.current.onStatusChange?.(next.status);
      if (
        next.status === "finished" &&
        controller.result &&
        !finished.current
      ) {
        finished.current = true;
        callbacks.current.onTestComplete(controller.result);
      }
    },
    [controller, configuration.mode],
  );
  useEffect(() => {
    if (snapshot.status !== "running") return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      // The controller reads performance.now(); this timer only refreshes presentation.
      const next = controller.tick();
      update(next);
      if (next.status === "running") timer = setTimeout(refresh, 100);
    };
    timer = setTimeout(refresh, 100);
    return () => clearTimeout(timer);
  }, [controller, update, snapshot.status]);
  useEffect(() => {
    const input = textarea.current;
    if (!input) return;
    const blockTransfer = (event: InputEvent) => {
      if (!["insertFromPaste", "insertFromDrop"].includes(event.inputType))
        return;
      event.preventDefault();
      provenance.current = "keyboard";
      setInputHint("Paste is disabled during typing practice.");
    };
    input.addEventListener("beforeinput", blockTransfer);
    return () => input.removeEventListener("beforeinput", blockTransfer);
  }, []);
  const measureCaret = useCallback(() => {
    const container = viewport.current;
    const text = passage.current;
    if (!container || !text) return;
    const current = text.querySelector<HTMLElement>('[data-current="true"]');
    const anchor = current ?? endCaret.current;
    const fragment = anchor?.getClientRects()[0];
    if (!fragment) return;
    const bounds = container.getBoundingClientRect();
    const next = typingCaretAnchor(fragment, bounds, {
      fontSize: p.fontSize,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      rtl: container.dir === "rtl",
    });
    if (!next) return;
    setCaretPosition((previous) =>
      previous?.top === next.top &&
      previous.leading === next.leading &&
      previous.height === next.height &&
      previous.width === next.width &&
      previous.rtl === next.rtl
        ? previous
        : next,
    );
    // Keep the active line in the middle row; never scroll part of a line.
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
    const row = Math.floor(Math.max(0, next.top) / lineHeight);
    const scrollTop = Math.max(0, row - 1) * lineHeight;
    if (container.scrollTop !== scrollTop) container.scrollTop = scrollTop;
  }, [p.fontSize]);
  useLayoutEffect(() => {
    measureCaret();
  }, [
    measureCaret,
    snapshot.cursor,
    snapshot.finalText,
    snapshot.targetText,
    focused,
    revealed,
  ]);
  useLayoutEffect(() => {
    const container = viewport.current;
    const text = passage.current;
    if (!container || !text) return;
    let active = true;
    const measure = () => {
      if (active) measureCaret();
    };
    // Observer/font ownership survives insertions. A normal keystroke needs only
    // the synchronous measurement above, without a new observer and font promise.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(text);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [measureCaret]);
  useEffect(() => {
    // Desktop users can type immediately. Touch users choose when to open their keyboard.
    if (autoFocus ?? matchMedia("(pointer: fine)").matches)
      textarea.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  useLayoutEffect(() => {
    if (snapshot.status !== "paused") return;
    resumeButton.current?.focus({ preventScroll: true });
    viewport.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [snapshot.status]);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "forge-focused",
      focused && snapshot.status === "running",
    );
    return () => document.documentElement.classList.remove("forge-focused");
  }, [focused, snapshot.status]);
  useEffect(() => {
    if (!p.sound) return;
    let active = true;
    // Loading the module and its factory does not create an AudioContext.
    void import("@/lib/keyboard-audio")
      .then(({ createKeyboardAudio }) => {
        if (active) audio.current = createKeyboardAudio();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      audio.current?.dispose();
      audio.current = null;
    };
  }, [p.sound]);
  const sound = () => {
    if (!p.sound || !p.volume) return;
    const engine = audio.current;
    if (engine)
      void engine
        .unlock()
        .then(() => engine.play(p.soundPack, p.volume))
        .catch(() => undefined);
  };
  const wordCorrection = useWordCorrection({
    controller,
    inputRef: textarea,
    composing,
    onSnapshot: (next) => {
      setValue(next.finalText);
      update(next);
      sound();
    },
    onNotice: setInputHint,
  });
  const commit = (
    newValue: string,
    source: InputProvenance = provenance.current,
    compositionId?: string,
  ) => {
    const oldUnits = graphemes(controller.currentText),
      newUnits = graphemes(
        configuration.scoringPolicy === "code"
          ? newValue
          : newValue.normalize("NFC"),
      );
    let start = 0;
    while (
      start < oldUnits.length &&
      start < newUnits.length &&
      oldUnits[start] === newUnits[start]
    )
      start++;
    let end = oldUnits.length,
      newEnd = newUnits.length;
    while (
      end > start &&
      newEnd > start &&
      oldUnits[end - 1] === newUnits[newEnd - 1]
    ) {
      end--;
      newEnd--;
    }
    if (start === end && start === newEnd) return;
    const text = newUnits.slice(start, newEnd).join("");
    const touchesPreviousWord = start < controller.editableStart;
    const next = controller.input({
      type: compositionId
        ? "composition"
        : text
          ? end > start
            ? "replace"
            : "insert"
          : "delete",
      start,
      end,
      text,
      provenance: source,
      compositionId,
    });
    if (textarea.current && textarea.current.value !== next.finalText)
      textarea.current.value = next.finalText;
    setValue(next.finalText);
    update(next);
    setInputHint(touchesPreviousWord ? WORD_CORRECTION_NOTICE : "");
    provenance.current = "keyboard";
    if (!touchesPreviousWord && (text || oldUnits.length > newUnits.length)) sound();
  };
  const pack = getContentPack(configuration.language || "en");
  const free = configuration.scoringPolicy === "free";
  const rival =
    configuration.mode === "race" && !free ? opponentPace : undefined;
  const rivalPosition = rival
    ? opponentPacePosition(
        snapshot.characters.filter((slot) => slot.expected !== null).length,
        { cursor: rival.position },
      )
    : 0;
  const gap = rivalPosition - snapshot.cursor;
  const pace = Math.floor((snapshot.elapsedMs / 60000) * p.targetWpm * 5);
  const visibleSlots = snapshot.characters;
  const caretBox =
    caretPosition && typingCaretGeometry(caretPosition, p.caretStyle);
  const clock =
    snapshot.remainingMs !== null
      ? Math.ceil(snapshot.remainingMs / 1000)
      : Math.floor(snapshot.elapsedMs / 1000);
  return (
    <section
      className="typing-workspace w-full forge-appear"
      aria-label="Typing session"
      data-session-id={configuration.clientSessionId}
      data-focused={focused}
      data-status={snapshot.status}
    >
      <div className="typing-hud flex items-center justify-between mb-4 gap-4">
        <div className="flex gap-7 items-end min-h-12">
          <div>
            <span className="text-3xl font-mono text-primary">
              {clock}
              <span className="text-base ml-1 text-muted-foreground">s</span>
            </span>
            <span className="sr-only">
              {snapshot.remainingMs !== null ? "remaining" : "elapsed"}
            </span>
          </div>
          {p.liveStats && (
            <>
              <div>
                <span className="text-2xl font-mono">
                  {number(
                    snapshot.elapsedMs < 1000 ? null : snapshot.metrics.wpm,
                  )}
                </span>
                <span className="text-xs text-muted-foreground ml-2">wpm</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-mono">
                  {number(snapshot.metrics.inputAccuracy)}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  acc %
                </span>
              </div>
            </>
          )}
        </div>
        <span className="eyebrow hidden sm:block">
          {snapshot.status === "ready"
            ? "Ready when you are"
            : snapshot.status === "paused"
              ? "Paused practice"
              : "Find your rhythm"}
        </span>
      </div>
      {rival && (
        <div
          id="race-pace-legend"
          className="race-pace-legend"
          data-testid="race-pace-legend"
          data-position={rivalPosition}
        >
          <span>
            <i className="race-you-swatch" aria-hidden="true" />
            You
          </span>
          <span>
            <i className="race-opponent-swatch" aria-hidden="true" />
            {rival.label}
            {rival.approximate ? " · confirmed progress" : " pace"}
          </span>
          <span className="font-mono">
            {rival.wpm === null || !Number.isFinite(rival.wpm)
              ? "—"
              : Math.round(rival.wpm)}{" "}
            wpm
          </span>
          <span>
            {gap === 0
              ? "Alongside you"
              : `${Math.abs(gap)} characters ${gap > 0 ? "ahead" : "behind"}`}
          </span>
        </div>
      )}
      <div className="relative">
        <div className="typing-stage relative py-2">
          <div
            ref={viewport}
            data-testid="typing-viewport"
            className="typing-viewport overflow-hidden scrollbar-hide relative"
            aria-hidden="true"
            dir={pack.direction}
            style={
              {
                fontFamily: pack.font,
                height: p.fontSize * 1.9 * 3,
                "--typing-size": `${p.fontSize}px`,
              } as CSSProperties
            }
          >
            {caretBox && (
              <span
                data-testid="typing-caret"
                className={cn(
                  "forge-caret font-mono",
                  p.caretStyle === "block" && "caret-block",
                  p.caretStyle === "underline" && "caret-underline",
                  p.caretStyle === "outline" && "caret-outline",
                  snapshot.status === "ready" && "typing-caret-blink",
                )}
                style={{
                  left: 0,
                  top: 0,
                  bottom: "auto",
                  insetInlineStart: "auto",
                  fontSize: p.fontSize,
                  width: caretBox.width,
                  height: caretBox.height,
                  transform: `translate3d(${caretBox.left}px, ${caretBox.top}px, 0)`,
                  transition:
                    p.smoothCaret && !p.reducedMotion
                      ? "transform 85ms cubic-bezier(.2,.8,.2,1)"
                      : "none",
                  zIndex: rival ? 3 : 1,
                }}
              />
            )}
            {rival && (
              <OpponentPaceMarker
                position={rivalPosition}
                viewportRef={viewport}
                passageRef={passage}
                revision={snapshot.finalText}
                ownCursor={snapshot.cursor}
                fontSize={p.fontSize}
                smooth={p.smoothCaret && !p.reducedMotion}
              />
            )}
            <div
              ref={passage}
              className="typing-text relative pb-5"
              data-testid="typing-target"
              style={{ fontFamily: pack.font }}
            >
              {free ? (
                <span className="char-correct">
                  {snapshot.finalText}
                  <span
                    ref={endCaret}
                    className="typing-free-end"
                    data-caret-end-anchor
                  />
                  {!snapshot.finalText && (
                    <span className="text-muted-foreground">
                      A blank page. Write freely, and finish when you’re ready.
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <TypingPassage
                    slots={visibleSlots}
                    cursor={snapshot.cursor}
                    preserveWhitespace={configuration.scoringPolicy === "code"}
                    characterClassName={
                      rival
                        ? (slot) =>
                            slot.expected !== null &&
                            slot.status === "untyped" &&
                            slot.index < rivalPosition
                              ? "opponent-passed"
                              : undefined
                        : undefined
                    }
                    marker={null}
                    renderBefore={(slot) =>
                      p.paceCaret && !rival && slot.index === pace ? (
                        <span className="absolute top-0 bottom-0 border-l border-dashed border-primary/40" />
                      ) : null
                    }
                  />
                  <span
                    ref={endCaret}
                    className="typing-free-end"
                    data-caret-end-anchor
                  />
                </>
              )}
              {rival && (
                <span className="typing-free-end" data-opponent-end-anchor />
              )}
            </div>
          </div>
          <p id="typing-passage" className="sr-only">
            {free
              ? "Free writing practice."
              : `Practice passage: ${snapshot.targetText}`}
          </p>
          <textarea
            ref={textarea}
            aria-label="Typing input"
            aria-describedby={
              free
                ? "typing-instructions typing-passage"
                : `typing-instructions typing-passage typing-feedback${rival ? " race-pace-legend" : ""}`
            }
            value={value}
            onChange={(event) => {
              if (
                ["insertFromPaste", "insertFromDrop"].includes(
                  (event.nativeEvent as InputEvent).inputType,
                )
              ) {
                event.currentTarget.value = value;
                provenance.current = "keyboard";
                setInputHint("Paste is disabled during typing practice.");
                return;
              }
              setValue(event.target.value);
              if (!composing.current) {
                if (committedComposition.current === event.target.value) {
                  committedComposition.current = null;
                  return;
                }
                commit(event.target.value);
              }
            }}
            onFocus={() => {
              wordCorrection.constrainSelection();
              setFocused(true);
            }}
            onSelect={wordCorrection.constrainSelection}
            onBlur={() => {
              setFocused(false);
              setCapsLock(null);
            }}
            onBeforeInput={(event) => {
              const kind = (event.nativeEvent as InputEvent).inputType;
              if (["insertFromPaste", "insertFromDrop"].includes(kind)) {
                event.preventDefault();
                provenance.current = "keyboard";
                setInputHint("Paste is disabled during typing practice.");
                return;
              }
              if (kind === "insertReplacementText")
                provenance.current = "autocorrect";
            }}
            onCompositionStart={() => {
              wordCorrection.constrainSelection();
              composing.current = true;
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              committedComposition.current = event.currentTarget.value;
              commit(
                event.currentTarget.value,
                "composition",
                crypto.randomUUID(),
              );
            }}
            onPaste={(event) => {
              event.preventDefault();
              provenance.current = "keyboard";
              setInputHint("Paste is disabled during typing practice.");
            }}
            onDrop={(event) => {
              event.preventDefault();
              provenance.current = "keyboard";
              setInputHint("Paste is disabled during typing practice.");
            }}
            onKeyDown={(event) => {
              setCapsLock(event.getModifierState("CapsLock"));
              if (
                composing.current ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              if (wordCorrection.handleKeyDown(event)) return;
              if (event.key === "Escape" && !composing.current && canPause) {
                event.preventDefault();
                update(
                  snapshot.status === "paused"
                    ? controller.resume()
                    : controller.pause(),
                );
              }
              if (
                event.key === "Enter" &&
                !composing.current &&
                (event.ctrlKey || event.metaKey)
              ) {
                event.preventDefault();
                update(controller.finish("manual"));
              }
              if (
                event.key === "Tab" &&
                tabIndents &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey
              ) {
                event.preventDefault();
                const input = event.currentTarget;
                const start = utf16ToGraphemeOffset(
                  input.value,
                  input.selectionStart,
                );
                const end = utf16ToGraphemeOffset(
                  input.value,
                  input.selectionEnd,
                );
                const next = controller.input({
                  type: "insert",
                  start,
                  end,
                  text: "    ",
                  provenance: "generated",
                });
                setValue(next.finalText);
                update(next);
                sound();
              }
            }}
            onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
            disabled={
              snapshot.status === "finished" || snapshot.status === "paused"
            }
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={100000}
            dir={pack.direction}
            className={cn(
              "typing-input absolute inset-0 w-full h-full resize-none border-0 bg-transparent caret-transparent text-transparent outline-none focus:outline-none py-2",
              revealed &&
                "!relative !text-foreground !caret-primary !h-40 !border-t",
            )}
            style={{ fontSize: p.fontSize }}
          />
          {!focused && snapshot.status !== "paused" && (
            <button
              tabIndex={-1}
              className="typing-focus-prompt absolute inset-0 flex items-center justify-center gap-3 text-sm text-foreground"
              onClick={() => textarea.current?.focus()}
            >
              <Keyboard size={22} className="text-primary" />
              <span>Click here or tab to start typing</span>
            </button>
          )}
          {snapshot.status === "paused" && (
            <div className="absolute inset-0 bg-card/95 flex flex-col justify-center items-center gap-3">
              <p className="text-lg font-medium">Take a breath.</p>
              <p className="text-xs text-muted-foreground">
                Paused sessions stay in personal practice.
              </p>
              <button
                ref={resumeButton}
                className="forge-button"
                onClick={() => {
                  update(controller.resume());
                  requestAnimationFrame(() => textarea.current?.focus());
                }}
              >
                <Play size={15} />
                Resume
              </button>
            </div>
          )}
        </div>
      </div>
      {(capsLock || inputHint) && (
        <p
          role="status"
          aria-live="polite"
          data-testid="typing-input-notice"
          className="mt-2 text-xs text-muted-foreground"
        >
          {capsLock ? "Caps Lock is on. " : ""}
          {inputHint}
        </p>
      )}
      {!free && (
        <div id="typing-feedback">
          <TypingFeedback
            snapshot={snapshot}
            controller={controller}
            rejectIncorrect={configuration.rejectIncorrect}
          />
        </div>
      )}
      <div className="typing-controls flex flex-wrap items-center justify-center gap-3 mt-5">
        <p id="typing-instructions" className="text-xs text-muted-foreground">
          {canPause ? "Esc pauses · " : "Shared clock · "}Ctrl+Enter finishes ·
          {tabIndents
            ? " Tab indents · Shift+Tab moves focus"
            : onRestart
              ? " Tab → Enter restarts"
              : " Tab moves focus"}
          {configuration.correctionPolicy === "current-word" && " · Correct current word only"}
        </p>
        {configuration.rejectIncorrect && (
          <p className="text-xs text-muted-foreground mt-2" role="note">
            Precision mode: incorrect attempts count toward accuracy and keep
            the caret in place. Type the expected character to continue;
            Backspace is not required.
          </p>
        )}
        <div className="flex gap-1 items-center">
          {onRestart && (
            <button
              className="forge-icon-button"
              aria-label="Restart with new text"
              title={
                tabIndents
                  ? "Restart with new text"
                  : "Restart · Tab then Enter"
              }
              onClick={onRestart}
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            className="forge-icon-button"
            aria-label={
              revealed
                ? "Hide accessible text editor"
                : "Show accessible text editor"
            }
            aria-pressed={revealed}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          {snapshot.status === "running" && canPause && (
            <button
              className="forge-icon-button"
              aria-label="Pause practice"
              onClick={() => update(controller.pause())}
            >
              <Pause size={17} />
            </button>
          )}
          <button
            className="forge-chip"
            disabled={snapshot.status === "ready"}
            onClick={() => update(controller.finish("manual"))}
          >
            <Flag size={15} />
            Finish
          </button>
        </div>
      </div>
      <span role="status" className="sr-only">
        {snapshot.status === "finished"
          ? "Test complete"
          : snapshot.status === "paused"
            ? "Test paused"
            : snapshot.status === "ready"
              ? "Ready to type"
              : "Test running"}
      </span>
    </section>
  );
}
