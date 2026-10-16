import type { ReactNode } from "react";
import type { CharacterSlot } from "@/lib/typing-core";
import { groupTypingSlots, type TypingSlotGroup } from "@/lib/typing-passage";

const CHUNK_SIZE = 64;

export interface TypingSlotView {
  readonly slot: CharacterSlot;
  readonly current: boolean;
  readonly marker: ReactNode;
  readonly before: ReactNode;
  readonly after: ReactNode;
  readonly className: string | undefined;
}

export interface TypingCharacterChunk {
  readonly key: number;
  readonly views: readonly TypingSlotView[];
}

export interface TypingPresentationGroup {
  readonly key: number;
  readonly kind: TypingSlotGroup["kind"];
  readonly size: number;
  readonly chunks: readonly TypingCharacterChunk[];
}

export interface TypingPassageBlock {
  readonly key: number;
  readonly groups: readonly TypingPresentationGroup[];
}

export interface TypingPassageModel {
  readonly blocks: readonly TypingPassageBlock[];
  readonly targetCount: number;
  readonly hasCurrentTarget: boolean;
}

export interface TypingPassagePresentation {
  readonly cursor: number;
  readonly marker: ReactNode;
  readonly preserveWhitespace?: boolean;
  readonly renderBefore?: (slot: CharacterSlot) => ReactNode;
  readonly renderAfter?: (slot: CharacterSlot) => ReactNode;
  readonly characterClassName?: (slot: CharacterSlot) => string | undefined;
}

function sameSlot(left: CharacterSlot, right: CharacterSlot): boolean {
  return (
    left.index === right.index &&
    left.expected === right.expected &&
    left.typed === right.typed &&
    left.status === right.status
  );
}

function sameItems<T>(left: readonly T[], right: readonly T[]): boolean {
  return left.length === right.length && left.every((item, i) => item === right[i]);
}

/** Keep semantic glyph updates separate from React's full passage reconciliation.
 * Complete words retain their original wrapper; oversized words/code have bounded
 * inner fragments. Shared immutable blocks let unchanged DOM skip React entirely.
 */
export function buildTypingPassageModel(
  slots: readonly CharacterSlot[],
  presentation: TypingPassagePresentation,
  previous?: TypingPassageModel,
): TypingPassageModel {
  const previousGroups = new Map(
    previous?.blocks.flatMap((block) =>
      block.groups.map((group) => [group.key, group] as const),
    ),
  );
  let targetCount = 0;
  let hasCurrentTarget = false;
  const groups = groupTypingSlots(
    slots,
    presentation.preserveWhitespace,
    presentation.cursor,
  ).map((group): TypingPresentationGroup => {
    const candidate = previousGroups.get(group.key);
    const oldGroup = candidate?.kind === group.kind ? candidate : undefined;
    const chunks: TypingCharacterChunk[] = [];
    for (let start = 0; start < group.slots.length; start += CHUNK_SIZE) {
      const key = group.slots[start].index;
      const candidateChunk = oldGroup?.chunks[start / CHUNK_SIZE];
      const oldChunk = candidateChunk?.key === key ? candidateChunk : undefined;
      const views: TypingSlotView[] = [];
      const end = Math.min(start + CHUNK_SIZE, group.slots.length);
      for (let index = start; index < end; index++) {
        const slot = group.slots[index];
        if (slot.expected !== null) targetCount++;
        const current = slot.expected !== null && slot.index === presentation.cursor;
        if (current) hasCurrentTarget = true;
        const marker = current ? presentation.marker : undefined;
        const before = presentation.renderBefore?.(slot);
        const after = presentation.renderAfter?.(slot);
        const className = presentation.characterClassName?.(slot);
        const old = oldChunk?.views[index - start];
        views.push(
          old &&
            sameSlot(old.slot, slot) &&
            old.current === current &&
            old.marker === marker &&
            old.before === before &&
            old.after === after &&
            old.className === className
            ? old
            : { slot, current, marker, before, after, className },
        );
      }
      chunks.push(
        oldChunk && sameItems(oldChunk.views, views) ? oldChunk : { key, views },
      );
    }
    return oldGroup && sameItems(oldGroup.chunks, chunks)
      ? oldGroup
      : { key: group.key, kind: group.kind, size: group.slots.length, chunks };
  });
  const previousBlocks = new Map(previous?.blocks.map((block) => [block.key, block]));
  const blocks: TypingPassageBlock[] = [];
  let pending: TypingPresentationGroup[] = [];
  let size = 0;
  const flush = () => {
    if (!pending.length) return;
    const key = pending[0].key;
    const old = previousBlocks.get(key);
    blocks.push(old && sameItems(old.groups, pending) ? old : { key, groups: pending });
    pending = [];
    size = 0;
  };
  for (const group of groups) {
    if (size && size + group.size > CHUNK_SIZE) flush();
    pending.push(group);
    size += group.size;
    if (size >= CHUNK_SIZE) flush();
  }
  flush();
  return { blocks, targetCount, hasCurrentTarget };
}
