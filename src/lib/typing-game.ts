import { graphemes } from "./typing-core/transcript";

export const SIGNAL_RUN_VERSION = "signal-run-v1";
export const SIGNAL_RUN_DURATION = 60_000;
export const SIGNAL_RUN_GATES_PER_STAGE = 6;
export const SIGNAL_RUN_STAGES = [
  {
    name: "The uplink",
    label: "Find the signal",
    words: [
      "glow",
      "beam",
      "wave",
      "echo",
      "link",
      "flow",
      "star",
      "path",
      "dawn",
      "calm",
      "rise",
      "open",
    ],
  },
  {
    name: "The crossing",
    label: "Carry it further",
    words: [
      "signal",
      "orbit",
      "drift",
      "pulse",
      "quiet",
      "light",
      "relay",
      "spark",
      "focus",
      "clear",
      "trace",
      "unity",
    ],
  },
  {
    name: "The horizon",
    label: "Bring the network home",
    words: [
      "horizon",
      "radiant",
      "clarity",
      "journey",
      "connect",
      "balance",
      "harmony",
      "reflect",
      "starlight",
      "resonance",
      "velocity",
      "discover",
    ],
  },
] as const;

export type TypingGameMode = "calm" | "paced";
export type TypingGamePhase = "ready" | "playing" | "paused" | "complete";
export interface TypingGameEdit {
  start: number;
  end: number;
  text: string;
}
export interface TypingGameState {
  version: typeof SIGNAL_RUN_VERSION;
  mode: TypingGameMode;
  phase: TypingGamePhase;
  deck: readonly string[];
  gate: number;
  draft: string;
  attempts: number;
  correctAttempts: number;
  deletedCharacters: number;
  gateMistakes: number;
  cleanGates: number;
  cleanChain: number;
  bestCleanChain: number;
  elapsedMs: number;
  lastAt: number | null;
  paused: boolean;
  assisted: boolean;
  outcome: "cleared" | "timeout" | "ended" | null;
}

/** Same small public word pools, shuffled locally; no remote content or assets. */
export function signalRunDeck(seed: number): string[] {
  let value = seed >>> 0 || 1;
  const random = () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4_294_967_296;
  };
  return SIGNAL_RUN_STAGES.flatMap((stage) => {
    const words: string[] = [...stage.words];
    for (let index = words.length - 1; index > 0; index--) {
      const other = Math.floor(random() * (index + 1));
      [words[index], words[other]] = [words[other], words[index]];
    }
    return words.slice(0, SIGNAL_RUN_GATES_PER_STAGE);
  });
}

export function createTypingGame(
  mode: TypingGameMode = "calm",
  seed = 1,
): TypingGameState {
  return {
    version: SIGNAL_RUN_VERSION,
    mode,
    phase: "ready",
    deck: signalRunDeck(seed),
    gate: 0,
    draft: "",
    attempts: 0,
    correctAttempts: 0,
    deletedCharacters: 0,
    gateMistakes: 0,
    cleanGates: 0,
    cleanChain: 0,
    bestCleanChain: 0,
    elapsedMs: 0,
    lastAt: null,
    paused: false,
    assisted: false,
    outcome: null,
  };
}

export function startTypingGame(
  state: TypingGameState,
  now: number,
): TypingGameState {
  if (state.phase !== "ready" || !Number.isFinite(now)) return state;
  // Launch prepares the target and native field. Only inserted text starts time.
  return { ...state, phase: "playing", lastAt: null };
}

/** A monotonic active clock, never a count of timer callbacks. Paused time is excluded. */
export function tickTypingGame(
  state: TypingGameState,
  now: number,
): TypingGameState {
  if (
    state.phase !== "playing" ||
    state.lastAt === null ||
    !Number.isFinite(now) ||
    now <= state.lastAt
  )
    return state;
  const elapsedMs = state.elapsedMs + now - state.lastAt;
  if (state.mode === "paced" && elapsedMs >= SIGNAL_RUN_DURATION) {
    return {
      ...state,
      elapsedMs: SIGNAL_RUN_DURATION,
      lastAt: null,
      phase: "complete",
      outcome: "timeout",
    };
  }
  return { ...state, elapsedMs, lastAt: now };
}

/** Native input is diffed in normalized graphemes. Every inserted unit is an
 * attempt, including corrections, extra letters and an IME batch's characters.
 * Deletions never remove original error evidence. No physical-key timing is inferred.
 */
export function editTypingGame(
  state: TypingGameState,
  text: string,
  now: number,
  assisted = false,
  nativeEdit?: TypingGameEdit,
): TypingGameState {
  if (!Number.isFinite(now)) return state;
  const current = tickTypingGame(state, now);
  if (current.phase !== "playing") return current;
  const normalized = text.normalize("NFC");
  if (normalized.length > 512) return current;
  const before = graphemes(current.draft),
    after = graphemes(normalized);
  if (after.length > 64) return current;
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  )
    start++;
  let end = before.length,
    nextEnd = after.length;
  while (
    end > start &&
    nextEnd > start &&
    before[end - 1] === after[nextEnd - 1]
  ) {
    end--;
    nextEnd--;
  }
  let inserted = after.slice(start, nextEnd);
  if (
    nativeEdit &&
    Number.isInteger(nativeEdit.start) &&
    Number.isInteger(nativeEdit.end) &&
    nativeEdit.start >= 0 &&
    nativeEdit.end >= nativeEdit.start &&
    nativeEdit.end <= before.length &&
    (
      before.slice(0, nativeEdit.start).join("") +
      nativeEdit.text +
      before.slice(nativeEdit.end).join("")
    ).normalize("NFC") === normalized
  ) {
    start = nativeEdit.start;
    end = nativeEdit.end;
    inserted = graphemes(nativeEdit.text.normalize("NFC"));
    nextEnd = start + inserted.length;
  }
  if (start === end && start === nextEnd) {
    // A replacement can leave the same visible text when beforeinput supplied
    // no usable range. Preserve observed assistance without inventing attempts.
    return assisted && !current.assisted
      ? { ...current, assisted: true }
      : current;
  }
  const target = graphemes(current.deck[current.gate]);
  const correct = inserted.filter(
    (unit, index) => target[start + index] === unit,
  ).length;
  return {
    ...current,
    lastAt: current.lastAt ?? (inserted.length ? now : null),
    draft: normalized,
    attempts: current.attempts + inserted.length,
    correctAttempts: current.correctAttempts + correct,
    deletedCharacters: current.deletedCharacters + end - start,
    gateMistakes: current.gateMistakes + inserted.length - correct,
    assisted: current.assisted || assisted,
  };
}

export function canOpenTypingGate(state: TypingGameState): boolean {
  return state.phase === "playing" && state.draft === state.deck[state.gate];
}

export function openTypingGate(
  state: TypingGameState,
  now: number,
): TypingGameState {
  const current = tickTypingGame(state, now);
  if (!canOpenTypingGate(current)) return current;
  const gate = current.gate + 1;
  const clean = current.gateMistakes === 0;
  const cleanChain = clean ? current.cleanChain + 1 : 0;
  const cleared = gate === current.deck.length;
  return {
    ...current,
    gate,
    draft: "",
    gateMistakes: 0,
    cleanGates: current.cleanGates + Number(clean),
    cleanChain,
    bestCleanChain: Math.max(current.bestCleanChain, cleanChain),
    phase: cleared ? "complete" : "playing",
    outcome: cleared ? "cleared" : null,
    lastAt: cleared ? null : current.lastAt,
  };
}

export function pauseTypingGame(
  state: TypingGameState,
  now: number,
): TypingGameState {
  const current = tickTypingGame(state, now);
  return current.phase === "playing"
    ? { ...current, phase: "paused", paused: current.paused || current.attempts > 0, lastAt: null }
    : current;
}

export function resumeTypingGame(
  state: TypingGameState,
  now: number,
): TypingGameState {
  return state.phase === "paused" && Number.isFinite(now)
    ? { ...state, phase: "playing", lastAt: state.attempts > 0 ? now : null }
    : state;
}

export function endTypingGame(
  state: TypingGameState,
  now: number,
): TypingGameState {
  const current = tickTypingGame(state, now);
  return current.phase === "playing" || current.phase === "paused"
    ? { ...current, phase: "complete", outcome: "ended", lastAt: null }
    : current;
}

export function typingGameAccuracy(
  state: Pick<TypingGameState, "attempts" | "correctAttempts">,
): number | null {
  return state.attempts ? (state.correctAttempts / state.attempts) * 100 : null;
}
