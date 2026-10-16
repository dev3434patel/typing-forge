interface SuspendedAnimation {
  animation: CSSAnimation;
  effect: KeyframeEffect;
  timeline: AnimationTimeline;
  currentTime: number;
  timelineTime: number;
  wallTime: number;
  rate: number;
}

const finiteTime = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Suspend only our invisible CSS fallback, preserving its real timeline on recovery. */
export function createFallbackAnimationOwner(root: HTMLElement) {
  let hidden = false;
  let disposed = false;
  let suspended: SuspendedAnimation[] = [];
  const owned = (animation: CSSAnimation, effect: KeyframeEffect) =>
    root.isConnected && animation.effect === effect &&
    effect.target !== null && root.contains(effect.target);

  const resume = () => {
    const records = suspended;
    suspended = [];
    for (const record of records) {
      const { animation, effect, timeline, currentTime, rate } = record;
      let intendedTime: number | undefined;
      try {
        if (
          !owned(animation, effect) || animation.timeline !== timeline ||
          animation.playState !== "paused" || animation.playbackRate !== rate ||
          !finiteTime(animation.currentTime) ||
          Math.abs(animation.currentTime - currentTime) > 1
        ) continue;
        const elapsed = finiteTime(timeline.currentTime)
          ? Math.max(0, timeline.currentTime - record.timelineTime)
          : Math.max(0, performance.now() - record.wallTime);
        const nextTime = currentTime + elapsed * rate;
        intendedTime = nextTime;
        const end = effect.getComputedTiming().endTime;
        if ((rate > 0 && finiteTime(end) && nextTime >= end) ||
          (rate < 0 && nextTime <= 0)) {
          intendedTime = rate > 0 ? Number(end) : 0;
          animation.currentTime = intendedTime;
          animation.finish();
        } else {
          animation.currentTime = nextTime;
          animation.play();
        }
      } catch {
        // A partial WAAPI implementation must not strand a visible fallback.
        try {
          if (owned(animation, effect) && animation.playState === "paused") {
            animation.play();
            if (finiteTime(intendedTime)) animation.currentTime = intendedTime;
          }
        } catch { /* The browser still owns unsupported/cancelled animations. */ }
      }
    }
  };

  return {
    setHidden(next: boolean) {
      if (disposed || next === hidden) return;
      hidden = next;
      if (!next) {
        resume();
        return;
      }
      if (!root.isConnected || typeof root.getAnimations !== "function" ||
        typeof globalThis.CSSAnimation !== "function") return;
      let animations: Animation[];
      try { animations = root.getAnimations({ subtree: true }); }
      catch { return; }
      for (const animation of animations) {
        let pausedHere = false;
        try {
          if (!(animation instanceof CSSAnimation) || animation.playState !== "running" ||
            !finiteTime(animation.currentTime) || !finiteTime(animation.playbackRate) ||
            animation.playbackRate === 0) continue;
          const effect = animation.effect as KeyframeEffect | null;
          const timeline = animation.timeline;
          if (!effect || !owned(animation, effect) || !timeline ||
            !finiteTime(timeline.currentTime)) continue;
          const record = {
            animation, effect, timeline, currentTime: animation.currentTime,
            timelineTime: timeline.currentTime, wallTime: performance.now(),
            rate: animation.playbackRate,
          };
          animation.pause();
          pausedHere = true;
          // Resolve a pending pause at the captured phase rather than the next frame.
          animation.currentTime = record.currentTime;
          suspended.push(record);
        } catch {
          try { if (pausedHere && animation.playState === "paused") animation.play(); }
          catch { /* Optional animation APIs can be disabled by the host. */ }
        }
      }
    },
    dispose() {
      if (disposed) return;
      // Connected StrictMode cleanup restores only animations this owner paused.
      // Removed fallback nodes are left to the browser's normal CSS cancellation.
      resume();
      disposed = true;
    },
  };
}
