import type { ReactNode } from "react";
import type { CharacterSlot } from "@/lib/typing-core";
import { inputUnitGlyph, inputUnitLabel } from "@/lib/typing-feedback";
import { cn } from "@/lib/utils";

interface Props {
  slot: CharacterSlot;
  current?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Target-guided layout with the actual retained input drawn at an error slot. */
export function TypingCharacter({
  slot,
  current = false,
  className,
  children,
}: Props) {
  const wrong = slot.status === "incorrect" || slot.status === "extra";
  const actual = wrong ? slot.typed : (slot.expected ?? slot.typed);
  const expectedNewline = slot.expected === "\n";
  const glyph = actual === null ? "" : wrong ? inputUnitGlyph(actual) : actual;
  return (
    <span
      className={cn(
        "typing-character",
        slot.status === "untyped" ? "char-upcoming" : `char-${slot.status}`,
        className,
      )}
      data-current={current}
      data-slot-index={slot.index}
      data-status={slot.status}
      data-typed={slot.typed ?? undefined}
      data-expected={slot.expected ?? undefined}
      title={
        wrong
          ? `You typed ${inputUnitLabel(slot.typed ?? undefined)}. Expected ${inputUnitLabel(slot.expected ?? undefined)}.`
          : undefined
      }
    >
      {children}
      <span data-typed-glyph>
        {expectedNewline && !wrong
          ? slot.status === "untyped"
            ? ""
            : "↵"
          : glyph}
      </span>
      {slot.status === "incorrect" && slot.expected !== null && (
        <span aria-hidden="true" className="typing-expected-hint">
          {inputUnitGlyph(slot.expected)}
        </span>
      )}
      {expectedNewline && <br />}
      {slot.expected === " " && slot.status === "missed" && (
        <span className="absolute inset-0">·</span>
      )}
    </span>
  );
}
