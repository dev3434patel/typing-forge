import { useMemo } from "react";
import type { SessionController, SessionSnapshot } from "@/lib/typing-core";
import { feedbackFromAttempts, inputUnitLabel } from "@/lib/typing-feedback";
import { cn } from "@/lib/utils";

export function TypingFeedback({
  snapshot,
  controller,
  rejectIncorrect = false,
}: {
  snapshot: SessionSnapshot;
  controller: SessionController;
  rejectIncorrect?: boolean;
}) {
  const lastSequence = snapshot.events.at(-1)?.sequence ?? -1;
  const feedback = useMemo(() => {
    // The controller is stable; timer snapshots must not rescan a committed batch.
    void lastSequence;
    return feedbackFromAttempts(controller.lastInputAttempts, rejectIncorrect);
  }, [controller, lastSequence, rejectIncorrect]);
  const recoveryHint = controller.canReopenPreviousWord
    ? "Backspace returns to the previous incorrect word · Ctrl/Alt + Backspace retypes it."
    : "";
  const errorText = feedback?.incorrect
    ? `You typed ${inputUnitLabel(feedback.typed)}. Expected ${inputUnitLabel(feedback.expected)}. ${feedback.rejected ? "Not inserted. Type the expected character to continue." : recoveryHint || "Added to your text. Backspace to correct, or keep typing."} ${snapshot.metrics.incorrectAttempts} incorrect attempts so far.`
    : "";
  return (
    <div
      data-testid="typing-feedback"
      className={cn(
        "typing-feedback",
        feedback?.incorrect && "typing-feedback-error",
      )}
    >
      {feedback?.incorrect ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>
            You typed{" "}
            <kbd className="typing-feedback-key">
              <bdi>{inputUnitLabel(feedback.typed)}</bdi>
            </kbd>
          </span>
          {feedback.incorrect && (
            <span>
              Expected{" "}
              <kbd className="typing-feedback-key text-foreground">
                <bdi>{inputUnitLabel(feedback.expected)}</bdi>
              </kbd>
            </span>
          )}
          <span className="text-muted-foreground">
            {feedback.incorrect
              ? feedback.rejected
                ? "Not inserted · type the expected character to continue."
                : recoveryHint || "Added to your text · Backspace to correct, or keep typing."
              : "Keep going."}
          </span>
          {feedback.incorrectCount > 1 && (
            <span className="text-muted-foreground">
              {feedback.incorrectCount} incorrect units in this input · showing
              the last
            </span>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {recoveryHint || (feedback
            ? "Keep going."
            : rejectIncorrect
              ? "Stop on error · type the expected character to continue."
              : "Type the text above. Wrong letters stay visible; Backspace corrects.")}
        </p>
      )}
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {errorText}
      </span>
    </div>
  );
}
