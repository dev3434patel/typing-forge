import { describe, expect, it } from "vitest";
import { raceClockAnchor } from "../race-clock";
import { SessionController } from "../typing-core";

describe("server race clock", () => {
  const start = 1_792_600_000_000;
  it("uses the calibrated offset after an unchanged countdown SSE snapshot ages", () => {
    const snapshot = { server_now: start - 3_000, started_at: start, version: 4 };
    const receiptWall = snapshot.server_now - 800;
    const offset = snapshot.server_now - receiptWall;
    const clock = raceClockAnchor(12_000, receiptWall + 3_150, offset, snapshot.started_at);
    expect(clock.startMono).toBe(11_850);
    expect(clock.wallAt(12_000)).toBe(start + 150);
    expect(clock.wallAt(13_000) - start).toBe(13_000 - clock.startMono);
    // The old snapshot-as-current-time construction lagged the wall by 3s.
    const staleOffset = snapshot.server_now - (receiptWall + 3_150);
    expect(receiptWall + 4_150 + staleOffset - start).toBe(-2_000);
  });
  it("preserves idle time when mounting an already active room", () => {
    const clock = raceClockAnchor(7_000, start + 4_500, -500, start);
    expect(clock.startMono).toBe(3_000);
    expect(clock.wallAt(7_000)).toBe(start + 4_000);
  });
  it("anchors canonical checkpoints and finish to the same elapsed clock", () => {
    let mono = 12_000;
    const clock = raceClockAnchor(mono, start - 650, 800, start);
    const controller = new SessionController({
      clientSessionId: "stale-sse-clock", mode: "race", initialTarget: "cat dog fox", durationMs: 15_000,
      correctionPolicy: "current-word",
    }, { now: () => mono, wallNow: () => clock.wallAt(mono) });
    controller.startAt(clock.startMono, clock.startWall);
    mono += 1_000;
    controller.input({ type: "insert", text: "cat " });
    const checkpoint = controller.checkpoint();
    expect(checkpoint.finishedAtWall - checkpoint.startedAtWall!).toBe(checkpoint.wallDurationMs);
    expect(checkpoint.wallDurationMs).toBe(1_150);
    mono += 14_000;
    const result = controller.tick();
    expect(result.metrics.elapsedMs).toBe(15_000);
    expect(controller.result!.finishedAtWall - controller.result!.startedAtWall!).toBe(controller.result!.wallDurationMs);
  });
  it("does not start before the authoritative start and rejects invalid calibration", () => {
    const clock = raceClockAnchor(1_000, start - 5, 0, start);
    expect(clock.startMono).toBe(1_000);
    expect(clock.wallAt(1_000)).toBe(start);
    expect(() => raceClockAnchor(0, start, NaN, start)).toThrow(/finite/);
  });
});
