import {
  replaySession,
  replaySnapshot,
  traceSessionWords,
  type SessionResult,
  type WordCreditTrace,
} from "./typing-core";

/** A reproducibility check, never a claim of human input or server acceptance. */
export function inspectSessionEvidence(result: SessionResult): {
  status: "matches" | "mismatch" | "unavailable";
  differences: string[];
  words: WordCreditTrace[];
} {
  try {
    const options = {
      targetText: result.targetText,
      issuedTargetSegments: result.issuedTargetSegments,
      pauseIntervals: result.pauseIntervals,
      finiteFinal:
        result.status === "finished" &&
        !["time", "zen"].includes(result.configuration.mode) &&
        result.configuration.scoringPolicy !== "free",
    };
    const replayed = replaySession(
      result.configuration,
      result.events,
      result.elapsedMs,
      options,
    );
    const differences: string[] = [];
    for (const key of Object.keys(replayed.metrics) as Array<
      keyof typeof replayed.metrics
    >) {
      const expected = replayed.metrics[key],
        recorded = result.metrics[key];
      const equal =
        expected === recorded ||
        (typeof expected === "number" &&
          typeof recorded === "number" &&
          Number.isFinite(recorded) &&
          Math.abs(expected - recorded) <=
            1e-9 * Math.max(1, Math.abs(expected)));
      if (!equal)
        differences.push(`Metric ${key} differs from the saved value.`);
    }
    if (
      replayed.finalText !== result.finalText ||
      replayed.finalText !== result.finalTranscript
    )
      differences.push("The final transcript differs from the recorded edits.");
    if (
      JSON.stringify(replayed.characters) !== JSON.stringify(result.characters)
    )
      differences.push("The final character accounting differs from replay.");
    if (
      JSON.stringify(replayed.timeSeries) !== JSON.stringify(result.timeSeries)
    )
      differences.push("The recorded timeline differs from replay.");
    if (result.configuration.initialTarget !== result.initialTarget)
      differences.push("The initial target and configuration differ.");
    if (
      result.initialTarget +
        result.issuedTargetSegments.map((segment) => segment.text).join("") !==
      result.targetText
    )
      differences.push(
        "The issued target segments do not reconstruct the final passage.",
      );
    if (result.clientSessionId !== result.configuration.clientSessionId)
      differences.push("The session identity and configuration differ.");
    return {
      status: differences.length ? ("mismatch" as const) : ("matches" as const),
      differences,
      words: traceSessionWords(
        result.configuration,
        result.events,
        result.elapsedMs,
        options,
      ),
    };
  } catch (error) {
    return {
      status: "unavailable" as const,
      differences: [
        error instanceof Error
          ? error.message
          : "The recorded evidence could not be replayed.",
      ],
      words: [],
    };
  }
}

export function replayAtActiveTime(result: SessionResult, activeMs: number) {
  const cutoff = Math.max(
    0,
    Math.min(result.elapsedMs, Number.isFinite(activeMs) ? activeMs : 0),
  );
  return replaySnapshot(result.configuration, result.events, cutoff, {
    targetText: result.targetText,
    issuedTargetSegments: result.issuedTargetSegments,
    pauseIntervals: result.pauseIntervals,
    finiteFinal:
      cutoff === result.elapsedMs &&
      !["time", "zen"].includes(result.configuration.mode) &&
      result.configuration.scoringPolicy !== "free",
  });
}

export function metricLedger(result: SessionResult) {
  const m = result.metrics;
  const minutes = result.elapsedMs / 60_000;
  return {
    minutes,
    finalDenominator:
      result.configuration.scoringPolicy === "free"
        ? 0
        : m.correct + m.incorrect + m.extra + m.missed,
    retainedDenominator: m.correct + m.incorrect + m.extra,
    displayMinutes:
      minutes === 0 ? "0" : Number(minutes.toPrecision(6)).toString(),
    isTargeted: result.configuration.scoringPolicy !== "free",
  };
}
