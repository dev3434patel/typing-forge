import {
  readTypingGameRecords,
  typingGameStorageKey,
  type TypingGameRecords,
} from "@/lib/typing-game-records";
import type { SessionRecord } from "./session-repository";

function requireOwner(ownerId: string) {
  if (typeof ownerId !== "string" || !ownerId.trim())
    throw new Error("Choose a workspace before exporting its data.");
}

/** Read only the explicitly selected owner's sanitized, non-text game summaries. */
export function readOwnerGameBests(
  ownerId: string,
  storage?: Pick<Storage, "getItem">,
): TypingGameRecords {
  requireOwner(ownerId);
  try {
    return readTypingGameRecords(
      (storage ?? globalThis.localStorage)?.getItem(
        typingGameStorageKey(ownerId),
      ) ?? null,
    );
  } catch {
    return {};
  }
}

export function workspaceExportData(
  ownerId: string,
  records: readonly SessionRecord[],
) {
  requireOwner(ownerId);
  return {
    ownerId,
    sessions: records.filter((record) => record.ownerId === ownerId),
    gameBests: readOwnerGameBests(ownerId),
  };
}
