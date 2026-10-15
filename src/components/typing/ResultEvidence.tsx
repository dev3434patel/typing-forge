import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  inspectSessionEvidence,
  metricLedger,
  replayAtActiveTime,
} from "@/lib/session-diagnostics";
import { activeOffset, type SessionResult } from "@/lib/typing-core";
const value = (n: number | null, suffix = "") =>
  n === null ? "Unavailable" : `${n.toFixed(1)}${suffix}`;
const reasons: Record<string, string> = {
  "complete-correct": "Correct completed word",
  "partial-prefix": "Correct prefix at cutoff",
  "incorrect-word": "Word contains an error",
  untyped: "Not reached",
  skipped: "Skipped target",
  "extra-word": "Beyond the target",
};

function Inspection({ result }: { result: SessionResult }) {
  const proof = useMemo(() => inspectSessionEvidence(result), [result]);
  const [tab, setTab] = useState<"words" | "replay">("words");
  const [position, setPosition] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [page, setPage] = useState(0);
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        elapsed = now - previous;
      previous = now;
      setPosition((current) =>
        Math.min(result.elapsedMs, current + elapsed * speed),
      );
    }, 100);
    const stopWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, [playing, result.elapsedMs, speed]);
  useEffect(() => {
    if (position >= result.elapsedMs) setPlaying(false);
  }, [position, result.elapsedMs]);
  const replay = useMemo(() => {
    if (proof.status === "unavailable" || tab !== "replay") return null;
    try {
      return replayAtActiveTime(result, position);
    } catch {
      return null;
    }
  }, [result, position, proof.status, tab]);
  const words = proof.words.filter((word) => word.reason !== "untyped");
  const visibleWords = words.slice(page * 25, (page + 1) * 25);
  return (
    <div className="mt-6 border-t pt-5 space-y-5">
      <div role="status" className="text-sm">
        <p className="font-medium">
          {proof.status === "matches"
            ? "Recorded edits reproduce this result"
            : proof.status === "mismatch"
              ? "Saved result and replay differ"
              : "Replay unavailable"}
        </p>
        <p className="text-muted-foreground text-xs mt-2">
          This checks reproducibility with Forge’s scoring engine on this
          device. It does not prove human input, independent calibration or
          server acceptance.
        </p>
        {proof.differences.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-destructive">
            {proof.differences.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Evidence view"
      >
        <button
          className="forge-chip"
          aria-pressed={tab === "words"}
          onClick={() => {
            setTab("words");
            setPlaying(false);
          }}
        >
          Word credit
        </button>
        <button
          className="forge-chip"
          aria-pressed={tab === "replay"}
          onClick={() => setTab("replay")}
        >
          Replay edits
        </button>
      </div>
      {tab === "words" &&
        (words.length ? (
          <>
            <p className="text-xs text-muted-foreground">
              Credit comes from the canonical scoring trace. A completed
              incorrect word can contain correct characters and still earn no
              word credit. Untouched future words are omitted.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[560px]">
                <caption className="sr-only">
                  Word by word credited characters
                </caption>
                <thead>
                  <tr>
                    {[
                      "Target",
                      "Retained input",
                      "Word credit",
                      "Separator credit",
                      "Reason",
                    ].map((label) => (
                      <th key={label} scope="col" className="p-2 border-b">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleWords.map((word) => (
                    <tr key={word.index}>
                      <td className="p-2 border-b font-mono whitespace-pre-wrap break-all">
                        {word.targetWord || "—"}
                      </td>
                      <td className="p-2 border-b font-mono whitespace-pre-wrap break-all">
                        {word.typedWord || "—"}
                      </td>
                      <td className="p-2 border-b">{word.wordCredit}</td>
                      <td className="p-2 border-b">{word.separatorCredit}</td>
                      <td className="p-2 border-b">
                        {reasons[word.reason] || word.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                className="forge-button-secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous words
              </button>
              <span>
                Page {page + 1} of {Math.max(1, Math.ceil(words.length / 25))}
              </span>
              <button
                className="forge-button-secondary"
                disabled={(page + 1) * 25 >= words.length}
                onClick={() => setPage(page + 1)}
              >
                Next words
              </button>
              <span>
                Recorded total: {result.metrics.creditedUnits} credited
                characters
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Word credit is unavailable for free writing, code or an untouched
            passage.
          </p>
        ))}
      {tab === "replay" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Local replay of committed edits, not a recording of physical keys.
            The slider uses active time; explicit pauses are excluded. Replay
            runs locally and sends no additional data.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="forge-button-secondary"
              disabled={!result.elapsedMs || proof.status === "unavailable"}
              onClick={() => {
                if (position >= result.elapsedMs) setPosition(0);
                setPlaying(!playing);
              }}
            >
              {playing ? "Pause replay" : "Play replay"}
            </button>
            <label className="text-xs">
              Replay speed{" "}
              <select
                className="bg-background border rounded p-2 ml-2"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                {[0.5, 1, 2].map((n) => (
                  <option value={n} key={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </label>
            <output className="text-xs font-mono">
              {(position / 1000).toFixed(1)} /{" "}
              {(result.elapsedMs / 1000).toFixed(1)} seconds
            </output>
          </div>
          <label className="text-xs block">
            Replay position
            <input
              aria-label="Replay position"
              type="range"
              min={0}
              max={1000000}
              step={1}
              disabled={result.elapsedMs <= 0 || proof.status === "unavailable"}
              value={
                result.elapsedMs > 0
                  ? Math.round((position / result.elapsedMs) * 1000000)
                  : 0
              }
              className="w-full accent-[var(--forge-accent)] my-3"
              onChange={(event) => {
                setPlaying(false);
                setPosition(
                  (Number(event.target.value) / 1000000) * result.elapsedMs,
                );
              }}
            />
          </label>
          <div
            aria-label="Replayed transcript"
            className="rounded-lg border p-4 bg-background min-h-28 max-h-64 overflow-auto font-mono text-sm whitespace-pre-wrap break-all"
          >
            {replay ? (
              <>
                {replay.finalText.slice(0, 1000) || (
                  <span className="text-muted-foreground">
                    No retained text at this point.
                  </span>
                )}
                {replay.finalText.length > 1000 &&
                  "… (preview limited to 1,000 UTF-16 units)"}
              </>
            ) : (
              "This position could not be replayed."
            )}
          </div>
          {replay && (
            <p className="text-xs text-muted-foreground">
              At this point: {replay.metrics.insertionAttempts} insertion
              attempts · {replay.metrics.deletionActions} deletion actions ·{" "}
              {value(replay.metrics.inputAccuracy, "%")} input accuracy.
            </p>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer min-h-9">
              Recorded edit events
            </summary>
            <p className="text-muted-foreground my-2">
              Showing the first 100 events through this position. JSON export
              contains all retained evidence.
            </p>
            <div className="overflow-auto max-h-64">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    {["Active time", "Edit", "Input", "Source"].map((label) => (
                      <th scope="col" className="p-2" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.events
                    .filter(
                      (event) =>
                        activeOffset(event.offsetMs, result.pauseIntervals) <=
                        position,
                    )
                    .slice(0, 100)
                    .map((event) => (
                      <tr key={event.sequence}>
                        <td className="p-2">
                          {(
                            activeOffset(
                              event.offsetMs,
                              result.pauseIntervals,
                            ) / 1000
                          ).toFixed(3)}
                          s
                        </td>
                        <td className="p-2">{event.type}</td>
                        <td className="p-2 font-mono">
                          {event.text
                            ? JSON.stringify(event.text)
                            : `range ${event.start}–${event.end}`}
                        </td>
                        <td className="p-2">{event.provenance}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export function ResultEvidence({ result }: { result: SessionResult }) {
  const [expanded, setExpanded] = useState(false);
  const m = result.metrics,
    ledger = metricLedger(result);
  const formulas = [
    [
      "Input accuracy",
      ledger.isTargeted && m.insertionAttempts
        ? `${m.correctAttempts} correct ÷ ${m.insertionAttempts} insertion attempts × 100 = ${value(m.inputAccuracy, "%")}`
        : "No target accuracy is available.",
    ],
    [
      "Final text accuracy",
      ledger.isTargeted && ledger.finalDenominator
        ? `${m.correct} correct ÷ ${ledger.finalDenominator} processed positions × 100 = ${value(m.finalTextAccuracy, "%")}`
        : "No processed target positions.",
    ],
    [
      "Credited WPM",
      m.wpm === null
        ? "No target speed is available."
        : `${m.creditedUnits} credited characters ÷ 5 ÷ ${ledger.displayMinutes} minutes = ${value(m.wpm)} WPM`,
    ],
    [
      "Raw WPM",
      `${m.retainedUnits} retained characters ÷ 5 ÷ ${ledger.displayMinutes} minutes = ${value(m.rawWpm)} WPM`,
    ],
    [
      "Attempt rate",
      `${m.insertionAttempts} inserted characters ÷ 5 ÷ ${ledger.displayMinutes} minutes = ${value(m.attemptRate)} WPM`,
    ],
  ];
  return (
    <section className="panel p-5 sm:p-6" aria-label="Score explanation">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Every number, explained</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Accuracy of your attempts and correctness of the final text answer
            different questions. Displayed values are rounded; exports retain
            precision.
          </p>
        </div>
        <Link
          to="/keyboard-lab"
          className="text-xs text-primary min-h-9 inline-flex items-center"
        >
          Check your keyboard →
        </Link>
      </div>
      <dl className="grid sm:grid-cols-2 gap-5 mt-5">
        {formulas.map(([label, formula]) => (
          <div key={label}>
            <dt className="text-xs font-medium">{label}</dt>
            <dd className="text-xs text-muted-foreground mt-2 leading-relaxed font-mono">
              {formula}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground leading-relaxed mt-5">
        {ledger.isTargeted ? (
          <>
            {m.incorrectAttempts} incorrect insertion attempts remain in input
            accuracy even after corrections. Final text has {m.incorrect}{" "}
            incorrect, {m.extra} extra and {m.missed} missed positions.{" "}
            {m.untyped} untouched future positions are excluded.
          </>
        ) : (
          <>
            Free writing has no expected passage, so it has no correct/incorrect
            target positions or accuracy score.
          </>
        )}{" "}
        Deletions are separate actions.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
        WPM credits eligible words, not raw speed multiplied by accuracy.
        Character totals and insertion attempts can differ after edits or word
        skips. Consistency describes your rhythm under Forge’s formula; it is
        not an accuracy score or directly interchangeable with another site’s
        consistency.
      </p>
      <button
        className="forge-button-secondary mt-5"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide session evidence" : "Inspect session evidence"}
      </button>
      {expanded && <Inspection result={result} />}
    </section>
  );
}
