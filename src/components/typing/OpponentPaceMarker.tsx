import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { canReuseOpponentPoint, type OpponentLayoutRevision } from "./opponent-caret-layout";

interface Props {
  position: number;
  viewportRef: RefObject<HTMLDivElement>;
  passageRef: RefObject<HTMLDivElement>;
  revision: string;
  ownCursor: number;
  targetText: string;
  scoringPolicy: string;
  rtl: boolean;
  composing: boolean;
  sessionKey: string;
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
  targetText,
  scoringPolicy,
  rtl,
  composing,
  sessionKey,
  fontSize,
  smooth,
}: Props) {
  const [point, setPoint] = useState<{
    x: number;
    y: number;
    height: number;
    visible: boolean;
  } | null>(null);
  const latest = useRef({ position, fontSize });
  latest.current = { position, fontSize };
  const previousLayout = useRef<OpponentLayoutRevision>();
  const hasMeasuredPoint = useRef(false);
  const measurePoint = useCallback(() => {
    const viewport = viewportRef.current;
    const passage = passageRef.current;
    if (!viewport || !passage) {
      hasMeasuredPoint.current = false;
      return;
    }
    const { position: currentPosition, fontSize: currentFontSize } =
      latest.current;
    const slot =
      passage.querySelector<HTMLElement>(
        `[data-slot-index="${currentPosition}"][data-expected]`,
      ) ?? passage.querySelector<HTMLElement>("[data-opponent-end-anchor]");
    if (!slot) {
      hasMeasuredPoint.current = false;
      setPoint(null);
      return;
    }
    const rect = slot.getBoundingClientRect();
    const bounds = viewport.getBoundingClientRect();
    const rtl = getComputedStyle(viewport).direction === "rtl";
    const next = {
      x: (rtl ? rect.right : rect.left) - bounds.left + viewport.scrollLeft,
      y: rect.top - bounds.top + viewport.scrollTop,
      height: Math.max(currentFontSize, rect.height),
      visible: rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1,
    };
    hasMeasuredPoint.current = rect.height > 0 && bounds.width > 0 && bounds.height > 0 &&
      [next.x, next.y, next.height, rect.bottom, bounds.top, bounds.bottom].every(Number.isFinite);
    setPoint((previous) =>
      previous?.x === next.x &&
      previous.y === next.y &&
      previous.height === next.height &&
      previous.visible === next.visible
        ? previous
        : next,
    );
  }, [viewportRef, passageRef]);
  useLayoutEffect(() => {
    const next = { position, revision, ownCursor, targetText, scoringPolicy, rtl, composing, sessionKey, fontSize };
    const reuse = hasMeasuredPoint.current && canReuseOpponentPoint(previousLayout.current, next);
    previousLayout.current = next;
    if (!reuse) measurePoint();
  }, [measurePoint, position, revision, ownCursor, targetText, scoringPolicy, rtl, composing, sessionKey, fontSize]);
  // Parent host refs are attached after child layout effects on a fresh mount.
  // Keep this initial passive measurement, and subscribe once for those nodes.
  useEffect(() => {
    const viewport = viewportRef.current;
    const passage = passageRef.current;
    if (!viewport || !passage) return;
    let active = true;
    const measure = () => {
      if (active) measurePoint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(passage);
    const styles = new MutationObserver(measure);
    styles.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });
    viewport.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    document.fonts.addEventListener("loadingdone", measure);
    document.fonts.addEventListener("loadingerror", measure);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      observer.disconnect();
      styles.disconnect();
      viewport.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      document.fonts.removeEventListener("loadingdone", measure);
      document.fonts.removeEventListener("loadingerror", measure);
      hasMeasuredPoint.current = false;
    };
  }, [measurePoint, viewportRef, passageRef]);
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
