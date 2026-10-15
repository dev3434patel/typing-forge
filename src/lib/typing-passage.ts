import type { CharacterSlot } from "./typing-core/types";

export interface TypingSlotGroup {
  readonly key: number;
  readonly kind: "word" | "whitespace" | "code";
  readonly slots: readonly CharacterSlot[];
}

// Nonbreaking spaces belong to their word. Use target whitespace for layout:
// typing a space instead of a letter must not split the expected word in two.
const breakingWhitespace = /^[^\S\u00a0\u2007\u202f]+$/u;

/**
 * Canonical alignment keeps extras at the array tail and encodes their retained
 * transcript offset as targetCount + offset. Reattach them for display only;
 * canonical slot objects and indexes remain untouched.
 */
export function orderTypingSlots(
  slots: readonly CharacterSlot[],
  cursor?: number,
): readonly CharacterSlot[] {
  const targetSlots = slots.filter((slot) => slot.expected !== null);
  const extras = slots
    .filter((slot) => slot.expected === null)
    .sort((left, right) => left.index - right.index);
  if (extras.length === 0) return slots;
  if (targetSlots.length === 0) return extras;

  const mapped = targetSlots.filter((slot) => slot.typed !== null);
  const anchored = new Map<number, CharacterSlot[]>();
  extras.forEach((slot, previousExtras) => {
    const typedOffset = slot.index - targetSlots.length;
    const precedingCount = Math.max(
      0,
      Math.min(mapped.length, typedOffset - previousExtras),
    );
    const previous = mapped[precedingCount - 1];
    // With no mapped input, an end cursor distinguishes explicitly submitted
    // empty words from an extra character before an initial empty target word.
    const anchor = previous
      ? previous.index + 1
      : mapped.length === 0 && (cursor ?? 0) >= targetSlots.length
        ? targetSlots.length
        : 0;
    const atAnchor = anchored.get(anchor) ?? [];
    atAnchor.push(slot);
    anchored.set(anchor, atAnchor);
  });
  const ordered: CharacterSlot[] = [];
  for (const slot of targetSlots) {
    ordered.push(...(anchored.get(slot.index) ?? []), slot);
  }
  ordered.push(...(anchored.get(targetSlots.length) ?? []));
  return ordered;
}

/** Presentation groups only; canonical references, text and offsets stay intact. */
export function groupTypingSlots(
  slots: readonly CharacterSlot[],
  preserveWhitespace = false,
  cursor?: number,
): readonly TypingSlotGroup[] {
  if (slots.length === 0) return [];
  const ordered = orderTypingSlots(slots, cursor);
  if (preserveWhitespace) {
    return [{ key: ordered[0].index, kind: "code", slots: ordered }];
  }

  const groups: TypingSlotGroup[] = [];
  let current: CharacterSlot[] = [];
  let kind: "word" | "whitespace" | null = null;
  for (const slot of ordered) {
    const unit = slot.expected ?? slot.typed ?? "";
    const nextKind = breakingWhitespace.test(unit) ? "whitespace" : "word";
    if (kind !== null && nextKind !== kind) {
      groups.push({ key: current[0].index, kind, slots: current });
      current = [];
    }
    kind = nextKind;
    current.push(slot);
  }
  if (kind !== null) {
    groups.push({ key: current[0].index, kind, slots: current });
  }
  return groups;
}
