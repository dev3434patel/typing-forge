import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  ArrowRight,
  Check,
  Flag,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { sessionRepository } from "@/services/session-repository";
import { graphemes, utf16ToGraphemeOffset } from "@/lib/typing-core";
import {
  SIGNAL_RUN_DURATION,
  SIGNAL_RUN_GATES_PER_STAGE,
  SIGNAL_RUN_STAGES,
  canOpenTypingGate,
  createTypingGame,
  editTypingGame,
  endTypingGame,
  openTypingGate,
  pauseTypingGame,
  resumeTypingGame,
  startTypingGame,
  tickTypingGame,
  typingGameAccuracy,
  type TypingGameEdit,
  type TypingGameMode,
  type TypingGameState,
} from "@/lib/typing-game";
import {
  readTypingGameRecords,
  mergeTypingGameRecords,
  serializeTypingGameRecords,
  typingGameStorageKey,
  updateTypingGameRecords,
  type TypingGameRecords,
} from "@/lib/typing-game-records";
import { SignalScene } from "./SignalScene";
import "./games.css";

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const readRecords = (owner: string) => {
  try {
    return {
      available: true,
      records: readTypingGameRecords(
        localStorage.getItem(typingGameStorageKey(owner)),
      ),
    };
  } catch {
    return { available: false, records: {} as TypingGameRecords };
  }
};
const accuracyLabel = (state: TypingGameState) => {
  const accuracy = typingGameAccuracy(state);
  return accuracy === null ? "—" : `${accuracy.toFixed(1)}%`;
};

export function SignalRun({ owner }: { owner: string }) {
  const { preferences } = usePreferences();
  const [game, setGame] = useState(() => createTypingGame("calm", newSeed()));
  const current = useRef(game);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [initialRecords] = useState(() => readRecords(owner));
  const [records, setRecords] = useState<TypingGameRecords>(
    initialRecords.records,
  );
  const recordsRef = useRef(records);
  const [storageNotice, setStorageNotice] = useState(
    initialRecords.available
      ? ""
      : "Browser storage is unavailable. Bests stay in memory for this visit.",
  );
  const replaceRecords = useCallback((next: TypingGameRecords) => {
    recordsRef.current = next;
    setRecords(next);
  }, []);
  const input = useRef<HTMLInputElement>(null),
    resume = useRef<HTMLButtonElement>(null);
  const nativeEdit = useRef<(TypingGameEdit & { gate: number }) | null>(null);
  const compositionStart = useRef<{
    start: number;
    end: number;
    gate: number;
  } | null>(null);
  const saved = useRef<TypingGameState | null>(null);
  const send = useCallback(
    (change: (state: TypingGameState) => TypingGameState) => {
      const next = change(current.current);
      current.current = next;
      setGame(next);
      return next;
    },
    [],
  );
  const resetDraft = useCallback(() => {
    nativeEdit.current = null;
    compositionStart.current = null;
    composingRef.current = false;
    setComposing(false);
    setDraft("");
    setNotice("");
  }, []);
  const pause = useCallback(
    (message = "Paused. Your committed word and accuracy are kept.") => {
      const next = send((state) => pauseTypingGame(state, performance.now()));
      if (next.phase === "paused") {
        composingRef.current = false;
        setComposing(false);
        setDraft(next.draft);
        nativeEdit.current = null;
        compositionStart.current = null;
        setNotice(message);
      }
    },
    [send],
  );

  useEffect(() => {
    if (game.phase !== "playing" || game.mode !== "paced") return;
    const timer = setInterval(
      () => send((state) => tickTypingGame(state, performance.now())),
      100,
    );
    return () => clearInterval(timer);
  }, [game.phase, game.mode, send]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden)
        pause("Paused while this tab was away. Resume whenever you are ready.");
    };
    const blurred = () =>
      pause(
        "Paused while this window was away. Resume whenever you are ready.",
      );
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", blurred);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", blurred);
    };
  }, [pause]);
  useLayoutEffect(() => {
    if (game.phase === "paused" && !document.hidden)
      resume.current?.focus({ preventScroll: true });
  }, [game.phase]);
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    const capture = (event: InputEvent) => {
      nativeEdit.current = null;
      if (
        event.isComposing ||
        composingRef.current ||
        typeof event.data !== "string"
      )
        return;
      nativeEdit.current = {
        start: utf16ToGraphemeOffset(
          field.value,
          field.selectionStart ?? field.value.length,
        ),
        end: utf16ToGraphemeOffset(
          field.value,
          field.selectionEnd ?? field.value.length,
        ),
        text: event.data,
        gate: current.current.gate,
      };
    };
    field.addEventListener("beforeinput", capture);
    return () => field.removeEventListener("beforeinput", capture);
  }, [game.phase]);
  useEffect(() => {
    if (game.phase !== "complete" || saved.current === game) return;
    saved.current = game;
    const stored = readRecords(owner);
    const next = updateTypingGameRecords(
      mergeTypingGameRecords(recordsRef.current, stored.records),
      game,
    );
    replaceRecords(next);
    if (!stored.available) {
      setStorageNotice(
        "Browser storage could not be read. This visit’s best stays in memory; stored bests were not overwritten.",
      );
      return;
    }
    try {
      if (
        serializeTypingGameRecords(next) !==
        serializeTypingGameRecords(stored.records)
      ) {
        localStorage.setItem(
          typingGameStorageKey(owner),
          serializeTypingGameRecords(next),
        );
      }
      setStorageNotice("");
    } catch {
      setStorageNotice(
        "Browser storage is unavailable. This visit’s best is kept in memory.",
      );
    }
  }, [game, owner, replaceRecords]);
  useEffect(() => {
    const synchronize = (event: StorageEvent) => {
      if (event.key !== null && event.key !== typingGameStorageKey(owner))
        return;
      if (event.key === null || event.newValue === null) {
        replaceRecords({});
        setStorageNotice("Game bests were cleared in another tab.");
        return;
      }
      const stored = readRecords(owner);
      if (!stored.available) {
        setStorageNotice(
          "Browser storage could not be read. Bests stay in memory for this visit.",
        );
        return;
      }
      const merged = mergeTypingGameRecords(recordsRef.current, stored.records);
      replaceRecords(merged);
      // A lower, racing tab write must not erase a better summary this tab has.
      if (
        serializeTypingGameRecords(merged) !==
        serializeTypingGameRecords(stored.records)
      ) {
        try {
          localStorage.setItem(
            typingGameStorageKey(owner),
            serializeTypingGameRecords(merged),
          );
        } catch {
          setStorageNotice(
            "Browser storage could not be updated. This visit’s best stays in memory.",
          );
        }
      }
    };
    window.addEventListener("storage", synchronize);
    return () => window.removeEventListener("storage", synchronize);
  }, [owner, replaceRecords]);
  useEffect(
    () =>
      sessionRepository.subscribe((event) => {
        if (event.type !== "clear" || event.ownerId !== owner) return;
        // Same-document clears do not emit a native storage event. Discard this
        // owner's transient run too, so pre-clear evidence cannot recreate a best.
        replaceRecords({});
        send((state) => createTypingGame(state.mode, newSeed()));
        resetDraft();
        setStorageNotice("Local game data cleared.");
      }),
    [owner, replaceRecords, resetDraft, send],
  );

  const chooseMode = (mode: TypingGameMode) => {
    send(() => createTypingGame(mode, newSeed()));
    resetDraft();
  };
  const launch = () => {
    flushSync(() => {
      send((state) => startTypingGame(state, performance.now()));
    });
    input.current?.focus({ preventScroll: true });
  };
  const resumeRun = () => {
    flushSync(() => {
      send((state) => resumeTypingGame(state, performance.now()));
    });
    setNotice("");
    input.current?.focus({ preventScroll: true });
    input.current?.setSelectionRange(
      current.current.draft.length,
      current.current.draft.length,
    );
  };
  const open = () => {
    if (composingRef.current) return;
    flushSync(() => {
      const before = current.current;
      const next = send((state) => openTypingGate(state, performance.now()));
      if (next.gate > before.gate) {
        resetDraft();
        setNotice(
          next.phase === "complete"
            ? "Signal restored. All 18 gates are open."
            : `${next.gate} of 18 gates open. ${next.gate % 6 === 0 ? "New stage reached." : "Next word ready."}`,
        );
      } else if (next.phase === "playing")
        setNotice(
          "Match the whole word to open this gate. You can correct any character.",
        );
    });
    if (current.current.phase === "playing") {
      input.current?.focus({ preventScroll: true });
      input.current?.setSelectionRange(
        current.current.draft.length,
        current.current.draft.length,
      );
    }
  };
  const commit = (
    text: string,
    assisted = false,
    explicit?: TypingGameEdit,
  ) => {
    const next = send((state) =>
      editTypingGame(state, text, performance.now(), assisted, explicit),
    );
    setDraft(next.draft);
    nativeEdit.current = null;
  };
  const active = game.phase === "playing" || game.phase === "paused";
  const stage = Math.min(
    SIGNAL_RUN_STAGES.length - 1,
    Math.floor(game.gate / SIGNAL_RUN_GATES_PER_STAGE),
  );
  const word = game.deck[game.gate] ?? "";
  const units = graphemes(word),
    typed = graphemes(game.draft);
  const hasWrong = typed.some((unit, index) => units[index] !== unit);
  const best = records[game.mode];
  const ready = canOpenTypingGate(game);
  const finished = game.phase === "complete";
  const remaining = Math.max(
    0,
    Math.ceil((SIGNAL_RUN_DURATION - game.elapsedMs) / 1000),
  );

  return (
    <div
      className="signal-game grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"
      data-reduced-motion={preferences.reducedMotion}
    >
      <section
        className="panel min-w-0 overflow-hidden"
        aria-label="Signal Run game"
        data-testid="signal-run"
        data-phase={game.phase}
        data-mode={game.mode}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-primary" /> Signal Run{" "}
            <span className="text-xs font-normal text-muted-foreground">
              01
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} /> Local play · no rankings
          </span>
        </div>
        <div className="space-y-6 p-5 sm:p-7">
          <SignalScene gate={game.gate} totalGates={game.deck.length} />
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Journey stages">
            {SIGNAL_RUN_STAGES.map((item, index) => (
              <div
                key={item.name}
                className="signal-stage pt-3"
                data-current={stage === index}
                data-complete={game.gate >= (index + 1) * 6}
              >
                <p className="text-[.65rem] uppercase tracking-wider text-muted-foreground">
                  Stage {index + 1}
                </p>
                <p className="mt-1 text-xs font-medium sm:text-sm">
                  {item.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.max(0, Math.min(6, game.gate - index * 6))} / 6 gates
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-background/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Gates open</p>
              <p className="mt-1 font-mono text-xl" data-testid="game-gates">
                {game.gate}
                <span className="text-sm text-muted-foreground"> / 18</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Input accuracy</p>
              <p className="mt-1 font-mono text-xl" data-testid="game-accuracy">
                {accuracyLabel(game)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {game.mode === "paced" ? "Time left" : "Your pace"}
              </p>
              <p className="mt-1 font-mono text-xl">
                {game.mode === "paced" ? `${remaining}s` : "No timer"}
              </p>
            </div>
          </div>
          {finished ? (
            <div className="space-y-5 py-2" data-testid="game-result">
              <p className="eyebrow">
                {game.outcome === "cleared"
                  ? "Network restored"
                  : game.outcome === "timeout"
                    ? "Your signal travelled"
                    : "Run saved for this visit"}
              </p>
              <h2 className="text-2xl font-semibold">
                {game.outcome === "cleared"
                  ? "Every gate. One clear signal."
                  : `${game.gate} gates opened. A little further.`}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {game.cleanGates} clean gates · best clean chain{" "}
                {game.bestCleanChain}. A clean gate has no incorrect character
                attempts, even after corrections.
              </p>
              <p
                className="font-mono text-sm"
                data-testid="game-attempt-evidence"
              >
                {game.correctAttempts} / {game.attempts} correct character
                attempts · {game.deletedCharacters} deleted
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Active time {(game.elapsedMs / 1000).toFixed(1)}s
                {game.paused ? " · pauses excluded" : ""}
                {game.assisted
                  ? " · assisted input; excluded from local bests"
                  : ""}
                . Game summaries stay in this browser and do not enter typing
                history or leaderboards.
              </p>
              <button
                className="forge-button"
                onClick={() => chooseMode(game.mode)}
              >
                <RotateCcw size={16} /> Play again
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Game mode">
                <button
                  className={
                    game.mode === "calm"
                      ? "forge-button"
                      : "forge-button-secondary"
                  }
                  aria-pressed={game.mode === "calm"}
                  disabled={active}
                  onClick={() => chooseMode("calm")}
                >
                  <Play size={15} /> Calm journey
                </button>
                <button
                  className={
                    game.mode === "paced"
                      ? "forge-button"
                      : "forge-button-secondary"
                  }
                  aria-pressed={game.mode === "paced"}
                  disabled={active}
                  onClick={() => chooseMode("paced")}
                >
                  <Timer size={15} /> 60-second run
                </button>
              </div>
              <div
                key={game.gate}
                className="signal-gate-entry rounded-xl border border-border bg-background/50 px-4 py-5 text-center sm:px-6"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {game.phase === "ready"
                    ? "Your first gate"
                    : `Gate ${game.gate + 1}`}{" "}
                  · {SIGNAL_RUN_STAGES[stage].label}
                </p>
                <div
                  role="group"
                  className="signal-target mt-3"
                  data-testid="game-target"
                  aria-label={`Target word: ${word}`}
                >
                  {units.map((unit, index) => (
                    <span
                      key={index}
                      className="signal-target-character"
                      data-state={
                        typed[index] === undefined
                          ? "untyped"
                          : typed[index] === unit
                            ? "correct"
                            : "incorrect"
                      }
                      data-current={typed.length === index}
                    >
                      {unit}
                    </span>
                  ))}
                  {typed.length > units.length && (
                    <span className="text-destructive" aria-hidden="true">
                      {typed.slice(units.length).join("")}
                    </span>
                  )}
                </div>
                <p className="mt-2 min-h-5 text-xs text-muted-foreground">
                  {ready ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Check size={14} /> Word ready. Open the gate.
                    </span>
                  ) : hasWrong ? (
                    "A character needs a correction. Your original attempts stay counted."
                  ) : (
                    "Type the word, then press Enter or Open gate."
                  )}
                </p>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  open();
                }}
                className="space-y-3"
              >
                <label
                  htmlFor="signal-word"
                  className="block text-sm font-medium"
                >
                  Your word
                </label>
                <input
                  id="signal-word"
                  ref={input}
                  className="forge-input"
                  aria-describedby="signal-input-help"
                  aria-invalid={hasWrong || undefined}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  maxLength={64}
                  disabled={game.phase !== "playing"}
                  value={draft}
                  onChange={() => undefined}
                  onInput={(event) => {
                    const native = event.nativeEvent as InputEvent;
                    if (
                      ["insertFromPaste", "insertFromDrop"].includes(
                        native.inputType,
                      )
                    ) {
                      event.currentTarget.value = current.current.draft;
                      setDraft(current.current.draft);
                      setNotice(
                        "Type each word yourself. Paste and drop are disabled in this game.",
                      );
                      return;
                    }
                    if (composingRef.current || native.isComposing) {
                      setDraft(event.currentTarget.value);
                      return;
                    }
                    const edit =
                      nativeEdit.current?.gate === current.current.gate
                        ? nativeEdit.current
                        : undefined;
                    commit(
                      event.currentTarget.value,
                      native.inputType === "insertReplacementText",
                      edit,
                    );
                  }}
                  onCompositionStart={(event) => {
                    composingRef.current = true;
                    setComposing(true);
                    nativeEdit.current = null;
                    const field = event.currentTarget;
                    compositionStart.current = {
                      start: utf16ToGraphemeOffset(
                        field.value,
                        field.selectionStart ?? 0,
                      ),
                      end: utf16ToGraphemeOffset(
                        field.value,
                        field.selectionEnd ?? 0,
                      ),
                      gate: current.current.gate,
                    };
                  }}
                  onCompositionEnd={(event) => {
                    composingRef.current = false;
                    setComposing(false);
                    const range = compositionStart.current;
                    compositionStart.current = null;
                    commit(
                      event.currentTarget.value,
                      false,
                      range?.gate === current.current.gate && event.data
                        ? {
                            start: range.start,
                            end: range.end,
                            text: event.data,
                          }
                        : undefined,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      composingRef.current ||
                      event.nativeEvent.isComposing ||
                      event.keyCode === 229
                    )
                      return;
                    if (event.key === "Escape") {
                      event.preventDefault();
                      pause();
                    }
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                    setNotice(
                      "Type each word yourself. Paste and drop are disabled in this game.",
                    );
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setNotice(
                      "Type each word yourself. Paste and drop are disabled in this game.",
                    );
                  }}
                />
                <p
                  id="signal-input-help"
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  A native text field: keyboard, touch and IME supported.
                  Time starts with your first typed character.
                  Backspace corrects; every inserted character counts. Esc
                  pauses.
                </p>
                <div className="flex flex-wrap gap-2">
                  {game.phase === "ready" ? (
                    <button
                      type="button"
                      className="forge-button flex-1"
                      onClick={launch}
                    >
                      Start{" "}
                      {game.mode === "calm" ? "calm journey" : "60-second run"}
                      <ArrowRight size={16} />
                    </button>
                  ) : game.phase === "paused" ? (
                    <button
                      ref={resume}
                      type="button"
                      className="forge-button flex-1"
                      onClick={resumeRun}
                    >
                      <Play size={16} /> Resume game
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="forge-button flex-1"
                      disabled={!ready || composing}
                    >
                      Open gate
                      <ArrowRight size={16} />
                    </button>
                  )}
                  {game.phase === "playing" && (
                    <button
                      type="button"
                      className="forge-button-secondary"
                      disabled={composing}
                      onClick={() => pause()}
                    >
                      <Pause size={16} /> Pause
                    </button>
                  )}
                  {active && (
                    <button
                      type="button"
                      className="forge-button-secondary"
                      disabled={composing}
                      onClick={() => {
                        send((state) =>
                          endTypingGame(state, performance.now()),
                        );
                      }}
                    >
                      <Flag size={16} /> End run
                    </button>
                  )}
                  {active && (
                    <button
                      type="button"
                      className="forge-icon-button"
                      aria-label="Restart game"
                      disabled={composing}
                      onClick={() => chooseMode(game.mode)}
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
          <p
            role="status"
            aria-live="polite"
            className="min-h-5 text-xs leading-relaxed text-muted-foreground"
          >
            {notice}
          </p>
        </div>
      </section>
      <aside className="space-y-5">
        <section className="panel p-5 sm:p-6">
          <p className="eyebrow">A small mission</p>
          <h2 className="mt-3 text-xl font-semibold">Reconnect the horizon.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A quiet network has gone dark. Carry a signal across three stages by
            opening 18 English word gates. Each correct word lights another
            beacon.
          </p>
          <ol className="mt-5 space-y-4 text-sm">
            <li>
              <span className="mr-2 font-mono text-primary">01</span> Match the
              whole word.
            </li>
            <li>
              <span className="mr-2 font-mono text-primary">02</span> Press
              Enter to open its gate.
            </li>
            <li>
              <span className="mr-2 font-mono text-primary">03</span> Chain
              clean gates. Find your rhythm.
            </li>
          </ol>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            Calm has no deadline. Paced gives you 60 active seconds. Pause
            whenever you need; leaving this tab pauses automatically.
          </p>
        </section>
        <section className="panel p-5 sm:p-6" aria-label="Local game best">
          <p className="eyebrow">This browser · unverified</p>
          <h2 className="mt-3 text-lg font-semibold">
            Your {game.mode === "calm" ? "calm" : "paced"} best
          </h2>
          {best ? (
            <>
              <p className="mt-4 font-mono text-3xl">
                {best.gates}
                <span className="text-base text-muted-foreground">
                  {" "}
                  / 18 gates
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {best.cleanGates} clean · {best.accuracy.toFixed(1)}% accuracy
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {(best.elapsedMs / 1000).toFixed(1)}s active
                {best.paused ? " · pauses used" : ""}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {game.mode === "calm"
                ? "Complete a journey to set your first local best."
                : "Complete a paced run to set your first local best."}
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Game records compare gates, clean gates, accuracy, then active time.
            They stay separate from WPM, typing personal bests and public
            rankings.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{storageNotice}</p>
          {Object.keys(records).length > 0 && (
            <button
              className="forge-button-secondary mt-4 w-full"
              onClick={() => {
                replaceRecords({});
                try {
                  localStorage.removeItem(typingGameStorageKey(owner));
                  setStorageNotice("Local game bests cleared.");
                } catch {
                  setStorageNotice(
                    "Cleared for this visit; browser storage could not be changed.",
                  );
                }
              }}
            >
              Clear game bests
            </button>
          )}
        </section>
        <div className="px-1 text-xs leading-relaxed text-muted-foreground">
          <p>No lives to lose. No streak to protect tomorrow.</p>
          <p className="mt-2">One good run is enough.</p>
        </div>
      </aside>
    </div>
  );
}
