import { memo, useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { KEYBOARD_KEYS } from "./keyboard-layout";
import { createFallbackAnimationOwner } from "./fallback-animation-owner";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Immutable physical positions are shared by every receipt/phase/letter render.
const keys = KEYBOARD_KEYS.map((key, index) => ({
  id: key.id,
  label: key.label,
  value: key.key,
  style: Object.freeze({
    "--key-index": index,
    "--key-x": key.x,
    "--key-z": key.z,
    "--key-width": key.width,
  }) as CSSProperties,
}));

const FallbackKey = memo(function FallbackKey({
  model,
  pressed,
}: {
  model: (typeof keys)[number];
  pressed: boolean;
}) {
  return (
    <span className="awakening-key" data-press={pressed} style={model.style}>
      {model.label}
    </span>
  );
});

/** The full fallback keeps its choreography; only changed key presses need React work. */
export const KeyboardFallback = memo(function KeyboardFallback({
  pressedKey,
  hidden = false,
}: {
  pressedKey: string | null;
  hidden?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const animations = useRef<ReturnType<typeof createFallbackAnimationOwner>>();
  useBrowserLayoutEffect(() => {
    if (!root.current) return;
    const owner = createFallbackAnimationOwner(root.current);
    animations.current = owner;
    return () => {
      owner.dispose();
      animations.current = undefined;
    };
  }, []);
  useBrowserLayoutEffect(() => {
    animations.current?.setHidden(hidden);
  }, [hidden]);
  return (
    <div ref={root} className="awakening-fallback">
      <div className="awakening-keyboard">
        {keys.map((key) => (
          <FallbackKey
            key={key.id}
            model={key}
            pressed={pressedKey === key.value}
          />
        ))}
      </div>
    </div>
  );
});
