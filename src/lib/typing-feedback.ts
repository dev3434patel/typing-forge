import type { Attempt } from "./typing-core/transcript.ts";

export interface InputFeedback {
  typed: string;
  expected: string | undefined;
  incorrect: boolean;
  rejected: boolean;
  incorrectCount: number;
}

/** Names invisible committed units without pretending IME input is a physical key. */
export function inputUnitLabel(unit: string | undefined): string {
  if (unit === undefined) return "End of passage";
  if (unit === " ") return "Space";
  if (unit === "\n" || unit === "\r\n") return "Enter";
  if (unit === "\t") return "Tab";
  if (unit === "\u00a0") return "No-break space";
  return unit;
}

export function inputUnitGlyph(unit: string): string {
  if (unit === " " || unit === "\u00a0") return "␠";
  if (unit === "\n" || unit === "\r\n") return "↵";
  if (unit === "\t") return "⇥";
  return unit;
}

/** A mixed committed batch can contain both accepted and rejected units. */
export function feedbackFromAttempts(
  attempts: readonly Pick<Attempt, "typed" | "expected" | "correct">[],
  rejectIncorrect = false,
): InputFeedback | null {
  if (!attempts.length) return null;
  const wrong = attempts.filter((attempt) => !attempt.correct);
  const observed = wrong.at(-1) ?? attempts.at(-1)!;
  return {
    typed: observed.typed,
    expected: observed.expected,
    incorrect: !observed.correct,
    rejected: rejectIncorrect && !observed.correct,
    incorrectCount: wrong.length,
  };
}
