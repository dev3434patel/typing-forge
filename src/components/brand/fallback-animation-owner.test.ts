import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFallbackAnimationOwner } from "./fallback-animation-owner";

class FakeCSSAnimation {
  currentTime: number | null = 500;
  playbackRate = 1;
  playState: AnimationPlayState = "running";
  timeline: { currentTime: number | null } = { currentTime: 1000 };
  effect = { target: {}, getComputedTiming: vi.fn(() => ({ endTime: 4200 })) };
  pause = vi.fn(() => { this.playState = "paused"; });
  play = vi.fn(() => { this.playState = "running"; });
  finish = vi.fn(() => { this.playState = "finished"; });
}

function environment(animations = [new FakeCSSAnimation()]) {
  const targets = new Set(animations.map((animation) => animation.effect.target));
  const root = {
    isConnected: true,
    contains: (target: unknown) => targets.has(target as object),
    getAnimations: vi.fn(() => animations),
  };
  return { root, animations, owner: createFallbackAnimationOwner(root as unknown as HTMLElement) };
}

beforeEach(() => vi.stubGlobal("CSSAnimation", FakeCSSAnimation));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("invisible fallback animation ownership", () => {
  it("pauses only connected running CSS animations targeted inside the fallback", () => {
    const running = new FakeCSSAnimation(), finished = new FakeCSSAnimation(), paused = new FakeCSSAnimation();
    finished.playState = "finished";
    paused.playState = "paused";
    const env = environment([running, finished, paused]);
    const unrelated = { ...new FakeCSSAnimation() };
    env.root.getAnimations.mockReturnValue([running, finished, paused, unrelated as FakeCSSAnimation]);
    env.owner.setHidden(true);
    expect(env.root.getAnimations).toHaveBeenCalledWith({ subtree: true });
    expect(running.pause).toHaveBeenCalledOnce();
    expect(finished.pause).not.toHaveBeenCalled();
    expect(paused.pause).not.toHaveBeenCalled();
    expect(unrelated.pause).not.toHaveBeenCalled();
    expect(running.currentTime).toBe(500);
  });

  it("catches up delayed CSS phases at the captured playback rate and tolerates rapid flips", () => {
    const env = environment(), animation = env.animations[0];
    animation.playbackRate = 2;
    env.owner.setHidden(true);
    env.owner.setHidden(true);
    animation.timeline.currentTime = 1600;
    env.owner.setHidden(false);
    expect(animation.currentTime).toBe(1700);
    expect(animation.playState).toBe("running");
    expect(animation.pause).toHaveBeenCalledOnce();
    env.owner.setHidden(true);
    animation.timeline.currentTime = 1800;
    env.owner.setHidden(false);
    env.owner.setHidden(false);
    expect(animation.currentTime).toBe(2100);
    expect(animation.pause).toHaveBeenCalledTimes(2);
    expect(animation.play).toHaveBeenCalledTimes(2);
  });

  it("finishes elapsed forward and reverse phases instead of restarting their choreography", () => {
    const forward = new FakeCSSAnimation(), reverse = new FakeCSSAnimation();
    reverse.playbackRate = -1;
    const env = environment([forward, reverse]);
    env.owner.setHidden(true);
    forward.timeline.currentTime = 6000;
    reverse.timeline.currentTime = 1600;
    env.owner.setHidden(false);
    expect(forward.currentTime).toBe(4200);
    expect(reverse.currentTime).toBe(0);
    for (const animation of [forward, reverse]) {
      expect(animation.finish).toHaveBeenCalledOnce();
      expect(animation.play).not.toHaveBeenCalled();
      expect(animation.playState).toBe("finished");
    }
  });

  it("does not take over animations cancelled, retimed, replaced or disconnected elsewhere", () => {
    for (const change of ["cancel", "rate", "time", "effect", "timeline", "disconnect"] as const) {
      const env = environment(), animation = env.animations[0];
      env.owner.setHidden(true);
      if (change === "cancel") animation.playState = "idle";
      if (change === "rate") animation.playbackRate = 0.5;
      if (change === "time") animation.currentTime = 700;
      if (change === "effect") animation.effect = { ...animation.effect, target: {} };
      if (change === "timeline") animation.timeline = { currentTime: 2000 };
      if (change === "disconnect") env.root.isConnected = false;
      env.owner.setHidden(false);
      expect(animation.play, change).not.toHaveBeenCalled();
      expect(animation.finish, change).not.toHaveBeenCalled();
    }
  });

  it("leaves unsupported APIs and unresolved initial times in the browser's ownership", () => {
    const env = environment(), animation = env.animations[0];
    animation.currentTime = null;
    expect(() => env.owner.setHidden(true)).not.toThrow();
    expect(animation.pause).not.toHaveBeenCalled();
    const noTimeline = environment();
    noTimeline.animations[0].timeline.currentTime = null;
    noTimeline.owner.setHidden(true);
    expect(noTimeline.animations[0].pause).not.toHaveBeenCalled();
    const broken = environment();
    broken.root.getAnimations.mockImplementation(() => { throw new Error("Unavailable"); });
    expect(() => broken.owner.setHidden(true)).not.toThrow();
    vi.stubGlobal("CSSAnimation", undefined);
    const missing = environment();
    expect(() => missing.owner.setHidden(true)).not.toThrow();
    expect(missing.animations[0].pause).not.toHaveBeenCalled();
  });

  it("uses the monotonic fallback if a previously available timeline clock becomes unresolved", () => {
    const clock = vi.spyOn(performance, "now").mockReturnValue(100);
    const env = environment(), animation = env.animations[0];
    env.owner.setHidden(true);
    clock.mockReturnValue(700);
    animation.timeline.currentTime = null;
    env.owner.setHidden(false);
    expect(animation.currentTime).toBe(1100);
    expect(animation.play).toHaveBeenCalledOnce();
  });

  it("recovers from a partial finish API without leaving the visible fallback paused", () => {
    const env = environment(), animation = env.animations[0];
    animation.finish.mockImplementation(() => { throw new Error("Disabled finish"); });
    env.owner.setHidden(true);
    animation.timeline.currentTime = 6000;
    expect(() => env.owner.setHidden(false)).not.toThrow();
    expect(animation.play).toHaveBeenCalledOnce();
    expect(animation.currentTime).toBe(4200);
  });

  it("restores connected cleanup exactly once and releases removed animation references", () => {
    const env = environment(), animation = env.animations[0];
    env.owner.setHidden(true);
    animation.timeline.currentTime = 1250;
    env.owner.dispose();
    env.owner.dispose();
    env.owner.setHidden(true);
    expect(animation.currentTime).toBe(750);
    expect(animation.play).toHaveBeenCalledOnce();
    const removed = environment();
    removed.owner.setHidden(true);
    removed.root.isConnected = false;
    removed.owner.dispose();
    removed.root.isConnected = true;
    removed.owner.setHidden(false);
    expect(removed.animations[0].play).not.toHaveBeenCalled();
  });
});
