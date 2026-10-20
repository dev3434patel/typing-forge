import {
  ACCURACY_CHALLENGE_GOAL,
  type AccuracyChallengeState,
} from "@/lib/accuracy-challenge";

export function AccuracyChallenge({
  state,
  finished = false,
}: {
  state: AccuracyChallengeState;
  finished?: boolean;
}) {
  const count = state.completed
    ? ACCURACY_CHALLENGE_GOAL
    : finished
      ? state.best
      : state.current;
  return (
    <section
      aria-label="Accuracy challenge"
      className="rounded-xl border border-border bg-card px-5 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">
            Accuracy challenge
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              local practice
            </span>
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.completed
              ? "25 correct characters in a row. Goal complete."
              : finished
                ? `Best chain: ${state.best} of ${ACCURACY_CHALLENGE_GOAL} correct characters.`
                : "25 correct characters in a row, including spaces."}
          </p>
        </div>
        <span className="font-mono text-sm tabular-nums">
          {count}
          <span className="text-muted-foreground">
            {" "}
            / {ACCURACY_CHALLENGE_GOAL}
          </span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={
          state.completed
            ? "Completed accuracy challenge"
            : finished
              ? "Best chain of correct characters"
              : "Consecutive correct characters"
        }
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={ACCURACY_CHALLENGE_GOAL}
        className="mt-3 h-1 rounded-full bg-secondary"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(count / ACCURACY_CHALLENGE_GOAL) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {state.completed || finished
          ? "Your typing accuracy and race score use the original attempt evidence."
          : "Errors restart the chain. Deleting does not undo an attempt."}
      </p>
      <span role="status" aria-live="polite" className="sr-only">
        {state.completed ? "Accuracy goal complete." : ""}
      </span>
    </section>
  );
}
