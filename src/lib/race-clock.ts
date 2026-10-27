/** A server countdown becomes one fixed wall/monotonic anchor for this run.
 * serverOffsetMs is calibrated when a response arrives, rather than treating an
 * unchanged SSE snapshot's server_now as the time at which the run mounts.
 */
export function raceClockAnchor(
  monotonicNow: number,
  clientWallNow: number,
  serverOffsetMs: number,
  startedAtWall: number,
) {
  if (![monotonicNow, clientWallNow, serverOffsetMs, startedAtWall].every(Number.isFinite)) {
    throw new Error("Race clock requires finite synchronized timestamps");
  }
  const startMono = monotonicNow - Math.max(0, clientWallNow + serverOffsetMs - startedAtWall);
  return {
    startMono,
    startWall: startedAtWall,
    // Later device wall-clock changes cannot alter this run's elapsed duration.
    wallAt: (monotonicTime: number) => startedAtWall + monotonicTime - startMono,
  };
}
