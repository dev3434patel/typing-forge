import {
  SIGNAL_RUN_VERSION,
  typingGameAccuracy,
  type TypingGameMode,
  type TypingGameState,
} from "./typing-game";

export interface TypingGameRecord {
  version: typeof SIGNAL_RUN_VERSION;
  mode: TypingGameMode;
  gates: number;
  cleanGates: number;
  accuracy: number;
  elapsedMs: number;
  paused: boolean;
}
export type TypingGameRecords = Partial<
  Record<TypingGameMode, TypingGameRecord>
>;
export const typingGameStorageKey = (owner: string) =>
  `sparowtype.signal-run.v1:${encodeURIComponent(owner)}`;

export function typingGameRecord(
  state: TypingGameState,
): TypingGameRecord | null {
  if (
    state.phase !== "complete" ||
    state.assisted ||
    state.outcome === "ended" ||
    state.attempts === 0
  )
    return null;
  return {
    version: SIGNAL_RUN_VERSION,
    mode: state.mode,
    gates: state.gate,
    cleanGates: state.cleanGates,
    accuracy: typingGameAccuracy(state)!,
    elapsedMs: state.elapsedMs,
    paused: state.paused,
  };
}

function valid(
  value: unknown,
  mode: TypingGameMode,
): value is TypingGameRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as TypingGameRecord;
  return (
    record.version === SIGNAL_RUN_VERSION &&
    record.mode === mode &&
    Number.isInteger(record.gates) &&
    record.gates >= 0 &&
    record.gates <= 18 &&
    Number.isInteger(record.cleanGates) &&
    record.cleanGates >= 0 &&
    record.cleanGates <= record.gates &&
    Number.isFinite(record.accuracy) &&
    record.accuracy >= 0 &&
    record.accuracy <= 100 &&
    Number.isFinite(record.elapsedMs) &&
    record.elapsedMs >= 0 &&
    typeof record.paused === "boolean"
  );
}

export function readTypingGameRecords(raw: string | null): TypingGameRecords {
  try {
    if (raw && raw.length > 16_384) return {};
    const parsed: unknown = JSON.parse(raw || "null");
    if (!parsed || typeof parsed !== "object") return {};
    const records: TypingGameRecords = {};
    for (const mode of ["calm", "paced"] as const) {
      const value = (parsed as TypingGameRecords)[mode];
      if (valid(value, mode))
        records[mode] = {
          version: value.version,
          mode,
          gates: value.gates,
          cleanGates: value.cleanGates,
          accuracy: value.accuracy,
          elapsedMs: value.elapsedMs,
          paused: value.paused,
        };
    }
    return records;
  } catch {
    return {};
  }
}

/** Local game records compare gates, then clean gates, accuracy and active time.
 * They are browser-editable practice summaries, never ranked typing evidence.
 */
export function updateTypingGameRecords(
  records: TypingGameRecords,
  state: TypingGameState,
): TypingGameRecords {
  const next = typingGameRecord(state);
  if (!next) return records;
  return mergeTypingGameRecords(records, { [next.mode]: next });
}

function improves(
  next: TypingGameRecord,
  best: TypingGameRecord | undefined,
): boolean {
  return (
    !best ||
    next.gates > best.gates ||
    (next.gates === best.gates &&
      (next.cleanGates > best.cleanGates ||
        (next.cleanGates === best.cleanGates &&
          (next.accuracy > best.accuracy ||
            (next.accuracy === best.accuracy &&
              next.elapsedMs < best.elapsedMs)))))
  );
}

/** Merge validated browser summaries without downgrading either mode. */
export function mergeTypingGameRecords(
  records: TypingGameRecords,
  incoming: TypingGameRecords,
): TypingGameRecords {
  let merged = records;
  for (const mode of ["calm", "paced"] as const) {
    const next = incoming[mode];
    if (next && improves(next, merged[mode]))
      merged = { ...merged, [mode]: next };
  }
  return merged;
}

/** Fixed mode/field order makes cross-tab equality independent of insertion order. */
export function serializeTypingGameRecords(records: TypingGameRecords): string {
  return JSON.stringify(readTypingGameRecords(JSON.stringify(records)));
}
