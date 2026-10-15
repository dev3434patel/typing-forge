import type { SessionRecord } from "./session-repository";

export interface SessionHistoryState {
  ownerId: string;
  records: SessionRecord[];
  loading: boolean;
  error: string | null;
}

/** A render can precede effect cleanup on an account switch. Never expose the
 * previous owner's rows, exports, error text or completed-loading state then. */
export function historyForOwner(
  state: SessionHistoryState,
  ownerId: string,
): SessionHistoryState {
  return state.ownerId === ownerId
    ? state
    : { ownerId, records: [], loading: true, error: null };
}
