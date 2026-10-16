/** A decorative caret crosses the overlay boundary without moving or delaying input. */
export function beginCaretHandoff(
  source: DOMRect,
  cancellation: AbortController,
) {
  if (
    cancellation.signal.aborted ||
    ![source.left, source.top, source.width, source.height].every(
      Number.isFinite,
    ) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    cancellation.abort();
    return null;
  }
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) {
    cancellation.abort();
    return null;
  }
  const caret = document.createElement("i");
  caret.className = "awakening-handoff";
  caret.setAttribute("aria-hidden", "true");
  Object.assign(caret.style, {
    left: `${source.left}px`,
    top: `${source.top}px`,
    width: `${source.width}px`,
    height: `${source.height}px`,
  });
  document.body.append(caret);
  let disposed = false;
  let completing = false;
  let frame = 0;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let animation: Animation | undefined;
  let mutations: MutationObserver | undefined;
  let sizes: ResizeObserver | undefined;
  let observed: HTMLElement | null = null;
  let target: HTMLElement | null = null;
  let previousVisibility = "";
  const stopWaiting = () => {
    mutations?.disconnect();
    sizes?.disconnect();
    clearTimeout(deadline);
    cancelAnimationFrame(frame);
    frame = 0;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancellation.abort();
    stopWaiting();
    animation?.cancel();
    caret.remove();
    if (target) target.style.visibility = previousVisibility;
    window.removeEventListener("keydown", dispose, true);
    window.removeEventListener("pointerdown", dispose, true);
    window.removeEventListener("resize", dispose);
    window.removeEventListener("scroll", dispose, true);
    motion.removeEventListener("change", dispose);
  };
  window.addEventListener("keydown", dispose, true);
  window.addEventListener("pointerdown", dispose, true);
  window.addEventListener("resize", dispose);
  window.addEventListener("scroll", dispose, true);
  motion.addEventListener("change", dispose);
  cancellation.signal.addEventListener("abort", dispose, { once: true });
  const checkTarget = () => {
    if (disposed || animation) return;
    if (motion.matches) {
      dispose();
      return;
    }
    const candidate = document.querySelector<HTMLElement>(
      ".typing-viewport > .forge-caret",
    );
    if (!candidate?.isConnected) return;
    if (candidate !== observed) {
      observed = candidate;
      sizes?.disconnect();
      sizes?.observe(candidate);
    }
    const destination = candidate.getBoundingClientRect();
    if (
      ![
        destination.left,
        destination.top,
        destination.width,
        destination.height,
      ].every(Number.isFinite) ||
      destination.width <= 0 ||
      destination.height <= 0 ||
      !candidate.getClientRects().length ||
      getComputedStyle(candidate).visibility === "hidden"
    )
      return;
    stopWaiting();
    target = candidate;
    previousVisibility = target.style.visibility;
    try {
      animation = caret.animate(
        [
          { transform: "translate(0, 0) scale(1, 1)" },
          {
            transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})`,
          },
        ],
        {
          duration: 360,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards",
        },
      );
      target.style.visibility = "hidden";
      // Native animation completion normally owns cleanup. Bound a stalled or
      // suspended animation too, without shortening its 360ms choreography.
      deadline = setTimeout(dispose, 460);
      void animation.finished.then(dispose, dispose);
    } catch {
      dispose();
    }
  };
  const queueTargetCheck = () => {
    if (disposed || animation || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      checkTarget();
    });
  };
  return {
    dispose,
    complete() {
      if (disposed || completing) return;
      completing = true;
      deadline = setTimeout(dispose, 500);
      try {
        mutations = new MutationObserver(queueTargetCheck);
        mutations.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style", "hidden", "inert"],
        });
        if (typeof ResizeObserver === "function")
          sizes = new ResizeObserver(queueTargetCheck);
      } catch {
        dispose();
        return;
      }
      // The independent workspace may still be suspended on a real module load.
      // Its measured caret, rather than an arbitrary number of paints, is readiness.
      queueTargetCheck();
    },
  };
}
