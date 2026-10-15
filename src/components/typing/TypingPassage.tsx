import { Fragment, type ReactNode } from "react";
import type { CharacterSlot } from "@/lib/typing-core";
import { groupTypingSlots } from "@/lib/typing-passage";
import { TypingCharacter } from "./TypingCharacter";

interface Props {
  slots: readonly CharacterSlot[];
  cursor: number;
  marker: ReactNode;
  preserveWhitespace?: boolean;
  renderBefore?: (slot: CharacterSlot) => ReactNode;
  renderAfter?: (slot: CharacterSlot) => ReactNode;
  characterClassName?: (slot: CharacterSlot) => string | undefined;
}

/** Word-aware presentation shared by tests and lessons; input remains in the session core. */
export function TypingPassage({
  slots,
  cursor,
  marker,
  preserveWhitespace = false,
  renderBefore,
  renderAfter,
  characterClassName,
}: Props) {
  const targetCount = slots.filter((slot) => slot.expected !== null).length;
  const hasCurrentTarget = slots.some(
    (slot) => slot.expected !== null && slot.index === cursor,
  );
  const renderSlot = (slot: CharacterSlot) => (
    <Fragment key={slot.index}>
      <TypingCharacter
        slot={slot}
        current={slot.expected !== null && slot.index === cursor}
        className={characterClassName?.(slot)}
      >
        {slot.expected !== null && slot.index === cursor && marker}
        {renderBefore?.(slot)}
      </TypingCharacter>
      {renderAfter?.(slot)}
    </Fragment>
  );
  return (
    <>
      {groupTypingSlots(slots, preserveWhitespace, cursor).map((group) =>
        group.kind === "word" ? (
          <span
            key={group.key}
            className="typing-word"
            data-typing-word
            style={{
              display: "inline-block",
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              verticalAlign: "top",
            }}
          >
            {group.slots.map(renderSlot)}
          </span>
        ) : (
          <Fragment key={group.key}>
            {group.slots.map(renderSlot)}
            {group.kind === "whitespace" && <wbr />}
          </Fragment>
        ),
      )}
      {!hasCurrentTarget && cursor >= targetCount && (
        <span className="typing-passage-end" data-passage-end>
          {marker}
        </span>
      )}
    </>
  );
}
