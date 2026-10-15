import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  RotateCcw,
  Download,
  Trophy,
  CheckCircle2,
  Cloud,
  AlertCircle,
  Lock,
  ChevronDown,
} from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SessionResult } from "@/lib/typing-core";
import type { SaveStatus } from "@/hooks/useTestResults";
import { useSessionHistory } from "@/hooks/useTestResults";
import { LAYOUTS, getContentPack, type LayoutId } from "@/lib/content-packs";
import { cn } from "@/lib/utils";
import { learningEvidenceFromResult } from "@/lib/learning-evidence";
import { sessionView } from "@/services/history-model";
import { ResultEvidence } from "./ResultEvidence";
const display = (value: number | null, digits = 0) =>
  value === null ? "—" : value.toFixed(digits);
function exportResult(result: SessionResult) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge-session-${result.clientSessionId}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export interface SessionResultsProps {
  result: SessionResult;
  onRestart: () => void;
  onRepeat?: () => void;
  saveStatus?: SaveStatus;
  onRetrySave?: () => void;
  onCloudConsent?: () => void;
  quickRestart?: boolean;
}
export function SessionResults({
  result,
  onRestart,
  onRepeat,
  saveStatus,
  onRetrySave,
  onCloudConsent,
  quickRestart = false,
}: SessionResultsProps) {
  const root = useRef<HTMLElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (quickRestart) root.current?.focus({ preventScroll: true });
  }, [quickRestart, result.clientSessionId]);
  const { records } = useSessionHistory();
  const [showRaw, setShowRaw] = useState(true),
    [showErrors, setShowErrors] = useState(true),
    [notice, setNotice] = useState("");
  const m = result.metrics,
    config = result.configuration;
  const comparable = records
    .map(sessionView)
    .filter(
      (view) =>
        view.record.clientSessionId !== result.clientSessionId &&
        view.comparisonKey === result.comparisonKey &&
        view.personalBestEligible &&
        view.wpm !== null,
    );
  const previousBest = comparable.length
    ? Math.max(...comparable.map((view) => view.wpm!))
    : null;
  const personalBest =
    result.eligibility.eligible &&
    m.wpm !== null &&
    previousBest !== null &&
    m.wpm > previousBest;
  const keyStats = useMemo(() => {
    const keys = new Map<string, { correct: number; total: number }>();
    result.characters
      .filter((c) => c.expected && c.status !== "untyped")
      .forEach((c) => {
        const key = c.expected!.toLocaleLowerCase();
        const v = keys.get(key) ?? { correct: 0, total: 0 };
        v.total++;
        if (c.status === "correct") v.correct++;
        keys.set(key, v);
      });
    return keys;
  }, [result]);
  const layout =
    LAYOUTS[(config.keyboardLayout ?? "qwerty") as LayoutId] ?? LAYOUTS.native;
  const attemptStats = new Map<string, { correct: number; total: number }>();
  learningEvidenceFromResult(result).attempts.forEach((attempt) => {
    if (!attempt.expected.trim()) return;
    const key = attempt.expected.toLocaleLowerCase();
    const stats = attemptStats.get(key) ?? { correct: 0, total: 0 };
    stats.total++;
    if (attempt.correct) stats.correct++;
    attemptStats.set(key, stats);
  });
  const weakest = Array.from(attemptStats)
    .filter(([key, stats]) => key.trim() && stats.correct < stats.total)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 5)
    .map(([key]) => key)
    .join("");
  const lessonUrl = `/learn?${new URLSearchParams({ keys: weakest, source: result.clientSessionId, language: config.language || "en", layout: config.keyboardLayout || "qwerty", retest: `/?retest=${result.clientSessionId}` }).toString()}`;
  const sourceRecord =
    typeof config.settings?.sourceResultId === "string"
      ? records.find(
          (record) => record.clientSessionId === config.settings.sourceResultId,
        )
      : null;
  const sourceResult = sourceRecord?.candidate as SessionResult | undefined;
  const idleSeconds =
    result.timeSeries
      .filter((point) => point.localWpm === 0)
      .reduce((total, point) => total + point.bucketDurationMs, 0) / 1000;
  const insight =
    m.incorrectAttempts > 0
      ? `${m.incorrectAttempts} incorrect insertion ${m.incorrectAttempts === 1 ? "attempt remains" : "attempts remain"} in your input accuracy. ${m.deletedUnits} ${m.deletedUnits === 1 ? "character was" : "characters were"} removed while editing.`
      : m.insertionAttempts > 0
        ? "Every insertion attempt matched its expected character. Keep that deliberate rhythm in your next session."
        : "There are no insertion attempts in this session yet.";
  const share = async () => {
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image export is unavailable.");
      ctx.fillStyle = "#0B0D12";
      ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = "#F5B544";
      ctx.font = '500 26px "Inter Variable", sans-serif';
      ctx.fillText("typingforge.", 70, 85);
      ctx.fillStyle = "#AAB6C6";
      ctx.font = '20px "Inter Variable", sans-serif';
      ctx.fillText(
        `${config.mode} · ${(result.elapsedMs / 1000).toFixed(1)}s · ${getContentPack(config.language || "en").label}`,
        70,
        150,
      );
      ctx.fillStyle = "#EEF1F7";
      ctx.font = '600 140px "JetBrains Mono Variable", monospace';
      ctx.fillText(display(m.wpm), 65, 340);
      ctx.font = '24px "Inter Variable", sans-serif';
      ctx.fillStyle = "#8796A8";
      ctx.fillText("words per minute", 75, 390);
      ctx.fillStyle = "#F5B544";
      ctx.font = '500 72px "JetBrains Mono Variable", monospace';
      ctx.fillText(`${display(m.inputAccuracy, 1)}%`, 700, 300);
      ctx.fillStyle = "#8796A8";
      ctx.font = '24px "Inter Variable", sans-serif';
      ctx.fillText("input accuracy", 705, 355);
      ctx.fillStyle = "#2D3746";
      ctx.fillRect(70, 475, 1060, 1);
      ctx.fillStyle = "#8796A8";
      ctx.font = '18px "Inter Variable", sans-serif';
      ctx.fillText(
        "forge-v3 · personal practice · no private text included",
        70,
        530,
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          setNotice("Image export failed. Try JSON export.");
          return;
        }
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "typing-forge-result.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setNotice("Share image downloaded. It contains statistics only.");
      });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Image export failed.",
      );
    }
  };
  const grid = [
    ["Raw WPM", m.rawWpm, "Retained characters ÷ 5 ÷ elapsed minutes."],
    [
      "Attempt rate",
      m.attemptRate,
      "All inserted units ÷ 5 ÷ elapsed minutes.",
    ],
    [
      "Consistency",
      m.consistency,
      "Variation of duration-weighted attempt buckets. Requires five seconds and five attempts.",
    ],
    [
      "5s burst",
      m.peakFiveSecondWpm,
      "Highest complete five-second attempt window.",
    ],
    [
      "Final accuracy",
      m.finalTextAccuracy,
      "Final text correctness. Corrected mistakes remain in input accuracy.",
    ],
    [
      "Duration",
      result.elapsedMs / 1000,
      "Actual active duration including idle time. Paused intervals are excluded.",
    ],
  ] as const;
  return (
    <section
      ref={root}
      tabIndex={quickRestart ? -1 : undefined}
      aria-label="Session results"
      aria-describedby={quickRestart ? "results-restart-hint" : undefined}
      className="forge-appear space-y-6 outline-none"
      onKeyDown={(event) => {
        if (
          quickRestart &&
          event.target === event.currentTarget &&
          event.key === "Tab" &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          nextButton.current?.focus();
        }
      }}
    >
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="eyebrow">Session complete</p>
          <p className="text-sm text-muted-foreground mt-2">
            {config.mode} · {getContentPack(config.language || "en").label} ·{" "}
            {config.keyboardLayout || "qwerty"} · forge-v3
          </p>
        </div>
        {personalBest && (
          <span className="inline-flex gap-2 items-center rounded-full text-primary text-xs px-4 py-2 border border-primary/40">
            <Trophy size={15} />
            Personal best · +{(m.wpm! - previousBest!).toFixed(1)} wpm
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6 py-5 sm:py-7">
        <div>
          <p className="eyebrow">Words per minute</p>
          <div className="font-mono font-medium text-primary tracking-tighter text-6xl sm:text-8xl mt-3">
            {display(m.wpm)}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {config.scoringPolicy === "code"
              ? "correct-character code speed"
              : config.scoringPolicy === "free"
                ? "free writing speed"
                : "credited word speed"}
          </p>
        </div>
        <div>
          <p className="eyebrow">Input accuracy</p>
          <div className="font-mono font-medium tracking-tighter text-5xl sm:text-7xl mt-5">
            {display(m.inputAccuracy, 1)}
            {m.inputAccuracy !== null && (
              <span className="text-2xl text-muted-foreground">%</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {m.correctAttempts} / {m.insertionAttempts} insertion attempts
          </p>
        </div>
      </div>
      {sourceResult && (
        <div className="panel p-5 text-sm">
          <h2 className="font-medium">Matched practice retest</h2>
          <p className="text-muted-foreground mt-2">
            Same passage and settings. WPM:{" "}
            {display(sourceResult.metrics.wpm, 1)} → {display(m.wpm, 1)}. Input
            accuracy: {display(sourceResult.metrics.inputAccuracy, 1)}% →{" "}
            {display(m.inputAccuracy, 1)}%.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This is a repeated passage. A change here does not establish an
            improvement on unseen text.
          </p>
        </div>
      )}
      <section
        className="panel p-4 sm:p-6"
        aria-label="Speed and error timeline"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-sm font-medium">Your rhythm</h2>
          <div className="flex gap-3 text-xs">
            <span className="text-primary py-2">● WPM</span>
            <button
              className="min-h-9"
              aria-pressed={showRaw}
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "●" : "○"} Raw
            </button>
            <button
              className="min-h-9 text-destructive"
              aria-pressed={showErrors}
              onClick={() => setShowErrors(!showErrors)}
            >
              {showErrors ? "●" : "○"} Errors
            </button>
          </div>
        </div>
        {result.timeSeries.length ? (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={result.timeSeries}
                  margin={{ left: -20, right: 0, top: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--forge-border)"
                    vertical={false}
                    strokeDasharray="3 5"
                  />
                  <XAxis
                    dataKey="seconds"
                    tickFormatter={(value: number) =>
                      Number(value).toFixed(
                        Number.isInteger(Number(value)) ? 0 : 1,
                      )
                    }
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    unit="s"
                    minTickGap={30}
                  />
                  <YAxis
                    yAxisId="speed"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    yAxisId="errors"
                    orientation="right"
                    hide
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--forge-raised)",
                      border: "1px solid var(--forge-border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    labelFormatter={(label) =>
                      `${Number(label).toFixed(1)} seconds`
                    }
                    formatter={(value: number) =>
                      Number.isFinite(value) ? value.toFixed(1) : "—"
                    }
                  />
                  {showErrors && (
                    <Bar
                      yAxisId="errors"
                      dataKey="errors"
                      name="Errors"
                      fill="var(--forge-error)"
                      opacity={0.45}
                      barSize={5}
                    />
                  )}
                  <Line
                    yAxisId="speed"
                    dataKey="wpm"
                    name="WPM"
                    stroke="var(--forge-accent)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {showRaw && (
                    <Line
                      yAxisId="speed"
                      dataKey="rawWpm"
                      name="Raw WPM"
                      stroke="var(--forge-muted)"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="4 4"
                      isAnimationActive={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer py-2">
                View accessible chart data
              </summary>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">
                    Cumulative speed and bucket errors by elapsed seconds
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Seconds</th>
                      <th scope="col">WPM</th>
                      <th scope="col">Raw</th>
                      <th scope="col">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.timeSeries.map((point, i) => (
                      <tr key={i}>
                        <td>{point.seconds.toFixed(1)}</td>
                        <td>{display(point.wpm, 1)}</td>
                        <td>{display(point.rawWpm, 1)}</td>
                        <td>{point.errors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-10">
            Type for at least one second to build a timeline.
          </p>
        )}
      </section>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {grid.map(([label, value, formula]) => (
          <div className="stat-card !p-4" key={label}>
            <p className="stat-label">{label}</p>
            <p className="font-mono text-2xl mt-3">
              {display(
                value,
                label === "Duration" ||
                  (label === "Final accuracy" &&
                    value !== null &&
                    !Number.isInteger(value))
                  ? 1
                  : 0,
              )}
              {["Consistency", "Final accuracy"].includes(label) &&
              value !== null ? (
                <span className="text-sm text-muted-foreground">%</span>
              ) : label === "Duration" ? (
                <span className="text-sm text-muted-foreground">s</span>
              ) : (
                ""
              )}
            </p>
            <details className="text-xs text-muted-foreground mt-3">
              <summary className="cursor-pointer">How it’s measured</summary>
              <p className="mt-2 leading-relaxed">{formula}</p>
            </details>
          </div>
        ))}
      </div>
      <ResultEvidence result={result} />
      <div className="grid md:grid-cols-2 gap-5">
        <section className="panel p-6">
          <h2 className="text-sm font-medium mb-4">
            Characters, accounted for
          </h2>
          <div className="flex flex-wrap gap-5 font-mono text-lg">
            {[
              [m.correct, "correct"],
              [m.incorrect, "incorrect"],
              [m.extra, "extra"],
              [m.missed, "missed"],
            ].map(([value, label]) => (
              <span
                key={label}
                className={
                  label === "incorrect" || label === "extra"
                    ? "text-destructive"
                    : ""
                }
              >
                {value}
                <span className="block text-xs text-muted-foreground font-sans mt-1">
                  {label}
                </span>
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-5">
            {m.untyped} untyped · {m.deletionActions} deletion actions ·{" "}
            {m.deletedUnits} deleted characters
          </p>
        </section>
        <section className="panel p-6">
          <h2 className="text-sm font-medium mb-3">Practice insight</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight}
          </p>
          {idleSeconds >= 2 && (
            <p className="text-xs text-muted-foreground mt-3">
              {idleSeconds.toFixed(1)} seconds were in idle sampling buckets.
              Those pauses stay in the clock.
            </p>
          )}
          <Link
            className="text-primary inline-flex gap-2 items-center text-sm mt-5 min-h-9"
            to={lessonUrl}
          >
            Build accuracy with a focused lesson
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      {layout.rows.length > 0 && (
        <details className="panel p-6">
          <summary className="text-sm cursor-pointer font-medium">
            Final-text keyboard map
            <span className="block text-xs text-muted-foreground mt-1 font-normal">
              Measured final characters only. Untyped keys have no color.
            </span>
          </summary>
          <div className="flex flex-col items-center gap-2 mt-5 overflow-x-auto">
            {layout.rows.map((row, i) => (
              <div className="flex gap-1.5" key={i}>
                {row.map((key) => {
                  const stats = keyStats.get(key);
                  return (
                    <span
                      key={key}
                      title={
                        stats
                          ? `${key}: ${stats.correct}/${stats.total} correct final characters`
                          : `${key}: no observations`
                      }
                      className={cn(
                        "border rounded-lg w-7 sm:w-10 h-9 sm:h-11 inline-flex items-center justify-center text-xs font-mono",
                        !stats
                          ? "text-muted-foreground"
                          : stats.correct < stats.total
                            ? "text-destructive bg-destructive/10 border-destructive/50"
                            : "text-foreground bg-secondary",
                      )}
                    >
                      {key}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </details>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer py-3">
          Session details & comparison eligibility{" "}
          <ChevronDown className="inline ml-1" size={12} />
        </summary>
        <p className="mt-2 leading-relaxed">
          {result.eligibility.eligible
            ? "Available for comparable personal bests. Local evidence is unverified until accepted by the server."
            : result.eligibility.reasons.join(" · ")}
          {config.repeatedContent ? " · Repeated passage" : ""}
        </p>
        <p className="mt-2">
          {new Date(result.finishedAtWall).toLocaleString()} ·{" "}
          {result.finishReason} · metrics {result.metricsVersion}
        </p>
      </details>
      {saveStatus && (
        <div
          role="status"
          className="flex flex-wrap gap-3 items-center panel px-5 py-4 text-xs text-muted-foreground"
        >
          {saveStatus.state === "synced" ? (
            <CheckCircle2 size={17} className="text-success" />
          ) : ["rejected", "retryable-error"].includes(saveStatus.state) ? (
            <AlertCircle size={17} className="text-destructive" />
          ) : (
            <Cloud size={17} />
          )}
          <span className="flex-1">
            {saveStatus.storageMode === "memory"
              ? "Memory only. Export before closing. "
              : ""}
            {saveStatus.message}
          </span>
          {["retryable-error", "auth-required", "queued"].includes(
            saveStatus.state,
          ) &&
            onRetrySave && (
              <button
                className="forge-button-secondary !min-h-9 !text-xs"
                onClick={onRetrySave}
              >
                Retry sync
              </button>
            )}
          {config.privacy === "private-custom" &&
            onCloudConsent &&
            saveStatus.state === "local-only" &&
            result.ownerScope !== "guest" && (
              <button
                className="forge-button-secondary !text-xs"
                onClick={onCloudConsent}
              >
                <Lock size={13} />
                Allow this text in cloud storage
              </button>
            )}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-3 pt-3">
        <div className="flex flex-wrap gap-3">
          <button ref={nextButton} className="forge-button" onClick={onRestart}>
            <RotateCcw size={16} />
            Next test
          </button>
          {onRepeat && (
            <button className="forge-button-secondary" onClick={onRepeat}>
              Repeat passage
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="forge-button-secondary"
            onClick={() => void share()}
          >
            <Download size={15} />
            Share image
          </button>
          <button
            className="forge-button-secondary"
            onClick={() => exportResult(result)}
          >
            Export JSON
          </button>
        </div>
      </div>
      {quickRestart && (
        <p id="results-restart-hint" className="text-xs text-muted-foreground">
          Tab → Enter starts the next test.
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {notice}
      </p>
    </section>
  );
}
