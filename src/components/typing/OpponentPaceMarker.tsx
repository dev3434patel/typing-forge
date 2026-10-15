import { useEffect, useState, type RefObject } from "react";

interface Props {
  position: number;
  viewportRef: RefObject<HTMLDivElement>;
  passageRef: RefObject<HTMLDivElement>;
  revision: string;
  ownCursor: number;
  fontSize: number;
  smooth: boolean;
}

/** Follows observed opponent progress without moving the user's viewport or input. */
export function OpponentPaceMarker({
  position,
  viewportRef,
  passageRef,
  revision,
  ownCursor,
  fontSize,
  smooth,
}: Props) {
  const [point, setPoint] = useState<{
    x: number;
    y: number;
    height: number;
    visible: boolean;
  } | null>(null);
  // Parent host refs are attached after child layout effects on a fresh mount.
  // The passive effect can measure both refs before the bot's first timer tick.
  useEffect(() => {
    const viewport = viewportRef.current;
    const passage = passageRef.current;
    if (!viewport || !passage) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const slot =
        passage.querySelector<HTMLElement>(
          `[data-slot-index="${position}"][data-expected]`,
        ) ?? passage.querySelector<HTMLElement>("[data-opponent-end-anchor]");
      if (!slot) {
        setPoint(null);
        return;
      }
      const rect = slot.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      const rtl = getComputedStyle(viewport).direction === "rtl";
      const next = {
        x: (rtl ? rect.right : rect.left) - bounds.left + viewport.scrollLeft,
        y: rect.top - bounds.top + viewport.scrollTop,
        height: Math.max(fontSize, rect.height),
        visible: rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1,
      };
      setPoint((previous) =>
        previous?.x === next.x &&
        previous.y === next.y &&
        previous.height === next.height &&
        previous.visible === next.visible
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(passage);
    viewport.addEventListener("scroll", measure, { passive: true });
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
      viewport.removeEventListener("scroll", measure);
    };
  }, [position, revision, ownCursor, fontSize, viewportRef, passageRef]);
  if (!point) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="opponent-caret"
      data-position={position}
      data-in-view={point.visible}
      className="opponent-caret"
      style={{
        height: point.height,
        transform: `translate3d(${point.x}px, ${point.y}px, 0)`,
        transition: smooth ? "transform 100ms linear" : "none",
      }}
    />
  );
}
