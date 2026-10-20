import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CompositionEvent,
  type FormEvent,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KeyboardAudio } from "@/lib/keyboard-audio";
import { useWordCorrection } from "@/hooks/useWordCorrection";
import { CompositionEchoGuard } from "@/lib/composition-echo";
import { SessionController, type SessionResult } from "@/lib/typing-core";
import { getContentPack } from "@/lib/content-packs";
import {
  summarizeLearningAttempts,
  generateKeybrLesson,
  getAllCharacterStats,
  getLearningSessions,
  hydrateLearningFromSessions,
  learningEvidenceFromResult,
  recordLearningSession,
  type LearningDimensions,
  type CharacterConfidence,
} from "@/lib/keybr-engine";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTestResults } from "@/hooks/useTestResults";
import { LetterProgressPanel } from "./LetterProgressPanel";
import { KeybrResults } from "./KeybrResults";
import { sessionRepository } from "@/services/session-repository";
import { TypingPassage } from "@/components/typing/TypingPassage";
import { TypingFeedback } from "@/components/typing/TypingFeedback";
import { LiveKeyboard } from "@/components/typing/LiveKeyboard";
import { useLiveKeyboard } from "@/hooks/useLiveKeyboard";
import { keyboardAttempt } from "@/lib/live-keyboard";

interface Props {
  focusKeys?: string[];
  sourceResultId?: string;
  retestTo?: string;
  language?: string;
  layout?: string;
}
type CorrectionPolicy = "stop" | "correct";
const format = (number: number | null) =>
  number === null ? "—" : Math.round(number).toString();

export function KeybrLessonMode({
  focusKeys,
  sourceResultId,
  retestTo,
  language,
  layout,
}: Props) {
  const { user } = useAuth();
  const owner = user?.id ?? "guest";
  const { preferences, updatePreferences } = usePreferences();
  const { saveSession, syncState, retrySync } = useTestResults();
  const pack = getContentPack(language ?? preferences.language);
  const selectedLayout =
    layout ?? (pack.script === "Latin" ? preferences.layout : "native");
  const [policy, setPolicy] = useState<CorrectionPolicy>("correct");
  const [review, setReview] = useState(false);
  const [method, setMethod] =
    useState<LearningDimensions["inputMethod"]>("keyboard");
  const [focused, setFocused] = useState(false);
  const [capsLock, setCapsLock] = useState<boolean | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const dimensions = useMemo<LearningDimensions>(
    () => ({
      language: pack.id,
      layout: selectedLayout,
      domain: "prose",
      inputMethod: method,
    }),
    [pack.id, selectedLayout, method],
  );
  const options = useMemo(
    () => ({ owner, dimensions, targetWpm: preferences.targetWpm }),
    [owner, dimensions, preferences.targetWpm],
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const composed = useRef(false);
  const compositionEcho = useRef(new CompositionEchoGuard());
  const audio = useRef<KeyboardAudio | null>(null);
  const settled = useRef<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [caret, setCaret] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    if (!preferences.sound) return;
    let active = true;
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
  }, [preferences.sound]);
  const playSound = useCallback(() => {
    if (!preferences.sound || preferences.volume <= 0) return;
    const engine = audio.current;
    if (engine)
      void engine
        .unlock()
        .then(() => engine.play(preferences.soundPack, preferences.volume))
        .catch(() => undefined);
  }, [preferences.sound, preferences.soundPack, preferences.volume]);
  const createLesson = useCallback(
    (retryText?: { text: string; seed: string }) => {
      const lesson = generateKeybrLesson(25, {
        ...options,
        seed: retryText?.seed,
        review,
        focusLetters: selectedFocus ? [selectedFocus] : focusKeys,
        targeted: !!sourceResultId,
      });
      if (retryText) lesson.text = retryText.text;
      const controller = new SessionController(
        {
          clientSessionId: crypto.randomUUID(),
          mode: "learn",
          correctionPolicy: "current-word",
          initialTarget: lesson.text,
          rejectIncorrect: policy === "stop",
          ownerScope: owner,
          language: pack.id,
          script: pack.script,
          keyboardLayout: selectedLayout,
          inputMethod: method,
          contentRevision: lesson.contentRevision,
          generatorVersion: lesson.generatorVersion,
          seed: lesson.seed,
          repeatedContent: !!retryText,
          privacy: "public-corpus",
          settings: {
            correctionPolicy: policy,
            review,
            sourceResultId: sourceResultId ?? null,
            targetWpm: preferences.targetWpm,
          },
        },
        { now: () => performance.now(), wallNow: () => Date.now() },
      );
      return {
        lesson,
        controller,
        dimensions,
        targetWpm: preferences.targetWpm,
        owner,
      };
    },
    [
      options,
      review,
      selectedFocus,
      focusKeys,
      policy,
      owner,
      pack.id,
      pack.script,
      selectedLayout,
      preferences.targetWpm,
      method,
      sourceResultId,
      dimensions,
    ],
  );
  const [session, setSession] = useState(createLesson);
  const previousFactory = useRef(createLesson);
  const [view, setView] = useState(() => session.controller.snapshot());
  const [finished, setFinished] = useState<{
    result: SessionResult;
    newlyUnlocked: string[];
    progress: CharacterConfidence[];
    perCharMetrics: Map<string, CharacterConfidence>;
  } | null>(null);
  const lessonFinished = finished !== null;
  const keyboardInput = useLiveKeyboard(inputRef, session.controller, preferences.showKeyboard && !lessonFinished && view.status !== "paused" && view.status !== "finished");
  const setKeyboardVisible = useCallback((showKeyboard: boolean) => updatePreferences({ showKeyboard }), [updatePreferences]);
  const setFingerGuideVisible = useCallback((showFingerGuide: boolean) => updatePreferences({ showFingerGuide }), [updatePreferences]);
  const caretFontSize = useRef(preferences.fontSize);
  caretFontSize.current = preferences.fontSize;
  const startLesson = useCallback(
    (retry = false) => {
      const next = createLesson(
        retry
          ? { text: session.lesson.text, seed: session.lesson.seed }
          : undefined,
      );
      settled.current = null;
      composed.current = false;
      compositionEcho.current.reset();
      setDraft("");
      setError(null);
      setFinished(null);
      setSession(next);
      setView(next.controller.snapshot());
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [createLesson, session.lesson.text, session.lesson.seed],
  );

  // Changing a model dimension starts a separate session; data never crosses owner/layout/input method.
  useLayoutEffect(() => {
    if (previousFactory.current === createLesson) return;
    previousFactory.current = createLesson;
    const next = createLesson();
    settled.current = null;
    composed.current = false;
    compositionEcho.current.reset();
    setDraft("");
    setError(null);
    setFinished(null);
    setSession(next);
    setView(next.controller.snapshot());
  }, [createLesson]);
  // Presentation refreshes only while running; core timing always uses performance.now().
  useEffect(() => {
    if (view.status !== "running") return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const next = session.controller.tick();
      setView(next);
      if (next.status === "running") timer = setTimeout(refresh, 100);
    };
    timer = setTimeout(refresh, 100);
    return () => clearTimeout(timer);
  }, [session.controller, view.status]);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const blockTransfer = (event: InputEvent) => {
      if (!["insertFromPaste", "insertFromDrop"].includes(event.inputType))
        return;
      event.preventDefault();
      setError("Paste is disabled during typing practice.");
    };
    input.addEventListener("beforeinput", blockTransfer);
    return () => input.removeEventListener("beforeinput", blockTransfer);
  }, [session.controller, finished]);
  useEffect(() => {
    if (matchMedia("(pointer: fine)").matches)
      inputRef.current?.focus({ preventScroll: true });
  }, [session.controller]);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "forge-focused",
      focused && view.status === "running",
    );
    return () => document.documentElement.classList.remove("forge-focused");
  }, [focused, view.status]);
  useLayoutEffect(() => {
    if (view.status !== "paused") return;
    resumeRef.current?.focus({ preventScroll: true });
    stageRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [view.status]);
  const measureCaret = useCallback(() => {
    const container = stageRef.current,
      marker = container?.querySelector('[data-current="true"]');
    if (!container || !marker) {
      setCaret(null);
      return;
    }
    let boundary = container.getBoundingClientRect(),
      rect = marker.getBoundingClientRect();
    const lineHeight = caretFontSize.current * 1.85;
    const targetTop = rect.top - boundary.top + container.scrollTop;
    const nextScroll = Math.max(
      0,
      Math.floor((targetTop + 1) / lineHeight) * lineHeight - lineHeight,
    );
    if (container.scrollTop !== nextScroll) container.scrollTop = nextScroll;
    boundary = container.getBoundingClientRect();
    rect = marker.getBoundingClientRect();
    const next = {
      x: rect.left - boundary.left + container.scrollLeft,
      y: rect.top - boundary.top + container.scrollTop,
      width: Math.max(rect.width, 2),
      height: rect.height,
    };
    setCaret((previous) =>
      previous?.x === next.x &&
      previous.y === next.y &&
      previous.width === next.width &&
      previous.height === next.height
        ? previous
        : next,
    );
  }, []);
  useLayoutEffect(() => {
    measureCaret();
  }, [
    measureCaret,
    view.cursor,
    view.finalText,
    session.controller,
    preferences.fontSize,
    focused,
    lessonFinished,
  ]);
  useLayoutEffect(() => {
    const container = stageRef.current;
    const text = container?.querySelector(".learn-stream-text");
    if (!container || !text) return;
    let active = true;
    const measure = () => {
      if (active) measureCaret();
    };
    // A keystroke measures the committed marker above. Observe each real lesson
    // stage once, keeping font/resize ownership stable while its text changes.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(text);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [measureCaret, session.controller, lessonFinished]);
  useEffect(
    () =>
      sessionRepository.subscribe((event) => {
        if (event.ownerId === owner && event.type !== "save")
          setRevision((value) => value + 1);
      }),
    [owner],
  );
  useEffect(() => {
    let active = true;
    void hydrateLearningFromSessions(owner).then(() => {
      if (active) setRevision((value) => value + 1);
    });
    const changed = () => setRevision((value) => value + 1);
    window.addEventListener("typingforge:learning-updated", changed);
    return () => {
      active = false;
      window.removeEventListener("typingforge:learning-updated", changed);
    };
  }, [owner]);

  const settle = useCallback(
    (result: SessionResult) => {
      if (settled.current === result.clientSessionId) return;
      settled.current = result.clientSessionId;
      const evidence = learningEvidenceFromResult(result);
      const progress = recordLearningSession(evidence, session.owner);
      if (!progress.persisted)
        setError(
          "Learning progress could not be stored. Keep this tab open and free browser storage before the next lesson.",
        );
      setFinished({
        result,
        newlyUnlocked: progress.newlyUnlocked,
        progress: progress.updatedChars,
        perCharMetrics: summarizeLearningAttempts(
          evidence.attempts,
          session.targetWpm,
          evidence.dimensions,
        ),
      });
      setView(result);
      setRevision((value) => value + 1);
      void saveSession(result).catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "This result could not be saved.",
        ),
      );
    },
    [session, saveSession],
  );

  const commit = useCallback(
    (text: string, composition = false) => {
      if (
        !text ||
        session.controller.result ||
        session.controller.status === "paused"
      )
        return;
      playSound();
      const next = session.controller.input({
        type: composition ? "composition" : "insert",
        text,
        provenance: composition ? "composition" : "keyboard",
        ...(composition ? { compositionId: crypto.randomUUID() } : {}),
      });
      setView(next);
      setError(null);
      if (session.controller.result) settle(session.controller.result);
    },
    [session, settle, playSound],
  );
  const wordCorrection = useWordCorrection({
    controller: session.controller,
    inputRef,
    composing: composed,
    draft: true,
    deletionDisabledNotice: policy === "stop"
      ? "Stop-on-error keeps the cursor on the expected key. Type that key to continue."
      : undefined,
    onSnapshot: (next) => {
      compositionEcho.current.reset();
      setView(next);
      setDraft("");
    },
    onNotice: (notice) => setError(notice || null),
  });
  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (["deleteCompositionText", "deleteByComposition"].includes(native.inputType)) {
      setDraft(composed.current || native.isComposing ? event.currentTarget.value : "");
      return;
    }
    if (wordCorrection.handleInputDeletion(native.inputType || "", native.isComposing)) {
      compositionEcho.current.reset();
      event.currentTarget.value = "";
      setDraft("");
      return;
    }
    if (
      ["insertFromPaste", "insertFromDrop"].includes(
        (event.nativeEvent as InputEvent).inputType,
      )
    ) {
      compositionEcho.current.reset();
      event.currentTarget.value = "";
      setDraft("");
      setError("Paste is disabled during typing practice.");
      return;
    }
    const text = event.currentTarget.value;
    if (composed.current || (event.nativeEvent as InputEvent).isComposing) {
      setDraft(text);
      return;
    }
    if (compositionEcho.current.consume(text, native.inputType || "")) {
      setDraft("");
      return;
    }
    commit(text);
    setDraft("");
  };
  const handleCompositionEnd = (
    event: CompositionEvent<HTMLTextAreaElement>,
  ) => {
    composed.current = false;
    const text = event.data || event.currentTarget.value;
    compositionEcho.current.remember(text);
    commit(text, true);
    setDraft("");
  };
  const stats = useMemo(() => {
    void revision;
    return getAllCharacterStats(options);
  }, [options, revision]);
  const focus = stats.find(
    (stat) => stat.char === session.lesson.focusLetters[0],
  );
  const today = new Date().toDateString();
  const practicedMs = useMemo(() => {
    void revision;
    return getLearningSessions({ owner })
      .filter((item) => new Date(item.completedAt).toDateString() === today)
      .reduce((total, item) => total + item.elapsedMs, 0);
  }, [owner, today, revision]);
  const goalMs = preferences.dailyGoalMinutes * 60_000;
  const masteredCount = stats.filter((stat) => stat.mastered).length;
  const keyboardSequence = view.events.at(-1)?.sequence ?? -1;
  const lastKeyboardAttempt = useMemo(() => {
    void keyboardSequence;
    return keyboardAttempt(session.controller.lastInputAttempts);
  }, [session.controller, keyboardSequence]);
  const knownKeyboardKeys = useMemo(() => stats.filter(stat => stat.isUnlocked).map(stat => stat.char), [stats]);
  const masteredKeyboardKeys = useMemo(() => stats.filter(stat => stat.mastered).map(stat => stat.char), [stats]);
  const focusedPractice = preferences.focusMode && view.status === "running";
  // Revision intentionally refreshes session-derived data after completion/deletion.
  const goal = (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Timer className="size-4" />
          Today’s practice
        </span>
        <span className="font-mono">
          {(practicedMs / 60000).toFixed(1)} / {preferences.dailyGoalMinutes}{" "}
          min
        </span>
      </div>
      <progress
        className="mt-3 h-2 w-full accent-primary"
        aria-label="Daily practice goal"
        max={goalMs}
        value={Math.min(goalMs, practicedMs)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Completed lessons and partial practice, using active time.
      </p>
    </div>
  );

  if (finished)
    return (
      <div className="space-y-6">
        <KeybrResults
          {...finished}
          onRestart={() => startLesson()}
          onRetry={() => startLesson(true)}
          retestTo={retestTo}
          sourceResultId={sourceResultId}
          saveStatus={syncState}
          onRetrySave={() => void retrySync()}
        />
        {error && (
          <p role="status" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {goal}
        <LetterProgressPanel {...options} />
      </div>
    );

  return (
    <div className="learn-session w-full">
      <section className="min-w-0" aria-label="Adaptive typing lesson">
        <div className="learn-indicators">
          <div className="learn-focus-indicator">
            <span className="learn-indicator-label">
              {review
                ? "Mixed review"
                : sourceResultId
                  ? "Targeted practice"
                  : "Adaptive lesson"}
            </span>
            <h2>
              {review ? (
                "Review available keys"
              ) : (
                <>
                  Focus on{" "}
                  <span className="font-mono text-primary">
                    {session.lesson.focusLetters[0]}
                  </span>
                </>
              )}
            </h2>
          </div>
          <div>
            <span className="learn-indicator-label">Available keys</span>
            <p className="font-mono">
              {session.lesson.availableLetters.join(" ")}
            </p>
          </div>
          {preferences.liveStats && (
            <>
              <div>
                <span className="learn-indicator-label">WPM</span>
                <p className="font-mono text-primary">
                  {format(view.metrics.wpm)}
                </p>
              </div>
              <div>
                <span className="learn-indicator-label">Attempt accuracy</span>
                <p className="font-mono">
                  {format(view.metrics.inputAccuracy)}
                  {view.metrics.inputAccuracy !== null ? "%" : ""}
                </p>
              </div>
              <div className="learn-time-indicator">
                <span className="learn-indicator-label">Time</span>
                <p className="font-mono">
                  {(view.elapsedMs / 1000).toFixed(1)}s
                </p>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="learn-new-lesson"
            onClick={() => startLesson()}
            aria-label="New lesson"
            title="Start a new lesson"
          >
            <RotateCcw className="size-4" />
            <span className="sm:hidden">New lesson</span>
          </Button>
        </div>
        <progress
          className="learn-lesson-progress"
          aria-label="Lesson progress"
          max={Math.max(1, view.characters.length)}
          value={view.cursor}
        />
        <div
          className="learn-stream-wrap"
          style={
            {
              "--learn-font-size": `${preferences.fontSize}px`,
            } as CSSProperties
          }
        >
          <div
            ref={stageRef}
            className={cn(
              "learn-stream relative outline-none",
              !focused && view.status !== "paused" && "learn-stream-unfocused",
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {caret && focused && (
              <span
                aria-hidden="true"
                className={cn(
                  "learn-caret pointer-events-none absolute left-0 top-0 motion-reduce:!transition-none",
                  preferences.caretStyle === "outline"
                    ? "caret-outline"
                    : "bg-primary",
                  preferences.caretStyle === "block" && "rounded-sm opacity-25",
                )}
                style={{
                  width: preferences.caretStyle === "line" ? 2 : caret.width,
                  height:
                    preferences.caretStyle === "underline" ? 2 : caret.height,
                  transform: `translate3d(${caret.x + (preferences.caretStyle === "line" && pack.direction === "rtl" ? caret.width : 0)}px, ${caret.y + (preferences.caretStyle === "underline" ? caret.height - 2 : 0)}px, 0)`,
                  transition:
                    preferences.smoothCaret && !preferences.reducedMotion
                      ? "transform 85ms linear"
                      : "none",
                }}
              />
            )}
            <div
              aria-hidden="true"
              lang={pack.id}
              dir={pack.direction}
              className="learn-stream-text pointer-events-none whitespace-pre-wrap break-words font-mono leading-[1.85]"
              style={{ fontFamily: pack.font, fontSize: preferences.fontSize }}
            >
              <TypingPassage
                slots={view.characters}
                cursor={view.cursor}
                marker={<span className="learn-caret-marker" />}
                renderBefore={(slot) =>
                  preferences.paceCaret &&
                  view.status === "running" &&
                  slot.index ===
                    Math.floor(
                      (view.elapsedMs * preferences.targetWpm * 5) / 60000,
                    ) ? (
                    <span className="pointer-events-none absolute inset-0 border-b border-dashed border-muted-foreground" />
                  ) : null
                }
              />
            </div>
          </div>
          <textarea
            ref={inputRef}
            aria-label="Type the practice text"
            aria-describedby="lesson-instructions lesson-feedback lesson-passage"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={draft}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              compositionEcho.current.reset();
              setFocused(false);
              setCapsLock(null);
            }}
            onChange={handleInput}
            onCompositionStart={() => {
              compositionEcho.current.reset();
              composed.current = true;
            }}
            onCompositionEnd={handleCompositionEnd}
            onPaste={(event) => {
              compositionEcho.current.reset();
              event.preventDefault();
              setError("Paste is disabled during typing practice.");
            }}
            onDrop={(event) => {
              compositionEcho.current.reset();
              event.preventDefault();
              setError("Paste is disabled during typing practice.");
            }}
            onKeyDown={(event) => {
              setCapsLock(event.getModifierState("CapsLock"));
              if (
                composed.current ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              // A fresh non-IME key is an independent action even when it types
              // the same letter immediately after the previous composition.
              compositionEcho.current.reset();
              if (event.key === "Escape") {
                event.preventDefault();
                inputRef.current?.blur();
              }
              wordCorrection.handleKeyDown(event);
            }}
            onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
            className="absolute left-0 top-0 z-10 h-full w-full resize-none opacity-0"
          />
          {view.status === "paused" && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-background/95">
              <Button
                ref={resumeRef}
                onClick={() => {
                  setView(session.controller.resume());
                  inputRef.current?.focus();
                }}
              >
                <Play className="mr-2 size-4" />
                Resume practice
              </Button>
            </div>
          )}
          {!focused && view.status !== "paused" && (
            <p className="learn-focus-message pointer-events-none">
              Click the text or Tab to focus
            </p>
          )}
        </div>
        <div id="lesson-feedback">
          <TypingFeedback
            snapshot={view}
            controller={session.controller}
            rejectIncorrect={policy === "stop"}
          />
        </div>
        {capsLock && (
          <p
            role="status"
            aria-live="polite"
            data-testid="lesson-input-notice"
            className="text-xs text-muted-foreground"
          >
            Caps Lock is on.
          </p>
        )}
        <LiveKeyboard
          adaptive
          language={pack.id}
          layout={selectedLayout}
          input={keyboardInput}
          expectedCharacter={view.characters[view.cursor]?.expected}
          lastAttempt={lastKeyboardAttempt}
          lessonKeys={knownKeyboardKeys}
          masteredKeys={masteredKeyboardKeys}
          visible={preferences.showKeyboard}
          fingerGuide={preferences.showFingerGuide}
          reducedMotion={preferences.reducedMotion}
          onVisibilityChange={setKeyboardVisible}
          onFingerGuideChange={setFingerGuideVisible}
        />
        <p id="lesson-instructions" className="sr-only">
          Click the lesson and start typing.{" "}
          {policy === "stop"
            ? "Stop on error is enabled: your pressed key appears below and your cursor waits for the expected key."
            : "Your actual input appears as you type, including mistakes. Backspace corrects only the current word; previous words lock when you press Space. Every original mistake remains in attempt accuracy."}{" "}
          Escape releases focus. Tab moves to the next control.
        </p>
        <p
          id="lesson-passage"
          className="sr-only"
          lang={pack.id}
          dir={pack.direction}
        >
          {session.lesson.text}
        </p>
        {error && (
          <p role="status" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="learn-controls flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <label className="learn-control">
            <span>Correction policy</span>
            <select
              aria-label="Correction policy"
              value={policy}
              onChange={(event) =>
                setPolicy(event.target.value as CorrectionPolicy)
              }
            >
              <option value="correct">Allow corrections</option>
              <option value="stop">Stop on error</option>
            </select>
          </label>
          <label className="learn-control">
            <span>Input method</span>
            <select
              aria-label="Input method"
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value as LearningDimensions["inputMethod"],
                )
              }
            >
              <option value="keyboard">Physical keyboard</option>
              <option value="composition">Composition / IME</option>
              <option value="virtual">On-screen keyboard</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={review}
              onChange={(event) => setReview(event.target.checked)}
              className="accent-primary"
            />
            Mixed review
          </label>
          {view.status === "running" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(session.controller.pause())}
            >
              <Pause className="mr-2 size-4" />
              Pause
            </Button>
          )}
          {(view.status === "running" || view.status === "paused") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => settle(session.controller.finish("manual"))}
            >
              Finish practice
              <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
        {method === "composition" && (
          <p className="text-xs text-muted-foreground">
            Composition accuracy is measured by committed graphemes. A
            simultaneous commit cannot establish individual-key speed or initial
            mastery.
          </p>
        )}
        {preferences.paceCaret && (
          <p className="text-xs text-muted-foreground">
            Dashed pace caret: your custom target of {preferences.targetWpm}{" "}
            WPM.
          </p>
        )}
        <p className="learn-shortcuts">
          <kbd>esc</kbd> release focus<span>·</span>
          <kbd>tab</kbd> next control<span>·</span>Backspace corrects current word
        </p>
      </section>
      {!focusedPractice && (
        <details className="learn-evidence">
          <summary>
            Learning progress &amp; evidence
            <span>
              {masteredCount} / {stats.length} mastered · target{" "}
              {preferences.targetWpm} WPM
            </span>
          </summary>
          <div className="learn-evidence-content">
            <div className="learn-evidence-overview">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Learning checkpoint
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Mastery needs 20 attributable recent attempts, 97% accuracy,
                  target key speed, two lessons, and two qualifying checkpoints.
                </p>
                {session.lesson.phoneticWordCount > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {session.lesson.naturalWordCount} natural words ·{" "}
                    {session.lesson.phoneticWordCount} generated sound patterns,
                    constrained to your available letters.
                  </p>
                )}
              </div>
              {focus && (
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-5">
                    <dt className="text-muted-foreground">
                      {focus.char} · Recent key speed
                    </dt>
                    <dd>
                      {focus.qualifiedLatencySamples
                        ? `${Math.round(focus.wpm)} WPM`
                        : "No timing yet"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-5">
                    <dt className="text-muted-foreground">Recent accuracy</dt>
                    <dd>
                      {focus.recentAttempts
                        ? `${focus.accuracy.toFixed(1)}%`
                        : "No attempts yet"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-5">
                    <dt className="text-muted-foreground">Evidence</dt>
                    <dd>{focus.attributableAttempts ?? 0} / 20</dd>
                  </div>
                  <div className="flex justify-between gap-5">
                    <dt className="text-muted-foreground">Checkpoints</dt>
                    <dd>{focus.masteryCheckpoints ?? 0} / 2</dd>
                  </div>
                </dl>
              )}
              {goal}
            </div>
            <LetterProgressPanel
              {...options}
              onSelectKey={(char) => {
                setSelectedFocus(char);
              }}
              selectedKey={selectedFocus ?? undefined}
            />
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="size-4 shrink-0" />
              Logical-key practice is separated by language, layout, and input
              method. Key speed is a latency estimate; test WPM includes all
              active time.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
