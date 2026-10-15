import { describe, expect, it } from "vitest";
import { SessionController, type SessionResult } from "../typing-core";
import {
  inspectSessionEvidence,
  metricLedger,
  replayAtActiveTime,
} from "../session-diagnostics";
function correctedCat() {
  let now = 0;
  const c = new SessionController(
    { clientSessionId: "proof-cat", mode: "custom", initialTarget: "cat" },
    { now: () => now, wallNow: () => 1_700_000_000_000 + now },
  );
  c.input({ type: "insert", text: "c" });
  now = 100;
  c.input({ type: "insert", text: "x" });
  now = 200;
  c.input({ type: "delete" });
  now = 300;
  c.input({ type: "insert", text: "a" });
  now = 400;
  c.input({ type: "insert", text: "t" });
  return c.result!;
}
const clone = (r: SessionResult): SessionResult =>
  JSON.parse(JSON.stringify(r));
describe("transparent result evidence", () => {
  it("explains corrected accuracy and traces the canonical credit", () => {
    const r = correctedCat(),
      proof = inspectSessionEvidence(r);
    expect(proof.status).toBe("matches");
    expect(proof.differences).toEqual([]);
    expect(proof.words.reduce((sum, word) => sum + word.creditedUnits, 0)).toBe(
      r.metrics.creditedUnits,
    );
    expect(proof.words[0]).toMatchObject({
      targetWord: "cat",
      typedWord: "cat",
      wordCredit: 3,
      separatorCredit: 0,
    });
    expect(r.metrics.inputAccuracy).toBe(75);
    expect(r.metrics.finalTextAccuracy).toBe(100);
    expect(metricLedger(r)).toMatchObject({
      finalDenominator: 3,
      retainedDenominator: 3,
      isTargeted: true,
    });
  });
  it("retains historical mistakes while scrubbing later corrected text", () => {
    const r = correctedCat();
    expect(replayAtActiveTime(r, 150).finalText).toBe("cx");
    expect(replayAtActiveTime(r, 150).metrics.inputAccuracy).toBe(50);
    expect(replayAtActiveTime(r, 250).finalText).toBe("c");
    expect(replayAtActiveTime(r, Infinity).finalText).toBe("c");
    expect(replayAtActiveTime(r, -100).finalText).toBe("c");
    expect(replayAtActiveTime(r, 99999).finalText).toBe("cat");
    expect(r.finalText).toBe("cat");
  });
  it.each([
    "wpm",
    "inputAccuracy",
    "insertionAttempts",
    "creditedUnits",
    "consistency",
  ] as const)("never calls a changed %s reproducible", (key) => {
    const r = clone(correctedCat());
    r.metrics[key] = 99;
    expect(inspectSessionEvidence(r)).toMatchObject({
      status: "mismatch",
      differences: expect.arrayContaining([
        `Metric ${key} differs from the saved value.`,
      ]),
    });
  });
  it.each([
    "finalText",
    "finalTranscript",
    "clientSessionId",
    "initialTarget",
  ] as const)("detects changed %s metadata", (key) => {
    const r = clone(correctedCat());
    r[key] = "changed";
    expect(inspectSessionEvidence(r).status).toBe("mismatch");
  });
  it("detects changed character accounting and graph", () => {
    const r = clone(correctedCat());
    r.characters[0].status = "incorrect";
    r.timeSeries[0].rawWpm = 10000;
    expect(inspectSessionEvidence(r).differences).toEqual(
      expect.arrayContaining([
        "The final character accounting differs from replay.",
        "The recorded timeline differs from replay.",
      ]),
    );
  });
  it("reports malformed event evidence as unavailable without throwing through the UI", () => {
    const r = clone(correctedCat());
    r.events[1].end = 1000;
    expect(inspectSessionEvidence(r).status).toBe("unavailable");
  });
  it("preserves null free-writing metrics and omits invented word credits", () => {
    let now = 0;
    const c = new SessionController(
      {
        clientSessionId: "free-proof",
        mode: "zen",
        scoringPolicy: "free",
        initialTarget: "",
      },
      { now: () => now, wallNow: () => now },
    );
    c.input({ type: "insert", text: "hello" });
    now = 1000;
    const r = c.finish();
    expect(inspectSessionEvidence(r)).toMatchObject({
      status: "matches",
      words: [],
    });
    expect(metricLedger(r)).toMatchObject({
      isTargeted: false,
      finalDenominator: 0,
    });
    expect(r.metrics.inputAccuracy).toBeNull();
  });
  it("handles empty zero-duration evidence without fabricated numbers", () => {
    const c = new SessionController(
      { clientSessionId: "empty-proof", mode: "custom", initialTarget: "cat" },
      { now: () => 0, wallNow: () => 0 },
    );
    const r = c.finish();
    expect(inspectSessionEvidence(r).status).toBe("matches");
    expect(metricLedger(r).displayMinutes).toBe("0");
    expect(r.metrics.wpm).toBeNull();
  });
});
