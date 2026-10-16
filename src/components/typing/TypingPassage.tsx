import { Fragment, memo, useEffect, useRef, type ReactNode } from "react";
import type { CharacterSlot } from "@/lib/typing-core";
import { TypingCharacter } from "./TypingCharacter";
import {
  buildTypingPassageModel,
  type TypingCharacterChunk,
  type TypingPassageBlock,
  type TypingPassageModel,
} from "./typing-passage-model";

interface Props {
  slots: readonly CharacterSlot[];
  cursor: number;
  marker: ReactNode;
  preserveWhitespace?: boolean;
  renderBefore?: (slot: CharacterSlot) => ReactNode;
  renderAfter?: (slot: CharacterSlot) => ReactNode;
  characterClassName?: (slot: CharacterSlot) => string | undefined;
}

const wordStyle = {
  display: "inline-block",
  maxWidth: "100%",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  verticalAlign: "top",
} as const;

const CharacterChunk = memo(function CharacterChunk({
  chunk,
}: {
  chunk: TypingCharacterChunk;
}) {
  return (
    <>
      {chunk.views.map((view) => (
        <Fragment key={view.slot.index}>
          <TypingCharacter
            slot={view.slot}
            current={view.current}
            className={view.className}
          >
            {view.current ? (
              <>
                {view.marker}
                {view.before}
              </>
            ) : (
              view.before
            )}
          </TypingCharacter>
          {view.after}
        </Fragment>
      ))}
    </>
  );
});

const PassageBlock = memo(function PassageBlock({
  block,
}: {
  block: TypingPassageBlock;
}) {
  return (
    <>
      {block.groups.map((group) => {
        const characters = group.chunks.map((chunk) => (
          <CharacterChunk key={chunk.key} chunk={chunk} />
        ));
        return group.kind === "word" ? (
          <span
            key={group.key}
            className="typing-word"
            data-typing-word
            style={wordStyle}
          >
            {characters}
          </span>
        ) : (
          <Fragment key={group.key}>
            {characters}
            {group.kind === "whitespace" && <wbr />}
          </Fragment>
        );
      })}
    </>
  );
});

/** Word-aware presentation shared by tests and lessons; input remains in the session core. */
export function TypingPassage(props: Props) {
  const committedModel = useRef<TypingPassageModel>();
  const model = buildTypingPassageModel(props.slots, props, committedModel.current);
  // Store only committed presentation. An interrupted concurrent render cannot
  // replace the comparison baseline used by the visible passage.
  useEffect(() => {
    committedModel.current = model;
  }, [model]);
  return (
    <>
      {model.blocks.map((block) => (
        <PassageBlock key={block.key} block={block} />
      ))}
      {!model.hasCurrentTarget && props.cursor >= model.targetCount && (
        <span className="typing-passage-end" data-passage-end>
          {props.marker}
        </span>
      )}
    </>
  );
}
