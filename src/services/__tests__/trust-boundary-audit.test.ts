import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionController } from "@/lib/typing-core/session";
import type { SessionResult } from "@/lib/typing-core/types";
import { validateCandidate } from "../../../supabase/functions/_shared/validation";
import { boundedBody } from "../../../supabase/functions/_shared/http";
import {
  SessionRepository,
  sessionRepository,
  type SessionRecord,
} from "../session-repository";
import { SessionSync } from "../session-sync";
import { deleteAccount, deleteSession } from "../account-data";
import { historyForOwner, type SessionHistoryState } from "../history-state";

const cloud = vi.hoisted(() => ({
  getSession: vi.fn(),
  invoke: vi.fn(),
  rpc: vi.fn(),
  signOut: vi.fn(),
  setHeader: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: { getSession: cloud.getSession, signOut: cloud.signOut },
    functions: { invoke: cloud.invoke },
    rpc: cloud.rpc,
  },
}));
vi.mock("@/lib/keybr-engine", () => ({ reconcileLearningSessions: vi.fn() }));

function candidate(): SessionResult {
  let now = 0;
  const controller = new SessionController(
    {
      clientSessionId: "trust-audit",
      ownerScope: "alice",
      mode: "quote",
      initialTarget: "the cat",
    },
    { now: () => now, wallNow: () => 1_000_000 + now },
  );
  for (const char of ["t", "h", "x"]) {
    controller.input({ type: "insert", text: char });
    now += 100;
  }
  controller.input({ type: "delete" });
  now += 100;
  for (const char of ["e", " ", "c", "a", "t"]) {
    controller.input({ type: "insert", text: char });
    now += 100;
  }
  return structuredClone(controller.result!);
}
function queued(ownerId = "alice"): SessionRecord {
  const value = candidate();
  return {
    schemaVersion: 3,
    ownerId,
    clientSessionId: value.clientSessionId,
    payloadVersion: "forge-v3",
    payloadHash: "audit-evidence",
    candidate: value,
    privateContent: false,
    cloudConsent: false,
    provenance: "observed",
    state: "queued",
    attempts: 0,
    nextAttemptAt: 0,
    createdAt: 1,
    evidenceExpiresAt: 10_000,
    summary: {
      id: value.clientSessionId,
      wpm: 105,
      rawWpm: 105,
      accuracy: 87.5,
      consistency: 0,
      mode: "quote",
      duration: 0.8,
      correctChars: 7,
      incorrectChars: 0,
      totalChars: 7,
      errors: 1,
      date: "2026-10-15T00:00:00Z",
      wpmHistory: [],
    },
  };
}
const identity = (owner = "alice") => ({
  data: { session: { user: { id: owner }, access_token: `token-${owner}` } },
  error: null,
});

beforeEach(() => {
  cloud.getSession.mockReset().mockResolvedValue(identity());
  cloud.invoke
    .mockReset()
    .mockResolvedValue({ data: { deleted: true }, error: null });
  cloud.signOut.mockReset().mockResolvedValue({ error: null });
  cloud.setHeader.mockReset().mockResolvedValue({ data: null, error: null });
  cloud.rpc
    .mockReset()
    .mockImplementation(() => ({ setHeader: cloud.setHeader }));
});
afterEach(() => vi.restoreAllMocks());

describe("independent evidence attack vectors", () => {
  it("preserves a corrected error in server input accuracy while final text is perfect", () => {
    const replay = validateCandidate(candidate(), "alice").replay;
    expect(replay.metrics.insertionAttempts).toBe(8);
    expect(replay.metrics.inputAccuracy).toBe(87.5);
    expect(replay.metrics.finalTextAccuracy).toBe(100);
    expect(replay.metrics.deletedUnits).toBe(1);
  });
  it.each([
    [
      "missing event",
      (value: SessionResult) => {
        value.events.splice(2, 1);
      },
    ],
    [
      "impossible range",
      (value: SessionResult) => {
        value.events[1].end = 999;
      },
    ],
    [
      "negative time",
      (value: SessionResult) => {
        value.events[0].offsetMs = -1;
      },
    ],
    [
      "unknown provenance",
      (value: SessionResult) => {
        Object.assign(value.events[0], { provenance: "trusted-human" });
      },
    ],
    [
      "changed corpus cohort",
      (value: SessionResult) => {
        value.configuration.contentRevision = "different-corpus";
      },
    ],
    [
      "cross-account config",
      (value: SessionResult) => {
        value.configuration.ownerScope = "bob";
      },
    ],
    [
      "oversized input",
      (value: SessionResult) => {
        value.events[0].text = "x".repeat(4097);
      },
    ],
  ])(
    "rejects %s instead of accepting the submitted summary",
    (_name, mutate) => {
      const value = candidate();
      mutate(value);
      expect(() => validateCandidate(value, "alice")).toThrow();
    },
  );
  it("enforces the streamed byte limit independently of Content-Length", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"x":"'));
        controller.enqueue(new TextEncoder().encode('too large"}'));
        controller.close();
      },
    });
    const request = new Request("https://fixture.invalid", {
      method: "POST",
      body,
      duplex: "half",
    } as RequestInit);
    await expect(boundedBody(request, 10)).rejects.toThrow("Payload exceeds");
  });
});

describe("late acknowledgements and explicit workspace ownership", () => {
  it("hides old account records and errors during the render before the next owner's history loads", () => {
    const previous: SessionHistoryState = {
      ownerId: "alice",
      records: [queued()],
      loading: false,
      error: "Private alice history failed to sync",
    };
    expect(historyForOwner(previous, "bob")).toEqual({
      ownerId: "bob",
      records: [],
      loading: true,
      error: null,
    });
    // Switching does not discard durable or pending records from the source owner.
    expect(historyForOwner(previous, "alice")).toBe(previous);
    expect(previous.records).toHaveLength(1);
  });
  it("also isolates guest exports from a newly signed-in account", () => {
    const guest: SessionHistoryState = {
      ownerId: "guest",
      records: [queued("guest")],
      loading: false,
      error: null,
    };
    expect(historyForOwner(guest, "alice").records).toEqual([]);
    const account: SessionHistoryState = {
      ownerId: "alice",
      records: [queued()],
      loading: false,
      error: null,
    };
    expect(historyForOwner(account, "guest").records).toEqual([]);
  });
  it("does not resurrect a session deleted while its upload is in flight", async () => {
    const repository = new SessionRepository();
    await repository.save(queued());
    let acknowledge!: (value: { accepted: object }) => void;
    let started!: () => void;
    const startedPromise = new Promise<void>((resolve) => {
      started = resolve;
    });
    const dispatcher = new SessionSync({
      repository,
      currentOwner: () => "alice",
      now: () => 100,
      upload: () => {
        started();
        return new Promise((resolve) => {
          acknowledge = resolve;
        });
      },
    });
    const pending = dispatcher.flush("alice");
    await startedPromise;
    await repository.remove("alice", "trust-audit");
    acknowledge({ accepted: {} });
    await pending;
    expect(await repository.get("alice", "trust-audit")).toBeNull();
    expect(await repository.isDeleted("alice", "trust-audit")).toBe(true);
  });
  it("retains summaries but never uploads expired private replay", async () => {
    const repository = new SessionRepository();
    await repository.save({
      ...queued(),
      privateContent: true,
      cloudConsent: true,
      evidenceExpiresAt: 99,
    });
    const upload = vi.fn();
    await new SessionSync({
      repository,
      currentOwner: () => "alice",
      now: () => 100,
      upload,
    }).flush("alice", true);
    expect(upload).not.toHaveBeenCalled();
    const value = await repository.get("alice", "trust-audit");
    expect(value?.candidate).toBeUndefined();
    expect(value?.summary.accuracy).toBe(87.5);
  });
  it("does not start account deletion with another account currently authenticated", async () => {
    cloud.getSession.mockResolvedValue(identity("bob"));
    const clear = vi.spyOn(sessionRepository, "clear").mockResolvedValue();
    await expect(deleteAccount("alice")).rejects.toThrow("account");
    expect(cloud.invoke).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
  it("binds the account deletion request to the intended owner and captured bearer", async () => {
    vi.spyOn(sessionRepository, "clear").mockResolvedValue();
    await deleteAccount("alice");
    expect(cloud.invoke).toHaveBeenCalledWith("delete-account", {
      body: { confirmation: "DELETE MY ACCOUNT", expectedOwner: "alice" },
      headers: { Authorization: "Bearer token-alice" },
    });
  });
  it("does not clear or sign out a new workspace after an old deletion acknowledgement", async () => {
    cloud.getSession
      .mockResolvedValueOnce(identity())
      .mockResolvedValue(identity("bob"));
    const clear = vi.spyOn(sessionRepository, "clear").mockResolvedValue();
    await expect(deleteAccount("alice")).rejects.toThrow("Account changed");
    expect(clear).not.toHaveBeenCalled();
    expect(cloud.signOut).not.toHaveBeenCalled();
  });
  it("binds a session deletion RPC to both expected owner and captured bearer", async () => {
    vi.spyOn(sessionRepository, "get").mockResolvedValue(queued());
    const remove = vi.spyOn(sessionRepository, "remove").mockResolvedValue();
    await deleteSession("alice", "trust-audit");
    expect(cloud.rpc).toHaveBeenCalledWith("forge_delete_session_for_owner", {
      p_owner: "alice",
      p_client_id: "trust-audit",
    });
    expect(cloud.setHeader).toHaveBeenCalledWith(
      "Authorization",
      "Bearer token-alice",
    );
    expect(remove).toHaveBeenCalledWith("alice", "trust-audit");
  });
  it("does not delete a same-ID session with the next account credentials", async () => {
    cloud.getSession.mockResolvedValue(identity("bob"));
    vi.spyOn(sessionRepository, "get").mockResolvedValue(queued());
    const remove = vi.spyOn(sessionRepository, "remove").mockResolvedValue();
    await expect(deleteSession("alice", "trust-audit")).rejects.toThrow(
      "account",
    );
    expect(cloud.rpc).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
