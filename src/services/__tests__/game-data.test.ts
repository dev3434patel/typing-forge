import { describe, expect, it } from "vitest";
import { SIGNAL_RUN_VERSION } from "@/lib/typing-game";
import { typingGameStorageKey } from "@/lib/typing-game-records";
import { readOwnerGameBests, workspaceExportData } from "../game-data";
import { SessionRepository, type SessionRecord } from "../session-repository";

const best = (gates: number) => ({
  version: SIGNAL_RUN_VERSION,
  mode: "paced",
  gates,
  cleanGates: gates,
  accuracy: 100,
  elapsedMs: 60_000,
  paused: false,
});
const row = (ownerId: string) =>
  ({ ownerId, clientSessionId: `${ownerId}-session` }) as SessionRecord;

describe("explicitly owned game data controls", () => {
  it("exports the selected owner's best even when that workspace has no typing sessions", () => {
    localStorage.setItem(
      typingGameStorageKey("alice"),
      JSON.stringify({ paced: best(8) }),
    );
    localStorage.setItem(
      typingGameStorageKey("guest"),
      JSON.stringify({ paced: best(17) }),
    );
    localStorage.setItem(
      typingGameStorageKey("bob"),
      JSON.stringify({ paced: best(18) }),
    );
    expect(workspaceExportData("alice", [])).toEqual({
      ownerId: "alice",
      sessions: [],
      gameBests: { paced: best(8) },
    });
    expect(
      workspaceExportData("alice", [row("alice"), row("guest"), row("bob")])
        .sessions,
    ).toEqual([row("alice")]);
  });

  it("whitelists summary fields and never exports raw game text or invalid records", () => {
    localStorage.setItem(
      typingGameStorageKey("guest"),
      JSON.stringify({
        paced: { ...best(5), draft: "not exported", seed: 123 },
        calm: { ...best(18), mode: "calm", accuracy: 101 },
      }),
    );
    expect(readOwnerGameBests("guest")).toEqual({ paced: best(5) });
    expect(JSON.stringify(workspaceExportData("guest", []))).not.toContain(
      "not exported",
    );
  });

  it("requires an explicit owner and never falls back to the guest key", () => {
    localStorage.setItem(
      typingGameStorageKey("guest"),
      JSON.stringify({ paced: best(18) }),
    );
    for (const owner of ["", " ", undefined, null])
      expect(() => workspaceExportData(owner as string, [])).toThrow(
        "Choose a workspace",
      );
    expect(workspaceExportData("empty-account", []).gameBests).toEqual({});
  });

  it("keeps exports usable when game storage is inaccessible", () => {
    expect(
      readOwnerGameBests("alice", {
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual({});
  });

  it.each(["alice", "guest"])(
    'clearing "%s" removes only its game best and preserves other owners',
    async (owner) => {
      for (const id of ["alice", "bob", "guest"])
        localStorage.setItem(
          typingGameStorageKey(id),
          JSON.stringify({ paced: best(id === "bob" ? 18 : 8) }),
        );
      const other = ["alice", "bob", "guest"].filter((id) => id !== owner);
      const before = other.map((id) =>
        localStorage.getItem(typingGameStorageKey(id)),
      );
      const repository = new SessionRepository();
      const events: string[] = [];
      repository.subscribe((event) =>
        events.push(`${event.type}:${event.ownerId}`),
      );
      await repository.clear(owner);
      expect(localStorage.getItem(typingGameStorageKey(owner))).toBeNull();
      expect(
        other.map((id) => localStorage.getItem(typingGameStorageKey(id))),
      ).toEqual(before);
      expect(events).toEqual([`clear:${owner}`]);
    },
  );
});
